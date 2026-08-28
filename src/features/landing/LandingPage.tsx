import React, { useState } from 'react';
import {
  Bot,
  Stethoscope,
  HeartPulse,
  Pill,
  FlaskConical,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Compass,
  Activity,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button, Card, CardTitle, CardDescription, Badge, Modal } from '../../components/ui/index.js';
import { NavigationTab } from '../../types/index.js';
import { FOOTER_LINKS } from '../../config/site.js';

interface LandingPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenEmergency: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenEmergency }) => {
  const { language, dir } = useLanguage();
  const [activeModalKey, setActiveModalKey] = useState<keyof typeof FOOTER_LINKS | null>(null);

  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const features = [
    {
      id: 'dashboard' as NavigationTab,
      titleAr: 'لوحة التحكم والمتابعة الصحية',
      titleEn: 'Clinical Health Dashboard',
      descAr: 'عرض ملخص فوري لآخر الاستشارات، الأعراض النشطة، الأدوية الحالية، سجل الحساسية، والملف الصحي.',
      descEn: 'Instant overview of recent clinical consultations, active symptoms, current meds, allergies, and health profile.',
      icon: <Activity className="w-6 h-6 text-emerald-400" />,
      tagAr: 'ملخص شامل',
      tagEn: 'Live Overview',
      color: 'emerald',
    },
    {
      id: 'health' as NavigationTab,
      titleAr: 'صحتي (السجل الطبي والجراحي)',
      titleEn: 'My Health & Medical History',
      descAr: 'ملف شخصي محمي للمعلومات الحيوية، الأمراض المزمنة، الحساسيات الخطرة، الأدوية، والعمليات السابقة.',
      descEn: 'Protected vault for personal biometrics, chronic conditions, critical allergies, medications, and surgical history.',
      icon: <HeartPulse className="w-6 h-6 text-rose-400" />,
      tagAr: 'سجل شخصي محمي',
      tagEn: 'Protected Vault',
      color: 'rose',
    },
    {
      id: 'triage' as NavigationTab,
      titleAr: 'تحليل الأعراض والفرز',
      titleEn: 'Symptom Triage & Analysis',
      descAr: 'فرز سريري آمن من 7 مراحل مع رصد حتمي لعلامات الخطر الحرجة وتصنيف درجة الاستعجال.',
      descEn: '7-stage evidence-based triage with deterministic red-flag detection and urgency classification.',
      icon: <Stethoscope className="w-6 h-6 text-teal-400" />,
      tagAr: 'رصد علامات الخطر',
      tagEn: 'Red-Flag Scanner',
      color: 'teal',
    },
    {
      id: 'assistant' as NavigationTab,
      titleAr: 'المساعد الصحي الذكي',
      titleEn: 'AI Health Assistant',
      descAr: 'محادثة إكلينيكية ذكية وموجهة لفهم الشكاوى الصحية وصياغة أسئلة دقيقة لطبيبك المعالج.',
      descEn: 'Intelligent clinical dialogue to clarify health concerns and prepare structured questions for your doctor.',
      icon: <Bot className="w-6 h-6 text-cyan-400" />,
      tagAr: 'ذكاء تفاعلي',
      tagEn: 'Interactive AI',
      color: 'cyan',
    },
    {
      id: 'drugs' as NavigationTab,
      titleAr: 'الأدوية وفاحص التفاعلات',
      titleEn: 'Medication Safety & Interactions',
      descAr: 'فحص فوري ودقيق لتعارضات الأدوية وتأثيراتها السريرية مستنداً إلى مراجع BNF و FDA.',
      descEn: 'Instant screening for drug-drug interactions and clinical contraindications backed by BNF & FDA.',
      icon: <Pill className="w-6 h-6 text-amber-400" />,
      tagAr: 'سلامة دوائية',
      tagEn: 'Pharmacology Safety',
      color: 'amber',
    },
    {
      id: 'labs' as NavigationTab,
      titleAr: 'تفسير التحاليل المخبرية',
      titleEn: 'Lab Biomarker Interpreter',
      descAr: 'تحليل قراءات السكر التراكمي ووظائف الكلى والدهون مع مقارنتها بالنطاقات السريرية المرجعية.',
      descEn: 'Accurate biomarker correlation and clinical reference range comparison for lab reports.',
      icon: <FlaskConical className="w-6 h-6 text-sky-400" />,
      tagAr: 'دلالات سريرية',
      tagEn: 'Clinical Insights',
      color: 'sky',
    },
    {
      id: 'evidence' as NavigationTab,
      titleAr: 'المصادر والإرشادات الطبية',
      titleEn: 'Verified Medical Guidelines',
      descAr: 'مكتبة موثوقة تستند حصرياً إلى إرشادات منظمة الصحة العالمية (WHO) والمعهد البريطاني (NICE).',
      descEn: 'Direct access to verified clinical guidelines from WHO, NICE, and accredited medical authorities.',
      icon: <BookOpen className="w-6 h-6 text-indigo-400" />,
      tagAr: 'أدلة معتمدة',
      tagEn: 'Accredited Evidence',
      color: 'indigo',
    },
  ];

  const safetyGuarantees = [
    {
      titleAr: 'فحص حتمي لعلامات الخطر (Red Flags)',
      titleEn: 'Deterministic Red Flag Protocol',
      descAr: 'يقوم النظام بمسح فوري لأعراض الطوارئ (مثل الذبحة الصدرية والسكتة الدماغية) لتوجيه المستخدم للإسعاف فوراً دون تأخير.',
      descEn: 'Real-time deterministic scanning for emergency red flags (chest pain, stroke symptoms) with immediate emergency rerouting.',
    },
    {
      titleAr: 'استدلال سريري احتمالي غير جازم',
      titleEn: 'Probabilistic Differential Reasoning',
      descAr: 'يعرض الذكاء الاصطناعي احتمالات تفريقية تقديرية مع مسوغاتها الطبية دون إصدار تشخيص قطعي أو وصفات دوائية.',
      descEn: 'Presents evidence-weighted differential possibilities without asserting definitive diagnoses or issuing prescriptions.',
    },
    {
      titleAr: 'استناد حصري إلى الأدلة المعتمدة (WHO & NICE)',
      titleEn: 'Rigorous Evidence Grounding',
      descAr: 'ربط كل استنتاج أو توصية سريرية بإرشادات طبية دولية موثقة وخالية من الاختلاق أو التكهنات.',
      descEn: 'Grounds every clinical insight directly in peer-reviewed clinical guidelines, eliminating medical hallucinations.',
    },
    {
      titleAr: 'تشفير كامل وحماية لخصوصية المريض',
      titleEn: 'Enterprise Data Privacy & Security',
      descAr: 'تشفير السجلات الحيوية والطبية بمعايير أمان عالية وعدم مشاركتها مع أي جهة خارجية.',
      descEn: 'End-to-end security protocols ensuring your clinical observations remain strictly private.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8 text-start animate-in fade-in duration-300">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/80 p-6 sm:p-12 lg:p-16 shadow-2xl">
        {/* Glow backdrop decorative effect */}
        <div className="absolute -top-32 start-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 end-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>
              {isAr
                ? 'المنصة السريرية الذكية المبنية على الأدلة الطبية v2.4'
                : 'Evidence-Based Clinical Intelligence Platform v2.4'}
            </span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight sm:leading-tight">
            {isAr ? 'طبيبك الذكي لفهم صحتك بشكل أفضل' : 'Your Intelligent Health Copilot'}
          </h1>

          {/* Hero Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'منصة ذكية تساعدك على فهم الأعراض وتنظيم معلوماتك الصحية والوصول إلى معلومات طبية مبنية على الأدلة.'
              : 'An intelligent medical platform to help you interpret symptoms, organize your health data, and access verified evidence-based clinical guidelines.'}
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              variant="primary"
              onClick={() => onNavigate('triage')}
              rightIcon={<ArrowIcon className="w-5 h-5" />}
              className="px-8 shadow-xl shadow-emerald-950/60"
            >
              {isAr ? 'ابدأ الآن' : 'Start Triage Now'}
            </Button>

            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                const el = document.getElementById('platform-features-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              leftIcon={<Compass className="w-5 h-5 text-slate-400" />}
            >
              {isAr ? 'اكتشف المنصة' : 'Explore Platform'}
            </Button>

            <Button
              size="lg"
              variant="emergency"
              onClick={onOpenEmergency}
              leftIcon={<PhoneCall className="w-5 h-5" />}
            >
              {isAr ? 'طوارئ الإسعاف (997)' : 'Emergency Call (911)'}
            </Button>
          </div>

          {/* Key Clinical Stats pill */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-slate-800/80">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-lg font-bold text-emerald-400 font-mono">7-Stage</div>
              <div className="text-[11px] text-slate-400">{isAr ? 'محرك فرز محمي' : 'Guarded Pipeline'}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-lg font-bold text-teal-400 font-mono">WHO & NICE</div>
              <div className="text-[11px] text-slate-400">{isAr ? 'أدلة إكلينيكية' : 'Clinical Standards'}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-lg font-bold text-sky-400 font-mono">FDA & BNF</div>
              <div className="text-[11px] text-slate-400">{isAr ? 'سلامة دوائية' : 'Drug Verification'}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-lg font-bold text-amber-400 font-mono">100% Zero</div>
              <div className="text-[11px] text-slate-400">{isAr ? 'انعدام للهلوسة' : 'No Hallucinations'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section id="platform-features-section" className="space-y-8 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="primary" size="md">
            {isAr ? 'قدرات المنصة الشاملة' : 'Core Capabilities'}
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            {isAr ? 'منظومة صحية سريرية متكاملة' : 'Integrated Clinical Ecosystem'}
          </h2>
          <p className="text-sm text-slate-400">
            {isAr
              ? 'أدوات متخصصة لمساعدتك على اتخاذ قرارات صحية واعية ومبنية على الأدلة الطبية'
              : 'Specialized modules to assist you in making informed, evidence-supported healthcare decisions'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((item) => (
            <Card
              key={item.id}
              variant="interactive"
              onClick={() => onNavigate(item.id)}
              className="group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <Badge variant="outline" size="sm">
                    {isAr ? item.tagAr : item.tagEn}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors">
                    {isAr ? item.titleAr : item.titleEn}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-slate-400">
                    {isAr ? item.descAr : item.descEn}
                  </CardDescription>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                <span>{isAr ? 'فتح الوحدة السريرية' : 'Open Module'}</span>
                <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. CLINICAL SAFETY SECTION */}
      <section className="rounded-3xl bg-slate-900/90 border-2 border-emerald-900/40 p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 end-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'الأمان السريري والمسؤولية الطبية' : 'Clinical Safety & Governance'}</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-bold text-white">
              {isAr
                ? 'OmniDoctor يساعد المستخدم على فهم المعلومات الصحية ولا يقدم تشخيصًا طبيًا مؤكدًا'
                : 'OmniDoctor empowers health literacy and does NOT provide definitive clinical diagnosis'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'تم تصميم المنصة وفق مبادئ السلامة السريرية المعتمدة لضمان عدم تأخير الرعاية الطبية، ورصد علامات الخطورة الحادة فوراً وتزويدك بالأسئلة والمصادر المناسبة لمناقشتها مع طبيبك المختص.'
                : 'Engineered with deterministic safety guardrails to ensure emergency symptoms are flagged immediately, providing structured clinical insights for consultation with licensed physicians.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
            {safetyGuarantees.map((guard, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <h4>{isAr ? guard.titleAr : guard.titleEn}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed ps-6.5">
                  {isAr ? guard.descAr : guard.descEn}
                </p>
              </div>
            ))}
          </div>

          {/* Urgent Call Out Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-red-950/40 border border-red-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-200">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-pulse" />
              <div>
                <h5 className="font-bold text-sm">
                  {isAr ? 'هل تعاني من حالة طارئة أو ألم صدري حاد؟' : 'Experiencing acute chest pain or emergency?'}
                </h5>
                <p className="text-xs text-red-300/80">
                  {isAr
                    ? 'لا تنتظر التحليل أو القراءة، اتصل فوراً بالإسعاف على رقم 997 (السعودية) أو 911.'
                    : 'Do not wait for AI triage. Call emergency services (911 or 997) immediately.'}
                </p>
              </div>
            </div>
            <Button
              variant="emergency"
              size="sm"
              onClick={onOpenEmergency}
              leftIcon={<PhoneCall className="w-4 h-4" />}
            >
              {isAr ? 'اتصال بالطوارئ' : 'Emergency Help'}
            </Button>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE FOOTER MODALS */}
      {activeModalKey && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModalKey(null)}
          title={isAr ? FOOTER_LINKS[activeModalKey].titleAr : FOOTER_LINKS[activeModalKey].titleEn}
          size="lg"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setActiveModalKey(null)}>
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line text-start">
            {isAr ? FOOTER_LINKS[activeModalKey].contentAr : FOOTER_LINKS[activeModalKey].contentEn}
          </div>
        </Modal>
      )}

      {/* 5. DEDICATED LANDING FOOTER */}
      <footer className="pt-8 border-t border-slate-800/80 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">OmniDoctor AI</span>
              <span className="text-xs text-slate-400 block">
                {isAr ? 'منصة الذكاء الصحي والفرز السريري' : 'Clinical Medical Intelligence'}
              </span>
            </div>
          </div>

          {/* Quick Footer Links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400">
            <button
              onClick={() => setActiveModalKey('about')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isAr ? 'من نحن' : 'About'}
            </button>
            <button
              onClick={() => setActiveModalKey('privacy')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
            <button
              onClick={() => setActiveModalKey('terms')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isAr ? 'الشروط والأحكام' : 'Terms of Service'}
            </button>
            <button
              onClick={() => setActiveModalKey('disclaimer')}
              className="hover:text-red-400 font-medium transition-colors cursor-pointer"
            >
              {isAr ? 'إخلاء المسؤولية الطبية' : 'Medical Disclaimer'}
            </button>
            <button
              onClick={() => setActiveModalKey('contact')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isAr ? 'تواصل معنا' : 'Contact Us'}
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-900">
          © {new Date().getFullYear()} OmniDoctor AI • WHO & NICE Clinical Standards • Powered by Gemini 3.1 Pro Clinical Engine
        </div>
      </footer>
    </div>
  );
};
