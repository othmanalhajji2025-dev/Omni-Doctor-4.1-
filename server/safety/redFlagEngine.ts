import { RedFlagRule, TriageUrgency, VitalSignInput, PatientContext } from '../types/medical.js';

export const RED_FLAG_RULES: RedFlagRule[] = [
  // Cardiovascular
  {
    id: 'rf-cardio-chest-pain',
    nameAr: 'ألم صدري حاد أو ضاغط ممتد للذراع/الفك',
    nameEn: 'Acute crushing chest pain radiating to arm or jaw',
    keywordsAr: ['ألم بالصدر', 'الم في الصدر', 'ضغط بالصدر', 'ذبحة', 'نوبة قلبية', 'نغزة قوية بالقلب', 'الم ممتد لليد اليسرى', 'ثقل بالصدر'],
    keywordsEn: ['chest pain', 'chest pressure', 'crushing chest', 'heart attack', 'pain radiating to jaw', 'left arm pain'],
    urgency: 'EMERGENCY',
    actionAr: 'اتصل فوراً بالإسعاف (997 أو 911) ولا تقم بقيادة السيارة بنفسك.',
    actionEn: 'Call Emergency Services (911/997) immediately. Do not drive yourself.',
    category: 'CARDIOVASCULAR',
  },
  {
    id: 'rf-neuro-stroke-fast',
    nameAr: 'أعراض سكتة دماغية (شلل بالوجه، ثقل لسان، ضعف مفاجئ بالأطراف)',
    nameEn: 'Stroke Warning Signs (Face droop, Arm weakness, Slurred speech - FAST)',
    keywordsAr: ['شلل نصفي', 'ثقل في اللسان', 'اعوجاج الفم', 'ارتخاء الوجه', 'فقدان التوازن المفاجئ', 'ضعف مفاجئ في اليد', 'سكتة دماغية'],
    keywordsEn: ['face drooping', 'arm weakness', 'slurred speech', 'stroke', 'sudden numbness', 'hemiparesis'],
    urgency: 'EMERGENCY',
    actionAr: 'حالة طوارئ قصوى (بروتوكول FAST). توجه فوراً لأقرب مركز سكتات دماغية.',
    actionEn: 'Immediate Emergency (FAST protocol). Go to the nearest stroke center now.',
    category: 'NEUROLOGICAL',
  },
  {
    id: 'rf-resp-severe-dyspnea',
    nameAr: 'صعوبة تنفس حادة أو اختناق أو زرقة بالشفاه',
    nameEn: 'Severe acute dyspnea, choking or cyanosis',
    keywordsAr: ['ضيق تنفس شديد', 'اختناق', 'عدم القدرة على التنفس', 'زرقة الشفاه', 'صعوبة شديدة في اخذ النفس', 'لهاث حاد'],
    keywordsEn: ['severe shortness of breath', 'cannot breathe', 'choking', 'cyanosis', 'severe dyspnea', 'blue lips'],
    urgency: 'EMERGENCY',
    actionAr: 'اجلس بوضعية قائمة واطلب الرعاية الإسعافية الفورية أو الأكسجين الطارئ.',
    actionEn: 'Sit upright and seek immediate emergency oxygen and paramedic assistance.',
    category: 'RESPIRATORY',
  },
  {
    id: 'rf-neuro-thunderclap-headache',
    nameAr: 'صداع رعدي مفاجئ وشديد جداً غير مسبوق',
    nameEn: 'Sudden thunderclap headache ("worst headache of life")',
    keywordsAr: ['صداع رعدي', 'اشد صداع بحياتي', 'صداع مفاجئ عنيف', 'انفجار بالرأس'],
    keywordsEn: ['thunderclap headache', 'worst headache of my life', 'sudden explosive headache'],
    urgency: 'EMERGENCY',
    actionAr: 'يتطلب تصويراً عاجلاً للدماغ لاستبعاد النزيف تحت العنكبوتية.',
    actionEn: 'Requires emergency neuroimaging to rule out subarachnoid hemorrhage.',
    category: 'NEUROLOGICAL',
  },
  {
    id: 'rf-abd-rigid-abdomen',
    nameAr: 'ألم بطني حاد جداً مع صلابة الجدار أو قيء دموي',
    nameEn: 'Acute severe abdomen with guarding/rigidity or hematemesis',
    keywordsAr: ['الم حاد بالبطن مع تحجر', 'قيء دم', 'استفراغ دم', 'بطن متصلب كاللوح', 'براز اسود قطراني', 'نزيف هضمي'],
    keywordsEn: ['rigid abdomen', 'vomiting blood', 'hematemesis', 'black tarry stool', 'melena', 'acute surgical abdomen'],
    urgency: 'EMERGENCY',
    actionAr: 'امتنع عن تناول أي طعام أو شراب وتوجه فوراً لقسم الطوارئ.',
    actionEn: 'Do not eat or drink anything; proceed immediately to emergency surgery triage.',
    category: 'ABDOMINAL',
  },
  {
    id: 'rf-infection-meningism',
    nameAr: 'حمى عالية مع تيبس بالرقبة وحساسية من الضوء أو طفح جلدي قرمزي',
    nameEn: 'High fever with neck stiffness, photophobia or non-blanching rash',
    keywordsAr: ['تيبس الرقبة مع حمى', 'الم في الرقبة مع حرارة عالية', 'التهاب السحايا', 'حساسية من الضوء مع سخونة'],
    keywordsEn: ['fever with stiff neck', 'neck stiffness with fever', 'meningitis signs', 'photophobia with high fever'],
    urgency: 'EMERGENCY',
    actionAr: 'اشتباه بالتهاب سحايا حاد - يتطلب مضادات حيوية وتقييم طارئ فوري.',
    actionEn: 'Suspected acute meningitis - urgent antibiotic evaluation in ER required.',
    category: 'INFECTION',
  },
  {
    id: 'rf-psych-suicidal',
    nameAr: 'أفكار إيذاء النفس أو أفكار انتحارية وشيكة',
    nameEn: 'Imminent suicidal ideation or self-harm intent',
    keywordsAr: ['افكار انتحارية', 'اريد انهاء حياتي', 'ايذاء النفس', 'الانتحار'],
    keywordsEn: ['suicidal ideation', 'want to end my life', 'kill myself', 'self-harm'],
    urgency: 'EMERGENCY',
    actionAr: 'اتصل فوراً بخط الدعم النفسي الطارئ (في السعودية: 937 أو مركز إرادة 1955) أو توجه للطوارئ.',
    actionEn: 'Call mental health emergency crisis hotline immediately or visit the nearest ER.',
    category: 'PSYCHIATRIC',
  },
  {
    id: 'rf-anaphylaxis-allergy',
    nameAr: 'صدمة تحسسية حادة (تورم الشفاه/اللسان مع صعوبة بلع وتنفس بعد طعام أو دواء)',
    nameEn: 'Acute Anaphylaxis (Angioedema, tongue swelling, wheezing post exposure)',
    keywordsAr: ['حساسية مفرطة', 'تورم اللسان', 'انتفاخ الحلق', 'صدمة تحسسية', 'تورم الشفتين وصعوبة بلع'],
    keywordsEn: ['anaphylaxis', 'tongue swelling', 'throat swelling', 'cannot swallow after sting', 'severe allergic reaction'],
    urgency: 'EMERGENCY',
    actionAr: 'استخدم قلم الإبينفرين (EpiPen) إن وجد وتوجه فوراً للطوارئ.',
    actionEn: 'Administer Epinephrine autoinjector if available and seek immediate emergency care.',
    category: 'TOXICOLOGY',
  },
  // Urgent Rules (Needs evaluation within 12-24h)
  {
    id: 'rf-urgent-high-fever-child',
    nameAr: 'حمى مستمرة لا تستجيب للخافض أكثر من 48 ساعة أو خمول شديد',
    nameEn: 'Persistent high fever unresponsive to antipyretics > 48h with lethargy',
    keywordsAr: ['حمى مستمرة', 'حرارة لا تنزل', 'خمول شديد مع حرارة', 'حرارة منذ 3 ايام'],
    keywordsEn: ['persistent fever', 'fever over 3 days', 'fever unresponsive to medication'],
    urgency: 'URGENT',
    actionAr: 'ينصح بمراجعة مركز الرعاية العاجلة أو طبيب الأسرة خلال 12-24 ساعة.',
    actionEn: 'Urgent evaluation by a primary care physician or urgent care center within 12-24h is advised.',
    category: 'INFECTION',
  },
  {
    id: 'rf-urgent-kidney-colic',
    nameAr: 'مغص كلوي حاد ومفاجئ في الخاصرة مع حرقة بول أو دم بالبول',
    nameEn: 'Acute renal colic / severe flank pain with hematuria',
    keywordsAr: ['مغص كلوي', 'الم حاد في الخاصرة', 'دم في البول مع الم شديد', 'حصوة كلى حادة'],
    keywordsEn: ['renal colic', 'severe flank pain', 'blood in urine with pain', 'kidney stone pain'],
    urgency: 'URGENT',
    actionAr: 'يتطلب فحصاً سريرياً وسونار للمسالك البولية وتسكين مناسب.',
    actionEn: 'Requires urgent clinical evaluation, ultrasound, and targeted analgesic management.',
    category: 'ABDOMINAL',
  }
];

export function detectRedFlags(text: string): RedFlagRule[] {
  const normalized = text.toLowerCase();
  const matched: RedFlagRule[] = [];

  for (const rule of RED_FLAG_RULES) {
    const matchedAr = rule.keywordsAr.some(kw => normalized.includes(kw.toLowerCase()));
    const matchedEn = rule.keywordsEn.some(kw => normalized.includes(kw.toLowerCase()));
    if (matchedAr || matchedEn) {
      matched.push(rule);
    }
  }

  return matched;
}

export function evaluateVitalSigns(vitals?: VitalSignInput): {
  flags: Array<{ nameAr: string; nameEn: string; urgency: TriageUrgency; actionAr: string; actionEn: string }>;
  highestUrgency: TriageUrgency;
} {
  const flags: Array<{ nameAr: string; nameEn: string; urgency: TriageUrgency; actionAr: string; actionEn: string }> = [];
  let highestUrgency: TriageUrgency = 'SELF_CARE';

  const upgradeUrgency = (target: TriageUrgency) => {
    const rank: Record<TriageUrgency, number> = {
      SELF_CARE: 1,
      ROUTINE: 2,
      URGENT: 3,
      EMERGENCY: 4
    };
    if (rank[target] > rank[highestUrgency]) {
      highestUrgency = target;
    }
  };

  if (!vitals) {
    return { flags, highestUrgency };
  }

  // SpO2 check
  if (vitals.spO2 !== undefined && vitals.spO2 < 90) {
    flags.push({
      nameAr: `تشبع أكسجين منخفض حرج (${vitals.spO2}%)`,
      nameEn: `Critically low Oxygen Saturation (${vitals.spO2}%)`,
      urgency: 'EMERGENCY',
      actionAr: 'يتطلب أكسجين طارئ وتقييم رئوي فوري في المستشفى.',
      actionEn: 'Requires emergency oxygen and immediate hospital evaluation.',
    });
    upgradeUrgency('EMERGENCY');
  } else if (vitals.spO2 !== undefined && vitals.spO2 < 94) {
    flags.push({
      nameAr: `تشبع أكسجين دون المستوى الطبيعي (${vitals.spO2}%)`,
      nameEn: `Suboptimal Oxygen Saturation (${vitals.spO2}%)`,
      urgency: 'URGENT',
      actionAr: 'مراجعة الطبيب لتقييم وظائف الرئة والمسالك الهوائية.',
      actionEn: 'Prompt clinical evaluation of respiratory function indicated.',
    });
    upgradeUrgency('URGENT');
  }

  // Blood Pressure
  if (vitals.systolicBP !== undefined) {
    if (vitals.systolicBP >= 180 || (vitals.diastolicBP && vitals.diastolicBP >= 120)) {
      flags.push({
        nameAr: `ارتفاع حاد في ضغط الدم (${vitals.systolicBP}/${vitals.diastolicBP || '-'}) - نوبة فرط ضغط الدم`,
        nameEn: `Hypertensive Crisis range (${vitals.systolicBP}/${vitals.diastolicBP || '-'} mmHg)`,
        urgency: 'EMERGENCY',
        actionAr: 'توجه فوراً للطوارئ لتفادي المضاعفات القلبية والدماغية.',
        actionEn: 'Seek immediate emergency medical evaluation.',
      });
      upgradeUrgency('EMERGENCY');
    } else if (vitals.systolicBP < 90) {
      flags.push({
        nameAr: `هبوط حاد في ضغط الدم (${vitals.systolicBP} ملم زئبق)`,
        nameEn: `Severe Hypotension (${vitals.systolicBP} mmHg)`,
        urgency: 'URGENT',
        actionAr: 'استلقِ مع رفع القدمين ومراجعة الرعاية الطبية فوراً.',
        actionEn: 'Elevate legs and seek immediate clinical assessment.',
      });
      upgradeUrgency('URGENT');
    }
  }

  // Heart Rate
  if (vitals.heartRate !== undefined) {
    if (vitals.heartRate > 130 || vitals.heartRate < 45) {
      flags.push({
        nameAr: `اضطراب شديد في نبضات القلب (${vitals.heartRate} ن/د)`,
        nameEn: `Significant Arrhythmia/Rate anomaly (${vitals.heartRate} bpm)`,
        urgency: 'EMERGENCY',
        actionAr: 'تخطيط قلب كهربائي عاجل (ECG) مطلوب.',
        actionEn: 'Urgent 12-lead ECG evaluation required.',
      });
      upgradeUrgency('EMERGENCY');
    }
  }

  // Temperature
  if (vitals.temperature !== undefined && vitals.temperature >= 40.0) {
    flags.push({
      nameAr: `حمى شديدة مفرطة (${vitals.temperature}°م)`,
      nameEn: `Hyperpyrexia (${vitals.temperature}°C)`,
      urgency: 'URGENT',
      actionAr: 'تخفيض الحرارة ومراجعة الطبيب لاستقصاء مصدر العدوى.',
      actionEn: 'Urgent evaluation for source of severe infection.',
    });
    upgradeUrgency('URGENT');
  }

  return { flags, highestUrgency };
}

export function determineTriageCategory(
  redFlags: RedFlagRule[],
  vitalFlags: Array<{ urgency: TriageUrgency }>,
  severity?: string,
  painScale?: number
): TriageUrgency {
  if (redFlags.some(r => r.urgency === 'EMERGENCY') || vitalFlags.some(v => v.urgency === 'EMERGENCY')) {
    return 'EMERGENCY';
  }
  if (redFlags.some(r => r.urgency === 'URGENT') || vitalFlags.some(v => v.urgency === 'URGENT') || severity === 'CRITICAL' || (painScale && painScale >= 8)) {
    return 'URGENT';
  }
  if (severity === 'MODERATE' || (painScale && painScale >= 4)) {
    return 'ROUTINE';
  }
  return 'SELF_CARE';
}
