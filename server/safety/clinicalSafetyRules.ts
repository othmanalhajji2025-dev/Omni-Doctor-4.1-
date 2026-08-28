import { SafetyRule, SafetyEvaluationInput } from '../types/safety.js';

// Helper for Arabic and English text normalization
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel and tanween diacritics
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\s\u0621-\u064A]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(normalized: string, keywords: string[]): boolean {
  return keywords.some(kw => normalized.includes(normalizeText(kw)));
}

function hasAll(normalized: string, keywordGroups: string[][]): boolean {
  return keywordGroups.every(group => hasAny(normalized, group));
}

function hasCoOccurrence(normalized: string, groupA: string[], groupB: string[]): boolean {
  return hasAny(normalized, groupA) && hasAny(normalized, groupB);
}

export const CLINICAL_SAFETY_RULES: SafetyRule[] = [
  // ==========================================
  // 1. EMERGENCY RULES (Highest Clinical Hazard)
  // ==========================================
  {
    ruleId: 'RULE-EMERG-CARDIO-01',
    nameAr: 'ألم بالصدر مصحوب بضيق تنفس حاد',
    nameEn: 'Chest Pain with Acute Severe Dyspnea',
    category: 'CARDIOVASCULAR',
    trigger: 'ألم في الصدر مع صعوبة حادة أو ضيق في التنفس',
    conditions: {
      descriptionAr: 'وجود ألم صدري أو ثقل مترافق مع ضيق تنفس حاد أو اختناق',
      descriptionEn: 'Presence of chest pain/pressure combined with acute shortness of breath or dyspnea',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const chestPain = hasAny(text, [
          'الم بالصدر', 'الم في الصدر', 'وجع بالصدر', 'ضغط بالصدر', 'ثقل بالصدر',
          'نغزة بالصدر', 'ذبحة', 'نوبة قلبية', 'chest pain', 'chest pressure', 'chest tightness'
        ]) || hasCoOccurrence(text, ['صدر', 'صدري', 'بالصدر', 'في الصدر', 'chest'], ['الم', 'وجع', 'ضغط', 'ثقل', 'نغز', 'ذبحة', 'pain', 'pressure', 'tightness', 'crushing', 'heaviness', 'ache']);

        const dyspnea = hasAny(text, [
          'ضيق تنفس', 'صعوبة تنفس', 'اختناق', 'كتمة', 'نفسي مكتوم', 'عاجز عن التنفس',
          'لهاث', 'التقاط نفسي', 'shortness of breath', 'dyspnea', 'cannot breathe', 'gasping'
        ]) || hasCoOccurrence(text, ['ضيق', 'صعوبة', 'عجز', 'كتمة', 'التقاط'], ['تنفس', 'نفس', 'نفسي', 'breath', 'breathing']);

        return chestPain && dyspnea;
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'ألم الصدر المتزامن مع ضيق التنفس الحاد يمثل مؤشراً عالي الخطورة لاحتمال متلازمة تاجية حادة (نقص تروية عضلة القلب) أو انصمام رئوي حاد أو استرواح صدري، وهي حالات مهددة للحياة تستوجب النفي الفوري في الطوارئ.',
      en: 'Acute chest pain co-occurring with dyspnea is a cardinal presentation for Acute Coronary Syndrome (ACS), Pulmonary Embolism (PE), or tension pneumothorax, demanding immediate hospital-based rule out.',
      clinicalRationaleAr: 'التوافق بين الأعراض القلبية والتنفسية يرفع احتمالية نقص التروية الحاد واضطراب الدورة الدموية الرئوية.',
      clinicalRationaleEn: 'Cardiopulmonary symptom coupling substantially increases pre-test probability of life-threatening ischemic or thromboembolic pathology.',
    },
    action: {
      ar: 'اتصل فوراً بالإسعاف (997 أو 911) ولا تقد السيارة بنفسك. اجلس نصف مستلقٍ حتى وصول المسعفين.',
      en: 'Call emergency medical dispatch (997/911) immediately. Do not drive yourself. Maintain a semi-recumbent posture.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'التوقف فوراً عن أي جهد بدني أو حركة والاستلقاء بوضعية نصف جالسة مريحة.',
        'فك أي أزرار أو ملابس أو أحزمة ضيقة حول العنق والصدر لتسهيل التنفس.',
        'إبقاء باب المنزل غير مغلق بمزلاج لتسهيل دخول المسعفين بسرعة.',
        'التنفس ببطء وعمق وتجنب الذعر أو الانفعال.',
        'الامتناع التام عن تناول أي طعام أو شراب أو أدوية غير موصوفة لك من قبل طبيبك المعالج.',
      ],
      safeWaitingStepsEn: [
        'Immediately cease physical activity and rest in a comfortable semi-upright seated position.',
        'Loosen restrictive clothing around the neck and chest to facilitate airflow.',
        'Ensure the front entrance is unlocked so paramedics can enter swiftly.',
        'Maintain slow, calm breathing and avoid panic or sudden exertion.',
        'Do not ingest food, drinks, or unprescribed medications while awaiting assistance.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-CARDIO-02',
    nameAr: 'ألم صدري ضاغط مع تعرق بارد أو انتشار للذراع/الفك',
    nameEn: 'Crushing Retrosternal Chest Pressure with Radiation or Diaphoresis',
    category: 'CARDIOVASCULAR',
    trigger: 'ألم ضاغط كالصخر في منتصف الصدر يمتد لليد اليسرى أو الفك مع تعرق بارد',
    conditions: {
      descriptionAr: 'ألم صدري ضاغط مع انتشار للذراع اليسرى أو الفك السفلي أو تعرق بارد غزير',
      descriptionEn: 'Crushing substernal pressure radiating to left arm, neck, or jaw, or with profuse cold sweats',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const chest = hasAny(text, [
          'الم بالصدر', 'الم في الصدر', 'ثقل بصدري', 'ضغط بصدري', 'صخرة على صدري',
          'chest pain', 'chest pressure', 'crushing chest'
        ]);
        const radiationOrSweat = hasAny(text, [
          'يمتد ليدي اليسرى', 'ممتد للذراع', 'ممتد للفك', 'الم بالفك', 'الم بالكتف الايسر',
          'عرق بارد', 'تعرق غزير', 'غثيان مع الم الصدر', 'radiating to arm', 'radiating to jaw',
          'left arm', 'cold sweat', 'diaphoresis'
        ]);
        return chest && radiationOrSweat;
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'ألم الصدر الإقفاري المنتشر إلى الذراع أو الفك والمترافق مع التعرق البارد يمثل العلامة النموذجية لنوبة قلبية حادة (احتشاء عضلة القلب). كل دقيقة تأخير قد تزيد من تلف الخلايا القلبية.',
      en: 'Ischemic chest discomfort radiating to left arm or jaw with diaphoresis is the hallmark presentation of acute myocardial infarction (AMI). Time is myocardium.',
      clinicalRationaleAr: 'التوزيع العصبي للألم القلبي الإنعكاسي (Dermatomal referral) مع تحفيز الجهاز العصبي الودي.',
      clinicalRationaleEn: 'Classic dermatomal autonomic projection of cardiac ischemia.',
    },
    action: {
      ar: 'حالة طوارئ قلبية وشيكة: اطلب الإسعاف (997) فوراً واجلس دون حركة.',
      en: 'Acute cardiac emergency: Call 997/911 immediately and remain completely still.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'الجلوس فوراً في وضعية نصف جالسة (زاوية 45 درجة) لتخفيف العبء عن القلب.',
        'إرخاء الملابس الضيقة وتوفير تهوية جيدة في المكان.',
        'إبلاغ من حولك أو فتح الباب الخارجي فوراً لفريق الإسعاف.',
        'تجنب بذل أي مجهود إضافي كصعود الدرج أو المشي.',
      ],
      safeWaitingStepsEn: [
        'Sit immediately in a semi-upright (45-degree) angle to reduce cardiac preload.',
        'Loosen constrictive clothing and ensure good fresh airflow.',
        'Alert nearby bystanders or unlock the front door for incoming paramedics.',
        'Avoid any further exertion such as walking or stair climbing.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-NEURO-FAST',
    nameAr: 'علامات سكتة دماغية حادة (بروتوكول FAST: اعوجاج الوجه، ضعف الذراع، ثقل اللسان)',
    nameEn: 'Acute Stroke Signs (FAST: Facial droop, Arm weakness, Slurred speech)',
    category: 'NEUROLOGICAL',
    trigger: 'ارتخاء مفاجئ في جانب من الوجه، عجز عن رفع الذراع، أو تلعثم مفاجئ في النطق',
    conditions: {
      descriptionAr: 'وجود أي من مؤشرات السكتة الدماغية (بروتوكول FAST)',
      descriptionEn: 'Presence of sudden focal neurological deficits (FAST protocol)',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const direct = hasAny(text, [
          'سكتة دماغية', 'جلطة دماغية', 'شلل نصفي', 'اعوجاج بالوجه', 'ارتخاء في الوجه',
          'ثقل باللسان', 'ثقل في الكلام', 'تلعثم مفاجئ', 'ضعف مفاجئ في اليد', 'ضعف مفاجئ في الرجل',
          'تنميل نصفي مفاجئ', 'عجزت عن الكلام', 'عجزت عن تحريك يدي',
          'stroke', 'face drooping', 'arm weakness', 'slurred speech', 'hemiparesis', 'facial droop'
        ]);
        const face = hasCoOccurrence(text, ['اعوجاج', 'ارتخاء', 'ميلان', 'عوج', 'شلل', 'droop', 'drooping', 'crooked'], ['وجه', 'الوجه', 'فم', 'الفم', 'شفايف', 'face', 'facial']);
        const speech = hasCoOccurrence(text, ['ثقل', 'تلعثم', 'صعوبة', 'عجز', 'عدم وضوح', 'slurred', 'speech', 'tongue'], ['لسان', 'اللسان', 'كلام', 'الكلام', 'نطق', 'النطق']);
        const arm = hasCoOccurrence(text, ['ضعف', 'شلل', 'سقوط', 'عجز', 'خدر', 'تنميل', 'weakness', 'paralysis'], ['يد', 'يده', 'يدي', 'ذراع', 'ذراعه', 'رجل', 'رجله', 'طرف', 'جانب', 'arm', 'hand', 'leg']);
        return direct || face || speech || arm;
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'الأعراض العصبية البؤرية المفاجئة كشلل الوجه أو ضعف الأطراف أو صعوبة النطق هي إنذار حرج لسكتة دماغية حادة (نقص تروية أو نزيف). النافذة العلاجية لمذيبات الخثرة (tPA) قصيرة جداً (أقل من 4.5 ساعات).',
      en: 'Sudden focal neurological deficits indicate an acute cerebrovascular accident (ischemic stroke or intracranial hemorrhage). The therapeutic window for thrombolysis is critically time-sensitive (< 4.5 hours).',
      clinicalRationaleAr: 'نقص التروية الدماغي الحاد يتطلب إعادة فتح الوعاء المسدود بشكل فوري لإنقاذ النسيج القشري (Penumbra).',
      clinicalRationaleEn: 'Acute cerebral ischemia mandates urgent reperfusion to salvage ischemic penumbra.',
    },
    action: {
      ar: 'طوارئ عصبية قصوى (رمز السكتة الدماغية): توجه فوراً لأقرب مركز سكتات دماغية أو اطلب 997 مع ذكر وقت بداية الأعراض بالدقيقة.',
      en: 'Code Stroke emergency: Call 997/911 immediately. Note exact time of symptom onset.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'تسجيل التوقيت الدقيق الذي بدأت فيه الأعراض؛ فهذا العامل الأهم لاختيار العلاج.',
        'إبقاء المريض مستلقياً على جنبه (وضعية الإفاقة) إذا كان هناك غثيان لتفادي الاختناق.',
        'الامتناع التام عن إعطاء المريض أي ماء أو طعام أو أسبرين قبل تقييم الأشعة المقطعية.',
        'عدم ترك المريض بمفرده ومراقبة وعيه وتنفسه باستمرار.',
      ],
      safeWaitingStepsEn: [
        'Record the exact time symptoms were first observed; this dictates thrombolytic eligibility.',
        'Position the patient on their side (recovery position) if nausea occurs to safeguard airway.',
        'Do NOT give the patient food, water, or aspirin until hospital CT confirms absence of bleed.',
        'Stay beside the patient continuously, observing alertness and respiration.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-NEURO-THUNDER',
    nameAr: 'صداع رعدي صاعق ومفاجئ (أشد صداع في العمر)',
    nameEn: 'Thunderclap Headache (Worst Headache of Life)',
    category: 'NEUROLOGICAL',
    trigger: 'صداع انفجاري هائل بدأ بأقصى شدة خلال ثوانٍ أو دقائق معدودة',
    conditions: {
      descriptionAr: 'صداع فجائي عنيف بلغ ذروته خلال ثوانٍ أو دقيقة واحدة غير مسبوق',
      descriptionEn: 'Severe explosive headache reaching peak intensity within seconds or 1 minute',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, [
          'صداع رعدي', 'اشد صداع في حياتي', 'صداع انفجاري', 'انفجار في راسي',
          'صداع مفاجئ عنيف جدا', 'thunderclap headache', 'worst headache of my life',
          'explosive sudden headache'
        ]);
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'الصداع الرعدي المفاجئ الذي يبلغ ذروته في ثوانٍ يثير اشتباهاً قوياً بنزيف تحت العنكبوتية (Subarachnoid Hemorrhage) نتيجة تمزق أم دم شريانية (Aneurysm)، ويتطلب تصويراً مقطعياً عاجلاً للدماغ.',
      en: 'Thunderclap onset reaching maximal severity within moments strongly suggests subarachnoid hemorrhage (SAH) from ruptured intracranial aneurysm, requiring emergency non-contrast head CT.',
      clinicalRationaleAr: 'التهيج السحائي الحاد والنزيف الوعائي تحت العنكبوتية يسببان ألما صاعقاً مهدداً للحياة.',
      clinicalRationaleEn: 'Acute meningeal irritation and arterial extravasation produce instantaneous catastrophic cephalalgia.',
    },
    action: {
      ar: 'توجه فوراً لقسم الطوارئ لإجراء تصوير طبقي عاجل للدماغ. لا تقم بالقيادة بنفسك.',
      en: 'Proceed immediately to emergency room for urgent head CT. Do not drive yourself.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'الاستلقاء في غرفة مظلمة وهادئة لتجنب تفاقم الصداع.',
        'تجنب تناول أي مميعات أو مسكنات قبل الخضوع للفحص المقطعي.',
        'طلب مرافقة شخص أو الاتصال بالإسعاف (997) لنقلك.',
      ],
      safeWaitingStepsEn: [
        'Lie down in a dark, quiet environment to minimize sensory stimulation.',
        'Avoid blood thinners or strong analgesics prior to neuroimaging evaluation.',
        'Have a companion accompany you or call 997/911 for transport.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-RESP-STRIDOR',
    nameAr: 'اختناق حاد أو صرير تنفسي أو زرقة في الشفاه والوجه',
    nameEn: 'Acute Asphyxia, Stridor, or Cyanosis',
    category: 'RESPIRATORY',
    trigger: 'عدم القدرة على التقاط النفس، صوت صرير شهيقي، أو تغير لون الشفتين للأزرق',
    conditions: {
      descriptionAr: 'وجود علامات انسداد مجرى الهواء أو زرقة أو اختناق حاد',
      descriptionEn: 'Severe airway compromise, inspiratory stridor, or central cyanosis',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, [
          'اختناق', 'زرقة في الشفاه', 'زرقة الشفتين', 'صرير في الحلق', 'لا استطيع التنفس نهائيا',
          'شفتي زرقاء', 'انسداد الحلق', 'choking', 'stridor', 'cyanosis', 'blue lips', 'cannot inhale'
        ]);
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'الصرير الشهيقي أو الزرقة يشير إلى انسداد وشيك في مجرى الهواء العلوي أو نقص أكسجة دماغي حرج يهدد بتوقف التنفس خلال دقائق.',
      en: 'Inspiratory stridor and central cyanosis reflect critical upper airway obstruction or profound arterial hypoxemia, threatening immediate respiratory arrest.',
      clinicalRationaleAr: 'فشل تبادل الغازات وانسداد مجرى الهواء التنفسي العلوي.',
      clinicalRationaleEn: 'Impending upper airway closure and severe hypoxemic respiratory failure.',
    },
    action: {
      ar: 'اتصل فوراً بالإسعاف (997) ولا تحاول إدخال أي أداة في الحلق.',
      en: 'Call 997/911 immediately. Do not introduce foreign objects into the throat.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'الجلوس منتصباً تماماً مع إمالة الرأس قليلاً للأمام لفتح مجرى الهواء.',
        'الحفاظ على الهدوء التام؛ حيث يؤدي الهلع لزيادة تشنج مجرى الهواء.',
        'تأمين وصول الأكسجين الخارجي إذا كان متاحاً في المنزل.',
      ],
      safeWaitingStepsEn: [
        'Sit completely upright with head tilted slightly forward to maximize airway patency.',
        'Stay as calm as possible; agitation worsens airway spasms and oxygen consumption.',
        'Administer supplemental oxygen if already prescribed and available at home.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-ANAPHYLAXIS',
    nameAr: 'صدمة حساسية مفرطة حادة (تورم اللسان/الحلق مع صعوبة تنفس)',
    nameEn: 'Acute Systemic Anaphylaxis (Angioedema & Airway Involvement)',
    category: 'ANAPHYLAXIS',
    trigger: 'تورم مفاجئ في الشفاه أو اللسان أو الحلق بعد تناول طعام أو دواء أو لسعة حشرة',
    conditions: {
      descriptionAr: 'رد فعل تحسسي فوري مصحوب بانتفاخ مجرى الهواء أو هبوط ضغط',
      descriptionEn: 'Immediate allergic reaction involving mucosal swelling or respiratory difficulty',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const swelling = hasAny(text, [
          'تورم اللسان', 'انتفاخ الحلق', 'تورم الشفتين', 'انتفاخ بالوجه', 'صعوبة بلع مفاجئة',
          'tongue swelling', 'throat swelling', 'angioedema', 'lip swelling'
        ]);
        const triggerOrBreathing = hasAny(text, [
          'حساسية', 'بعد اكل', 'بعد دواء', 'لسعة', 'ضيق تنفس', 'صفير بالصدر',
          'anaphylaxis', 'allergic reaction', 'post medication', 'insect sting'
        ]);
        return swelling && triggerOrBreathing;
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'التورم التحسسي السريع في الأنسجة المخاطية للحلق واللسان يمثل صدمة حساسية مفرطة (Anaphylaxis) يمكن أن تغلق مجرى الهواء وتسبب هبوطاً حاداً في الدورة الدموية.',
      en: 'Rapid angioedema of the tongue/pharynx represents systemic anaphylaxis capable of total airway occlusion and vascular collapse within minutes.',
      clinicalRationaleAr: 'تحرر جهازي هائل للهيستامين والوسطاء الالتهابية مسبباً توسعاً وعائياً ووذمة حنجرية.',
      clinicalRationaleEn: 'Systemic IgE-mediated mast cell degranulation triggering laryngeal edema and distributive shock.',
    },
    action: {
      ar: 'استخدم قلم الإبينفرين (EpiPen) فوراً في الفخذ الخارجي إن كان متوفراً واطلب الإسعاف 997.',
      en: 'Administer Epinephrine auto-injector (EpiPen) immediately into outer thigh if prescribed/available, and dial 997.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'استخدام قلم الإبينفرين (EpiPen) فوراً في العضلة الخارجية للفخذ في حال تم وصفه للمريض سابقاً.',
        'الاستلقاء مع رفع الساقين للأعلى لدعم ضغط الدم، ما لم تكن هناك صعوبة شديدة في التنفس فيفضل الجلوس.',
        'تجنب الوقوف أو المشي المفاجئ لتفادي الهبوط الوعائي.',
      ],
      safeWaitingStepsEn: [
        'Use the prescribed Epinephrine autoinjector into the anterolateral thigh without hesitation.',
        'Lie flat with legs elevated to sustain blood pressure, unless dyspnea necessitates sitting.',
        'Do not stand or walk abruptly to prevent sudden hemodynamic collapse.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-SURG-ABDOMEN',
    nameAr: 'بطن جراحي حاد متصلب أو قيء دموي غزير',
    nameEn: 'Acute Surgical Abdomen / Massive Hematemesis',
    category: 'ACUTE_ABDOMEN',
    trigger: 'ألم بطني شديد جداً مع تحجر جدار البطن كلوح خشب أو استفراغ دم',
    conditions: {
      descriptionAr: 'صلابة لا إرادية بجدار البطن أو قيء دموي أو براز أسود قطراني مع دوخة',
      descriptionEn: 'Involuntary abdominal rigidity, hematemesis, or melena with hypotension/dizziness',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, [
          'بطن متصلب', 'تحجر بالبطن', 'استفراغ دم', 'قيء دم', 'تقيؤ دم', 'ترجيع دم',
          'براز اسود قطراني', 'نزيف هضمي حاد', 'انفجار الزائدة',
          'rigid abdomen', 'vomiting blood', 'hematemesis', 'melena', 'board-like abdomen'
        ]);
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'تحجر جدار البطن يدل على تهيج صفاقي حاد (التهاب بريتوني جراحي نتيجة انثقاب عضو مجوف) كما أن القيء الدموي يشير لنزيف هضمي علوي حاد يهدد بصدمة نقص الحجم.',
      en: 'Abdominal rigidity reflects peritonitis (viscus perforation), while active hematemesis indicates upper gastrointestinal hemorrhage threatening hypovolemic shock.',
      clinicalRationaleAr: 'تهيج صفاقي وتآكل بطاني ونزيف حاد يستلزم تدخلاً جراحياً أو تنظيرياً عاجلاً.',
      clinicalRationaleEn: 'Peritoneal irritation or active intravascular volume loss requiring emergency surgical/endoscopic intervention.',
    },
    action: {
      ar: 'حالة جراحية طارئة: توجه فوراً لأقرب قسم طوارئ. امتنع تماماً عن الأكل والشرب والمسكنات.',
      en: 'Surgical emergency: Proceed to ER immediately. Strict NPO (nothing by mouth).',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'الامتناع التام عن تناول أي طعام أو شراب أو حتى رشفة ماء تحسباً لعملية جراحية عاجلة (NPO).',
        'الاستلقاء مع ثني الركبتين نحو البطن لتخفيف الشد على عضلات الجدار البطني.',
        'تجنب تناول أي مسكنات قوية قد تخفي علامات الفحص السريري للطبيب الجراح.',
      ],
      safeWaitingStepsEn: [
        'Strictly nothing by mouth (no water, no food) in anticipation of emergency anesthesia/surgery.',
        'Lie down with knees bent toward abdomen to relieve abdominal wall tension.',
        'Do not take strong analgesics that may mask physical peritoneal signs upon surgical exam.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-SEPSIS',
    nameAr: 'إنذار إنتان حاد (حمى مع تشوش ذهني أو هبوط حاد أو طفح قرمزي)',
    nameEn: 'Sepsis Red Alert (Fever with Confusion, Severe Hypotension or Purpura)',
    category: 'SEPSIS_INFECTION',
    trigger: 'حمى عالية مع هذيان أو فقدان تركيز أو طفح جلدي قرمزي لا يختفي بالضغط',
    conditions: {
      descriptionAr: 'حمى مترافقة مع علامات فشل جهازي أو طفح سحائي أو هذيان',
      descriptionEn: 'Fever co-occurring with altered mental status, septic shock signs, or non-blanching petechial rash',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const fever = hasAny(text, ['حرارة عالية', 'سخونة', 'حمى', 'fever', 'high temperature']);
        const severeSigns = hasAny(text, [
          'تشوش ذهني', 'هذيان', 'لا يعي ما حوله', 'طفح قرمزي', 'بقع حمراء لا تزول بالضغط',
          'التهاب السحايا', 'تيبس الرقبة', 'غيبوبة', 'confusion', 'delirium', 'petechiae', 'purpura', 'stiff neck'
        ]);
        return (fever && severeSigns) || hasAny(text, ['تسمم دم', 'انتان دموي', 'صدمة انتانية', 'sepsis', 'septic shock']);
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'الحمى مع التشوش الذهني أو الطفح القرمزي غير التبييضي هي علامات خطر للإنتان الجهازي الحاد (Sepsis) أو التهاب السحايا الجرثومي (Bacterial Meningitis)، ويتطلب تدخلاً بالمضادات الحيوية الوريدية خلال الساعة الذهبية الأولى.',
      en: 'Fever with altered mentation or non-blanching purpura signals systemic sepsis or bacterial meningitis, mandating IV resuscitation and antibiotics within the golden hour.',
      clinicalRationaleAr: 'استجابة مناعية جهازية مفرطة تؤدي لاضطراب تروية الأعضاء الحيوية وفشل متعدد في الأجهزة.',
      clinicalRationaleEn: 'Systemic dysregulated host response to infection with end-organ hypoperfusion.',
    },
    action: {
      ar: 'اتصل بالإسعاف (997) فوراً. هذه الحالة تتطلب مضادات حيوية وريدية عاجلة في المستشفى.',
      en: 'Call 997/911 immediately. Urgent intravenous antibiotics and fluid resuscitation required.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'إبقاء المريض في مكان جيد التهوية ومراقبة مجرى الهواء.',
        'وضع كمادات ماء فاتر عادية على الجبين لتلطيف الحرارة دون استخدام ماء مثلج.',
        'عدم ترك المريض دون مراقبة بسبب احتمالية تراجع مستوى الوعي.',
      ],
      safeWaitingStepsEn: [
        'Keep the patient in a well-ventilated area and maintain open airway.',
        'Apply lukewarm (not freezing) compresses to forehead for comfort.',
        'Keep the patient under continuous visual observation due to risk of obtundation.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-VITALS-CRITICAL',
    nameAr: 'علامات حيوية حرجة مهددة للحياة',
    nameEn: 'Critical Derangement of Vital Signs',
    category: 'CARDIOVASCULAR',
    trigger: 'أكسجين منخفض حرج (<90%)، أو ضغط دم نوبة فرط ضغط (>=180/120)، أو نبض شديد الشذوذ',
    conditions: {
      descriptionAr: 'مستويات خارج النطاق الآمن حيوياً (SpO2 < 90% أو SBP >= 180 أو HR > 135 / < 40)',
      descriptionEn: 'Vital signs in physiological crisis zone (SpO2 < 90%, SBP >= 180, HR > 135 or < 40)',
      matches: (input: SafetyEvaluationInput) => {
        if (!input.vitalSigns) return false;
        const { spO2, systolicBP, diastolicBP, heartRate } = input.vitalSigns;
        if (spO2 !== undefined && spO2 < 90) return true;
        if (systolicBP !== undefined && systolicBP >= 180) return true;
        if (diastolicBP !== undefined && diastolicBP >= 120) return true;
        if (heartRate !== undefined && (heartRate > 135 || heartRate < 40)) return true;
        return false;
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'القياسات الحيوية المدخلة تقع في نطاق حرج (نقص أكسجة شرياني حاد أو نوبة فرط ضغط دم أو اضطراب نبض خطير)، مما يعرض الأعضاء النبيلة كالدماغ والقلب والكلية لخطر مباشر.',
      en: 'Documented vital signs indicate an acute hemodynamic/respiratory crisis (profound hypoxemia, hypertensive crisis, or malignant arrhythmia) endangering target organ perfusion.',
      clinicalRationaleAr: 'فشل الآليات الفسيولوجية التعويضية مما يستوجب مراقبة مستمرة وتدخلاً تخصصياً فورياً.',
      clinicalRationaleEn: 'Decompensated physiological equilibrium requiring continuous telemetry and immediate intervention.',
    },
    action: {
      ar: 'توجه لأقرب طوارئ مستشفى أو اطلب الإسعاف (997) فوراً لإعادة ضبط العلامات الحيوية.',
      en: 'Proceed to nearest ER or call 997/911 immediately for vital sign stabilization.',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'الجلوس بهدوء تام دون أي حركة مفاجئة وتجنب شرب القهوة أو الشاي أو التدخين.',
        'إعادة أخذ القياس بهدوء بعد 5 دقائق للتأكد من دقة القراءة أثناء انتظار النقل الطبي.',
        'إحضار أجهزة القياس أو تدوين الأرقام لعرضها على الطبيب في الطوارئ.',
      ],
      safeWaitingStepsEn: [
        'Sit completely still, avoiding sudden moves, caffeine, or nicotine.',
        'Re-check measurement calmly after 5 minutes of quiet rest while awaiting transport.',
        'Record the exact values to present to emergency triage staff.',
      ],
    },
  },

  {
    ruleId: 'RULE-EMERG-PSYCH-CRISIS',
    nameAr: 'أزمة نفسية وشيكة أو نية إيذاء النفس',
    nameEn: 'Acute Psychiatric Emergency / Imminent Self-Harm Intent',
    category: 'PSYCHIATRIC',
    trigger: 'أفكار انتحارية وشيكة، رغبة في إنهاء الحياة، أو إيذاء النفس',
    conditions: {
      descriptionAr: 'تعبير صريح عن نية الانتحار أو إيذاء النفس',
      descriptionEn: 'Explicit verbalization of imminent suicide or self-harm intention',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, [
          'انتحار', 'اريد الانتحار', 'انهاء حياتي', 'ايذاء نفسي', 'اريد الموت', 'قتل نفسي',
          'suicide', 'suicidal', 'kill myself', 'end my life', 'self-harm'
        ]);
      },
    },
    riskLevel: 'EMERGENCY',
    explanation: {
      ar: 'أفكار إيذاء النفس تمثل حالة طوارئ نفسية عاجلة تتطلب تدخلاً متخصصاً فورياً لحماية الحياة وتقديم الدعم الآمن.',
      en: 'Expressed intent of self-harm constitutes an acute psychiatric crisis mandating crisis intervention to preserve life and safety.',
      clinicalRationaleAr: 'أزمة نفسية حادة تهدد السلامة الجسدية المباشرة.',
      clinicalRationaleEn: 'Acute psychiatric decompensation posing immediate danger to personal safety.',
    },
    action: {
      ar: 'اتصل فوراً بخط الدعم النفسي الطارئ (في السعودية: 937 أو مركز إرادة 1955) أو اتصل بـ 997.',
      en: 'Contact the crisis lifeline immediately (Saudi Arabia: 937 or Erada 1955) or emergency dispatch (997/911).',
      emergencyCallRequired: true,
      safeWaitingStepsAr: [
        'البقاء بصحبة شخص موثوق من أفراد الأسرة أو الأصدقاء وعدم البقاء بمفردك.',
        'التحدث مع أخصائي خط المساندة النفسية المتوفر على مدار الساعة مجاناً.',
        'التوجه إلى أقرب طوارئ مستشفى للحصول على رعاية نفسية داعمة وآمنة.',
      ],
      safeWaitingStepsEn: [
        'Remain in the company of a trusted family member or friend; do not stay alone.',
        'Speak with a certified crisis counselor on the 24/7 dedicated support lines.',
        'Proceed directly to the nearest hospital emergency department for supportive care.',
      ],
    },
  },

  // ==========================================
  // 2. URGENT RULES (Medical Evaluation 12-24h)
  // ==========================================
  {
    ruleId: 'RULE-URGENT-PAIN-SEVERE',
    nameAr: 'ألم حاد شديد جداً يعيق الحركة (8 إلى 10 على مقياس الألم)',
    nameEn: 'Severe Incapacitating Pain (Pain Score 8-10 / 10)',
    category: 'GENERAL',
    trigger: 'ألم شديد جداً لا يطاق مصنف بدرجة 8 أو 9 أو 10 دون علامات صدمة وعائية',
    conditions: {
      descriptionAr: 'مقياس الألم الموثق >= 8 أو وصف الألم بأنه شديد جداً لا يطاق',
      descriptionEn: 'Reported numeric pain scale >= 8 or text describing unbearable severe agony',
      matches: (input: SafetyEvaluationInput) => {
        if (input.painScale !== undefined && input.painScale >= 8) return true;
        if (input.severity === 'SEVERE' || input.severity === 'CRITICAL') return true;
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, ['الم لا يطاق', 'الم شديد جدا', 'الم 8 من 10', 'الم 9 من 10', 'الم 10 من 10', 'عاجز عن الحركة من الالم']);
      },
    },
    riskLevel: 'URGENT',
    explanation: {
      ar: 'شدة الألم البالغة (8-10) تتجاوز الحدود الآمنة للتدبير المنزلي، وتشير إلى وجود سبب نسيجي حاد يتطلب تقييماً سريرياً سريعاً في عيادة الرعاية العاجلة أو الطوارئ للحصول على التشخيص وتسكين الألم الملائم.',
      en: 'Severe pain intensity (8-10/10) exceeds safe home-care boundaries, signaling an acute tissue pathology that requires urgent clinical evaluation and targeted analgesia.',
      clinicalRationaleAr: 'الألم الشديد غير المحتمل يسبب استثارة عصبية واستجابة التهابية حادة.',
      clinicalRationaleEn: 'Intense nociceptive signaling requiring urgent diagnostic appraisal and physician-supervised analgesia.',
    },
    action: {
      ar: 'ينصح بالتوجه لمركز الرعاية العاجلة أو الطوارئ لتقييم السبب وتلقي التسكين المناسب.',
      en: 'Evaluation at an urgent care center or ER is recommended for diagnosis and pain relief.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'الاستراحة التامة في وضعية مريحة وتجنب بذل أي مجهود إضافي.',
        'عدم تناول جرعات مفرطة أو متكررة من المسكنات دون استشارة طبية.',
        'تدوين وقت بدء الألم وتطوره لإبلاغ الطبيب المعالج بدقة.',
      ],
      safeWaitingStepsEn: [
        'Rest quietly in a position of maximum comfort, avoiding physical strain.',
        'Do not take excessive or repetitive analgesic doses without medical clearance.',
        'Note the exact timeline of pain onset and triggers to brief the assessing physician.',
      ],
    },
  },

  {
    ruleId: 'RULE-URGENT-RENAL-COLIC',
    nameAr: 'مغص كلوي حاد في الخاصرة مع دم في البول',
    nameEn: 'Acute Renal Colic / Severe Flank Pain with Hematuria',
    category: 'ACUTE_ABDOMEN',
    trigger: 'ألم تشنجي حاد بالخاصرة يمتد للمغبن مع تغير لون البول للوردي أو الأحمر',
    conditions: {
      descriptionAr: 'ألم الخاصرة الحاد مع اشتباه حصوة كلوية أو بول دموي',
      descriptionEn: 'Acute flank agony suggestive of obstructive nephrolithiasis or hematuria',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const flank = hasAny(text, [
          'مغص كلوي', 'الم في الخاصرة', 'الم بالخاصرة', 'خاصرة', 'خاصرتي',
          'الم الكلى', 'الم في الجنب', 'الم بالجنب', 'renal colic', 'flank pain', 'kidney pain'
        ]) || hasCoOccurrence(text, ['خاصرة', 'كلى', 'كلوية', 'جنب'], ['مغص', 'الم', 'وجع']);

        const hematuriaOrSevere = hasAny(text, [
          'دم بالبول', 'دم في البول', 'دموي', 'بول دموي', 'بول وردي', 'حصوة', 'حصوات',
          'الم حاد جدا', 'الم حاد', 'الم شديد', 'hematuria', 'blood in urine', 'stone', 'calculus'
        ]);
        return flank && hematuriaOrSevere;
      },
    },
    riskLevel: 'URGENT',
    explanation: {
      ar: 'المغص الكلوي الحاد يشير لانسداد حالبي محتمل بحصوة بولية قد يسبب احتباساً بولياً أو ضغطاً على نسيج الكلية، مما يستوجب فحصاً تصويرياً (سونار أو مقطعي) وتدبيراً دوائياً عاجلاً.',
      en: 'Acute flank colic points to ureteral obstruction (calculus) posing risks of hydronephrosis and renal parenchymal backpressure, warranting prompt imaging and therapeutic relief.',
      clinicalRationaleAr: 'انسداد مجرى البول العلوي وتقلصات العضلات الملساء الحالبية الحادة.',
      clinicalRationaleEn: 'Upper urinary tract smooth muscle spasm secondary to intraluminal calculus obstruction.',
    },
    action: {
      ar: 'راجع مركز الرعاية العاجلة أو طوارئ المسالك البولية خلال ساعات لإجراء سونار وتسكين متخصص.',
      en: 'Visit an urgent care center or urology urgent clinic for ultrasound and targeted relief.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'شرب كميات معتدلة من الماء وعدم الإفراط في الشرب أثناء نوبة الألم الشديدة لتفادي زيادة الضغط الكلوي.',
        'تطبيق كمادة دافئة على الخاصرة للمساعدة في تخفيف التقلصات العضلية.',
        'الاحتفاظ بأي عينة بولية في حال خروج حصوة صغيرة لعرضها على الطبيب لتحليلها مخبرياً.',
      ],
      safeWaitingStepsEn: [
        'Maintain moderate hydration; avoid forcing large fluid volumes during acute paroxysms.',
        'Apply a warm heating pad to the flank area to soothe muscular guarding.',
        'Strain urine if possible to capture any passed calculus for laboratory crystallographic analysis.',
      ],
    },
  },

  {
    ruleId: 'RULE-URGENT-PNEUMO-FEVER',
    nameAr: 'سعال منتج مع حمى مستمرة وألم جنبي عند التنفس (اشتباه التهاب رئوي)',
    nameEn: 'Productive Cough with High Fever & Pleuritic Pain (Suspected Pneumonia)',
    category: 'RESPIRATORY',
    trigger: 'سعال مصحوب ببلغم كثيف مع حمى عالية وألم يزداد عند أخذ نفس عميق',
    conditions: {
      descriptionAr: 'سعال مترافق مع حمى وألم صدري جنبي',
      descriptionEn: 'Cough coupled with sustained fever and pleuritic chest discomfort',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const cough = hasAny(text, ['سعال', 'كحة', 'بلغم', 'cough', 'phlegm', 'sputum']);
        const fever = hasAny(text, ['حرارة', 'حمى', 'سخونة', 'fever']);
        const pleuritic = hasAny(text, ['الم مع النفس', 'الم عند الشهيق', 'الم جنبي', 'pleuritic', 'pain on deep breath']);
        return cough && fever && pleuritic;
      },
    },
    riskLevel: 'URGENT',
    explanation: {
      ar: 'الألم الصدري الذي يزداد عند التنفس العميق مع السعال والحمى يثير اشتباه التهاب الرئة (Pneumonia) أو التهاب غشاء الجنب، مما يستدعي إجراء أشعة سينية للصدر (Chest X-Ray) وتقييماً سريرياً.',
      en: 'Pleuritic chest discomfort exacerbated by inspiration along with fever and productive cough suggests lower respiratory tract consolidation (pneumonia) requiring a chest radiograph.',
      clinicalRationaleAr: 'التهاب الفصوص الرئوية واحتكاك وريقات غشاء الجنب المترافق مع عدوى سفلية.',
      clinicalRationaleEn: 'Parenchymal consolidation with pleural inflammation from acute lower respiratory infection.',
    },
    action: {
      ar: 'راجع الطبيب أو مركز الرعاية العاجلة خلال 12-24 ساعة لإجراء فحص الصدر وسماع الأصوات التنفسية.',
      en: 'Consult a physician or urgent care within 12-24 hours for auscultation and chest imaging.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'الراحة في السرير وتجنب استنشاق الدخان أو الروائح النفاذة أو الغبار.',
        'تناول السوائل الدافئة بانتظام لترطيب المسالك الهوائية.',
        'مراقبة تشبع الأكسجين ونبضات القلب ومراجعة الطوارئ فوراً إذا ظهر ضيق شديد في التنفس.',
      ],
      safeWaitingStepsEn: [
        'Rest in bed and stay clear of environmental irritants, smoke, and cold dry drafts.',
        'Sip warm fluids frequently to soothe airways and aid mucociliary clearance.',
        'Monitor pulse and oxygenation; seek immediate ER care if dyspnea accelerates.',
      ],
    },
  },

  {
    ruleId: 'RULE-URGENT-NEURO-VERTIGO',
    nameAr: 'دوار حاد مستمر مع صعوبة في التوازن أو ازدواجية الرؤية',
    nameEn: 'Acute Persistent Vertigo with Ataxia or Diplopia',
    category: 'NEUROLOGICAL',
    trigger: 'دوخة دورانية شديدة مستمرة مع عدم القدرة على المشي باستقامة أو رؤية مزدوجة',
    conditions: {
      descriptionAr: 'دوار حاد مع اضطراب في التوازن أو ازدواج بالرؤية',
      descriptionEn: 'Acute vertigo with severe gait ataxia, diplopia, or nystagmus',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const vertigo = hasAny(text, ['دوار', 'دوخة دورانية', 'الغرفة تدور', 'vertigo', 'spinning']);
        const ataxia = hasAny(text, ['فقدان التوازن', 'عاجز عن المشي', 'ازدواجية الرؤية', 'رؤية ثنائية', 'ataxia', 'diplopia', 'double vision']);
        return vertigo && ataxia;
      },
    },
    riskLevel: 'URGENT',
    explanation: {
      ar: 'الدوار الحاد المترافق مع عجز في التوازن يستدعي التمييز السريري الدقيق (مثل بروتوكول HINTS) بين أسباب الأذن الداخلية الحميدة والجلطات المخيخية في الدورة الدموية الخلفية للدماغ.',
      en: 'Acute persistent vertigo accompanied by ataxia warrants formal neuro-otological distinction (e.g. HINTS exam) between peripheral vestibulopathy and posterior circulation cerebellar ischemia.',
      clinicalRationaleAr: 'تمييز متلازمة الدهليز الحادة (Acute Vestibular Syndrome) المركزية عن المحيطية.',
      clinicalRationaleEn: 'Differentiation of central versus peripheral acute vestibular syndromes.',
    },
    action: {
      ar: 'راجع قسم الطوارئ أو طبيب الأعصاب خلال ساعات لإجراء الفحص العصبي للأذن والدماغ.',
      en: 'Urgent evaluation by neurology or emergency medicine for HINTS exam and neuro-vestibular assessment.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'الاستلقاء التام في بيئة هادئة وتجنب الحركات المفاجئة للرأس.',
        'عدم محاولة المشي بمفردك لتفادي السقوط والكسور.',
        'تجنب قيادة السيارة أو تشغيل أي آلات نهائياً.',
      ],
      safeWaitingStepsEn: [
        'Lie still in a quiet environment, avoiding sudden head turns.',
        'Do not attempt to walk unsupported to prevent falls and physical injury.',
        'Strictly refrain from driving or operating machinery.',
      ],
    },
  },

  // ==========================================
  // 3. HIGH RISK RULES (Review in 24-48h)
  // ==========================================
  {
    ruleId: 'RULE-HIGH-DVT',
    nameAr: 'تورم مؤلم في ساق واحدة مع احمرار وحرارة (اشتباه خثار وريدي عميق DVT)',
    nameEn: 'Unilateral Painful Lower Extremity Swelling & Erythema (Suspected DVT)',
    category: 'CARDIOVASCULAR',
    trigger: 'انتفاخ ملحوظ في ساق واحدة فقط مع ألم بربلة الساق بعد سفر طويل أو عملية جراحية',
    conditions: {
      descriptionAr: 'تورم ساق واحدة مع ألم واحمرار خاصة مع سوابق ركود حركي',
      descriptionEn: 'Unilateral leg swelling with pain and tenderness following immobility/surgery',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const leg = hasAny(text, ['تورم الساق', 'انتفاخ في رجل واحدة', 'الم في بطة الساق', 'الم في ربلة الساق', 'leg swelling', 'calf pain', 'dvt']);
        const flags = hasAny(text, ['ساق واحدة', 'احمرار وحرارة', 'بعد سفر', 'بعد طيران', 'بعد عملية', 'unilateral', 'post surgery', 'flight']);
        return leg && flags;
      },
    },
    riskLevel: 'HIGH',
    explanation: {
      ar: 'التورم أحادي الجانب في الساق مع الألم يثير اشتباه خثار وريدي عميق (DVT). خطورته تكمن في احتمالية انتقال جزء من الخثرة للرئتين مسبباً انصماماً رئوياً، لذا يستوجب تخطيط دوبلر وريدي عاجل.',
      en: 'Unilateral calf swelling and tenderness carries high clinical probability of Deep Vein Thrombosis (DVT), risking embolization to the pulmonary arterial bed (PE). Requires urgent venous duplex ultrasound.',
      clinicalRationaleAr: 'ركود وريدي وتخثر داخل الأوردة العميقة للساق (ثالوث فيرخوف).',
      clinicalRationaleEn: 'Venous stasis and hypercoagulability (Virchow triad) precipitating deep thrombosis.',
    },
    action: {
      ar: 'راجع الطبيب أو العيادة التخصصية خلال 24 ساعة لإجراء فحص دوبلر الوريدي. لا تقم بتدليك الساق.',
      en: 'Consult a physician within 24 hours for lower-extremity venous Doppler. Do NOT massage the leg.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'تجنب تدليك الساق المتورمة نهائياً لتفادي تحريك أي خثرة دموية.',
        'إراحة الساق ورفعها قليلاً على وسادة مريحة.',
        'التوجه فوراً للطوارئ إذا ظهر أي ضيق تنفس أو ألم صدري مفاجئ.',
      ],
      safeWaitingStepsEn: [
        'Strictly avoid deep massage or rubbing of the swollen calf to prevent dislodgement.',
        'Elevate the limb gently on a soft pillow while resting.',
        'Proceed immediately to the emergency room if sudden breathlessness or chest pain develops.',
      ],
    },
  },

  {
    ruleId: 'RULE-HIGH-PEDIATRIC-FEVER',
    nameAr: 'حمى لدى رضيع أقل من 3 أشهر',
    nameEn: 'Neonatal / Early Infant Fever (< 3 Months of Age)',
    category: 'PEDIATRIC',
    trigger: 'ارتفاع في درجة الحرارة (38°م فأكثر) لدى طفل رضيع عمره أقل من 3 أشهر',
    conditions: {
      descriptionAr: 'عمر المريض أقل من 3 أشهر أو 90 يوماً مع وجود حمى موثقة',
      descriptionEn: 'Patient age under 3 months (90 days) presenting with documented fever >= 38.0°C',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        const isBaby = (input.patientContext?.age !== undefined && input.patientContext.age <= 0.25) ||
          hasAny(text, ['رضيع', 'عمره شهر', 'عمره شهرين', 'عمره اسابيع', 'حديث ولادة', 'infant', 'newborn', 'neonatal']);
        const hasFever = (input.vitalSigns?.temperature !== undefined && input.vitalSigns.temperature >= 38.0) ||
          hasAny(text, ['حمى', 'حرارة', 'سخونة', 'fever', 'temperature 38']);
        return isBaby && hasFever;
      },
    },
    riskLevel: 'HIGH',
    explanation: {
      ar: 'الحمى لدى الرضع تحت سن 3 أشهر تمثل حالة سريرية عالية الخطورة بسبب عدم نضج جهاز المناعة لديهم، وتتطلب فحصاً طبياً شاملاً لاستبعاد العدوى الجرثومية الغازية.',
      en: 'Fever in young infants (< 90 days) represents a high-risk cohort due to immature immune barriers, mandating standardized pediatric protocol workup to rule out invasive bacterial infection (IBI).',
      clinicalRationaleAr: 'عدم اكتمال المناعة وزيادة نفاذية الحاجز الدموي الدماغي وسرعة تدهور الحالة في هذه الفئة العمرية.',
      clinicalRationaleEn: 'Immature humoral immunity predisposing to occult bacteremia and meningitis.',
    },
    action: {
      ar: 'توجه لطوارئ الأطفال أو طبيب الأطفال اليوم دون تأخير لتقييم الرضيع سريرياً.',
      en: 'Take the infant to a pediatric emergency facility or pediatrician today without delay.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'عدم إعطاء أدوية خافضة للحرارة قبل استشارة الطبيب لتفادي إخفاء مسار الحرارة الطبيعي.',
        'الحفاظ على الرضاعة الطبيعية بانتظام لترطيب جسم الرضيع.',
        'ارتداء ملابس قطنية خفيفة وعدم تغطية الرضيع بأغطية ثقيلة.',
      ],
      safeWaitingStepsEn: [
        'Do not administer antipyretics prior to initial pediatric assessment unless directed by a doctor.',
        'Maintain regular hydration via frequent breast/formula feeds.',
        'Dress in lightweight breathable cotton clothing; avoid heavy swaddling.',
      ],
    },
  },

  // ==========================================
  // 4. MODERATE RISK RULES (Routine Evaluation)
  // ==========================================
  {
    ruleId: 'RULE-MOD-GASTROENTERITIS',
    nameAr: 'نزلة معوية حادة خفيفة إلى متوسطة (إسهال / قيء مع احتفاظ بالسوائل)',
    nameEn: 'Acute Mild-to-Moderate Gastroenteritis',
    category: 'ACUTE_ABDOMEN',
    trigger: 'إسهال مائي ومغص بطني مع قدرة على شرب السوائل وغياب علامات الجفاف الشديد',
    conditions: {
      descriptionAr: 'أعراض التهاب معدة وأمعاء دون دم في البراز ودون جفاف حرج',
      descriptionEn: 'Diarrheal/vomiting symptoms without hematochezia or severe dehydration signs',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, ['اسهال', 'نزلة معوية', 'مغص بطني مع اسهال', 'تلبك معوي', 'diarrhea', 'gastroenteritis', 'stomach bug']) &&
          !hasAny(text, ['دم بالبراز', 'استفراغ دم', 'براز اسود', 'جفاف شديد', 'انعدام البول']);
      },
    },
    riskLevel: 'MODERATE',
    explanation: {
      ar: 'التهاب المعدة والأمعاء الحاد غالباً ما يكون فيروسي المنشأ ومحدوداً ذاتياً. الركيزة الأساسية للعناية هي تعويض السوائل والأملاح لتفادي الجفاف.',
      en: 'Acute viral gastroenteritis is commonly self-limiting. Clinical management centers on oral rehydration therapy to prevent dehydration.',
      clinicalRationaleAr: 'التهاب معوي حاد سليم يؤدي لخسارة سوائل معوية مؤقتة قابلة للتعويض الفموي.',
      clinicalRationaleEn: 'Self-limiting intestinal mucosal inflammation responsive to fluid replacement.',
    },
    action: {
      ar: 'يمكن تدبير الحالة بالسوائل الفموية ومراجعة المركز الصحي إذا استمرت لأكثر من 48 ساعة.',
      en: 'Manage with oral rehydration salts (ORS) and visit primary care if persisting > 48h.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'تناول محاليل الجفاف الفموية (ORS) أو رشفات منتظمة من الماء والمرق الخفيف.',
        'تجنب الأطعمة الدسمة والمقلية والسكريات المركزة حتى استقرار الجهاز الهضمي.',
        'مراقبة كمية البول وترطيب الشفتين كعلامات على كفاية السوائل.',
      ],
      safeWaitingStepsEn: [
        'Sip oral rehydration salts (ORS) or light clear broths in steady small volumes.',
        'Avoid greasy, spicy, or high-sugar foods until gastrointestinal stability returns.',
        'Observe urine output and oral moisture as indicators of adequate hydration.',
      ],
    },
  },

  {
    ruleId: 'RULE-MOD-PAIN-MUSCULO',
    nameAr: 'شد عضلي هيكلي معتدل أو صداع توتري (4 إلى 7 على مقياس الألم)',
    nameEn: 'Moderate Musculoskeletal Strain or Tension Headache',
    category: 'GENERAL',
    trigger: 'ألم عضلي بالظهر أو الرقبة أو صداع ضاغط متوسط الدرجة ناتج عن الإجهاد',
    conditions: {
      descriptionAr: 'ألم متوسط الشدة (4-7) مرتبط بالحركة أو الإجهاد دون عجز عصبي',
      descriptionEn: 'Moderate pain (scale 4-7) associated with postural strain without neurological deficit',
      matches: (input: SafetyEvaluationInput) => {
        if (input.painScale !== undefined && input.painScale >= 4 && input.painScale <= 7) return true;
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, [
          'شد عضلي', 'الم بالرقبة', 'الم متوسط بالظهر', 'صداع توتري', 'الم خفيف بالكتف',
          'muscle strain', 'back pain', 'tension headache', 'neck stiffness without fever'
        ]);
      },
    },
    riskLevel: 'MODERATE',
    explanation: {
      ar: 'الآلام العضلية الهيكلية والصداع التوتري شائعة وتستجيب عادة للراحة والتدابير الفيزيائية البسيطة وتعديل وضعية الجلوس.',
      en: 'Musculoskeletal strain and tension-type headache are common benign conditions generally responsive to rest, ergonomics, and simple supportive measures.',
      clinicalRationaleAr: 'تقلص موضعي في الألياف العضلية أو الأربطة دون تأثر جذور الأعصاب.',
      clinicalRationaleEn: 'Localized myofascial trigger irritation without radicular impingement.',
    },
    action: {
      ar: 'استرح وقم بتمارين تمدد لطيفة وراجع طبيب الرعاية الأولية إذا لم يتحسن الألم خلال أسبوع.',
      en: 'Rest, apply gentle stretching, and follow up with primary care if symptoms persist > 1 week.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'أخذ فترات راحة منتظمة وتجنب الجلوس بوضعيات خاطئة لفترات طويلة.',
        'استخدام كمادات دافئة أو باردة على المنطقة المصابة لمدة 15 دقيقة.',
        'ممارسة تمارين الإطالة الخفيفة دون إجهاد زائد.',
      ],
      safeWaitingStepsEn: [
        'Take regular posture breaks and avoid prolonged awkward static positions.',
        'Apply warm or cool compresses to the tender area for 15-20 minutes.',
        'Perform gentle active range-of-motion stretching without forcing painful extremes.',
      ],
    },
  },

  // ==========================================
  // 5. LOW RISK RULES (Self-Care & Education)
  // ==========================================
  {
    ruleId: 'RULE-LOW-COMMON-COLD',
    nameAr: 'نزلة برد فيروسية خفيفة (رشح وعطاس واحتقان بسيط)',
    nameEn: 'Mild Viral Upper Respiratory Infection (Common Cold)',
    category: 'RESPIRATORY',
    trigger: 'سيلان الأنف والعطاس مع احتقان حلق خفيف دون حمى عالية أو ضيق في التنفس',
    conditions: {
      descriptionAr: 'أعراض رشح وعطاس خفيفة مع غياب علامات الخطر الرئوية',
      descriptionEn: 'Mild rhinorrhea, sneezing, and throat tickle without high fever or tachypnea',
      matches: (input: SafetyEvaluationInput) => {
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, ['زكام', 'رشح', 'نزلة برد', 'عطاس', 'احتقان بسيط', 'سيلان الانف', 'cold', 'rhinitis', 'runny nose', 'sneezing']) &&
          !hasAny(text, ['ضيق تنفس', 'حرارة 40', 'الم بالصدر', 'بلغم دموي']);
      },
    },
    riskLevel: 'LOW',
    explanation: {
      ar: 'نزلة البرد الفيروسية حالة حميدة ومحدودة ذاتياً تختفي عادة خلال 5 إلى 7 أيام بالراحة والترطيب، ولا تحتاج لمضادات حيوية.',
      en: 'Viral upper respiratory tract infection (common cold) is a self-limiting benign condition typically resolving in 5-7 days with supportive care, not requiring antibacterial therapy.',
      clinicalRationaleAr: 'عدوى فيروسية سطحية في مخاطية الأنف والبلعوم محدودة ذاتياً.',
      clinicalRationaleEn: 'Self-limiting viral replication in nasopharyngeal mucosa.',
    },
    action: {
      ar: 'عناية ذاتية منزلية: شرب سوائل دافئة والراحة، ومراجعة الطبيب فقط إذا استمرت لأكثر من 10 أيام.',
      en: 'Home supportive care: Hydration, rest, and warm fluids. Consult a doctor if > 10 days.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'شرب السوائل الدافئة كالينسون والبابونج والماء بالعسل والليمون.',
        'الحصول على قسط كافٍ من النوم والراحة لمساندة الجهاز المناعي.',
        'استخدام بخاخ المحلول الملحي الأنفي لتنظيف مجرى الأنف بلطف.',
      ],
      safeWaitingStepsEn: [
        'Stay well hydrated with warm broths, herbal teas, and water with honey/lemon.',
        'Ensure adequate restorative sleep to bolster native immune function.',
        'Use isotonic saline nasal sprays or rinses for gentle decongestion.',
      ],
    },
  },

  {
    ruleId: 'RULE-LOW-FATIGUE',
    nameAr: 'إجهاد عابر أو تعب عضلي خفيف بعد مجهود',
    nameEn: 'Transient Mild Fatigue or Post-Exertional Soreness',
    category: 'GENERAL',
    trigger: 'شعور عام بالإرهاق الخفيف بعد يوم عمل طويل أو تمرين رياضي',
    conditions: {
      descriptionAr: 'تعب بسيط مع مقياس ألم 1-3 دون علامات مرضية عضوية',
      descriptionEn: 'Mild fatigue or post-exercise soreness (score 1-3) without organic alarms',
      matches: (input: SafetyEvaluationInput) => {
        if (input.painScale !== undefined && input.painScale >= 1 && input.painScale <= 3) return true;
        const text = normalizeText(`${input.text} ${input.symptoms || ''}`);
        return hasAny(text, ['تعب خفيف', 'ارهاق بعد الشغل', 'تعب عضلي بسيط', 'خمول عابر', 'fatigue', 'mild soreness', 'tiredness']);
      },
    },
    riskLevel: 'LOW',
    explanation: {
      ar: 'الإجهاد البدني الخفيف بعد بذل الجهد يعد استجابة فسيولوجية طبيعية للجسم تستعيد عافيتها بالراحة والنوم الجيد.',
      en: 'Mild post-exertional fatigue is a normal physiological recovery response restored through sleep and balanced nutrition.',
      clinicalRationaleAr: 'استنزاف طاقي عضلي فسيولوجي عابر.',
      clinicalRationaleEn: 'Transient exertion-induced metabolic fatigue.',
    },
    action: {
      ar: 'الراحة والنوم الكافي وترطيب الجسم بالماء والتغذية الصحية المتوازنة.',
      en: 'Prioritize restorative sleep, healthy nutrition, and good hydration.',
      emergencyCallRequired: false,
      safeWaitingStepsAr: [
        'النوم لـ 7-8 ساعات متواصلة في بيئة مريحة.',
        'شرب ما لا يقل عن 2 لتر من الماء يومياً.',
        'تناول وجبات خفيفة غنية بالبروتين والخضروات والفواكه.',
      ],
      safeWaitingStepsEn: [
        'Aim for 7-8 hours of uninterrupted sleep in a quiet room.',
        'Drink adequate water throughout the day.',
        'Consume balanced, nutrient-dense whole foods.',
      ],
    },
  },
];
