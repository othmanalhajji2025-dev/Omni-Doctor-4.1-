import { ExtractedSymptomData } from '../types/medical.js';
import { extractOLDCARTSFromText } from './oldcartsEngine.js';

export interface RawExtractionInput {
  text: string;
  duration?: string;
  severity?: string;
  painScale?: number;
  location?: string;
  associatedSymptoms?: string[];
  medications?: string[];
  medicalHistory?: string[];
  patientConsent?: boolean;
}

/**
 * Robust Symptom & Clinical Context Extractor
 * Extracts: Symptoms, Duration, Severity, Location, Associated Symptoms,
 * Medication Context, Medical History (gated by explicit patient consent).
 */
export function extractSymptomData(input: RawExtractionInput): ExtractedSymptomData {
  const text = input.text || '';
  const normalized = text.toLowerCase();

  // 1. Extract chief symptoms from text
  const detectedSymptoms: string[] = [];

  const symptomDictionary: Array<{ keywords: string[]; labelAr: string }> = [
    { keywords: ['ألم بالصدر', 'ألم في الصدر', 'ثقل بالصدر', 'chest pain', 'chest pressure'], labelAr: 'ألم ضاغط في منطقة الصدر' },
    { keywords: ['ضيق تنفس', 'صعوبة تنفس', 'كتمة', 'shortness of breath', 'dyspnea'], labelAr: 'ضيق وصعوبة في التنفس' },
    { keywords: ['صداع', 'وجع رأس', 'headache', 'migraine', 'نصف رأسي'], labelAr: 'صداع رأسي' },
    { keywords: ['ألم بطن', 'مغص', 'ألم بالمعدة', 'abdominal pain', 'stomach ache'], labelAr: 'ألم وتقلصات بطنية' },
    { keywords: ['سعال', 'كحة', 'cough'], labelAr: 'سعال' },
    { keywords: ['احتقان بالحلق', 'ألم بالحلق', 'التهاب حلق', 'sore throat'], labelAr: 'احتقان والتهاب الحلق' },
    { keywords: ['حمى', 'سخونة', 'حرارة مرتفعة', 'fever'], labelAr: 'حمى وارتفاع درجة الحرارة' },
    { keywords: ['خفقان', 'تسارع نبض', 'palpitations', 'heart racing'], labelAr: 'خفقان وتسارع نبضات القلب' },
    { keywords: ['دوخة', 'دوار', 'dizziness', 'lightheadedness'], labelAr: 'دوخة وشعور بعدم الاتزان' },
    { keywords: ['غثيان', 'لوعة كبد', 'nausea'], labelAr: 'غثيان' },
    { keywords: ['استفراغ', 'قيء', 'vomiting'], labelAr: 'قيء واستفراغ' },
    { keywords: ['إسهال', 'diarrhea'], labelAr: 'إسهال' },
    { keywords: ['تنميل', 'خدران', 'numbness', 'tingling'], labelAr: 'تنميل وخدر بالأطراف' },
    { keywords: ['طفح جلدي', 'حكة', 'rash', 'itching'], labelAr: 'طفح جلدي وحكة' },
    { keywords: ['ألم مفاصل', 'تصلب مفاصل', 'joint pain'], labelAr: 'ألم وتصلب بالمفاصل' },
    { keywords: ['ألم في الخاصرة', 'مغص كلوي', 'flank pain', 'kidney pain'], labelAr: 'ألم حاد في الخاصرة / مغص كلوي' },
  ];

  for (const item of symptomDictionary) {
    if (item.keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
      if (!detectedSymptoms.includes(item.labelAr)) {
        detectedSymptoms.push(item.labelAr);
      }
    }
  }

  // If none matched from dictionary, use the first sentence or text fragment
  if (detectedSymptoms.length === 0 && text.trim().length > 0) {
    const summaryFragment = text.split(/[.\n،,]/)[0].trim();
    if (summaryFragment.length > 0) {
      detectedSymptoms.push(summaryFragment);
    }
  }

  // 2. Associated Symptoms
  const detectedAssociated: string[] = input.associatedSymptoms ? [...input.associatedSymptoms] : [];
  const associatedCatalog: Array<{ keywords: string[]; labelAr: string }> = [
    { keywords: ['تعرق بارد', 'عرق بارد', 'cold sweat'], labelAr: 'تعرق بارد غزير' },
    { keywords: ['غثيان', 'لوعة', 'nausea'], labelAr: 'غثيان' },
    { keywords: ['حساسية من الضوء', 'انزعاج من الضوء', 'photophobia'], labelAr: 'انزعاج وحساسية من الضوء' },
    { keywords: ['حساسية من الصوت', 'انزعاج من الصوت', 'phonophobia'], labelAr: 'انزعاج من الأصوات العالية' },
    { keywords: ['إرهاق', 'تعب عام', 'تكسير بالجسم', 'fatigue', 'malaise'], labelAr: 'إرهاق وخمول عام' },
    { keywords: ['فقدان شهية', 'loss of appetite'], labelAr: 'فقدان الشهية' },
    { keywords: ['بلغم', 'كحة مع بلغم', 'phlegm', 'sputum'], labelAr: 'إفرازات بلغمية' },
    { keywords: ['قشعريرة', 'رجفة', 'chills', 'rigors'], labelAr: 'قشعريرة ورعشة' },
    { keywords: ['انتفاخ', 'غازات', 'bloating'], labelAr: 'انتفاخ وغازات في البطن' },
  ];

  for (const item of associatedCatalog) {
    if (item.keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
      if (!detectedAssociated.includes(item.labelAr)) {
        detectedAssociated.push(item.labelAr);
      }
    }
  }

  // 3. Extract Medication Context (from text mentions or provided context)
  const medicationContext: string[] = input.medications ? [...input.medications] : [];
  const medKeywords: Array<{ keywords: string[]; labelAr: string }> = [
    { keywords: ['أسبرين', 'aspirin'], labelAr: 'أسبرين (Aspirin)' },
    { keywords: ['وارفارين', 'مسيل دم', 'warfarin', 'blood thinner'], labelAr: 'مضاد تخثر / مسيل دم' },
    { keywords: ['ميتفورمين', 'جلوكوفاج', 'metformin', 'glucophage'], labelAr: 'ميتفورمين (علاج السكري)' },
    { keywords: ['أملوديبين', 'كونكور', 'دواء ضغط', 'amlodipine', 'concor'], labelAr: 'خافض لضغط الدم' },
    { keywords: ['إنسولين', 'insulin'], labelAr: 'إنسولين' },
    { keywords: ['بخاخ ربو', 'فنتولين', 'ventolin', 'inhaler'], labelAr: 'موسع قصبات (فنتولين)' },
    { keywords: ['بروفين', 'ايبوبروفين', 'ibuprofen', 'brufen'], labelAr: 'مضاد التهاب غير ستيرويدي (إيبوبروفين)' },
    { keywords: ['بنادول', 'باراسيتامول', 'panadol', 'paracetamol'], labelAr: 'مسكن باراسيتامول' },
  ];

  for (const m of medKeywords) {
    if (m.keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
      if (!medicationContext.includes(m.labelAr)) {
        medicationContext.push(m.labelAr);
      }
    }
  }

  // 4. Medical History Context (Strictly gated by patient consent!)
  const consentGranted = input.patientConsent === true;
  let medicalHistoryContext: string[] = [];

  if (consentGranted) {
    if (input.medicalHistory && input.medicalHistory.length > 0) {
      medicalHistoryContext = [...input.medicalHistory];
    } else {
      // Scan text for declared history
      const historyKeywords: Array<{ keywords: string[]; labelAr: string }> = [
        { keywords: ['مريض سكر', 'عندي سكري', 'diabetes'], labelAr: 'داء السكري' },
        { keywords: ['مريض ضغط', 'عندي ضغط', 'hypertension'], labelAr: 'ارتفاع ضغط الدم الشرياني' },
        { keywords: ['مريض ربو', 'عندي ربو', 'asthma'], labelAr: 'الربو القصبي المزمن' },
        { keywords: ['جلطة سابقة', 'قلب', 'heart disease'], labelAr: 'سوابق أمراض قلبية وعائية' },
        { keywords: ['قرحة معدة', 'حموضة مزمنة', 'peptic ulcer'], labelAr: 'قرحة هضمية / ارتجاع مريئي' },
      ];
      for (const h of historyKeywords) {
        if (h.keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
          if (!medicalHistoryContext.includes(h.labelAr)) {
            medicalHistoryContext.push(h.labelAr);
          }
        }
      }
    }
  }

  // 5. Extract OLDCARTS
  const oldcarts = extractOLDCARTSFromText(text);

  // Overlay structured input if provided
  if (input.duration && !oldcarts.duration) {
    oldcarts.duration = input.duration;
  }
  if (input.painScale && !oldcarts.severity) {
    oldcarts.severity = input.painScale;
  }
  if (input.location && !oldcarts.location) {
    oldcarts.location = input.location;
  }

  return {
    symptoms: detectedSymptoms,
    duration: oldcarts.duration || input.duration,
    severity: input.severity || (oldcarts.severity ? (oldcarts.severity >= 8 ? 'SEVERE' : oldcarts.severity >= 4 ? 'MODERATE' : 'MILD') : undefined),
    painScale: oldcarts.severity || input.painScale,
    location: oldcarts.location || input.location,
    associatedSymptoms: detectedAssociated,
    medicationContext,
    medicalHistoryContext,
    consentGranted,
    oldcarts,
  };
}
