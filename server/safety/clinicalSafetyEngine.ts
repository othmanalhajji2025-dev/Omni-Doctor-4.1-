import {
  SafetyEvaluationInput,
  SafetyEvaluationResult,
  SafetyRiskLevel,
  TriggeredSafetyRuleSummary,
  EmergencyResponseModePayload,
} from '../types/safety.js';
import { CLINICAL_SAFETY_RULES } from './clinicalSafetyRules.js';
import { safetyEventStore } from './safetyEventStore.js';

const RISK_RANK: Record<SafetyRiskLevel, number> = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  URGENT: 4,
  EMERGENCY: 5,
};

export class ClinicalSafetyEngine {
  private rules = CLINICAL_SAFETY_RULES;

  /**
   * Primary Evaluation Entry Point
   * Has strict priority over any downstream AI processing.
   */
  public evaluate(
    input: SafetyEvaluationInput,
    sessionId?: string
  ): SafetyEvaluationResult {
    const triggeredRules: TriggeredSafetyRuleSummary[] = [];
    let highestLevel: SafetyRiskLevel = 'LOW';
    let highestRank = 1;
    let highestRule: TriggeredSafetyRuleSummary | undefined = undefined;

    // 1. Evaluate Rule-Based Predicates
    for (const rule of this.rules) {
      try {
        if (rule.conditions.matches(input)) {
          const ruleRank = RISK_RANK[rule.riskLevel];
          const summary: TriggeredSafetyRuleSummary = {
            ruleId: rule.ruleId,
            category: rule.category,
            trigger: rule.trigger,
            riskLevel: rule.riskLevel,
            nameAr: rule.nameAr,
            nameEn: rule.nameEn,
            explanationAr: rule.explanation.ar,
            explanationEn: rule.explanation.en,
            actionAr: rule.action.ar,
            actionEn: rule.action.en,
            emergencyCallRequired: rule.action.emergencyCallRequired,
            safeWaitingStepsAr: rule.action.safeWaitingStepsAr,
            safeWaitingStepsEn: rule.action.safeWaitingStepsEn,
          };

          triggeredRules.push(summary);

          if (ruleRank > highestRank) {
            highestRank = ruleRank;
            highestLevel = rule.riskLevel;
            highestRule = summary;
          }
        }
      } catch (ruleErr) {
        console.error(`[ClinicalSafetyEngine] Error evaluating rule ${rule.ruleId}:`, ruleErr);
      }
    }

    // 2. Vital Sign Escalation Check
    if (input.vitalSigns) {
      const v = input.vitalSigns;
      if (v.spO2 !== undefined && v.spO2 < 90) {
        highestLevel = 'EMERGENCY';
      } else if (v.systolicBP !== undefined && (v.systolicBP >= 180 || (v.diastolicBP && v.diastolicBP >= 120))) {
        highestLevel = 'EMERGENCY';
      } else if (v.spO2 !== undefined && v.spO2 < 94 && highestLevel !== 'EMERGENCY') {
        if (RISK_RANK['URGENT'] > RISK_RANK[highestLevel]) highestLevel = 'URGENT';
      }
    }

    // 3. Pain Scale Escalation
    if (input.painScale !== undefined) {
      if (input.painScale >= 8 && RISK_RANK[highestLevel] < RISK_RANK['URGENT']) {
        highestLevel = 'URGENT';
      } else if (input.painScale >= 4 && RISK_RANK[highestLevel] < RISK_RANK['MODERATE']) {
        highestLevel = 'MODERATE';
      }
    }

    const isEmergency = highestLevel === 'EMERGENCY';
    const isOverrideActive = isEmergency;

    // 4. Construct Emergency Payload if Emergency Mode triggers
    let emergencyPayload: EmergencyResponseModePayload | undefined = undefined;
    if (isEmergency) {
      emergencyPayload = this.constructEmergencyPayload(triggeredRules, input.language || 'ar');
    }

    // Explanations & Actions
    const clinicalExplanationAr = highestRule
      ? highestRule.explanationAr
      : isEmergency
      ? 'تم رصد مؤشرات حرجة تستدعي التقييم الإسعافي الفوري لحماية سلامة المريض واستبعاد المخاطر الوعائية أو التنفسية الحادة.'
      : 'لم يتم رصد أي علامات خطر حادة مهددة للحياة في المعطيات المقدمة، وتصنف الحالة ضمن الحدود الآمنة للرعاية الاعتيادية.';

    const clinicalExplanationEn = highestRule
      ? highestRule.explanationEn
      : isEmergency
      ? 'Critical red flags detected requiring immediate emergency appraisal to rule out acute cardiovascular, respiratory, or neurological hazards.'
      : 'No acute life-threatening red flags detected; categorized within safe routine monitoring boundaries.';

    const recommendedActionAr = highestRule
      ? highestRule.actionAr
      : isEmergency
      ? 'اتصل فوراً بالإسعاف (997 أو 911) ولا تقم بالقيادة بنفسك.'
      : 'ينصح بالراحة ومتابعة الأعراض واستشارة الطبيب عند تفاقمها.';

    const recommendedActionEn = highestRule
      ? highestRule.actionEn
      : isEmergency
      ? 'Call emergency medical services (997/911) immediately. Do not drive yourself.'
      : 'Rest, monitor symptoms, and follow up with primary care if complaints persist.';

    const safeWaitingStepsAr = highestRule?.safeWaitingStepsAr || [
      'التوقف عن أي مجهود بدني والجلوس بوضعية مريحة نصف مستلقية.',
      'فك الملابس الضيقة حول العنق والصدر لتسهيل التنفس.',
      'إبقاء باب المنزل غير موصد لتسهيل وصول المسعفين.',
      'الامتناع عن تناول أي طعام أو شراب أو مسكنات قوية غير موصوفة.',
    ];

    const safeWaitingStepsEn = highestRule?.safeWaitingStepsEn || [
      'Stop physical exertion and rest in a comfortable semi-upright position.',
      'Loosen tight clothing around neck and chest.',
      'Ensure the front door is unlocked for paramedic access.',
      'Do not consume food, fluids, or unprescribed analgesics.',
    ];

    const result: SafetyEvaluationResult = {
      riskLevel: highestLevel,
      isEmergency,
      isOverrideActive,
      triggeredRules,
      highestRule,
      emergencyPayload,
      clinicalExplanationAr,
      clinicalExplanationEn,
      recommendedActionAr,
      recommendedActionEn,
      safeWaitingStepsAr,
      safeWaitingStepsEn,
      evaluatedAt: new Date().toISOString(),
    };

    // 5. Safety Event Logging (Only log necessary info - strictly preserve privacy)
    try {
      const primaryCategory = highestRule ? highestRule.category : 'GENERAL';
      safetyEventStore.logEvent({
        riskLevel: highestLevel,
        triggeredRules: triggeredRules.map(r => ({
          ruleId: r.ruleId,
          category: r.category,
          trigger: r.trigger,
          riskLevel: r.riskLevel,
        })),
        actionTaken: isEmergency
          ? 'EMERGENCY_OVERRIDE'
          : highestLevel === 'URGENT' || highestLevel === 'HIGH'
          ? 'SAFETY_WARNING'
          : 'ROUTINE_MONITOR',
        anonymizedContext: {
          symptomCategory: primaryCategory,
          characterCount: (input.text || '').length + (input.symptoms || '').length,
          hasVitals: Boolean(input.vitalSigns),
          painScale: input.painScale,
          sessionId,
        },
      });
    } catch (logErr) {
      console.warn('[ClinicalSafetyEngine] Non-blocking error logging safety event:', logErr);
    }

    return result;
  }

  /**
   * Constructs the dedicated Emergency Response Mode payload
   * Strictly adheres to negative constraint: No advanced medical procedures offered to user.
   */
  private constructEmergencyPayload(
    triggeredRules: TriggeredSafetyRuleSummary[],
    language: 'ar' | 'en'
  ): EmergencyResponseModePayload {
    const reasonsAr = triggeredRules.map(r => `• ${r.nameAr}: ${r.explanationAr}`).join('\n');
    const reasonsEn = triggeredRules.map(r => `• ${r.nameEn}: ${r.explanationEn}`).join('\n');

    return {
      isEmergencyMode: true,
      alertBannerAr: '⚠️ تنبيه سريري حرج — تم تفعيل نمط طوارئ السلامة الطبية (Emergency Response Mode)',
      alertBannerEn: '⚠️ Critical Safety Alert — Emergency Response Mode Activated',
      reasonForConcernAr:
        reasonsAr ||
        'رصد مؤشرات سريرية تدل على خطر وعائي، تنفسي، أو عصبي وشيك يتطلب تدخلاً طبياً مستعجلاً لاستبعاد المضاعفات الحادة.',
      reasonForConcernEn:
        reasonsEn ||
        'Clinical indications pointing to imminent cardiovascular, respiratory, or neurological compromise requiring urgent hospital evaluation.',
      urgentGuidanceAr:
        'هذه الأعراض لا تحتمل الانتظار أو الاستشارة الروتينية. يرجى الاتصال فوراً برقم الإسعاف (997 في المملكة العربية السعودية أو 911 دولياً) أو التوجه برفقة شخص لأقرب قسم طوارئ في مستشفى.',
      urgentGuidanceEn:
        'These symptoms require immediate medical intervention. Call emergency services (997 in Saudi Arabia, 911 internationally) or proceed with a companion to the nearest Emergency Department.',
      emergencyNumbers: {
        primary: '997',
        serviceNameAr: 'الهلال الأحمر السعودي (الإسعاف الطبي الطارئ)',
        serviceNameEn: 'Saudi Red Crescent Emergency Medical Service',
      },
      safeWaitingStepsAr: [
        'التوقف التام عن أي مجهود بدني أو حركة والاستلقاء بوضعية نصف جالسة مريحة.',
        'فك أي أزرار أو ملابس ضيقة حول العنق والصدر لضمان تدفق الهواء بسهولة.',
        'فتح باب المنزل أو الغرفة ليكون متاحاً لدخول المسعفين بسرعة ودون تأخير.',
        'التنفس بهدوء وبطء والبقاء برفقة أحد أفراد الأسرة إن أمكن.',
        'الامتناع التام عن تناول أي أطعمة، مشروبات، أو مسكنات قوية قد تخفي الأعراض.',
      ],
      safeWaitingStepsEn: [
        'Immediately cease all physical activity and sit in a comfortable semi-upright posture.',
        'Loosen restrictive collars, clothing, or belts around neck and chest.',
        'Unlock the front entrance to allow swift, unhindered paramedic access.',
        'Maintain slow, controlled breathing and stay accompanied if possible.',
        'Strictly avoid food, liquids, or unprescribed strong analgesics.',
      ],
      restrictedWarningAr:
        'ملاحظة سلامة ملزمة: النظام مبرمج لعدم تقديم أي إجراءات طبية معقدة أو تدخلات منزلية متقدمة لضمان حمايتك ومنع تفاقم الحالة.',
      restrictedWarningEn:
        'Safety Constraint: The system is strictly forbidden from offering advanced invasive maneuvers or unprescribed regimens to protect patient safety.',
    };
  }

  /**
   * AI Override Prevention Mechanism
   * Guarantees that if the case is EMERGENCY, the AI output is NEVER reassuring or conversational.
   * Also sanitizes false reassurances for HIGH and URGENT cases.
   */
  public sanitizeOrOverrideAiResponse(
    aiContent: string,
    safetyResult: SafetyEvaluationResult,
    language: 'ar' | 'en' = 'ar'
  ): {
    finalContent: string;
    wasOverridden: boolean;
    reason?: string;
  } {
    // 1. HARD OVERRIDE FOR EMERGENCY
    if (safetyResult.isEmergency) {
      const emergencyMessage = this.generateEmergencyMessageText(safetyResult, language);
      return {
        finalContent: emergencyMessage,
        wasOverridden: true,
        reason: 'EMERGENCY_CIRCUIT_BREAKER_OVERRIDE',
      };
    }

    // 2. SOFT SANITIZATION FOR HIGH / URGENT (Prevent misleading false reassurances)
    if (safetyResult.riskLevel === 'HIGH' || safetyResult.riskLevel === 'URGENT') {
      const lower = aiContent.toLowerCase();
      const reassuringPhrases = [
        'لا داعي للقلق', 'أمر بسيط', 'لا تقلق أبدا', 'لا حاجة لزيارة الطبيب',
        'طبيعي جدا', 'لا خطورة في ذلك', "don't worry", 'completely benign', 'no need to see a doctor'
      ];

      const hasDangerousReassurance = reassuringPhrases.some(phrase => lower.includes(phrase));

      if (hasDangerousReassurance) {
        const cautionPrefix = language === 'ar'
          ? `⚠️ [تنبيه سلامة من محرك الأمان السريري]: نظراً لوجود أعراض تتطلب عناية طبية بدرجة خطورة [${safetyResult.riskLevel}]، لا يمكن اعتبار هذه الحالة بسيطة، ويتعين مراجعة الطبيب المختص أو المركز الصحي لتقييم الأعراض بدقة.\n\n`
          : `⚠️ [Clinical Safety Warning]: Due to symptoms stratified as [${safetyResult.riskLevel}], this condition warrants formal medical appraisal and should not be dismissed.\n\n`;

        return {
          finalContent: cautionPrefix + aiContent,
          wasOverridden: true,
          reason: 'REASSURANCE_SUPPRESSION_WARNING_ADDED',
        };
      }
    }

    return {
      finalContent: aiContent,
      wasOverridden: false,
    };
  }

  /**
   * Formats the authoritative Emergency Response Mode text message
   */
  public generateEmergencyMessageText(
    safetyResult: SafetyEvaluationResult,
    language: 'ar' | 'en'
  ): string {
    const isAr = language === 'ar';
    const payload = safetyResult.emergencyPayload;

    if (isAr) {
      return `🚨 **تنبيه سريري عاجل — تم تفعيل نمط الاستجابة للطوارئ (Emergency Mode)**

⚠️ **محرك الأمان السريري قام بحجب الرد التوليدي وتفعيل بروتوكول الطوارئ الإلزامي لحمايتك.**

🔍 **سبب وجود القلق السريري:**
${safetyResult.clinicalExplanationAr}

📞 **الإجراء الفوري المطلوب:**
• **اتصل فوراً بالإسعاف (997 في السعودية أو 911 دولياً)** أو توجه برفقة شخص لأقرب قسم طوارئ (ER) على الفور.
• **تنبيه هام:** لا تقد السيارة بنفسك نهائياً لتفادي وقوع حوادث في حال تدهور الوعي.

🛡️ **خطوات عامة وآمنة أثناء انتظار وصول الإسعاف:**
1. التوقف الفوري عن أي حركة أو مجهود بدني والجلوس بوضعية نصف جالسة مريحة.
2. فك أي ملابس أو أربطة ضيقة حول العنق والصدر لضمان تدفق الهواء بسهولة.
3. فتح باب المنزل الخارجي لضمان سهولة وسرعة دخول المسعفين إليك.
4. التنفس بهدوء وتجنب الانفعال، والبقاء مع مرافق إن أمكن.
5. **الامتناع التام** عن تناول أي طعام أو شراب أو مسكنات قوية غير موصوفة حتى وصول الفريق الطبي.

⛔ *تنويه السلامة السريرية: لا يُسمح بتقديم أي إجراءات طبية متقدمة أو إعطاء أدوية ذاتية في هذه المرحلة حرصاً على حياتك وسلامتك.*`;
    } else {
      return `🚨 **CRITICAL CLINICAL ALERT — Emergency Response Mode Activated**

⚠️ **The Clinical Safety Engine has overridden automated generative output to enforce strict emergency protocols for your safety.**

🔍 **Reason for Clinical Concern:**
${safetyResult.clinicalExplanationEn}

📞 **Immediate Required Action:**
• **Call Emergency Medical Services (997 in Saudi Arabia or 911 internationally) immediately** or proceed with a companion to the nearest Emergency Department.
• **Safety Precaution:** Do NOT drive yourself under any circumstances.

🛡️ **Safe General Steps While Awaiting Medical Assistance:**
1. Cease all physical activity immediately and rest in a comfortable semi-upright seated posture.
2. Loosen restrictive collars, ties, or belts around neck and chest to facilitate airflow.
3. Unlock the entrance door so emergency responders can enter without obstruction.
4. Breathe slowly and calmly, staying accompanied if possible.
5. **Strictly avoid** taking food, liquids, or unprescribed strong analgesics pending medical team arrival.

⛔ *Clinical Safety Mandate: Advanced medical maneuvers or self-medication are strictly prohibited at this stage to safeguard patient wellbeing.*`;
    }
  }

  /**
   * Inspect all registered rules
   */
  public getRegisteredRules(): typeof CLINICAL_SAFETY_RULES {
    return this.rules;
  }
}

export const clinicalSafetyEngine = new ClinicalSafetyEngine();
