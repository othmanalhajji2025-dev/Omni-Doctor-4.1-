import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  ArrowRight,
  Stethoscope,
  HeartPulse,
  Share2,
  PhoneCall,
  Sparkles,
  Search
} from 'lucide-react';
import {
  ClinicalReasoningEncounter,
  DifferentialItem,
  MissingOLDCARTSElement,
} from '../types/index.js';

interface ClinicalReasoningSectionProps {
  encounter: ClinicalReasoningEncounter;
  language: 'ar' | 'en';
  onAnswerQuestion?: (field: string, answer: string) => void;
}

export const ClinicalReasoningSection: React.FC<ClinicalReasoningSectionProps> = ({
  encounter,
  language,
  onAnswerQuestion,
}) => {
  const isAr = language === 'ar';
  const [activeStepTab, setActiveStepTab] = useState<number>(7);
  const [activeExplainTab, setActiveExplainTab] = useState<'question' | 'urgency' | 'differentials'>('urgency');
  const [expandedDiffIdx, setExpandedDiffIdx] = useState<number | null>(0);

  const {
    step1CollectSymptoms,
    step2ClarifySymptoms,
    step3DetectRedFlags,
    step4GenerateDifferentials,
    step5EstimateUrgency,
    step6VerifyEvidence,
    step7GenerateSafeResponse,
    explainability,
  } = encounter;

  const finalResp = step7GenerateSafeResponse.finalResponse;
  const oldcarts = step2ClarifySymptoms.oldcarts;
  const missingElements = step2ClarifySymptoms.missingElements;
  const nextQ = step2ClarifySymptoms.nextPriorityQuestion;

  const oldcartsLabels: Array<{
    code: 'O' | 'L' | 'D' | 'C' | 'A' | 'R' | 'T' | 'S';
    key: keyof typeof oldcarts;
    labelAr: string;
    labelEn: string;
  }> = [
    { code: 'O', key: 'onset', labelAr: 'البداية (Onset)', labelEn: 'Onset' },
    { code: 'L', key: 'location', labelAr: 'الموقع (Location)', labelEn: 'Location' },
    { code: 'D', key: 'duration', labelAr: 'المدة (Duration)', labelEn: 'Duration' },
    { code: 'C', key: 'character', labelAr: 'الطبيعة (Character)', labelEn: 'Character' },
    { code: 'A', key: 'aggravatingFactors', labelAr: 'التفاقم (Aggravating)', labelEn: 'Aggravating' },
    { code: 'R', key: 'relievingFactors', labelAr: 'التخفيف (Relieving)', labelEn: 'Relieving' },
    { code: 'T', key: 'timing', labelAr: 'النمط (Timing)', labelEn: 'Timing' },
    { code: 'S', key: 'severity', labelAr: 'الشدة (Severity)', labelEn: 'Severity' },
  ];

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'EMERGENCY':
        return 'bg-red-500/20 text-red-300 border-red-500/60 ring-2 ring-red-500/30';
      case 'URGENT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/60';
      case 'ROUTINE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  const getConcernBadge = (concern: 'LOW' | 'MODERATE' | 'HIGH') => {
    switch (concern) {
      case 'HIGH':
        return {
          bg: 'bg-red-500/10 border-red-500/40 text-red-300',
          labelAr: 'أولوية استبعاد قصوى (High Concern)',
          labelEn: 'High Concern Rule-Out',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
          labelAr: 'قلق سريري متوسط (Moderate)',
          labelEn: 'Moderate Concern',
        };
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
          labelAr: 'احتمال حميد شائع (Low Concern)',
          labelEn: 'Low Concern (Common/Benign)',
        };
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* 1. Header with Protocol Identifier */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isAr ? 'طبقة التحليل السريري (Phase 4)' : 'Clinical Reasoning Layer (Phase 4)'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {encounter.encounterId}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              <span>
                {isAr
                  ? 'بروتوكول الاستدلال السريري ذو الخطوات السبع (7-Step Protocol)'
                  : '7-Step Clinical Reasoning Protocol & OLDCARTS'}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyBadgeColor(
                step5EstimateUrgency.urgency
              )}`}
            >
              {isAr ? step5EstimateUrgency.urgencyLabelAr : step5EstimateUrgency.urgencyLabelEn}
            </span>
          </div>
        </div>

        {/* 7-Step Horizontal Stepper Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { step: 1, nameAr: '1. جمع الأعراض', nameEn: '1. Collect' },
              { step: 2, nameAr: '2. استيضاح OLDCARTS', nameEn: '2. Clarify' },
              { step: 3, nameAr: '3. علامات الخطر', nameEn: '3. Red Flags' },
              { step: 4, nameAr: '4. الاحتمالات', nameEn: '4. Differentials' },
              { step: 5, nameAr: '5. تقدير الخطورة', nameEn: '5. Urgency' },
              { step: 6, nameAr: '6. فحص الأدلة', nameEn: '6. Evidence' },
              { step: 7, nameAr: '7. الرد السريري', nameEn: '7. Safe Response' },
            ].map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStepTab(s.step)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  activeStepTab === s.step
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {isAr ? s.nameAr : s.nameEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step View Portals when clicking specific steps (or Default to Full Synthesis) */}
      {activeStepTab === 2 && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in">
          <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>{isAr ? 'الخطوة 2: تحليل إطار OLDCARTS واستيضاح العناصر الناقصة' : 'Step 2: OLDCARTS Framework & Missing Elements'}</span>
          </h3>
          <p className="text-xs text-slate-300">
            {isAr
              ? 'يقوم النظام بتحليل مدخلات المريض واستخراج أبعاد العَرَض الثمانية، ولا يطرح أسئلة عشوائية بل يحدد فقط العناصر الناقصة ذات الصلة السريرية المهمة.'
              : 'The system extracts the 8 symptom dimensions and only prioritizes clinically pertinent missing elements.'}
          </p>
        </div>
      )}

      {/* 2. OLDCARTS Clinical Matrix Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              OL
            </div>
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'مصفوفة إطار OLDCARTS السريري' : 'OLDCARTS Clinical Dimension Matrix'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {isAr ? 'نظام فرز العناصر المكتشفة والناقصة' : 'Identified vs Missing Attributes'}
          </span>
        </div>

        {/* 8 Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {oldcartsLabels.map((item) => {
            const val = oldcarts[item.key];
            const isPresent = Boolean(
              val !== undefined &&
                val !== null &&
                (typeof val === 'string' ? val.trim().length > 0 : true) &&
                (Array.isArray(val) ? val.length > 0 : true)
            );

            return (
              <div
                key={item.code}
                className={`p-2.5 rounded-xl border transition-all text-center flex flex-col justify-between ${
                  isPresent
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center font-bold text-xs border border-slate-800">
                    {item.code}
                  </span>
                  {isPresent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-amber-400 font-semibold">ناقص</span>
                  )}
                </div>
                <div className="text-[11px] font-semibold truncate">
                  {isAr ? item.labelAr.split(' ')[0] : item.labelEn}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-1">
                  {isPresent
                    ? Array.isArray(val)
                      ? val[0]
                      : String(val)
                    : (isAr ? 'غير محدد' : 'Not stated')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Targeted Missing Follow-Up Question (Single Highest Priority) */}
        {nextQ && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>
                  {isAr
                    ? `سؤال الاستيضاح الأهم سريرياً [عنصر ${nextQ.code} - ${nextQ.labelAr}]`
                    : `Highest Yield Clarifying Question [Element ${nextQ.code}]`}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                {isAr ? 'أولوية قصوى' : 'Top Priority'}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-100">
              {isAr ? nextQ.questionAr : nextQ.questionEn}
            </p>

            {/* Explainability of the question: لماذا تم طرح هذا السؤال؟ */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <Info className="w-3.5 h-3.5" />
                <span>{isAr ? 'لماذا تم طرح هذا السؤال بالتحديد؟' : 'Why is this specific question asked?'}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {isAr ? nextQ.whyThisQuestionAr : nextQ.whyThisQuestionEn}
              </p>
            </div>

            {/* Quick Answer Options */}
            {nextQ.quickOptionsAr && nextQ.quickOptionsAr.length > 0 && onAnswerQuestion && (
              <div className="pt-2 flex flex-wrap gap-2">
                {(isAr ? nextQ.quickOptionsAr : nextQ.quickOptionsEn || []).map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => onAnswerQuestion(String(nextQ.field), opt)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 hover:border-emerald-500/50 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. EXPLAINABILITY INSPECTOR (The 3 Core Pillars) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'محرك التفسير والشفافية السريرية (Explainability Engine)' : 'Clinical Explainability Engine'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'فهم مبررات القرارات والأسئلة ومستوى الخطورة' : 'Clinical rationale behind decisions, questions, and urgency'}
              </p>
            </div>
          </div>

          {/* 3 Pillars Subtabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveExplainTab('urgency')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeExplainTab === 'urgency'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'لماذا رُفعت الخطورة؟' : 'Why Urgency?'}
            </button>
            <button
              type="button"
              onClick={() => setActiveExplainTab('differentials')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeExplainTab === 'differentials'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'لماذا ظهر الاحتمال؟' : 'Why Differentials?'}
            </button>
            {explainability.whyQuestionAsked && (
              <button
                type="button"
                onClick={() => setActiveExplainTab('question')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeExplainTab === 'question'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'لماذا هذا السؤال؟' : 'Why Question?'}
              </button>
            )}
          </div>
        </div>

        {/* Explainability Tab Content */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-200">
          {activeExplainTab === 'urgency' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  {isAr
                    ? `تفسير مستوى الخطورة [${step5EstimateUrgency.urgencyLabelAr}]:`
                    : `Urgency Elevation Rationale [${step5EstimateUrgency.urgencyLabelEn}]:`}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {isAr ? explainability.whyUrgencyLevel.rationaleAr : explainability.whyUrgencyLevel.rationaleEn}
              </p>
              {explainability.whyUrgencyLevel.triggers.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {isAr ? 'المؤشرات المحفزة:' : 'Triggers:'}
                  </span>
                  {explainability.whyUrgencyLevel.triggers.map((trig, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30 text-[10px]"
                    >
                      {trig}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeExplainTab === 'differentials' && (
            <div className="space-y-3">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'التعليل السريري لظهور الاحتمالات التفريقية:' : 'Clinical Justification for Suggested Differentials:'}</span>
              </div>
              <div className="space-y-2">
                {explainability.whyDifferentialsAppeared.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-300">
                      {isAr ? item.conditionAr : item.conditionEn}
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {isAr ? item.rationaleAr : item.rationaleEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeExplainTab === 'question' && explainability.whyQuestionAsked && (
            <div className="space-y-2">
              <div className="font-bold text-indigo-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>
                  {isAr ? 'الهدف السريري من السؤال المطروح:' : 'Clinical Purpose of Clarification:'}
                </span>
              </div>
              <p className="text-slate-100 font-semibold">
                "{isAr ? explainability.whyQuestionAsked.questionAr : explainability.whyQuestionAsked.questionEn}"
              </p>
              <p className="text-slate-300 text-xs leading-relaxed">
                {isAr
                  ? explainability.whyQuestionAsked.clinicalReasonAr
                  : explainability.whyQuestionAsked.clinicalReasonEn}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. DIFFERENTIAL ENGINE (Non-Diagnostic Probabilistic Considerations) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'قائمة الاحتمالات السريرية التفريقية (Differential Possibilities)' : 'Differential Possibilities'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'لا تقدم هذه القائمة أي تشخيص قاطع، بل اعتبارات سريرية للنظر مع عواملها الداعمة والناقصة'
                  : 'Probabilistic clinical considerations strictly non-diagnostic; details supporting & missing factors'}
              </p>
            </div>
          </div>
        </div>

        {/* Differentials Cards */}
        <div className="space-y-3">
          {step4GenerateDifferentials.differentials.map((diff, dIdx) => {
            const concern = getConcernBadge(diff.concernLevel);
            const isExpanded = expandedDiffIdx === dIdx;

            return (
              <div
                key={dIdx}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700"
              >
                <div
                  onClick={() => setExpandedDiffIdx(isExpanded ? null : dIdx)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-emerald-300">
                        {isAr ? diff.nameAr : diff.nameEn}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${concern.bg}`}
                      >
                        {isAr ? concern.labelAr : concern.labelEn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isAr ? diff.whyAppearedAr : diff.whyAppearedEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto text-slate-400">
                    <span className="text-[11px] font-semibold">
                      {isExpanded ? (isAr ? 'طي التفاصيل' : 'Collapse') : (isAr ? 'عرض العوامل' : 'Details')}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-900/60 border-t border-slate-800 space-y-3 text-xs">
                    {/* Supporting vs Missing Factors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Supporting */}
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isAr ? 'العوامل الداعمة الموجودة (Supporting Factors):' : 'Supporting Factors:'}</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {(isAr ? diff.supportingFactorsAr : diff.supportingFactorsEn).map((sf, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400">•</span>
                              <span>{sf}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Missing */}
                      <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAr ? 'العوامل الناقصة للتحقق (Missing Factors):' : 'Missing Factors / Diagnostic Gaps:'}</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {(isAr ? diff.missingFactorsAr : diff.missingFactorsEn).map((mf, mIdx) => (
                            <li key={mIdx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{mf}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommended Evaluation */}
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-200">
                          {isAr ? 'التقييم الطبي الموصى به: ' : 'Recommended Clinical Evaluation: '}
                        </span>
                        <span className="text-slate-300">
                          {isAr ? diff.recommendedEvaluationAr : diff.recommendedEvaluationEn}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. FINAL STRUCTURED RESPONSE (Exact format demanded by Phase 4 prompt) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            {isAr ? 'التقرير السريري النهائي المعتمد (Structured Clinical Response)' : 'Final Structured Clinical Response'}
          </h3>
        </div>

        {/* Section 1: ملخص */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>{isAr ? '1. ملخص الحالة السريرية' : '1. Summary'}</span>
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {isAr ? finalResp.summaryAr : finalResp.summaryEn}
          </p>
        </div>

        {/* Section 2: الأعراض التي تم فهمها */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? '2. الأعراض التي تم فهمها (Understood Symptoms & Context)' : '2. Understood Symptoms'}</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <div className="text-slate-400 font-semibold">
                {isAr ? 'الشكوى الرئيسية والأبعاد (OLDCARTS):' : 'Chief Complaint & Dimensions:'}
              </div>
              <div className="space-y-1 text-slate-200">
                {Object.entries(
                  isAr ? finalResp.understoodSymptoms.oldcartsSummaryAr : finalResp.understoodSymptoms.oldcartsSummaryEn
                ).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-2 border-b border-slate-800/50 pb-0.5">
                    <span className="text-slate-400">{key}:</span>
                    <span className="font-medium text-end text-slate-200">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <div>
                <div className="text-slate-400 font-semibold mb-1">
                  {isAr ? 'الأعراض المصاحبة:' : 'Associated Symptoms:'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {finalResp.understoodSymptoms.associatedSymptomsAr.length > 0 ? (
                    (isAr
                      ? finalResp.understoodSymptoms.associatedSymptomsAr
                      : finalResp.understoodSymptoms.associatedSymptomsEn
                    ).map((sym, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
                      >
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-xs">
                      {isAr ? 'لا توجد أعراض مصاحبة محددة' : 'None specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Medication and Medical History Notes */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                <div>
                  <span className="font-semibold text-slate-300">{isAr ? 'السياق الدوائي: ' : 'Medications: '}</span>
                  <span>{isAr ? finalResp.understoodSymptoms.medicationsNoteAr : finalResp.understoodSymptoms.medicationsNoteEn}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-300">{isAr ? 'السجل الصحي: ' : 'Medical History: '}</span>
                  <span>{isAr ? finalResp.understoodSymptoms.medicalHistoryNoteAr : finalResp.understoodSymptoms.medicalHistoryNoteEn}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: علامات الخطر */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>{isAr ? '3. علامات الخطر والتحذيرات السريرية' : '3. Red Flags & Critical Warnings'}</span>
          </h4>

          {finalResp.redFlagsSummary.length > 0 ? (
            <div className="space-y-2">
              {finalResp.redFlagsSummary.map((rf, rIdx) => (
                <div
                  key={rIdx}
                  className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-red-200">
                      {isAr ? rf.nameAr : rf.nameEn}
                    </div>
                    <div className="text-red-300/80 text-[11px] mt-0.5">
                      {isAr ? rf.actionAr : rf.actionEn}
                    </div>
                  </div>
                  {rf.urgency === 'EMERGENCY' && (
                    <a
                      href="tel:997"
                      className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shrink-0"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{isAr ? 'اتصال 997' : 'Call 997'}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isAr
                  ? 'لم يتم رصد أي من علامات الخطر الحادة المهددة للحياة في المدخلات الراهنة.'
                  : 'No acute life-threatening emergency red flags triggered in current presentation.'}
              </span>
            </div>
          )}
        </div>

        {/* Section 4: ماذا يمكن فعله الآن */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? '4. ماذا يمكن فعله الآن (الإجراءات الآمنة)' : '4. What Can Be Done Now'}</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {(isAr ? finalResp.immediateActions.actionsAr : finalResp.immediateActions.actionsEn).map((act, aIdx) => (
              <li key={aIdx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 5: متى يجب مراجعة الطبيب */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? '5. متى يجب مراجعة الطبيب (التوقيت والمعايير)' : '5. When to See a Doctor'}</span>
          </h4>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">{isAr ? 'الإطار الزمني الموصى به:' : 'Timing:'}</span>
              <span className="font-bold text-white">
                {isAr ? finalResp.whenToSeeDoctor.timingAr : finalResp.whenToSeeDoctor.timingEn}
              </span>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-semibold">
                {isAr ? 'معايير التوجه الفوري للطبيب:' : 'Consultation Criteria:'}
              </span>
              <ul className="space-y-1 text-slate-300">
                {(isAr ? finalResp.whenToSeeDoctor.criteriaAr : finalResp.whenToSeeDoctor.criteriaEn).map((crit, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-amber-400 font-bold">!</span>
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 6: المصادر عند وجودها */}
        {finalResp.sources && finalResp.sources.length > 0 && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isAr ? '6. المصادر والأدلة السريرية المعتمدة' : '6. Clinical Evidence Sources'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {finalResp.sources.map((src, sIdx) => (
                <div key={sIdx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-200 truncate">
                      {isAr ? src.title : src.titleEn || src.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      {src.organization}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? src.summaryAr : src.summaryEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
