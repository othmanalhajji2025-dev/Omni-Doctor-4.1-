import React, { useState, useEffect } from 'react';
import { Sparkles, Stethoscope, ShieldAlert, BookOpen, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export const ClinicalReasoningIndicator: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const stages = [
    {
      id: 'intent',
      textAr: 'تحليل النية السريرية والارتباط الصحي...',
      textEn: 'Analyzing clinical intent & health relevance...',
      icon: Stethoscope,
    },
    {
      id: 'extraction',
      textAr: 'استخراج الأعراض والمحددات الناقصة (OLDCARTS)...',
      textEn: 'Extracting symptom attributes (OLDCARTS protocol)...',
      icon: Sparkles,
    },
    {
      id: 'redflags',
      textAr: 'فحص علامات الخطر ومؤشرات الطوارئ الحرجة...',
      textEn: 'Scanning for emergency red flags & safety triggers...',
      icon: ShieldAlert,
    },
    {
      id: 'evidence',
      textAr: 'استرجاع الأدلة السريرية وصياغة التوجيه المتدرج...',
      textEn: 'Retrieving clinical evidence & formulating safe response...',
      icon: BookOpen,
    },
  ];

  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, [stages.length]);

  const currentStage = stages[currentStageIndex];
  const Icon = currentStage.icon;

  return (
    <div className="flex items-start gap-3 my-3">
      <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <Icon className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>{isAr ? 'محرك التفكير السريري الذكي' : 'Clinical AI Reasoning Pipeline'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {currentStageIndex + 1} / {stages.length}
          </span>
        </div>

        <p className="text-xs text-slate-300 transition-all duration-300 font-medium">
          {isAr ? currentStage.textAr : currentStage.textEn}
        </p>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5 pt-1">
          {stages.map((st, idx) => (
            <div
              key={st.id}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentStageIndex
                  ? 'w-6 bg-emerald-400'
                  : idx < currentStageIndex
                  ? 'w-2 bg-emerald-700'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
