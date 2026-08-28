import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  ClinicalReasoningEncounter,
  ClinicalFinalResponse,
  TriageUrgency,
  VitalSignInput,
} from '../types/medical.js';
import { extractSymptomData, RawExtractionInput } from './symptomExtractor.js';
import { evaluateMissingOLDCARTSElements } from './oldcartsEngine.js';
import { detectRedFlags, evaluateVitalSigns, determineTriageCategory } from '../safety/redFlagEngine.js';
import { generateDifferentialPossibilities } from './differentialEngine.js';
import { buildExplainabilityReport } from './explainabilityEngine.js';
import { retrieveRelevantEvidence } from '../rag/evidenceRetriever.js';

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface RunClinicalReasoningRequest {
  symptoms: string;
  duration?: string;
  severity?: string;
  painScale?: number;
  location?: string;
  associatedSymptoms?: string[];
  vitalSigns?: VitalSignInput;
  patientContext?: {
    age?: number;
    gender?: string;
    chronicConditions?: string[];
    currentMedications?: string[];
    allergies?: string[];
  };
  patientConsent?: boolean; // Explicit consent to inspect and include medical history / meds
  language?: 'ar' | 'en';
}

/**
 * Executes the CLINICAL 7 STEP PROTOCOL:
 * STEP 1: Collect Symptoms (استخلاص وجمع الأعراض)
 * STEP 2: Clarify Symptoms (استيضاح وتحديد عناصر OLDCARTS الناقصة)
 * STEP 3: Detect Red Flags (فحص علامات الخطر الحتمية)
 * STEP 4: Generate Differential Possibilities (توليد الاحتمالات السريرية التفريقية دون تشخيص قاطع)
 * STEP 5: Estimate Urgency (تقدير مستوى الخطورة والاستعجال)
 * STEP 6: Verify Evidence (التحقق من الأدلة السريرية المعتمدة)
 * STEP 7: Generate Safe Response (صياغة الرد السريري الآمن وفق الهيكل المعتمد)
 */
export async function executeClinicalReasoning(
  request: RunClinicalReasoningRequest
): Promise<ClinicalReasoningEncounter> {
  const encounterId = 'enc_clin_' + Math.random().toString(36).substring(2, 9);
  const timestamp = new Date().toISOString();
  const consentGranted = request.patientConsent === true;

  // ==========================================
  // STEP 1: COLLECT SYMPTOMS & CLINICAL CONTEXT
  // ==========================================
  const extractionInput: RawExtractionInput = {
    text: request.symptoms,
    duration: request.duration,
    severity: request.severity,
    painScale: request.painScale,
    location: request.location,
    associatedSymptoms: request.associatedSymptoms,
    medications: request.patientContext?.currentMedications,
    medicalHistory: consentGranted ? request.patientContext?.chronicConditions : undefined,
    patientConsent: consentGranted,
  };

  const step1CollectSymptoms = extractSymptomData(extractionInput);

  // ==========================================
  // STEP 2: CLARIFY SYMPTOMS (OLDCARTS ENGINE)
  // ==========================================
  const chiefComplaint = step1CollectSymptoms.symptoms[0] || request.symptoms;
  const oldcartsEvaluation = evaluateMissingOLDCARTSElements(
    step1CollectSymptoms.oldcarts,
    chiefComplaint
  );

  const step2ClarifySymptoms = {
    oldcarts: step1CollectSymptoms.oldcarts,
    missingElements: oldcartsEvaluation.missingElements,
    nextPriorityQuestion: oldcartsEvaluation.nextPriorityQuestion,
  };

  // ==========================================
  // STEP 3: DETECT RED FLAGS
  // ==========================================
  const fullTextToScan = [
    request.symptoms,
    step1CollectSymptoms.location || '',
    step1CollectSymptoms.oldcarts.character || '',
    ...(step1CollectSymptoms.associatedSymptoms || []),
    ...(request.associatedSymptoms || []),
  ].join(' ');

  const textRedFlags = detectRedFlags(fullTextToScan);
  const vitalsCheck = evaluateVitalSigns(request.vitalSigns);

  const allRedFlags = [
    ...textRedFlags.map(rf => ({
      nameAr: rf.nameAr,
      nameEn: rf.nameEn,
      urgency: rf.urgency,
      actionAr: rf.actionAr,
      actionEn: rf.actionEn,
    })),
    ...vitalsCheck.flags,
  ];

  let elevationReasonAr: string | undefined = undefined;
  let elevationReasonEn: string | undefined = undefined;

  if (allRedFlags.length > 0) {
    elevationReasonAr = `تم رصد مؤشرات حيوية تستوجب اليقظة السريرية: ${allRedFlags.map(r => r.nameAr).join('، ')}.`;
    elevationReasonEn = `Identified critical alert triggers: ${allRedFlags.map(r => r.nameEn).join(', ')}.`;
  }

  const step3DetectRedFlags = {
    detected: allRedFlags,
    elevationReasonAr,
    elevationReasonEn,
  };

  // ==========================================
  // STEP 5: ESTIMATE URGENCY (Determined before differentials to calibrate concern)
  // ==========================================
  const estimatedUrgency: TriageUrgency = determineTriageCategory(
    textRedFlags,
    vitalsCheck.flags,
    step1CollectSymptoms.severity,
    step1CollectSymptoms.painScale
  );

  const urgencyLabels: Record<TriageUrgency, { ar: string; en: string }> = {
    EMERGENCY: { ar: 'طوارئ فورية (أحمر)', en: 'Immediate Emergency' },
    URGENT: { ar: 'رعاية عاجلة خلال 12-24 ساعة (برتقالي)', en: 'Urgent Care (12-24h)' },
    ROUTINE: { ar: 'استشارة عيادة روتينية (أصفر)', en: 'Routine Outpatient' },
    SELF_CARE: { ar: 'رعاية ذاتية ومراقبة (أخضر)', en: 'Self-Care & Monitoring' },
  };

  // ==========================================
  // STEP 4: GENERATE DIFFERENTIAL POSSIBILITIES
  // ==========================================
  let differentials = generateDifferentialPossibilities(
    step1CollectSymptoms,
    estimatedUrgency,
    allRedFlags.length
  );

  // ==========================================
  // STEP 6: VERIFY EVIDENCE (RAG)
  // ==========================================
  const evidenceSources = retrieveRelevantEvidence(fullTextToScan);

  const step6VerifyEvidence = {
    evidenceSources,
  };

  // ==========================================
  // EXPLAINABILITY SYNTHESIS (The 3 Pillars)
  // ==========================================
  const explainability = buildExplainabilityReport({
    urgency: estimatedUrgency,
    urgencyLabelAr: urgencyLabels[estimatedUrgency].ar,
    urgencyLabelEn: urgencyLabels[estimatedUrgency].en,
    redFlags: allRedFlags,
    painScale: step1CollectSymptoms.painScale,
    symptomsText: request.symptoms,
    nextQuestion: step2ClarifySymptoms.nextPriorityQuestion,
    differentials,
  });

  const step5EstimateUrgency = {
    urgency: estimatedUrgency,
    urgencyLabelAr: urgencyLabels[estimatedUrgency].ar,
    urgencyLabelEn: urgencyLabels[estimatedUrgency].en,
    rationaleAr: explainability.whyUrgencyLevel.rationaleAr,
    rationaleEn: explainability.whyUrgencyLevel.rationaleEn,
  };

  // ==========================================
  // STEP 7: GENERATE SAFE RESPONSE (Structured)
  // Structure:
  // 1. ملخص
  // 2. الأعراض التي تم فهمها
  // 3. ما الاحتمالات الممكنة
  // 4. علامات الخطر
  // 5. ماذا يمكن فعله الآن
  // 6. متى يجب مراجعة الطبيب
  // 7. المصادر عند وجودها
  // ==========================================

  // Map OLDCARTS into clean dictionary
  const oldcartsSummaryAr: Record<string, string> = {};
  const oldcartsSummaryEn: Record<string, string> = {};
  if (step1CollectSymptoms.oldcarts.onset) {
    oldcartsSummaryAr['البداية (Onset)'] = step1CollectSymptoms.oldcarts.onset;
    oldcartsSummaryEn['Onset'] = step1CollectSymptoms.oldcarts.onset;
  }
  if (step1CollectSymptoms.oldcarts.location) {
    oldcartsSummaryAr['الموقع (Location)'] = step1CollectSymptoms.oldcarts.location;
    oldcartsSummaryEn['Location'] = step1CollectSymptoms.oldcarts.location;
  }
  if (step1CollectSymptoms.oldcarts.duration) {
    oldcartsSummaryAr['المدة (Duration)'] = step1CollectSymptoms.oldcarts.duration;
    oldcartsSummaryEn['Duration'] = step1CollectSymptoms.oldcarts.duration;
  }
  if (step1CollectSymptoms.oldcarts.character) {
    oldcartsSummaryAr['طبيعة الألم (Character)'] = step1CollectSymptoms.oldcarts.character;
    oldcartsSummaryEn['Character'] = step1CollectSymptoms.oldcarts.character;
  }
  if (step1CollectSymptoms.oldcarts.aggravatingFactors?.length) {
    oldcartsSummaryAr['عوامل الزيادة (Aggravating)'] = step1CollectSymptoms.oldcarts.aggravatingFactors.join('، ');
    oldcartsSummaryEn['Aggravating'] = step1CollectSymptoms.oldcarts.aggravatingFactors.join(', ');
  }
  if (step1CollectSymptoms.oldcarts.relievingFactors?.length) {
    oldcartsSummaryAr['عوامل التخفيف (Relieving)'] = step1CollectSymptoms.oldcarts.relievingFactors.join('، ');
    oldcartsSummaryEn['Relieving'] = step1CollectSymptoms.oldcarts.relievingFactors.join(', ');
  }
  if (step1CollectSymptoms.oldcarts.timing) {
    oldcartsSummaryAr['النمط الزمني (Timing)'] = step1CollectSymptoms.oldcarts.timing;
    oldcartsSummaryEn['Timing'] = step1CollectSymptoms.oldcarts.timing;
  }
  if (step1CollectSymptoms.oldcarts.severity) {
    oldcartsSummaryAr['الشدة (Severity)'] = `${step1CollectSymptoms.oldcarts.severity} من 10`;
    oldcartsSummaryEn['Severity'] = `${step1CollectSymptoms.oldcarts.severity} / 10`;
  }

  // Base structured response
  let summaryAr = `بناءً على التقييم السريري للأعراض المقدمة (${chiefComplaint})، تم تصنيف مستوى الاستعجال كـ [${urgencyLabels[estimatedUrgency].ar}]. تم إخضاع الحالة لـ 7 خطوات استدلال سريري للتحقق من علامات الخطر وحصر الاحتمالات غير التشخيصية.`;
  let summaryEn = `Based on the clinical evaluation of (${chiefComplaint}), the presentation is stratified as [${urgencyLabels[estimatedUrgency].en}]. Processed through the 7-step clinical protocol to screen red flags and construct safe differential considerations.`;

  let immediateActionsAr: string[] = [];
  let immediateActionsEn: string[] = [];
  let timingAr = '';
  let timingEn = '';
  let criteriaAr: string[] = [];
  let criteriaEn: string[] = [];

  if (estimatedUrgency === 'EMERGENCY') {
    immediateActionsAr = [
      'التوقف فوراً عن أي نشاط بدني أو قيادة السيارة والجلوس في وضعية مريحة نصف مستلقية.',
      'طلب الإسعاف فوراً (الاتصال بـ 997 أو التوجه الفوري لأقرب طوارئ مستشفى).',
      'عدم تناول أي أطعمة دسمة أو مسكنات قوية قد تخفي الأعراض حتى وصول الفريق الطبي.',
    ];
    immediateActionsEn = [
      'Cease all physical exertion and sit in a comfortable semi-recumbent posture.',
      'Call emergency ambulance (997/911) or proceed immediately to nearest emergency room.',
      'Refrain from heavy meals or unprescribed pain medication pending medical team arrival.',
    ];
    timingAr = 'فوراً ودون أي تأخير (خلال دقائق).';
    timingEn = 'Immediately without any delay (within minutes).';
    criteriaAr = [
      'ألم ضاغط وثقل بالصدر مع تعرق بارد أو ضيق تنفس.',
      'فقدان وعي، تلعثم في الكلام، أو ضعف في أحد الأطراف.',
      'سعال مصحوب بدم أو صعوبة شديدة في التقاط الأنفاس.',
    ];
    criteriaEn = [
      'Crushing chest pressure with diaphoresis or dyspnea.',
      'Syncope, sudden speech slurring, or unilateral limb weakness.',
      'Hemoptysis or acute severe respiratory distress.',
    ];
  } else if (estimatedUrgency === 'URGENT') {
    immediateActionsAr = [
      'الاستراحة التامة في بيئة هادئة وتجنب الإجهاد البدني أو التوتر العصبي.',
      'مراقبة العلامات الحيوية (درجة الحرارة، ضغط الدم، ومعدل النبض إن أمكن).',
      'الحفاظ على شرب رشفات منتظمة من الماء أو السوائل الدافئة.',
    ];
    immediateActionsEn = [
      'Rest in a quiet environment and avoid physical or emotional stressors.',
      'Monitor basic vital signs (temperature, blood pressure, pulse rate if available).',
      'Maintain adequate hydration with regular sips of water.',
    ];
    timingAr = 'خلال 12 إلى 24 ساعة كحد أقصى.';
    timingEn = 'Within 12 to 24 hours at an urgent care clinic.';
    criteriaAr = [
      'استمرار الألم أو تفاقمه رغم الراحة التامة.',
      'ارتفاع درجة الحرارة فوق 38.5 درجة مئوية لأكثر من 24 ساعة.',
      'ظهور قيء متكرر يعيق القدرة على الاحتفاظ بالسوائل والأدوية.',
    ];
    criteriaEn = [
      'Progression of pain intensity despite rest.',
      'Persistent fever above 38.5°C lasting over 24 hours.',
      'Intractable vomiting precluding oral fluid retention.',
    ];
  } else {
    immediateActionsAr = [
      'الراحة المنزلية والنوم الكافي لدعم تعافي الجهاز المناعي.',
      'شرب كميات وافرة من السوائل المهدئة وتجنب المنبهات والمأكولات المهيجة.',
      'استخدام المسكنات البسيطة التي لا تستلزم وصفة (مثل الباراسيتامول) بجرعات محددة وآمنة عند الحاجة.',
    ];
    immediateActionsEn = [
      'Home rest and adequate sleep to support immune restoration.',
      'Plentiful soothing fluids and avoidance of caffeine or spicy irritants.',
      'Over-the-counter simple analgesics (e.g. Paracetamol) within safe labeled doses if needed.',
    ];
    timingAr = 'مراجعة عيادة الرعاية الأولية الروتينية في حال عدم التحسن خلال 3-5 أيام.';
    timingEn = 'Routine primary care appointment if no resolution within 3 to 5 days.';
    criteriaAr = [
      'استمرار الأعراض لأكثر من 5 أيام دون تراجع ملحوظ.',
      'تغير طبيعة العَرَض أو ظهور ألم حاد جديد غير مألوف.',
    ];
    criteriaEn = [
      'Symptom persistence beyond 5 days without regression.',
      'Qualitative shift or emergence of new localized acute pain.',
    ];
  }

  // Attempt dynamic Gemini enrichment for nuanced probabilistic explanations if API key exists
  const ai = getGenAI();
  if (ai) {
    try {
      const prompt = `
You are the Senior Clinical Reasoning Engine of OmniDoctor AI.
The patient presented with:
- Chief Symptoms: ${chiefComplaint}
- Full Input: ${request.symptoms}
- OLDCARTS Extracted: ${JSON.stringify(step1CollectSymptoms.oldcarts)}
- Triage Urgency Level: ${estimatedUrgency}
- Red Flags: ${allRedFlags.map(r => r.nameEn).join(', ') || 'None'}
- Differentials: ${differentials.map(d => d.nameEn).join(', ')}
- Verified Guidelines: ${evidenceSources.map(e => e.titleEn).join(', ')}

MANDATES:
1. NEVER offer a definitive diagnosis. Maintain strict probabilistic phrasing ("قد يتوافق مع", "احتمال سريري محتمل للنظر").
2. Formulate a rich, empathetic, non-diagnostic clinical summary.
3. Polish the actionable advice and specific criteria for seeing a doctor.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction:
            'You are OmniDoctor AI Clinical Reasoning Engine. Strictly adhere to medical explainability, probabilistic non-diagnostic formulation, and patient safety.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryAr: { type: Type.STRING },
              summaryEn: { type: Type.STRING },
              immediateActionsAr: { type: Type.ARRAY, items: { type: Type.STRING } },
              immediateActionsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
              timingAr: { type: Type.STRING },
              timingEn: { type: Type.STRING },
              criteriaAr: { type: Type.ARRAY, items: { type: Type.STRING } },
              criteriaEn: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['summaryAr', 'summaryEn', 'immediateActionsAr', 'timingAr'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.summaryAr) summaryAr = parsed.summaryAr;
      if (parsed.summaryEn) summaryEn = parsed.summaryEn;
      if (parsed.immediateActionsAr?.length) immediateActionsAr = parsed.immediateActionsAr;
      if (parsed.immediateActionsEn?.length) immediateActionsEn = parsed.immediateActionsEn;
      if (parsed.timingAr) timingAr = parsed.timingAr;
      if (parsed.timingEn) timingEn = parsed.timingEn;
      if (parsed.criteriaAr?.length) criteriaAr = parsed.criteriaAr;
      if (parsed.criteriaEn?.length) criteriaEn = parsed.criteriaEn;
    } catch (err: any) {
      console.warn('Gemini 3.7 Flash clinical reasoning enrichment fallback:', err?.message);
    }
  }

  const formattedFinalResponse: ClinicalFinalResponse = {
    summaryAr,
    summaryEn,
    understoodSymptoms: {
      chiefSymptomAr: chiefComplaint,
      chiefSymptomEn: chiefComplaint,
      oldcartsSummaryAr,
      oldcartsSummaryEn,
      associatedSymptomsAr: step1CollectSymptoms.associatedSymptoms,
      associatedSymptomsEn: step1CollectSymptoms.associatedSymptoms,
      medicationsNoteAr: step1CollectSymptoms.medicationContext.length > 0
        ? `الأدوية المرصودة في السياق: ${step1CollectSymptoms.medicationContext.join('، ')}`
        : 'لا توجد أدوية خاصة مذكورة في هذا السياق.',
      medicationsNoteEn: step1CollectSymptoms.medicationContext.length > 0
        ? `Documented medications: ${step1CollectSymptoms.medicationContext.join(', ')}`
        : 'No specific medications noted in this clinical context.',
      medicalHistoryNoteAr: consentGranted
        ? (step1CollectSymptoms.medicalHistoryContext.length > 0
            ? `التاريخ الصحي المضمن بموافقة المريض: ${step1CollectSymptoms.medicalHistoryContext.join('، ')}`
            : 'تم التحقق من الملف الصحي بموافقة المريض ولا توجد سوابق حرجة مسجلة.')
        : 'لم يتم تضمين السجل المرضي السابق (موافقة المريض مطلوبة لربط السجل الصحي).',
      medicalHistoryNoteEn: consentGranted
        ? (step1CollectSymptoms.medicalHistoryContext.length > 0
            ? `Patient medical history integrated with consent: ${step1CollectSymptoms.medicalHistoryContext.join(', ')}`
            : 'Verified medical record with patient consent; no acute past entries noted.')
        : 'Past medical history excluded (explicit patient consent required).',
    },
    possibleDifferentials: differentials,
    redFlagsSummary: allRedFlags.map(rf => ({
      nameAr: rf.nameAr,
      nameEn: rf.nameEn,
      urgency: rf.urgency,
      actionAr: rf.actionAr,
      actionEn: rf.actionEn,
      isTriggered: true,
    })),
    immediateActions: {
      actionsAr: immediateActionsAr,
      actionsEn: immediateActionsEn,
    },
    whenToSeeDoctor: {
      timingAr,
      timingEn,
      criteriaAr,
      criteriaEn,
    },
    sources: evidenceSources,
  };

  return {
    encounterId,
    timestamp,
    requestText: request.symptoms,
    consentGranted,
    step1CollectSymptoms,
    step2ClarifySymptoms,
    step3DetectRedFlags,
    step4GenerateDifferentials: {
      differentials,
    },
    step5EstimateUrgency,
    step6VerifyEvidence,
    step7GenerateSafeResponse: {
      finalResponse: formattedFinalResponse,
    },
    explainability,
  };
}
