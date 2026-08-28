import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ShieldCheck, Stethoscope, PhoneCall } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button } from '../../components/ui/index.js';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onOpenEmergency?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  onOpenEmergency,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickClinicalPrompts = [
    {
      labelAr: 'ألم ومغص في البطن منذ الصباح',
      labelEn: 'Abdominal pain & cramps since morning',
      text: isAr
        ? 'أعاني من ألم ومغص في منتصف البطن بدأ منذ الصباح.'
        : 'I have had cramping pain in the middle of my abdomen since morning.',
    },
    {
      labelAr: 'صداع نصفي نابض مع غثيان خفيف',
      labelEn: 'Throbbing migraine with mild nausea',
      text: isAr
        ? 'لدي صداع نابض في جانب واحد من الرأس مع غثيان خفيف منذ أمس.'
        : 'I have a pulsating unilateral headache with mild nausea since yesterday.',
    },
    {
      labelAr: 'فحص تفاعل الوارفارين مع الإيبوبروفين',
      labelEn: 'Warfarin & Ibuprofen interaction',
      text: isAr
        ? 'هل هناك خطورة أو تعارض دوائي عند تناول مسكن مثل الإيبوبروفين مع دواء الوارفارين؟'
        : 'Is there a risk or interaction between taking Ibuprofen with Warfarin?',
    },
    {
      labelAr: 'تفسير تحليل السكر التراكمي (HbA1c: 7.4%)',
      labelEn: 'Interpret HbA1c: 7.4% test result',
      text: isAr
        ? 'قمت بعمل فحص سكر تراكمي وخرجت النتيجة 7.4%، ما تفسير ذلك والخطوات المناسبة؟'
        : 'My recent HbA1c test result came out 7.4%. How should I interpret this?',
    },
  ];

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-expand textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  return (
    <div className="space-y-2.5 pt-2">
      {/* Quick Prompts Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>{isAr ? 'اقتراحات سريعة:' : 'Quick prompts:'}</span>
        </span>
        {quickClinicalPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setText(p.text);
              textareaRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-[11px] whitespace-nowrap transition-all cursor-pointer shrink-0"
          >
            {isAr ? p.labelAr : p.labelEn}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all p-2 shadow-lg">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder={
            isAr
              ? 'صف أعراضك، استفسارك الدوائي، أو نتائج تحليلك هنا... (اضغط Enter للإرسال)'
              : 'Describe your symptoms, medication questions, or lab results here... (Press Enter to send)'
          }
          className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm resize-none focus:outline-none px-3 py-1.5 max-h-36 min-h-[42px] leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-800/80 mt-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden sm:inline">
              {isAr ? 'Shift + Enter لسطر جديد' : 'Shift + Enter for new line'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="chat-send-btn"
              onClick={handleSend}
              disabled={!text.trim() || isLoading}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                text.trim() && !isLoading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/40'
              }`}
            >
              <span>{isAr ? 'إرسال' : 'Send'}</span>
              <Send className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Safety Reminder */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {isAr
              ? 'محادثة آمنة ومحمية لا تشارك بياناتك • نظام فرز احتمالي استرشادي'
              : 'Protected clinical triage • Probabilistic & non-definitive AI'}
          </span>
        </div>
        {onOpenEmergency && (
          <button
            onClick={onOpenEmergency}
            className="text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <PhoneCall className="w-3 h-3" />
            <span>{isAr ? 'طوارئ 997' : 'Emergency 911'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
