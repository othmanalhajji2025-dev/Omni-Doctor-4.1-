import { Router, Response } from 'express';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../auth/middleware.js';
import { userDataStore } from '../db/userDataStore.js';
import { medicalStore } from '../db/store.js';
import { executeClinicalReasoning } from '../clinical/clinicalReasoningEngine.js';
import { extractOLDCARTSFromText, evaluateMissingOLDCARTSElements } from '../clinical/oldcartsEngine.js';

export const clinicalRouter = Router();

/**
 * POST /api/clinical/analyze
 * Master entry point for Phase 4 Clinical Reasoning Engine (7-Step Protocol & OLDCARTS)
 */
clinicalRouter.post('/analyze', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      symptoms,
      duration,
      severity,
      painScale,
      location,
      associatedSymptoms,
      vitalSigns,
      patientConsent,
      language,
    } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return res.status(400).json({
        error: 'Chief symptom description is required.',
        messageAr: 'يرجى تقديم وصف للأعراض أو الشكوى الرئيسية للبدء في التحليل السريري.',
      });
    }

    // Build patient context if consent is granted
    let patientContext: any = undefined;
    const consentGranted = patientConsent === true;

    if (consentGranted) {
      if (req.user) {
        const userProfile = userDataStore.getProfile(req.user, req.user.id);
        const userConditions = userDataStore.getConditions(req.user, req.user.id);
        const userMeds = userDataStore.getMedications(req.user, req.user.id);
        const userAllergies = userDataStore.getAllergies(req.user, req.user.id);

        patientContext = {
          age: userProfile.age,
          gender: userProfile.gender,
          chronicConditions: userConditions.map(c => c.nameAr),
          currentMedications: userMeds.map(m => m.nameAr),
          allergies: userAllergies.map(a => a.allergenAr),
        };
      } else {
        const legacyProfile = medicalStore.getProfile();
        patientContext = {
          age: legacyProfile.age,
          gender: legacyProfile.gender,
          chronicConditions: legacyProfile.chronicConditions.map(c => c.nameAr),
          currentMedications: legacyProfile.currentMedications.map(m => m.nameAr),
          allergies: legacyProfile.allergies.map(a => a.allergenAr),
        };
      }
    }

    const encounter = await executeClinicalReasoning({
      symptoms,
      duration,
      severity,
      painScale,
      location,
      associatedSymptoms,
      vitalSigns,
      patientContext,
      patientConsent: consentGranted,
      language: language || 'ar',
    });

    res.json(encounter);
  } catch (error: any) {
    console.error('Clinical Reasoning Engine error:', error);
    res.status(500).json({
      error: 'Clinical reasoning execution failed',
      details: error.message,
      messageAr: 'حدث خطأ أثناء معالجة طبقة الاستدلال السريري. يرجى المحاولة لاحقاً.',
    });
  }
});

/**
 * POST /api/clinical/extract-oldcarts
 * Lightweight real-time endpoint to parse text into OLDCARTS and determine missing pertinent questions
 */
clinicalRouter.post('/extract-oldcarts', (req, res) => {
  try {
    const { text, chiefComplaint } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for OLDCARTS extraction.' });
    }

    const oldcarts = extractOLDCARTSFromText(text);
    const evaluation = evaluateMissingOLDCARTSElements(oldcarts, chiefComplaint || text);

    res.json({
      oldcarts,
      missingElements: evaluation.missingElements,
      nextPriorityQuestion: evaluation.nextPriorityQuestion,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to extract OLDCARTS', details: error.message });
  }
});
