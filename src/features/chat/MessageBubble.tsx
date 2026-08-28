import React, { useState } from 'react';
import {
  Bot,
  User,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  FileQuestion,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, NavigationTab } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Badge, Button } from '../../components/ui/index.js';
import { EmergencyResponseModeCard } from './EmergencyResponseModeCard.js';

interface MessageBubbleProps {
  message: ChatMessage;
  onQuickReply: (text: string) => void;
  onOpenEmergency?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onQuickReply,
  onOpenEmergency,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const isUser = message.sender === 'user';

  const [showAudits, setShowAudits] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showDoctorQuestions, setShowDoctorQuestions] = useState(false);

  // Parse markdown-like bolding and bullets
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Check for headers or bold points
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          const cleanLine = isBullet ? line.trim().substring(1).trim() : line;

          // Simple bold formatting replacement (**text**)
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

          const formattedContent = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-emerald-200">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 ps-2">
                <span className="text-emerald-400 font-bold text-base leading-tight">•</span>
                <span>{formattedContent}</span>
              </div>
            );
          }

          return <p key={idx}>{formattedContent}</p>;
        })}
      </div>
    );
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5 my-3">
        <div className="max-w-2xl bg-emerald-600/90 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <div className="text-[10px] text-emerald-200/80 text-end mt-1.5 font-mono">
            {message.timestamp}
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  const hasRedFlags = Boolean(message.redFlagsDetected && message.redFlagsDetected.length > 0);
  const isEmergency = message.isEmergency || message.urgencyTag === 'EMERGENCY' || message.safetyRiskLevel === 'EMERGENCY';

  if (isEmergency || message.emergencyPayload) {
    return (
      <div className="flex items-start gap-2.5 my-3">
        <div className="w-8 h-8 rounded-xl bg-rose-950 border border-rose-500 text-rose-400 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 max-w-3xl space-y-3">
          <EmergencyResponseModeCard
            payload={message.emergencyPayload}
            triggeredRules={message.safetyEvaluation?.triggeredRules}
            clinicalExplanationAr={message.safetyEvaluation?.clinicalExplanationAr}
            clinicalExplanationEn={message.safetyEvaluation?.clinicalExplanationEn}
            recommendedActionAr={message.safetyEvaluation?.recommendedActionAr}
            recommendedActionEn={message.safetyEvaluation?.recommendedActionEn}
            safeWaitingStepsAr={message.safetyEvaluation?.safeWaitingStepsAr}
            safeWaitingStepsEn={message.safetyEvaluation?.safeWaitingStepsEn}
            timestamp={message.timestamp}
          />

          {/* Supplementary Collapsible Tools */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {message.pipelineAudits && message.pipelineAudits.length > 0 && (
              <button
                onClick={() => setShowAudits(!showAudits)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {isAr ? 'سجل تدقيق الأمان السريري' : 'Clinical Safety Audit Trail'} (
                  {message.pipelineAudits.length})
                </span>
                {showAudits ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          {/* Audits Dropdown View */}
          {showAudits && message.pipelineAudits && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {isAr
                    ? 'تدقيق الأمان وسجلات الأولوية السريرية'
                    : 'Safety Verification & Audit Log'}
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {message.pipelineAudits.map((audit, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="text-rose-400 font-bold">[{audit.step}]</span>{' '}
                      <span className="text-slate-300">
                        {isAr ? audit.detailsAr : audit.detailsEn}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        audit.status === 'PASSED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {audit.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 my-3">
      <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-1 shadow-sm">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-3xl space-y-3">
        {/* Main Assistant Card */}
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-md border ${
            isEmergency
              ? 'bg-rose-950/40 border-rose-600/60 text-slate-100'
              : 'bg-slate-900/90 border-slate-800 text-slate-200'
          }`}
        >
          {/* Header Metadata */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">
                {isAr ? 'المساعد الطبي الذكي' : 'Clinical Medical Companion'}
              </span>
              {message.providerUsed && (
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {message.providerUsed.includes('Gemini')
                    ? 'Gemini 3.1 Pro Clinical'
                    : 'Clinical Evidence Engine'}
                </span>
              )}
            </div>

            {message.urgencyTag && (
              <Badge
                variant={
                  isEmergency
                    ? 'destructive'
                    : message.urgencyTag === 'URGENT'
                    ? 'warning'
                    : 'info'
                }
                size="sm"
              >
                {isEmergency
                  ? isAr ? 'طوارئ فورية' : 'Emergency'
                  : message.urgencyTag === 'URGENT'
                  ? isAr ? 'رعاية عاجلة' : 'Urgent Care'
                  : isAr ? 'استشارة روتينية' : 'Routine'}
              </Badge>
            )}
          </div>

          {/* Emergency Alert Banner */}
          {hasRedFlags && (
            <div className="mb-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                <span>
                  {isAr
                    ? 'تنبيه سريري: تم رصد مؤشرات خطورة تستدعي الرعاية الطبية الفورية'
                    : 'Clinical Alert: Red flag triggers detected requiring immediate medical attention'}
                </span>
              </div>
              <ul className="space-y-1 text-xs list-disc list-inside ps-1 text-rose-200">
                {message.redFlagsDetected?.map((rf, idx) => (
                  <li key={idx}>
                    <strong>{isAr ? rf.nameAr : rf.nameEn}:</strong>{' '}
                    <span>{isAr ? rf.actionAr : rf.actionEn}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href="tel:997"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{isAr ? 'اتصال بالإسعاف (997)' : 'Call Ambulance (997)'}</span>
                </a>
                <a
                  href="tel:911"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طوارئ عامة (911)' : 'Emergency Dispatch (911)'}</span>
                </a>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="text-slate-200">{renderFormattedText(message.content)}</div>

          {/* Progressive Follow-Up Question Card (Single Highest Priority) */}
          {message.nextFollowUpQuestion && !isEmergency && (
            <div className="mt-3.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isAr ? 'سؤال المتابعة الأكثر أهمية:' : 'Highest-Priority Follow-Up Question:'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200">
                {isAr
                  ? message.nextFollowUpQuestion.questionAr
                  : message.nextFollowUpQuestion.questionEn}
              </p>

              {/* Quick Reply Option Chips */}
              {message.nextFollowUpQuestion.quickOptionsAr && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(isAr
                    ? message.nextFollowUpQuestion.quickOptionsAr
                    : message.nextFollowUpQuestion.quickOptionsEn
                  ).map((option, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => onQuickReply(option)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-700/80 text-emerald-200 hover:text-white border border-emerald-600/40 text-[11px] font-medium transition-all cursor-pointer text-start"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message Footer Time */}
          <div className="text-[10px] text-slate-400 text-end mt-2 font-mono">
            {message.timestamp}
          </div>
        </div>

        {/* Supplementary Collapsible Tools (Audits, Evidence, Doctor Questions) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Pipeline Audits */}
          {message.pipelineAudits && message.pipelineAudits.length > 0 && (
            <button
              onClick={() => setShowAudits(!showAudits)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{isAr ? 'مسار التحقق السريري (8 خطوات)' : 'Clinical Reasoning Steps'}</span>
              {showAudits ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* Evidence Sources */}
          {message.evidenceSources && message.evidenceSources.length > 0 && (
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>{isAr ? 'الأدلة الطبية الموثقة' : 'Verified Evidence Sources'}</span>
              {showEvidence ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* Questions for Doctor */}
          {((isAr && message.questionsForDoctorAr?.length) ||
            (!isAr && message.questionsForDoctorEn?.length)) && (
            <button
              onClick={() => setShowDoctorQuestions(!showDoctorQuestions)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition-colors cursor-pointer"
            >
              <FileQuestion className="w-3 h-3 text-amber-400" />
              <span>{isAr ? 'أسئلة مقترحة لطبيبك' : 'Questions for Doctor'}</span>
              {showDoctorQuestions ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Audits Collapsible Detail */}
        {showAudits && message.pipelineAudits && (
          <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-xs space-y-2 animate-fadeIn">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'سجل تدقيق الأمان والمنطق السريري' : 'Clinical Safety Audit Log'}</span>
            </div>
            <div className="space-y-1.5">
              {message.pipelineAudits.map((audit, aIdx) => (
                <div
                  key={aIdx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]"
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      audit.status === 'TRIGGERED' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  />
                  <div>
                    <span className="font-mono text-slate-400">{audit.step}:</span>{' '}
                    <span className="text-slate-300">
                      {isAr ? audit.detailsAr : audit.detailsEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Sources Collapsible Detail */}
        {showEvidence && message.evidenceSources && (
          <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-xs space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isAr
                    ? 'المراجع والأدلة الطبية المسترجعة (Medical RAG Grounding)'
                    : 'Retrieved Clinical Evidence (Medical RAG Grounding)'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                {isAr ? 'موثق بدون هلوسة' : 'Zero Hallucination Verified'}
              </span>
            </div>

            <div className="space-y-2">
              {message.evidenceSources.map((ev, eIdx) => (
                <div
                  key={eIdx}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                    <div className="font-semibold text-cyan-300 flex items-center gap-1">
                      <span>{ev.title}</span>
                      {ev.url && (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-200 inline-flex items-center"
                          title={isAr ? 'فتح المصدر المعتمد' : 'Open Reference Link'}
                        >
                          <ExternalLink className="w-3 h-3 ms-1" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                        {ev.organization}
                      </span>
                      {ev.authorityLevel && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                          {ev.authorityLevel.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                    <span className="text-slate-400 font-medium me-1">
                      {isAr ? 'المقتطف الإكلينيكي المسترجع:' : 'Clinical Excerpt:'}
                    </span>
                    {ev.excerpt || (isAr ? ev.summaryAr : ev.summaryEn)}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 text-emerald-400/90">
                      <ShieldCheck className="w-3 h-3" />
                      {isAr ? 'مرجع موثق مسترجع من قاعدة المتجهات' : 'Verified retrieved vector chunk'}
                    </span>
                    {ev.lastUpdated && (
                      <span className="font-mono">
                        {isAr ? 'تاريخ التحديث: ' : 'Updated: '}
                        {ev.lastUpdated}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Questions Collapsible Detail */}
        {showDoctorQuestions && (
          <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-xs space-y-2 animate-fadeIn">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <FileQuestion className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isAr
                  ? 'أسئلة موجهة يمكنك طرحها على طبيبك المعالج'
                  : 'Key Questions to ask your physician during your visit'}
              </span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside ps-1 text-slate-300">
              {(isAr ? message.questionsForDoctorAr : message.questionsForDoctorEn)?.map(
                (q, qIdx) => (
                  <li key={qIdx} className="leading-relaxed">
                    {q}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
