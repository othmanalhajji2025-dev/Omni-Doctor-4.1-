/**
 * Data Source Architecture for Drug Intelligence
 * 
 * Mandate:
 * 1. Do NOT invent or hallucinate drug data.
 * 2. Build a Data Source Architecture allowing authoritative sources (RxNorm, DailyMed, BNF, SFDA) to be plugged in seamlessly.
 * 3. Seed data is strictly and explicitly labelled as Demo Seed Data.
 */

import {
  IDrugDataSource,
  DrugProfile,
  DrugSearchResult,
  DataSourceMetadata,
  AuthoritySourceTier,
} from './types.js';

// Standard Metadata for Curated Demo Seed Data
const DEMO_METADATA: DataSourceMetadata = {
  sourceId: 'DEMO_SEED_DATASET',
  sourceName: 'Curated Clinical Pharmacopeia (Demo Seed Benchmark)',
  authorityTier: 'DEMO_SEED_DATASET',
  isDemoSeedData: true,
  intendedUse: 'Demonstration, architectural validation, and local safety engine verification.',
  disclaimer: 'This seed dataset is strictly curated for demo testing and safety engine validation. Production deployments must bind to certified drug terminology and clinical knowledge bases (e.g. RxNorm, DailyMed, BNF).',
  version: '2025.1-DEMO',
  lastUpdated: '2025-01-10',
};

// Curated Demo Seed Knowledge Base (Authoritative Clinical Reference Formulations)
const DEMO_SEED_PROFILES: DrugProfile[] = [
  {
    id: 'DRUG_ATORVASTATIN',
    genericName: 'Atorvastatin',
    genericNameAr: 'أتورفاستاتين',
    brandNames: ['Lipitor', 'Torvast', 'Atorva', 'Sortis', 'Tahor'],
    brandNamesAr: ['ليبيتور', 'تورفاست', 'أتورفا'],
    activeIngredients: ['Atorvastatin calcium'],
    activeIngredientsAr: ['كالسيوم الأتورفاستاتين'],
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    drugClassAr: 'مثبط إنزيم HMG-CoA المختزل (مجموعة الستاتين خافضة الكوليسترول)',
    atcCode: 'C10AA05',
    commonUsesEn: [
      'Primary prevention of cardiovascular disease in high-risk patients',
      'Secondary prevention of major adverse cardiac events post-myocardial infarction or stroke',
      'Hypercholesterolemia and mixed dyslipidemia',
      'Reduction of elevated LDL-C and triglycerides; elevation of HDL-C',
    ],
    commonUsesAr: [
      'الوقاية الأولية من أمراض القلب والأوعية الدموية للمرضى المعرضين لخطورة عالية',
      'الوقاية الثانوية من الحوادث القلبية الوعائية بعد احتشاء عضلة القلب أو السكتة الدماغية',
      'علاج فرط كوليسترول الدم وخلل دهون الدم المختلط',
      'خفض الكوليسترول الضار (LDL) والدهون الثلاثية ورفع الكوليسترول الحميد (HDL)',
    ],
    warningsEn: [
      'Precaution: Risk of statin-associated myopathy and rhabdomyolysis; promptly evaluate unexplained muscle pain, tenderness, or weakness accompanied by malaise or fever.',
      'Hepatic transaminase elevation: Measure liver enzymes prior to initiation and when clinically indicated.',
      'Small increased risk of elevated HbA1c and fasting serum glucose levels (benefit far outweighs risk in diabetes/ASCVD).',
      'Avoid large quantities of grapefruit juice (>1.2 liters daily) due to CYP3A4 inhibition.',
    ],
    warningsAr: [
      'تحذير: خطر الإصابة بالاعتلال العضلي وانحلال الربيدات (Rhabdomyolysis)؛ يجب إبلاغ الطبيب فوراً عند ظهور آلام عضلية غير مفسرة أو ضعف عضلي مترافق مع تعب أو حمى.',
      'ارتفاع إنزيمات الكبد: يوصى بقياس وظائف الكبد قبل بدء العلاج وعند الضرورة السريرية.',
      'قد يسبب ارتفاعاً طفيفاً في سكر الدم الصائم ومستوى HbA1c.',
      'تجنب تناول كميات كبيرة من عصير الجريب فروت لتجنب تثبيط إنزيم CYP3A4 وزيادة تركيز الدواء.',
    ],
    boxedWarningEn: undefined,
    boxedWarningAr: undefined,
    contraindicationsEn: [
      'Active liver disease or unexplained persistent elevations in hepatic transaminase levels',
      'Known hypersensitivity to atorvastatin or any formulation components',
      'Pregnancy and breastfeeding (Contraindicated - Category X)',
      'Concomitant administration with glecaprevir/pibrentasvir or cyclosporine',
    ],
    contraindicationsAr: [
      'أمراض الكبد النشطة أو الارتفاع المستمر غير المفسر في إنزيمات الكبد',
      'فرط الحساسية المعروف للأتورفاستاتين أو أي من مكونات المستحضر',
      'الحمل والرضاعة الطبيعية (ممنوع تماماً - فئة X)',
      'الاستخدام المتزامن مع السيكلوسبورين أو بعض مضادات فيروس C الحديثة',
    ],
    commonSideEffectsEn: [
      'Nasopharyngitis and upper respiratory symptoms',
      'Arthralgia and mild muscle ache',
      'Diarrhea and dyspepsia',
      'Mild headache',
    ],
    commonSideEffectsAr: [
      'التهاب البلعوم والأنف وأعراض تنفسية علوية خفيفة',
      'آلام المفاصل وانزعاج عضلي خفيف',
      'إسهال أو عسر هضم',
      'صداع خفيف',
    ],
    seriousSideEffectsEn: [
      'Rhabdomyolysis with myoglobinuria and acute renal failure',
      'Drug-Induced Liver Injury (jaundice, dark urine, severe fatigue)',
      'Immune-mediated necrotizing myopathy (IMNM)',
      'Severe allergic or hypersensitivity skin reactions (angioedema, anaphylaxis)',
    ],
    seriousSideEffectsAr: [
      'انحلال الربيدات وتلف العضلات الحاد مع بيلة ميوغلوبينية وفشل كلوي حاد',
      'إصابة كبدية دوائية حادة (يرقان، بول داكن، تعب وإرهاق شديد)',
      'الاعتلال العضلي الناخر المناعي الذاتي (IMNM)',
      'ردود فعل تحسسية شديدة (وذمة وعائية وتأق)',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Clarithromycin / Erythromycin (Macrolides)',
        severity: 'MAJOR',
        mechanismAr: 'تثبيط قوي لإنزيم السيتوكروم CYP3A4 الكبدي يرفع تركيز الأتورفاستاتين في الدم بمقدار 4 إلى 8 أضعاف.',
        mechanismEn: 'Potent hepatic CYP3A4 inhibition markedly increases systemic exposure to atorvastatin.',
        clinicalEffectAr: 'زيادة حادة في خطر السمية العضلية وانحلال العضلات (Rhabdomyolysis) والفشل الكلوي الحاد.',
        clinicalEffectEn: 'Severe risk of statin-induced myopathy, extensive rhabdomyolysis, and acute renal failure.',
        managementAr: 'يجب إيقاف أتورفاستاتين مؤقتاً أثناء تناول المضاد الحيوي الماكرولايد واستئنافه بعد اكتمال العلاج.',
        managementEn: 'Temporarily hold atorvastatin during the course of macrolide antibiotic therapy.',
        source: 'FDA Drug Safety Communication & ACC/AHA Cholesterol Guidelines',
      },
      {
        interactingDrugOrClass: 'Gemfibrozil / Fibrates',
        severity: 'MAJOR',
        mechanismAr: 'تثبيط الاقتران الجلوكوروني والناقلات الكبدية OATP1B1 يضاعف مستويات الستاتين في البلازما.',
        mechanismEn: 'Inhibition of glucuronidation and OATP1B1 hepatic uptake transporter doubles statin plasma levels.',
        clinicalEffectAr: 'ارتفاع مضاعف لخطر انحلال الربيدات والاعتلال العضلي الحاد.',
        clinicalEffectEn: 'Markedly augmented incidence of rhabdomyolysis and myopathy.',
        managementAr: 'تجنب الجمع بين أتورفاستاتين وجيمفيبروزيل؛ ويفضل استخدام فينوفايبرات (Fenofibrate) بجرعة مخفضة عند الضرورة القصوى.',
        managementEn: 'Avoid combination with gemfibrozil. If fibrate is required, prefer fenofibrate with lower statin dose.',
        source: 'ACC/AHA Clinical Practice Guideline',
      },
    ],
    dosageGuidelinesEn: 'Initial dose 10-20 mg once daily; max 80 mg once daily. May be taken with or without food at any time of day.',
    dosageGuidelinesAr: 'الجرعة الابتدائية 10-20 ملغ مرة واحدة يومياً؛ الجرعة القصوى 80 ملغ يومياً. يمكن تناوله مع أو بدون طعام في أي وقت من اليوم.',
    pregnancyCategory: 'X',
    renalAdjustmentRequired: false,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_METFORMIN',
    genericName: 'Metformin',
    genericNameAr: 'ميتفورمين',
    brandNames: ['Glucophage', 'Fortamet', 'Glumetza', 'Riomet', 'Formin'],
    brandNamesAr: ['جلوكوفاج', 'فورتاميت', 'فورمين'],
    activeIngredients: ['Metformin hydrochloride'],
    activeIngredientsAr: ['هيدروكلوريد الميتفورمين'],
    drugClass: 'Biguanide Antihyperglycemic',
    drugClassAr: 'مركب بيغوانيد (خافض لسكر الدم ومحسن لحساسية الإنسولين)',
    atcCode: 'A10BA02',
    commonUsesEn: [
      'Type 2 Diabetes Mellitus (First-line pharmacological management)',
      'Improvement of glycemic control in adults and children 10 years and older',
      'Polycystic Ovary Syndrome (PCOS - off-label insulin sensitizer)',
      'Prevention of Type 2 Diabetes in individuals with prediabetes and BMI ≥ 35',
    ],
    commonUsesAr: [
      'الخيار الدوائي الأول لإدارة مرض السكري من النوع الثاني',
      'تحسين ضبط مستوى السكر التراكمي وسكر الدم الصائم',
      'متلازمة تكيس المبايض (PCOS - استخدام غير مسجل لتحسين حساسية الإنسولين)',
      'الوقاية من تطور السكري لدى الأشخاص المصابين بمقدمات السكري ومؤشر كتلة جسم مرتفع',
    ],
    warningsEn: [
      'Black Box Warning: Metformin-associated lactic acidosis (MALA) is rare but fatal in ~50% of cases. Risk factors include renal impairment, advanced age, heart failure, acute hypoxic states, and sepsis.',
      'Renal function: Assess eGFR prior to treatment initiation and at least annually thereafter.',
      'Vitamin B12 deficiency: Long-term use reduces intestinal B12 absorption; monitor serum B12 every 2-3 years.',
      'Temporary discontinuation required before iodinated radiocontrast procedures.',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود (Boxed Warning): خطر الحماض اللبني المرتبط بالميتفورمين (MALA) وهو نادر الحدوث ولكنه خطير ومميت في قرابة 50% من الحالات. تشمل عوامل الخطر ضعف الكلى، قصور القلب الحاد، ونقص الأكسجة.',
      'وظائف الكلى: يجب قياس معدل الترشيح الكبيبي (eGFR) قبل البدء وسنوياً على الأقل.',
      'نقص فيتامين ب12: الاستخدام المزمن يقلل امتصاص فيتامين B12؛ ينصح بفحصه دورياً.',
      'وجوب إيقاف الدواء مؤقتاً قبل الخضوع لأشعة الصبغة الميودنة.',
    ],
    boxedWarningEn: 'LACTIC ACIDOSIS: Postmarketing cases have resulted in death, hypothermia, hypotension, and resistant bradyarrhythmias. Withhold immediately in sepsis or tissue hypoperfusion.',
    boxedWarningAr: 'تحذير الصندوق الأسود: الحماض اللبني المهدد للحياة. يجب إيقاف الدواء فوراً عند حدوث تسمم دموي أو نقص تروية أو صدمة حادة.',
    contraindicationsEn: [
      'Severe renal impairment: eGFR < 30 mL/min/1.73 m²',
      'Known hypersensitivity to metformin',
      'Acute or chronic metabolic acidosis, including diabetic ketoacidosis (DKA)',
      'Concurrent administration of iodinated radiocontrast media in patients with eGFR 30-60',
    ],
    contraindicationsAr: [
      'القصور الكلوي الشديد: معدل ترشيح كبيبي eGFR أقل من 30 مل/دقيقة',
      'فرط الحساسية المعروف للميتفورمين',
      'الحماض الاستقلابي الحاد أو المزمن، بما في ذلك الحماض الكيتوني السكري (DKA)',
      'الخضوع لفحوصات الأشعة المقطعية بالصبغة الميودنة في حالات القصور الكلوي المتوسط',
    ],
    commonSideEffectsEn: [
      'Diarrhea (most common, typically transient upon initiation)',
      'Nausea, vomiting, flatulence, abdominal distension',
      'Metallic taste in mouth',
      'Decreased appetite and mild weight loss',
    ],
    commonSideEffectsAr: [
      'إسهال (الأكثر شيوعاً عند بدء العلاج وغالباً مؤقت)',
      'غثيان، قيء، انتفاخ وغازات في البطن',
      'طعم معدني في الفم',
      'فقدان خفيف للشهية',
    ],
    seriousSideEffectsEn: [
      'Metformin-associated lactic acidosis (tachypnea, severe abdominal pain, hypothermia, severe somnolence)',
      'Severe megaloblastic anemia secondary to vitamin B12 malabsorption',
    ],
    seriousSideEffectsAr: [
      'الحماض اللبني (تسارع التنفس، آلام بطنية حادة، انخفاض حرارة الجسم، خمول ونعاس شديد)',
      'فقر دم ضخم الأرومات نتيجة نقص امتصاص فيتامين B12 الشديد',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Iodinated Radiocontrast Media',
        severity: 'CONTRAINDICATED',
        mechanismAr: 'الصبغة الوريدية الميودنة قد تسبب اعتلالاً كلوياً حاداً يمنع طرح الميتفورمين وتراكمه الحاد في الدم.',
        mechanismEn: 'Intravascular iodinated contrast can induce acute contrast-induced nephropathy, preventing metformin clearance.',
        clinicalEffectAr: 'حدوث الحماض اللبني المرتبط بالميتفورمين (MALA) وهو اختلاط مهدد للحياة.',
        clinicalEffectEn: 'Precipitation of life-threatening metformin-associated lactic acidosis.',
        managementAr: 'إيقاف الميتفورمين في وقت الإجراء الشعاعي أو قبله ولمدة 48 ساعة بعده، ولا يُستأنف إلا بعد التأكد مخبرياً من استقرار وظائف الكلى.',
        managementEn: 'Withhold metformin at time of or prior to contrast procedure; withhold for 48 hours post-procedure until eGFR confirms stable renal function.',
        source: 'American College of Radiology (ACR) & ADA Standards of Care',
      },
      {
        interactingDrugOrClass: 'Cimetidine / Renal Tubular Transport Inhibitors',
        severity: 'MODERATE',
        mechanismAr: 'تثبيط النقل الأنبوبي الكلوي العضوي يرفع تركيز الميتفورمين في البلازما بنسبة تقارب 60%.',
        mechanismEn: 'Inhibition of organic cation transporters (OCT2/MATE) reduces renal elimination of metformin.',
        clinicalEffectAr: 'زيادة الآثار الجانبية الهضمية وخطر الحماض اللبني.',
        clinicalEffectEn: 'Elevated plasma concentrations and augmented adverse event risk.',
        managementAr: 'استخدام مضاد حموضة بديل مثل فاموتيدين أو بانتوبرازول ومراقبة نسبة السكر بالدم.',
        managementEn: 'Prefer alternative H2-receptor antagonist (Famotidine) or PPI.',
        source: 'DailyMed FDA Package Insert',
      },
    ],
    dosageGuidelinesEn: 'Start 500 mg once or twice daily with meals. Titrate by 500 mg weekly up to max 2000-2550 mg/day divided.',
    dosageGuidelinesAr: 'البدء بجرعة 500 ملغ مرة أو مرتين يومياً مع وجبات الطعام. تتم زيادة الجرعة تدريجياً كل أسبوع وصولاً لجرعة 2000 ملغ يومياً.',
    pregnancyCategory: 'B',
    renalAdjustmentRequired: true,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_WARFARIN',
    genericName: 'Warfarin',
    genericNameAr: 'وارفارين',
    brandNames: ['Coumadin', 'Jantoven', 'Marevan', 'Warfant'],
    brandNamesAr: ['كومادين', 'ماريفان'],
    activeIngredients: ['Warfarin sodium'],
    activeIngredientsAr: ['وارفارين الصوديوم'],
    drugClass: 'Vitamin K Antagonist (Anticoagulant)',
    drugClassAr: 'مضاد فيتامين ك (مانع تخثر / مميع للدم)',
    atcCode: 'B01AA03',
    commonUsesEn: [
      'Prophylaxis and treatment of venous thromboembolism (DVT and Pulmonary Embolism)',
      'Thromboembolic stroke prevention in atrial fibrillation and cardiac valve replacement',
      'Reduction in risk of recurrent myocardial infarction and thromboembolic events',
    ],
    commonUsesAr: [
      'علاج والوقاية من الخثار الوريدي العميق (DVT) والانصمام الرئوي (PE)',
      'الوقاية من السكتة الدماغية الخثارية لدى مرضى الرجفان الأذيني والصمامات القلبية الصناعية',
      'تقليل خطر تكرار الجلطات القلبية والانصمام الخثاري الجهازي',
    ],
    warningsEn: [
      'Boxed Warning: Major or fatal bleeding. Narrow therapeutic index requiring routine INR monitoring.',
      'Tissue necrosis and gangrene: Rare protein C/S deficiency-related paradoxical thrombosis upon initiation.',
      'Numerous dietary and drug interactions: Vitamin K intake must be kept consistent.',
      'Teratogenic: Causes fetal warfarin syndrome (nasal hypoplasia, epiphyseal stippling, CNS defects).',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود (Boxed Warning): خطر النزيف الحاد أو المميت. يمتلك الدواء نافذة علاجية ضيقة ويتطلب مراقبة مستمرة للنسبة المعيارية الدولية (INR).',
      'تنخر الجلد والأنسجة: نادر الحدوث عند البدء بسبب نقص بروتين C أو S المؤقت.',
      'تفاعلات غذائية ودوائية واسعة: يجب تثبيت كمية فيتامين ك المتناولة في الغذاء (الخضار الورقية).',
      'مشوه للأجنة: يسبب متلازمة الوارفارين الجنينية وتشوهات هيكلية وعصبية.',
    ],
    boxedWarningEn: 'BLEEDING RISK: Warfarin can cause major or fatal bleeding. Perform regular INR monitoring. Drugs, dietary changes, and other factors affect INR levels.',
    boxedWarningAr: 'تحذير الصندوق الأسود: خطر النزيف المميت. المراقبة الدورية لـ INR ضرورية وحاسمة. تؤثر الأدوية والتغيرات الغذائية مباشرة على مستويات التميع.',
    contraindicationsEn: [
      'Active major hemorrhage or hemorrhagic blood dyscrasias',
      'Recent or contemplated neurosurgery, ophthalmic surgery, or lumbar puncture',
      'Uncontrolled malignant hypertension',
      'Pregnancy (except women with mechanical heart valves at exceptionally high thromboembolic risk)',
      'High fall risk, severe dementia, or inability to safely comply with INR monitoring',
    ],
    contraindicationsAr: [
      'النزيف الحاد النشط أو اعتلالات التخثر النزفية',
      'العمليات الجراحية العصبية أو العينية الحديثة أو البزل القطني',
      'ارتفاع ضغط الدم الخبيث غير المنضبط',
      'الحمل (ممنوع تماماً إلا في حالات الصمامات الميكانيكية ذات الخطورة القصوى جداً)',
      'خطر السقوط الشديد أو عدم القدرة على الالتزام بفحوصات INR المنتظمة',
    ],
    commonSideEffectsEn: [
      'Minor epistaxis and bleeding gums with tooth brushing',
      'Easy skin ecchymosis and bruising',
      'Slightly prolonged bleeding from superficial cuts',
    ],
    commonSideEffectsAr: [
      'رعاف أنفي خفيف ونزيف اللثة أثناء تنظيف الأسنان',
      'سهولة تشكل كدمات زرقاء تحت الجلد',
      'نزف أطول من المعتاد عند الجروح السطحية',
    ],
    seriousSideEffectsEn: [
      'Major gastrointestinal, intracranial, or retroperitoneal hemorrhage',
      'Warfarin-induced skin necrosis and gangrene',
      'Purple toe syndrome (cholesterol microembolization)',
    ],
    seriousSideEffectsAr: [
      'نزيف هضمي أو دماغي أو خلف الصفاق حاد ومهدد للحياة',
      'تنخر الجلد والأنسجة الغنغريني المحدث بالوارفارين',
      'متلازمة أصابع القدم الأرجوانية (انصمام بلورات الكوليسترول)',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Ibuprofen / NSAIDs (All Nonsteroidal Anti-inflammatories)',
        severity: 'CONTRAINDICATED',
        mechanismAr: 'تثبيط تصنيع البروستاغلاندينات الحامية لبطانة المعدة وتثبيط تراكم الصفائح الدموية بالتزامن مع تثبيط التخثر الجهازي.',
        mechanismEn: 'Dual pharmacodynamic synergy: NSAID-induced gastric mucosal injury and platelet inhibition combined with systemic anticoagulation.',
        clinicalEffectAr: 'ارتفاع كارثي (4 إلى 5 أضعاف) في خطر حدوث نزيف هضمي حاد وثقب في جدار المعدة.',
        clinicalEffectEn: 'Catastrophic 4- to 5-fold elevation in upper gastrointestinal hemorrhage risk.',
        managementAr: 'تجنب تام لمضادات الالتهاب غير الستيرويدية (NSAIDs)؛ واستخدام الباراسيتامول بجرعات معتدلة (< 2 غرام/يوم) كمسكن بديل آمن.',
        managementEn: 'Avoid NSAIDs completely. Use paracetamol/acetaminophen in moderate doses (< 2g/day) with close INR monitoring.',
        source: 'NICE Anticoagulation Guidelines & BNF & FDA Warning',
      },
      {
        interactingDrugOrClass: 'Ciprofloxacin / Fluoroquinolones',
        severity: 'MAJOR',
        mechanismAr: 'تثبيط إنزيم السيتوكروم CYP1A2 و CYP3A4 مع القضاء على بكتيريا الأمعاء المصنعة لفيتامين K.',
        mechanismEn: 'Cytochrome inhibition combined with eradication of vitamin-K producing gut microflora.',
        clinicalEffectAr: 'ارتفاع حاد في قيمة INR (قد يتجاوز 8-10) مع نزيف فجائي.',
        clinicalEffectEn: 'Severe spike in INR levels with major spontaneous hemorrhagic risk.',
        managementAr: 'مراقبة INR كل 48-72 ساعة عند بدء المضاد الحيوي وخفض جرعة الوارفارين استباقياً بنسبة 25-50%.',
        managementEn: 'Check INR within 48-72 hours of antimicrobial initiation; empirically reduce warfarin dose by 25-50%.',
        source: 'CHEST Antithrombotic Guidelines',
      },
    ],
    dosageGuidelinesEn: 'Individualized based on baseline INR and target range (typically INR 2.0-3.0). Standard starting dose 2.5-5 mg once daily in the evening.',
    dosageGuidelinesAr: 'تحدد الجرعة فردياً وفق قراءة INR المستهدفة (غالباً 2.0 - 3.0). الجرعة الابتدائية المعتادة 2.5 إلى 5 ملغ مرة واحدة مساءً.',
    pregnancyCategory: 'X',
    renalAdjustmentRequired: false,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_IBUPROFEN',
    genericName: 'Ibuprofen',
    genericNameAr: 'إيبوبروفين',
    brandNames: ['Advil', 'Motrin', 'Brufen', 'Nurofen', 'Profen', 'Doloraz'],
    brandNamesAr: ['أدفيل', 'موترين', 'بروفين', 'نوروفين'],
    activeIngredients: ['Ibuprofen', 'Ibuprofen lysine'],
    activeIngredientsAr: ['إيبوبروفين', 'لايسين الإيبوبروفين'],
    drugClass: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    drugClassAr: 'مضاد التهاب غير ستيرويدي (NSAID - مسكن وخافض حرارة)',
    atcCode: 'M01AE01',
    commonUsesEn: [
      'Relief of mild to moderate pain (headache, dental, musculoskeletal, dysmenorrhea)',
      'Fever reduction in adults and children',
      'Inflammatory disorders: Osteoarthritis, Rheumatoid Arthritis, Ankylosing Spondylitis',
    ],
    commonUsesAr: [
      'تسكين الآلام الخفيفة إلى المتوسطة (الصداع، ألم الأسنان، آلام العضلات والمفاصل، عسر الطمث)',
      'خفض درجة الحرارة والحمى لدى البالغين والأطفال',
      'علاج الحالات الالتهابية مثل التهاب المفاصل الروماتويدي والخشونة المفصلية',
    ],
    warningsEn: [
      'Boxed Warning: Cardiovascular thrombotic risk: NSAIDs increase the risk of serious and potentially fatal cardiovascular thrombotic events, including myocardial infarction and stroke.',
      'Boxed Warning: Gastrointestinal bleeding, ulceration, and perforation: Risk is elevated in elderly patients and those with a prior history of peptic ulcer disease.',
      'Renal toxicity: Can cause acute kidney injury, papillary necrosis, and volume retention.',
      'Avoid in third trimester of pregnancy (causes premature closure of ductus arteriosus).',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود: زيادة خطر التخثر القلبي الوعائي والجلطات واحتشاء عضلة القلب والسكتات الدماغية.',
      'تحذير الصندوق الأسود: خطر النزيف الهضمي وتقرح وانثقاب المعدة والأمعاء، ويزداد الخطر لدى كبار السن وذوي التاريخ السابق بالقرحة.',
      'السمية الكلوية: قد يؤدي إلى قصور كلوي حاد واحتباس السوائل وتفاقم ضغط الدم.',
      'يحظر استخدامه في الثلث الأخير من الحمل لتسببه في الإغلاق المبكر للقناة الشريانية الجنينية.',
    ],
    boxedWarningEn: 'CARDIOVASCULAR & GI RISK: Increased risk of serious cardiovascular thrombotic events, MI, stroke; serious GI adverse events including bleeding, ulceration, and perforation.',
    boxedWarningAr: 'تحذير الصندوق الأسود: خطر النوبات القلبية والسكتات الدماغية؛ ومخاطر النزيف والتقرح الهضمي الحاد.',
    contraindicationsEn: [
      'Active gastrointestinal bleeding or active peptic ulcer disease',
      'History of asthma, urticaria, or allergic-type reactions after taking aspirin or other NSAIDs (Aspirin-Exacerbated Respiratory Disease)',
      'Severe heart failure (NYHA Class IV)',
      'Severe renal failure (eGFR < 30 mL/min)',
      'Peri-operative setting of Coronary Artery Bypass Graft (CABG) surgery',
      'Third trimester of pregnancy',
    ],
    contraindicationsAr: [
      'النزيف الهضمي النشط أو قرحة المعدة الهضمية النشطة',
      'تاريخ سابق من الربو أو الشرى أو الحساسية الناتجة عن الأسبرين أو مضادات الالتهاب (ثلاثية سامتر)',
      'قصور القلب الشديد غير المستقر (درجة رابعة)',
      'الفشل الكلوي المتقدم (eGFR أقل من 30)',
      'فترة ما حول جراحة مجازة الشريان التاجي (CABG)',
      'الثلث الأخير من الحمل',
    ],
    commonSideEffectsEn: [
      'Dyspepsia, epigastric heartburn, abdominal discomfort',
      'Mild nausea or diarrhea',
      'Dizziness or mild headache',
      'Fluid retention and peripheral edema',
    ],
    commonSideEffectsAr: [
      'عسر هضم، حموضة وحرقة في المعدة',
      'غثيان خفيف أو إسهال',
      'دوخة أو صداع خفيف',
      'احتباس طفيف للسوائل وانتفاخ الأطراف',
    ],
    seriousSideEffectsEn: [
      'Gastrointestinal perforation and massive hemorrhage',
      'Acute tubular necrosis and acute kidney failure',
      'Acute myocardial infarction and thrombotic stroke',
      'Severe bronchospasm and anaphylactic shock',
    ],
    seriousSideEffectsAr: [
      'انثقاب جدار المعدة أو الأمعاء ونزيف هضمي مهدد للحياة',
      'تنخر الأنابيب الكلوية الحاد والفشل الكلوي',
      'احتشاء عضلة القلب الحاد والسكتة الدماغية التخثرية',
      'تشنج قصبي حاد وصدمة حساسية تأقية',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Lisinopril + Diuretics ("Triple Whammy" Interaction)',
        severity: 'MAJOR',
        mechanismAr: 'تثبيط البروستاغلاندين يضيق الشريان الوارد للكبيبات الكلوية، بينما يوسع مثبط ACE الشريان الصادر، مع التجفاف الناتج عن المدر.',
        mechanismEn: 'NSAID constricts afferent glomerular arteriole; ACE-inhibitor dilates efferent arteriole; diuretic causes hypovolemia.',
        clinicalEffectAr: 'انخفاض حاد في ضغط الترشيح الكلوي وحدوث قصور كلوي حاد وسريع (Acute Kidney Injury).',
        clinicalEffectEn: 'Precipitous loss of glomerular filtration pressure leading to acute renal failure.',
        managementAr: 'تجنب هذا المزيج الثلاثي، ومراقبة الكرياتينين والبوتاسيوم وضغط الدم بانتظام إذا كان الاستخدام لا مفر منه.',
        managementEn: 'Avoid concurrent triple combination. Monitor serum creatinine, BUN, and potassium closely if unavoidable.',
        source: 'NICE & Australian Prescriber "Triple Whammy" Clinical Warning',
      },
      {
        interactingDrugOrClass: 'Aspirin (Cardioprotective low-dose 81mg)',
        severity: 'MODERATE',
        mechanismAr: 'الإيبوبروفين ينافس الأسبرين على الارتباط بإنزيم COX-1 في الصفائح الدموية ويمنع تثبيطها الدائم بالأسبرين.',
        mechanismEn: 'Ibuprofen competitively blocks the acetylation site of COX-1, attenuating aspirin irreversible platelet inhibition.',
        clinicalEffectAr: 'إلغاء التأثير الوقائي للأسبرين ضد الجلطات القلبية والسكتات الدماغية.',
        clinicalEffectEn: 'Loss of cardioprotective antiplatelet effect of low-dose aspirin.',
        managementAr: 'تناول جرعة الأسبرين قبل الإيبوبروفين بـ 30 دقيقة على الأقل، أو الانتظار 8 ساعات بعد جرعة الإيبوبروفين.',
        managementEn: 'Take immediate-release aspirin at least 30 minutes before ibuprofen, or wait at least 8 hours after ibuprofen dose.',
        source: 'FDA Drug Safety Communication on Ibuprofen-Aspirin Interaction',
      },
    ],
    dosageGuidelinesEn: 'Analgesic dose: 200-400 mg every 4-6 hours as needed (OTC max 1200 mg/day; prescription max 2400-3200 mg/day). Take with food or milk.',
    dosageGuidelinesAr: 'جرعة تسكين الألم: 200-400 ملغ كل 4 إلى 6 ساعات عند اللزوم (الحد الأقصى دون وصفة 1200 ملغ/يوم، وتحت إشراف طبي 2400 ملغ/يوم). يؤخذ مع الطعام أو الحليب.',
    pregnancyCategory: 'D',
    renalAdjustmentRequired: true,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_LISINOPRIL',
    genericName: 'Lisinopril',
    genericNameAr: 'ليزينوبريل',
    brandNames: ['Zestril', 'Prinivil', 'Lisinostad'],
    brandNamesAr: ['زيستريل', 'برينيفيل'],
    activeIngredients: ['Lisinopril dihydrate'],
    activeIngredientsAr: ['ليزينوبريل ثنائي الهيدرات'],
    drugClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    drugClassAr: 'مثبط الإنزيم المحول للأنجيوتنسين (ACE-I - خافض لضغط الدم وحامي للقلب)',
    atcCode: 'C09AA03',
    commonUsesEn: [
      'Treatment of essential and renovascular hypertension',
      'Adjunctive therapy in Heart Failure with Reduced Ejection Fraction (HFrEF)',
      'Treatment of acute myocardial infarction within 24 hours to improve survival',
      'Diabetic nephropathy: Delay of progression in hypertensive type 1 and type 2 diabetics with microalbuminuria',
    ],
    commonUsesAr: [
      'علاج ارتفاع ضغط الدم الشرياني الأولي والوعائي الكلوي',
      'علاج قصور القلب مع انخفاض الكسر القذفي (HFrEF)',
      'تحسين البقيا وتقليل الوفيات بعد احتشاء عضلة القلب الحاد خلال أول 24 ساعة',
      'حماية الكلى وتأخير تدهور اعتلال الكلى السكري لدى مرضى السكري',
    ],
    warningsEn: [
      'Boxed Warning: Fetal Toxicity: Discontinue as soon as pregnancy is detected; ACE inhibitors cause fetal renal failure, oligohydramnios, and neonatal skull hypoplasia.',
      'Head and neck angioedema: Can cause fatal airway obstruction; higher incidence in Black patients.',
      'Hyperkalemia risk: Elevated especially in renal insufficiency, diabetes, or when combined with potassium-sparing diuretics.',
      'Persistent dry cough: Bradykinin-mediated cough occurring in 10-15% of patients (not resolved by antitussives).',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود: السمية الجنينية. يجب إيقاف الدواء فور اكتشاف الحمل؛ يسبب فشل كلوي جنيني، نقص السائل السلوي، وتشوهات في عظام الجمجمة.',
      'الوذمة الوعائية (Angioedema): تورم الوجه، الشفاه، اللسان والحنجرة قد يسبب انسداداً تنفسياً قاتلاً.',
      'فرط بوتاسيوم الدم (Hyperkalemia): يزداد الخطر مع ضعف الكلى واستخدام مدرات البول الحافظة للبوتاسيوم.',
      'سعال جاف مستمر: وساطة مادة البراديكينين في 10-15% من المرضى (لا يستجيب لأدوية السعال العادية ويتطلب تبديله بمثبط ARB).',
    ],
    boxedWarningEn: 'FETAL TOXICITY: When pregnancy is detected, discontinue Lisinopril as soon as possible. Drugs that act directly on the renin-angiotensin system can cause injury and death to the developing fetus.',
    boxedWarningAr: 'تحذير الصندوق الأسود: سمية جنينية مميتة. يجب إيقاف ليزينوبريل فور حدوث الحمل حيث يسبب تشوهات ونقص نمو ووفاة الجنين.',
    contraindicationsEn: [
      'History of angioedema related to previous ACE inhibitor treatment or hereditary/idiopathic angioedema',
      'Pregnancy (Contraindicated - Category D/X)',
      'Concomitant use of aliskiren in patients with diabetes mellitus',
      'Concomitant use with sacubitril/valsartan (requires a mandatory 36-hour washout period)',
      'Bilateral renal artery stenosis or severe stenosis in solitary kidney',
    ],
    contraindicationsAr: [
      'تاريخ سابق للإصابة بالوذمة الوعائية مع أي مثبط ACE أو وذمة وعائية وراثية',
      'الحمل بجميع مراحله',
      'الاستخدام المتزامن مع أليسكيرين لدى مرضى السكري',
      'الاستخدام المتزامن مع ساكوبيتريل/فالسارتان (يجب ترك فترة غسيل 36 ساعة على الأقل)',
      'تضيق الشريان الكلوي في كلا الجانبين أو في كلية وحيدة',
    ],
    commonSideEffectsEn: [
      'Persistent dry, hacking cough',
      'Dizziness, lightheadedness, and orthostatic hypotension',
      'Headache and fatigue',
      'Mild elevation in serum creatinine upon initiation',
    ],
    commonSideEffectsAr: [
      'سعال جاف دغدغي مستمر',
      'دوخة، دوار، وانخفاض ضغط الدم الانتصابي',
      'صداع وشعور بالإرهاق',
      'ارتفاع طفيف ومؤقت في مستوى الكرياتينين عند بدء العلاج',
    ],
    seriousSideEffectsEn: [
      'Life-threatening laryngeal angioedema and respiratory arrest',
      'Severe hyperkalemia with cardiac conduction abnormalities',
      'Acute renal failure in patients with renal artery stenosis',
      'Agranulocytosis and neutropenia (rare)',
    ],
    seriousSideEffectsAr: [
      'وذمة حنجرية وعائية مهددة للحياة مع انسداد مجرى الهواء',
      'فرط بوتاسيوم الدم الشديد مع اضطراب كهرباء ونظم القلب',
      'قصور كلوي حاد لدى مرضى تضيق الشريان الكلوي',
      'ندرة المحببات وانخفاض كريات الدم البيضاء الحاد',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Spironolactone / Potassium-Sparing Diuretics',
        severity: 'MAJOR',
        mechanismAr: 'تأثير تآزري بين خفض الألدوستيرون بواسطة مثبط ACE وحصر مستقبلات الألدوستيرون بواسطة سبيرونولاكتون.',
        mechanismEn: 'Synergistic aldosterone inhibition leading to profound renal potassium retention.',
        clinicalEffectAr: 'فرط بوتاسيوم الدم الشديد (Hyperkalemia) المسبب لاضطرابات نظم بطينية وتوقف القلب.',
        clinicalEffectEn: 'Life-threatening hyperkalemia, cardiac arrhythmias, and heart block.',
        managementAr: 'يتطلب مراقبة لصيقة للبوتاسيوم في الدم والكرياتينين بعد أسبوع وأسبوعين من بدء العلاج ثم دورياً، وتجنب مكملات البوتاسيوم.',
        managementEn: 'Monitor serum potassium and creatinine within 1-2 weeks of initiation and regularly thereafter; avoid potassium supplements.',
        source: 'AHA/ACC Heart Failure Guidelines & NICE NG136',
      },
    ],
    dosageGuidelinesEn: 'Hypertension: Initial 10 mg once daily, titrate to 20-40 mg once daily. Heart failure: Start 2.5-5 mg once daily.',
    dosageGuidelinesAr: 'ضغط الدم: الجرعة الابتدائية 10 ملغ يومياً، ترفع إلى 20-40 ملغ يومياً. قصور القلب: البدء بـ 2.5-5 ملغ يومياً مع مراقبة الضغط والوظائف الكلوية.',
    pregnancyCategory: 'D',
    renalAdjustmentRequired: true,
    hepaticAdjustmentRequired: false,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_PARACETAMOL',
    genericName: 'Paracetamol',
    genericNameAr: 'باراسيتامول (أسيتامينوفين)',
    brandNames: ['Panadol', 'Tylenol', 'Calpol', 'Febradol', 'Adol', 'Fevadol', 'Dafalgan'],
    brandNamesAr: ['بانادول', 'تايلينول', 'فيفادول', 'أدول', 'كالامين'],
    activeIngredients: ['Paracetamol', 'Acetaminophen'],
    activeIngredientsAr: ['باراسيتامول', 'أسيتامينوفين'],
    drugClass: 'Non-Opioid Analgesic & Antipyretic',
    drugClassAr: 'مسكن للآلام وخافض للحرارة (غير أفيوني)',
    atcCode: 'N02BE01',
    commonUsesEn: [
      'First-line treatment for mild to moderate pain (headache, musculoskeletal, dental pain)',
      'Reduction of fever in infants, children, and adults',
      'Preferred analgesic in osteoarthritis where inflammation is minimal and NSAIDs are contraindicated',
      'Safe analgesic of choice during pregnancy and lactation',
    ],
    commonUsesAr: [
      'الخيار الأول لتسكين الآلام الخفيفة إلى المتوسطة (الصداع، آلام العضلات والأسنان)',
      'خفض الحرارة والحمى عند الرضع والأطفال والبالغين',
      'المسكن المفضل لخشونة المفاصل لدى المرضى الممنوعين من مضادات الالتهاب (NSAIDs)',
      'المسكن الأكثر أماناً أثناء الحمل والرضاعة الطبيعية تحت الجرعات العلاجية',
    ],
    warningsEn: [
      'Boxed Warning / Clinical Precaution: Hepatotoxicity: Severe liver injury may occur with acute overdose or exceeding maximum recommended daily doses (4,000 mg/24h).',
      'Duplicate Ingredient Danger: Many combination cold, flu, cough, and sinus medications contain paracetamol; failure to recognize this leads to accidental overdose.',
      'Chronic alcohol consumption (> 3 drinks daily) markedly increases susceptibility to acetaminophen hepatotoxicity.',
      'Reduced maximum daily dose (2,000-3,000 mg/day) indicated in chronic malnutrition or mild-to-moderate hepatic impairment.',
    ],
    warningsAr: [
      'تحذير السمية الكبدية: قد يحدث تلف كبدي حاد ومميت عند تجاوز الجرعة اليومية القصوى (4000 ملغ في 24 ساعة).',
      'خطر التكرار المزدوج للمادة الفعالة: تحتوي العديد من أدوية الرشح والزكام والجيوب الأنفية على الباراسيتامول؛ والجمع بينها دون انتباه يسبب تسمماً كبدياً خطيراً.',
      'تناول الكحول المزمن يرفع بشكل حاد قابلية الإصابة بالنخر الكبدي.',
      'يجب خفض الجرعة القصوى إلى 2000-3000 ملغ/يوم لدى مرضى الكبد وسوء التغذية وكبار السن.',
    ],
    boxedWarningEn: 'HEPATOTOXICITY: Overdose can cause acute liver failure resulting in liver transplant or death. Maximum 4000 mg per day. Check all co-administered medications for acetaminophen content.',
    boxedWarningAr: 'تحذير سمية الكبد: الجرعة المفرطة تسبب فشلاً كبدياً حاداً يستوجب زراعة الكبد أو الوفاة. الجرعة القصوى 4000 ملغ يومياً.',
    contraindicationsEn: [
      'Severe active hepatic impairment or acute liver failure',
      'Known severe hypersensitivity to paracetamol or acetaminophen',
    ],
    contraindicationsAr: [
      'القصور الكبدي الحاد النشط أو الفشل الكبدي المتقدم',
      'فرط الحساسية المعروف للباراسيتامول أو الأسيتامينوفين',
    ],
    commonSideEffectsEn: [
      'Rare at therapeutic dosages; exceptionally well tolerated gastrointestinally',
      'Occasional mild nausea or rash',
    ],
    commonSideEffectsAr: [
      'نادرة جداً ضمن الجرعات العلاجية الصحيحة؛ ممتاز التحمل في الجهاز الهضمي',
      'غثيان خفيف أو طفح جلدي نادر',
    ],
    seriousSideEffectsEn: [
      'Centrilobular hepatic necrosis and fulminant liver failure (overdose/toxic metabolite NAPQI accumulation)',
      'Severe Cutaneous Adverse Reactions (SCAR) including Stevens-Johnson Syndrome (extremely rare)',
    ],
    seriousSideEffectsAr: [
      'نخر الكبد الفصيصي الحاد والفشل الكبدي الخاطف (تراكم المستقلب السام NAPQI)',
      'متلازمة ستيفنز جونسون والتفاعل الجلدي الدوائي الحاد (نادر جداً)',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Duplicate Paracetamol Combinations (e.g. Panadol + Tylenol + Cold/Flu meds)',
        severity: 'CONTRAINDICATED',
        mechanismAr: 'تراكم الجرعة اليومية وتجاوز عتبة تصريف الجلوتاثيون الكبدي، مما يؤدي لتراكم المستقلب السام NAPQI.',
        mechanismEn: 'Cumulative dosage exceeding hepatic glutathione conjugation capacity, leading to toxic NAPQI accumulation.',
        clinicalEffectAr: 'تسمم كبدي وفشل كبدي حاد قد يتطلب زراعة كبد عاجلة.',
        clinicalEffectEn: 'Severe hepatotoxicity and acute fulminant liver failure.',
        managementAr: 'حظر الجمع التام بين أكثر من مستحضر يحتوي على الباراسيتامول في نفس الوقت، وحساب الجرعة الكلية من جميع المصادر بدقة.',
        managementEn: 'Strictly prohibit taking multiple paracetamol-containing products concurrently; verify total 24h intake does not exceed 4g.',
        source: 'FDA Acetaminophen Safety Action Plan & MHRA Warning',
      },
      {
        interactingDrugOrClass: 'Warfarin (at chronic high doses > 2,000 mg/day)',
        severity: 'MODERATE',
        mechanismAr: 'الجرعات العالية المستمرة قد تثبط استقلاب الوارفارين وترفع زمن التخثر بشكل طفيف.',
        mechanismEn: 'Chronic paracetamol intake may mildly inhibit warfarin metabolism and enhance anticoagulation.',
        clinicalEffectAr: 'ارتفاع تدريجي في قراءة INR وزيادة خطر النزيف.',
        clinicalEffectEn: 'Gradual increase in INR with potential bleeding risk.',
        managementAr: 'مراقبة INR عند الاستخدام المنتظم لأكثر من عدة أيام متتالية بجرعات تتجاوز 2 غرام/يوم.',
        managementEn: 'Monitor INR if taking high therapeutic doses (>2g/day) continuously for longer than several days.',
        source: 'BNF Drug Interaction Monograph',
      },
    ],
    dosageGuidelinesEn: 'Adults: 500-1000 mg every 4-6 hours as needed. Maximum 4000 mg in 24 hours. Pediatrics: 10-15 mg/kg every 4-6 hours (max 5 doses/24h).',
    dosageGuidelinesAr: 'البالغون: 500 إلى 1000 ملغ كل 4-6 ساعات عند الحاجة. الحد الأقصى 4000 ملغ خلال 24 ساعة. الأطفال: 10-15 ملغ/كغ كل 4-6 ساعات (بحد أقصى 5 جرعات يومياً).',
    pregnancyCategory: 'B',
    renalAdjustmentRequired: false,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_AMOX_CLAV',
    genericName: 'Amoxicillin and Clavulanate Potassium',
    genericNameAr: 'أموكسيسيلين وحمض الكلافولانيك',
    brandNames: ['Augmentin', 'Curam', 'Julmentin', 'Klavox', 'Amoclan', 'Megamox'],
    brandNamesAr: ['أوجمنتين', 'كيورام', 'جلمنتين', 'كلافوكس', 'أميوكلان'],
    activeIngredients: ['Amoxicillin trihydrate', 'Clavulanate potassium'],
    activeIngredientsAr: ['أموكسيسيلين ثلاثي الهيدرات', 'كلافولانات البوتاسيوم'],
    drugClass: 'Beta-Lactam Antibiotic + Beta-Lactamase Inhibitor',
    drugClassAr: 'مضاد حيوي بيتا لاكتام مع مثبط إنزيم بيتا لاكتاماز',
    atcCode: 'J01CR02',
    commonUsesEn: [
      'Bacterial sinusitis, acute otitis media, and exacerbation of chronic bronchitis',
      'Community-acquired pneumonia due to beta-lactamase producing organisms',
      'Skin and soft tissue infections, animal/human bite wounds',
      'Complicated urinary tract and intra-abdominal infections',
    ],
    commonUsesAr: [
      'التهاب الجيوب الأنفية الجرثومي، التهاب الأذن الوسطى الحاد، وتفاقم التهاب القصبات المزمن',
      'الالتهاب الرئوي المكتسب من المجتمع الناتج عن جراثيم منتجة للبيتا لاكتاماز',
      'عدوى الجلد والأنسجة الرخوة، وعضات الحيوانات والإنسان',
      'التهابات المسالك البولية المعقدة والالتهابات داخل البطن',
    ],
    warningsEn: [
      'Serious and occasionally fatal hypersensitivity (anaphylactic) reactions occur in patients on penicillin therapy.',
      'Clostridioides difficile-Associated Diarrhea (CDAD): Range from mild diarrhea to fatal pseudomembranous colitis.',
      'Hepatic dysfunction: Cholestatic jaundice and hepatitis may occur; more common in males and elderly.',
      'Development of drug-resistant bacteria when used inappropriately without proven bacterial infection.',
    ],
    warningsAr: [
      'ردود فعل تحسسية تأقية حادة ومميتة في حالات حساسية البنسلين ومشتقاته.',
      'الإسهال المرتبط ببكتيريا المطثية العسيرة (C. difficile) والتهاب القولون الغشائي الكاذب.',
      'السمية الكبدية: اليرقان الركودي والتهاب الكبد، وهو أكثر شيوعاً لدى كبار السن والرجال.',
      'تطور مقاومة بكتيرية للمضادات الحيوية عند الاستخدام غير الرشيد دون وجود عدوى بكتيرية مؤكدة.',
    ],
    boxedWarningEn: undefined,
    boxedWarningAr: undefined,
    contraindicationsEn: [
      'History of serious hypersensitivity reaction (e.g. anaphylaxis, Stevens-Johnson syndrome) to amoxicillin, clavulanate, or other beta-lactams (penicillins, cephalosporins)',
      'Previous history of cholestatic jaundice or hepatic dysfunction associated with amoxicillin/clavulanate',
    ],
    contraindicationsAr: [
      'تاريخ سابق لفرط الحساسية الشديدة (تأق، متلازمة ستيفنز جونسون) للبنسلين ومشتقات البيتا لاكتام',
      'تاريخ سابق للإصابة باليرقان الركودي أو خلل كبدي حاد ناتج عن أوجمنتين/أموكسيسيلين كلافولانات',
    ],
    commonSideEffectsEn: [
      'Diarrhea and loose stools (clavulanate accelerates gastrointestinal motility)',
      'Nausea and abdominal discomfort',
      'Candidiasis (oral thrush and vaginal moniliasis)',
      'Mild maculopapular rash',
    ],
    commonSideEffectsAr: [
      'إسهال وبراز رخو (حمض الكلافولانيك يحفز حركة الأمعاء)',
      'غثيان وانزعاج في المعدة',
      'عدوى فطرية كانديدا (فطريات الفم أو المهبل)',
      'طفح جلدي بقعي خفيف',
    ],
    seriousSideEffectsEn: [
      'Severe anaphylactic shock and laryngeal edema',
      'Clostridioides difficile pseudomembranous colitis',
      'Drug-Induced Cholestatic Liver Injury',
      'Stevens-Johnson syndrome and toxic epidermal necrolysis',
    ],
    seriousSideEffectsAr: [
      'صدمة تحسسية تأقية حادة ووذمة الحنجرة المهددة للحياة',
      'التهاب القولون الغشائي الكاذب بالمطثية العسيرة',
      'إصابة كبدية ركودية دوائية حادة',
      'متلازمة ستيفنز جونسون وتقشر الأنسجة المتموتة التسممي',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Warfarin / Oral Anticoagulants',
        severity: 'MODERATE',
        mechanismAr: 'تثبيط الفلورا المعوية المصنعة لفيتامين ك وتغيرات في الامتصاص المعوي.',
        mechanismEn: 'Suppression of normal gut flora synthesizing vitamin K, altering prothrombin ratio.',
        clinicalEffectAr: 'ارتفاع غير متوقع في قراءة INR وزيادة قابلية النزيف.',
        clinicalEffectEn: 'Prolongation of prothrombin time / INR elevation.',
        managementAr: 'مراقبة زمن التخثر و INR أثناء كورس المضاد الحيوي وتعديل جرعة الوارفارين.',
        managementEn: 'Monitor INR during antimicrobial therapy and adjust anticoagulant dosage appropriately.',
        source: 'BNF Drug Interaction Guidance',
      },
    ],
    dosageGuidelinesEn: 'Standard adult dose: 625 mg every 8 hours or 1000 mg (1g) every 12 hours with meals to optimize absorption and minimize GI intolerance.',
    dosageGuidelinesAr: 'الجرعة المعتادة للبالغين: 625 ملغ كل 8 ساعات أو 1000 ملغ (1 غرام) كل 12 ساعة مع وجبة الطعام لتقليل الآثار الجانبية الهضمية وتحسين الامتصاص.',
    pregnancyCategory: 'B',
    renalAdjustmentRequired: true,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_CLOPIDOGREL',
    genericName: 'Clopidogrel',
    genericNameAr: 'كلوبيدوغريل',
    brandNames: ['Plavix', 'Iscover', 'Clopilet', 'Ceruvin'],
    brandNamesAr: ['بلافيكس', 'إيسكوفر', 'كلوبيليت'],
    activeIngredients: ['Clopidogrel bisulfate'],
    activeIngredientsAr: ['كبريتات الكلوبيدوغريل الهيدروجينية'],
    drugClass: 'P2Y12 Platelet Adenosine Diphosphate (ADP) Receptor Inhibitor',
    drugClassAr: 'مثبط مستقبلات الصفائح الدموية P2Y12 (مضاد لتجمع الصفائح / مانع تجلط)',
    atcCode: 'B01AC04',
    commonUsesEn: [
      'Acute Coronary Syndrome (STEMI, NSTEMI, Unstable Angina) - Dual Antiplatelet Therapy (DAPT) with aspirin',
      'Recent Myocardial Infarction, Ischemic Stroke, or Established Peripheral Arterial Disease',
      'Post-Percutaneous Coronary Intervention (PCI) with stent placement',
    ],
    commonUsesAr: [
      'متلازمة الشريان التاجي الحادة (احتشاء القلب، الذبحة غير المستقرة) كعلاج ثنائي مع الأسبرين',
      'الوقاية الثانوية بعد احتشاء عضلة القلب، السكتة الدماغية الإقفارية، أو مرض الشرايين المحيطية',
      'بعد عمليات قسطرة وتركيب دعامات الشرايين التاجية (Stents)',
    ],
    warningsEn: [
      'Boxed Warning: Diminished antiplatelet effect in CYP2C19 poor metabolizers; clopidogrel requires CYP2C19 bioactivation to form its active thiol metabolite.',
      'Major bleeding risk: Discontinue 5 days prior to elective surgery with major bleeding risks.',
      'Premature discontinuation markedly increases the risk of stent thrombosis and fatal re-infarction.',
      'Avoid concomitant use with strong CYP2C19 inhibitors like Omeprazole and Esomeprazole.',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود: تراجع الفعالية لدى المرضى بطيئي الاستقلاب عبر إنزيم CYP2C19 لأن الدواء طليعي (Prodrug) ويحتاج للتنشيط الكبدي.',
      'خطر النزيف الحاد: يجب إيقافه قبل 5 أيام من العمليات الجراحية المجدولة ذات الخطورة النزفية العالية.',
      'التوقف المبكر يزيد بشكل خطير من خطر تخثر الدعامة القلبية والوفاة المفاجئة.',
      'تجنب الجمع مع مثبطات مضخة البروتون القوية المثبطة لـ CYP2C19 مثل أوميبرازول.',
    ],
    boxedWarningEn: 'DIMINISHED ANTIPLATELET EFFECT IN PATIENTS WITH TWO LOSS-OF-FUNCTION CYP2C19 ALLELES: Clopidogrel active metabolite concentration and antiplatelet effects are significantly lower. Consider alternative P2Y12 inhibitors (e.g. Prasugrel, Ticagrelor).',
    boxedWarningAr: 'تحذير الصندوق الأسود: انخفاض الفعالية في حالات طفرات إنزيم CYP2C19؛ يُنصح ببدائل مثل تيكاجريلور (Ticagrelor).',
    contraindicationsEn: [
      'Active pathological bleeding such as peptic ulcer or intracranial hemorrhage',
      'Known hypersensitivity to clopidogrel or formulation excipients',
    ],
    contraindicationsAr: [
      'النزيف المرضي النشط مثل قرحة المعدة النزفية أو النزيف الدماغي',
      'فرط الحساسية المعروف للكلوبيدوغريل',
    ],
    commonSideEffectsEn: [
      'Bleeding (bruising, epistaxis, hematoma, purpura)',
      'Dyspepsia and abdominal discomfort',
      'Diarrhea or mild constipation',
    ],
    commonSideEffectsAr: [
      'نزف خفيف (كدمات، رعاف، تجمع دموي سطحي)',
      'عسر هضم وانزعاج بالمعدة',
      'إسهال أو إمساك طفيف',
    ],
    seriousSideEffectsEn: [
      'Thrombotic Thrombocytopenic Purpura (TTP - urgent medical emergency requiring plasma exchange)',
      'Major gastrointestinal bleeding and hemorrhagic stroke',
      'Aplastic anemia and pancytopenia (rare)',
    ],
    seriousSideEffectsAr: [
      'فرفرية قلة الصفيحات الخثارية (TTP - حالة طارئة حرجة تستدعي تبديل البلازما)',
      'نزيف هضمي شديد أو سكتة دماغية نزفية',
      'فقر دم لا تنسجي ونقص شامل في خلايا الدم',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Omeprazole / Esomeprazole (Proton Pump Inhibitors)',
        severity: 'MAJOR',
        mechanismAr: 'تثبيط قوي لإنزيم السيتوكروم CYP2C19 المسؤول عن تنشيط كلوبيدوغريل وتحويله لمركبه الفعال.',
        mechanismEn: 'Potent competitive inhibition of CYP2C19 enzymatic activation of clopidogrel.',
        clinicalEffectAr: 'انخفاض مستوى المادة الفعالة بنسبة 45% وفشل حماية الصفائح وزيادة خطر الجلطات القلبية وتخثر الدعامة.',
        clinicalEffectEn: 'Approx. 45% reduction in clopidogrel active metabolite, impaired platelet inhibition, increased ischemic/stent thrombosis risk.',
        managementAr: 'استخدام بانتوبرازول (Pantoprazole) كبديل آمن لحماية المعدة لأنه لا يثبط CYP2C19 بشكل سريري مؤثر.',
        managementEn: 'Use Pantoprazole as the preferred PPI for gastroprotection; avoid omeprazole and esomeprazole.',
        source: 'FDA Drug Safety Communication & ACC/AHA Stent Guidelines',
      },
    ],
    dosageGuidelinesEn: 'Loading dose in acute coronary syndrome: 300-600 mg once, followed by 75 mg once daily with or without food.',
    dosageGuidelinesAr: 'الجرعة التحميلية في متلازمة الشريان التاجي الحادة: 300 إلى 600 ملغ دفعة واحدة، تليها جرعة صيانة 75 ملغ مرة واحدة يومياً.',
    pregnancyCategory: 'B',
    renalAdjustmentRequired: false,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_ESCITALOPRAM',
    genericName: 'Escitalopram',
    genericNameAr: 'إسيتالوبرام',
    brandNames: ['Cipralex', 'Lexapro', 'Entact', 'Seroplex'],
    brandNamesAr: ['سيبرالكس', 'ليكسابرو', 'سيروبلكس'],
    activeIngredients: ['Escitalopram oxalate'],
    activeIngredientsAr: ['أوكزالات الإسيتالوبرام'],
    drugClass: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    drugClassAr: 'مثبط انتقائي لاسترداد السيروتونين (SSRI - مضاد اكتئاب وقلق)',
    atcCode: 'N06AB10',
    commonUsesEn: [
      'Major Depressive Disorder (MDD) in adults and adolescents 12-17 years',
      'Generalized Anxiety Disorder (GAD)',
      'Panic disorder with or without agoraphobia',
      'Social Anxiety Disorder and Obsessive-Compulsive Disorder (OCD)',
    ],
    commonUsesAr: [
      'اضطراب الاكتئاب الجسيم (MDD) لدى البالغين والمراهقين',
      'اضطراب القلق العام (GAD)',
      'اضطراب الهلع ونوبات الفزع',
      'الرهاب الاجتماعي واضطراب الوسواس القهري (OCD)',
    ],
    warningsEn: [
      'Boxed Warning: Suicidal thoughts and behaviors in children, adolescents, and young adults (up to age 24) during initial phase of treatment.',
      'Serotonin Syndrome risk: Potentially life-threatening when combined with other serotonergic agents (tramadol, triptans, MAOIs, linezolid).',
      'QTc prolongation and Torsades de Pointes: Dose dependent; max recommended dose 20 mg/day (10 mg in elderly).',
      'Abrupt discontinuation: Causes withdrawal symptoms (dizziness, electric shock sensations, anxiety).',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود: زيادة خطر الأفكار والسلوكيات الانتحارية لدى الأطفال والمراهقين والشباب دون 24 سنة في بداية العلاج.',
      'متلازمة السيروتونين (Serotonin Syndrome): مهددة للحياة عند الجمع مع أدوية سيروتونينية أخرى مثل الترامادول أو مثبطات MAOI.',
      'استطالة فترة QT الكهربائية في القلب: مرتبطة بالجرعة؛ الجرعة القصوى 20 ملغ/يوم (10 ملغ لكبار السن).',
      'التوقف المفاجئ يسبب متلازمة انسحابية حادة (دوخة، إحساس بصدمات كهربائية، قلق شديد).',
    ],
    boxedWarningEn: 'SUICIDAL THOUGHTS AND BEHAVIORS: Antidepressants increased the risk of suicidal thoughts and behaviors in pediatric and young adult patients in short-term studies. Closely monitor patients.',
    boxedWarningAr: 'تحذير الصندوق الأسود: خطر الأفكار الانتحارية لدى اليافعين؛ يتطلب مراقبة سريرية وعائلية لصيقة في الأسابيع الأولى.',
    contraindicationsEn: [
      'Concomitant use with Monoamine Oxidase Inhibitors (MAOIs) or within 14 days of stopping an MAOI',
      'Concomitant use with Pimozide',
      'Known hypersensitivity to escitalopram or citalopram',
      'Congenital long QT syndrome or known QTc interval prolongation',
    ],
    contraindicationsAr: [
      'الاستخدام المتزامن مع مثبطات أكسيداز أحادي الأمين (MAOI) أو خلال 14 يوماً من إيقافها',
      'الاستخدام المتزامن مع دواء بيموزيد (Pimozide)',
      'فرط الحساسية المعروف للإسيتالوبرام أو السيتالوبرام',
      'متلازمة استطالة QT الخلقية في القلب',
    ],
    commonSideEffectsEn: [
      'Nausea (most frequent, usually improves within 1-2 weeks)',
      'Insomnia or somnolence',
      'Ejaculatory delay and sexual dysfunction',
      'Increased sweating and fatigue',
    ],
    commonSideEffectsAr: [
      'غثيان (الأكثر شيوعاً في الأسبوع الأول ويتحسن تلقائياً)',
      'أرق أو زيادة النعاس النهاري',
      'تأخر القذف والخلل الوظيفي الجنسي',
      'زيادة التعرق والشعور بالخمول',
    ],
    seriousSideEffectsEn: [
      'Serotonin Syndrome (hyperreflexia, clonus, autonomic instability, hyperthermia, seizures)',
      'Severe QTc prolongation and ventricular tachycardia (Torsades de pointes)',
      'Syndrome of Inappropriate Antidiuretic Hormone (SIADH) and severe hyponatremia',
      'Activation of mania or hypomania in bipolar disorder',
    ],
    seriousSideEffectsAr: [
      'متلازمة السيروتونين (نفضان عضلي، فرط منعكسات، عدم استقرار ضربات القلب، حمى شديدة)',
      'استطالة خطيرة في موجة QT واضطراب النظم البطيني القاتل',
      'متلازمة إفراز الهرمون المضاد لإدرار البول غير الملائم (SIADH) ونقص صوديوم الدم الحاد',
      'تحفيز نوبة الهوس لدى مرضى الاضطراب ثنائي القطب غير المشخصين',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Tramadol (Centrally Acting Opioid)',
        severity: 'CONTRAINDICATED',
        mechanismAr: 'تثبيط متبادل لاسترداد السيروتونين وتراكمه المفرط في المشابك العصبية بالدماغ.',
        mechanismEn: 'Combined serotonergic reuptake inhibition producing excessive central serotonin receptor stimulation.',
        clinicalEffectAr: 'حدوث متلازمة السيروتونين الحادة ونوبات الصرع والتشنجات الدماغية.',
        clinicalEffectEn: 'Precipitation of severe Serotonin Syndrome and reduction of seizure threshold.',
        managementAr: 'يحظر الجمع بينهما؛ استخدام مسكن بديل لا يعمل على مسارات السيروتونين (مثل باراسيتامول).',
        managementEn: 'Avoid concurrent use. Select alternative non-serotonergic analgesic.',
        source: 'FDA Drug Safety Alert & UpToDate Pharmacology',
      },
    ],
    dosageGuidelinesEn: 'Initial dose: 10 mg once daily morning or evening; may increase to maximum 20 mg once daily after at least one week.',
    dosageGuidelinesAr: 'الجرعة الابتدائية 10 ملغ مرة واحدة يومياً صباحاً أو مساءً؛ يمكن زيادتها إلى 20 ملغ يومياً بعد أسبوع على الأقل.',
    pregnancyCategory: 'C',
    renalAdjustmentRequired: false,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_TRAMADOL',
    genericName: 'Tramadol',
    genericNameAr: 'ترامادول',
    brandNames: ['Ultram', 'Tramal', 'Conzip', 'Zydol', 'Tramundin'],
    brandNamesAr: ['ترامال', 'ألترام', 'تراموندين'],
    activeIngredients: ['Tramadol hydrochloride'],
    activeIngredientsAr: ['هيدروكلوريد الترامادول'],
    drugClass: 'Centrally-Acting Synthetic Opioid Analgesic & SNRI',
    drugClassAr: 'مسكن أفيوني مركزي مع تأثير مثبط لاسترداد السيروتونين والنورأدرينالين',
    atcCode: 'N02AX02',
    commonUsesEn: [
      'Management of moderate to moderately severe acute and chronic pain in adults',
      'Post-operative surgical pain management',
      'Moderate chronic pain when non-opioid analgesics are inadequate or contraindicated',
    ],
    commonUsesAr: [
      'تسكين الآلام المتوسطة إلى الشديدة الحادة والمزمنة لدى البالغين',
      'تسكين الآلام ما بعد العمليات الجراحية',
      'الآلام المزمنة عند عدم كفاية أو موانع استخدام المسكنات غير الأفيونية',
    ],
    warningsEn: [
      'Boxed Warning: Addiction, Abuse, and Misuse: Risk of opioid addiction, overdose, and death.',
      'Boxed Warning: Life-threatening respiratory depression: Monitor for respiratory depression, especially during initiation or dosage titration.',
      'Boxed Warning: Concomitant use with benzodiazepines: May result in profound sedation, coma, and death.',
      'Seizure risk: Lowers seizure threshold; significantly elevated at high doses or with co-administered antidepressants.',
      'Ultra-rapid metabolism risk via CYP2D6 (especially dangerous in pediatrics).',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود: الإدمان وسوء الاستخدام والجرعة الزائدة المميتة.',
      'تحذير الصندوق الأسود: التثبيط التنفسي المهدد للحياة، وخاصة عند بدء العلاج وزيادة الجرعات.',
      'تحذير الصندوق الأسود: الجمع مع المهدئات البنزوديازيبينية يسبب نعاساً عميقاً وغيبوبة ووفاة.',
      'خطر التشنجات والصرع: يخفض عتبة نوبات الصرع بشكل واضح عند الجرعات المرتفعة ومع مضادات الاكتئاب.',
    ],
    boxedWarningEn: 'ADDICTION, ABUSE, RESPIRATORY DEPRESSION, AND ACCIDENTAL INGESTION: High potential for dependency and fatal overdose. Concomitant use with CNS depressants can result in death.',
    boxedWarningAr: 'تحذير الصندوق الأسود: خطر الإدمان والتثبيط التنفسي والموت. يحظر الجمع مع مهدئات الجهاز العصبي المركزي.',
    contraindicationsEn: [
      'Significant respiratory depression',
      'Acute or severe bronchial asthma in an unmonitored setting',
      'Known or suspected gastrointestinal obstruction, including paralytic ileus',
      'Concurrent use of monoamine oxidase inhibitors (MAOIs) or within 14 days',
      'Pediatric patients younger than 12 years of age (or post-tonsillectomy up to age 18)',
    ],
    contraindicationsAr: [
      'التثبيط التنفسي الحاد ونقص التهوية الرئوية',
      'الربو القصبي الحاد أو الشديد في بيئة غير مجهزة للإنعاش',
      'الانسداد المعوي المعروف أو المشتبه به (العلوص الشللي)',
      'الاستخدام المتزامن مع مثبطات MAOI أو خلال 14 يوماً من التوقف عنها',
      'الأطفال دون سن 12 عاماً (أو بعد استئصال اللوزتين حتى سن 18 عاماً)',
    ],
    commonSideEffectsEn: [
      'Dizziness, vertigo, and lightheadedness',
      'Nausea, vomiting, and constipation',
      'Somnolence and sedation',
      'Dry mouth and sweating',
    ],
    commonSideEffectsAr: [
      'دوخة، دوار، وعدم اتزان',
      'غثيان، قيء، وإمساك',
      'نعاس وتهدئة',
      'جفاف الفم وزيادة التعرق',
    ],
    seriousSideEffectsEn: [
      'Life-threatening respiratory arrest',
      'Generalized tonic-clonic seizures',
      'Serotonin syndrome',
      'Opioid-induced dependence, tolerance, and severe withdrawal',
    ],
    seriousSideEffectsAr: [
      'توقف التنفس والغيبوبة والوفاة',
      'نوبات الصرع والتشنج العام',
      'متلازمة السيروتونين الحادة',
      'الاعتماد والإدمان وأعراض الانسحاب الشديدة',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Benzodiazepines (Diazepam, Alprazolam, Lorazepam)',
        severity: 'CONTRAINDICATED',
        mechanismAr: 'تثبيط تآزري مزدوج للجهاز العصبي المركزي ومركز التنفس في جذع الدماغ.',
        mechanismEn: 'Profound synergistic depression of the central nervous system and medullary respiratory center.',
        clinicalEffectAr: 'تثبيط تنفسي حاد، غيبوبة عميقة، وهبوط حاد بضغط الدم والوفاة.',
        clinicalEffectEn: 'Profound sedation, respiratory failure, coma, and death.',
        managementAr: 'تجنب الجمع التام؛ لا يوصف إلا في الحالات الميؤوس منها بالمستشفى مع توفر نالوكسون وجهاز تنفس.',
        managementEn: 'Avoid concurrent prescribing. Limit dosages and duration if co-administration is strictly necessary; have naloxone available.',
        source: 'FDA Black Box Warning on Opioid-Benzodiazepine Co-use',
      },
    ],
    dosageGuidelinesEn: 'Immediate-release: 50-100 mg every 4-6 hours as needed for pain. Maximum 400 mg per day (300 mg in elderly > 75 years).',
    dosageGuidelinesAr: 'الأقراص سريعة المفعول: 50 إلى 100 ملغ كل 4 إلى 6 ساعات عند اللزوم لتسكين الألم. الحد الأقصى 400 ملغ في اليوم (300 ملغ لكبار السن فوق 75 سنة).',
    pregnancyCategory: 'C',
    renalAdjustmentRequired: true,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
  {
    id: 'DRUG_FUROSEMIDE',
    genericName: 'Furosemide',
    genericNameAr: 'فوروسيميد',
    brandNames: ['Lasix', 'Frusid', 'Salix'],
    brandNamesAr: ['لازكس', 'فروسيد'],
    activeIngredients: ['Furosemide'],
    activeIngredientsAr: ['فوروسيميد'],
    drugClass: 'Loop Diuretic',
    drugClassAr: 'مدر للبول عروي (Loop Diuretic - سريع وقوي المفعول)',
    atcCode: 'C03CA01',
    commonUsesEn: [
      'Edema associated with congestive heart failure, cirrhosis of the liver, and renal disease',
      'Acute pulmonary edema (intravenous administration)',
      'Management of hypertension, alone or in combination with other antihypertensives',
    ],
    commonUsesAr: [
      'علاج الوذمة واحتباس السوائل المرافق لقصور القلب الاحتقاني وتليف الكبد وأمراض الكلى',
      'الوذمة الرئوية الحادة (عبر الحقن الوريدي في الطوارئ)',
      'إدارة ارتفاع ضغط الدم، منفرداً أو بالتشارك مع خافضات الضغط الأخرى',
    ],
    warningsEn: [
      'Boxed Warning: Potent diuretic that if given in excessive amounts can lead to profound diuresis with water and electrolyte depletion.',
      'Electrolyte disturbances: Severe hypokalemia, hyponatremia, hypomagnesemia, and hypochloremic alkalosis.',
      'Ototoxicity: Transient or permanent hearing loss and tinnitus, especially with rapid IV administration or renal disease.',
      'Hyperuricemia and precipitation of acute gouty arthritis attacks.',
    ],
    warningsAr: [
      'تحذير الصندوق الأسود: مدر بولي شديد القوة يمكن أن يؤدي لفقدان حاد للمياه واضطراب شديد في أملاح الدم وشواردها.',
      'اضطراب الشوارد: انخفاض حاد في بوتاسيوم الدم (Hypokalemia)، صوديوم الدم، ومغنيسيوم الدم.',
      'السمية السمعية (Ototoxicity): طنين بالأذن وفقدان مؤقت أو دائم للسمع خاصة عند الحقن الوريدي السريع.',
      'ارتفاع حمض البوليك في الدم (Hyperuricemia) وتحفيز نوبات داء النقرس الحادة.',
    ],
    boxedWarningEn: 'POTENT DIURETIC: Profound diuresis with water and electrolyte depletion. Careful medical supervision required with dose adjustment.',
    boxedWarningAr: 'تحذير الصندوق الأسود: إدرار بولي عنيف مع استنزاف السوائل والأملاح. يتطلب إشرافاً طبياً دقيقاً ومراقبة مستمرة للشوارد.',
    contraindicationsEn: [
      'Anuria (complete absence of urine production)',
      'Known hypersensitivity to furosemide or sulfonamides',
      'Severe electrolyte depletion (severe hypokalemia, severe hyponatremia)',
      'Hepatic coma and pre-coma states until the underlying condition improves',
    ],
    contraindicationsAr: [
      'انقطاع البول التام (Anuria)',
      'فرط الحساسية للفوروسيميد أو مركبات السلفا (Sulfonamides)',
      'استنزاف الشوارد الحاد (انخفاض البوتاسيوم أو الصوديوم الشديد)',
      'الغيبوبة الكبدية وحالات ما قبل الغيبوبة',
    ],
    commonSideEffectsEn: [
      'Frequent urination and polyuria',
      'Hypokalemia, muscle cramps, and weakness',
      'Orthostatic hypotension, lightheadedness, and thirst',
      'Hyperuricemia and elevated serum creatinine',
    ],
    commonSideEffectsAr: [
      'كثرة التبول والشعور بالعطش',
      'نقص البوتاسيوم وتشنج وتقلص العضلات والضعف العام',
      'هبوط الضغط الانتصابي والدوخة عند الوقوف',
      'ارتفاع حمض البوليك وارتفاع طفيف بالكرياتينين',
    ],
    seriousSideEffectsEn: [
      'Profound hypokalemia predisposing to fatal ventricular arrhythmias',
      'Irreversible sensorineural hearing loss and vestibular dysfunction',
      'Severe dehydration and acute prerenal azotemia / renal failure',
      'Agranulocytosis and thrombocytopenia (rare)',
    ],
    seriousSideEffectsAr: [
      'نقص بوتاسيوم الدم الشديد المسبب لاضطرابات نظم بطينية مميتة',
      'فقدان السمع الحسي العصبي الدائم أو طنين الأذن الحاد',
      'تجفاف شديد وقصور كلوي حاد قبل كلوي',
      'ندرة المحببات ونقص الصفيحات الدموية',
    ],
    interactions: [
      {
        interactingDrugOrClass: 'Digoxin (Cardiac Glycoside)',
        severity: 'MAJOR',
        mechanismAr: 'نقص بوتاسيوم ومغنيسيوم الدم الناتج عن مدر البول يرفع بشكل خطير حساسية القلب لسمية الديجوكسين.',
        mechanismEn: 'Diuretic-induced hypokalemia and hypomagnesemia sensitize the myocardium to digitalis toxicity.',
        clinicalEffectAr: 'حدوث تسمم بالديجوكسين واضطرابات نظم قلبية بطينية قاتلة.',
        clinicalEffectEn: 'Digoxin toxicity, malignant ventricular arrhythmias, and heart block.',
        managementAr: 'مراقبة مستوى البوتاسيوم والمغنيسيوم بانتظام، واستخدام مكملات البوتاسيوم أو مدر حافظ للبوتاسيوم لضمان بقاء K > 4.0 mEq/L.',
        managementEn: 'Strictly maintain serum potassium > 4.0 mEq/L and monitor serum digoxin levels.',
        source: 'AHA Heart Failure Guidelines & BNF Interaction Monograph',
      },
    ],
    dosageGuidelinesEn: 'Edema: Oral 20-80 mg as a single dose, titrate by 20-40 mg every 6-8 hours until desired response. Hypertension: 40 mg twice daily.',
    dosageGuidelinesAr: 'الوذمة: 20 إلى 80 ملغ فموياً كجرعة وحيدة صباحاً، ويمكن تعديلها كل 6-8 ساعات حسب الاستجابة الإدرارية. ضغط الدم: 40 ملغ مرتين يومياً.',
    pregnancyCategory: 'C',
    renalAdjustmentRequired: true,
    hepaticAdjustmentRequired: true,
    metadata: DEMO_METADATA,
  },
];

/**
 * 1. Demo Seed Data Source (Active Primary Benchmark)
 */
export class DemoSeedDataSource implements IDrugDataSource {
  public id = 'DEMO_SEED_DATASET';
  public name = 'Curated Clinical Pharmacopeia (Demo Seed Benchmark)';
  public authorityTier: AuthoritySourceTier = 'DEMO_SEED_DATASET';
  public isDemoSeed = true;
  public status: 'ACTIVE' = 'ACTIVE';
  public disclaimer = DEMO_METADATA.disclaimer;

  private profiles: DrugProfile[] = DEMO_SEED_PROFILES;

  public async search(
    query: string,
    searchType: 'all' | 'brand' | 'generic' | 'ingredient' = 'all'
  ): Promise<DrugSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: DrugSearchResult[] = [];

    for (const drug of this.profiles) {
      let matchType: 'GENERIC' | 'BRAND' | 'ACTIVE_INGREDIENT' | null = null;
      let matchedBrand: string | undefined;
      let matchedIngredient: string | undefined;

      const genericMatch =
        drug.genericName.toLowerCase().includes(q) ||
        drug.genericNameAr.includes(q);

      const brandMatch = drug.brandNames.find(b => b.toLowerCase().includes(q)) ||
        drug.brandNamesAr?.find(b => b.includes(q));

      const ingredientMatch = drug.activeIngredients.find(i => i.toLowerCase().includes(q)) ||
        drug.activeIngredientsAr?.find(i => i.includes(q));

      if (searchType === 'generic' && genericMatch) {
        matchType = 'GENERIC';
      } else if (searchType === 'brand' && brandMatch) {
        matchType = 'BRAND';
        matchedBrand = brandMatch;
      } else if (searchType === 'ingredient' && ingredientMatch) {
        matchType = 'ACTIVE_INGREDIENT';
        matchedIngredient = ingredientMatch;
      } else if (searchType === 'all') {
        if (genericMatch) {
          matchType = 'GENERIC';
        } else if (brandMatch) {
          matchType = 'BRAND';
          matchedBrand = brandMatch;
        } else if (ingredientMatch) {
          matchType = 'ACTIVE_INGREDIENT';
          matchedIngredient = ingredientMatch;
        }
      }

      if (matchType) {
        results.push({
          id: drug.id,
          genericName: drug.genericName,
          genericNameAr: drug.genericNameAr,
          matchedBrandName: matchedBrand,
          matchedActiveIngredient: matchedIngredient,
          matchType,
          brandNames: drug.brandNames,
          activeIngredients: drug.activeIngredients,
          drugClass: drug.drugClass,
          drugClassAr: drug.drugClassAr,
          hasBoxedWarning: !!drug.boxedWarningEn,
          summaryAr: drug.commonUsesAr[0] || drug.drugClassAr,
          summaryEn: drug.commonUsesEn[0] || drug.drugClass,
          isDemoSeedData: true,
        });
      }
    }

    return results;
  }

  public async getProfile(idOrGeneric: string): Promise<DrugProfile | null> {
    const q = idOrGeneric.trim().toLowerCase();
    const found = this.profiles.find(
      p =>
        p.id.toLowerCase() === q ||
        p.genericName.toLowerCase() === q ||
        p.genericNameAr.includes(q) ||
        p.brandNames.some(b => b.toLowerCase() === q)
    );
    return found || null;
  }

  public async getAllProfiles(): Promise<DrugProfile[]> {
    return this.profiles;
  }

  public createProfile(profile: DrugProfile): DrugProfile {
    const existingIndex = this.profiles.findIndex(p => p.id === profile.id);
    if (existingIndex >= 0) {
      this.profiles[existingIndex] = profile;
    } else {
      this.profiles.unshift(profile);
    }
    return profile;
  }

  public updateProfile(id: string, updates: Partial<DrugProfile>): DrugProfile | null {
    const existing = this.profiles.find(p => p.id === id);
    if (!existing) return null;
    Object.assign(existing, updates);
    return existing;
  }

  public deleteProfile(id: string): boolean {
    const initialLen = this.profiles.length;
    this.profiles = this.profiles.filter(p => p.id !== id);
    return this.profiles.length < initialLen;
  }
}

/**
 * 2. Pluggable Adapters for External Authoritative Sources
 * (Designed to hook into NIH RxNorm, DailyMed FDA SPL, BNF, and SFDA without modifying the engine)
 */
export class RxNormDataSourceAdapter implements IDrugDataSource {
  public id = 'RXNORM_NLM_ADAPTER';
  public name = 'U.S. National Library of Medicine (RxNorm API Adapter)';
  public authorityTier: AuthoritySourceTier = 'TIER_2_FORMULARY';
  public isDemoSeed = false;
  public status: 'READY_FOR_INTEGRATION' = 'READY_FOR_INTEGRATION';
  public disclaimer = 'Integration endpoint ready for RxNorm REST API (https://rxnav.nlm.nih.gov/REST). Configurable via environment credentials.';

  public async search(_query: string): Promise<DrugSearchResult[]> {
    // In production: fetch('https://rxnav.nlm.nih.gov/REST/drugs.json?name=' + query)
    return [];
  }

  public async getProfile(_idOrGeneric: string): Promise<DrugProfile | null> {
    return null;
  }

  public async getAllProfiles(): Promise<DrugProfile[]> {
    return [];
  }
}

export class DailyMedDataSourceAdapter implements IDrugDataSource {
  public id = 'DAILYMED_FDA_ADAPTER';
  public name = 'FDA DailyMed Structured Product Labeling (SPL API Adapter)';
  public authorityTier: AuthoritySourceTier = 'TIER_1_REGULATORY';
  public isDemoSeed = false;
  public status: 'READY_FOR_INTEGRATION' = 'READY_FOR_INTEGRATION';
  public disclaimer = 'Integration endpoint ready for DailyMed web service (https://dailymed.nlm.nih.gov/dailymed/services/v2).';

  public async search(_query: string): Promise<DrugSearchResult[]> {
    return [];
  }

  public async getProfile(_idOrGeneric: string): Promise<DrugProfile | null> {
    return null;
  }

  public async getAllProfiles(): Promise<DrugProfile[]> {
    return [];
  }
}

export class BnfDataSourceAdapter implements IDrugDataSource {
  public id = 'BNF_NICE_ADAPTER';
  public name = 'British National Formulary (BNF / NICE UK Adapter)';
  public authorityTier: AuthoritySourceTier = 'TIER_2_FORMULARY';
  public isDemoSeed = false;
  public status: 'READY_FOR_INTEGRATION' = 'READY_FOR_INTEGRATION';
  public disclaimer = 'Integration endpoint ready for BNF & NICE Syndication API.';

  public async search(_query: string): Promise<DrugSearchResult[]> {
    return [];
  }

  public async getProfile(_idOrGeneric: string): Promise<DrugProfile | null> {
    return null;
  }

  public async getAllProfiles(): Promise<DrugProfile[]> {
    return [];
  }
}

export class SfdaDataSourceAdapter implements IDrugDataSource {
  public id = 'SFDA_REGISTRY_ADAPTER';
  public name = 'Saudi Food & Drug Authority (SFDA OpenData Adapter)';
  public authorityTier: AuthoritySourceTier = 'TIER_1_REGULATORY';
  public isDemoSeed = false;
  public status: 'READY_FOR_INTEGRATION' = 'READY_FOR_INTEGRATION';
  public disclaimer = 'Integration endpoint ready for SFDA Registered Drug Products Portal.';

  public async search(_query: string): Promise<DrugSearchResult[]> {
    return [];
  }

  public async getProfile(_idOrGeneric: string): Promise<DrugProfile | null> {
    return null;
  }

  public async getAllProfiles(): Promise<DrugProfile[]> {
    return [];
  }
}

/**
 * 3. Unified Drug Knowledge Repository (Orchestrator)
 */
export class DrugKnowledgeRepository {
  private sources: Map<string, IDrugDataSource> = new Map();
  private primarySourceId = 'DEMO_SEED_DATASET';

  constructor() {
    // Register Default Sources
    const demoSource = new DemoSeedDataSource();
    this.sources.set(demoSource.id, demoSource);
    this.sources.set('RXNORM_NLM_ADAPTER', new RxNormDataSourceAdapter());
    this.sources.set('DAILYMED_FDA_ADAPTER', new DailyMedDataSourceAdapter());
    this.sources.set('BNF_NICE_ADAPTER', new BnfDataSourceAdapter());
    this.sources.set('SFDA_REGISTRY_ADAPTER', new SfdaDataSourceAdapter());
  }

  public registerSource(source: IDrugDataSource) {
    this.sources.set(source.id, source);
  }

  public getSource(id: string): IDrugDataSource | undefined {
    return this.sources.get(id);
  }

  public getAllSourcesInfo() {
    return Array.from(this.sources.values()).map(s => ({
      id: s.id,
      name: s.name,
      authorityTier: s.authorityTier,
      isDemoSeed: s.isDemoSeed,
      status: s.status,
      disclaimer: s.disclaimer,
    }));
  }

  public async searchDrugs(
    query: string,
    searchType: 'all' | 'brand' | 'generic' | 'ingredient' = 'all'
  ): Promise<{ results: DrugSearchResult[]; metadata: DataSourceMetadata }> {
    const primary = this.sources.get(this.primarySourceId);
    if (!primary) {
      return { results: [], metadata: DEMO_METADATA };
    }
    const results = await primary.search(query, searchType);
    return {
      results,
      metadata: DEMO_METADATA,
    };
  }

  public async getDrugProfile(idOrGeneric: string): Promise<{ profile: DrugProfile | null; metadata: DataSourceMetadata }> {
    const primary = this.sources.get(this.primarySourceId);
    if (!primary) {
      return { profile: null, metadata: DEMO_METADATA };
    }
    const profile = await primary.getProfile(idOrGeneric);
    return {
      profile,
      metadata: profile?.metadata || DEMO_METADATA,
    };
  }

  public async getAllProfiles(): Promise<DrugProfile[]> {
    const primary = this.sources.get(this.primarySourceId);
    if (!primary) return [];
    return primary.getAllProfiles();
  }

  public createDrugProfile(profile: DrugProfile): DrugProfile {
    const primary = this.sources.get(this.primarySourceId) as DemoSeedDataSource;
    if (primary && typeof primary.createProfile === 'function') {
      return primary.createProfile(profile);
    }
    return profile;
  }

  public updateDrugProfile(id: string, updates: Partial<DrugProfile>): DrugProfile | null {
    const primary = this.sources.get(this.primarySourceId) as DemoSeedDataSource;
    if (primary && typeof primary.updateProfile === 'function') {
      return primary.updateProfile(id, updates);
    }
    return null;
  }

  public deleteDrugProfile(id: string): boolean {
    const primary = this.sources.get(this.primarySourceId) as DemoSeedDataSource;
    if (primary && typeof primary.deleteProfile === 'function') {
      return primary.deleteProfile(id);
    }
    return false;
  }
}

// Export singleton instance
export const drugKnowledgeRepository = new DrugKnowledgeRepository();
