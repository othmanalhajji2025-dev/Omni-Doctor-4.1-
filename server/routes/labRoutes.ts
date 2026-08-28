import { Router, Response } from 'express';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../auth/middleware.js';
import { labInterpretationEngine, BIOMARKER_DATABASE } from '../documents/labInterpretationEngine.js';
import { timelineEngine } from '../documents/timelineEngine.js';
import { documentStore } from '../documents/documentStore.js';
import { userDataStore } from '../db/userDataStore.js';

export const labRouter = Router();
export const timelineRouter = Router();

/**
 * 1. LAB INTERPRETATION ENGINE
 * POST /api/labs/interpret
 */
labRouter.post('/interpret', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { parameters, patientContext } = req.body;

    if (!Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        error: 'Parameters array is required with at least one biomarker to interpret.',
        messageAr: 'قائمة المؤشرات والتحاليل مطلوبة لتنفيذ التفسير السريري.',
      });
    }

    // Auto-enrich patient context if logged in
    let effectiveContext = patientContext;
    if (req.user) {
      const profile = userDataStore.getProfile(req.user, req.user.id);
      const conditions = userDataStore.getConditions(req.user, req.user.id);
      const meds = userDataStore.getMedications(req.user, req.user.id);

      effectiveContext = {
        age: patientContext?.age || profile.age,
        gender: patientContext?.gender || profile.gender,
        activeConditions: patientContext?.activeConditions || conditions.map((c) => c.nameAr),
        currentMedications: patientContext?.currentMedications || meds.map((m) => m.nameAr),
        activeSymptoms: patientContext?.activeSymptoms || [],
      };
    }

    const interpretedResults = parameters.map((param: any) => {
      const interpretation = labInterpretationEngine.interpretTest({
        testName: param.name || param.testName,
        resultValue: param.value !== undefined ? param.value : param.resultValue,
        unit: param.unit,
        documentReferenceRange: param.referenceRange?.textRange || param.referenceRange,
        context: effectiveContext,
      });

      return {
        testName: param.name || param.testName,
        testNameAr: interpretation.matchedBiomarker?.nameAr || param.nameAr || param.name,
        category: interpretation.matchedBiomarker?.category || 'General Laboratory',
        categoryAr: interpretation.matchedBiomarker?.categoryAr || 'فحوصات مخبرية عامة',
        resultValue: param.value !== undefined ? param.value : param.resultValue,
        unit: param.unit || interpretation.matchedBiomarker?.defaultUnit || '',
        referenceRange: interpretation.referenceRange,
        status: interpretation.status,
        interpretation: interpretation.interpretation,
        unitAwareNote: interpretation.unitAwareNote,
      };
    });

    const criticalFlags = interpretedResults.filter((r) => r.status === 'Critical');
    const abnormalFlags = interpretedResults.filter((r) => r.status === 'High' || r.status === 'Low');

    res.json({
      success: true,
      contextUsed: effectiveContext,
      summary: {
        totalAnalyzed: interpretedResults.length,
        normalCount: interpretedResults.filter((r) => r.status === 'Normal').length,
        abnormalCount: abnormalFlags.length,
        criticalCount: criticalFlags.length,
        hasCriticalAlert: criticalFlags.length > 0,
      },
      results: interpretedResults,
      clinicalNoticeAr: 'تنبيه سريري: لا يتم تشخيص أي مرض بناءً على نتيجة تحليل منفردة فقط. التفسيرات المعروضة تأخذ بعين الاعتبار العمر والجنس والوحدة المخبرية ويجب مطابقتها مع الطبيب.',
      clinicalNoticeEn: 'Clinical Safety Notice: Do not diagnose a disease based on a single laboratory result alone. Interpretation is Age-, Sex-, and Unit-Aware and requires clinical correlation.',
    });
  } catch (error: any) {
    console.error('Error in /api/labs/interpret:', error);
    res.status(500).json({ error: 'Failed to interpret lab parameters', details: error.message });
  }
});

/**
 * 2. BIOMARKER CATALOG & STANDARD RANGES
 * GET /api/labs/biomarkers
 */
labRouter.get('/biomarkers', (_req, res) => {
  res.json({
    count: BIOMARKER_DATABASE.length,
    biomarkers: BIOMARKER_DATABASE,
  });
});

/**
 * 3. LAB HISTORY
 * GET /api/labs/history
 */
labRouter.get('/history', optionalAuthenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const effectiveUserId = req.query.userId as string || req.user?.id || 'usr_pat_001';
  const labs = documentStore.getConfirmedLabsForUser(effectiveUserId);
  res.json({
    count: labs.length,
    labs,
  });
});

/**
 * 4. LONGITUDINAL HEALTH TIMELINE
 * GET /api/timeline
 */
timelineRouter.get('/', optionalAuthenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const timelineData = timelineEngine.generateHealthTimeline(req.user, req.query.userId as string);
    res.json(timelineData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate health timeline', details: error.message });
  }
});
