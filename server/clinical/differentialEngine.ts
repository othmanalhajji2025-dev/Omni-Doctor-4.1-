import { DifferentialItem, ExtractedSymptomData, TriageUrgency } from '../types/medical.js';

/**
 * Clinical Differential Engine
 * Core Directive: NEVER PROVIDE A DEFINITIVE DIAGNOSIS ("لا تقدم Diagnosis").
 * Generate a curated list of clinical possibilities.
 * For each possibility:
 * - Name (Arabic & English)
 * - Supporting Factors (الأدلة والعوامل الداعمة الموجودة)
 * - Missing Factors (الأعراض أو الفحوصات الناقصة غير المؤكدة)
 * - Concern Level (مستوى القلق: LOW | MODERATE | HIGH)
 * - Recommended Evaluation (التقييم السريري الموصى به)
 * - Why Appeared (التعليل السريري لظهور الاحتمال)
 * - Prohibits precise pseudo-percentages unless supported by a certified predictive model.
 */

export function generateDifferentialPossibilities(
  data: ExtractedSymptomData,
  urgency: TriageUrgency,
  redFlagsCount: number
): DifferentialItem[] {
  const text = [
    ...(data.symptoms || []),
    data.location || '',
    data.oldcarts.character || '',
    ...(data.associatedSymptoms || []),
    ...(data.medicalHistoryContext || []),
  ].join(' ').toLowerCase();

  const results: DifferentialItem[] = [];

  // Scenario A: Chest Pain / Cardiovascular / Respiratory
  if (text.includes('صدر') || text.includes('chest') || text.includes('ضاغط') || text.includes('قلب')) {
    results.push({
      nameAr: 'متلازمة تاجية حادة محتملة (نقص تروية قلبية / ذبحة صدرية)',
      nameEn: 'Possible Acute Coronary Syndrome (Myocardial Ischemia / Angina)',
      supportingFactorsAr: [
        'وجود ثقل أو ألم ضاغط في منتصف الصدر',
        ...(data.associatedSymptoms.includes('تعرق بارد غزير') ? ['ترافق الألم مع تعرق بارد غزير'] : []),
        ...(data.associatedSymptoms.includes('ضيق وصعوبة في التنفس') ? ['صعوبة وضيق في التنفس بالتزامن مع الألم'] : []),
        ...(data.medicalHistoryContext.includes('داء السكري') || data.medicalHistoryContext.includes('ارتفاع ضغط الدم الشرياني')
          ? ['وجود عوامل خطورة وعائية قلبية في التاريخ الطبي']
          : []),
      ],
      supportingFactorsEn: [
        'Substernal oppressive chest pressure',
        ...(data.associatedSymptoms.length > 0 ? ['Associated systemic symptoms (dyspnea/diaphoresis)'] : []),
      ],
      missingFactorsAr: [
        'تخطيط قلب كهربائي عاجل من 12 مسرى (12-lead ECG) لتحديد أي تغيرات في قطعة ST',
        'فحص إنزيمات القلب الحيوية السريعة (High-sensitivity Troponin)',
        'معرفة نمط انتشار الألم الدقيق وتأثير النتروجليسرين',
      ],
      missingFactorsEn: [
        'Urgent 12-lead ECG to rule out ST elevation',
        'Serial high-sensitivity cardiac troponin biomarkers',
      ],
      concernLevel: 'HIGH',
      recommendedEvaluationAr: 'تقييم طارئ فوري في قسم الطوارئ (Emergency Dept) مع تخطيط قلب وتحليل التروبونين.',
      recommendedEvaluationEn: 'Immediate emergency department evaluation with 12-lead ECG and serial hs-Troponin testing.',
      whyAppearedAr: 'ظهر هذا الاعتبار السريري لأن ألم الصدر الضاغط المترافق مع عوارض وعائية يمثل حالة حرجة مهددة للحياة يجب نفيها واستبعادها أولاً كأولوية قصوى.',
      whyAppearedEn: 'Triggered because acute chest pressure with neuro-vegetative symptoms constitutes a life-threatening possibility that mandates prompt rule-out.',
    });

    results.push({
      nameAr: 'إجهاد أو التهاب عضلي هيكلي في جدار الصدر (Costochondritis / Musculoskeletal Strain)',
      nameEn: 'Chest Wall Musculoskeletal Strain / Costochondritis',
      supportingFactorsAr: [
        'تمركز الانزعاج في منطقة الصدر',
        ...(data.oldcarts.character?.includes('وخز') ? ['طبيعة الألم المشابهة للوخز الموضعي'] : []),
      ],
      supportingFactorsEn: [
        'Localized chest wall discomfort',
      ],
      missingFactorsAr: [
        'الفحص السريري المباشر لتحري الإيلام الموضعي بالجس على المفاصل الغضروفية (Tenderness on palpation)',
        'غياب استجابة إيجابية لتخطيط القلب',
      ],
      missingFactorsEn: [
        'Physical palpation exam for reproducible costochondral tenderness',
      ],
      concernLevel: 'LOW',
      recommendedEvaluationAr: 'فحص سريري لدى طبيب الرعاية الأولية لتأكيد استثارة الألم بالجس واستبعاد المسببات الأخرى.',
      recommendedEvaluationEn: 'Primary care clinical assessment to confirm chest wall tenderness on palpation.',
      whyAppearedAr: 'ظهر هذا الاحتمال لأن الآلام العضلية الهيكلية هي سبب حميد شائع جداً لآلام الصدر، ولكن لا يمكن الجزم بها إلا بعد استبعاد الأسباب الوعائية.',
      whyAppearedEn: 'Considered because musculoskeletal etiologies are extremely common benign causes of chest pain, confirmed only after cardiac clearance.',
    });

    results.push({
      nameAr: 'ارتجاع مريئي معدي حاد (Gastroesophageal Reflux Disease / Spasm)',
      nameEn: 'Acute Gastroesophageal Reflux / Esophageal Spasm',
      supportingFactorsAr: [
        'توضع الألم خلف عظم القص مع شعور بالضغط أو الحرقة',
        ...(data.oldcarts.character?.includes('حارق') ? ['الصفة الحارقة للألم'] : []),
      ],
      supportingFactorsEn: [
        'Retrosternal discomfort and sensation of burning',
      ],
      missingFactorsAr: [
        'علاقة الألم الواضحة بتناول وجبات دسمة أو الاستلقاء',
        'مدى الاستجابة لمضادات الحموضة الفموية',
      ],
      missingFactorsEn: [
        'Clear correlation with trigger meals or recumbency',
        'Response to antacid challenge',
      ],
      concernLevel: 'MODERATE',
      recommendedEvaluationAr: 'استشارة طبيب باطني لتقييم الحاجة لتجربة مثبطات مضخة البروتون (PPI) أو الفحص الهضمي.',
      recommendedEvaluationEn: 'Internal medicine evaluation for acid suppression trial or upper endoscopy if alarm symptoms exist.',
      whyAppearedAr: 'المريء يشترك مع القلب في مسارات التغذية العصبية الحسية، مما يجعل التشنج المريئي وارتجاع الحمض محاكياً لألم الصدر القلبي.',
      whyAppearedEn: 'Esophagus shares autonomic nerve pathways with myocardium, making acid reflux and esophageal spasms classic mimics of cardiac angina.',
    });
  }

  // Scenario B: Headache / Cranial
  else if (text.includes('رأس') || text.includes('صداع') || text.includes('headache') || text.includes('migraine')) {
    const isThrobbing = text.includes('نابض') || text.includes('throbbing');
    const hasPhoto = text.includes('ضوء') || text.includes('صوت') || text.includes('غثيان');

    if (isThrobbing || hasPhoto) {
      results.push({
        nameAr: 'صداع نصفي (شقيقة) دون هالة (Migraine without Aura)',
        nameEn: 'Migraine without Aura',
        supportingFactorsAr: [
          'طبيعة الصداع النابضة في جانب من الرأس',
          ...(hasPhoto ? ['ترافق الألم مع انزعاج من الضوء، الأصوات، أو الغثيان الخفيف'] : []),
          'استمرار النوبة لساعات أو أيام',
        ],
        supportingFactorsEn: [
          'Pulsatile/throbbing headache character',
          'Associated sensory intolerance (photophobia/phonophobia or mild nausea)',
        ],
        missingFactorsAr: [
          'معرفة تاريخ العائلة والأنماط الهرمونية أو المحفزات الغذائية',
          'فحص قاع العين العصبي للتأكد من سلامة العصب البصري',
        ],
        missingFactorsEn: [
          'Detailed trigger diary and familial pattern',
          'Fundoscopic examination for optic disc margin clarity',
        ],
        concernLevel: 'MODERATE',
        recommendedEvaluationAr: 'مراجعة عيادة طب الأسرة أو المخ والأعصاب لضبط بروتوكول علاجي وقائي وإجهاضي للنوبة.',
        recommendedEvaluationEn: 'Consultation with primary care or neurology for acute abortive and prophylactic migraine protocols.',
        whyAppearedAr: 'ظهر هذا الاحتمال السريري لاجتماع المعايير التشخيصية الدولية (IHS) للصداع النصفي: ألم نابض مع حساسية ضوئية أو غثيان.',
        whyAppearedEn: 'Suggested based on alignment with International Headache Society criteria: throbbing pain with sensory photophobia and nausea.',
      });
    }

    results.push({
      nameAr: 'صداع توتري (Tension-Type Headache)',
      nameEn: 'Tension-Type Headache',
      supportingFactorsAr: [
        'وجود صداع مستمر يضغط على الرأس كطوق محكم',
        'عدم تفاقمه المفرط مع النشاط البدني الروتيني',
      ],
      supportingFactorsEn: [
        'Constricting band-like cranial tension',
      ],
      missingFactorsAr: [
        'تقييم تشنج عضلات الرقبة والكتفين بالفحص اليدوي',
        'تقييم أنماط النوم ومستوى الإجهاد العصبي',
      ],
      missingFactorsEn: [
        'Cervical and pericranial muscle tenderness assessment',
      ],
      concernLevel: 'LOW',
      recommendedEvaluationAr: 'استشارة طبيب الرعاية الأولية إذا استمر الصداع لأكثر من 3 أيام أو لم يستجب للمسكنات البسيطة.',
      recommendedEvaluationEn: 'Routine outpatient consultation if persistent beyond 72 hours without response to simple analgesia.',
      whyAppearedAr: 'الصداع التوتري هو النمط الأكثر شيوعاً للصداع الأولي في العالم ويرتبط بالإرهاق وقلة النوم والإجهاد البصري.',
      whyAppearedEn: 'Tension headaches are the single most prevalent primary headache disorder, correlated with muscular strain and fatigue.',
    });

    if (redFlagsCount > 0 || (data.painScale && data.painScale >= 9)) {
      results.push({
        nameAr: 'صداع ثانوي حاد يستلزم استبعاد النزف تحت العنكبوتية (Secondary Headache Rule-Out)',
        nameEn: 'Secondary Acute Severe Headache (e.g. SAH rule-out)',
        supportingFactorsAr: [
          'شدة الصداع العالية جداً أو حدوثه الفجائي',
        ],
        supportingFactorsEn: [
          'High pain intensity and sudden acceleration',
        ],
        missingFactorsAr: [
          'فحص عصبي سريري كامل لفحص علامات التهيج السحائي وتصلب الرقبة',
          'تصوير مقطعي محوسب للدماغ دون صبغة (Non-contrast Head CT)',
        ],
        missingFactorsEn: [
          'Non-contrast emergency head CT scan',
          'Meningeal irritation signs (neck stiffness/Brudzinski)',
        ],
        concernLevel: 'HIGH',
        recommendedEvaluationAr: 'تقييم طارئ فوراً في المستشفى لإجراء فحص عصبي وأشعة مقطعية لنفي الأسباب الدماغية الحادة.',
        recommendedEvaluationEn: 'Emergency department triage for CT brain and neurological assessment to exclude secondary emergencies.',
        whyAppearedAr: 'الصداع الشديد المفاجئ (Thunderclap) يحمل مخاطر وعائية دماغية ويجب التعامل معه كحالة طارئة حتى يثبت العكس.',
        whyAppearedEn: 'Severe abrupt headache requires emergency evaluation to systematically exclude vascular intracranial pathologies.',
      });
    }
  }

  // Scenario C: Abdominal Pain / Gastrointestinal
  else if (text.includes('بطن') || text.includes('مغص') || text.includes('معدة') || text.includes('abdomen') || text.includes('stomach')) {
    results.push({
      nameAr: 'التهاب المعدة والأمعاء الحاد / اضطراب هضمي وظيفي (Acute Gastroenteritis / Dyspepsia)',
      nameEn: 'Acute Gastroenteritis / Functional Dyspepsia',
      supportingFactorsAr: [
        'وجود مغص وانزعاج في البطن',
        ...(data.associatedSymptoms.includes('غثيان') ? ['ترافق المغص مع غثيان خفيف'] : []),
      ],
      supportingFactorsEn: [
        'Abdominal cramping and digestive discomfort',
      ],
      missingFactorsAr: [
        'معرفة عادات التبرز بدقة (وجود إسهال مائي أو إمساك)',
        'تحليل براز مخبري واستبعاد التسمم الغذائي الجرثومي',
      ],
      missingFactorsEn: [
        'Stool microscopy/culture to rule out bacterial enteritis',
      ],
      concernLevel: 'MODERATE',
      recommendedEvaluationAr: 'متابعة شرب محاليل الإماهة ومراجعة الطبيب إذا استمر المغص أكثر من 48 ساعة أو ترافق مع حرارة عالية.',
      recommendedEvaluationEn: 'Hydration maintenance and primary care follow-up if symptoms persist over 48 hours.',
      whyAppearedAr: 'ظهر هذا الاحتمال لأن النزلات الهضمية والمغص الحاد هي السبب الأكثر شيوعاً للمغص غير المترافق مع دفاع بطني صلب.',
      whyAppearedEn: 'Gastroenteritis is the most frequent acute cause of non-localized cramping without peritoneal irritation.',
    });

    results.push({
      nameAr: 'تهيج القولون العصبي التشنجي (Irritable Bowel Syndrome Flare)',
      nameEn: 'Irritable Bowel Syndrome (IBS) Exacerbation',
      supportingFactorsAr: [
        'طبيعة الألم التشنجية المتقطعة',
        ...(data.oldcarts.character?.includes('مغص') ? ['وجود مغص تشنجي متقلب'] : []),
      ],
      supportingFactorsEn: [
        'Cramping colicky abdominal pattern',
      ],
      missingFactorsAr: [
        'تأثير التغوط وخروج الغازات على زوال الألم',
        'تاريخ الحالات التشنجية السابقة على مدار الأشهر الماضية',
      ],
      missingFactorsEn: [
        'Relief pattern following defecation/flatus',
      ],
      concernLevel: 'LOW',
      recommendedEvaluationAr: 'استشارة طبيب الأسرة لتعديل النظام الغذائي ومناقشة مضادات التشنج الملائمة.',
      recommendedEvaluationEn: 'Outpatient dietary and antispasmodic review with primary care physician.',
      whyAppearedAr: 'التقلصات المعوية التشنجية المتكررة من سمات متلازمة القولون العصبي الشائعة.',
      whyAppearedEn: 'Intermittent colicky spasm without systemic alarms aligns with typical IBS symptomatology.',
    });

    if (text.includes('حاد') || text.includes('حرارة') || (data.painScale && data.painScale >= 8)) {
      results.push({
        nameAr: 'التهاب حاد داخل البطن يستلزم الاستبعاد (مثل الزائدة الدودية أو المرارة)',
        nameEn: 'Acute Intra-abdominal Pathology (Appendicitis / Cholecystitis rule-out)',
        supportingFactorsAr: [
          'شدة الألم البطني الحادة',
          ...(text.includes('حرارة') || text.includes('حمى') ? ['وجود ارتفاع في درجة الحرارة'] : []),
        ],
        supportingFactorsEn: [
          'Acute high pain intensity',
        ],
        missingFactorsAr: [
          'فحص سريري دقيق للعلامات البريتونية (Rebound tenderness, Murphy sign, McBurney sign)',
          'سونار بطني وحوضي عاجل (Abdominal Ultrasound)',
          'تعداد دم كامل (CBC) ومؤشرات الالتهاب (CRP)',
        ],
        missingFactorsEn: [
          'Clinical peritoneal signs examination',
          'Urgent abdominal ultrasound',
          'Complete blood count (CBC) and inflammatory markers',
        ],
        concernLevel: 'HIGH',
        recommendedEvaluationAr: 'فحص جراحي عاجل في الطوارئ لإجراء سونار وتحاليل دم لاستبعاد الحالات الجراحية البطنية الحادة.',
        recommendedEvaluationEn: 'Urgent emergency surgical evaluation with ultrasound and blood work to rule out acute abdomen.',
        whyAppearedAr: 'الآلام البطنية الشديدة المتصاعدة قد تمثل حالات جراحية حرجة تتطلب تأكيد عدم وجود التهاب بؤري في الأعضاء الداخلية.',
        whyAppearedEn: 'Severe accelerating abdominal pain warrants clinical and imaging rule-out of acute surgical etiologies.',
      });
    }
  }

  // Scenario D: Respiratory / URTI
  else {
    results.push({
      nameAr: 'عدوى فيروسية حادة في الجهاز التنفسي العلوي (Viral Upper Respiratory Tract Infection)',
      nameEn: 'Acute Viral Upper Respiratory Tract Infection (Common Cold / Flu)',
      supportingFactorsAr: [
        'وجود احتقان في الحلق وسعال',
        'طبيعة الأعراض التنفسية والجسدية العامة',
        ...(data.associatedSymptoms.includes('إرهاق وخمول عام') ? ['الشعور بالإرهاق وتكسير الجسم'] : []),
      ],
      supportingFactorsEn: [
        'Upper respiratory tract congestion and cough',
        'Constitutional malaise and fatigue',
      ],
      missingFactorsAr: [
        'معاينة البلعوم واللوزتين بالفحص المباشر لتحري وجود إفرازات قيحية',
        'مراقبة تطور الحرارة ومدتها لأكثر من 5 أيام',
      ],
      missingFactorsEn: [
        'Oropharyngeal examination for tonsillar exudates',
        'Fever curve duration assessment',
      ],
      concernLevel: 'LOW',
      recommendedEvaluationAr: 'رعاية منزلية داعمة مع السوائل الدافئة والمسكنات البسيطة، مع مراجعة الطبيب إذا ظهر ضيق تنفس أو استمرت الحمى لأكثر من 3 أيام.',
      recommendedEvaluationEn: 'Supportive self-care with hydration and antipyretics; clinical follow-up if dyspnea develops or fever lasts >72h.',
      whyAppearedAr: 'العدوى الفيروسية التنفسية هي أكثر التشخيصات السريرية شيوعاً لاحتقان الحلق والسعال المترافق مع حرارة منخفضة.',
      whyAppearedEn: 'Viral upper respiratory tract infection represents the overwhelmingly common etiology for paired cough and sore throat.',
    });

    results.push({
      nameAr: 'التهاب بلعوم أو لوزات جرثومي محتمل (Possible Streptococcal Pharyngitis)',
      nameEn: 'Possible Streptococcal Pharyngitis',
      supportingFactorsAr: [
        'ألم واحتقان البلعوم',
      ],
      supportingFactorsEn: [
        'Pharyngeal irritation and localized soreness',
      ],
      missingFactorsAr: [
        'فحص اللوزتين لوجود تقرحات بيضاء أو تضخم العقد اللمفاوية الرقبية',
        'مسحة بلعوم سريعة (Rapid Strep Test) لتأكيد الحاجة لمضاد حيوي',
      ],
      missingFactorsEn: [
        'Rapid antigen detection test (Strep throat swab)',
        'Centor/McIsaac clinical scoring validation',
      ],
      concernLevel: 'MODERATE',
      recommendedEvaluationAr: 'فحص الحلق لدى طبيب الرعاية الأولية لتحديد ما إذا كانت الحالة تتطلب مسحة أو علاجاً بمضاد حيوي.',
      recommendedEvaluationEn: 'Primary care pharyngeal examination to apply clinical scoring and determine need for throat swab.',
      whyAppearedAr: 'التهاب البلعوم الجرثومي بالبكتيريا العقدية هو السبب الجرثومي الرئيسي الذي يتطلب تشخيصاً مخبرياً دقيقاً لتفادي الإفراط في المضادات الحيوية.',
      whyAppearedEn: 'Streptococcal pharyngitis requires clinical scoring to distinguish bacterial etiology requiring targeted antibiotics from viral illness.',
    });
  }

  return results;
}
