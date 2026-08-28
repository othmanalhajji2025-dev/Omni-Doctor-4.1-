import { EvidenceSource, DrugInteractionResult, LabAnalysisResult, LabParameterInput } from '../types/medical.js';
import { medicalQueryEngine } from './queryEngine.js';

export const VERIFIED_EVIDENCE_REPOSITORY: EvidenceSource[] = [
  {
    id: 'nice-ng136-hypertension',
    title: 'إرشادات المعهد الوطني للتميز السريري (NICE): تشخيص وإدارة ارتفاع ضغط الدم عند البالغين',
    titleEn: 'NICE Guideline [NG136]: Hypertension in adults: diagnosis and management',
    organization: 'NICE',
    guidelineId: 'NG136',
    year: 2023,
    url: 'https://www.nice.org.uk/guidance/ng136',
    summaryAr: 'توصي الإرشادات ببدء التقييم عند قراءات الضغط فوق 140/90 ملم زئبق في العيادة، مع خطة متدرجة تشمل تعديل نمط الحياة وحاصرات الإنزيم المحول للأنجيوتنسين (ACE-I) أو حاصرات مستقبلات الأنجيوتنسين (ARB) كخط أول.',
    summaryEn: 'Recommends clinical evaluation for clinic BP >= 140/90 mmHg with stepped management including lifestyle modifications, ACE inhibitors or ARBs as first-line therapy.',
    topics: ['hypertension', 'blood pressure', 'cardiovascular', 'ضغط الدم', 'ارتفاع الضغط', 'القلب'],
  },
  {
    id: 'nice-ng28-diabetes-type2',
    title: 'إرشادات NICE [NG28]: إدارة السكري من النوع الثاني لدى البالغين',
    titleEn: 'NICE Guideline [NG28]: Type 2 diabetes in adults: management',
    organization: 'NICE',
    guidelineId: 'NG28',
    year: 2022,
    url: 'https://www.nice.org.uk/guidance/ng28',
    summaryAr: 'تحديد الهدف العلاجي لتراكمي السكر (HbA1c) دون 6.5%-7.0% (48-53 mmol/mol) لمعظم المرضى، مع اعتماد الميتفورمين كخط دوائي أولي وفحص وظائف الكلى الدورية.',
    summaryEn: 'Standard target HbA1c < 6.5%-7.0% (48-53 mmol/mol), with Metformin as initial pharmacotherapy alongside renal monitoring.',
    topics: ['diabetes', 'glucose', 'hba1c', 'السكري', 'السكر التراكمي', 'ميتفورمين', 'الجلوكوز'],
  },
  {
    id: 'who-urti-guidelines',
    title: 'منظمة الصحة العالمية (WHO): تدبير عدوى الجهاز التنفسي العلوي الفيروسية',
    titleEn: 'WHO Guidelines for the Clinical Management of Acute Respiratory Infections',
    organization: 'WHO',
    guidelineId: 'WHO-ARI-2022',
    year: 2022,
    url: 'https://www.who.int/publications/i/item/acute-respiratory-infections',
    summaryAr: 'تؤكد المبادئ التوجيهية أن غالبية التهابات الجهاز التنفسي العلوي (نزلات البرد، التهاب البلعوم الفيروسي) محدودة ذاتياً ولا تستدعي مضادات حيوية، وينصح بالترطيب ومسكنات الألم الخفيفة ومراقبة علامات الخطر.',
    summaryEn: 'Recommends conservative supportive care for self-limiting viral URTIs, avoiding unnecessary antibiotic prescribing while observing red flag signs.',
    topics: ['cold', 'flu', 'cough', 'throat', 'respiratory', 'انفلونزا', 'نزلة برد', 'سعال', 'كحة', 'احتقان الحلق'],
  },
  {
    id: 'aha-chest-pain-2021',
    title: 'جمعية القلب الأمريكية (AHA/ACC): الدليل الإرشادي لتقييم وتشخيص ألم الصدر',
    titleEn: '2021 AHA/ACC/ASE/CHEST/SAEM Guideline for the Evaluation and Diagnosis of Chest Pain',
    organization: 'AHA',
    guidelineId: 'AHA-CP-2021',
    year: 2021,
    url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001029',
    summaryAr: 'يصنف ألم الصدر إلى قلبي محتمل وغير قلبي مع إعطاء الأولوية القصوى لاستبعاد المتلازمة التاجية الحادة والانصمام الرئوي وتسلخ الأبهر فورياً.',
    summaryEn: 'Defines structured risk stratification for acute chest pain to rapidly identify or exclude acute coronary syndrome, PE, and aortic dissection.',
    topics: ['chest pain', 'cardiac', 'heart', 'angina', 'الم الصدر', 'الذبحة', 'النوبة القلبية'],
  },
  {
    id: 'cdc-uti-outpatient',
    title: 'مركز السيطرة على الأمراض (CDC): الإرشادات السريرية لعدوى المسالك البولية البسيطة',
    titleEn: 'CDC Core Elements of Outpatient Antibiotic Stewardship: UTI Protocols',
    organization: 'CDC',
    guidelineId: 'CDC-UTI-2023',
    year: 2023,
    url: 'https://www.cdc.gov/antibiotic-use/community/improving-prescribing/clinical-guidance/uti.html',
    summaryAr: 'تقييم أعراض عسر التبول وتكراره وإجراء فحص البول المخبري مع تجنب المضادات العشوائية قبل التأكد السريري واستبعاد عدوى الكلى (التهاب الحويضة).',
    summaryEn: 'Outpatient management of uncomplicated urinary tract infections, urinalysis interpretation, and differentiating cystitis from pyelonephritis.',
    topics: ['uti', 'urinary', 'dysuria', 'kidney', 'مسالك بولية', 'التهاب البول', 'حرقة البول', 'الكلى'],
  },
  {
    id: 'nice-cg95-gastro',
    title: 'إرشادات NICE [CG95]: داء الارتجاع المعدي المريئي وعسر الهضم لدى البالغين',
    titleEn: 'NICE Guideline [CG95]: Gastro-oesophageal reflux disease and dyspepsia in adults',
    organization: 'NICE',
    guidelineId: 'CG95',
    year: 2021,
    url: 'https://www.nice.org.uk/guidance/cg95',
    summaryAr: 'تدبير حرقة الفؤاد وارتجاع المريء مع تقييم علامات الإنذار بالمنظار (مثل عسر البلع أو فقدان الوزن غير المبرر)، واستخدام مثبطات مضخة البروتون (PPI) عند اللزوم.',
    summaryEn: 'Management of dyspepsia and GORD, highlighting red flag indications for urgent upper endoscopy including dysphagia and unintended weight loss.',
    topics: ['gerd', 'reflux', 'gastritis', 'stomach', 'dyspepsia', 'حموضة', 'ارتجاع المريء', 'المعدة', 'عسر الهضم'],
  },
  {
    id: 'moh-sa-migraine-pathway',
    title: 'وزارة الصحة السعودية (MOH-SA): المسار الإكلينيكي للصداع النصفي والصداع الأولي',
    titleEn: 'Saudi Ministry of Health Clinical Practice Guideline for Primary Headache Disorders',
    organization: 'MOH_SA',
    guidelineId: 'MOH-HA-2023',
    year: 2023,
    url: 'https://www.moh.gov.sa/Ministry/MediaCenter/Publications/Pages/Clinical-Practice-Guidelines.aspx',
    summaryAr: 'تحديد معايير الصداع النصفي الشائع وتطبيق استبيان الصداع لاستبعاد الأسباب الثانوية (SNOOP criteria) وتقديم خطة وقائية وعلاجية للأزمات الحادة.',
    summaryEn: 'Guideline for screening secondary headaches using SNOOP criteria and managing acute migraine attacks versus tension headaches.',
    topics: ['headache', 'migraine', 'صداع', 'شقيقة', 'صداع نصفي', 'الم الرأس'],
  }
];

export const VERIFIED_DRUG_INTERACTIONS: DrugInteractionResult[] = [
  {
    drugA: 'Warfarin',
    drugB: 'Ibuprofen',
    severity: 'CONTRAINDICATED',
    mechanismAr: 'تثبيط وظيفة الصفائح الدموية بواسطة الإيبوبروفين مع التخثر المزدوج وتخريش الغشاء المخاطي الهضمي يزيد بشكل حاد خطر النزيف المعدي المعوي الشديد.',
    mechanismEn: 'Inhibition of platelet aggregation and gastric mucosal erosion by Ibuprofen combined with Warfarin anticoagulation drastically elevates major GI bleed risk.',
    clinicalEffectAr: 'خطر نزيف هضمي حاد مهدد للحياة وارتفاع غير منضبط في تحليل السيولة (INR).',
    clinicalEffectEn: 'Life-threatening gastrointestinal hemorrhage and unpredictable elevation of INR.',
    managementAr: 'يجب تجنب مضادات الالتهاب غير الستيرويدية (NSAIDs) واستخدام الباراسيتامول تحت إشراف طبي.',
    managementEn: 'Avoid NSAIDs; consider Paracetamol/Acetaminophen with close INR monitoring if analgesia is essential.',
    source: 'British National Formulary (BNF) & FDA Drug Safety Communications',
  },
  {
    drugA: 'Lisinopril',
    drugB: 'Spironolactone',
    severity: 'MAJOR',
    mechanismAr: 'تأثير تآزري في احتباس البوتاسيوم بواسطة حاصرات الإنزيم المحول للأنجيوتنسين ومدر البول الحافظ للبوتاسيوم.',
    mechanismEn: 'Synergistic potassium retention by ACE inhibitor and aldosterone receptor antagonist.',
    clinicalEffectAr: 'فرط بوتاسيوم الدم الشديد (Hyperkalemia) الذي قد يسبب اضطرابات نظم قلبية خطيرة.',
    clinicalEffectEn: 'Severe hyperkalemia leading to cardiac arrhythmias and conduction defects.',
    managementAr: 'يتطلب قياس البوتاسيوم ووظائف الكلى (eGFR) بانتظام وتعديل الجرعات بعناية.',
    managementEn: 'Frequent serum potassium and creatinine monitoring is mandatory with dosage titrations.',
    source: 'NICE NG136 & AHA Heart Failure Pharmacology Guidelines',
  },
  {
    drugA: 'Escitalopram',
    drugB: 'Tramadol',
    severity: 'MAJOR',
    mechanismAr: 'تثبيط إعادة امتصاص السيروتونين المتزامن يعزز النشاط السيروتونيني في الجهاز العصبي المركزي.',
    mechanismEn: 'Dual enhancement of serotonergic transmission via reuptake inhibition and direct stimulation.',
    clinicalEffectAr: 'خطر متزايد لمتلازمة السيروتونين (ارتفاع حرارة، نفضان عضلي، تخبط ذهني، وتشنجات).',
    clinicalEffectEn: 'Elevated risk of Serotonin Syndrome (autonomic instability, hyperreflexia, hyperthermia, confusion).',
    managementAr: 'يفضل اختيار مسكن بديل لا يؤثر على مسار السيروتونين ومراقبة الأعراض العصبية بدقة.',
    managementEn: 'Select an alternative analgesic without serotonergic activity; monitor closely for early neurotoxicity.',
    source: 'UpToDate Clinical Pharmacology & WHO Drug Safety',
  },
  {
    drugA: 'Metformin',
    drugB: 'Iodinated Radiocontrast',
    severity: 'MAJOR',
    mechanismAr: 'الصبغة الوريدية الميودنة قد تؤدي لاعتلال كلوي حاد مؤقت، مما يقلل طرح الميتفورمين وتراكمه.',
    mechanismEn: 'Iodinated contrast may cause acute tubular necrosis or transient renal impairment, leading to Metformin accumulation.',
    clinicalEffectAr: 'خطر حدوث الحماض اللبني (Lactic Acidosis) المرتبط بالميتفورمين، وهو اختلاط مهدد للحياة.',
    clinicalEffectEn: 'Risk of Metformin-associated lactic acidosis (MALA), a life-threatening metabolic emergency.',
    managementAr: 'إيقاف الميتفورمين قبل الإجراء الشعاعي بالصبغة ولمدة 48 ساعة بعده حتى التحقق من سلامة وظائف الكلى.',
    managementEn: 'Withhold Metformin at the time of procedure and for 48 hours post-contrast until renal function is confirmed stable.',
    source: 'American College of Radiology (ACR) & ADA Standards of Care',
  },
  {
    drugA: 'Atorvastatin',
    drugB: 'Clarithromycin',
    severity: 'MAJOR',
    mechanismAr: 'تثبيط إنزيم الكبد CYP3A4 بواسطة المضاد الحيوي كلاريثروميسين يرفع تركيز الأتورفاستاتين في الدم بشكل حاد.',
    mechanismEn: 'Potent CYP3A4 inhibition by Clarithromycin markedly increases systemic exposure to Atorvastatin.',
    clinicalEffectAr: 'ارتفاع خطر السمية العضلية وانحلال الربيدات (Rhabdomyolysis) والفشل الكلوي الحاد.',
    clinicalEffectEn: 'High risk of statin-induced myopathy, severe rhabdomyolysis, and acute kidney injury.',
    managementAr: 'إيقاف الستاتين مؤقتاً طوال فترة العلاج بالمضاد الحيوي واستئنافه بعد اكتمال الكورس.',
    managementEn: 'Temporarily discontinue Atorvastatin for the duration of the macrolide therapy.',
    source: 'FDA Drug Safety Alert & ACC/AHA Cholesterol Guidelines',
  }
];

export const LAB_REFERENCE_KNOWLEDGE = [
  {
    name: 'HbA1c',
    nameAr: 'السكر التراكمي',
    unit: '%',
    min: 4.0,
    max: 5.6,
    optimalText: 'أقل من 5.7% (طبيعي) | 5.7% - 6.4% (مقدمات السكري) | >= 6.5% (تشخيص السكري)',
    clinicalSignificanceAr: 'يقيس متوسط مستوى الجلوكوز في الدم المرتبط بالهيموجلوبين خلال آخر 2 إلى 3 أشهر.',
    clinicalSignificanceEn: 'Reflects average blood glucose bound to hemoglobin over the preceding 8-12 weeks.',
  },
  {
    name: 'Fasting Glucose',
    nameAr: 'سكر الدم الصائم',
    unit: 'mg/dL',
    min: 70,
    max: 99,
    optimalText: '70 - 99 mg/dL طبيعي | 100 - 125 mg/dL مقدمات السكري | >= 126 mg/dL احتمال سكري',
    clinicalSignificanceAr: 'يقيس مستوى الجلوكوز بعد صيام لا يقل عن 8 ساعات لتقييم حساسية الأنسولين.',
    clinicalSignificanceEn: 'Evaluates baseline fasting glycemic regulation and insulin secretion.',
  },
  {
    name: 'Total Cholesterol',
    nameAr: 'الكوليسترول الكلي',
    unit: 'mg/dL',
    min: 125,
    max: 200,
    optimalText: 'أقل من 200 mg/dL مرغوب',
    clinicalSignificanceAr: 'المجموع الكلي لكوليسترول البروتينات الدهنية في مصل الدم لتقييم صحة الأوعية الدموية.',
    clinicalSignificanceEn: 'Total serum lipoprotein cholesterol for baseline cardiovascular risk evaluation.',
  },
  {
    name: 'LDL Cholesterol',
    nameAr: 'الكوليسترول الضار (LDL)',
    unit: 'mg/dL',
    min: 50,
    max: 100,
    optimalText: 'أقل من 100 mg/dL مثالي | أقل من 70 mg/dL لمرضى القلب والسكري',
    clinicalSignificanceAr: 'البروتين الدهني منخفض الكثافة المسبب الرئيسي لتصلب الشرايين التاجية والطرفية.',
    clinicalSignificanceEn: 'Low-Density Lipoprotein, the primary atherogenic particle implicated in CAD.',
  },
  {
    name: 'HDL Cholesterol',
    nameAr: 'الكوليسترول النافع (HDL)',
    unit: 'mg/dL',
    min: 40,
    max: 80,
    optimalText: 'أعلى من 40 للرجال وأعلى من 50 للنساء (واقي للقلب)',
    clinicalSignificanceAr: 'ينقل الكوليسترول الزائد من الأنسجة والشرايين إلى الكبد للتخلص منه.',
    clinicalSignificanceEn: 'High-Density Lipoprotein provides reverse cholesterol transport and cardioprotection.',
  },
  {
    name: 'Triglycerides',
    nameAr: 'الدهون الثلاثية',
    unit: 'mg/dL',
    min: 50,
    max: 150,
    optimalText: 'أقل من 150 mg/dL طبيعي',
    clinicalSignificanceAr: 'دهون مخزنة للطاقة؛ ارتفاعها يرتبط بمتلازمة الأيض ومقاومة الأنسولين وخطر التهاب البنكرياس.',
    clinicalSignificanceEn: 'Circulating storage lipids; hypertriglyceridemia correlates with metabolic syndrome.',
  },
  {
    name: 'Hemoglobin',
    nameAr: 'الهيموجلوبين (خضاب الدم)',
    unit: 'g/dL',
    min: 12.0,
    max: 17.5,
    optimalText: '13.5 - 17.5 للرجال | 12.0 - 15.5 للنساء',
    clinicalSignificanceAr: 'بروتين كريات الدم الحمراء الحامل للأكسجين؛ انخفاضه يشير إلى فقر الدم (الأنيميا).',
    clinicalSignificanceEn: 'Oxygen-carrying erythrocyte protein; low values indicate anemia.',
  },
  {
    name: 'Creatinine',
    nameAr: 'الكرياتينين الكلوي',
    unit: 'mg/dL',
    min: 0.6,
    max: 1.2,
    optimalText: '0.6 - 1.2 mg/dL',
    clinicalSignificanceAr: 'مؤشر رئيسي لترشيح الكلى؛ ارتفاعه قد يدل على قصور أو إجهاد كلوي.',
    clinicalSignificanceEn: 'Core biomarker for glomerular filtration; elevated levels suggest reduced renal clearance.',
  },
  {
    name: 'TSH',
    nameAr: 'الهرمون المحفز للغدة الدرقية (TSH)',
    unit: 'mIU/L',
    min: 0.4,
    max: 4.0,
    optimalText: '0.4 - 4.0 mIU/L',
    clinicalSignificanceAr: 'ينظم نشاط الغدة الدرقية؛ ارتفاعه يشير لخمول الدرقية وانخفاضه لفرط النشاط.',
    clinicalSignificanceEn: 'Pituitary feedback hormone assessing primary hypothyroidism or hyperthyroidism.',
  }
];

export function retrieveRelevantEvidence(symptomText: string): EvidenceSource[] {
  try {
    const ragContext = medicalQueryEngine.retrieveEvidenceContext(symptomText, { topK: 4 });
    if (ragContext.citations && ragContext.citations.length > 0) {
      return ragContext.citations.map((c) => ({
        id: c.documentId || c.chunkId,
        title: c.title,
        titleEn: c.title,
        organization: c.organization as any,
        guidelineId: c.documentId,
        year: c.lastUpdated ? new Date(c.lastUpdated).getFullYear() : 2023,
        url: c.url,
        summaryAr: c.excerpt,
        summaryEn: c.excerpt,
        topics: [c.organization, c.authorityLevel],
        authorityLevel: c.authorityLevel,
        isVerifiedRetrieved: true,
        lastUpdated: c.lastUpdated,
        excerpt: c.excerpt,
        chunkId: c.chunkId,
      }));
    }
  } catch (err) {
    console.warn('[EvidenceRetriever] Vector RAG retrieval notice:', err);
  }

  // Secondary fallback to verified repository
  const query = symptomText.toLowerCase();
  const matched = VERIFIED_EVIDENCE_REPOSITORY.filter((source) => {
    return source.topics.some((topic) => query.includes(topic.toLowerCase()));
  });

  if (matched.length === 0) {
    return [VERIFIED_EVIDENCE_REPOSITORY[2], VERIFIED_EVIDENCE_REPOSITORY[0]];
  }

  return matched.slice(0, 3);
}

export function checkDrugInteractions(drugNames: string[]): DrugInteractionResult[] {
  if (drugNames.length < 2) return [];

  const foundInteractions: DrugInteractionResult[] = [];
  const normalizedNames = drugNames.map(d => d.trim().toLowerCase());

  for (const item of VERIFIED_DRUG_INTERACTIONS) {
    const a = item.drugA.toLowerCase();
    const b = item.drugB.toLowerCase();

    const hasA = normalizedNames.some(d => d.includes(a) || a.includes(d));
    const hasB = normalizedNames.some(d => d.includes(b) || b.includes(d));

    if (hasA && hasB) {
      foundInteractions.push(item);
    }
  }

  return foundInteractions;
}

export function interpretLabResults(inputs: LabParameterInput[]): LabAnalysisResult[] {
  const results: LabAnalysisResult[] = [];

  for (const input of inputs) {
    const matchedRef = LAB_REFERENCE_KNOWLEDGE.find(
      ref => ref.name.toLowerCase() === input.name.toLowerCase() || ref.nameAr.includes(input.name)
    );

    if (matchedRef) {
      let status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW' = 'NORMAL';
      if (input.value > matchedRef.max * 1.5) {
        status = 'CRITICAL_HIGH';
      } else if (input.value > matchedRef.max) {
        status = 'HIGH';
      } else if (input.value < matchedRef.min * 0.6) {
        status = 'CRITICAL_LOW';
      } else if (input.value < matchedRef.min) {
        status = 'LOW';
      }

      let followUpAr = 'النتيجة ضمن النطاق المرجعي المتوقع. ينصح بإعادة الفحص السنوي الروتيني.';
      let followUpEn = 'Value is within expected reference range. Continue routine wellness screening.';

      if (status === 'HIGH' || status === 'CRITICAL_HIGH') {
        followUpAr = `القيمة أعلى من الحد المرجعي (${matchedRef.max} ${matchedRef.unit}). ناقش مع طبيبك الأسباب المحتملة وخطة المتابعة الدوائية والغذائية.`;
        followUpEn = `Value is above the upper reference threshold (${matchedRef.max} ${matchedRef.unit}). Clinical correlation with your physician is recommended.`;
      } else if (status === 'LOW' || status === 'CRITICAL_LOW') {
        followUpAr = `القيمة دون الحد المرجعي الأدنى (${matchedRef.min} ${matchedRef.unit}). ينصح بمراجعة الطبيب لتقييم الحاجة لتعويض أو فحوصات مكملة.`;
        followUpEn = `Value is below lower threshold (${matchedRef.min} ${matchedRef.unit}). Consult physician for potential deficiency workup.`;
      }

      results.push({
        parameterName: matchedRef.name,
        parameterNameAr: matchedRef.nameAr,
        value: input.value,
        unit: input.unit || matchedRef.unit,
        referenceRange: {
          min: matchedRef.min,
          max: matchedRef.max,
          optimalText: matchedRef.optimalText,
        },
        status,
        clinicalSignificanceAr: matchedRef.clinicalSignificanceAr,
        clinicalSignificanceEn: matchedRef.clinicalSignificanceEn,
        suggestedFollowUpAr: followUpAr,
        suggestedFollowUpEn: followUpEn,
      });
    }
  }

  return results;
}
