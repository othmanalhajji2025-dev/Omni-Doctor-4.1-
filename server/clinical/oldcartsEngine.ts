import { OLDCARTS, MissingOLDCARTSElement } from '../types/medical.js';

/**
 * OLDCARTS Clinical Framework Engine
 * O — Onset (البداية والظهور)
 * L — Location (الموضع والامتداد)
 * D — Duration (المدة الزمنية)
 * C — Character (طبيعة الألم أو العَرَض)
 * A — Aggravating Factors (عوامل التفاقم والزيادة)
 * R — Relieving Factors (عوامل التخفيف والتحسن)
 * T — Timing (التوقيت والنمط الزمني)
 * S — Severity (الشدة ومقياس الألم)
 */

export function extractOLDCARTSFromText(text: string): OLDCARTS {
  const normalized = text.toLowerCase();
  const result: OLDCARTS = {};

  // 1. Onset (البداية)
  if (
    normalized.includes('فجأة') ||
    normalized.includes('مفاجئ') ||
    normalized.includes('بشكل مفاجئ') ||
    normalized.includes('sudden') ||
    normalized.includes('abrupt')
  ) {
    result.onset = 'مفاجئ حاد (Sudden / Abrupt)';
  } else if (
    normalized.includes('تدريجي') ||
    normalized.includes('بالتدريج') ||
    normalized.includes('gradual') ||
    normalized.includes('slowly')
  ) {
    result.onset = 'تدريجي متصاعد (Gradual onset)';
  }

  // 2. Location (الموقع والامتداد)
  const locations: string[] = [];
  if (normalized.includes('صدر') || normalized.includes('الصدر') || normalized.includes('chest')) {
    locations.push('منتصف الصدر (Substernal / Chest)');
  }
  if (normalized.includes('بطن') || normalized.includes('البطن') || normalized.includes('معدتي') || normalized.includes('abdomen') || normalized.includes('stomach')) {
    locations.push('البطن / المنطقة الشرسوفية (Abdomen / Epigastric)');
  }
  if (normalized.includes('رأس') || normalized.includes('الرأس') || normalized.includes('صداع') || normalized.includes('head') || normalized.includes('headache')) {
    locations.push('الرأس (Cranial / Cephalic)');
  }
  if (normalized.includes('ظهر') || normalized.includes('الظهر') || normalized.includes('back')) {
    locations.push('الظهر (Back / Lumbar)');
  }
  if (normalized.includes('حلق') || normalized.includes('الحلق') || normalized.includes('throat')) {
    locations.push('الحلق والبلعوم (Oropharynx / Throat)');
  }
  if (normalized.includes('ذراع') || normalized.includes('الذراع الأيسر') || normalized.includes('arm')) {
    locations.push('الذراع (Arm)');
  }
  if (normalized.includes('خاصرة') || normalized.includes('flank')) {
    locations.push('الخاصرة (Flank)');
  }
  if (locations.length > 0) {
    result.location = locations.join('، ');
  }

  // 3. Duration (المدة)
  const durationMatch =
    text.match(/(منذ|خلال|لمدة)\s+([\u0621-\u064A0-9\s]+)(ساعة|ساعات|أيام|يوم|أسبوع|أسابيع|شهر|أشهر)/i) ||
    text.match(/for\s+([0-9a-zA-Z\s]+)(hours?|days?|weeks?|months?)/i);
  if (durationMatch) {
    result.duration = durationMatch[0].trim();
  } else if (normalized.includes('منذ ساعة') || normalized.includes('for 1 hour')) {
    result.duration = 'منذ حوالي ساعة';
  } else if (normalized.includes('منذ يومين') || normalized.includes('2 days')) {
    result.duration = 'منذ يومين';
  } else if (normalized.includes('منذ 3 أيام') || normalized.includes('3 days')) {
    result.duration = 'منذ 3 أيام';
  } else if (normalized.includes('أسبوع') || normalized.includes('week')) {
    result.duration = 'منذ حوالي أسبوع';
  }

  // 4. Character (طبيعة الألم)
  const characters: string[] = [];
  if (normalized.includes('ضاغط') || normalized.includes('ثقل') || normalized.includes('عاصر') || normalized.includes('crushing') || normalized.includes('pressure')) {
    characters.push('ضاغط وثقيل كالصخر (Crushing / Pressure)');
  }
  if (normalized.includes('نابض') || normalized.includes('ينبض') || normalized.includes('throbbing') || normalized.includes('pulsating')) {
    characters.push('نابض متواتر (Throbbing / Pulsatile)');
  }
  if (normalized.includes('حارق') || normalized.includes('حرقة') || normalized.includes('حموضة') || normalized.includes('burning')) {
    characters.push('حارق كاللهب (Burning)');
  }
  if (normalized.includes('مغص') || normalized.includes('تشنج') || normalized.includes('colic') || normalized.includes('cramping')) {
    characters.push('مغص وتشنجات حادة (Colicky / Cramping)');
  }
  if (normalized.includes('وخز') || normalized.includes('طعن') || normalized.includes('stabbing') || normalized.includes('sharp')) {
    characters.push('حاد كالطعنات أو وخزات (Sharp / Stabbing)');
  }
  if (normalized.includes('كليل') || normalized.includes('مستمر هادئ') || normalized.includes('dull')) {
    characters.push('كليل ومستمر (Dull ache)');
  }
  if (characters.length > 0) {
    result.character = characters.join('، ');
  }

  // 5. Aggravating Factors (عوامل التفاقم)
  const agg: string[] = [];
  if (normalized.includes('مع المجهود') || normalized.includes('عند المشي') || normalized.includes('exertion')) {
    agg.push('بذل الجهد البدني أو صعود الدرج (Physical exertion)');
  }
  if (normalized.includes('مع التنفس') || normalized.includes('أخذ نفس') || normalized.includes('inspiration') || normalized.includes('breathing')) {
    agg.push('الشهيق العميق أو السعال (Deep inspiration)');
  }
  if (normalized.includes('بعد الأكل') || normalized.includes('طعام دسم') || normalized.includes('after eating')) {
    agg.push('تناول الطعام الدسم أو الوجبات الكبيرة (Post-prandial)');
  }
  if (normalized.includes('مع الضوء') || normalized.includes('الأصوات العالية') || normalized.includes('bright light')) {
    agg.push('الأضواء الساطعة والضوضاء (Light and noise)');
  }
  if (normalized.includes('عند الانحناء') || normalized.includes('bending') || normalized.includes('lying flat') || normalized.includes('الاستلقاء')) {
    agg.push('الاستلقاء التام أو الانحناء للأمام (Position change / Recumbency)');
  }
  if (agg.length > 0) {
    result.aggravatingFactors = agg;
  }

  // 6. Relieving Factors (عوامل التخفيف)
  const rel: string[] = [];
  if (normalized.includes('يرتاح بالراحة') || normalized.includes('يخف بالجلوس') || normalized.includes('rest')) {
    rel.push('الراحة التامة والتوقف عن الحركة (Rest)');
  }
  if (normalized.includes('مسكن') || normalized.includes('باراسيتامول') || normalized.includes('بانادول') || normalized.includes('analgesic') || normalized.includes('paracetamol')) {
    rel.push('تناول المسكنات البسيطة (Analgesics)');
  }
  if (normalized.includes('مضادات الحموضة') || normalized.includes('شرب حليب') || normalized.includes('antacid')) {
    rel.push('مضادات الحموضة أو شرب السوائل المهدئة (Antacids)');
  }
  if (normalized.includes('الظلام') || normalized.includes('النوم') || normalized.includes('dark room')) {
    rel.push('النوم في غرفة مظلمة وهادئة (Dark quiet room)');
  }
  if (rel.length > 0) {
    result.relievingFactors = rel;
  }

  // 7. Timing (التوقيت والنمط الزمني)
  if (normalized.includes('مستمر') || normalized.includes('طوال الوقت') || normalized.includes('continuous') || normalized.includes('constant')) {
    result.timing = 'مستمر على وتيرة واحدة (Constant / Continuous)';
  } else if (normalized.includes('متقطع') || normalized.includes('يأتي ويروح') || normalized.includes('نوبات') || normalized.includes('intermittent')) {
    result.timing = 'متقطع على شكل نوبات وفترات هدوء (Intermittent / Episodes)';
  } else if (normalized.includes('صباح') || normalized.includes('في الصباح') || normalized.includes('morning')) {
    result.timing = 'يزداد في فترات الصباح الباكر (Morning exacerbation)';
  } else if (normalized.includes('ليل') || normalized.includes('في الليل') || normalized.includes('night') || normalized.includes('nocturnal')) {
    result.timing = 'يزداد في المساء أو أثناء النوم (Nocturnal / Night)';
  }

  // 8. Severity (الشدة)
  const severityMatch = text.match(/([0-9]|10)\s*(\/|\s*من\s*)\s*10/i);
  if (severityMatch) {
    const num = parseInt(severityMatch[1], 10);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      result.severity = num;
    }
  } else if (normalized.includes('شديد جدا') || normalized.includes('لا يطاق') || normalized.includes('severe') || normalized.includes('excruciating')) {
    result.severity = 8;
  } else if (normalized.includes('متوسط') || normalized.includes('moderate')) {
    result.severity = 5;
  } else if (normalized.includes('خفيف') || normalized.includes('بسيط') || normalized.includes('mild')) {
    result.severity = 3;
  }

  return result;
}

/**
 * Identifies missing OLDCARTS elements and prioritizes only clinically pertinent items.
 * Rule: Do not ask about everything if it is not important ("ولا يسأل عن كل شيء إذا لم يكن مهماً").
 * Attaches explicit clinical rationale ("لماذا تم طرح هذا السؤال؟") for every pertinent question.
 */
export function evaluateMissingOLDCARTSElements(
  oldcarts: OLDCARTS,
  chiefComplaint: string = ''
): {
  missingElements: MissingOLDCARTSElement[];
  nextPriorityQuestion?: MissingOLDCARTSElement;
} {
  const normChief = chiefComplaint.toLowerCase();

  // Clinical relevance mapping based on symptom archetype
  const isCardiovascularOrChest =
    normChief.includes('صدر') ||
    normChief.includes('قلب') ||
    normChief.includes('خفقان') ||
    normChief.includes('chest') ||
    normChief.includes('ضيق تنفس');

  const isAbdominal =
    normChief.includes('بطن') ||
    normChief.includes('مغص') ||
    normChief.includes('استفراغ') ||
    normChief.includes('غثيان') ||
    normChief.includes('إسهال') ||
    normChief.includes('abdomen') ||
    normChief.includes('stomach');

  const isNeurologicalOrHead =
    normChief.includes('رأس') ||
    normChief.includes('صداع') ||
    normChief.includes('دوخة') ||
    normChief.includes('تنميل') ||
    normChief.includes('headache');

  const isRespiratory =
    normChief.includes('سعال') ||
    normChief.includes('كحة') ||
    normChief.includes('بلغم') ||
    normChief.includes('حلق') ||
    normChief.includes('cough');

  const allCandidates: MissingOLDCARTSElement[] = [
    {
      field: 'onset',
      code: 'O',
      labelAr: 'بداية العَرَض (Onset)',
      labelEn: 'Onset',
      isPertinent: true, // Onset is vital across all acute scenarios
      priority: isCardiovascularOrChest ? 1 : 2,
      questionAr: 'هل ظهر العَرَض بشكل فجائي وصاعق خلال لحظات، أم بدأ بالتدريج على مدى ساعات أو أيام؟',
      questionEn: 'Did this symptom start abruptly within seconds/minutes, or did it build up gradually over hours or days?',
      whyThisQuestionAr: 'البداية المفاجئة الصاعقة تمثل علامة فارقة للتمييز بين الحالات الوعائية الحادة (كالجلطات والتمزقات) والالتهابات التدريجية.',
      whyThisQuestionEn: 'Sudden onset helps differentiate acute vascular emergencies (infarction, dissection) from gradual inflammatory conditions.',
      quickOptionsAr: ['مفاجئ جداً خلال لحظات', 'تدريجي متصاعد', 'لا أذكر بالتحديد'],
      quickOptionsEn: ['Sudden within moments', 'Gradual buildup', 'Not sure'],
    },
    {
      field: 'location',
      code: 'L',
      labelAr: 'الموقع والامتداد (Location & Radiation)',
      labelEn: 'Location & Radiation',
      isPertinent: !isRespiratory, // Throat/cough already localized
      priority: isCardiovascularOrChest ? 1 : isAbdominal ? 2 : 3,
      questionAr: 'أين يتركز الألم أو الانزعاج بالتحديد؟ وهل يمتد أو ينتقل إلى مكان آخر كالذراع، الرقبة، الظهر، أو الفك؟',
      questionEn: 'Where exactly is the discomfort centered, and does it radiate to your arm, neck, back, or jaw?',
      whyThisQuestionAr: 'امتداد الألم (Radiation) هو مؤشر تشريحي حاسم لتحديد العضو المسبب (مثل امتداد ألم الصدر للذراع الأيسر أو الفك).',
      whyThisQuestionEn: 'Pain radiation is a critical anatomical clue linking somatic or visceral innervation to underlying organ pathology.',
      quickOptionsAr: ['ثابت في مكانه دون امتداد', 'يمتد للذراع أو الكتف', 'يمتد إلى الظهر أو بين الكتفين', 'يمتد إلى الفك أو الرقبة'],
      quickOptionsEn: ['Fixed in place', 'Radiates to arm/shoulder', 'Radiates to back', 'Radiates to jaw/neck'],
    },
    {
      field: 'duration',
      code: 'D',
      labelAr: 'المدة الزمنية (Duration)',
      labelEn: 'Duration',
      isPertinent: true,
      priority: 2,
      questionAr: 'منذ متى تشعر بهذا العَرَض؟ (كم دقيقة، ساعة، أو يوم مستمر معك؟)',
      questionEn: 'How long has this symptom been present? (Exact minutes, hours, or days?)',
      whyThisQuestionAr: 'مدة العَرَض تحدد النافذة العلاجية الذهبية وسرعة التداخل المطلوب.',
      whyThisQuestionEn: 'Symptom duration dictates therapeutic windows and urgency of clinical interventions.',
      quickOptionsAr: ['أقل من ساعتين', 'اليوم منذ الصباح', '1-3 أيام', 'أكثر من أسبوع'],
      quickOptionsEn: ['Less than 2 hours', 'Since morning today', '1-3 days', 'More than a week'],
    },
    {
      field: 'character',
      code: 'C',
      labelAr: 'طبيعة الشعور أو الألم (Character)',
      labelEn: 'Character',
      isPertinent: !isRespiratory,
      priority: isCardiovascularOrChest ? 1 : isNeurologicalOrHead ? 2 : 3,
      questionAr: 'كيف تصف نوع هذا الألم أو الشعور؟ (هل هو ثقل ضاغط كالصخر، نبض متواتر، مغص حاد، أم وخز كالإبر؟)',
      questionEn: 'How would you describe the sensation? (Crushing weight, throbbing, cramping, burning, or sharp stabbing?)',
      whyThisQuestionAr: 'طبيعة الألم تعكس النسيج المصاب؛ فالألم الضاغط يشير لنقص تروية عضلة القلب، بينما الألم النابض يرتبط بالشراكين كالشقيقة.',
      whyThisQuestionEn: 'Pain character reflects underlying pathology: crushing sensation correlates with myocardial ischemia; throbbing reflects vascular pulsation.',
      quickOptionsAr: ['ضغط وثقل شديد', 'نبض متواتر ومستمر', 'حرقة كالنار', 'مغص تشنجي متقلب', 'طعن أو وخز حاد'],
      quickOptionsEn: ['Crushing pressure', 'Pulsatile/throbbing', 'Burning sensation', 'Colicky/cramping', 'Sharp stabbing'],
    },
    {
      field: 'aggravatingFactors',
      code: 'A',
      labelAr: 'عوامل التفاقم والزيادة (Aggravating Factors)',
      labelEn: 'Aggravating Factors',
      isPertinent: isCardiovascularOrChest || isAbdominal || isNeurologicalOrHead,
      priority: 3,
      questionAr: 'هل تلاحظ أن الألم يزداد مع حركة معينة، مثل بذل مجهود بدني، التنفس العميق، تناول الطعام، أو التعرض للضوء؟',
      questionEn: 'Does anything make it worse, such as physical exertion, deep breathing, eating, or exposure to light?',
      whyThisQuestionAr: 'معرفة محفزات التفاقم تفرق بين الأسباب الهيكلية العضلية، القلبية الإقفارية، والهضمية.',
      whyThisQuestionEn: 'Aggravating triggers differentiate muscular chest wall strain from ischemic exertional angina and gastrointestinal disorders.',
      quickOptionsAr: ['يزداد مع المجهود والمشي', 'يزداد مع أخذ نفس عميق', 'يزداد بعد الأكل', 'يزداد مع الضوء والصوت', 'لا يتأثر بشيء محدد'],
      quickOptionsEn: ['Worse with exertion', 'Worse with deep breath', 'Worse after eating', 'Worse with bright light', 'No specific triggers'],
    },
    {
      field: 'relievingFactors',
      code: 'R',
      labelAr: 'عوامل التخفيف والراحة (Relieving Factors)',
      labelEn: 'Relieving Factors',
      isPertinent: isCardiovascularOrChest || isAbdominal || isNeurologicalOrHead,
      priority: 4,
      questionAr: 'هل هناك ما يخفف من حدة الألم، مثل التوقف عن الحركة والاستراحة، الجلوس منحنياً للأمام، أو شرب سوائل دافئة؟',
      questionEn: 'Does anything relieve the discomfort, such as complete rest, leaning forward, or simple analgesics?',
      whyThisQuestionAr: 'استجابة الألم للراحة أو وضعية معينة (كالجلوس للأمام في التهاب التامور) تقدم دليلاً تشخيصياً نوعياً.',
      whyThisQuestionEn: 'Positional relief (e.g. leaning forward in pericarditis or rest in stable angina) provides high-yield diagnostic clues.',
      quickOptionsAr: ['يخف فور الاستراحة والهدوء', 'يخف بالجلوس والانحناء للأمام', 'يخف بعد شرب السوائل أو المسكن', 'لا يخف بأي وسيلة'],
      quickOptionsEn: ['Relieved by rest', 'Relieved by leaning forward', 'Relieved by fluids/analgesic', 'Unrelieved by anything'],
    },
    {
      field: 'timing',
      code: 'T',
      labelAr: 'التوقيت والنمط الزمني (Timing & Pattern)',
      labelEn: 'Timing & Pattern',
      isPertinent: isNeurologicalOrHead || isAbdominal || isRespiratory,
      priority: 4,
      questionAr: 'هل الألم مستمر بلا توقف، أم يأتي على شكل موجات ونوبات متفرقة بينها فترات راحة؟',
      questionEn: 'Is the discomfort constant without pause, or does it come in waves/spasms with intervals of relief?',
      whyThisQuestionAr: 'النمط المتموج التشنجي يميز انسدادات الأعضاء المجوفة (كالمغص الصفراوي أو الكلوي) عن الالتهابات المستمرة كألم الزائدة.',
      whyThisQuestionEn: 'Intermittent colicky timing indicates hollow viscus peristalsis/obstruction, whereas constant pain suggests continuous inflammation.',
      quickOptionsAr: ['مستمر بلا انقطاع', 'نوبات وموجات متقطعة', 'يزداد في الصباح', 'يزداد في المساء'],
      quickOptionsEn: ['Constant without pause', 'Waves and spasms', 'Worse in morning', 'Worse at night'],
    },
    {
      field: 'severity',
      code: 'S',
      labelAr: 'الشدة ومقياس الألم (Severity & Pain Scale)',
      labelEn: 'Severity',
      isPertinent: true,
      priority: 2,
      questionAr: 'على مقياس من 1 إلى 10 (حيث 1 بسيط جداً و10 ألم لا يطاق يعجزك عن الحديث أو الوقوف)، كم تقدر شدة هذا العَرَض؟',
      questionEn: 'On a scale from 1 to 10 (1 being minimal, 10 being excruciating incapacitating pain), how severe is this symptom?',
      whyThisQuestionAr: 'مقياس الألم الموحد هو الركيزة الأساسية لتحديد مسار الفرز السريري (Triage Triangulation) ومستوى الرعاية المطلوبة.',
      whyThisQuestionEn: 'Standardized numeric pain grading is essential for calibrated triage stratification and acute urgency assignment.',
      quickOptionsAr: ['خفيف (1-3)', 'متوسط (4-6)', 'شديد (7-8)', 'حرج لا يطاق (9-10)'],
      quickOptionsEn: ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-8)', 'Excruciating (9-10)'],
    },
  ];

  // Filter missing items based on extracted state
  const missingElements: MissingOLDCARTSElement[] = [];

  for (const candidate of allCandidates) {
    const val = (oldcarts as any)[candidate.field];
    const isMissing =
      val === undefined ||
      val === null ||
      (typeof val === 'string' && val.trim().length === 0) ||
      (Array.isArray(val) && val.length === 0);

    if (isMissing && candidate.isPertinent) {
      missingElements.push(candidate);
    }
  }

  // Sort by priority (lowest number = highest clinical urgency)
  missingElements.sort((a, b) => a.priority - b.priority);

  // Return the single highest priority missing question (لا يسأل عن كل شيء إذا لم يكن مهماً)
  const nextPriorityQuestion = missingElements.length > 0 ? missingElements[0] : undefined;

  return {
    missingElements,
    nextPriorityQuestion,
  };
}
