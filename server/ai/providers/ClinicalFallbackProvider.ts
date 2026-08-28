import {
  AIProvider,
  ClinicalDialogueRequest,
  ClinicalDialogueResponse,
  ExtractedClinicalAttributes,
  NextFollowUpQuestion,
  ClinicalConversationContext,
} from './AIProvider.js';
import { detectRedFlags } from '../../safety/redFlagEngine.js';
import { retrieveRelevantEvidence } from '../../rag/evidenceRetriever.js';
import { TriageUrgency } from '../../types/medical.js';

export class ClinicalFallbackProvider implements AIProvider {
  readonly name = 'OmniDoctor Clinical Evidence & Rules Provider (Safety Fallback)';

  isAvailable(): boolean {
    return true; // Always available
  }

  async processClinicalDialogue(
    request: ClinicalDialogueRequest
  ): Promise<ClinicalDialogueResponse> {
    const isAr = request.language !== 'en';
    const rawMsg = request.message.trim();
    const history = request.conversationHistory || [];
    const prevContext = request.clinicalContext;

    // 1. Red Flag Detection
    const detectedFlags = detectRedFlags(rawMsg);
    const redFlagsDetected = detectedFlags.map((rf) => ({
      nameAr: rf.nameAr,
      nameEn: rf.nameEn,
      urgency: rf.urgency,
      actionAr: rf.actionAr,
      actionEn: rf.actionEn,
    }));

    const isEmergency = redFlagsDetected.some((rf) => rf.urgency === 'EMERGENCY');

    // 2. Health Relevance & Intent Analysis
    const lower = rawMsg.toLowerCase();
    const nonHealthKeywords = [
      'طقس', 'برمجة', 'كرة', 'سياسة', 'اقتصاد', 'كود', 'رياضيات',
      'weather', 'code', 'football', 'crypto', 'recipe', 'movie'
    ];
    const isNonHealth =
      nonHealthKeywords.some((w) => lower.includes(w)) &&
      !/(ألم|صداع|وجع|حرارة|دواء|علاج|بطن|صدر|حبة|تحليل|سكر|ضغط|pain|fever|cough|medication|dose|bp)/i.test(rawMsg);

    let intent: ClinicalConversationContext['intent'] = 'SYMPTOM_INQUIRY';
    if (isNonHealth) {
      intent = 'NON_HEALTH';
    } else if (isEmergency) {
      intent = 'EMERGENCY_CRISIS';
    } else if (/(دواء|جرعة|تفاعل|حبوب|أقراص|مرهم|medication|drug|dose|contraindication|pill)/i.test(rawMsg)) {
      intent = 'MEDICATION_QUESTION';
    } else if (/(تحليل|فحص دم|مخبري|نتيجة|hba1c|wbc|crp|tsh|creatinine|lab|biomarker)/i.test(rawMsg)) {
      intent = 'LAB_EXPLANATION';
    } else if (/(سؤال لطبيبي|موعد طبيب|استشارة دكتور|questions for doctor|physician visit)/i.test(rawMsg)) {
      intent = 'DOCTOR_PREPARATION';
    } else if (prevContext && prevContext.primarySymptom) {
      intent = 'FOLLOW_UP_ANSWER';
    }

    // 3. Symptom Extraction & Categorization
    const extracted: ExtractedClinicalAttributes = {
      ...(prevContext?.extractedAttributes || {}),
    };

    // Primary Symptom mapping
    if (!extracted.primarySymptom || intent === 'SYMPTOM_INQUIRY') {
      if (/(بطن|مغص|معدة|قولون|أمعاء|خواصر|belly|abdomen|stomach|cramp)/i.test(rawMsg)) {
        extracted.primarySymptom = isAr ? 'ألم أو اضطراب في البطن' : 'Abdominal Pain & Cramping';
      } else if (/(رأس|صداع|شقيقة|دوار|دوخة|headache|migraine|dizzy)/i.test(rawMsg)) {
        extracted.primarySymptom = isAr ? 'صداع واضطراب في الرأس' : 'Headache / Cranial Discomfort';
      } else if (/(صدر|خفقان|نغزات|كتمة|ضيق تنفس|chest|palpitation|dyspnea)/i.test(rawMsg)) {
        extracted.primarySymptom = isAr ? 'انزعاج أو ضيق في منطقة الصدر/التنفس' : 'Chest Discomfort / Dyspnea';
      } else if (/(حرارة|سخونة|حمى|قشعريرة|fever|temperature|chills)/i.test(rawMsg)) {
        extracted.primarySymptom = isAr ? 'حمى وارتفاع درجة الحرارة' : 'Fever & Hyperthermia';
      } else if (/(حلق|لوز|بلعوم|سعال|كحة|رشح|throat|cough|flu|cold)/i.test(rawMsg)) {
        extracted.primarySymptom = isAr ? 'أعراض تنفسية علوية وسعال' : 'Upper Respiratory Symptoms & Cough';
      } else if (/(مفاصل|ظهر|عضلات|ركبة|فقرات|joint|back pain|muscle)/i.test(rawMsg)) {
        extracted.primarySymptom = isAr ? 'آلام عضلية ومفصلية' : 'Musculoskeletal / Back Pain';
      } else if (/(جلد|طفح|حكة|حبوب|بقع|rash|itching|skin)/i.test(rawMsg)) {
        extracted.primarySymptom = isAr ? 'طفح جلدي أو حكة' : 'Dermatological Rash & Pruritus';
      } else {
        extracted.primarySymptom = rawMsg.slice(0, 45);
      }
    }

    // Extract Onset / Duration
    if (/(منذ ساعتين|اليوم|الصباح|فجأة|امس|منذ يومين|أسبوع|شهر|منذ قليل|hours|days|weeks|yesterday|sudden)/i.test(rawMsg)) {
      extracted.onset = rawMsg;
    }

    // Extract Severity / Pain scale
    const numMatch = rawMsg.match(/([1-9]|10)(\s*(\/|\s*من\s*)\s*10)?/);
    if (numMatch && (lower.includes('شدة') || lower.includes('ألم') || lower.includes('scale') || lower.includes('10'))) {
      extracted.severity = parseInt(numMatch[1], 10);
    }

    // Extract Character / Nature
    if (/(نابض|عاصر|حارق|مغص|طعن|حاد|متقطع|مستمر|throbbing|crushing|burning|stabbing|cramping|intermittent|constant)/i.test(rawMsg)) {
      extracted.character = rawMsg;
    }

    // Extract Associated Symptoms
    const associated: string[] = extracted.associatedSymptoms ? [...extracted.associatedSymptoms] : [];
    if (/(حرارة|سخونة|fever)/i.test(rawMsg) && !associated.includes('حرارة')) associated.push(isAr ? 'ارتفاع حرارة' : 'Fever');
    if (/(غثيان|ترجيع|استفراغ|قيء|vomit|nausea)/i.test(rawMsg) && !associated.includes('قيء')) associated.push(isAr ? 'غثيان/قيء' : 'Nausea/Vomiting');
    if (/(إسهال|اسهال|diarrhea)/i.test(rawMsg) && !associated.includes('إسهال')) associated.push(isAr ? 'إسهال' : 'Diarrhea');
    if (/(إمساك|امساك|constipation)/i.test(rawMsg) && !associated.includes('إمساك')) associated.push(isAr ? 'إمساك' : 'Constipation');
    if (/(نزيف|دم|blood|bleeding)/i.test(rawMsg) && !associated.includes('نزيف')) associated.push(isAr ? 'نزيف/دم' : 'Bleeding');
    extracted.associatedSymptoms = associated;

    // 4. Missing Attributes Identification
    const missing: string[] = [];
    if (!extracted.onset) missing.push('onset');
    if (!extracted.location) missing.push('location');
    if (!extracted.character) missing.push('character');
    if (!extracted.severity) missing.push('severity');
    if (!extracted.associatedSymptoms || extracted.associatedSymptoms.length === 0) missing.push('associated_symptoms');

    // 5. Determine Urgency
    let urgency: TriageUrgency = 'ROUTINE';
    if (isEmergency) {
      urgency = 'EMERGENCY';
    } else if (redFlagsDetected.length > 0 || (extracted.severity && extracted.severity >= 8)) {
      urgency = 'URGENT';
    } else if (extracted.severity && extracted.severity <= 3 && missing.length <= 2) {
      urgency = 'SELF_CARE';
    }

    // 6. Progressive Follow-Up Questions (Ask the single most important question first)
    let nextFollowUp: NextFollowUpQuestion | undefined;
    let needsFollowUp = false;

    if (!isEmergency && !isNonHealth && missing.length > 0) {
      needsFollowUp = true;
      const primaryMissing = missing[0];

      if (primaryMissing === 'onset') {
        nextFollowUp = {
          attribute: 'onset',
          priority: 1,
          questionAr: 'متى بدأ هذا الألم أو العَرَض بالتحديد؟ وهل ظهر فجأة أم تدريجياً؟',
          questionEn: 'When exactly did this symptom start, and was the onset sudden or gradual?',
          quickOptionsAr: ['منذ أقل من ساعتين (مفاجئ)', 'منذ الصباح (4-8 ساعات)', 'منذ يوم أو يومين', 'مستمر منذ أكثر من أسبوع'],
          quickOptionsEn: ['< 2 hours ago (Sudden)', 'Since morning (4-8 hours)', '1-2 days ago', '> 1 week persistent'],
        };
      } else if (primaryMissing === 'location') {
        nextFollowUp = {
          attribute: 'location',
          priority: 2,
          questionAr: 'أين موضع الألم بالتحديد (أعلى/أسفل، يمين/يسار)؟ وهل ينتقل أو يشع لموضع آخر؟',
          questionEn: 'Where is the exact location (upper/lower, right/left), and does it radiate anywhere?',
          quickOptionsAr: ['أعلى البطن / المعدة', 'أسفل البطن جهة اليمين', 'منتصف البطن حول السرة', 'ألم عام منتشر'],
          quickOptionsEn: ['Upper abdomen / Epigastric', 'Lower right abdomen', 'Periumbilical (around navel)', 'Diffuse / Generalized'],
        };
      } else if (primaryMissing === 'character') {
        nextFollowUp = {
          attribute: 'character',
          priority: 3,
          questionAr: 'كيف تصف طبيعة الألم أو الإحساس؟',
          questionEn: 'How would you describe the character and sensation of the pain?',
          quickOptionsAr: ['مغص متقطع ونوبات', 'ألم حارق مثل الحموضة', 'ثقل وضغط مستمر', 'ألم حاد مثل الوخز'],
          quickOptionsEn: ['Crampy / Spasmodic waves', 'Burning / Acidic', 'Dull pressure / Heavy ache', 'Sharp / Stabbing'],
        };
      } else if (primaryMissing === 'severity') {
        nextFollowUp = {
          attribute: 'severity',
          priority: 4,
          questionAr: 'على مقياس من 1 إلى 10، كم تقدر شدة الألم حالياً؟',
          questionEn: 'On a scale from 1 to 10, how severe is the pain right now?',
          quickOptionsAr: ['خفيف (1 - 3)', 'متوسط يضايقني (4 - 6)', 'شديد يعيق الحركة (7 - 8)', 'شديد جداً لا يطاق (9 - 10)'],
          quickOptionsEn: ['Mild (1 - 3)', 'Moderate (4 - 6)', 'Severe (7 - 8)', 'Excruciating (9 - 10)'],
        };
      } else if (primaryMissing === 'associated_symptoms') {
        nextFollowUp = {
          attribute: 'associated_symptoms',
          priority: 5,
          questionAr: 'هل يصاحب الألم أي من الأعراض التالية: حرارة، قيء، إسهال، إمساك، أو أي نزيف؟',
          questionEn: 'Are you experiencing any accompanying symptoms: fever, vomiting, diarrhea, constipation, or bleeding?',
          quickOptionsAr: ['يوجد غثيان / ترجيع', 'يوجد إسهال وحرارة خفيفة', 'يوجد إمساك وانتفاخ', 'لا توجد أعراض مصاحبة'],
          quickOptionsEn: ['Nausea / Vomiting present', 'Diarrhea & mild fever', 'Constipation & bloating', 'No other symptoms'],
        };
      }
    }

    // 7. Evidence Retrieval
    const evidenceRetrieved = retrieveRelevantEvidence(
      `${extracted.primarySymptom || rawMsg} ${extracted.associatedSymptoms?.join(' ') || ''}`
    );

    // 8. Generate Safe Structured Response
    let content = '';

    if (isNonHealth) {
      content = isAr
        ? 'مرحباً بك. أنا المساعد الصحي السريري في منصة OmniDoctor AI. اختصاصي ينصب على تقديم التقييم الصحي، فرز الأعراض، وشرح التفاعلات الدوائية والتحاليل الطبية وفق الأدلة المعتمدة. كيف يمكنني مساعدتك في شأنك الصحي اليوم؟'
        : 'Welcome. I am the OmniDoctor AI Clinical Assistant. My scope focuses exclusively on health guidance, symptom triage, medication safety, and lab interpretation. How may I assist you with your clinical or health concerns today?';
    } else if (isEmergency) {
      content = isAr
        ? `🚨 **تنبيه سريري فوري (حالة طارئة مهددة للحياة):**\n\nتم رصد مؤشرات تستدعي التدخل الإسعافي الفوري:\n` +
          redFlagsDetected.map((rf) => `• **${rf.nameAr}**: ${rf.actionAr}`).join('\n') +
          `\n\n📞 **الرجاء الاتصال بالإسعاف (997 أو 911) أو التوجه فوراً لأقرب قسم طوارئ وعدم قيادة المركبة بنفسك.**`
        : `🚨 **Immediate Clinical Emergency Alert:**\n\nCritical red-flag indicators detected requiring emergency dispatch:\n` +
          redFlagsDetected.map((rf) => `• **${rf.nameEn}**: ${rf.actionEn}`).join('\n') +
          `\n\n📞 **Please call 911 / 997 immediately or proceed to the nearest Emergency Department.**`;
    } else {
      const symptomLabel = extracted.primarySymptom || (isAr ? 'الأعراض المذكورة' : 'reported symptoms');
      
      let contextAcknowledgement = isAr
        ? `شكراً لمشاركتك. قمت بتسجيل شكوى **${symptomLabel}** ضمن سجلك السريري التفاعلي.`
        : `Thank you. I have logged **${symptomLabel}** in your structured clinical encounter context.`;

      if (extracted.associatedSymptoms && extracted.associatedSymptoms.length > 0) {
        contextAcknowledgement += isAr
          ? ` (مع ملاحظة الأعراض المصاحبة: ${extracted.associatedSymptoms.join('، ')})`
          : ` (Noted associated symptoms: ${extracted.associatedSymptoms.join(', ')})`;
      }

      let differentialContext = '';
      if (extracted.primarySymptom?.includes('بطن') || extracted.primarySymptom?.includes('Abdomen')) {
        differentialContext = isAr
          ? `\n\n📌 **التقييم السريري الأولي:** قد ترتبط آلام البطن باحتمالات متعددة مثل عسر الهضم والتهاب المعدة، متلازمة القولون العصبي، النزلات المعوية، أو أسباب موضعية أخرى تتطلب استبعاد الحالات الحادة.`
          : `\n\n📌 **Preliminary Clinical Context:** Abdominal discomfort commonly involves possibilities such as dyspepsia/gastritis, IBS, gastroenteritis, or localized acute conditions requiring clinical evaluation.`;
      } else if (extracted.primarySymptom?.includes('صداع') || extracted.primarySymptom?.includes('Headache')) {
        differentialContext = isAr
          ? `\n\n📌 **التقييم السريري الأولي:** تختلف أسباب الصداع بين الصداع التوتري، الصداع النصفي (الشقيقة)، والجيوب الأنفية أو الإجهاد، ويتم التركيز على استبعاد المؤشرات المفاجئة.`
          : `\n\n📌 **Preliminary Clinical Context:** Headaches frequently relate to tension, migraine variants, sinus pressure, or fatigue, with safety triage prioritizing sudden or neurological flags.`;
      }

      let nextStepPrompt = '';
      if (nextFollowUp) {
        nextStepPrompt = isAr
          ? `\n\n❓ **خطوة المتابعة الأهم حالياً:**\n${nextFollowUp.questionAr}`
          : `\n\n❓ **Highest-Priority Follow-Up Question:**\n${nextFollowUp.questionEn}`;
      } else {
        nextStepPrompt = isAr
          ? `\n\n✅ تم جمع العناصر السريرية الأساسية الأولية. يمكنك استعراض الفرز التفصيلي أو طرح استفسارات إضافية حول الأدوية أو الأسئلة الموجهة لطبيبك.`
          : `\n\n✅ Key clinical parameters gathered. You may review your structured triage differential or ask questions regarding medications or physician discussion points.`;
      }

      content = `${contextAcknowledgement}${differentialContext}${nextStepPrompt}`;
    }

    const questionsForDoctorAr = [
      'ما هي الفحوصات المخبرية أو التصويرية الموصى بها لتأكيد سبب هذه الأعراض؟',
      'ما هي المؤشرات التحذيرية التي تستوجب مراجعتي للطوارئ فوراً؟',
      'هل تتطلب حالتي تعديل نمط الحياة أو أي حمية غذائية معينة؟',
      'كم المدة المتوقعة للتحسن قبل إعادة التقييم الطبي؟',
    ];

    const questionsForDoctorEn = [
      'What diagnostic labs or imaging do you recommend to identify the underlying cause?',
      'What specific red-flag warning signs should prompt immediate emergency care?',
      'Are there dietary or lifestyle modifications indicated for this condition?',
      'What is the expected recovery timeframe before needing a follow-up review?',
    ];

    const suggestedTitle =
      extracted.primarySymptom ||
      (isAr ? `استشارة: ${rawMsg.slice(0, 30)}` : `Consultation: ${rawMsg.slice(0, 30)}`);

    return {
      conversationId: request.conversationId,
      messageId: 'msg_' + Math.random().toString(36).substring(2, 9),
      content,
      intent,
      isHealthRelated: !isNonHealth,
      extractedAttributes: extracted,
      missingAttributes: missing,
      redFlagsDetected,
      urgency,
      needsFollowUp,
      nextFollowUpQuestion: nextFollowUp,
      evidenceRetrieved,
      questionsForDoctorAr,
      questionsForDoctorEn,
      providerUsed: this.name,
      pipelineAudits: [
        {
          step: '1_INTENT_ANALYSIS',
          status: 'PASSED',
          detailsAr: `تحليل النية السريرية: ${intent} (مرتبطة بالصحة: ${!isNonHealth ? 'نعم' : 'لا'})`,
          detailsEn: `Intent categorized: ${intent} (Health-related: ${!isNonHealth})`,
        },
        {
          step: '2_SYMPTOM_EXTRACTION',
          status: 'PASSED',
          detailsAr: `استخراج العَرَض الرئيسي: "${extracted.primarySymptom || 'غير محدد'}" والمعطيات الناقصة: [${missing.join(', ')}]`,
          detailsEn: `Primary symptom: "${extracted.primarySymptom || 'N/A'}", Missing: [${missing.join(', ')}]`,
        },
        {
          step: '3_RED_FLAG_SCAN',
          status: redFlagsDetected.length > 0 ? 'TRIGGERED' : 'PASSED',
          detailsAr: `فحص علامات الخطر: تم رصد ${redFlagsDetected.length} مؤشر حرج`,
          detailsEn: `Red flag scan: ${redFlagsDetected.length} critical trigger(s) found`,
        },
        {
          step: '4_PROGRESSIVE_FOLLOW_UP',
          status: nextFollowUp ? 'APPLIED' : 'PASSED',
          detailsAr: nextFollowUp ? `طرح السؤال الأهم تدريجياً: ${nextFollowUp.attribute}` : 'اكتملت الأسئلة التمهيدية الأساسية',
          detailsEn: nextFollowUp ? `Progressive single question: ${nextFollowUp.attribute}` : 'Baseline parameters acquired',
        },
        {
          step: '5_EVIDENCE_SYNTHESIS',
          status: 'PASSED',
          detailsAr: `استرجاع ${evidenceRetrieved.length} مرجع سريري موثوق (NICE/WHO/MOH)`,
          detailsEn: `Retrieved ${evidenceRetrieved.length} clinical evidence sources`,
        },
      ],
      suggestedConversationTitle: suggestedTitle,
    };
  }
}
