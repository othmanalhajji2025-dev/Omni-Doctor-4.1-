import React, { useState } from 'react';
import {
  Stethoscope,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  PhoneCall,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Printer,
  Mic,
  MicOff,
  RotateCcw,
  Lock,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { SymptomAnalysisResult, ClinicalReasoningEncounter } from '../../server/types/medical.js';
import { ClinicalReasoningSection } from './ClinicalReasoningSection.js';

export const SymptomChecker: React.FC = () => {
  const { language, t } = useLanguage();

  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('1-3 أيام');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL'>('MODERATE');
  const [painScale, setPainScale] = useState<number>(4);
  const [associatedSymptoms, setAssociatedSymptoms] = useState<string[]>([]);
  const [showVitalsAccordion, setShowVitalsAccordion] = useState(false);
  const [patientConsent, setPatientConsent] = useState(true);

  // Vitals State
  const [systolicBP, setSystolicBP] = useState<string>('126');
  const [diastolicBP, setDiastolicBP] = useState<string>('82');
  const [heartRate, setHeartRate] = useState<string>('76');
  const [spO2, setSpO2] = useState<string>('98');
  const [temperature, setTemperature] = useState<string>('37.0');
  const [bloodGlucose, setBloodGlucose] = useState<string>('105');

  // Loading & Result State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null);
  const [clinicalEncounter, setClinicalEncounter] = useState<ClinicalReasoningEncounter | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Pre-set clinical test scenarios
  const clinicalPresets = [
    {
      titleAr: 'ألم بالصدر وضيق تنفس (طوارئ)',
      titleEn: 'Acute Chest Pain & Dyspnea (Emergency)',
      textAr: 'أشعر بألم ضاغط وثقل شديد في منتصف الصدر يمتد إلى الذراع الأيسر مع ضيق في التنفس وتعرق بارد منذ ساعة.',
      textEn: 'Severe crushing chest pressure radiating to left arm with shortness of breath and cold sweat for 1 hour.',
      duration: 'أقل من ساعتين',
      severity: 'CRITICAL' as const,
      painScale: 9,
      associated: ['ضيق تنفس', 'تعرق بارد', 'خفقان'],
      vitals: { sys: '165', dia: '100', hr: '105', spo2: '93', temp: '37.1', bg: '120' }
    },
    {
      titleAr: 'صداع نصفي مع حساسية ضوء',
      titleEn: 'Migraine with Photophobia',
      textAr: 'صداع نابض مستمر في النصف الأيمن من الرأس منذ يومين مع غثيان خفيف وانزعاج شديد من الضوء والأصوات العالية.',
      textEn: 'Throbbing unilateral headache on right side for 2 days with mild nausea and sensitivity to bright light and sound.',
      duration: '1-3 أيام',
      severity: 'MODERATE' as const,
      painScale: 6,
      associated: ['غثيان', 'حساسية من الضوء'],
      vitals: { sys: '122', dia: '80', hr: '74', spo2: '99', temp: '36.8', bg: '98' }
    },
    {
      titleAr: 'سعال وحمى خفيفة واحتقان حلق',
      titleEn: 'Viral URTI / Cough & Mild Fever',
      textAr: 'احتقان في الحلق مع سعال جاف وارتفاع طفيف في درجة الحرارة وشعور بالإرهاق وتكسير الجسم منذ 3 أيام.',
      textEn: 'Sore throat, dry cough, low-grade fever, and general body malaise for the past 3 days.',
      duration: '3-5 أيام',
      severity: 'MILD' as const,
      painScale: 3,
      associated: ['حمى خفيفة', 'احتقان', 'إرهاق عام'],
      vitals: { sys: '118', dia: '76', hr: '82', spo2: '98', temp: '37.8', bg: '102' }
    },
    {
      titleAr: 'حرقة بول وألم أسفل البطن',
      titleEn: 'Dysuria & Lower Abdominal Pain',
      textAr: 'أشعر بحرقة شديدة عند التبول مع رغبة متكررة في دخول الحمام وألم خفيف فوق العانة منذ يوم أمس.',
      textEn: 'Severe burning upon urination with increased urinary frequency and lower suprapubic ache since yesterday.',
      duration: 'يوم واحد',
      severity: 'MODERATE' as const,
      painScale: 5,
      associated: ['حرقة بول', 'تكرار التبول'],
      vitals: { sys: '120', dia: '78', hr: '78', spo2: '99', temp: '37.2', bg: '95' }
    }
  ];

  const commonAssociated = [
    { id: 'fever', ar: 'حمى وسخونة', en: 'Fever' },
    { id: 'nausea', ar: 'غثيان أو قيء', en: 'Nausea / Vomiting' },
    { id: 'dizziness', ar: 'دوخة أو دوار', en: 'Dizziness' },
    { id: 'shortness_of_breath', ar: 'ضيق تنفس', en: 'Dyspnea' },
    { id: 'palpitations', ar: 'خفقان بالقلب', en: 'Palpitations' },
    { id: 'fatigue', ar: 'إرهاق وتعب عام', en: 'Fatigue' },
    { id: 'sweating', ar: 'تعرق غير معتاد', en: 'Diaphoresis' },
    { id: 'headache', ar: 'صداع مصاحب', en: 'Accompanying Headache' }
  ];

  const handleApplyPreset = (preset: typeof clinicalPresets[0]) => {
    setSymptoms(language === 'ar' ? preset.textAr : preset.textEn);
    setDuration(preset.duration);
    setSeverity(preset.severity);
    setPainScale(preset.painScale);
    setAssociatedSymptoms(preset.associated);
    setSystolicBP(preset.vitals.sys);
    setDiastolicBP(preset.vitals.dia);
    setHeartRate(preset.vitals.hr);
    setSpO2(preset.vitals.spo2);
    setTemperature(preset.vitals.temp);
    setBloodGlucose(preset.vitals.bg);
  };

  const toggleAssociated = (label: string) => {
    setAssociatedSymptoms(prev =>
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    );
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(language === 'ar' ? 'خاصية الإملاء الصوتي غير مدعومة في متصفحك.' : 'Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSymptoms(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError(language === 'ar' ? 'يرجى كتابة أو تسجيل وصف الأعراض أولاً.' : 'Please describe your symptoms first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        symptoms,
        duration,
        severity,
        painScale,
        associatedSymptoms,
        patientConsent,
        vitalSigns: {
          systolicBP: systolicBP ? Number(systolicBP) : undefined,
          diastolicBP: diastolicBP ? Number(diastolicBP) : undefined,
          heartRate: heartRate ? Number(heartRate) : undefined,
          spO2: spO2 ? Number(spO2) : undefined,
          temperature: temperature ? Number(temperature) : undefined,
          bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
        },
        language
      };

      const token = localStorage.getItem('token');
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      // Execute Phase 4 Clinical Reasoning Protocol
      const clinResponse = await fetch('/api/clinical/analyze', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (!clinResponse.ok) {
        throw new Error(`Clinical server returned ${clinResponse.status}`);
      }

      const encounter: ClinicalReasoningEncounter = await clinResponse.json();
      setClinicalEncounter(encounter);

      // Backwards compatible mapping for legacy triage views if needed
      const legacyResponse = await fetch('/api/triage/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (legacyResponse && legacyResponse.ok) {
        const data: SymptomAnalysisResult = await legacyResponse.json();
        setAnalysisResult(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        language === 'ar'
          ? 'تعذر إتمام التحليل السريري حالياً. يرجى التحقق من اتصال الخادم وإعادة المحاولة.'
          : 'Unable to complete clinical analysis. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerFollowUp = (field: string, answer: string) => {
    // Append the clarifying answer to symptoms text and re-trigger analysis
    const addition = language === 'ar' ? ` [${field}: ${answer}]` : ` [${field}: ${answer}]`;
    const updated = symptoms + addition;
    setSymptoms(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setSymptoms('');
    setAssociatedSymptoms([]);
    setAnalysisResult(null);
    setClinicalEncounter(null);
    setError(null);
  };

  const getUrgencyBadgeStyle = (urgency: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {language === 'ar' ? 'فحص الأعراض والفرز السريري الذكي' : 'Clinical Symptom Triage & Safety Analysis'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'محرك فرز سريري خاضع لـ 7 حواجز أمان واسترجاع أدلة طبية من منظمة الصحة وNICE'
                  : '7-stage guarded clinical triage pipeline backed by WHO & NICE clinical practice guidelines'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'جلسة جديدة' : 'New Session'}</span>
            </button>
            {analysisResult && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'طباعة التقرير' : 'Print Report'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Clinical Test Scenarios */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'ar' ? 'سيناريوهات سريرية جاهزة للاختبار السريع:' : 'Quick Clinical Benchmark Scenarios:'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {clinicalPresets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="text-start p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                {language === 'ar' ? p.titleAr : p.titleEn}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-1">
                {language === 'ar' ? p.duration : p.duration} • {p.severity}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        {/* Symptom Narrative Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>{language === 'ar' ? 'وصف الأعراض والحالة السريرية' : 'Symptom Description & Chief Complaint'}</span>
              <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isListening
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isListening ? (language === 'ar' ? 'جارٍ الاستماع...' : 'Listening...') : (language === 'ar' ? 'تسجيل صوتي' : 'Voice Input')}</span>
            </button>
          </div>
          <textarea
            id="symptom-input-textarea"
            rows={4}
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder={t('symptomsPlaceholder')}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>

        {/* Duration, Perceived Severity & Pain Scale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Duration */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'ar' ? 'مدة ظهور العرض' : 'Symptom Duration'}</span>
            </label>
            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="أقل من ساعتين">{language === 'ar' ? 'أقل من ساعتين (مفاجئ حاد)' : '< 2 hours (Acute sudden)'}</option>
              <option value="1-3 أيام">{language === 'ar' ? '1 إلى 3 أيام' : '1 - 3 Days'}</option>
              <option value="أسبوع">{language === 'ar' ? 'حوالي أسبوع' : '~1 Week'}</option>
              <option value="أكثر من شهر (مزمن)">{language === 'ar' ? 'أكثر من شهر (مزمن)' : '> 1 Month (Chronic)'}</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'ar' ? 'الشدة التقديرية' : 'Severity Assessment'}</span>
            </label>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="MILD">{language === 'ar' ? 'خفيفة (لا تعيق النشاط)' : 'Mild (Non-disruptive)'}</option>
              <option value="MODERATE">{language === 'ar' ? 'متوسطة (تؤثر على النشاط)' : 'Moderate'}</option>
              <option value="SEVERE">{language === 'ar' ? 'شديدة (تعيق الأنشطة تماماً)' : 'Severe'}</option>
              <option value="CRITICAL">{language === 'ar' ? 'حرجة للغاية / لا تطاق' : 'Critical / Unbearable'}</option>
            </select>
          </div>

          {/* Pain Scale (1-10) */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>{language === 'ar' ? 'مقياس الألم' : 'Pain Scale'}</span>
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 bg-slate-800 rounded">
                {painScale} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={painScale}
              onChange={e => setPainScale(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 ({language === 'ar' ? 'لا يوجد ألم' : 'No pain'})</span>
              <span>5 ({language === 'ar' ? 'متوسط' : 'Moderate'})</span>
              <span>10 ({language === 'ar' ? 'أقصى ألم' : 'Max pain'})</span>
            </div>
          </div>
        </div>

        {/* Associated Symptoms Tags */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-2 block">
            {language === 'ar' ? 'أعراض إضافية مصاحبة (اختر ما ينطبق):' : 'Accompanying Symptoms (Select all that apply):'}
          </label>
          <div className="flex flex-wrap gap-2">
            {commonAssociated.map(item => {
              const label = language === 'ar' ? item.ar : item.en;
              const isSelected = associatedSymptoms.includes(label);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleAssociated(label)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vitals Accordion */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVitalsAccordion(!showVitalsAccordion)}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950/80 hover:bg-slate-950 text-xs font-semibold text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>{t('vitalsAccordion')}</span>
            </div>
            {showVitalsAccordion ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showVitalsAccordion && (
            <div className="p-4 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 border-t border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'ar' ? 'الضغط الانقباضي' : 'Systolic BP'}
                </label>
                <input
                  type="number"
                  placeholder="120"
                  value={systolicBP}
                  onChange={e => setSystolicBP(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'ar' ? 'الضغط الانبساطي' : 'Diastolic BP'}
                </label>
                <input
                  type="number"
                  placeholder="80"
                  value={diastolicBP}
                  onChange={e => setDiastolicBP(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'ar' ? 'النبض (ن/د)' : 'Heart Rate'}
                </label>
                <input
                  type="number"
                  placeholder="72"
                  value={heartRate}
                  onChange={e => setHeartRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'ar' ? 'الأكسجين SpO2 %' : 'SpO2 %'}
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={spO2}
                  onChange={e => setSpO2(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'ar' ? 'الحرارة °C' : 'Temp °C'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'ar' ? 'السكر mg/dL' : 'Glucose'}
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={bloodGlucose}
                  onChange={e => setBloodGlucose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Patient Consent Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">
                {language === 'ar' ? 'موافقة المريض على تضمين التاريخ المرضي والأدوية' : 'Patient Consent: Medical History & Meds'}
              </span>
              <span className="text-[11px] text-slate-400">
                {language === 'ar' ? 'مطلوبة لربط السجل الصحي والأدوية بالاستدلال السريري' : 'Explicit consent to correlate medical history & active medications'}
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={patientConsent}
              onChange={(e) => setPatientConsent(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Action Button */}
        <button
          id="run-triage-analysis-btn"
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{language === 'ar' ? 'جارٍ تشغيل بروتوكول الاستدلال السريري (7 خطوات)...' : 'Executing 7-Step Clinical Reasoning Protocol...'}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>{t('analyzeSymptoms')}</span>
            </>
          )}
        </button>
      </div>

      {/* Phase 4 Clinical Reasoning Master Display */}
      {clinicalEncounter && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ClinicalReasoningSection
            encounter={clinicalEncounter}
            language={language}
            onAnswerQuestion={handleAnswerFollowUp}
          />
        </div>
      )}

      {/* Analysis Results Display (Legacy / Auxiliary) */}
      {!clinicalEncounter && analysisResult && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Critical Red Flag Banner if Present */}
          {analysisResult.redFlagsDetected.length > 0 && (
            <div className="bg-red-950/80 border-2 border-red-500 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-950">
                  <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-red-200 flex items-center gap-2">
                      <span>{t('redFlagAlertTitle')}</span>
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-mono">
                        {analysisResult.urgencyLabelAr}
                      </span>
                    </h2>
                    <a
                      href="tel:997"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'اتصل بالإسعاف 997 فوراً' : 'Call Ambulance 997 / 911'}</span>
                    </a>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {analysisResult.redFlagsDetected.map((rf, idx) => (
                      <div key={idx} className="bg-red-900/50 p-2.5 rounded-lg border border-red-500/40 text-xs">
                        <div className="font-bold text-red-100">
                          {language === 'ar' ? rf.nameAr : rf.nameEn}
                        </div>
                        <div className="text-red-200/90 text-[11px] mt-0.5">
                          {language === 'ar' ? rf.actionAr : rf.actionEn}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Triage Urgency & Clinical Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getUrgencyBadgeStyle(analysisResult.urgency)}`}>
                  {language === 'ar' ? analysisResult.urgencyLabelAr : analysisResult.urgencyLabelEn}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {analysisResult.encounterId}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {language === 'ar' ? `النموذج: ${analysisResult.usedAiModel}` : `Model: ${analysisResult.usedAiModel}`}
              </div>
            </div>

            {/* Clinical Summary */}
            <div className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <p className="font-medium">
                {language === 'ar' ? analysisResult.clinicalSummaryAr : analysisResult.clinicalSummaryEn}
              </p>
            </div>

            {/* Probabilistic Differentials */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{t('probabilisticDifferentialTitle')}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysisResult.probabilisticDifferentials.map((diff, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-emerald-300">
                        {language === 'ar' ? diff.conditionNameAr : diff.conditionNameEn}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold shrink-0">
                        {diff.probabilityLevel === 'POSSIBLE'
                          ? (language === 'ar' ? 'احتمال سريري' : 'Possible')
                          : (language === 'ar' ? 'للنظر السريري' : 'Consideration')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 italic">
                      "{language === 'ar' ? diff.probabilisticStatementAr : diff.probabilisticStatementEn}"
                    </p>

                    <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                      <span className="font-semibold text-slate-300">{language === 'ar' ? 'التعليل السريري: ' : 'Rationale: '}</span>
                      {language === 'ar' ? diff.clinicalRationaleAr : diff.clinicalRationaleEn}
                    </div>

                    {diff.typicalSymptomsAr && diff.typicalSymptomsAr.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(language === 'ar' ? diff.typicalSymptomsAr : diff.typicalSymptomsEn).map((sym, sIdx) => (
                          <span key={sIdx} className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                            {sym}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Steps & Questions for Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Recommendations */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>{t('recommendedActions')}</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(language === 'ar' ? analysisResult.recommendedActionsAr : analysisResult.recommendedActionsEn).map((rec, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Questions to Ask Doctor */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>{t('questionsForDoctor')}</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(language === 'ar' ? analysisResult.questionsForDoctorAr : analysisResult.questionsForDoctorEn).map((q, qIdx) => (
                    <li key={qIdx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">؟</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Verified Clinical Guidelines Retrieved (Source Integrity) */}
            {analysisResult.evidenceSources.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>{t('verifiedSources')}</span>
                </h4>
                <div className="space-y-2">
                  {analysisResult.evidenceSources.map(ev => (
                    <div key={ev.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-200">
                          {language === 'ar' ? ev.title : ev.titleEn}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          {ev.organization} [{ev.guidelineId}]
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {language === 'ar' ? ev.summaryAr : ev.summaryEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-Stage Pipeline Audit Trail View */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ar' ? 'سجل تدقيق مراحل الأمان السريري السبع (Clinical Pipeline Audit)' : '7-Stage Clinical Pipeline Audit Trail'}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {analysisResult.pipelineAuditTrail.map((audit, aIdx) => (
                  <div key={aIdx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300 font-semibold mb-0.5">
                      <span>{audit.step}</span>
                      <span className="text-[9px] font-mono text-emerald-400">{audit.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {language === 'ar' ? audit.detailsAr : audit.detailsEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 text-center">
              {language === 'ar' ? analysisResult.safetyDisclaimersAr : analysisResult.safetyDisclaimersEn}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
