import React, { useState } from 'react';
import {
  FlaskConical,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  HelpCircle,
  RefreshCw,
  Info,
  ShieldCheck,
  User,
  HeartPulse,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface ParameterInput {
  name: string;
  nameAr?: string;
  value: number;
  unit: string;
}

export const LabInterpretationTab: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';

  const [patientAge, setPatientAge] = useState<number>(45);
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [activeConditions, setActiveConditions] = useState<string[]>(['Diabetes']);
  const [parameters, setParameters] = useState<ParameterInput[]>([
    { name: 'Fasting Blood Sugar', nameAr: 'سكر الدم الصائم', value: 135, unit: 'mg/dL' },
    { name: 'Hemoglobin A1c (HbA1c)', nameAr: 'السكر التراكمي', value: 7.2, unit: '%' },
    { name: 'Serum Creatinine', nameAr: 'الكرياتينين', value: 1.1, unit: 'mg/dL' },
    { name: 'Hemoglobin (Hb)', nameAr: 'الهيموجلوبين', value: 12.8, unit: 'g/dL' },
  ]);

  const [results, setResults] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const presets = [
    {
      titleAr: 'فحص السكري ودهون الدم (مرتفع)',
      titleEn: 'Diabetic & Lipid Panel (Elevated)',
      age: 50,
      gender: 'MALE' as const,
      conditions: ['Diabetes', 'Dyslipidemia'],
      params: [
        { name: 'Fasting Blood Sugar', nameAr: 'سكر الدم الصائم', value: 155, unit: 'mg/dL' },
        { name: 'Hemoglobin A1c (HbA1c)', nameAr: 'السكر التراكمي', value: 7.6, unit: '%' },
        { name: 'Total Cholesterol', nameAr: 'الكوليسترول الكلي', value: 235, unit: 'mg/dL' },
        { name: 'LDL Cholesterol', nameAr: 'الكوليسترول الضار', value: 152, unit: 'mg/dL' },
      ],
    },
    {
      titleAr: 'فحص وظائف الكلى والأملاح (طبيعي)',
      titleEn: 'Renal & Electrolytes (Normal Baseline)',
      age: 38,
      gender: 'FEMALE' as const,
      conditions: [],
      params: [
        { name: 'Serum Creatinine', nameAr: 'الكرياتينين', value: 0.8, unit: 'mg/dL' },
        { name: 'Serum Potassium (K+)', nameAr: 'البوتاسيوم', value: 4.2, unit: 'mEq/L' },
        { name: 'Serum Sodium (Na+)', nameAr: 'الصوديوم', value: 140, unit: 'mEq/L' },
      ],
    },
    {
      titleAr: 'حالة طوارئ قلبية وبوتاسيوم حرج (STAT Critical)',
      titleEn: 'STAT Emergency Cardiac & Hyperkalemia (Critical)',
      age: 62,
      gender: 'MALE' as const,
      conditions: ['Hypertension', 'CKD'],
      params: [
        { name: 'Troponin I (Cardiac)', nameAr: 'تروبونين القلب', value: 0.22, unit: 'ng/mL' },
        { name: 'Serum Potassium (K+)', nameAr: 'البوتاسيوم', value: 6.6, unit: 'mEq/L' },
        { name: 'Serum Creatinine', nameAr: 'الكرياتينين', value: 2.8, unit: 'mg/dL' },
      ],
    },
    {
      titleAr: 'مقارنة فوسفاتاز عظام الأطفال (Age-Aware Demo)',
      titleEn: 'Pediatric Bone Growth ALP (Age-Aware Demo)',
      age: 9,
      gender: 'MALE' as const,
      conditions: [],
      params: [
        { name: 'Alkaline Phosphatase', nameAr: 'الفوسفاتاز القلوية (ALP)', value: 240, unit: 'U/L' },
        { name: 'Hemoglobin (Hb)', nameAr: 'الهيموجلوبين', value: 13.0, unit: 'g/dL' },
      ],
    },
    {
      titleAr: 'فحص الهيموجلوبين للإناث (Sex-Aware Demo)',
      titleEn: 'Female Hemoglobin (Sex-Aware Demo)',
      age: 32,
      gender: 'FEMALE' as const,
      conditions: [],
      params: [
        { name: 'Hemoglobin (Hb)', nameAr: 'الهيموجلوبين', value: 12.4, unit: 'g/dL' },
        { name: 'Serum Creatinine', nameAr: 'الكرياتينين', value: 0.9, unit: 'mg/dL' },
      ],
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setPatientAge(p.age);
    setPatientGender(p.gender);
    setActiveConditions(p.conditions);
    setParameters(p.params);
    setResults(null);
  };

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      { name: 'Fasting Blood Sugar', nameAr: 'سكر الدم الصائم', value: 100, unit: 'mg/dL' },
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParamChange = (index: number, field: keyof ParameterInput, value: any) => {
    const next = [...parameters];
    next[index] = { ...next[index], [field]: value };
    setParameters(next);
  };

  const handleInterpret = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/labs/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters,
          patientContext: {
            age: patientAge,
            gender: patientGender,
            activeConditions,
          },
        }),
      });

      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-500/20 text-red-300 border-red-500/60 font-bold animate-pulse';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold';
      case 'Low':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60 font-semibold';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isAr ? 'مفسر التحاليل والمؤشرات الحيوية السريرية' : 'Clinical Biomarker & Lab Interpreter'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'تفسير ذكي متعدد المعايير: يراعي العمر، الجنس، الوحدات المخبرية، والأمراض المزمنة دون تشخيص منفرد.'
                : 'Multi-parameter engine: Context-Aware, Age-Aware, Sex-Aware, Unit-Aware & Reference-Range-Aware.'}
            </p>
          </div>
        </div>

        {/* Clinical Disclaimer Notice */}
        <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-cyan-200/90 leading-relaxed">
            <strong className="text-white">
              {isAr ? 'قاعدة سريرية صارمة: ' : 'Essential Clinical Rule: '}
            </strong>
            {isAr
              ? 'لا يتم تشخيص أي مرض بناءً على نتيجة فحص منفردة بمفردها. يلزم دائماً إعادة الفحص وتأكيده مع الفحص السريري للطبيب.'
              : 'Do not diagnose a disease based on a single laboratory result alone. Correlation with clinical history and repeat testing are required.'}
          </p>
        </div>
      </div>

      {/* Patient Demographic Context Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'بيانات المريض والمعايير الديموغرافية (للمطابقة الدقيقة):' : 'Patient Demographics & Context (Age/Sex Awareness):'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Age Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isAr ? 'العمر (بالسنوات):' : 'Patient Age (Years):'}
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={patientAge}
              onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              {patientAge <= 12 ? (isAr ? 'فئة الأطفال (نطاقات مخصصة)' : 'Pediatric group') : (isAr ? 'فئة البالغين' : 'Adult range')}
            </span>
          </div>

          {/* Gender Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isAr ? 'الجنس (لتحديد النطاق المرجعي):' : 'Sex (Sex-Specific Range):'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPatientGender('MALE')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  patientGender === 'MALE'
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isAr ? 'ذكر' : 'Male'}
              </button>
              <button
                type="button"
                onClick={() => setPatientGender('FEMALE')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  patientGender === 'FEMALE'
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isAr ? 'أنثى' : 'Female'}
              </button>
            </div>
          </div>

          {/* Active Chronic Condition Context */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isAr ? 'الحالات المزمنة المسجلة:' : 'Active Conditions:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['Diabetes', 'Hypertension', 'CKD'].map((cond) => {
                const active = activeConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setActiveConditions(activeConditions.filter((c) => c !== cond));
                      } else {
                        setActiveConditions([...activeConditions, cond]);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Presets */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isAr ? 'نماذج تحاليل جاهزة للاختبار الفوري:' : 'Instant Clinical Presets:'}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="text-start p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 transition-all group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {isAr ? preset.titleAr : preset.titleEn}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {preset.params.map((p) => p.name).join(' • ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Parameters Input Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isAr ? 'قائمة الفحوصات والمؤشرات المدخلة:' : 'Biomarker Parameter List:'}
          </h3>
          <button
            onClick={handleAddParam}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة تحليل جديد' : 'Add Parameter'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {parameters.map((param, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 items-center"
            >
              {/* Test Name */}
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-medium text-slate-400 mb-1">
                  {isAr ? 'اسم الفحص / التحليل' : 'Test / Biomarker Name'}
                </label>
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g. Fasting Blood Sugar"
                />
              </div>

              {/* Value */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-medium text-slate-400 mb-1">
                  {isAr ? 'النتيجة الرقمية' : 'Value'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={param.value}
                  onChange={(e) => handleParamChange(index, 'value', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Unit */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-medium text-slate-400 mb-1">
                  {isAr ? 'الوحدة المخبرية' : 'Unit'}
                </label>
                <input
                  type="text"
                  value={param.unit}
                  onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:border-cyan-400 focus:outline-none"
                  placeholder="mg/dL, mmol/L, %"
                />
              </div>

              {/* Delete Button */}
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveParam(index)}
                  disabled={parameters.length <= 1}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleInterpret}
          disabled={isLoading || parameters.length === 0}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <HeartPulse className="w-4 h-4" />
          )}
          <span>{isAr ? 'تحليل وتفسير النتائج سريرياً' : 'Interpret Lab Parameters'}</span>
        </button>
      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Summary Banner */}
          {summary && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-slate-300">
                  {isAr ? 'إجمالي التحاليل: ' : 'Total: '}
                  <strong className="text-white">{summary.totalAnalyzed}</strong>
                </span>
                <span className="text-emerald-400">
                  {isAr ? 'طبيعي: ' : 'Normal: '}
                  <strong>{summary.normalCount}</strong>
                </span>
                <span className="text-amber-400">
                  {isAr ? 'غير طبيعي: ' : 'Abnormal: '}
                  <strong>{summary.abnormalCount}</strong>
                </span>
                {summary.criticalCount > 0 && (
                  <span className="text-red-400 animate-pulse font-bold">
                    {isAr ? 'حالات حرجة: ' : 'Critical: '}
                    <strong>{summary.criticalCount}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cards for each parameter */}
          <div className="grid grid-cols-1 gap-4">
            {results.map((res, index) => (
              <div
                key={index}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                  res.status === 'Critical'
                    ? 'border-red-500/60 shadow-lg shadow-red-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{isAr ? res.testNameAr : res.testName}</span>
                      <span className="text-xs text-slate-400 font-normal">({res.testName})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">{isAr ? res.categoryAr : res.category}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                      {res.resultValue} {res.unit}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full border ${getStatusBadge(res.status)}`}>
                      {res.status}
                    </span>
                  </div>
                </div>

                {/* Reference Range info */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-slate-400">{isAr ? 'النطاق الطبيعي المعتمد: ' : 'Reference Range: '}</span>
                    <strong className="text-slate-200">
                      {isAr ? res.referenceRange.textRangeAr || res.referenceRange.textRange : res.referenceRange.textRange}
                    </strong>
                  </div>
                  {res.unitAwareNote && (
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {res.unitAwareNote}
                    </span>
                  )}
                </div>

                {/* Explanations & Clinical Reasoning */}
                <div className="space-y-2 text-xs">
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {isAr ? res.interpretation.flagExplanationAr : res.interpretation.flagExplanationEn}
                  </p>

                  {res.interpretation.criticalWarningAr && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{isAr ? res.interpretation.criticalWarningAr : res.interpretation.criticalWarningEn}</span>
                    </div>
                  )}

                  <div className="text-slate-400 text-[11px] pt-1 leading-relaxed">
                    <strong>{isAr ? 'التوجيه السريري والمتابعة: ' : 'Recommended Follow-up: '}</strong>
                    {isAr ? res.interpretation.recommendedFollowUpAr : res.interpretation.recommendedFollowUpEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
