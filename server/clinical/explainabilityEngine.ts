import {
  ExplainabilityReport,
  MissingOLDCARTSElement,
  DifferentialItem,
  TriageUrgency,
} from '../types/medical.js';

export interface ExplainabilityInput {
  urgency: TriageUrgency;
  urgencyLabelAr: string;
  urgencyLabelEn: string;
  redFlags: Array<{ nameAr: string; nameEn: string; urgency: TriageUrgency }>;
  painScale?: number;
  symptomsText: string;
  nextQuestion?: MissingOLDCARTSElement;
  differentials: DifferentialItem[];
}

/**
 * Clinical Explainability Engine
 * Fulfills the 3 core patient transparency pillars:
 * 1. لماذا تم طرح سؤال معين؟ (Why was a specific question asked?)
 * 2. لماذا تم رفع مستوى الخطورة؟ (Why was urgency elevated?)
 * 3. لماذا ظهر احتمال معين؟ (Why did a specific possibility appear?)
 */
export function buildExplainabilityReport(input: ExplainabilityInput): ExplainabilityReport {
  // 1. لماذا تم طرح سؤال معين؟
  let whyQuestionAsked: ExplainabilityReport['whyQuestionAsked'] | undefined = undefined;

  if (input.nextQuestion) {
    whyQuestionAsked = {
      questionAr: input.nextQuestion.questionAr,
      questionEn: input.nextQuestion.questionEn,
      clinicalReasonAr: input.nextQuestion.whyThisQuestionAr,
      clinicalReasonEn: input.nextQuestion.whyThisQuestionEn,
    };
  }

  // 2. لماذا تم رفع مستوى الخطورة؟
  const triggers: string[] = [];
  let rationaleAr = '';
  let rationaleEn = '';

  if (input.urgency === 'EMERGENCY') {
    if (input.redFlags.length > 0) {
      triggers.push(...input.redFlags.map(rf => rf.nameAr));
      rationaleAr = `تم تصنيف الحالة كـ [طوارئ فورية] لوجود (${input.redFlags.length}) من علامات الخطر الحيوية الحرجة (${triggers.join('، ')}) التي قد تدل على اضطراب قلبي أو وعائي أو تنفسي يهدد الحياة ويستوجب تدخلاً طبياً عاجلاً.`;
      rationaleEn = `Assigned [Immediate Emergency] due to presence of (${input.redFlags.length}) critical red flag indicators (${triggers.join(', ')}) requiring prompt hospital intervention.`;
    } else if (input.painScale && input.painScale >= 9) {
      triggers.push(`مقياس ألم حرج (${input.painScale}/10)`);
      rationaleAr = `تم رفع مستوى الخطورة إلى [طوارئ] نظراً لشدة الألم القصوى (${input.painScale}/10) المعطلة للقدرة على الحركة أو التنفس الطبيعي.`;
      rationaleEn = `Urgency escalated to [Emergency] due to incapacitating pain scale (${input.painScale}/10).`;
    } else {
      rationaleAr = 'تم رفع الخطورة لوجود مؤشرات سريرية حادة تستدعي استبعاد الحالات المهددة للحياة فوراً.';
      rationaleEn = 'Escalated due to acute clinical patterns mandating immediate rule-out of severe pathology.';
    }
  } else if (input.urgency === 'URGENT') {
    if (input.redFlags.length > 0) {
      triggers.push(...input.redFlags.map(rf => rf.nameAr));
      rationaleAr = `تم تصنيف الحالة كـ [رعاية عاجلة] لوجود علامات تتطلب فحصاً سريرياً خلال 12-24 ساعة (${triggers.join('، ')}) لمنع تفاقم الحالة.`;
      rationaleEn = `Assigned [Urgent Care] requiring 12-24h clinical evaluation for (${triggers.join(', ')}).`;
    } else if (input.painScale && input.painScale >= 7) {
      triggers.push(`ألم شديد (${input.painScale}/10)`);
      rationaleAr = `تم رفع الخطورة إلى [عاجلة] لأن مقياس الألم (${input.painScale}/10) يتجاوز العتبة الآمنة للرعاية المنزلية ويتطلب تسكيناً وتقييماً طبياً مباشراً.`;
      rationaleEn = `Assigned [Urgent] as severe pain score (${input.painScale}/10) exceeds safe home management thresholds.`;
    } else {
      rationaleAr = 'الحالة تتطلب تقييماً طبياً عاجلاً خلال 24 ساعة لاستقصاء السبب المباشر وتفادي المضاعفات.';
      rationaleEn = 'Requires clinical assessment within 24 hours to prevent complications.';
    }
  } else if (input.urgency === 'ROUTINE') {
    rationaleAr = 'تم تحديد المستوى كـ [عيادة روتينية] لأن الأعراض متوسطة الشدة، ومستقرة سريرياً، مع عدم وجود علامات إنذار حمراء مهددة للحياة.';
    rationaleEn = 'Assigned [Routine Outpatient] as symptoms are stable, moderate, and lack acute red flags.';
  } else {
    rationaleAr = 'تم تصنيف الحالة كـ [رعاية ذاتية ومراقبة] لكون الأعراض طفيفة ومحدودة ذاتياً، ولا توجد مؤشرات تدل على خطورة حادة في الوقت الراهن.';
    rationaleEn = 'Assigned [Self-Care & Monitoring] as symptoms are mild, self-limiting, and without acute risk triggers.';
  }

  const whyUrgencyLevel = {
    urgency: input.urgency,
    rationaleAr,
    rationaleEn,
    triggers,
  };

  // 3. لماذا ظهر احتمال معين؟
  const whyDifferentialsAppeared = input.differentials.map(diff => ({
    conditionAr: diff.nameAr,
    conditionEn: diff.nameEn,
    rationaleAr: diff.whyAppearedAr,
    rationaleEn: diff.whyAppearedEn,
    supportingFactors: diff.supportingFactorsAr,
  }));

  return {
    whyQuestionAsked,
    whyUrgencyLevel,
    whyDifferentialsAppeared,
  };
}
