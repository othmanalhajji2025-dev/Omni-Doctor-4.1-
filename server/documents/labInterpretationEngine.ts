import {
  LabStatus,
  ReferenceRange,
  PatientLabContext,
  ExtractedLabItem,
} from './types.js';

export interface BiomarkerDefinition {
  canonicalId: string;
  nameEn: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  aliases: string[];
  defaultUnit: string;
  alternateUnits: {
    unit: string;
    conversionFactorToDefault: number; // multiply alt unit value by this to get default
  }[];
  referenceRanges: {
    ageGroup: 'INFANT' | 'CHILD' | 'ADOLESCENT' | 'ADULT' | 'GERIATRIC' | 'ALL';
    sex: 'ALL' | 'MALE' | 'FEMALE';
    min: number;
    max: number;
    textRange: string;
    textRangeAr: string;
    criticalLow?: number;
    criticalHigh?: number;
  }[];
  clinicalSignificance: {
    highEn: string;
    highAr: string;
    lowEn: string;
    lowAr: string;
    criticalEn: string;
    criticalAr: string;
  };
  contextAlerts?: {
    condition: string;
    alertEn: string;
    alertAr: string;
  }[];
}

export const BIOMARKER_DATABASE: BiomarkerDefinition[] = [
  // 1. Glycemic / Diabetes Panel
  {
    canonicalId: 'fasting_glucose',
    nameEn: 'Fasting Blood Glucose',
    nameAr: 'سكر الدم الصائم',
    category: 'Diabetes & Metabolism',
    categoryAr: 'السكري والتمثيل الغذائي',
    aliases: [
      'fasting glucose',
      'fasting blood sugar',
      'fbs',
      'glucose fasting',
      'blood sugar',
      'سكر صائم',
      'السكر الصائم',
      'جلوكوز الدم',
    ],
    defaultUnit: 'mg/dL',
    alternateUnits: [
      { unit: 'mmol/L', conversionFactorToDefault: 18.0182 },
      { unit: 'mg/100ml', conversionFactorToDefault: 1 },
    ],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 70,
        max: 99,
        textRange: '70 - 99 mg/dL (3.9 - 5.5 mmol/L)',
        textRangeAr: '70 - 99 ملغ/ديسيلتر (3.9 - 5.5 مليمول/لتر)',
        criticalLow: 45,
        criticalHigh: 400,
      },
    ],
    clinicalSignificance: {
      highEn: 'Hyperglycemia: Impaired fasting glucose (100-125 mg/dL) or provisional diabetic range (≥126 mg/dL). Requires confirmatory testing and HbA1c correlation.',
      highAr: 'ارتفاع سكر الدم: قد يشير لمرحلة ما قبل السكري (100-125) أو نطاق داء السكري (≥126). يتطلب إعادة الفحص وتأكيد التراكمي، ولا يُشخص السكري من قراءة واحدة.',
      lowEn: 'Hypoglycemia (<70 mg/dL): Risk of adrenergic/neuroglycopenic symptoms. Immediate carbohydrate intake recommended if symptomatic.',
      lowAr: 'هبوط سكر الدم (<70): خطر ظهور أعراض الهبوط والدوخة. يلزم تناول سكريات سريعة فوراً إذا صاحبتها أعراض.',
      criticalEn: 'Critical Glucose Crisis: Risk of diabetic ketoacidosis (DKA), hyperosmolar hyperglycemic state (HHS), or severe neuroglycopenic coma.',
      criticalAr: 'حالة حرجة لسكر الدم: خطر الحماض الكيتوني، الغيبوبة السكرية أو فقدان الوعي الحاد.',
    },
    contextAlerts: [
      {
        condition: 'Diabetes',
        alertEn: 'In known diabetic patients, target fasting glucose is individualized (typically 80-130 mg/dL per ADA guidelines).',
        alertAr: 'لمرضى السكري المشخصين: النطاق المستهدف الصائم عادة ما بين 80-130 ملغ/ديسيلتر وفق إرشادات الجمعية الأمريكية للسكري.',
      },
    ],
  },
  {
    canonicalId: 'hba1c',
    nameEn: 'Hemoglobin A1c (Glycated Hb)',
    nameAr: 'السكر التراكمي (الهيموجلوبين السكري)',
    category: 'Diabetes & Metabolism',
    categoryAr: 'السكري والتمثيل الغذائي',
    aliases: ['hba1c', 'a1c', 'glycated hemoglobin', 'glycohemoglobin', 'السكر التراكمي', 'التراكمي', 'هيموجلوبين a1c'],
    defaultUnit: '%',
    alternateUnits: [{ unit: 'mmol/mol', conversionFactorToDefault: 0.09148 }], // IFCC to DCCT approx
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 4.0,
        max: 5.6,
        textRange: '< 5.7% (Normal), 5.7 - 6.4% (Prediabetes), ≥ 6.5% (Diabetes threshold)',
        textRangeAr: '< 5.7% (طبيعي)، 5.7 - 6.4% (ما قبل السكري)، ≥ 6.5% (عتبة السكري)',
        criticalLow: 3.5,
        criticalHigh: 12.0,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated HbA1c reflects average blood glucose over the past 2-3 months. 5.7-6.4% indicates prediabetes; ≥6.5% warrants clinical evaluation and confirmatory repeat.',
      highAr: 'يعكس متوسط مستوى السكر في الدم خلال 2-3 أشهر السابقة. 5.7-6.4% يشير لمرحلة ما قبل السكري، و6.5% فأكثر يتطلب تقييماً طبياً وتأكيداً.',
      lowEn: 'Low HbA1c may occur with recurrent hypoglycemia, shortened RBC lifespan (hemolytic anemia, hemoglobinopathies), or recent heavy bleeding.',
      lowAr: 'انخفاض التراكمي قد يحدث نتيجة نوبات هبوط متكررة، أو قصر عمر كريات الدم الحمراء (فقر دم انحلالي)، أو اعتلالات الهيموجلوبين.',
      criticalEn: 'Severely elevated HbA1c (>10%) indicates chronic severe glycemic dysregulation with heightened microvascular and macrovascular risks.',
      criticalAr: 'ارتفاع شديد للتراكمي (>10%) يدل على اضطراب مزمن وحاد في ضبط السكر مع ارتفاع مخاطر مضاعفات الأوعية الدموية.',
    },
  },

  // 2. Complete Blood Count (CBC)
  {
    canonicalId: 'hemoglobin',
    nameEn: 'Hemoglobin (Hb)',
    nameAr: 'الهيموجلوبين (خضاب الدم)',
    category: 'Complete Blood Count (CBC)',
    categoryAr: 'تعداد الدم الكامل (CBC)',
    aliases: ['hemoglobin', 'hb', 'hgb', 'خضاب الدم', 'الهيموجلوبين', 'نسبة الدم'],
    defaultUnit: 'g/dL',
    alternateUnits: [
      { unit: 'g/L', conversionFactorToDefault: 0.1 },
      { unit: 'mmol/L', conversionFactorToDefault: 1.611 },
    ],
    referenceRanges: [
      {
        ageGroup: 'INFANT',
        sex: 'ALL',
        min: 14.0,
        max: 20.0,
        textRange: '14.0 - 20.0 g/dL (Infants)',
        textRangeAr: '14.0 - 20.0 غ/ديسيلتر (الرضع)',
        criticalLow: 8.0,
        criticalHigh: 22.0,
      },
      {
        ageGroup: 'CHILD',
        sex: 'ALL',
        min: 11.5,
        max: 14.5,
        textRange: '11.5 - 14.5 g/dL (Children 1-12y)',
        textRangeAr: '11.5 - 14.5 غ/ديسيلتر (الأطفال)',
        criticalLow: 7.0,
        criticalHigh: 18.0,
      },
      {
        ageGroup: 'ADULT',
        sex: 'MALE',
        min: 13.5,
        max: 17.5,
        textRange: '13.5 - 17.5 g/dL (Adult Male)',
        textRangeAr: '13.5 - 17.5 غ/ديسيلتر (الذكور البالغين)',
        criticalLow: 7.0,
        criticalHigh: 20.0,
      },
      {
        ageGroup: 'ADULT',
        sex: 'FEMALE',
        min: 12.0,
        max: 15.5,
        textRange: '12.0 - 15.5 g/dL (Adult Female)',
        textRangeAr: '12.0 - 15.5 غ/ديسيلتر (الإناث البالغات)',
        criticalLow: 7.0,
        criticalHigh: 19.0,
      },
      {
        ageGroup: 'GERIATRIC',
        sex: 'MALE',
        min: 12.5,
        max: 17.0,
        textRange: '12.5 - 17.0 g/dL (Elderly Male)',
        textRangeAr: '12.5 - 17.0 غ/ديسيلتر (كبار السن الذكور)',
        criticalLow: 7.0,
        criticalHigh: 19.5,
      },
      {
        ageGroup: 'GERIATRIC',
        sex: 'FEMALE',
        min: 11.5,
        max: 15.0,
        textRange: '11.5 - 15.0 g/dL (Elderly Female)',
        textRangeAr: '11.5 - 15.0 غ/ديسيلتر (كبار السن الإناث)',
        criticalLow: 7.0,
        criticalHigh: 18.5,
      },
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 12.0,
        max: 17.0,
        textRange: '12.0 - 17.0 g/dL',
        textRangeAr: '12.0 - 17.0 غ/ديسيلتر',
        criticalLow: 7.0,
        criticalHigh: 20.0,
      },
    ],
    clinicalSignificance: {
      highEn: 'Polycythemia: May indicate dehydration, chronic hypoxia (smoking, COPD, high altitude), or myeloproliferative disorders.',
      highAr: 'كثرة الحمر: قد ترجع للجفاف، أو نقص الأكسجين المزمن (التدخين، الانسداد الرئوي، المرتفعات)، أو أمراض نخاع العظم.',
      lowEn: 'Anemia: Consider iron deficiency, vitamin B12/folate deficiency, chronic disease, hemolysis, or occult blood loss. Investigate MCV and ferritin.',
      lowAr: 'فقر الدم (الأنيميا): قد ينتج عن نقص الحديد، نقص B12/الفوليك، الأمراض المزمنة، أو النزيف الخفي. يلزم فحص الحجم الكروي ومخزون الحديد.',
      criticalEn: 'Critical Anemia (Hb < 7.0 g/dL): Risk of hemodynamic instability, myocardial ischemia, or heart failure. Urgent clinical evaluation/transfusion threshold.',
      criticalAr: 'فقر دم حرج ومهدد (أقل من 7): خطر قصور تروية القلب ونقص الأكسجين الحاد، يتطلب تقييماً إسعافياً ونقل دم فوري.',
    },
  },
  {
    canonicalId: 'wbc',
    nameEn: 'White Blood Cell Count (WBC)',
    nameAr: 'تعداد كريات الدم البيضاء',
    category: 'Complete Blood Count (CBC)',
    categoryAr: 'تعداد الدم الكامل (CBC)',
    aliases: ['wbc', 'white blood cells', 'leukocyte count', 'leukocytes', 'كريات الدم البيضاء', 'كرات الدم البيضاء'],
    defaultUnit: 'x10^3/uL',
    alternateUnits: [
      { unit: 'x10^9/L', conversionFactorToDefault: 1 },
      { unit: '/uL', conversionFactorToDefault: 0.001 },
      { unit: '/mm3', conversionFactorToDefault: 0.001 },
    ],
    referenceRanges: [
      {
        ageGroup: 'INFANT',
        sex: 'ALL',
        min: 6.0,
        max: 17.5,
        textRange: '6.0 - 17.5 x10^3/uL (Infants)',
        textRangeAr: '6.0 - 17.5 ألف/ميكرولتر (الرضع)',
        criticalLow: 2.0,
        criticalHigh: 30.0,
      },
      {
        ageGroup: 'CHILD',
        sex: 'ALL',
        min: 5.0,
        max: 14.5,
        textRange: '5.0 - 14.5 x10^3/uL (Children)',
        textRangeAr: '5.0 - 14.5 ألف/ميكرولتر (الأطفال)',
        criticalLow: 2.0,
        criticalHigh: 25.0,
      },
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 4.0,
        max: 11.0,
        textRange: '4.0 - 11.0 x10^3/uL (4,000 - 11,000 /uL)',
        textRangeAr: '4.0 - 11.0 ألف/ميكرولتر (4,000 - 11,000 /ميكرولتر)',
        criticalLow: 2.0,
        criticalHigh: 30.0,
      },
    ],
    clinicalSignificance: {
      highEn: 'Leukocytosis: Suggests bacterial/viral infection, systemic inflammation, tissue injury, corticosteroid therapy, or hematologic process.',
      highAr: 'ارتفاع كرات الدم البيضاء: يشير غالباً لعدوى بكتيرية أو فيروسية، التهاب جهازي، إجهاد فيزيولوجي، أدوية الكورتيزون، أو اعتلالات دموية.',
      lowEn: 'Leukopenia: Risk of infection. Causes include viral infections, autoimmune disorders, bone marrow suppression, or medication toxicity.',
      lowAr: 'نقص كرات الدم البيضاء: يزيد خطر العدوى. يسببه عدوى فيروسية، أمراض مناعية، تثبيط نخاع العظم، أو تأثيرات جانبية للأدوية.',
      criticalEn: 'Critical Leukopenia (<2.0) with neutropenia risks severe sepsis; extreme Leukocytosis (>30.0) requires urgent exclusion of leukemoid reaction or leukemia.',
      criticalAr: 'نقص حرج (<2.0) يهدد بتجرثم الدم، بينما الارتفاع الشديد (>30.0) يتطلب استبعاد التفاعلات اللوكيمية الحادة فوراً.',
    },
  },
  {
    canonicalId: 'platelets',
    nameEn: 'Platelet Count (PLT)',
    nameAr: 'تعداد الصفائح الدموية',
    category: 'Complete Blood Count (CBC)',
    categoryAr: 'تعداد الدم الكامل (CBC)',
    aliases: ['platelets', 'plt', 'platelet count', 'thrombocytes', 'الصفائح الدموية', 'الصفائح'],
    defaultUnit: 'x10^3/uL',
    alternateUnits: [
      { unit: 'x10^9/L', conversionFactorToDefault: 1 },
      { unit: '/uL', conversionFactorToDefault: 0.001 },
      { unit: '/mm3', conversionFactorToDefault: 0.001 },
    ],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 150,
        max: 450,
        textRange: '150 - 450 x10^3/uL',
        textRangeAr: '150 - 450 ألف/ميكرولتر',
        criticalLow: 20,
        criticalHigh: 1000,
      },
    ],
    clinicalSignificance: {
      highEn: 'Thrombocytosis: Reactive to acute infection, inflammation, iron deficiency, splenectomy, or primary myeloproliferative neoplasm.',
      highAr: 'كثرة الصفائح: تفاعلي نتيجة التهاب أو عدوى أو نقص حديد، أو اضطراب تكاثري في نخاع العظم.',
      lowEn: 'Thrombocytopenia: Increased bleeding risk. Differential includes ITP, drug-induced, viral infections (Dengue, Hepatitis), hypersplenism, or bone marrow disease.',
      lowAr: 'نقص الصفائح: يرفع خطر النزيف. يشمل الأسباب المناعية (ITP)، الأدوية، الفيروسات كحمى الضنك، تضخم الطحال، أو أمراض النخاع.',
      criticalEn: 'Critical Thrombocytopenia (<20 x10^3/uL): High risk of spontaneous fatal intracranial or gastrointestinal hemorrhage.',
      criticalAr: 'نقص حرج في الصفائح (<20 ألف): خطر شديد للنزيف التلقائي في الدماغ أو الجهاز الهضمي، يتطلب تدخلاً فورياً.',
    },
  },

  // 3. Renal & Electrolytes Panel
  {
    canonicalId: 'creatinine',
    nameEn: 'Serum Creatinine',
    nameAr: 'الكرياتينين في مصل الدم',
    category: 'Renal Function',
    categoryAr: 'وظائف الكلى',
    aliases: ['creatinine', 'serum creatinine', 'creat', 'cr', 'الكرياتينين', 'وظائف الكلى كراتينين'],
    defaultUnit: 'mg/dL',
    alternateUnits: [
      { unit: 'umol/L', conversionFactorToDefault: 0.01131 },
      { unit: 'µmol/L', conversionFactorToDefault: 0.01131 },
    ],
    referenceRanges: [
      {
        ageGroup: 'INFANT',
        sex: 'ALL',
        min: 0.2,
        max: 0.4,
        textRange: '0.2 - 0.4 mg/dL (Infants)',
        textRangeAr: '0.2 - 0.4 ملغ/ديسيلتر (الرضع)',
        criticalLow: 0.1,
        criticalHigh: 1.5,
      },
      {
        ageGroup: 'CHILD',
        sex: 'ALL',
        min: 0.3,
        max: 0.7,
        textRange: '0.3 - 0.7 mg/dL (Children 1-12y)',
        textRangeAr: '0.3 - 0.7 ملغ/ديسيلتر (الأطفال)',
        criticalLow: 0.1,
        criticalHigh: 2.0,
      },
      {
        ageGroup: 'ADULT',
        sex: 'MALE',
        min: 0.7,
        max: 1.3,
        textRange: '0.7 - 1.3 mg/dL (Adult Male)',
        textRangeAr: '0.7 - 1.3 ملغ/ديسيلتر (الذكور البالغين)',
        criticalLow: 0.3,
        criticalHigh: 5.0,
      },
      {
        ageGroup: 'ADULT',
        sex: 'FEMALE',
        min: 0.5,
        max: 1.1,
        textRange: '0.5 - 1.1 mg/dL (Adult Female)',
        textRangeAr: '0.5 - 1.1 ملغ/ديسيلتر (الإناث البالغات)',
        criticalLow: 0.3,
        criticalHigh: 4.5,
      },
      {
        ageGroup: 'GERIATRIC',
        sex: 'ALL',
        min: 0.6,
        max: 1.2,
        textRange: '0.6 - 1.2 mg/dL (Elderly)',
        textRangeAr: '0.6 - 1.2 ملغ/ديسيلتر (كبار السن)',
        criticalLow: 0.3,
        criticalHigh: 4.0,
      },
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 0.6,
        max: 1.2,
        textRange: '0.6 - 1.2 mg/dL',
        textRangeAr: '0.6 - 1.2 ملغ/ديسيلتر',
        criticalLow: 0.3,
        criticalHigh: 5.0,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated Creatinine indicates decreased Glomerular Filtration Rate (GFR), acute kidney injury (AKI), chronic kidney disease (CKD), or severe dehydration.',
      highAr: 'ارتفاع الكرياتينين يدل على انخفاض معدل ترشيح الكلى، قصور كلوي حاد أو مزمن، أو جفاف شديد. يتطلب حساب معدل الترشيح (eGFR).',
      lowEn: 'Low Creatinine is usually clinically benign, often reflecting low muscle mass, advanced liver disease, or malnutrition.',
      lowAr: 'انخفاض الكرياتينين غير مقلق عادة، ويرتبط بنقص الكتلة العضلية أو سوء التغذية أو أمراض الكبد المتقدمة.',
      criticalEn: 'Critical Renal Impairment (Creatinine > 4.0 mg/dL or acute doubling): Risk of uremic encephalopathy, hyperkalemia, and fluid overload.',
      criticalAr: 'قصور كلوي حرج: خطر تراكم اليوريميا واضطراب البوتاسيوم والحموضة، يتطلب تقييماً كلوياً عاجلاً.',
    },
    contextAlerts: [
      {
        condition: 'Hypertension',
        alertEn: 'Hypertension is both a cause and consequence of kidney disease. Monitor urine protein and GFR closely.',
        alertAr: 'ارتفاع ضغط الدم سبب ونتيجة لاعتلال الكلى؛ يوصى بمراقبة الزلال ومعدل الترشيح.',
      },
      {
        condition: 'Diabetes',
        alertEn: 'Diabetic kidney disease requires monitoring of urine albumin-to-creatinine ratio (uACR) alongside serum creatinine.',
        alertAr: 'اعتلال الكلى السكري يتطلب فحص زلال البول التراكمي (uACR) بانتظام بجانب كرياتينين الدم.',
      },
    ],
  },
  {
    canonicalId: 'potassium',
    nameEn: 'Serum Potassium (K+)',
    nameAr: 'البوتاسيوم في مصل الدم',
    category: 'Renal & Electrolytes',
    categoryAr: 'الكلى والأملاح والمعادن',
    aliases: ['potassium', 'k+', 'k', 'serum potassium', 'البوتاسيوم', 'املاح البوتاسيوم'],
    defaultUnit: 'mEq/L',
    alternateUnits: [
      { unit: 'mmol/L', conversionFactorToDefault: 1 },
    ],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 3.5,
        max: 5.1,
        textRange: '3.5 - 5.1 mEq/L (mmol/L)',
        textRangeAr: '3.5 - 5.1 ملليمكافئ/لتر',
        criticalLow: 2.8,
        criticalHigh: 6.2,
      },
    ],
    clinicalSignificance: {
      highEn: 'Hyperkalemia: Risk of lethal cardiac arrhythmias (peaked T waves, heart block, VFib). Causes include renal failure, ACEi/ARBs, acidosis, cell lysis.',
      highAr: 'فرط البوتاسيوم: خطر مهدد للحياة باضطراب نظم القلب القاتل. تسببه أمراض الكلى، بعض أدوية الضغط، الحموضة أو تكسر الخلايا.',
      lowEn: 'Hypokalemia: Muscle weakness, cramps, ileus, cardiac arrhythmias (flattened T waves, U waves). Causes include diuretics, GI losses, alkalosis.',
      lowAr: 'نقص البوتاسيوم: ضعف العضلات والتقلصات، اضطراب نبضات القلب. تسببه مدرات البول، القيء والإسهال، أو قلة المدخول.',
      criticalEn: 'Critical Potassium (<2.8 or >6.2 mEq/L): Immediate emergency risk of cardiac arrest. Stat ECG and emergency intervention indicated.',
      criticalAr: 'مستوى حرج وخطير للبوتاسيوم (<2.8 أو >6.2): خطر توقف القلب فوراً؛ يتطلب تخطيط قلب إسعافي وعلاجاً طارئاً دون تأخير.',
    },
  },
  {
    canonicalId: 'sodium',
    nameEn: 'Serum Sodium (Na+)',
    nameAr: 'الصوديوم في مصل الدم',
    category: 'Renal & Electrolytes',
    categoryAr: 'الكلى والأملاح والمعادن',
    aliases: ['sodium', 'na+', 'na', 'serum sodium', 'الصوديوم', 'املاح الصوديوم'],
    defaultUnit: 'mEq/L',
    alternateUnits: [{ unit: 'mmol/L', conversionFactorToDefault: 1 }],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 135,
        max: 145,
        textRange: '135 - 145 mEq/L (mmol/L)',
        textRangeAr: '135 - 145 ملليمكافئ/لتر',
        criticalLow: 120,
        criticalHigh: 160,
      },
    ],
    clinicalSignificance: {
      highEn: 'Hypernatremia: Indicates free water deficit, dehydration, diabetes insipidus, or excessive saline infusion.',
      highAr: 'فرط الصوديوم: يدل على نقص شرب الماء، الجفاف الشديد، أو فقدان السوائل.',
      lowEn: 'Hyponatremia: May cause cerebral edema, confusion, seizures. Differential includes SIADH, heart failure, cirrhosis, diuretics, adrenal insufficiency.',
      lowAr: 'نقص الصوديوم: يسبب الصداع والتشوش ونوبات التشنج. تشمل الأسباب اعتلال الهرمون المانع للإدرار، قصور القلب أو الكبد، ومدرات البول.',
      criticalEn: 'Critical Sodium (<120 or >160 mEq/L): Severe neuro-osmotic emergency; requires controlled correction to prevent osmotic demyelination.',
      criticalAr: 'مستوى حرج للصوديوم (<120 أو >160): حالة عصبية إسعافية تتطلب تصحيحاً حذراً في المستشفى.',
    },
  },

  // 4. Liver Function Panel
  {
    canonicalId: 'alt',
    nameEn: 'Alanine Aminotransferase (ALT / SGPT)',
    nameAr: 'إنزيم الكبد (ALT / SGPT)',
    category: 'Liver Function Tests',
    categoryAr: 'وظائف الكبد',
    aliases: ['alt', 'sgpt', 'alanine aminotransferase', 'إنزيم الكبد alt', 'انزيم الكبد alt', 'وظائف كبد alt'],
    defaultUnit: 'U/L',
    alternateUnits: [{ unit: 'IU/L', conversionFactorToDefault: 1 }, { unit: 'µkat/L', conversionFactorToDefault: 60 }],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'MALE',
        min: 7,
        max: 55,
        textRange: '7 - 55 U/L (Adult Male)',
        textRangeAr: '7 - 55 وحدة/لتر (الذكور)',
        criticalHigh: 500,
      },
      {
        ageGroup: 'ALL',
        sex: 'FEMALE',
        min: 7,
        max: 45,
        textRange: '7 - 45 U/L (Adult Female)',
        textRangeAr: '7 - 45 وحدة/لتر (الإناث)',
        criticalHigh: 500,
      },
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 7,
        max: 50,
        textRange: '7 - 50 U/L',
        textRangeAr: '7 - 50 وحدة/لتر',
        criticalHigh: 500,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated ALT is a sensitive marker of hepatocellular injury. Causes: viral hepatitis, NAFLD/NASH, toxic/drug-induced (e.g. Paracetamol, Statins), alcohol, ischemia.',
      highAr: 'ارتفاع ALT مؤشر دقيق لتأثر خلايا الكبد. الأسباب: التهاب الكبد الفيروسي، الكبد الدهني، الأدوية (كالباراسيتامول والاستاتين)، الكحول أو نقص التروية.',
      lowEn: 'Low ALT is generally of no clinical significance.',
      lowAr: 'انخفاض ALT لا يشكل أي دلالة مرضية مقلقة.',
      criticalEn: 'Marked Transaminitis (ALT > 500 U/L): Suggests acute viral hepatitis, ischemic hepatitis (shock liver), or severe acute toxic injury.',
      criticalAr: 'ارتفاع حاد وشديد (>500): يشير لالتهاب كبد حاد، نقص تروية كبدي حاد، أو تسمم دوائي يتطلب تدخلاً عاجلاً.',
    },
  },
  {
    canonicalId: 'ast',
    nameEn: 'Aspartate Aminotransferase (AST / SGOT)',
    nameAr: 'إنزيم الكبد (AST / SGOT)',
    category: 'Liver Function Tests',
    categoryAr: 'وظائف الكبد',
    aliases: ['ast', 'sgot', 'aspartate aminotransferase', 'إنزيم الكبد ast', 'انزيم الكبد ast'],
    defaultUnit: 'U/L',
    alternateUnits: [{ unit: 'IU/L', conversionFactorToDefault: 1 }],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 8,
        max: 48,
        textRange: '8 - 48 U/L',
        textRangeAr: '8 - 48 وحدة/لتر',
        criticalHigh: 500,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated AST reflects liver, cardiac, or skeletal muscle damage. AST:ALT ratio > 2 suggests alcoholic liver disease; equal elevations suggest viral or fatty liver.',
      highAr: 'ارتفاع AST يعكس تأثر الكبد أو عضلات الجسم أو القلب. نسبة AST إلى ALT أكثر من 2 قد ترتبط بالكحول، بينما ارتفاعهما المتكافئ يشير لالتهاب أو تشحم الكبد.',
      lowEn: 'Low AST is clinically insignificant.',
      lowAr: 'انخفاض AST غير ذي دلالة مرضية.',
      criticalEn: 'Critical AST elevation (>500 U/L): Acute hepatic necrosis, severe rhabdomyolysis, or acute myocardial/ischemic injury.',
      criticalAr: 'ارتفاع حرج (>500): تنخر كبدي حاد، انحلال عضلي شديد، أو أذية نقص تروية.',
    },
  },
  {
    canonicalId: 'alkaline_phosphatase',
    nameEn: 'Alkaline Phosphatase (ALP)',
    nameAr: 'الفوسفاتاز القلوية (ALP)',
    category: 'Liver & Bone',
    categoryAr: 'الكبد والعظام',
    aliases: ['alp', 'alk phos', 'alkaline phosphatase', 'الفوسفاتاز القلوي', 'انزيم العظام والكبد alp'],
    defaultUnit: 'U/L',
    alternateUnits: [{ unit: 'IU/L', conversionFactorToDefault: 1 }],
    referenceRanges: [
      {
        ageGroup: 'CHILD',
        sex: 'ALL',
        min: 100,
        max: 350,
        textRange: '100 - 350 U/L (Children / Adolescents with active bone growth)',
        textRangeAr: '100 - 350 وحدة/لتر (الأطفال والمراهقين أثناء نمو العظام الطبيعي)',
        criticalHigh: 800,
      },
      {
        ageGroup: 'ADULT',
        sex: 'ALL',
        min: 44,
        max: 147,
        textRange: '44 - 147 U/L (Adults)',
        textRangeAr: '44 - 147 وحدة/لتر (البالغين)',
        criticalHigh: 600,
      },
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 44,
        max: 147,
        textRange: '44 - 147 U/L',
        textRangeAr: '44 - 147 وحدة/لتر',
        criticalHigh: 600,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated ALP suggests biliary obstruction (cholestasis, gallstones), infiltrative liver disease, bone turnover (fractures, Paget, bone metastasis), or normal pediatric growth.',
      highAr: 'ارتفاع ALP يشير لانسداد القنوات الصفراوية (ركود صفراوي، حصوات)، أمراض العظام، أو النمو العظمي الطبيعي لدى الأطفال والمراهقين.',
      lowEn: 'Low ALP is rare; associated with severe zinc deficiency, hypothyroidism, or Wilson disease.',
      lowAr: 'انخفاض ALP نادر؛ قد يرتبط بنقص الزنك الشديد أو خمول الغدة الدرقية.',
      criticalEn: 'Marked ALP elevation with jaundice indicates complete biliary tree obstruction requiring urgent imaging/decompression.',
      criticalAr: 'ارتفاع حاد مصحوب باليرقان يشير لانسداد حاد في القنوات الصفراوية يستدعي تصويراً وتدخلاً سريعاً.',
    },
  },

  // 5. Lipid Panel
  {
    canonicalId: 'total_cholesterol',
    nameEn: 'Total Cholesterol',
    nameAr: 'الكوليسترول الكلي',
    category: 'Lipid Profile',
    categoryAr: 'دهون الدم',
    aliases: ['total cholesterol', 'cholesterol', 'tc', 'الكوليسترول الكلي', 'الكولسترول'],
    defaultUnit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactorToDefault: 38.67 }],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 120,
        max: 200,
        textRange: '< 200 mg/dL (Desirable), 200-239 (Borderline), ≥ 240 (High)',
        textRangeAr: '< 200 ملغ/ديسيلتر (مثالي)، 200-239 (حدي)، ≥ 240 (مرتفع)',
        criticalHigh: 400,
      },
    ],
    clinicalSignificance: {
      highEn: 'Hypercholesterolemia increases atherosclerotic cardiovascular disease (ASCVD) risk. Evaluate full lipid panel and 10-year ASCVD risk.',
      highAr: 'ارتفاع الكوليسترول يزيد مخاطر تصلب الشرايين وأمراض القلب التاجية. يلزم تقييم الدهون الشاملة وخطر القلب التراكمي.',
      lowEn: 'Very low cholesterol (<100) may be seen in hyperthyroidism, malnutrition, or advanced liver disease.',
      lowAr: 'انخفاض الكوليسترول الشديد قد يظهر في فرط نشاط الغدة الدرقية أو سوء التغذية.',
      criticalEn: 'Extremely elevated cholesterol (>400 mg/dL) points toward familial hypercholesterolemia requiring specialized lipidology review.',
      criticalAr: 'ارتفاع حاد (>400) يوجه نحو فرط كوليسترول الدم العائلي الوراثي.',
    },
  },
  {
    canonicalId: 'ldl_cholesterol',
    nameEn: 'LDL Cholesterol (Bad Cholesterol)',
    nameAr: 'الكوليسترول الضار (المنخفض الكثافة LDL)',
    category: 'Lipid Profile',
    categoryAr: 'دهون الدم',
    aliases: ['ldl', 'ldl cholesterol', 'ldl-c', 'low density lipoprotein', 'الكوليسترول الضار', 'الدهون الضارة'],
    defaultUnit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactorToDefault: 38.67 }],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 50,
        max: 100,
        textRange: '< 100 mg/dL (Optimal), 100-129 (Near optimal), 130-159 (Borderline), ≥ 160 (High)',
        textRangeAr: '< 100 ملغ/ديسيلتر (مثالي)، 100-129 (مقبول)، 130-159 (حدي)، ≥ 160 (مرتفع)',
        criticalHigh: 250,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated LDL is a primary atherogenic lipoprotein driving plaque formation. Goal depends on individual cardiovascular risk (<70 or <55 in very high risk).',
      highAr: 'الكوليسترول الضار هو المسبب الرئيسي لتصلب ولويحات الشرايين. يختلف الهدف بحسب الخطورة القلبية للمريض (<70 أو <55 لمرضى الخطورة العالية).',
      lowEn: 'Low LDL is generally favorable, though extremely low levels can accompany malabsorption or genetic hypolipidemias.',
      lowAr: 'انخفاض LDL مرغوب لحماية الشرايين.',
      criticalEn: 'LDL ≥ 190 mg/dL meets criteria for high-intensity statin therapy regardless of 10-year risk calculators.',
      criticalAr: 'ارتفاع LDL ≥ 190 يستوجب علاجاً خافضاً للدهون عالي الشدة للوقاية من النوبات القلبية.',
    },
  },

  // 6. Thyroid Panel
  {
    canonicalId: 'tsh',
    nameEn: 'Thyroid Stimulating Hormone (TSH)',
    nameAr: 'الهرمون المحفز للدرقية (TSH)',
    category: 'Thyroid Function',
    categoryAr: 'وظائف الغدة الدرقية',
    aliases: ['tsh', 'thyroid stimulating hormone', 'thyrotropin', 'هرمون الغدة الدرقية tsh', 'تحليل tsh'],
    defaultUnit: 'mIU/L',
    alternateUnits: [{ unit: 'uIU/mL', conversionFactorToDefault: 1 }, { unit: 'mU/L', conversionFactorToDefault: 1 }],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 0.4,
        max: 4.5,
        textRange: '0.4 - 4.5 mIU/L (uIU/mL)',
        textRangeAr: '0.4 - 4.5 ميكرو وحدة/مل',
        criticalLow: 0.01,
        criticalHigh: 20.0,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated TSH suggests Primary Hypothyroidism (or subclinical hypothyroidism if Free T4 is normal). Symptoms: fatigue, weight gain, cold intolerance, constipation.',
      highAr: 'ارتفاع TSH يشير لخمول الغدة الدرقية الأولي (أو خمول تحت سريري). الأعراض تشمل: التعب، زيادة الوزن، عدم تحمل البرد، والإمساك.',
      lowEn: 'Low TSH suggests Primary Hyperthyroidism (or excessive thyroid hormone replacement). Symptoms: palpitations, weight loss, heat intolerance, tremor.',
      lowAr: 'انخفاض TSH يشير لفرط نشاط الغدة الدرقية (أو جرعة ثيروكسين زائدة). الأعراض: تسارع النبض، نزول الوزن، العصبية، والرجفة.',
      criticalEn: 'Severely elevated TSH (>20) with low T4 risks Myxedema coma; suppressed TSH (<0.01) with elevated T3/T4 risks Thyroid storm.',
      criticalAr: 'ارتفاع شديد لـ TSH (>20) ينذر بغيبوبة الوذمة المخاطية، وانخفاضه الشديد (<0.01) مع زيادة الهرمونات يهدد بعاصفة درقية إسعافية.',
    },
  },

  // 7. Cardiac Markers
  {
    canonicalId: 'troponin_i',
    nameEn: 'Troponin I (Cardiac Biomarker)',
    nameAr: 'تروبونين القلب (Troponin I)',
    category: 'Cardiac Biomarkers',
    categoryAr: 'مؤشرات القلب والجلطات',
    aliases: ['troponin', 'troponin i', 'cTnI', 'high sensitivity troponin', 'تروبونين', 'انزيم القلب تروبونين'],
    defaultUnit: 'ng/mL',
    alternateUnits: [
      { unit: 'ng/L', conversionFactorToDefault: 0.001 },
      { unit: 'ug/L', conversionFactorToDefault: 1 },
    ],
    referenceRanges: [
      {
        ageGroup: 'ALL',
        sex: 'ALL',
        min: 0.0,
        max: 0.04,
        textRange: '< 0.04 ng/mL (Normal Baseline)',
        textRangeAr: '< 0.04 نانوغرام/مل (المستوى الطبيعي)',
        criticalHigh: 0.1,
      },
    ],
    clinicalSignificance: {
      highEn: 'Elevated Troponin indicates myocardial injury / necrosis. In the context of ischemic chest pain, confirms Acute Coronary Syndrome (NSTEMI/STEMI). Non-coronary causes include pulmonary embolism, myocarditis, severe sepsis, CKD.',
      highAr: 'ارتفاع التروبونين مؤشر حاسم على أذية أو احتشاء عضلة القلب (الجلطة القلبية). يتطلب تخطيط قلب فوري (ECG) ونقلاً إسعافياً في حال وجود ألم صدري.',
      lowEn: 'Normal / undetectable troponin indicates absence of acute myocardial cell necrosis at the time of draw (serial testing recommended if symptom onset < 3h).',
      lowAr: 'التروبونين الطبيعي ينفي موت خلايا القلب وقت الفحص (يوصى بتكراره بعد ساعات عند حداثة ألم الصدر).',
      criticalEn: 'Critical Cardiac Troponin Elevation: Strongly indicative of Acute Myocardial Infarction. Urgent Cardiology Emergency Activation required.',
      criticalAr: 'ارتفاع حرج للتروبونين: دلالة قوية على جلطة قلبية حادة تستدعي استدعاء الإسعاف وطوارئ القلب فوراً.',
    },
  },
];

export class LabInterpretationEngine {
  /**
   * Normalize test name to match known canonical biomarkers
   */
  public matchBiomarker(testName: string): BiomarkerDefinition | undefined {
    if (!testName) return undefined;
    const clean = testName.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, ' ');

    return BIOMARKER_DATABASE.find((bm) => {
      if (bm.nameEn.toLowerCase() === clean || bm.nameAr === testName.trim()) return true;
      if (bm.canonicalId === clean.replace(/\s+/g, '_')) return true;
      return bm.aliases.some((alias) => clean.includes(alias.toLowerCase()));
    });
  }

  /**
   * Convert unit to default standard unit for numeric evaluation
   */
  public normalizeValueAndUnit(
    rawVal: number,
    unit: string,
    biomarker: BiomarkerDefinition
  ): { normalizedVal: number; standardUnit: string; unitConversionApplied: boolean } {
    const cleanUnit = (unit || '').trim().toLowerCase();
    const defaultUnitClean = biomarker.defaultUnit.toLowerCase();

    if (cleanUnit === defaultUnitClean || !cleanUnit) {
      return { normalizedVal: rawVal, standardUnit: biomarker.defaultUnit, unitConversionApplied: false };
    }

    const altMatch = biomarker.alternateUnits.find(
      (a) => a.unit.toLowerCase() === cleanUnit || cleanUnit.includes(a.unit.toLowerCase())
    );

    if (altMatch) {
      const converted = rawVal * altMatch.conversionFactorToDefault;
      return {
        normalizedVal: converted,
        standardUnit: biomarker.defaultUnit,
        unitConversionApplied: true,
      };
    }

    return { normalizedVal: rawVal, standardUnit: unit || biomarker.defaultUnit, unitConversionApplied: false };
  }

  /**
   * Determine age category for Age-Aware reference range selection
   */
  public getAgeGroup(age?: number): 'INFANT' | 'CHILD' | 'ADOLESCENT' | 'ADULT' | 'GERIATRIC' | 'ALL' {
    if (age === undefined || age === null) return 'ADULT';
    if (age < 1) return 'INFANT';
    if (age <= 12) return 'CHILD';
    if (age <= 18) return 'ADOLESCENT';
    if (age >= 65) return 'GERIATRIC';
    return 'ADULT';
  }

  /**
   * Master Interpretation Method
   */
  public interpretTest(params: {
    testName: string;
    resultValue: number | string;
    unit?: string;
    documentReferenceRange?: string;
    context?: PatientLabContext;
  }): {
    status: LabStatus;
    referenceRange: ReferenceRange;
    interpretation: ExtractedLabItem['interpretation'];
    matchedBiomarker?: BiomarkerDefinition;
    unitAwareNote?: string;
  } {
    const { testName, resultValue, unit = '', documentReferenceRange, context } = params;
    const biomarker = this.matchBiomarker(testName);

    const isNumeric = typeof resultValue === 'number' || (!isNaN(Number(resultValue)) && resultValue !== '');
    const numVal = isNumeric ? Number(resultValue) : NaN;

    const patientAge = context?.age;
    const patientGender = context?.gender || 'MALE';
    const ageGroup = this.getAgeGroup(patientAge);

    // Fallback default if biomarker not in our DB
    if (!biomarker) {
      const fallbackRange: ReferenceRange = {
        textRange: documentReferenceRange || 'Laboratory Reference Range',
        textRangeAr: documentReferenceRange || 'المعدل الطبيعي للمختبر',
        unit: unit,
      };

      return {
        status: 'Normal',
        referenceRange: fallbackRange,
        interpretation: {
          flagExplanationAr: `تم استخراج نتيجة (${testName}): ${resultValue} ${unit}. يرجى مراجعة الطبيب لمطابقتها مع المعدل المرجعي المطبوع.`,
          flagExplanationEn: `Extracted result for (${testName}): ${resultValue} ${unit}. Please cross-reference with the laboratory's printed reference range.`,
          clinicalContextNotesAr: 'تنبيه: لا يتم تشخيص أي حالة بناءً على نتيجة منفردة. يلزم التقييم السريري الشامل.',
          clinicalContextNotesEn: 'Clinical Safety Notice: Do not diagnose conditions based on a single result alone. Comprehensive clinical correlation is essential.',
          differentialPossibilitiesAr: ['نتائج مخبرية عامة تتطلب مراجعة الطبيب'],
          differentialPossibilitiesEn: ['General laboratory finding requiring physician review'],
          recommendedFollowUpAr: 'عرض التقرير على الطبيب المعالج لمطابقة الأعراض السريرية.',
          recommendedFollowUpEn: 'Share report with your treating physician for clinical correlation.',
        },
      };
    }

    // 1. Select the most specific Age-Aware and Sex-Aware Reference Range
    let matchedRange = biomarker.referenceRanges.find(
      (r) => (r.ageGroup === ageGroup || r.ageGroup === 'ALL') && (r.sex === patientGender || r.sex === 'ALL')
    );

    if (!matchedRange) {
      matchedRange = biomarker.referenceRanges[0];
    }

    // 2. Unit-Aware Normalization
    let normalizedNum = numVal;
    let unitAwareNote: string | undefined = undefined;

    if (isNumeric) {
      const { normalizedVal, unitConversionApplied } = this.normalizeValueAndUnit(numVal, unit, biomarker);
      normalizedNum = normalizedVal;
      if (unitConversionApplied) {
        unitAwareNote = `Unit recognized and converted (${unit} → ${biomarker.defaultUnit}) for standardized clinical evaluation.`;
      }
    }

    // 3. Determine Status (Normal, High, Low, Critical)
    let status: LabStatus = 'Normal';
    let criticalWarningAr: string | undefined = undefined;
    let criticalWarningEn: string | undefined = undefined;

    if (isNumeric && !isNaN(normalizedNum)) {
      const min = matchedRange.min;
      const max = matchedRange.max;
      const critLow = matchedRange.criticalLow;
      const critHigh = matchedRange.criticalHigh;

      if (critHigh !== undefined && normalizedNum >= critHigh) {
        status = 'Critical';
        criticalWarningEn = biomarker.clinicalSignificance.criticalEn;
        criticalWarningAr = biomarker.clinicalSignificance.criticalAr;
      } else if (critLow !== undefined && normalizedNum <= critLow) {
        status = 'Critical';
        criticalWarningEn = biomarker.clinicalSignificance.criticalEn;
        criticalWarningAr = biomarker.clinicalSignificance.criticalAr;
      } else if (normalizedNum > max) {
        status = 'High';
      } else if (normalizedNum < min) {
        status = 'Low';
      } else {
        status = 'Normal';
      }
    }

    // 4. Build Explanations & Context Awareness
    let flagExplanationEn = '';
    let flagExplanationAr = '';

    if (status === 'Critical') {
      flagExplanationEn = `CRITICAL ALERT: Result (${resultValue} ${unit}) reaches panic threshold. ${biomarker.clinicalSignificance.criticalEn}`;
      flagExplanationAr = `تنبيه حرج وإسعافي: القيمة (${resultValue} ${unit}) وصلت لمستوى الخطر. ${biomarker.clinicalSignificance.criticalAr}`;
    } else if (status === 'High') {
      flagExplanationEn = `ELEVATED: Result (${resultValue} ${unit}) is above the upper normal limit of ${matchedRange.max} ${biomarker.defaultUnit}. ${biomarker.clinicalSignificance.highEn}`;
      flagExplanationAr = `مرتفع: القيمة (${resultValue} ${unit}) أعلى من الحد الطبيعي (${matchedRange.max} ${biomarker.defaultUnit}). ${biomarker.clinicalSignificance.highAr}`;
    } else if (status === 'Low') {
      flagExplanationEn = `LOW: Result (${resultValue} ${unit}) is below the lower normal limit of ${matchedRange.min} ${biomarker.defaultUnit}. ${biomarker.clinicalSignificance.lowEn}`;
      flagExplanationAr = `منخفض: القيمة (${resultValue} ${unit}) أقل من الحد الطبيعي (${matchedRange.min} ${biomarker.defaultUnit}). ${biomarker.clinicalSignificance.lowAr}`;
    } else {
      flagExplanationEn = `NORMAL: Result (${resultValue} ${unit}) falls within the standard physiological reference interval (${matchedRange.textRange}).`;
      flagExplanationAr = `طبيعي: القيمة (${resultValue} ${unit}) تقع ضمن المعدل الفيزيولوجي الطبيعي (${matchedRange.textRangeAr}).`;
    }

    // 5. Age-Aware & Sex-Aware Comments
    let ageAwareCommentAr: string | undefined = undefined;
    let ageAwareCommentEn: string | undefined = undefined;
    if (patientAge !== undefined) {
      ageAwareCommentEn = `Age-Aware adjustment applied for patient age (${patientAge}y, category: ${ageGroup}).`;
      ageAwareCommentAr = `تمت مطابقة النطاق العمري للمريض (${patientAge} سنة، الفئة: ${ageGroup}).`;
    }

    let sexAwareCommentAr: string | undefined = undefined;
    let sexAwareCommentEn: string | undefined = undefined;
    if (matchedRange.sex !== 'ALL') {
      sexAwareCommentEn = `Sex-specific reference interval applied for ${patientGender}.`;
      sexAwareCommentAr = `تم تطبيق النطاق المرجعي الخاص بجنس المريض (${patientGender === 'MALE' ? 'ذكر' : 'أنثى'}).`;
    }

    // 6. Context-Aware integration (Conditions & Symptoms)
    let contextNotesEn = 'Clinical Safety Notice: Do not diagnose a disease based on a single result alone. Repeated testing and correlation with clinical symptoms are required.';
    let contextNotesAr = 'قاعدة سريرية صارمة: لا يتم تشخيص أي مرض بناءً على فحص منفرد بمفرده. يجب دائماً إعادة الفحص وتأكيده مع الفحص السريري من قبل الطبيب.';

    if (context?.activeConditions && context.activeConditions.length > 0) {
      const matchingAlert = biomarker.contextAlerts?.find((ca) =>
        context.activeConditions!.some((c) => c.toLowerCase().includes(ca.condition.toLowerCase()))
      );
      if (matchingAlert) {
        contextNotesEn += ` Contextual alert for known ${matchingAlert.condition}: ${matchingAlert.alertEn}`;
        contextNotesAr += ` تنبيه خاص لحالة المريض المسجلة (${matchingAlert.condition}): ${matchingAlert.alertAr}`;
      }
    }

    const refRange: ReferenceRange = {
      min: matchedRange.min,
      max: matchedRange.max,
      textRange: documentReferenceRange || matchedRange.textRange,
      textRangeAr: documentReferenceRange || matchedRange.textRangeAr,
      unit: biomarker.defaultUnit,
      ageRange: matchedRange.ageGroup,
      sexTarget: matchedRange.sex,
      criticalLow: matchedRange.criticalLow,
      criticalHigh: matchedRange.criticalHigh,
    };

    return {
      status,
      referenceRange: refRange,
      matchedBiomarker: biomarker,
      unitAwareNote,
      interpretation: {
        flagExplanationAr,
        flagExplanationEn,
        clinicalContextNotesAr: contextNotesAr,
        clinicalContextNotesEn: contextNotesEn,
        ageAwareCommentAr,
        ageAwareCommentEn,
        sexAwareCommentAr,
        sexAwareCommentEn,
        unitAwareCommentAr: unitAwareNote ? 'تم التحقق من تطابق الوحدة المخبرية القياسية' : undefined,
        unitAwareCommentEn: unitAwareNote,
        criticalWarningAr,
        criticalWarningEn,
        differentialPossibilitiesAr:
          status === 'High'
            ? [biomarker.clinicalSignificance.highAr]
            : status === 'Low'
            ? [biomarker.clinicalSignificance.lowAr]
            : ['قيمة فيزيولوجية طبيعية'],
        differentialPossibilitiesEn:
          status === 'High'
            ? [biomarker.clinicalSignificance.highEn]
            : status === 'Low'
            ? [biomarker.clinicalSignificance.lowEn]
            : ['Physiological normal value'],
        recommendedFollowUpAr:
          status === 'Critical'
            ? 'مراجعة طوارئ أو أخصائي فوراً لإجراء تقييم إسعافي.'
            : status !== 'Normal'
            ? 'يوصى بتكرار الفحص بعد فترة ومناقشة النتيجة مع الطبيب المعالج.'
            : 'استمرار المتابعة الدورية الوقائية.',
        recommendedFollowUpEn:
          status === 'Critical'
            ? 'Urgent emergency evaluation required immediately.'
            : status !== 'Normal'
            ? 'Repeat confirmatory test recommended alongside physician consultation.'
            : 'Continue routine preventative health follow-up.',
      },
    };
  }
}

export const labInterpretationEngine = new LabInterpretationEngine();
