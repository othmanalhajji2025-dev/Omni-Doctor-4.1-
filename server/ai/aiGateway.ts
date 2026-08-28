import {
  AIProvider,
  ClinicalDialogueRequest,
  ClinicalDialogueResponse,
} from './providers/AIProvider.js';
import { GeminiProvider } from './providers/GeminiProvider.js';
import { ClinicalFallbackProvider } from './providers/ClinicalFallbackProvider.js';
import { clinicalSafetyEngine } from '../safety/clinicalSafetyEngine.js';

export class AIGateway {
  private providers: AIProvider[] = [];
  private fallbackProvider: ClinicalFallbackProvider;

  constructor() {
    this.fallbackProvider = new ClinicalFallbackProvider();
    // Register primary providers
    this.providers.push(new GeminiProvider());
    this.providers.push(this.fallbackProvider);
  }

  /**
   * Register a custom provider dynamically for future extensibility
   */
  public registerProvider(provider: AIProvider): void {
    this.providers.unshift(provider);
  }

  /**
   * Process dialogue through the AI Gateway layer
   * Guaranteed: Clinical Safety Engine evaluates FIRST and has HIGHER PRIORITY than AI
   */
  public async processDialogue(
    request: ClinicalDialogueRequest
  ): Promise<ClinicalDialogueResponse> {
    const startTime = Date.now();

    // =========================================================================
    // STEP 0: CLINICAL SAFETY ENGINE EVALUATION (Highest Priority Circuit Breaker)
    // =========================================================================
    const safetyResult = clinicalSafetyEngine.evaluate(
      {
        text: request.message,
        symptoms: request.clinicalContext?.primarySymptom,
        patientContext: request.patientContext,
        language: request.language,
      },
      request.conversationId
    );

    // AI OVERRIDE PREVENTION: If Safety Engine triggers EMERGENCY, AI generation is strictly forbidden
    if (safetyResult.isEmergency) {
      const emergencyContent = clinicalSafetyEngine.generateEmergencyMessageText(
        safetyResult,
        request.language
      );

      const redFlagsList = safetyResult.triggeredRules.map((r) => ({
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        urgency: 'EMERGENCY' as const,
        actionAr: r.actionAr,
        actionEn: r.actionEn,
      }));

      return {
        conversationId: request.conversationId,
        messageId: 'msg_emerg_' + Math.random().toString(36).substring(2, 9),
        content: emergencyContent,
        intent: 'EMERGENCY_CRISIS',
        isHealthRelated: true,
        extractedAttributes: {
          primarySymptom: safetyResult.highestRule?.nameAr || 'حالة طوارئ سريرية حرجة',
        },
        missingAttributes: [],
        redFlagsDetected: redFlagsList,
        urgency: 'EMERGENCY',
        needsFollowUp: false,
        evidenceRetrieved: [],
        questionsForDoctorAr: [
          'ما هو التقييم الإسعافي الفوري لتخطيط القلب أو أشعة الصدر/المخ؟',
          'هل هناك علامات لنقص تروية حاد أو انسداد وعائي؟',
        ],
        questionsForDoctorEn: [
          'What is the immediate emergency appraisal of my presenting symptoms?',
          'Are there signs of acute ischemia or vascular compromise?',
        ],
        providerUsed: 'ClinicalSafetyEngine (Emergency Circuit Breaker)',
        safetyOverride: true,
        safetyRiskLevel: 'EMERGENCY',
        safetyEvaluation: safetyResult,
        emergencyPayload: safetyResult.emergencyPayload,
        pipelineAudits: [
          {
            step: '0_CLINICAL_SAFETY_ENGINE',
            status: 'TRIGGERED',
            detailsAr: `قاطع الطوارئ مفعل: تم حجب الرد التوليدي وتطبيق بروتوكول الطوارئ الإلزامي (${safetyResult.triggeredRules.map(r => r.ruleId).join(', ')})`,
            detailsEn: `Emergency Circuit Breaker: Generative output blocked; Emergency Mode enforced (${safetyResult.triggeredRules.map(r => r.ruleId).join(', ')})`,
          },
        ],
        suggestedConversationTitle:
          request.language === 'ar' ? '🚨 حالة طوارئ طبية عاجلة' : '🚨 Urgent Medical Emergency',
      };
    }

    // =========================================================================
    // STEP 1: ROUTE TO GENERATIVE PROVIDERS (For Non-Emergency Cases)
    // =========================================================================
    let rawResponse: ClinicalDialogueResponse | null = null;
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        const response = await provider.processClinicalDialogue(request);
        const duration = Date.now() - startTime;

        // Ensure audit record includes gateway telemetry
        response.pipelineAudits.unshift({
          step: '0_AI_GATEWAY_ROUTING',
          status: 'PASSED',
          detailsAr: `توجيه البوابة الذكية عبر: ${provider.name} (زمن الاستجابة: ${duration}ms)`,
          detailsEn: `AI Gateway routed via: ${provider.name} (${duration}ms latency)`,
        });

        rawResponse = response;
        break;
      } catch (err: any) {
        lastError = err;
        console.error(
          `[AI Gateway Warning] Provider "${provider.name}" failed to process request. Attempting next fallback provider. Error summary:`,
          err?.message ? err.message.slice(0, 100) : 'Unknown error'
        );
      }
    }

    // Fallback if all registered providers fail
    if (!rawResponse) {
      console.warn('[AI Gateway] Invoking ultimate Clinical Fallback Provider to guarantee 100% uptime.');
      rawResponse = await this.fallbackProvider.processClinicalDialogue(request);
      rawResponse.pipelineAudits.unshift({
        step: '0_AI_GATEWAY_ROUTING',
        status: 'TRIGGERED',
        detailsAr: 'تم تفعيل المزود السريري الاحتياطي (Clinical Fallback) لضمان استمرارية الخدمة بنسبة 100%.',
        detailsEn: 'Clinical Fallback provider activated to ensure 100% platform availability.',
      });
    }

    // =========================================================================
    // STEP 2: POST-GENERATION CLINICAL SAFETY SANITIZATION
    // Ensures generative AI has not hallucinated reassuring phrases for High/Urgent cases
    // =========================================================================
    const sanitization = clinicalSafetyEngine.sanitizeOrOverrideAiResponse(
      rawResponse.content,
      safetyResult,
      request.language
    );

    rawResponse.content = sanitization.finalContent;
    rawResponse.safetyRiskLevel = safetyResult.riskLevel;
    rawResponse.safetyEvaluation = safetyResult;
    rawResponse.safetyOverride = sanitization.wasOverridden;

    // Attach audit
    rawResponse.pipelineAudits.unshift({
      step: '0_CLINICAL_SAFETY_ENGINE',
      status: sanitization.wasOverridden ? 'TRIGGERED' : 'PASSED',
      detailsAr: `فحص محرك الأمان السريري: تصنيف الخطورة [${safetyResult.riskLevel}] ${sanitization.wasOverridden ? 'مع تصحيح الأمان' : 'آمن ومطابق'}`,
      detailsEn: `Clinical Safety Engine Audit: Risk Level [${safetyResult.riskLevel}] ${sanitization.wasOverridden ? '(Safety Guardrail Applied)' : '(Verified)'}`,
    });

    return rawResponse;
  }
}

// Global Singleton Instance
export const aiGateway = new AIGateway();

