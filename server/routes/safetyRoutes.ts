import { Router, Request, Response } from 'express';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../auth/middleware.js';
import { clinicalSafetyEngine } from '../safety/clinicalSafetyEngine.js';
import { safetyEventStore } from '../safety/safetyEventStore.js';
import { SafetyEvaluationInput, SafetyRiskLevel } from '../types/safety.js';

export const safetyRouter = Router();

/**
 * POST /api/safety/evaluate
 * Master evaluation endpoint for Clinical Safety Engine
 * Operates independently of AI generative layer with highest clinical priority
 */
safetyRouter.post('/evaluate', optionalAuthenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      text,
      symptoms,
      duration,
      severity,
      painScale,
      vitalSigns,
      patientContext,
      language = 'ar',
    } = req.body;

    if (!text && !symptoms) {
      return res.status(400).json({
        error: 'Symptom description or text input is required for safety evaluation.',
      });
    }

    const evaluationInput: SafetyEvaluationInput = {
      text: text || symptoms || '',
      symptoms,
      duration,
      severity,
      painScale: typeof painScale === 'number' ? painScale : undefined,
      vitalSigns,
      patientContext,
      language,
    };

    const sessionId = req.user?.id || (req.headers['x-guest-session-id'] as string) || undefined;
    const result = clinicalSafetyEngine.evaluate(evaluationInput, sessionId);

    return res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Error in /api/safety/evaluate:', error);
    return res.status(500).json({
      error: 'Clinical Safety Engine evaluation failed',
      details: error?.message || 'Internal Safety Engine Error',
    });
  }
});

/**
 * GET /api/safety/events
 * Retrieve SafetyEvents audit logs
 * Strictly adheres to privacy principles: does not return raw PII or full text transcripts
 */
safetyRouter.get('/events', optionalAuthenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const riskLevel = req.query.riskLevel as SafetyRiskLevel | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const events = safetyEventStore.getEvents({ riskLevel, limit });

    return res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error: any) {
    console.error('Error in /api/safety/events:', error);
    return res.status(500).json({
      error: 'Failed to retrieve safety events audit logs',
    });
  }
});

/**
 * GET /api/safety/metrics
 * Retrieve statistical aggregates of safety events and override triggers
 */
safetyRouter.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = safetyEventStore.getMetrics();
    return res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Error in /api/safety/metrics:', error);
    return res.status(500).json({
      error: 'Failed to retrieve safety metrics',
    });
  }
});

/**
 * GET /api/safety/rules
 * Returns the catalog of deterministic rules for clinical governance
 */
safetyRouter.get('/rules', (req: Request, res: Response) => {
  try {
    const rules = clinicalSafetyEngine.getRegisteredRules().map(r => ({
      ruleId: r.ruleId,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      category: r.category,
      trigger: r.trigger,
      riskLevel: r.riskLevel,
      conditions: {
        descriptionAr: r.conditions.descriptionAr,
        descriptionEn: r.conditions.descriptionEn,
      },
      explanation: r.explanation,
      action: {
        ar: r.action.ar,
        en: r.action.en,
        emergencyCallRequired: r.action.emergencyCallRequired,
        safeWaitingStepsAr: r.action.safeWaitingStepsAr,
        safeWaitingStepsEn: r.action.safeWaitingStepsEn,
      },
    }));

    return res.json({
      success: true,
      totalRules: rules.length,
      rules,
    });
  } catch (error: any) {
    console.error('Error in /api/safety/rules:', error);
    return res.status(500).json({
      error: 'Failed to retrieve safety rules catalog',
    });
  }
});

/**
 * POST /api/safety/test-suite
 * Executes automated test verification across Low, Moderate, High, Urgent, and Emergency cases
 * Verifies that AI overrides cannot be bypassed
 */
safetyRouter.post('/test-suite', (req: Request, res: Response) => {
  try {
    const testCases = [
      {
        name: 'Emergency - Chest Pain + Severe Dyspnea',
        input: { text: 'عندي ألم شديد في الصدر وضيق تنفس حاد ولا أستطيع التقاط نفسي' },
        expectedRisk: 'EMERGENCY',
        shouldOverride: true,
      },
      {
        name: 'Emergency - FAST Stroke Signs',
        input: { text: 'والدي يعاني من اعوجاج مفاجئ في الوجه وثقل شديد باللسان وضعف في يده اليمنى' },
        expectedRisk: 'EMERGENCY',
        shouldOverride: true,
      },
      {
        name: 'Urgent - Incapacitating Pain (Pain Score 9)',
        input: { text: 'عندي ألم في ظهري مقياس 9 لا أستطيع الحركة منه', painScale: 9 },
        expectedRisk: 'URGENT',
        shouldOverride: false,
      },
      {
        name: 'Urgent - Renal Colic with Hematuria',
        input: { text: 'مغص كلوي حاد جداً في الخاصرة مع تغير لون البول لدموي' },
        expectedRisk: 'URGENT',
        shouldOverride: false,
      },
      {
        name: 'High Risk - Unilateral Leg Swelling Post Flight',
        input: { text: 'تورم الساق اليمنى مع احمرار وحرارة بعد سفر طويل بالطائرة' },
        expectedRisk: 'HIGH',
        shouldOverride: false,
      },
      {
        name: 'Moderate - Acute Viral Gastroenteritis',
        input: { text: 'عندي إسهال مائي ومغص بالبطن منذ الأمس وأشرب الماء بانتظام' },
        expectedRisk: 'MODERATE',
        shouldOverride: false,
      },
      {
        name: 'Low Risk - Common Cold (Rhinorrhea & Sneezing)',
        input: { text: 'عندي رشح خفيف وعطاس وزكام بدون حرارة' },
        expectedRisk: 'LOW',
        shouldOverride: false,
      },
    ];

    const results = testCases.map(tc => {
      const evaluation = clinicalSafetyEngine.evaluate(tc.input);
      const passedRisk = evaluation.riskLevel === tc.expectedRisk;
      const passedOverride = evaluation.isOverrideActive === tc.shouldOverride;

      // Test AI override prevention: Simulated reassuring AI text
      const simulatedReassuringAi = 'لا تقلق على الإطلاق، هذا عارض بسيط جداً وطبيعي، خذ قسطاً من الراحة فقط.';
      const sanitized = clinicalSafetyEngine.sanitizeOrOverrideAiResponse(simulatedReassuringAi, evaluation, 'ar');

      // If Emergency, the reassuring text MUST NOT be present in finalContent
      const overrideProtected = tc.expectedRisk === 'EMERGENCY'
        ? !sanitized.finalContent.includes('عارض بسيط جداً وطبيعي') && sanitized.wasOverridden
        : true;

      return {
        testName: tc.name,
        expectedRisk: tc.expectedRisk,
        actualRisk: evaluation.riskLevel,
        isEmergency: evaluation.isEmergency,
        isOverrideActive: evaluation.isOverrideActive,
        triggeredRuleIds: evaluation.triggeredRules.map(r => r.ruleId),
        overrideProtected,
        passed: passedRisk && passedOverride && overrideProtected,
      };
    });

    const allPassed = results.every(r => r.passed);

    return res.json({
      success: true,
      allPassed,
      totalTested: results.length,
      passedTests: results.filter(r => r.passed).length,
      results,
    });
  } catch (error: any) {
    console.error('Error running safety test-suite:', error);
    return res.status(500).json({
      error: 'Failed to execute safety test suite',
      details: error?.message,
    });
  }
});
