/**
 * OmniDoctor Site Configuration & Clinical Metadata
 */

export interface NavItem {
  id: string;
  labelAr: string;
  labelEn: string;
  iconName: string;
  descriptionAr: string;
  descriptionEn: string;
  badge?: string;
}

export const SITE_CONFIG = {
  name: 'OmniDoctor AI',
  nameAr: 'أومني دكتور الذكي',
  version: '2.4.0',
  descriptionAr: 'طبيبك الذكي لفهم صحتك بشكل أفضل عبر خوارزميات الفرز السريري الآمن والأدلة الطبية المعتمدة.',
  descriptionEn: 'Your intelligent health copilot for understanding symptoms, tracking vitals, and accessing verified medical evidence.',
  emergencyNumberKSA: '997',
  emergencyNumberUniversal: '911',
  supportEmail: 'care@omnidoctor.ai',
};

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'home',
    labelAr: 'الرئيسية',
    labelEn: 'Home',
    iconName: 'Home',
    descriptionAr: 'نظرة عامة واستكشاف خدمات المنصة',
    descriptionEn: 'Platform overview and key features',
  },
  {
    id: 'assistant',
    labelAr: 'المساعد الصحي',
    labelEn: 'AI Assistant',
    iconName: 'Bot',
    descriptionAr: 'حوار طبي تفاعلي موجه ومدعم سريرياً',
    descriptionEn: 'Guarded interactive clinical dialogue',
    badge: 'Gemini 3.1',
  },
  {
    id: 'triage',
    labelAr: 'تحليل الأعراض',
    labelEn: 'Symptom Triage',
    iconName: 'Stethoscope',
    descriptionAr: 'فرز سريري آمن ورصد فوري لعلامات الخطر',
    descriptionEn: 'Evidence-based triage and red-flag scanner',
    badge: '7-Stage',
  },
  {
    id: 'health',
    labelAr: 'صحتي',
    labelEn: 'My Health',
    iconName: 'HeartPulse',
    descriptionAr: 'الملف الصحي والمؤشرات الحيوية والتاريخ المرضي',
    descriptionEn: 'Health profile, vitals and medical history',
  },
  {
    id: 'drugs',
    labelAr: 'الأدوية',
    labelEn: 'Medications',
    iconName: 'Pill',
    descriptionAr: 'فاحص التعارضات والتفاعلات الدوائية المعتمد',
    descriptionEn: 'FDA & BNF verified drug safety checker',
  },
  {
    id: 'labs',
    labelAr: 'التحاليل',
    labelEn: 'Lab Reports',
    iconName: 'FlaskConical',
    descriptionAr: 'تفسير نتائج الفحوصات والتحاليل المخبرية',
    descriptionEn: 'Biomarker ranges and clinical correlation',
  },
  {
    id: 'evidence',
    labelAr: 'المصادر',
    labelEn: 'Evidence Library',
    iconName: 'BookOpen',
    descriptionAr: 'إرشادات وأدلة منظمة الصحة العالمية والمعهد البريطاني',
    descriptionEn: 'WHO, NICE, and MoH verified guidelines',
  },
];

export const FOOTER_LINKS = {
  about: {
    titleAr: 'من نحن',
    titleEn: 'About OmniDoctor',
    contentAr: `منصة OmniDoctor AI هي مبادرة تقنية سريرية متقدمة تهدف إلى تمكين الأفراد من فهم أعراضهم وصحتهم بشكل أفضل عبر دمج الذكاء الاصطناعي عالي الاستدلال (Gemini 3.1 Pro) مع قواعد المعرفة السريرية المعتمدة من منظمة الصحة العالمية (WHO) والمعهد الوطني للتميز السريري (NICE).
تعتمد المنصة على محرك فرز حتمي يرصد علامات الخطر الحرجة ويقدم توجيهات أولية دقيقة مع الحفاظ التام على أسبقية الاستشارة الطبية المباشرة.`,
    contentEn: `OmniDoctor AI is an advanced clinical intelligence platform designed to empower individuals with evidence-backed health literacy, deterministic red-flag screening, and comprehensive medical record organization powered by state-of-the-art AI and clinical guidelines.`,
  },
  privacy: {
    titleAr: 'سياسة الخصوصية وأمان البيانات',
    titleEn: 'Privacy & Data Protection',
    contentAr: `نحن نولي سرية بياناتك الصحية الأولوية القصوى:
1. تشفير البيانات الحيوية والطبية بمعايير التشفير المتقدمة (AES-256).
2. عدم مشاركة أو بيع أي بيانات صحية لأي جهات تجارية أو إعلانية.
3. معالجة الاستفسارات السريرية بشكل مجهول الهوية مع إمكانية حذف السجلات في أي وقت.
4. الالتزام باللوائح والأنظمة الصحية لحماية خصوصية المرضى.`,
    contentEn: `Your clinical privacy is strictly safeguarded under enterprise-grade encryption (AES-256). Health inquiries are processed anonymously and are never sold or used for commercial advertising.`,
  },
  terms: {
    titleAr: 'الشروط والأحكام',
    titleEn: 'Terms of Service',
    contentAr: `باستخدامك لمنصة OmniDoctor AI، فإنك تقر وتوافق على:
1. المنصة هي وسيلة تثقيفية وداعمة للفرز السريري فقط.
2. لا تُشكل النتائج عقداً علاجياً أو بديلاً عن الفحص السريري للطبيب المرخص.
3. الالتزام بالاتصال بأرقام الطوارئ (997 أو 911) فوراً عند ظهور أعراض حادة مهددة للحياة.
4. دقة المعلومات المدخلة مسؤولية المستخدم لضمان ملاءمة التوجيه السريري التقديري.`,
    contentEn: `By using OmniDoctor AI, you acknowledge that the platform provides health literacy and triage guidance only, and is not a substitute for licensed clinical diagnosis or emergency services.`,
  },
  disclaimer: {
    titleAr: 'إخلاء المسؤولية الطبية السريرية',
    titleEn: 'Clinical Medical Disclaimer',
    contentAr: `⚠️ تنبيه طبي حاسم:
جميع المعلومات والتحليلات والنتائج المعروضة في منصة OmniDoctor AI مخصصة للأغراض التثقيفية ودعم الفرز الأولي فقط.
- المنصة لا تقدم تشخيصاً طبياً نهائياً أو وصفات علاجية رسمية.
- لا تتجاهل أبداً استشارة طبيبك المختص أو تأخر طلب الرعاية السريرية بسبب ما قرأته على هذه المنصة.
- إذا كنت تعاني من ألم صدري حاد، صعوبة مفاجئة في التنفس، علامات السكتة الدماغية (FAST)، أو نزيف حاد، اتصل فوراً بالإسعاف (997 في السعودية / 911 دولياً).`,
    contentEn: `⚠️ CRITICAL CLINICAL DISCLAIMER:
All evaluations, triage classifications, and information provided by OmniDoctor AI are strictly for educational and clinical decision support purposes. They do not constitute formal medical diagnoses or prescriptions. Always consult a qualified healthcare professional. Call 911 / 997 immediately in medical emergencies.`,
  },
  contact: {
    titleAr: 'تواصل معنا والدعم الطبي',
    titleEn: 'Contact & Clinical Support',
    contentAr: `يسعدنا التواصل معك عبر القنوات التالية:
- البريد الإلكتروني الطبي: care@omnidoctor.ai
- الدعم الفني: support@omnidoctor.ai
- مركز الاستجابة السريرية: متاح على مدار الساعة للحالات التنسيقية والملاحظات التطويرية.`,
    contentEn: `Reach our clinical informatics & support team at care@omnidoctor.ai or support@omnidoctor.ai.`,
  },
};
