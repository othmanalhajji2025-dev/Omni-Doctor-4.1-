/**
 * Clinical Drug Safety Engine
 * 
 * Verifies:
 * 1. Duplicate Active Ingredients (e.g., Panadol + Tylenol both containing Paracetamol)
 * 2. Drug-Allergy Incompatibilities (e.g., Penicillin allergy vs Amoxicillin/Clavulanate)
 * 3. Disease-Drug Incompatibilities (e.g., Peptic Ulcer vs NSAID, CKD vs Metformin/Spironolactone, Pregnancy vs Statin/ACE-I)
 * 4. Potential Drug-Drug Interactions (e.g., Warfarin + NSAID, ACE-I + Spironolactone, SSRI + Tramadol)
 * 5. Composite Risk Gauge & Prescriber/Patient Guidance
 */

import {
  DrugSafetyCheckRequest,
  DrugSafetyCheckResult,
  DuplicateIngredientAlert,
  AllergyAlert,
  ConditionContraindicationAlert,
  DrugInteractionDetail,
} from './types.js';
import { drugKnowledgeRepository } from './dataSourceArchitecture.js';

// Canonical Active Ingredient Mapping for Brand Names & Generics
interface IngredientMapping {
  activeIngredients: string[];
  activeIngredientsAr: string[];
  drugClass: string;
  genericCanonical: string;
}

const CANONICAL_DRUG_MAP: Record<string, IngredientMapping> = {
  // Paracetamol / Acetaminophen
  paracetamol: {
    activeIngredients: ['Paracetamol / Acetaminophen'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين'],
    drugClass: 'Analgesic & Antipyretic',
    genericCanonical: 'Paracetamol',
  },
  acetaminophen: {
    activeIngredients: ['Paracetamol / Acetaminophen'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين'],
    drugClass: 'Analgesic & Antipyretic',
    genericCanonical: 'Paracetamol',
  },
  panadol: {
    activeIngredients: ['Paracetamol / Acetaminophen'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين'],
    drugClass: 'Analgesic & Antipyretic',
    genericCanonical: 'Paracetamol',
  },
  'panadol extra': {
    activeIngredients: ['Paracetamol / Acetaminophen', 'Caffeine'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين', 'كافيين'],
    drugClass: 'Analgesic Combination',
    genericCanonical: 'Paracetamol',
  },
  'panadol cold': {
    activeIngredients: ['Paracetamol / Acetaminophen', 'Pseudoephedrine'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين', 'سودوإيفيدرين'],
    drugClass: 'Cold & Flu Combination',
    genericCanonical: 'Paracetamol',
  },
  tylenol: {
    activeIngredients: ['Paracetamol / Acetaminophen'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين'],
    drugClass: 'Analgesic & Antipyretic',
    genericCanonical: 'Paracetamol',
  },
  fevadol: {
    activeIngredients: ['Paracetamol / Acetaminophen'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين'],
    drugClass: 'Analgesic & Antipyretic',
    genericCanonical: 'Paracetamol',
  },
  adol: {
    activeIngredients: ['Paracetamol / Acetaminophen'],
    activeIngredientsAr: ['باراسيتامول / أسيتامينوفين'],
    drugClass: 'Analgesic & Antipyretic',
    genericCanonical: 'Paracetamol',
  },

  // Ibuprofen / NSAIDs
  ibuprofen: {
    activeIngredients: ['Ibuprofen'],
    activeIngredientsAr: ['إيبوبروفين'],
    drugClass: 'NSAID',
    genericCanonical: 'Ibuprofen',
  },
  advil: {
    activeIngredients: ['Ibuprofen'],
    activeIngredientsAr: ['إيبوبروفين'],
    drugClass: 'NSAID',
    genericCanonical: 'Ibuprofen',
  },
  motrin: {
    activeIngredients: ['Ibuprofen'],
    activeIngredientsAr: ['إيبوبروفين'],
    drugClass: 'NSAID',
    genericCanonical: 'Ibuprofen',
  },
  brufen: {
    activeIngredients: ['Ibuprofen'],
    activeIngredientsAr: ['إيبوبروفين'],
    drugClass: 'NSAID',
    genericCanonical: 'Ibuprofen',
  },
  nurofen: {
    activeIngredients: ['Ibuprofen'],
    activeIngredientsAr: ['إيبوبروفين'],
    drugClass: 'NSAID',
    genericCanonical: 'Ibuprofen',
  },
  profen: {
    activeIngredients: ['Ibuprofen'],
    activeIngredientsAr: ['إيبوبروفين'],
    drugClass: 'NSAID',
    genericCanonical: 'Ibuprofen',
  },

  // Atorvastatin / Statins
  atorvastatin: {
    activeIngredients: ['Atorvastatin calcium'],
    activeIngredientsAr: ['كالسيوم الأتورفاستاتين'],
    drugClass: 'Statin',
    genericCanonical: 'Atorvastatin',
  },
  lipitor: {
    activeIngredients: ['Atorvastatin calcium'],
    activeIngredientsAr: ['كالسيوم الأتورفاستاتين'],
    drugClass: 'Statin',
    genericCanonical: 'Atorvastatin',
  },
  torvast: {
    activeIngredients: ['Atorvastatin calcium'],
    activeIngredientsAr: ['كالسيوم الأتورفاستاتين'],
    drugClass: 'Statin',
    genericCanonical: 'Atorvastatin',
  },
  atorva: {
    activeIngredients: ['Atorvastatin calcium'],
    activeIngredientsAr: ['كالسيوم الأتورفاستاتين'],
    drugClass: 'Statin',
    genericCanonical: 'Atorvastatin',
  },

  // Metformin
  metformin: {
    activeIngredients: ['Metformin hydrochloride'],
    activeIngredientsAr: ['هيدروكلوريد الميتفورمين'],
    drugClass: 'Biguanide',
    genericCanonical: 'Metformin',
  },
  glucophage: {
    activeIngredients: ['Metformin hydrochloride'],
    activeIngredientsAr: ['هيدروكلوريد الميتفورمين'],
    drugClass: 'Biguanide',
    genericCanonical: 'Metformin',
  },
  fortamet: {
    activeIngredients: ['Metformin hydrochloride'],
    activeIngredientsAr: ['هيدروكلوريد الميتفورمين'],
    drugClass: 'Biguanide',
    genericCanonical: 'Metformin',
  },

  // Warfarin
  warfarin: {
    activeIngredients: ['Warfarin sodium'],
    activeIngredientsAr: ['وارفارين الصوديوم'],
    drugClass: 'Anticoagulant (VKA)',
    genericCanonical: 'Warfarin',
  },
  coumadin: {
    activeIngredients: ['Warfarin sodium'],
    activeIngredientsAr: ['وارفارين الصوديوم'],
    drugClass: 'Anticoagulant (VKA)',
    genericCanonical: 'Warfarin',
  },
  marevan: {
    activeIngredients: ['Warfarin sodium'],
    activeIngredientsAr: ['وارفارين الصوديوم'],
    drugClass: 'Anticoagulant (VKA)',
    genericCanonical: 'Warfarin',
  },

  // Lisinopril
  lisinopril: {
    activeIngredients: ['Lisinopril'],
    activeIngredientsAr: ['ليزينوبريل'],
    drugClass: 'ACE Inhibitor',
    genericCanonical: 'Lisinopril',
  },
  zestril: {
    activeIngredients: ['Lisinopril'],
    activeIngredientsAr: ['ليزينوبريل'],
    drugClass: 'ACE Inhibitor',
    genericCanonical: 'Lisinopril',
  },
  prinivil: {
    activeIngredients: ['Lisinopril'],
    activeIngredientsAr: ['ليزينوبريل'],
    drugClass: 'ACE Inhibitor',
    genericCanonical: 'Lisinopril',
  },

  // Spironolactone
  spironolactone: {
    activeIngredients: ['Spironolactone'],
    activeIngredientsAr: ['سبيرونولاكتون'],
    drugClass: 'Aldosterone Antagonist',
    genericCanonical: 'Spironolactone',
  },
  aldactone: {
    activeIngredients: ['Spironolactone'],
    activeIngredientsAr: ['سبيرونولاكتون'],
    drugClass: 'Aldosterone Antagonist',
    genericCanonical: 'Spironolactone',
  },

  // Amoxicillin / Clavulanate
  'amoxicillin and clavulanate potassium': {
    activeIngredients: ['Amoxicillin', 'Clavulanic Acid'],
    activeIngredientsAr: ['أموكسيسيلين', 'حمض الكلافولانيك'],
    drugClass: 'Penicillin / Beta-lactam',
    genericCanonical: 'Amoxicillin and Clavulanate Potassium',
  },
  amoxicillin: {
    activeIngredients: ['Amoxicillin'],
    activeIngredientsAr: ['أموكسيسيلين'],
    drugClass: 'Penicillin / Beta-lactam',
    genericCanonical: 'Amoxicillin and Clavulanate Potassium',
  },
  augmentin: {
    activeIngredients: ['Amoxicillin', 'Clavulanic Acid'],
    activeIngredientsAr: ['أموكسيسيلين', 'حمض الكلافولانيك'],
    drugClass: 'Penicillin / Beta-lactam',
    genericCanonical: 'Amoxicillin and Clavulanate Potassium',
  },
  curam: {
    activeIngredients: ['Amoxicillin', 'Clavulanic Acid'],
    activeIngredientsAr: ['أموكسيسيلين', 'حمض الكلافولانيك'],
    drugClass: 'Penicillin / Beta-lactam',
    genericCanonical: 'Amoxicillin and Clavulanate Potassium',
  },
  julmentin: {
    activeIngredients: ['Amoxicillin', 'Clavulanic Acid'],
    activeIngredientsAr: ['أموكسيسيلين', 'حمض الكلافولانيك'],
    drugClass: 'Penicillin / Beta-lactam',
    genericCanonical: 'Amoxicillin and Clavulanate Potassium',
  },
  klavox: {
    activeIngredients: ['Amoxicillin', 'Clavulanic Acid'],
    activeIngredientsAr: ['أموكسيسيلين', 'حمض الكلافولانيك'],
    drugClass: 'Penicillin / Beta-lactam',
    genericCanonical: 'Amoxicillin and Clavulanate Potassium',
  },

  // Clopidogrel
  clopidogrel: {
    activeIngredients: ['Clopidogrel'],
    activeIngredientsAr: ['كلوبيدوغريل'],
    drugClass: 'Antiplatelet (P2Y12)',
    genericCanonical: 'Clopidogrel',
  },
  plavix: {
    activeIngredients: ['Clopidogrel'],
    activeIngredientsAr: ['كلوبيدوغريل'],
    drugClass: 'Antiplatelet (P2Y12)',
    genericCanonical: 'Clopidogrel',
  },

  // Escitalopram
  escitalopram: {
    activeIngredients: ['Escitalopram'],
    activeIngredientsAr: ['إسيتالوبرام'],
    drugClass: 'SSRI Antidepressant',
    genericCanonical: 'Escitalopram',
  },
  cipralex: {
    activeIngredients: ['Escitalopram'],
    activeIngredientsAr: ['إسيتالوبرام'],
    drugClass: 'SSRI Antidepressant',
    genericCanonical: 'Escitalopram',
  },
  lexapro: {
    activeIngredients: ['Escitalopram'],
    activeIngredientsAr: ['إسيتالوبرام'],
    drugClass: 'SSRI Antidepressant',
    genericCanonical: 'Escitalopram',
  },

  // Tramadol
  tramadol: {
    activeIngredients: ['Tramadol'],
    activeIngredientsAr: ['ترامادول'],
    drugClass: 'Opioid Analgesic',
    genericCanonical: 'Tramadol',
  },
  tramal: {
    activeIngredients: ['Tramadol'],
    activeIngredientsAr: ['ترامادول'],
    drugClass: 'Opioid Analgesic',
    genericCanonical: 'Tramadol',
  },
  ultram: {
    activeIngredients: ['Tramadol'],
    activeIngredientsAr: ['ترامادول'],
    drugClass: 'Opioid Analgesic',
    genericCanonical: 'Tramadol',
  },

  // Furosemide
  furosemide: {
    activeIngredients: ['Furosemide'],
    activeIngredientsAr: ['فوروسيميد'],
    drugClass: 'Loop Diuretic',
    genericCanonical: 'Furosemide',
  },
  lasix: {
    activeIngredients: ['Furosemide'],
    activeIngredientsAr: ['فوروسيميد'],
    drugClass: 'Loop Diuretic',
    genericCanonical: 'Furosemide',
  },

  // Clarithromycin
  clarithromycin: {
    activeIngredients: ['Clarithromycin'],
    activeIngredientsAr: ['كلاريثروميسين'],
    drugClass: 'Macrolide Antibiotic',
    genericCanonical: 'Clarithromycin',
  },
  klacid: {
    activeIngredients: ['Clarithromycin'],
    activeIngredientsAr: ['كلاريثروميسين'],
    drugClass: 'Macrolide Antibiotic',
    genericCanonical: 'Clarithromycin',
  },

  // Omeprazole
  omeprazole: {
    activeIngredients: ['Omeprazole'],
    activeIngredientsAr: ['أوميبرازول'],
    drugClass: 'Proton Pump Inhibitor (PPI)',
    genericCanonical: 'Omeprazole',
  },
  prilosec: {
    activeIngredients: ['Omeprazole'],
    activeIngredientsAr: ['أوميبرازول'],
    drugClass: 'Proton Pump Inhibitor (PPI)',
    genericCanonical: 'Omeprazole',
  },
  losec: {
    activeIngredients: ['Omeprazole'],
    activeIngredientsAr: ['أوميبرازول'],
    drugClass: 'Proton Pump Inhibitor (PPI)',
    genericCanonical: 'Omeprazole',
  },
};

// Known Allergy Mappings
interface AllergyRule {
  allergenKeywords: string[];
  drugClasses: string[];
  activeIngredients: string[];
  reactionRiskAr: string;
  reactionRiskEn: string;
  severity: 'CONTRAINDICATED' | 'HIGH_ALERT';
}

const ALLERGY_RULES: AllergyRule[] = [
  {
    allergenKeywords: ['penicillin', 'بنسلين', 'beta-lactam', 'بيتا لاكتام', 'amoxicillin', 'أموكسيسيلين'],
    drugClasses: ['Penicillin / Beta-lactam', 'Beta-Lactam Antibiotic + Beta-Lactamase Inhibitor'],
    activeIngredients: ['Amoxicillin', 'Ampicillin', 'Penicillin'],
    reactionRiskAr: 'خطر حدوث صدمة تأقية (Anaphylaxis) مهددة للحياة، وذمة وعائية، وتضيق قصبي حاد.',
    reactionRiskEn: 'Severe life-threatening anaphylactic shock, laryngeal angioedema, and bronchospasm.',
    severity: 'CONTRAINDICATED',
  },
  {
    allergenKeywords: ['nsaid', 'aspirin', 'أسبرين', 'ibuprofen', 'إيبوبروفين', 'مضادات الالتهاب غير الستيرويدية'],
    drugClasses: ['NSAID', 'Nonsteroidal Anti-inflammatory Drug (NSAID)'],
    activeIngredients: ['Ibuprofen', 'Naproxen', 'Diclofenac', 'Aspirin'],
    reactionRiskAr: 'خطر تشنج قصبي حاد ونوبات ربو شديدة (ثلاثية سامتر AERD) أو وذمة وعائية.',
    reactionRiskEn: 'Risk of acute bronchospasm, severe asthma exacerbation (Aspirin-Exacerbated Respiratory Disease), or angioedema.',
    severity: 'CONTRAINDICATED',
  },
  {
    allergenKeywords: ['sulfa', 'sulfonamide', 'سلفا'],
    drugClasses: ['Loop Diuretic'],
    activeIngredients: ['Furosemide', 'Sulfamethoxazole'],
    reactionRiskAr: 'حساسية متصالبة مع مركبات السلفوناميد قد تسبب طفحاً جلدي شديداً أو متلازمة ستيفنز جونسون.',
    reactionRiskEn: 'Potential cross-reactivity with sulfonamide moiety causing severe cutaneous reactions or SJS.',
    severity: 'HIGH_ALERT',
  },
  {
    allergenKeywords: ['statin', 'ستاتين', 'atorvastatin', 'أتورفاستاتين'],
    drugClasses: ['Statin', 'HMG-CoA Reductase Inhibitor (Statin)'],
    activeIngredients: ['Atorvastatin calcium', 'Simvastatin', 'Rosuvastatin'],
    reactionRiskAr: 'تاريخ عدم تحمل شديد للستاتين أو اعتلال عضلي ناخر حاد.',
    reactionRiskEn: 'Statin intolerance or risk of severe immune-mediated necrotizing myopathy.',
    severity: 'CONTRAINDICATED',
  },
  {
    allergenKeywords: ['opioid', 'أفيون', 'tramadol', 'ترامادول', 'codeine', 'كوديين'],
    drugClasses: ['Opioid Analgesic', 'Centrally-Acting Synthetic Opioid Analgesic & SNRI'],
    activeIngredients: ['Tramadol', 'Codeine', 'Morphine'],
    reactionRiskAr: 'حساسية أفيونية حادة أو تثبيط تنفسي مهدد للحياة.',
    reactionRiskEn: 'Severe opioid hypersensitivity or acute respiratory depression.',
    severity: 'CONTRAINDICATED',
  },
];

// Condition Incompatibility Rules
interface ConditionRule {
  conditionKeywords: string[];
  drugClasses: string[];
  genericNames: string[];
  severity: 'ABSOLUTE_CONTRAINDICATION' | 'CAUTION_REQUIRED';
  explanationAr: string;
  explanationEn: string;
  recommendationAr: string;
  recommendationEn: string;
}

const CONDITION_RULES: ConditionRule[] = [
  {
    conditionKeywords: ['peptic ulcer', 'قرحة المعدة', 'قرحة هضمية', 'gastric ulcer', 'gi bleed', 'نزيف هضمي'],
    drugClasses: ['NSAID', 'Nonsteroidal Anti-inflammatory Drug (NSAID)'],
    genericNames: ['Ibuprofen', 'Naproxen', 'Diclofenac'],
    severity: 'ABSOLUTE_CONTRAINDICATION',
    explanationAr: 'مضادات الالتهاب (NSAIDs) تثبط البروستاغلاندينات الحامية لجدار المعدة وتسبب ثقباً أو نزيفاً هضمياً حاداً.',
    explanationEn: 'NSAIDs inhibit gastroprotective mucosal prostaglandins, causing mucosal ulceration, bleeding, or perforation.',
    recommendationAr: 'يمنع استخدام الإيبوبروفين و NSAIDs؛ استخدم الباراسيتامول كمسكن آمن.',
    recommendationEn: 'Strictly avoid ibuprofen and all NSAIDs. Paracetamol is the safe analgesic of choice.',
  },
  {
    conditionKeywords: ['kidney', 'ckd', 'renal', 'قصور كلوي', 'فشل كلوي', 'كلى'],
    drugClasses: ['NSAID', 'Biguanide', 'Biguanide Antihyperglycemic'],
    genericNames: ['Metformin', 'Ibuprofen', 'Spironolactone'],
    severity: 'ABSOLUTE_CONTRAINDICATION',
    explanationAr: 'ميتفورمين ممنوع مع القصور الكلوي الشديد لخطر الحماض اللبني المميت؛ و NSAIDs تسبب تنخراً كلوياً وقصوراً حاداً.',
    explanationEn: 'Metformin carries high risk of fatal lactic acidosis in renal insufficiency; NSAIDs cause acute tubular injury and severe hypoperfusion.',
    recommendationAr: 'يجب تعديل الجرعات بناءً على معدل الترشيح الكبيبي (eGFR) ومراقبة وظائف الكلى دورياً.',
    recommendationEn: 'Assess baseline eGFR. Withhold metformin if eGFR < 30 mL/min. Discontinue NSAIDs.',
  },
  {
    conditionKeywords: ['pregnant', 'pregnancy', 'حامل', 'حمل'],
    drugClasses: ['Statin', 'HMG-CoA Reductase Inhibitor (Statin)', 'ACE Inhibitor', 'Angiotensin-Converting Enzyme (ACE) Inhibitor'],
    genericNames: ['Atorvastatin', 'Warfarin', 'Lisinopril', 'Ibuprofen'],
    severity: 'ABSOLUTE_CONTRAINDICATION',
    explanationAr: 'أدوية الستاتين والوارفارين ومثبطات ACE محظورة تماماً في الحمل لتسببها في تشوهات جنينية شديدة، وفشل كلوي للجنين وموته.',
    explanationEn: 'Statins, Warfarin, and ACE-inhibitors are known teratogens causing major fetal anomalies, renal dysgenesis, or death.',
    recommendationAr: 'إيقاف هذه الأدوية فوراً واستشارة طبيب النساء والتوليد لاستخدام بدائل آمنة (مثل ميثيل دوبا للضغط وإنسولين للسكري وهيبارين للسيولة).',
    recommendationEn: 'Immediately stop these medications. Switch to pregnancy-safe agents (e.g. methyldopa, LMWH, insulin).',
  },
  {
    conditionKeywords: ['liver', 'hepatic', 'كبد', 'تليف الكبد', 'التهاب كبدي', 'cirrhosis'],
    drugClasses: ['Statin', 'HMG-CoA Reductase Inhibitor (Statin)'],
    genericNames: ['Atorvastatin', 'Paracetamol'],
    severity: 'CAUTION_REQUIRED',
    explanationAr: 'أمراض الكبد النشطة تزيد خطر التسمم الكبدي والاعتلال العضلي نتيجة انخفاض تصريف الدواء.',
    explanationEn: 'Active hepatic disease impairs drug clearance and amplifies hepatotoxicity and myopathy risk.',
    recommendationAr: 'مراقبة إنزيمات الكبد (AST/ALT) وتجنب الجرعات العالية؛ والحد الأقصى للباراسيتامول هو 2 غرام/يوم.',
    recommendationEn: 'Monitor AST/ALT transaminases. Cap paracetamol intake at maximum 2,000 mg/day.',
  },
  {
    conditionKeywords: ['asthma', 'ربو', 'bronchospasm', 'حساسية الصدر'],
    drugClasses: ['NSAID', 'Nonsteroidal Anti-inflammatory Drug (NSAID)'],
    genericNames: ['Ibuprofen', 'Aspirin'],
    severity: 'CAUTION_REQUIRED',
    explanationAr: 'قد تحفز مضادات الالتهاب تشنجاً قصبياً حاداً ومفاجئاً لدى مرضى الربو (AERD).',
    explanationEn: 'NSAIDs can precipitate severe bronchospasm in susceptible patients with asthma.',
    recommendationAr: 'يفضل استخدام الباراسيتامول لتسكين الألم بدلاً من الإيبوبروفين.',
    recommendationEn: 'Use paracetamol for analgesia; exercise caution with NSAIDs.',
  },
  {
    conditionKeywords: ['heart failure', 'قصور القلب', 'عجز القلب'],
    drugClasses: ['NSAID', 'Nonsteroidal Anti-inflammatory Drug (NSAID)'],
    genericNames: ['Ibuprofen'],
    severity: 'ABSOLUTE_CONTRAINDICATION',
    explanationAr: 'مضادات الالتهاب تسبب احتباس الصوديوم والماء، وتعيق عمل مدرات البول ومثبطات ACE مما يؤدي لتدهور حاد في قصور القلب.',
    explanationEn: 'NSAIDs cause sodium/water retention, blunt diuretic and ACE-inhibitor efficacy, and precipitate acute decompensation.',
    recommendationAr: 'تجنب تام لمضادات الالتهاب غير الستيرويدية لدى مرضى قصور القلب الاحتقاني.',
    recommendationEn: 'Avoid NSAIDs completely in patients with congestive heart failure.',
  },
];

// Pairwise Drug Interactions Database
interface PairwiseInteraction {
  drugA: string;
  drugB: string;
  severity: 'CONTRAINDICATED' | 'MAJOR' | 'MODERATE' | 'MINOR';
  mechanismAr: string;
  mechanismEn: string;
  clinicalEffectAr: string;
  clinicalEffectEn: string;
  managementAr: string;
  managementEn: string;
  source: string;
}

const PAIRWISE_INTERACTIONS: PairwiseInteraction[] = [
  {
    drugA: 'Warfarin',
    drugB: 'Ibuprofen',
    severity: 'CONTRAINDICATED',
    mechanismAr: 'تثبيط تخثر الدم المتزامن مع تآكل الغشاء المخاطي للمعدة وتثبيط الصفائح الدموية بواسطة الإيبوبروفين.',
    mechanismEn: 'Pharmacodynamic synergy: mucosal ulceration and antiplatelet effect of ibuprofen combined with systemic anticoagulation.',
    clinicalEffectAr: 'نزيف هضمي حاد وثقب محتمل في المعدة (زيادة الخطر بأكثر من 4 أضعاف).',
    clinicalEffectEn: 'Severe upper gastrointestinal hemorrhage and perforation (4- to 5-fold increased risk).',
    managementAr: 'ممنوع الجمع إطلاقاً؛ استبدل الإيبوبروفين بالباراسيتامول بجرعات مضبوطة (< 2 غرام/يوم).',
    managementEn: 'Strictly avoid combination. Use paracetamol in controlled doses (< 2g/day) with INR surveillance.',
    source: 'FDA Drug Safety Alert & BNF Anticoagulant Guidelines',
  },
  {
    drugA: 'Lisinopril',
    drugB: 'Spironolactone',
    severity: 'MAJOR',
    mechanismAr: 'تثبيط مزدوج لإفراز الألدوستيرون بواسطة مثبط ACE ومستقبلات الألدوستيرون مما يمنع طرح البوتاسيوم كلوياً.',
    mechanismEn: 'Dual aldosterone inhibition by ACE inhibitor and mineralocorticoid antagonist halts renal potassium excretion.',
    clinicalEffectAr: 'فرط بوتاسيوم الدم الشديد والمهدد للحياة (Hyperkalemia) المسبب لتوقف القلب.',
    clinicalEffectEn: 'Severe hyperkalemia, conduction blocks, and lethal cardiac arrhythmias.',
    managementAr: 'يتطلب فحص البوتاسيوم ووظائف الكلى بعد 1 و 4 أسابيع من بدء العلاج المشترك، والامتناع عن مكملات البوتاسيوم.',
    managementEn: 'Mandatory serum potassium and creatinine checks at 1 and 4 weeks; avoid potassium supplements or salt substitutes.',
    source: 'ACC/AHA Heart Failure Guidelines & NICE NG136',
  },
  {
    drugA: 'Escitalopram',
    drugB: 'Tramadol',
    severity: 'CONTRAINDICATED',
    mechanismAr: 'تعزيز مزدوج لنشاط السيروتونين المركزي عبر تثبيط استرداده من كلا الدوائين وخفض عتبة التشنج.',
    mechanismEn: 'Additive central serotonergic neurotransmission enhancement and mutual lowering of seizure threshold.',
    clinicalEffectAr: 'متلازمة السيروتونين الحادة (نفضان عضلي، فرط حرارة، ارتباك ذهني) ونوبات صرع تشنجية.',
    clinicalEffectEn: 'Acute Serotonin Syndrome (hyperreflexia, clonus, hyperthermia) and major epileptic seizures.',
    managementAr: 'تجنب الجمع التام؛ استبدل الترامادول بمسكن غير سيروتونيني آمن.',
    managementEn: 'Avoid concurrent use. Select an alternative non-serotonergic analgesic.',
    source: 'FDA Boxed Warning & WHO Pharmacovigilance',
  },
  {
    drugA: 'Atorvastatin',
    drugB: 'Clarithromycin',
    severity: 'MAJOR',
    mechanismAr: 'المضاد الحيوي كلاريثروميسين يثبط بشدة إنزيم CYP3A4 الكبدي، مما يرفع تركيز الأتورفاستاتين في الدم بمقدار 4 إلى 8 أضعاف.',
    mechanismEn: 'Potent CYP3A4 inhibition by clarithromycin causes profound accumulation of atorvastatin in systemic circulation.',
    clinicalEffectAr: 'انحلال الربيدات وتلف العضلات الشديد (Rhabdomyolysis) وبيلة الميوغلوبين وفشل كلوي حاد.',
    clinicalEffectEn: 'Massive rhabdomyolysis, myoglobinuria, severe myopathy, and acute renal failure.',
    managementAr: 'أوقف أتورفاستاتين مؤقتاً طوال فترة العلاج بالماكرولايد واستأنفه بعد انتهاء كورس المضاد الحيوي.',
    managementEn: 'Temporarily withhold atorvastatin during macrolide antibiotic course; resume upon completion.',
    source: 'FDA Drug Safety Communication on Statin-CYP3A4 Interactions',
  },
  {
    drugA: 'Clopidogrel',
    drugB: 'Omeprazole',
    severity: 'MAJOR',
    mechanismAr: 'تثبيط إنزيم CYP2C19 بواسطة أوميبرازول يمنع التنشيط الحيوي للكلوبيدوغريل ويقلل تركيز شكله الفعال بنسبة 45%.',
    mechanismEn: 'Omeprazole inhibits CYP2C19 bioactivation of clopidogrel to its active antiplatelet metabolite.',
    clinicalEffectAr: 'فشل منع تخثر الصفائح الدموية وزيادة خطر انسداد الدعامة القلبية والنوبات القلبية.',
    clinicalEffectEn: 'Loss of antiplatelet protection, increased risk of stent thrombosis and recurrent myocardial infarction.',
    managementAr: 'استبدل أوميبرازول بـ بانتوبرازول (Pantoprazole) كبديل لحماية المعدة دون التأثير على الكلوبيدوغريل.',
    managementEn: 'Switch to Pantoprazole for gastroprotection, which exhibits minimal CYP2C19 inhibitory effect.',
    source: 'FDA Safety Alert & ACC/AHA DAPT Guidelines',
  },
  {
    drugA: 'Tramadol',
    drugB: 'Benzodiazepines',
    severity: 'CONTRAINDICATED',
    mechanismAr: 'تثبيط تآزري عميق للجهاز العصبي المركزي ومراكز التنفس في جذع الدماغ.',
    mechanismEn: 'Synergistic central nervous system depression and medullary respiratory center suppression.',
    clinicalEffectAr: 'تثبيط تنفسي حاد، غيبوبة عميقة، وهبوط حاد بضغط الدم والوفاة.',
    clinicalEffectEn: 'Profound sedation, respiratory arrest, coma, and fatal overdose.',
    managementAr: 'يحظر الجمع إلا في المستشفيات تحت مراقبة أجهزة التنفس ونالوكسون.',
    managementEn: 'Avoid concurrent prescribing outside monitored intensive care settings.',
    source: 'FDA Black Box Warning on Opioid-Benzodiazepine Co-administration',
  },
  {
    drugA: 'Furosemide',
    drugB: 'Digoxin',
    severity: 'MAJOR',
    mechanismAr: 'إدرار البول يسبب نقص بوتاسيوم ومغنيسيوم الدم، مما يرفع سمية الديجوكسين على عضلة القلب.',
    mechanismEn: 'Diuretic-induced hypokalemia and hypomagnesemia sensitize cardiac tissue to digoxin toxicity.',
    clinicalEffectAr: 'تسمم بالديجوكسين واضطرابات نظم بطينية خطيرة وحصار قلبي.',
    clinicalEffectEn: 'Digoxin toxicity, malignant ventricular arrhythmias, and heart block.',
    managementAr: 'مراقبة مستوى البوتاسيوم والمغنيسيوم في الدم بانتظام وضمان بقاء البوتاسيوم > 4.0 mEq/L.',
    managementEn: 'Maintain serum potassium > 4.0 mEq/L; monitor serum digoxin concentration periodically.',
    source: 'AHA Heart Failure Guidelines',
  },
  {
    drugA: 'Lisinopril',
    drugB: 'Ibuprofen',
    severity: 'MAJOR',
    mechanismAr: 'مضادات الالتهاب تضيق الشريان الوارد للكبيبات الكلوية، بينما يوسع مثبط ACE الشريان الصادر، مما ينهار معه ضغط الترشيح الكلوي.',
    mechanismEn: 'NSAID causes afferent arteriolar constriction while ACE-inhibitor dilates efferent arteriole, collapsing glomerular filtration.',
    clinicalEffectAr: 'تدهور وظائف الكلى وحدوث قصور كلوي حاد وارتفاع ضغط الدم وفقدان التأثير القلبي الوقائي.',
    clinicalEffectEn: 'Acute kidney injury, fluid retention, loss of antihypertensive control.',
    managementAr: 'تجنب الجمع المطول؛ استخدم الباراسيتامول لمسكنات الألم العادية ومراقبة الكرياتينين.',
    managementEn: 'Avoid prolonged co-use; prefer paracetamol for pain; monitor BUN and creatinine.',
    source: 'NICE Guidelines & British National Formulary',
  },
];

export class DrugSafetyEngine {
  /**
   * Comprehensive Multi-Check Drug Safety Evaluation
   */
  public async evaluateSafety(request: DrugSafetyCheckRequest): Promise<DrugSafetyCheckResult> {
    const rawMedications: string[] = [
      ...(request.currentMedications || []),
      ...(request.newMedication ? [request.newMedication] : []),
    ].filter(m => typeof m === 'string' && m.trim().length > 0);

    const allergies = request.allergies || [];
    const conditions = request.conditions || [];

    // 1. Resolve normalized medications to ingredients & classes
    const resolvedMeds = rawMedications.map(name => this.resolveMedication(name));

    // 2. Check for Duplicate Active Ingredients
    const duplicateAlerts = this.checkDuplicateIngredients(resolvedMeds);

    // 3. Check for Drug-Allergy Incompatibilities
    const allergyAlerts = this.checkAllergies(resolvedMeds, allergies);

    // 4. Check for Disease-Drug Incompatibilities
    const conditionAlerts = this.checkConditions(resolvedMeds, conditions, request);

    // 5. Check for Potential Drug-Drug Interactions
    const drugInteractions = this.checkDrugInteractions(resolvedMeds);

    // 6. Compute Overall Regimen Risk Score and Level
    const { overallRiskLevel, riskScore, hasCriticalStop } = this.calculateRisk(
      duplicateAlerts,
      allergyAlerts,
      conditionAlerts,
      drugInteractions
    );

    // 7. Formulate Clinical Guidance & Recommendations
    const { recommendationsAr, recommendationsEn, summaryAr, summaryEn } = this.generateGuidance(
      overallRiskLevel,
      duplicateAlerts,
      allergyAlerts,
      conditionAlerts,
      drugInteractions
    );

    const { metadata } = await drugKnowledgeRepository.searchDrugs('paracetamol');

    return {
      overallRiskLevel,
      riskScore,
      hasCriticalStop,
      duplicateActiveIngredients: duplicateAlerts,
      allergyAlerts,
      conditionContraindications: conditionAlerts,
      drugInteractions,
      clinicalSummaryAr: summaryAr,
      clinicalSummaryEn: summaryEn,
      recommendationsAr,
      recommendationsEn,
      evaluatedMedicationsCount: rawMedications.length,
      dataSourceMetadata: metadata,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private resolveMedication(medName: string): {
    rawName: string;
    canonicalGeneric: string;
    activeIngredients: string[];
    activeIngredientsAr: string[];
    drugClass: string;
  } {
    const cleaned = medName.trim().toLowerCase();

    // Check predefined dictionary
    for (const [key, mapping] of Object.entries(CANONICAL_DRUG_MAP)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return {
          rawName: medName,
          canonicalGeneric: mapping.genericCanonical,
          activeIngredients: mapping.activeIngredients,
          activeIngredientsAr: mapping.activeIngredientsAr,
          drugClass: mapping.drugClass,
        };
      }
    }

    // Default fallback
    return {
      rawName: medName,
      canonicalGeneric: medName,
      activeIngredients: [medName],
      activeIngredientsAr: [medName],
      drugClass: 'General Agent',
    };
  }

  /**
   * 1. Duplicate Active Ingredients Detection
   */
  private checkDuplicateIngredients(
    resolvedMeds: ReturnType<typeof this.resolveMedication>[]
  ): DuplicateIngredientAlert[] {
    const ingredientToMeds = new Map<string, { meds: string[]; ingredientAr: string }>();

    for (const med of resolvedMeds) {
      for (let i = 0; i < med.activeIngredients.length; i++) {
        const ingEn = med.activeIngredients[i];
        const ingAr = med.activeIngredientsAr[i] || ingEn;

        if (!ingredientToMeds.has(ingEn)) {
          ingredientToMeds.set(ingEn, { meds: [], ingredientAr: ingAr });
        }
        const record = ingredientToMeds.get(ingEn)!;
        if (!record.meds.includes(med.rawName)) {
          record.meds.push(med.rawName);
        }
      }
    }

    const alerts: DuplicateIngredientAlert[] = [];

    for (const [ingredient, data] of ingredientToMeds.entries()) {
      if (data.meds.length > 1) {
        // We have duplicate active ingredient across different medications!
        const isParacetamol = ingredient.toLowerCase().includes('paracetamol') || ingredient.toLowerCase().includes('acetaminophen');
        const isNsaid = ingredient.toLowerCase().includes('ibuprofen');

        const severity: 'CRITICAL' | 'HIGH' | 'MODERATE' = isParacetamol ? 'CRITICAL' : isNsaid ? 'HIGH' : 'MODERATE';

        alerts.push({
          activeIngredient: ingredient,
          activeIngredientAr: data.ingredientAr,
          conflictingMedications: data.meds,
          clinicalRiskAr: isParacetamol
            ? `تكرار مادة الباراسيتامول في ${data.meds.join(' + ')} يرفع خطر تجاوز الجرعة الآمنة (4000 ملغ/يوم) ويسبب تسمماً كبدياً حاداً ومميت.`
            : `تكرار تناول المادة الفعالة (${data.ingredientAr}) عبر أكثر من مستحضر (${data.meds.join(' و ')}) يضاعف خطر الآثار الجانبية والسمية الجسيمة.`,
          clinicalRiskEn: isParacetamol
            ? `Duplicate acetaminophen/paracetamol in [${data.meds.join(', ')}] risks exceeding max 4,000 mg/24h ceiling, precipitating acute hepatotoxicity.`
            : `Duplicate active ingredient (${ingredient}) across [${data.meds.join(', ')}] compounds cumulative toxicity risks.`,
          severity,
        });
      }
    }

    return alerts;
  }

  /**
   * 2. Drug-Allergy Verification
   */
  private checkAllergies(
    resolvedMeds: ReturnType<typeof this.resolveMedication>[],
    allergies: string[]
  ): AllergyAlert[] {
    const alerts: AllergyAlert[] = [];
    if (!allergies || allergies.length === 0) return alerts;

    const normalizedAllergies = allergies.map(a => a.trim().toLowerCase());

    for (const med of resolvedMeds) {
      for (const rule of ALLERGY_RULES) {
        const matchesAllergy = normalizedAllergies.some(userAllergy =>
          rule.allergenKeywords.some(keyword => userAllergy.includes(keyword) || keyword.includes(userAllergy))
        );

        if (matchesAllergy) {
          const matchesDrugClass = rule.drugClasses.some(dc =>
            med.drugClass.toLowerCase().includes(dc.toLowerCase())
          );
          const matchesIngredient = rule.activeIngredients.some(ai =>
            med.activeIngredients.some(mIng => mIng.toLowerCase().includes(ai.toLowerCase()))
          );

          if (matchesDrugClass || matchesIngredient) {
            alerts.push({
              medication: med.rawName,
              patientAllergy: allergies.find(a =>
                rule.allergenKeywords.some(k => a.toLowerCase().includes(k))
              ) || 'Allergy Recorded',
              allergyType: rule.drugClasses[0] || 'Drug Hypersensitivity',
              reactionRiskAr: rule.reactionRiskAr,
              reactionRiskEn: rule.reactionRiskEn,
              severity: rule.severity,
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * 3. Disease-Drug Incompatibilities
   */
  private checkConditions(
    resolvedMeds: ReturnType<typeof this.resolveMedication>[],
    conditions: string[],
    request: DrugSafetyCheckRequest
  ): ConditionContraindicationAlert[] {
    const alerts: ConditionContraindicationAlert[] = [];

    // Synthesize condition list including pregnancy flags if present
    const conditionPool = [...conditions];
    if (request.isPregnant) {
      conditionPool.push('Pregnancy / حمل');
    }
    if (request.eGFR !== undefined && request.eGFR < 30) {
      conditionPool.push('Severe Renal Failure / قصور كلوي شديد');
    }

    if (conditionPool.length === 0) return alerts;

    for (const med of resolvedMeds) {
      for (const rule of CONDITION_RULES) {
        const matchesCondition = conditionPool.some(userCond => {
          const condLower = userCond.toLowerCase();
          return rule.conditionKeywords.some(kw => condLower.includes(kw));
        });

        if (matchesCondition) {
          const matchesClass = rule.drugClasses.some(dc =>
            med.drugClass.toLowerCase().includes(dc.toLowerCase())
          );
          const matchesGeneric = rule.genericNames.some(gn =>
            med.canonicalGeneric.toLowerCase().includes(gn.toLowerCase())
          );

          if (matchesClass || matchesGeneric) {
            alerts.push({
              medication: med.rawName,
              condition: conditionPool.find(c =>
                rule.conditionKeywords.some(kw => c.toLowerCase().includes(kw))
              ) || 'Medical Condition',
              conditionAr: conditionPool.find(c =>
                rule.conditionKeywords.some(kw => c.toLowerCase().includes(kw))
              ) || 'حالة طبية مشخصة',
              severity: rule.severity,
              explanationAr: rule.explanationAr,
              explanationEn: rule.explanationEn,
              recommendationAr: rule.recommendationAr,
              recommendationEn: rule.recommendationEn,
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * 4. Pairwise Drug-Drug Interactions
   */
  private checkDrugInteractions(
    resolvedMeds: ReturnType<typeof this.resolveMedication>[]
  ): DrugInteractionDetail[] {
    const interactions: DrugInteractionDetail[] = [];
    const n = resolvedMeds.length;
    if (n < 2) return interactions;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const medA = resolvedMeds[i];
        const medB = resolvedMeds[j];

        for (const rule of PAIRWISE_INTERACTIONS) {
          const directMatch =
            (this.matchesDrug(medA, rule.drugA) && this.matchesDrug(medB, rule.drugB)) ||
            (this.matchesDrug(medA, rule.drugB) && this.matchesDrug(medB, rule.drugA));

          if (directMatch) {
            interactions.push({
              interactingDrugOrClass: `${medA.rawName} + ${medB.rawName}`,
              severity: rule.severity,
              mechanismAr: rule.mechanismAr,
              mechanismEn: rule.mechanismEn,
              clinicalEffectAr: rule.clinicalEffectAr,
              clinicalEffectEn: rule.clinicalEffectEn,
              managementAr: rule.managementAr,
              managementEn: rule.managementEn,
              source: rule.source,
            });
          }
        }
      }
    }

    return interactions;
  }

  private matchesDrug(med: ReturnType<typeof this.resolveMedication>, target: string): boolean {
    const t = target.toLowerCase();
    return (
      med.rawName.toLowerCase().includes(t) ||
      med.canonicalGeneric.toLowerCase().includes(t) ||
      med.drugClass.toLowerCase().includes(t) ||
      med.activeIngredients.some(ing => ing.toLowerCase().includes(t))
    );
  }

  /**
   * 5. Calculate Composite Safety Risk
   */
  private calculateRisk(
    duplicateAlerts: DuplicateIngredientAlert[],
    allergyAlerts: AllergyAlert[],
    conditionAlerts: ConditionContraindicationAlert[],
    drugInteractions: DrugInteractionDetail[]
  ): { overallRiskLevel: 'SAFE' | 'MODERATE_PRECAUTION' | 'HIGH_RISK' | 'CRITICAL_STOP'; riskScore: number; hasCriticalStop: boolean } {
    let score = 0;

    // Check critical stops
    const hasContraindicatedAllergy = allergyAlerts.some(a => a.severity === 'CONTRAINDICATED');
    const hasContraindicatedCondition = conditionAlerts.some(c => c.severity === 'ABSOLUTE_CONTRAINDICATION');
    const hasContraindicatedInteraction = drugInteractions.some(i => i.severity === 'CONTRAINDICATED');
    const hasCriticalDuplicate = duplicateAlerts.some(d => d.severity === 'CRITICAL');

    if (hasContraindicatedAllergy || hasContraindicatedCondition || hasContraindicatedInteraction || hasCriticalDuplicate) {
      return {
        overallRiskLevel: 'CRITICAL_STOP',
        riskScore: 95,
        hasCriticalStop: true,
      };
    }

    // Add weights
    score += duplicateAlerts.length * 25;
    score += allergyAlerts.length * 30;
    score += conditionAlerts.length * 20;

    for (const ddi of drugInteractions) {
      if (ddi.severity === 'MAJOR') score += 35;
      else if (ddi.severity === 'MODERATE') score += 15;
      else score += 5;
    }

    score = Math.min(100, Math.max(0, score));

    let overallRiskLevel: 'SAFE' | 'MODERATE_PRECAUTION' | 'HIGH_RISK' | 'CRITICAL_STOP' = 'SAFE';

    if (score >= 60) {
      overallRiskLevel = 'HIGH_RISK';
    } else if (score >= 20) {
      overallRiskLevel = 'MODERATE_PRECAUTION';
    } else {
      overallRiskLevel = 'SAFE';
    }

    return {
      overallRiskLevel,
      riskScore: score,
      hasCriticalStop: false,
    };
  }

  /**
   * 6. Generate Clinical Action Guidance
   */
  private generateGuidance(
    overallRiskLevel: 'SAFE' | 'MODERATE_PRECAUTION' | 'HIGH_RISK' | 'CRITICAL_STOP',
    duplicateAlerts: DuplicateIngredientAlert[],
    allergyAlerts: AllergyAlert[],
    conditionAlerts: ConditionContraindicationAlert[],
    drugInteractions: DrugInteractionDetail[]
  ): {
    recommendationsAr: string[];
    recommendationsEn: string[];
    summaryAr: string;
    summaryEn: string;
  } {
    const recsAr: string[] = [];
    const recsEn: string[] = [];

    if (duplicateAlerts.length > 0) {
      recsAr.push('يجب إيقاف الأدوية المزدوجة المحتوية على نفس المادة الفعالة فوراً لتجنب الجرعة الزائدة والتسمم العضوي.');
      recsEn.push('Immediately eliminate duplicate medications containing identical active ingredients to prevent accidental overdose.');
    }

    if (allergyAlerts.length > 0) {
      recsAr.push('تم رصد تعارض مع حساسية مسجلة في ملف المريض؛ يحظر صرف الدواء ويجب استبداله بعائلة علاجية بديلة آمنة.');
      recsEn.push('Patient allergy conflict identified. Withhold medication and consult prescribing physician for a non-cross-reactive alternative.');
    }

    if (conditionAlerts.length > 0) {
      recsAr.push('يوجد تعارض سريري بين بعض الأدوية والحالات المرضية المشخصة؛ يتطلب ذلك مراجعة الجرعات أو اختيار بديل مناسب.');
      recsEn.push('Disease-drug contraindication detected. Re-evaluate clinical necessity and select a disease-appropriate alternative.');
    }

    if (drugInteractions.length > 0) {
      recsAr.push('تم اكتشاف تفاعلات دوائية متزامنة تتطلب مباعدة أوقات الجرعات أو تعديل المقادير ومراقبة العلامات الحيوية.');
      recsEn.push('Drug-drug interactions detected. Adjust dosing schedules, monitor laboratory parameters (e.g. INR, potassium), and watch for adverse reactions.');
    }

    if (recsAr.length === 0) {
      recsAr.push('لم تُسجل أي تفاعلات حرجة أو تعارضات مانعة بين الأدوية والحالات المدخلة وفق مراجع السلامة السريرية المعتمدة.');
      recsEn.push('No significant drug-drug, allergy, or disease contraindications identified in the evaluated regimen.');
    }

    let summaryAr = '';
    let summaryEn = '';

    switch (overallRiskLevel) {
      case 'CRITICAL_STOP':
        summaryAr = 'تنبيه سريري حرج (CRITICAL STOP): يحتوي النظام الدوائي على موانع استعمال قطعية أو تفاعلات مهددة للحياة تتطلب تدخلاً طبياً فورياً.';
        summaryEn = 'CRITICAL CLINICAL STOP: Severe absolute contraindications or life-threatening interactions detected. Immediate clinical intervention required.';
        break;
      case 'HIGH_RISK':
        summaryAr = 'خطورة علاجية مرتفعة: توجد تفاعلات كبرى أو تعارضات تستدعي إشرافاً ومتابعة سريرية دقيقة وتعديلاً في الخطة العلاجية.';
        summaryEn = 'HIGH RISK REGIMEN: Major interactions or contraindications present requiring close clinical monitoring and therapeutic adjustments.';
        break;
      case 'MODERATE_PRECAUTION':
        summaryAr = 'تحذيرات تتطلب الحذر: توجد تفاعلات دوائية متوسطة تستدعي مباعدة الجرعات أو مراقبة الأعراض الجانبية.';
        summaryEn = 'MODERATE PRECAUTION: Moderate interactions present; adjust administration timing and observe for known side effects.';
        break;
      case 'SAFE':
        summaryAr = 'النظام الدوائي متوافق وآمن سريرياً في حدود البيانات المدخلة وبناءً على مراجع الصيدلة المعتمدة.';
        summaryEn = 'Medication regimen appears clinically compatible and safe based on current clinical reference data.';
        break;
    }

    return {
      recommendationsAr: recsAr,
      recommendationsEn: recsEn,
      summaryAr,
      summaryEn,
    };
  }
}

// Singleton Engine
export const drugSafetyEngine = new DrugSafetyEngine();
