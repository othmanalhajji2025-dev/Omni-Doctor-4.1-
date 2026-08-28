/**
 * Express Routers for Drug Intelligence & YemenMD
 * Phase 7: Pharmacology, Drug Safety Engine & Local YemenMD Registry
 */

import { Router, Request, Response } from 'express';
import { drugKnowledgeRepository } from '../drugs/dataSourceArchitecture.js';
import { drugSafetyEngine } from '../drugs/drugSafetyEngine.js';
import { yemenMdStore } from '../drugs/yemenMdStore.js';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../auth/middleware.js';
import { userDataStore } from '../db/userDataStore.js';

export const drugRouter = Router();
export const yemenMdRouter = Router();

// ==========================================
// DRUG INTELLIGENCE API ENDPOINTS
// ==========================================

/**
 * 1. DRUG SEARCH
 * Search by Brand Name, Generic Name, or Active Ingredient
 * GET /api/drugs/search?q=...&type=all|brand|generic|ingredient
 */
drugRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const type = (req.query.type as 'all' | 'brand' | 'generic' | 'ingredient') || 'all';

    if (!q || q.trim().length === 0) {
      return res.json({
        query: '',
        count: 0,
        results: [],
        metadata: {
          isDemoSeedData: true,
          sourceName: 'Curated Clinical Pharmacopeia (Demo Seed Benchmark)',
          disclaimer: 'Search requires a minimum search term.',
        },
      });
    }

    const { results, metadata } = await drugKnowledgeRepository.searchDrugs(q, type);

    res.json({
      query: q,
      searchType: type,
      count: results.length,
      results,
      metadata,
    });
  } catch (error: any) {
    console.error('Error in /api/drugs/search:', error);
    res.status(500).json({ error: 'Failed to execute drug search', details: error?.message });
  }
});

/**
 * 2. DRUG PROFILE
 * Full pharmacology profile: Generic, Brand, Class, Uses, Warnings, Contraindications, Side Effects, Interactions
 * GET /api/drugs/profile/:id
 */
drugRouter.get('/profile/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { profile, metadata } = await drugKnowledgeRepository.getDrugProfile(id);

    if (!profile) {
      return res.status(404).json({
        error: 'Drug profile not found in active knowledge repository.',
        searchedTerm: id,
        metadata,
      });
    }

    res.json({
      profile,
      metadata,
    });
  } catch (error: any) {
    console.error('Error in /api/drugs/profile:', error);
    res.status(500).json({ error: 'Failed to retrieve drug profile', details: error?.message });
  }
});

/**
 * 3. ALL PROFILES LIST (Quick Reference)
 * GET /api/drugs/all
 */
drugRouter.get('/all', async (req: Request, res: Response) => {
  try {
    const profiles = await drugKnowledgeRepository.getAllProfiles();
    res.json({
      count: profiles.length,
      profiles: profiles.map(p => ({
        id: p.id,
        genericName: p.genericName,
        genericNameAr: p.genericNameAr,
        brandNames: p.brandNames,
        drugClass: p.drugClass,
        drugClassAr: p.drugClassAr,
        hasBoxedWarning: !!p.boxedWarningEn,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch drug list' });
  }
});

/**
 * 4. DRUG SAFETY ENGINE
 * Evaluates:
 * - Current Medications
 * - Allergies
 * - Relevant Medical Conditions
 * - Duplicate Active Ingredients
 * - Potential Interactions
 * POST /api/drugs/safety-check
 */
drugRouter.post('/safety-check', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { currentMedications, newMedication, allergies, conditions, isPregnant, eGFR, importFromProfile } = req.body;

    // Optional: Auto-populate from logged-in user medical record
    if (importFromProfile && req.user) {
      const userMedications = userDataStore.getMedications(req.user, req.user.id);
      const userAllergies = userDataStore.getAllergies(req.user, req.user.id);
      const userConditions = userDataStore.getConditions(req.user, req.user.id);

      if (userMedications && userMedications.length > 0 && (!currentMedications || currentMedications.length === 0)) {
        currentMedications = userMedications.filter(m => m.status === 'ACTIVE').map(m => m.nameEn || m.nameAr);
      }

      if (userAllergies && userAllergies.length > 0 && (!allergies || allergies.length === 0)) {
        allergies = userAllergies.map(a => a.allergenEn || a.allergenAr);
      }

      if (userConditions && userConditions.length > 0 && (!conditions || conditions.length === 0)) {
        conditions = userConditions.map(c => c.nameEn || c.nameAr);
      }
    }

    if (!Array.isArray(currentMedications)) {
      currentMedications = [];
    }

    const evaluation = await drugSafetyEngine.evaluateSafety({
      currentMedications,
      newMedication,
      allergies,
      conditions,
      isPregnant: Boolean(isPregnant),
      eGFR: eGFR ? Number(eGFR) : undefined,
    });

    res.json(evaluation);
  } catch (error: any) {
    console.error('Error in /api/drugs/safety-check:', error);
    res.status(500).json({ error: 'Failed to execute drug safety evaluation', details: error?.message });
  }
});

/**
 * Backward compatibility alias for legacy simple interaction checks
 * POST /api/drugs/check-interactions
 */
drugRouter.post('/check-interactions', async (req: Request, res: Response) => {
  try {
    const { drugs } = req.body;
    if (!Array.isArray(drugs)) {
      return res.status(400).json({ error: 'Array of drug names is required.' });
    }
    const evaluation = await drugSafetyEngine.evaluateSafety({
      currentMedications: drugs,
    });
    res.json({
      checkedCount: drugs.length,
      interactionsCount: evaluation.drugInteractions.length,
      interactions: evaluation.drugInteractions.map(i => ({
        drugA: i.interactingDrugOrClass.split(' + ')[0] || '',
        drugB: i.interactingDrugOrClass.split(' + ')[1] || '',
        severity: i.severity,
        mechanismAr: i.mechanismAr,
        mechanismEn: i.mechanismEn,
        clinicalEffectAr: i.clinicalEffectAr,
        clinicalEffectEn: i.clinicalEffectEn,
        managementAr: i.managementAr,
        managementEn: i.managementEn,
        source: i.source,
      })),
      duplicateActiveIngredients: evaluation.duplicateActiveIngredients,
      overallRiskLevel: evaluation.overallRiskLevel,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check drug interactions' });
  }
});

/**
 * 5. DATA SOURCE ARCHITECTURE & ADAPTER STATUS
 * GET /api/drugs/sources
 */
drugRouter.get('/sources', (req: Request, res: Response) => {
  res.json({
    architecture: 'Pluggable Multi-Tier Drug Data Source Architecture',
    primarySource: 'DEMO_SEED_DATASET',
    isDemoSeedActive: true,
    sources: drugKnowledgeRepository.getAllSourcesInfo(),
    integrationGuide: {
      step1: 'Configure API credentials in environment or server config',
      step2: 'Bind RxNorm or DailyMed adapter endpoints to the interface IDrugDataSource',
      step3: 'Register adapter into DrugKnowledgeRepository without altering core safety engine algorithms',
    },
  });
});

/**
 * 6. AUTOMATED TEST SUITE FOR PHASE 7
 * POST /api/drugs/test-suite
 */
drugRouter.post('/test-suite', async (req: Request, res: Response) => {
  const testResults: { testName: string; passed: boolean; message: string; details?: any }[] = [];

  try {
    // Test 1: Drug Search by Brand Name
    const searchBrand = await drugKnowledgeRepository.searchDrugs('Lipitor', 'brand');
    const t1Passed = searchBrand.results.length > 0 && searchBrand.results[0].genericName === 'Atorvastatin';
    testResults.push({
      testName: 'Drug Search by Brand Name (Lipitor -> Atorvastatin)',
      passed: t1Passed,
      message: t1Passed ? 'Successfully retrieved Atorvastatin via brand search Lipitor' : 'Failed to search by brand name',
    });

    // Test 2: Drug Search by Generic Name
    const searchGeneric = await drugKnowledgeRepository.searchDrugs('Metformin', 'generic');
    const t2Passed = searchGeneric.results.length > 0 && searchGeneric.results[0].genericName === 'Metformin';
    testResults.push({
      testName: 'Drug Search by Generic Name (Metformin)',
      passed: t2Passed,
      message: t2Passed ? 'Successfully retrieved Metformin via generic search' : 'Failed to search by generic name',
    });

    // Test 3: Drug Search by Active Ingredient
    const searchIngredient = await drugKnowledgeRepository.searchDrugs('Ibuprofen', 'ingredient');
    const t3Passed = searchIngredient.results.length > 0 && searchIngredient.results.some(r => r.activeIngredients.some(i => i.toLowerCase().includes('ibuprofen')));
    testResults.push({
      testName: 'Drug Search by Active Ingredient (Ibuprofen)',
      passed: t3Passed,
      message: t3Passed ? 'Successfully retrieved medication by active ingredient' : 'Failed to search by active ingredient',
    });

    // Test 4: Full Drug Profile Verification
    const profileCheck = await drugKnowledgeRepository.getDrugProfile('Atorvastatin');
    const prof = profileCheck.profile;
    const t4Passed = Boolean(
      prof &&
      prof.genericName &&
      prof.brandNames.length > 0 &&
      prof.drugClass &&
      prof.commonUsesEn.length > 0 &&
      prof.warningsEn.length > 0 &&
      prof.contraindicationsEn.length > 0 &&
      prof.commonSideEffectsEn.length > 0 &&
      prof.seriousSideEffectsEn.length > 0 &&
      prof.interactions.length > 0 &&
      prof.metadata.isDemoSeedData === true
    );
    testResults.push({
      testName: 'Complete Drug Profile Fields & Demo Seed Attribution',
      passed: t4Passed,
      message: t4Passed ? 'All mandatory pharmacology fields and demo metadata verified' : 'Missing profile fields in Atorvastatin',
    });

    // Test 5: Drug Safety Engine - Duplicate Active Ingredients Detection
    const duplicateCheck = await drugSafetyEngine.evaluateSafety({
      currentMedications: ['Panadol', 'Tylenol'],
    });
    const t5Passed = duplicateCheck.duplicateActiveIngredients.length > 0 &&
      duplicateCheck.hasCriticalStop === true;
    testResults.push({
      testName: 'Safety Engine: Duplicate Active Ingredients (Panadol + Tylenol -> Acetaminophen overdose alert)',
      passed: t5Passed,
      message: t5Passed
        ? `Correctly flagged duplicate ingredient: ${duplicateCheck.duplicateActiveIngredients[0]?.activeIngredient}`
        : 'Failed to detect duplicate active ingredient',
      details: duplicateCheck.duplicateActiveIngredients,
    });

    // Test 6: Drug Safety Engine - Allergy Verification
    const allergyCheck = await drugSafetyEngine.evaluateSafety({
      currentMedications: ['Augmentin'],
      allergies: ['Penicillin and Beta-lactams'],
    });
    const t6Passed = allergyCheck.allergyAlerts.length > 0 &&
      allergyCheck.allergyAlerts[0].severity === 'CONTRAINDICATED';
    testResults.push({
      testName: 'Safety Engine: Allergy Cross-Reactivity (Augmentin in Penicillin-Allergic Patient)',
      passed: t6Passed,
      message: t6Passed ? 'Correctly flagged CONTRAINDICATED allergy alert' : 'Failed to detect allergy alert',
      details: allergyCheck.allergyAlerts,
    });

    // Test 7: Drug Safety Engine - Disease-Drug Incompatibility
    const conditionCheck = await drugSafetyEngine.evaluateSafety({
      currentMedications: ['Ibuprofen'],
      conditions: ['Peptic Ulcer Disease (PUD)'],
    });
    const t7Passed = conditionCheck.conditionContraindications.length > 0 &&
      conditionCheck.conditionContraindications[0].severity === 'ABSOLUTE_CONTRAINDICATION';
    testResults.push({
      testName: 'Safety Engine: Condition Contraindication (Ibuprofen in Peptic Ulcer Disease)',
      passed: t7Passed,
      message: t7Passed ? 'Correctly flagged ABSOLUTE_CONTRAINDICATION condition alert' : 'Failed to detect condition alert',
      details: conditionCheck.conditionContraindications,
    });

    // Test 8: Drug Safety Engine - Critical Drug-Drug Interaction
    const ddiCheck = await drugSafetyEngine.evaluateSafety({
      currentMedications: ['Warfarin', 'Ibuprofen'],
    });
    const t8Passed = ddiCheck.drugInteractions.length > 0 &&
      ddiCheck.drugInteractions.some(i => i.severity === 'CONTRAINDICATED');
    testResults.push({
      testName: 'Safety Engine: Critical DDI (Warfarin + Ibuprofen -> Severe Bleed)',
      passed: t8Passed,
      message: t8Passed ? 'Correctly identified CONTRAINDICATED interaction with clinical management' : 'Failed DDI detection',
      details: ddiCheck.drugInteractions,
    });

    // Test 9: YemenMD Module Isolation & Database Fields
    const yemenDrugs = yemenMdStore.getAllDrugs();
    const sampleYemen = yemenDrugs[0];
    const t9Passed = Boolean(
      yemenDrugs.length >= 10 &&
      sampleYemen.GenericName &&
      sampleYemen.BrandName &&
      sampleYemen.Strength &&
      sampleYemen.DosageForm &&
      sampleYemen.Manufacturer &&
      sampleYemen.Country &&
      sampleYemen.Availability &&
      sampleYemen.LastUpdated
    );
    testResults.push({
      testName: 'YemenMD Module: Separation & Mandatory Database Fields',
      passed: t9Passed,
      message: t9Passed
        ? `YemenMD isolated database verified with ${yemenDrugs.length} registered products and all 8 required fields.`
        : 'YemenMD records missing required fields',
      details: { sampleFields: Object.keys(sampleYemen || {}) },
    });

    const allPassed = testResults.every(t => t.passed);

    res.json({
      success: allPassed,
      totalTests: testResults.length,
      passedCount: testResults.filter(t => t.passed).length,
      failedCount: testResults.filter(t => !t.passed).length,
      tests: testResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error running test suite:', error);
    res.status(500).json({ error: 'Failed to run test suite', details: error?.message });
  }
});

// ==========================================
// YEMENMD MODULE API ENDPOINTS (SEPARATE)
// ==========================================

/**
 * 1. YEMENMD DRUGS LIST & SEARCH
 * Fields: GenericName, BrandName, Strength, DosageForm, Manufacturer, Country, Availability, LastUpdated
 * GET /api/yemenmd/drugs?q=...&availability=...&manufacturer=...&country=...
 */
yemenMdRouter.get('/drugs', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const availability = req.query.availability as any;
    const manufacturer = req.query.manufacturer as string | undefined;
    const country = req.query.country as string | undefined;
    const dosageForm = req.query.dosageForm as string | undefined;

    const drugs = yemenMdStore.search(q, {
      availability,
      manufacturer,
      country,
      dosageForm,
    });

    res.json({
      count: drugs.length,
      drugs,
      filterCriteria: { q, availability, manufacturer, country, dosageForm },
      module: 'YemenMD Local Market Pharmaceutical Registry',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search YemenMD registry', details: error?.message });
  }
});

/**
 * 2. YEMENMD DRUG DETAIL & GLOBAL PHARMACOLOGY BRIDGE
 * GET /api/yemenmd/drugs/:id
 */
yemenMdRouter.get('/drugs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const drug = yemenMdStore.getById(id);

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found in YemenMD registry' });
    }

    // Bridge: Cross-reference to Global Clinical Profile using GenericName (without polluting YemenMD store)
    const { profile: globalProfile } = await drugKnowledgeRepository.getDrugProfile(drug.GenericName);

    res.json({
      yemenDrug: drug,
      linkedGlobalPharmacology: globalProfile
        ? {
            hasGlobalProfile: true,
            drugClass: globalProfile.drugClass,
            drugClassAr: globalProfile.drugClassAr,
            boxedWarningAr: globalProfile.boxedWarningAr,
            boxedWarningEn: globalProfile.boxedWarningEn,
            contraindicationsAr: globalProfile.contraindicationsAr,
            contraindicationsEn: globalProfile.contraindicationsEn,
            commonUsesAr: globalProfile.commonUsesAr,
            seriousSideEffectsAr: globalProfile.seriousSideEffectsAr,
          }
        : {
            hasGlobalProfile: false,
            message: 'No linked global profile in demo seed repository for this generic compound.',
          },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get YemenMD drug details' });
  }
});

/**
 * 3. YEMENMD MARKET STATISTICS
 * GET /api/yemenmd/statistics
 */
yemenMdRouter.get('/statistics', (req: Request, res: Response) => {
  try {
    const stats = yemenMdStore.getStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get YemenMD statistics' });
  }
});

/**
 * 4. YEMENMD MANUFACTURERS LIST
 * GET /api/yemenmd/manufacturers
 */
yemenMdRouter.get('/manufacturers', (req: Request, res: Response) => {
  try {
    res.json({
      manufacturers: yemenMdStore.getManufacturers(),
      countries: yemenMdStore.getCountries(),
      dosageForms: yemenMdStore.getDosageForms(),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get YemenMD metadata lists' });
  }
});

/**
 * 5. YEMENMD ADD LOCAL PRODUCT
 * POST /api/yemenmd/drugs
 */
yemenMdRouter.post('/drugs', (req: Request, res: Response) => {
  try {
    const { GenericName, BrandName, Strength, DosageForm, Manufacturer, Country, Availability, estimatedPriceYer, localDistributor, notesAr } = req.body;

    if (!GenericName || !BrandName || !Strength || !DosageForm || !Manufacturer || !Country || !Availability) {
      return res.status(400).json({
        error: 'Missing required YemenMD fields: GenericName, BrandName, Strength, DosageForm, Manufacturer, Country, Availability are mandatory.',
      });
    }

    const created = yemenMdStore.addDrug({
      GenericName,
      BrandName,
      Strength,
      DosageForm,
      Manufacturer,
      Country,
      Availability,
      estimatedPriceYer: estimatedPriceYer ? Number(estimatedPriceYer) : undefined,
      localDistributor,
      notesAr,
    });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add drug to YemenMD registry' });
  }
});
