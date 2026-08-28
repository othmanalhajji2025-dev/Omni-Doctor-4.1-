import { KnowledgeDocument } from '../types/rag.js';
import { sourceRegistry } from './sourceRegistry.js';

class DocumentStore {
  private documents: Map<string, KnowledgeDocument> = new Map();

  constructor() {
    this.seedInitialDocuments();
  }

  private seedInitialDocuments(): void {
    const docs: KnowledgeDocument[] = [
      {
        id: 'DOC_NICE_NG136_HTN',
        sourceId: 'SRC_NICE',
        title: 'NICE Guideline [NG136]: Hypertension in Adults — Diagnosis, Assessment and Stepped Pharmacotherapy',
        titleEn: 'NICE NG136: Hypertension in adults: diagnosis and management',
        publishedDate: '2019-08-28',
        updatedDate: '2023-11-14',
        content: `
# NICE Guideline [NG136]: Hypertension in adults: diagnosis and management

## 1. Clinical Diagnosis and Blood Pressure Thresholds
- Clinic Blood Pressure: Stage 1 hypertension is diagnosed when clinic BP is >= 140/90 mmHg, confirmed with Ambulatory Blood Pressure Monitoring (ABPM) or Home Blood Pressure Monitoring (HBPM) daytime average >= 135/85 mmHg.
- Stage 2 hypertension: Clinic BP >= 160/100 mmHg and daytime average ABPM/HBPM >= 150/95 mmHg.
- Severe / Stage 3 hypertension: Clinic systolic BP >= 180 mmHg or diastolic BP >= 120 mmHg. Assess immediately for target organ damage (papilledema, acute heart failure, encephalopathy, acute renal injury).

## 2. Stepped Pharmacological Management
- Step 1 Treatment:
  * For adults aged under 55 years (and not of Black African or African-Caribbean family origin): Offer an Angiotensin-Converting Enzyme (ACE) inhibitor or an Angiotensin Receptor Blocker (ARB) such as Lisinopril, Ramipril, Losartan, or Candesartan.
  * For adults aged 55 and over, or Black African / African-Caribbean family origin: Offer a Calcium Channel Blocker (CCB) such as Amlodipine. If CCB is unsuitable or poorly tolerated due to ankle edema, offer a thiazide-like diuretic (Indapamide).
- Step 2 Treatment:
  * Combine an ACE inhibitor or ARB with a Calcium Channel Blocker (A + C).
  * If CCB not tolerated, combine ACE inhibitor / ARB with a thiazide-like diuretic (A + D).
- Step 3 Treatment:
  * Combine ACE inhibitor or ARB + Calcium Channel Blocker + Thiazide-like diuretic (A + C + D).
- Step 4 (Resistant Hypertension):
  * Confirm adherence and exclude white-coat effect. If blood potassium is <= 4.5 mmol/L, consider low-dose Spironolactone with renal monitoring. If potassium > 4.5 mmol/L, consider alpha-blocker or beta-blocker.

## 3. Target Blood Pressure Goals
- For adults aged under 80 years: Clinic blood pressure target is below 140/90 mmHg (ABPM/HBPM daytime average below 135/85 mmHg).
- For adults aged 80 and over: Clinic blood pressure target is below 150/90 mmHg (ABPM/HBPM daytime average below 145/85 mmHg).

## 4. Lifestyle Interventions and Cardiovascular Risk
- Advise a reduced dietary salt intake (less than 5-6g of salt per day).
- Encourage regular aerobic physical activity, smoking cessation, moderation of caffeine and alcohol consumption, and maintenance of healthy body mass index (BMI).
        `.trim(),
        metadata: {
          category: 'CARDIOVASCULAR',
          specialty: 'Cardiology / Internal Medicine',
          tags: ['hypertension', 'blood pressure', 'nice', 'ace-inhibitor', 'amlodipine', 'ramipril', 'ضغط الدم', 'ارتفاع الضغط'],
          language: 'both',
          clinicalDomain: 'Cardiovascular Health',
          targetAudience: 'Primary care clinicians, triage systems, adult patients',
          guidelineCode: 'NG136',
          evidenceGrade: 'Grade A (High-quality RCT consensus)',
          summaryAr: 'إرشادات المعهد الوطني للتميز السريري (NICE) لتشخيص وإدارة ارتفاع ضغط الدم، مبنية على تصنيف القياسات السريرية وخطة متدرجة للعلاج الدوائي تشمل حاصرات ACE وحاصرات الكالسيوم ومدرات الثيازيد.',
          summaryEn: 'NICE guideline for adult hypertension diagnosis via ABPM/HBPM and stepped drug regimens (A, C, D algorithm).',
        },
        status: 'INDEXED',
        chunksCount: 4,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2023-11-14T00:00:00.000Z',
      },
      {
        id: 'DOC_ADA_DIABETES_2024',
        sourceId: 'SRC_ADA',
        title: 'ADA Standards of Care in Diabetes (2024): Diagnostic Criteria, Glycemic Targets & Pharmacotherapy',
        titleEn: 'ADA Standards of Care in Diabetes: Comprehensive Clinical Protocols',
        publishedDate: '2024-01-01',
        updatedDate: '2024-01-02',
        content: `
# American Diabetes Association (ADA) Standards of Care in Diabetes 2024

## 1. Diagnostic Criteria for Diabetes Mellitus
- Fasting Plasma Glucose (FPG): >= 126 mg/dL (7.0 mmol/L) after fasting for at least 8 hours.
- Glycated Hemoglobin (HbA1c): >= 6.5% (48 mmol/mol) performed in an NGSP-certified laboratory.
- 2-Hour Oral Glucose Tolerance Test (OGTT): >= 200 mg/dL (11.1 mmol/L) following a 75g glucose load.
- Random Plasma Glucose: >= 200 mg/dL (11.1 mmol/L) in an individual with classic symptoms of hyperglycemia (polyuria, polydipsia, unexplained weight loss) or hyperglycemic crisis.
- In the absence of unequivocal symptomatic hyperglycemia, diagnosis requires two abnormal test results from the same sample or two separate test samples.

## 2. Glycemic Goals and Monitoring
- General Glycemic Target: HbA1c < 7.0% (53 mmol/mol) is recommended for most non-pregnant adult patients.
- More Stringent Target: HbA1c < 6.5% may be appropriate for selected individuals if achievable without significant hypoglycemia or adverse effects (short diabetes duration, young age, absence of significant cardiovascular disease).
- Less Stringent Target: HbA1c < 8.0% (64 mmol/mol) is appropriate for patients with severe hypoglycemia history, limited life expectancy, advanced microvascular/macrovascular complications, or extensive comorbid conditions.
- Preprandial capillary plasma glucose target: 80 - 130 mg/dL (4.4 - 7.2 mmol/L).
- Peak postprandial capillary plasma glucose target: < 180 mg/dL (10.0 mmol/L).

## 3. Pharmacological Management of Type 2 Diabetes
- First-Line Therapy: Metformin alongside comprehensive lifestyle modifications (nutritional optimization, >= 150 minutes/week of moderate-intensity aerobic physical exercise, weight management).
- Renal and Cardiovascular Comorbidities:
  * For patients with established Atherosclerotic Cardiovascular Disease (ASCVD) or high cardiovascular risk: Incorporate a GLP-1 receptor agonist with proven cardiovascular benefit or an SGLT2 inhibitor.
  * For patients with Heart Failure (reduced or preserved ejection fraction): Incorporate an SGLT2 inhibitor (e.g., Empagliflozin, Dapagliflozin).
  * For patients with Chronic Kidney Disease (CKD) with eGFR 20-60 mL/min/1.73m2 or urine albumin-to-creatinine ratio (uACR) >= 30 mg/g: Prescribe an SGLT2 inhibitor to slow CKD progression and reduce cardiovascular events.
- Renal Dosing Note for Metformin: Safe if eGFR >= 45 mL/min/1.73m2; reduce dose by 50% if eGFR 30-44 mL/min/1.73m2; strictly contraindicate if eGFR < 30 mL/min/1.73m2 due to lactic acidosis hazard.
        `.trim(),
        metadata: {
          category: 'ENDOCRINE_METABOLIC',
          specialty: 'Endocrinology / Primary Care',
          tags: ['diabetes', 'hba1c', 'metformin', 'sglt2', 'glucose', 'insulin', 'ada', 'السكري', 'السكر التراكمي', 'ميتفورمين'],
          language: 'both',
          clinicalDomain: 'Metabolic Disorders',
          targetAudience: 'Clinicians, diabetes educators, patients',
          guidelineCode: 'ADA-SOC-2024',
          evidenceGrade: 'Grade A Consensus Standards',
          summaryAr: 'معايير الرعاية المعتمدة من الجمعية الأمريكية للسكري: معايير التشخيص (HbA1c >= 6.5% أو سكر صائم >= 126 mg/dL)، أهداف التراكمي دون 7%، وإرشادات العلاج بالميتفورمين ومثبطات SGLT2 لحماية القلب والكلى.',
          summaryEn: 'ADA 2024 standards covering diagnostic thresholds, individualized HbA1c targets, and cardiorenal protective pharmacotherapy.',
        },
        status: 'INDEXED',
        chunksCount: 4,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'DOC_AHA_CHEST_PAIN_2021',
        sourceId: 'SRC_AHA_ACC',
        title: '2021 AHA/ACC Guideline for the Evaluation and Diagnosis of Acute Chest Pain in Emergency & Outpatient Settings',
        titleEn: 'AHA/ACC Chest Pain Guideline: Stratification, Rule-Out Protocols and Critical Red Flags',
        publishedDate: '2021-10-28',
        updatedDate: '2023-09-12',
        content: `
# 2021 AHA/ACC/ASE/CHEST/SAEM Guideline for the Evaluation and Diagnosis of Chest Pain

## 1. Cardinal Clinical Concept & Triage
- "Chest Pain" encompasses more than just sharp pain: it includes pressure, tightness, squeezing, aching, burning, heaviness, crushing sensation, or fullness in the chest, back, neck, jaw, epigastrium, or arms.
- Immediate Rule-Out Priorities (The "Big Five" Life Threats):
  1. Acute Coronary Syndrome (STEMI, NSTEMI, Unstable Angina).
  2. Acute Pulmonary Embolism (PE).
  3. Acute Aortic Dissection.
  4. Tension Pneumothorax.
  5. Esophageal Rupture (Boerhaave syndrome).

## 2. High-Risk Clinical Features & Emergency Indicators
- High-risk symptoms: Retrosternal pressure or crushing pain radiating to both arms or left shoulder/jaw, diaphoresis (cold sweats), exertional dyspnea, nausea, lightheadedness, or syncope.
- Red Flag Presentation: Sudden onset "thunderclap" tearing pain radiating to the interscapular region (suggestive of aortic dissection).
- Pleuritic chest pain (worse with deep inspiration) accompanied by sudden dyspnea and tachycardia (raises strong index of suspicion for Pulmonary Embolism or Pneumothorax).

## 3. Mandatory Emergency Diagnostics
- Electrocardiogram (12-lead ECG): Must be performed and interpreted within 10 minutes of arrival for all patients with acute chest discomfort to detect ST-elevation myocardial infarction (STEMI) or new LBBB.
- High-Sensitivity Cardiac Troponin (hs-cTn): The preferred biomarker for evaluating myocardial injury. Rapid 0/1-hour or 0/2-hour serial protocol is standard.
- Emergency Dispatch Directive: Patients with persistent chest pain and dyspnea must be transported via emergency medical services (EMS / 997 or 911); patients must NEVER self-drive to the emergency department.
        `.trim(),
        metadata: {
          category: 'CARDIOVASCULAR',
          specialty: 'Emergency Medicine / Cardiology',
          tags: ['chest pain', 'acute coronary syndrome', 'aha', 'ecg', 'troponin', 'angina', 'stemi', 'ألم الصدر', 'الذبحة', 'نوبة قلبية', 'طوارئ'],
          language: 'both',
          clinicalDomain: 'Emergency Cardiovascular Care',
          targetAudience: 'Emergency providers, paramedics, triage nurses, patients',
          guidelineCode: 'AHA-CP-2021',
          evidenceGrade: 'Class I Recommendation (Level A)',
          summaryAr: 'الدليل الإرشادي المشترك لجمعية القلب الأمريكية والكلية الأمريكية لأمراض القلب لتقييم ألم الصدر الحاد: استبعاد الأسباب الخمسة المهددة للحياة فورياً، وإجراء تخطيط القلب خلال 10 دقائق، وفحص إنزيم التروبونين فائق الحساسية، والاتصال الفوري بالإسعاف.',
          summaryEn: 'Comprehensive guideline for acute chest pain triage, mandatory 10-minute ECG, serial high-sensitivity troponin, and life-threat rule out.',
        },
        status: 'INDEXED',
        chunksCount: 3,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2023-09-12T00:00:00.000Z',
      },
      {
        id: 'DOC_WHO_RESPIRATORY_ARI',
        sourceId: 'SRC_WHO',
        title: 'WHO Clinical Practice Guidance: Acute Viral Upper Respiratory Infections & Antibiotic Stewardship',
        titleEn: 'WHO Guidelines on Acute Respiratory Infections (ARI) and Outpatient Management',
        publishedDate: '2022-04-15',
        updatedDate: '2023-11-30',
        content: `
# World Health Organization (WHO): Clinical Guidance on Acute Respiratory Infections

## 1. Clinical Recognition of Viral URTIs (Common Cold & Viral Pharyngitis)
- Presentation: Acute viral upper respiratory tract infections (URTIs) typically manifest with rhinorrhea (clear or mucopurulent nasal discharge), nasal congestion, sneezing, sore throat, mild dry cough, low-grade fever (< 38.5 C), and mild malaise.
- Etiology: Over 90-95% of cases are caused by viruses (Rhinovirus, Coronavirus, Respiratory Syncytial Virus, Adenovirus, Parainfluenza).
- Natural History: Symptoms typically peak at days 2-4 and resolve spontaneously within 7-10 days. Cough may persist up to 2-3 weeks due to post-viral bronchial hyperreactivity.

## 2. Rational Supportive Care (Non-Pharmacological & Symptomatic)
- Hydration: Liberal oral fluid intake to keep mucous membranes moist and thin respiratory secretions.
- Nasal Hygiene: Isotonic or hypertonic saline nasal spray or rinses to relieve nasal congestion without rebound rhinitis medicamentosa.
- Analgesia & Antipyresis: Paracetamol (Acetaminophen) or Ibuprofen for discomfort and headache. Avoid Aspirin in children and adolescents under 18 years due to Reye syndrome risk.
- Honey: A teaspoon of natural honey in warm water or tea is recommended for acute cough in individuals over 1 year of age (strictly contraindicated under 1 year due to infant botulism risk).

## 3. Strict Antibiotic Stewardship Principles
- Antibiotics do not hasten symptom resolution, do not shorten illness duration, and do not prevent bacterial complications in uncomplicated viral URTIs.
- Unnecessary antibiotic use contributes to antimicrobial resistance, drug-induced adverse events, and gastrointestinal dysbiosis.
- Colored sputum or nasal discharge (yellow or green) is caused by neutrophil infiltration during the normal immune response and does NOT indicate bacterial infection.

## 4. Red Flag Warning Signs Warranting In-Person Clinical Assessment
- High persistent fever >= 39.0 C lasting more than 3-4 consecutive days.
- Shortness of breath, tachypnea, stridor, wheezing, or central chest pain.
- Inability to swallow fluids, severe trismus, or asymmetric tonsillar swelling with uvular deviation (suspicion of peritonsillar abscess / quinsy).
- Confusion, lethargy, or marked clinical deterioration after transient improvement ("double sickening").
        `.trim(),
        metadata: {
          category: 'INFECTIOUS_RESPIRATORY',
          specialty: 'Infectious Disease / Primary Care / Pulmonology',
          tags: ['cold', 'flu', 'cough', 'throat', 'antibiotic', 'who', 'respiratory', 'نزلة برد', 'انفلونزا', 'احتقان الحلق', 'سعال', 'مضاد حيوي'],
          language: 'both',
          clinicalDomain: 'Respiratory Infections',
          targetAudience: 'Primary care providers, general public, triage engines',
          guidelineCode: 'WHO-ARI-2022',
          evidenceGrade: 'Grade A Public Health Recommendation',
          summaryAr: 'المبادئ التوجيهية لمنظمة الصحة العالمية لتدبير عدوى الجهاز التنفسي العلوي الحادة: التأكيد على الطبيعة الفيروسية المحدودة ذاتياً لنزلات البرد، والنهي التام عن المضادات الحيوية العشوائية، وتقديم خطة الترطيب ومسكنات الألم الخفيفة ومراقبة علامات الإنذار.',
          summaryEn: 'WHO guidelines emphasizing supportive care for viral respiratory illness, strict antibiotic stewardship, and monitoring for secondary complications.',
        },
        status: 'INDEXED',
        chunksCount: 4,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2023-11-30T00:00:00.000Z',
      },
      {
        id: 'DOC_MOH_SA_HEADACHE',
        sourceId: 'SRC_MOH_SA',
        title: 'Saudi Ministry of Health Clinical Practice Guideline: Primary Headache & Migraine Management Pathway',
        titleEn: 'Saudi MOH Clinical Pathway for Migraine and Primary Headaches',
        publishedDate: '2023-03-20',
        updatedDate: '2024-01-10',
        content: `
# Saudi Ministry of Health: Clinical Practice Guideline for Primary Headache Disorders

## 1. Classification & Diagnostic Differentiation
- Primary Headaches: Headache is the primary disease itself (Migraine, Tension-Type Headache, Cluster Headache).
- Migraine without Aura (ICHD-3 criteria): Recurrent attacks lasting 4 to 72 hours, with at least 2 characteristics: unilateral location, pulsating quality, moderate to severe pain intensity, aggravation by routine physical activity; accompanied by at least one of: nausea/vomiting, or photophobia and phonophobia.
- Tension-Type Headache: Bilateral, pressing or tightening (non-pulsating) band-like pain, mild to moderate severity, not aggravated by walking or stairs, absence of nausea.

## 2. Mandatory SNOOP Red Flag Screening for Secondary Headaches
Any patient presenting with headache must be systematically screened for secondary life-threatening causes:
- **S** — Systemic symptoms (fever, neck stiffness, night sweats, weight loss) or Systemic disease (HIV, active malignancy).
- **N** — Neurological symptoms or focal signs (confusion, altered consciousness, focal weakness, numbness, diplopia, papilledema).
- **O** — Onset: Sudden, abrupt peak within seconds to minutes ("Thunderclap headache" — warrants immediate emergency CT and LP to rule out Subarachnoid Hemorrhage).
- **O** — Older age: New onset or progressive headache after age 50 (suspect Giant Cell Arteritis, intracranial mass).
- **P** — Pattern change: Progressive headache worsening in frequency or severity, or triggered by Valsalva maneuvers (coughing, bending, straining) or positional changes.

## 3. Evidence-Based Acute Migraine Pharmacotherapy
- Mild to Moderate Attacks: Simple analgesics (Paracetamol 1000 mg) or NSAIDs (Ibuprofen 400-600 mg, Naproxen sodium 500 mg) taken early at onset.
- Moderate to Severe Attacks: Triptans (Sumatriptan 50-100 mg orally or Zolmitriptan 2.5-5 mg), optionally combined with an NSAID. Contraindicated in uncontrolled hypertension, ischemic heart disease, previous stroke/TIA.
- Anti-emetics: Metoclopramide or Domperidone to relieve nausea and enhance oral drug absorption.
- Medication-Overuse Headache (MOH) Warning: Limit triptans to < 10 days/month and simple analgesics to < 15 days/month.
        `.trim(),
        metadata: {
          category: 'NEUROLOGY',
          specialty: 'Neurology / General Practice',
          tags: ['headache', 'migraine', 'snoop', 'triptan', 'moh_sa', 'صداع', 'شقيقة', 'صداع نصفي', 'ألم الرأس'],
          language: 'both',
          clinicalDomain: 'Neurological Disorders',
          targetAudience: 'Physicians, primary triage workers, patients',
          guidelineCode: 'MOH-HA-2023',
          evidenceGrade: 'Grade A Saudi National Guideline',
          summaryAr: 'المسار الإكلينيكي المعتمد من وزارة الصحة السعودية لتدبير الصداع الأولي والنصفي: تطبيق معايير SNOOP لاستبعاد الصداع الثانوي المهدد للحياة (مثل النزف تحت العنكبوتية)، وخطة العلاج الحاد لنوبات الشقيقة، وتجنب صداع فرط استخدام المسكنات.',
          summaryEn: 'Saudi MOH clinical pathway detailing migraine criteria, SNOOP red flags rule-out, and acute stratified pharmacotherapy.',
        },
        status: 'INDEXED',
        chunksCount: 4,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-10T00:00:00.000Z',
      },
      {
        id: 'DOC_CDC_UTI_OUTPATIENT',
        sourceId: 'SRC_CDC',
        title: 'CDC Outpatient Guidance: Clinical Protocol for Uncomplicated Urinary Tract Infections (UTI)',
        titleEn: 'CDC Clinical Protocol for Acute Uncomplicated Cystitis vs Pyelonephritis',
        publishedDate: '2023-06-10',
        updatedDate: '2024-02-05',
        content: `
# CDC Core Elements of Outpatient Antibiotic Stewardship: Acute Urinary Tract Infections

## 1. Clinical Presentation & Localization
- Acute Uncomplicated Cystitis (Lower UTI): Characterized by dysuria (burning sensation on urination), urinary frequency, urgency, suprapubic tenderness or discomfort, and absence of systemic symptoms.
- Acute Pyelonephritis (Upper UTI): High fever (>= 38.0 C), rigors, costovertebral angle (CVA) / flank pain, nausea, vomiting, and systemic toxicity, with or without lower urinary symptoms.
- Critical Differential: Patients presenting with acute flank pain and high fever require immediate clinical evaluation to exclude obstructive pyelonephritis (e.g. infected renal stone) or sepsis.

## 2. Diagnostic Testing & Interpretation
- Dipstick Urinalysis:
  * Positive Leukocyte Esterase: Indicates pyuria (presence of white blood cells in urine).
  * Positive Nitrite: Highly specific (approx. 90%) for nitrate-reducing Enterobacteriaceae (especially Escherichia coli), though negative nitrite does not rule out infection (Gram-positive cocci or dilute urine).
  * Hematuria (Microscopic or Gross): Frequently observed in hemorrhagic cystitis; not an indicator of pyelonephritis by itself, but requires follow-up urinalysis after infection resolution to rule out urothelial pathology.
- Urine Culture and Susceptibility: Indicated for suspected pyelonephritis, recurrent UTIs, pregnancy, immunocompromised patients, male patients, or failure to respond to initial empiric therapy.

## 3. Antimicrobial Therapy Principles
- First-line agents for uncomplicated cystitis in non-pregnant females: Nitrofurantoin monohydrate/macrocrystals, Trimethoprim-sulfamethoxazole (TMP-SMX, if local resistance < 20%), or Fosfomycin trometamol.
- Avoid Fluoroquinolones (Ciprofloxacin, Levofloxacin) as first-line for simple cystitis due to adverse effect profiles (tendinopathy, QT prolongation) and to preserve efficacy for systemic infections.
        `.trim(),
        metadata: {
          category: 'UROLOGY_NEPHROLOGY',
          specialty: 'Urology / Infectious Disease / Primary Care',
          tags: ['uti', 'cystitis', 'pyelonephritis', 'dysuria', 'urinalysis', 'cdc', 'التهاب البول', 'مسالك بولية', 'حرقة البول', 'الكلى'],
          language: 'both',
          clinicalDomain: 'Urological Infections',
          targetAudience: 'Outpatient physicians, telemedicine clinicians',
          guidelineCode: 'CDC-UTI-2023',
          evidenceGrade: 'Grade A CDC Guidance',
          summaryAr: 'بروتوكول مركز السيطرة على الأمراض (CDC) لتدبير عدوى المسالك البولية في العيادات الخارجية: التفريق بين التهاب المثانة البسيط والتهاب الكلية والحويضة (Pyelonephritis)، تفسير تحليل البول المخبري، ومبادئ الاستخدام الرشيد للمضادات الحيوية.',
          summaryEn: 'CDC clinical protocol distinguishing cystitis from pyelonephritis, urinalysis parameters, and first-line antibiotic stewardship.',
        },
        status: 'INDEXED',
        chunksCount: 3,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-05T00:00:00.000Z',
      },
      {
        id: 'DOC_NICE_CG95_GERD',
        sourceId: 'SRC_NICE',
        title: 'NICE Guideline [CG95]: Gastro-oesophageal Reflux Disease (GORD) and Dyspepsia in Adults',
        titleEn: 'NICE CG95: Dyspepsia and GORD Management Protocols',
        publishedDate: '2019-10-10',
        updatedDate: '2023-08-15',
        content: `
# NICE Guideline [CG95]: Gastro-oesophageal Reflux Disease and Dyspepsia in Adults

## 1. Clinical Definition & Diagnostic Approach
- Dyspepsia: Broad term encompassing recurrent epigastric pain or discomfort, heartburn, acid regurgitation, early satiety, postprandial fullness, and bloating.
- Gastro-oesophageal Reflux Disease (GORD): Symptoms of retrosternal burning (heartburn) and acid regurgitation arising from abnormal acid reflux into the esophagus.

## 2. Red Flag Criteria for Urgent Endoscopy (Cancer Pathway Referral)
Patients presenting with dyspepsia or reflux who exhibit any of the following features must be referred urgently for upper GI endoscopy:
- Chronic gastrointestinal bleeding or iron-deficiency anemia.
- Progressive dysphagia (difficulty swallowing) or odynophagia (painful swallowing).
- Unintentional and unexplained weight loss.
- Persistent and intractable vomiting.
- Palpable epigastric mass on physical examination.
- Age 55 years or older with new-onset unexplained dyspepsia.

## 3. Stepped Pharmacological Management for Uncomplicated Reflux
- Initial full-dose Proton Pump Inhibitor (PPI) trial: Omeprazole 20 mg once daily, Lansoprazole 30 mg once daily, or Esomeprazole 20 mg once daily for 4 to 8 weeks.
- If symptoms respond, titrate down to the lowest effective maintenance dose as-needed (PRN) to reduce risks of long-term PPI complications (hypomagnesemia, Clostridioides difficile, hip fracture risk in elderly).
- H2-receptor antagonist (e.g. Famotidine) may be offered if PPIs are not tolerated.
- Lifestyle recommendations: Weight reduction if overweight, elevation of head of the bed during sleep, avoidance of eating within 3-4 hours prior to lying down, and limitation of coffee, alcohol, smoking, and rich fatty meals.
        `.trim(),
        metadata: {
          category: 'GASTROENTEROLOGY',
          specialty: 'Gastroenterology / Internal Medicine',
          tags: ['gerd', 'dyspepsia', 'reflux', 'ppi', 'omeprazole', 'nice', 'حموضة', 'ارتجاع المريء', 'المعدة', 'عسر الهضم'],
          language: 'both',
          clinicalDomain: 'Gastrointestinal Disorders',
          targetAudience: 'Primary care, gastro clinicians, patients',
          guidelineCode: 'CG95',
          evidenceGrade: 'Grade A NICE Guideline',
          summaryAr: 'إرشادات NICE [CG95] لإدارة الارتجاع المعدي المريئي وعسر الهضم: معايير التحويل العاجل للمنظار الهضمي (صعوبة البلع وفقدان الوزن)، خطة العلاج التدريجي بمثبطات مضخة البروتون (PPI)، والتوصيات السلوكية ونمط الحياة.',
          summaryEn: 'NICE guideline on dyspepsia and GORD, urgent endoscopy red flags, and titrated PPI therapeutic algorithms.',
        },
        status: 'INDEXED',
        chunksCount: 3,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2023-08-15T00:00:00.000Z',
      },
      {
        id: 'DOC_UPTODATE_WARFARIN_NSAID',
        sourceId: 'SRC_UPTODATE',
        title: 'UpToDate Drug Safety Warning: Major Bleeding Risk with Concomitant Anticoagulants & NSAIDs',
        titleEn: 'UpToDate Drug Interaction Review: Warfarin/DOACs and Non-Steroidal Anti-Inflammatory Drugs',
        publishedDate: '2023-04-12',
        updatedDate: '2024-01-25',
        content: `
# Clinical Review: Severe Hemorrhagic Interaction Between Anticoagulants and NSAIDs

## 1. Mechanism of Pharmacodynamic Interaction
- Non-steroidal anti-inflammatory drugs (NSAIDs such as Ibuprofen, Naproxen, Diclofenac, Meloxicam, Ketorolac, and Celecoxib) reversibly or irreversibly inhibit cyclooxygenase-1 (COX-1), causing impaired platelet aggregation and thromboxane A2 suppression.
- Simultaneously, NSAIDs reduce protective gastric mucosal prostaglandins, precipitating gastric erosions and ulcerations.
- Concomitant use with oral anticoagulants (Warfarin, Rivaroxaban, Apixaban, Dabigatran, Edoxaban) multiplies the risk of catastrophic gastrointestinal hemorrhage (3-fold to 5-fold increased hazard ratio).

## 2. Clinical Consequences & Bleeding Manifestations
- Patients on Warfarin who initiate NSAID therapy often experience unpredictable INR fluctuations and life-threatening bleeding: hematemesis (vomiting blood or coffee-ground emesis), melena (black tarry stools), acute anemia, or occult GI hemorrhage.
- The combination is generally CONTRAINDICATED in routine outpatient practice unless rigorously justified and co-prescribed with potent gastroprotection (PPI) and intensive clinical monitoring.

## 3. Evidence-Based Clinical Management & Safe Alternatives
- First-Line Analgesic Alternative: Paracetamol (Acetaminophen) at recommended doses (up to 2-3g daily for short-term pain relief).
- For localized musculoskeletal pain: Consider topical NSAID formulations (e.g. Diclofenac gel) with minimal systemic absorption, or physical therapy, heat/cold packs.
- If anti-inflammatory therapy is indispensable: Perform close serial INR testing (for Warfarin), monitor hemoglobin/hematocrit, and mandatory co-administration of an oral Proton Pump Inhibitor (e.g. Omeprazole 20mg daily).
        `.trim(),
        metadata: {
          category: 'PHARMACOLOGY_DRUG_SAFETY',
          specialty: 'Clinical Pharmacology / Hematology / Patient Safety',
          tags: ['warfarin', 'ibuprofen', 'nsaids', 'bleeding', 'anticoagulation', 'drug interaction', 'وارفارين', 'ايبوبروفين', 'تفاعل دوائي', 'نزيف'],
          language: 'both',
          clinicalDomain: 'Pharmacovigilance & Drug Safety',
          targetAudience: 'Pharmacists, prescribers, triage officers, patients',
          guidelineCode: 'UPTODATE-DRUG-INT-01',
          evidenceGrade: 'Grade A Systematic Pharmacovigilance Evidence',
          summaryAr: 'مراجعة الأمان السريري والتفاعلات الدوائية: التثبيط المزدوج لصفائح الدم وتخريش بطانة المعدة عند الجمع بين الوارفارين أو مسيلات الدم ومضادات الالتهاب (NSAIDs) يرفع خطر النزيف الهضمي الحاد، مع تفضيل الباراسيتامول كبديل آمن.',
          summaryEn: 'Clinical review on major hemorrhagic hazard when combining anticoagulants and NSAIDs, detailing platelet inhibition mechanisms and safer analgesic alternatives.',
        },
        status: 'INDEXED',
        chunksCount: 3,
        processedAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-25T00:00:00.000Z',
      },
    ];

    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
  }

  public getAllDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values());
  }

  public getDocumentById(id: string): KnowledgeDocument | undefined {
    return this.documents.get(id);
  }

  public getDocumentsBySourceId(sourceId: string): KnowledgeDocument[] {
    return Array.from(this.documents.values()).filter((d) => d.sourceId === sourceId);
  }

  public createDocument(data: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt' | 'chunksCount' | 'status'> & { id?: string }): KnowledgeDocument {
    const source = sourceRegistry.getSourceById(data.sourceId);
    if (!source) {
      throw new Error(`Invalid sourceId "${data.sourceId}". Source does not exist in registry.`);
    }

    const id = data.id || `DOC_${data.sourceId.replace('SRC_', '')}_${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const doc: KnowledgeDocument = {
      ...data,
      id,
      status: 'DRAFT',
      chunksCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(id, doc);
    sourceRegistry.updateDocumentCount(data.sourceId, 1);
    return doc;
  }

  public updateDocument(id: string, updates: Partial<Omit<KnowledgeDocument, 'id' | 'createdAt'>>): KnowledgeDocument {
    const existing = this.documents.get(id);
    if (!existing) {
      throw new Error(`Document with ID "${id}" not found.`);
    }

    const updated: KnowledgeDocument = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.documents.set(id, updated);
    return updated;
  }

  public deleteDocument(id: string): boolean {
    const existing = this.documents.get(id);
    if (existing) {
      sourceRegistry.updateDocumentCount(existing.sourceId, -1);
      return this.documents.delete(id);
    }
    return false;
  }
}

export const documentStore = new DocumentStore();
