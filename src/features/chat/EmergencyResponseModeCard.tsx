import React from 'react';
import {
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  ShieldX,
  HeartPulse,
  DoorOpen,
  Wind,
  Ban,
  Clock,
} from 'lucide-react';
import { EmergencyResponseModePayload, TriggeredSafetyRuleSummary } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface EmergencyResponseModeCardProps {
  payload?: EmergencyResponseModePayload;
  triggeredRules?: TriggeredSafetyRuleSummary[];
  clinicalExplanationAr?: string;
  clinicalExplanationEn?: string;
  recommendedActionAr?: string;
  recommendedActionEn?: string;
  safeWaitingStepsAr?: string[];
  safeWaitingStepsEn?: string[];
  timestamp?: string;
}

export const EmergencyResponseModeCard: React.FC<EmergencyResponseModeCardProps> = ({
  payload,
  triggeredRules,
  clinicalExplanationAr,
  clinicalExplanationEn,
  recommendedActionAr,
  recommendedActionEn,
  safeWaitingStepsAr,
  safeWaitingStepsEn,
  timestamp,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const alertTitle = payload
    ? (isAr ? payload.alertBannerAr : payload.alertBannerEn)
    : (isAr ? '⚠️ تنبيه سريري حرج — نمط طوارئ السلامة الطبية (Emergency Mode)' : '⚠️ Critical Safety Alert — Emergency Response Mode');

  const reason = payload
    ? (isAr ? payload.reasonForConcernAr : payload.reasonForConcernEn)
    : (isAr ? clinicalExplanationAr : clinicalExplanationEn) ||
      (isAr
        ? 'تم رصد مؤشرات حرجة تستدعي التقييم الإسعافي الفوري لاستبعاد المضاعفات الوعائية أو التنفسية الحادة.'
        : 'Critical red flags detected requiring urgent hospital assessment.');

  const guidance = payload
    ? (isAr ? payload.urgentGuidanceAr : payload.urgentGuidanceEn)
    : (isAr ? recommendedActionAr : recommendedActionEn) ||
      (isAr
        ? 'اتصل فوراً برقم الإسعاف (997 أو 911) أو توجه فوراً لأقرب قسم طوارئ في مستشفى.'
        : 'Call emergency services (997/911) immediately or head to the nearest Emergency Department.');

  const waitingSteps = (isAr
    ? (payload?.safeWaitingStepsAr || safeWaitingStepsAr)
    : (payload?.safeWaitingStepsEn || safeWaitingStepsEn)) || [
    isAr
      ? 'التوقف الفوري عن أي مجهود بدني والجلوس بوضعية نصف جالسة مريحة.'
      : 'Cease physical activity and rest in a semi-upright seated posture.',
    isAr
      ? 'فك أي ملابس أو أربطة ضيقة حول العنق والصدر لضمان تدفق الهواء.'
      : 'Loosen tight clothing around neck and chest.',
    isAr
      ? 'فتح باب المنزل الخارجي لتسهيل وسرعة دخول فريق المسعفين.'
      : 'Unlock front door for fast paramedic entry.',
    isAr
      ? 'التنفس بهدوء وبطء والبقاء برفقة مرافق إن أمكن.'
      : 'Breathe slowly and stay accompanied if possible.',
    isAr
      ? 'الامتناع التام عن تناول أي طعام، شراب، أو مسكنات قوية غير موصوفة.'
      : 'Strictly avoid food, liquids, or unprescribed analgesics.',
  ];

  const restrictedWarning = payload
    ? (isAr ? payload.restrictedWarningAr : payload.restrictedWarningEn)
    : (isAr
        ? 'ملاحظة سلامة ملزمة: يمتنع النظام تماماً عن تقديم أي إجراءات طبية متقدمة أو إعطاء أدوية ذاتية في هذه المرحلة لحماية حياتك.'
        : 'Safety Mandate: The system strictly avoids recommending advanced interventions or unprescribed medication.');

  return (
    <div className="rounded-2xl border-2 border-rose-500 bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 text-slate-100 shadow-2xl p-4 sm:p-5 space-y-4">
      {/* 1. Header Alert Banner */}
      <div className="flex items-start gap-3 border-b border-rose-500/40 pb-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-400 flex items-center justify-center shrink-0 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-black uppercase tracking-wide">
              {isAr ? 'قاطع أمان مفعل' : 'CIRCUIT BREAKER'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-600/50 text-[10px] font-mono">
              LEVEL: EMERGENCY
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-rose-200 mt-1 leading-snug">
            {alertTitle}
          </h3>
          <p className="text-xs text-rose-300/90 mt-0.5">
            {isAr
              ? 'تم تجاوز الرد الذكي المعتاد وتفعيل بروتوكول حماية المريض الإلزامي بالأولوية القصوى.'
              : 'Standard conversational AI bypassed: High-priority clinical safety protocol enforced.'}
          </p>
        </div>
      </div>

      {/* 2. Reason for Concern */}
      <div className="rounded-xl bg-rose-950/40 border border-rose-600/40 p-3.5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{isAr ? 'سبب وجود القلق السريري:' : 'Reason for Clinical Concern:'}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed ps-6 whitespace-pre-line font-medium">
          {reason}
        </p>

        {/* Triggered Rule Chips */}
        {triggeredRules && triggeredRules.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 ps-6">
            {triggeredRules.map((rule) => (
              <span
                key={rule.ruleId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-900/60 border border-rose-600/50 text-rose-200 text-[10px] font-mono"
              >
                <span>{rule.ruleId}</span>
                <span>•</span>
                <span>{isAr ? rule.nameAr : rule.nameEn}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Direct Emergency Action Guidance with Clickable Calls */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/80 p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
          <HeartPulse className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{isAr ? 'توجيه طلب المساعدة العاجلة:' : 'Urgent Medical Guidance:'}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed ps-6">
          {guidance}
        </p>

        {/* Action Call Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-1 ps-6">
          <a
            href="tel:997"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition-all shadow-lg hover:shadow-rose-600/30 active:scale-95"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>{isAr ? 'اتصال فوري بالإسعاف (997)' : 'Call Ambulance (997)'}</span>
          </a>

          <a
            href="tel:911"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span>{isAr ? 'رقم الطوارئ الموحد (911)' : 'Universal Emergency (911)'}</span>
          </a>
        </div>
      </div>

      {/* 4. Safe General Steps While Awaiting Medical Assistance */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isAr
              ? 'خطوات عامة وآمنة أثناء انتظار وصول الإسعاف:'
              : 'Safe General Steps While Awaiting Medical Team:'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
          {waitingSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                {idx + 1}
              </span>
              <span className="leading-snug">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Negative Constraint Notice: No Advanced Medical Procedures */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-amber-500/30 text-amber-200/90 text-xs">
        <Ban className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          {restrictedWarning}
        </p>
      </div>

      {timestamp && (
        <div className="text-[10px] text-slate-400 text-end font-mono">
          {timestamp}
        </div>
      )}
    </div>
  );
};
