import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Lock,
  Layers,
  ArrowDown,
  Database,
  Cpu,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export const SafetyPipelineInspector: React.FC = () => {
  const { language } = useLanguage();

  const stages = [
    {
      num: 1,
      titleAr: '1. استلام وتدقيق المدخلات (Input Parsing & Validation)',
      titleEn: '1. Input Parsing & Sanitization',
      descAr: 'فحص نص الأعراض، مدتها، درجة الألم (1-10)، والأعراض المصاحبة والتحقق من اكتمال البيانات الأساسية.',
      descEn: 'Validates symptom narrative, duration, pain scale (1-10), and accompanying symptoms.'
    },
    {
      num: 2,
      titleAr: '2. دمج السياق السريري للمريض (Clinical Context Integration)',
      titleEn: '2. Clinical Context Integration',
      descAr: 'استرجاع ملف المريض تلقائياً: الأمراض المزمنة، قائمة الأدوية الفعالة، وسجل الحساسية الدوائية لتقييم المخاطر.',
      descEn: 'Seamlessly merges patient demographics, chronic comorbidities, current medications, and known allergies.'
    },
    {
      num: 3,
      titleAr: '3. رصد علامات الخطر الحرجة (Deterministic Red Flag Scanner)',
      titleEn: '3. Deterministic Red Flag Detection',
      descAr: 'مسح فوري بقواعد محددة صارمة لاستكشاف الحالات المهددة للحياة (ألم الصدر القلبي، السكتة FAST، ضيق التنفس الحاد، والحرارة مع تيبس الرقبة).',
      descEn: 'Instant rule-based scan for life-threatening acute red flags (cardiac chest pain, stroke, severe dyspnea).'
    },
    {
      num: 4,
      titleAr: '4. تصنيف الفرز الطبي (Safety Classification & Triage)',
      titleEn: '4. Safety Classification & Triage',
      descAr: 'تحديد مستوى الاستعجال الطبي بدقة: طوارئ فورية (أحمر) | رعاية عاجلة 12-24 ساعة (برتقالي) | عيادة روتينية (أصفر) | رعاية ذاتية (أخضر).',
      descEn: 'Categorizes urgency level: Immediate Emergency (Red) | Urgent 12-24h (Orange) | Routine (Yellow) | Self-Care (Green).'
    },
    {
      num: 5,
      titleAr: '5. استرجاع الأدلة السريرية المعتمدة (Evidence Retrieval / RAG)',
      titleEn: '5. Evidence Retrieval & RAG',
      descAr: 'ربط الحالة بمكتبة الأدلة المعتمدة من منظمة الصحة العالمية (WHO) والمعهد الوطني للتميز السريري (NICE) دون أي اختلاق لمصادر وهمية.',
      descEn: 'Extracts validated clinical practice guidelines (WHO, NICE, CDC, FDA) with zero source hallucination.'
    },
    {
      num: 6,
      titleAr: '6. الاستدلال الطبي عالي التفكير (AI Deep Clinical Reasoning)',
      titleEn: '6. AI Deep Clinical Reasoning',
      descAr: 'استدعاء نموذج الاستدلال العالي (Gemini 3.1 Pro Thinking Mode) لتوليد التشخيص التفريقي التقديري وصياغة المسوغات السريرية.',
      descEn: 'Executes high-thinking medical reasoning to generate probabilistic differentials and clinical rationales.'
    },
    {
      num: 7,
      titleAr: '7. حواجز الأمان ومراقبة المخرجات (Safe Response Guardrails)',
      titleEn: '7. Safe Response Guardrails & Output Enforcement',
      descAr: 'إلزام الصياغة الاحتمالية ("قد يتوافق مع / أحد الاحتمالات")، منع التشخيص الجازم، وتضمين أسئلة الطبيب وإرشادات الطوارئ.',
      descEn: 'Enforces probabilistic language, strips definitive diagnostic claims, and appends physician questions and disclaimers.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {language === 'ar' ? 'محرك الأمان السريري ومعمارية النظام' : 'Clinical Safety Engine & Architectural Transparency'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'توثيق المعمارية البرمجية والمسار المنطقي الصارم الذي تمر عبره كل استشارة طبية'
                : 'Complete transparency into the 7-stage guarded clinical safety workflow'}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Stepper Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>{language === 'ar' ? 'مسار الفحص السريري ذو المراحل السبع (The 7-Stage Clinical Pipeline):' : 'The 7-Stage Clinical Safety Pipeline:'}</span>
        </h2>

        <div className="space-y-3">
          {stages.map((st, idx) => (
            <div
              key={st.num}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-4 hover:border-teal-500/40 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                {st.num}
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-xs font-bold text-white">
                  {language === 'ar' ? st.titleAr : st.titleEn}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ar' ? st.descAr : st.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Safety & Architectural Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'أمان المفاتيح والبيانات' : 'Zero Client-Side Keys'}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'ar'
              ? 'تتم كافة استدعاءات نماذج الذكاء الاصطناعي من خلال خادم Express الخلفي فقط. لا توجد أي مفاتيح API في المتصفح.'
              : 'All Gemini API reasoning calls execute exclusively on the server side with strict header telemetry.'}
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{language === 'ar' ? 'صياغة احتمالية ملزمة' : 'Strict Probabilistic Language'}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'ar'
              ? 'يُحظر على النظام إصدار تشخيصات جازمة، ويُستخدم حصراً صياغات مثل: "قد يتوافق مع" و"أحد الاحتمالات السريرية".'
              : 'The system never claims definitive diagnosis, phrasing outcomes as probabilistic differentials.'}
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'نزاهة الأدلة والمراجع' : 'Zero Source Hallucination'}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'ar'
              ? 'تعتمد المنصة حصراً على إرشادات سريرية رسمية ومسجلة (NICE, WHO, CDC, FDA) مع أرقامها الحقيقية.'
              : 'Every cited guideline corresponds to actual published clinical guidance with legitimate IDs.'}
          </p>
        </div>
      </div>
    </div>
  );
};
