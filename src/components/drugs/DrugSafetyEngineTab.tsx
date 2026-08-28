import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Sparkles,
  UserCheck,
  Activity,
  Heart,
  Baby,
  Stethoscope,
  Copy,
  Info,
  Pill,
} from 'lucide-react';
import { DrugSafetyCheckResult } from '../../../server/drugs/types.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const DrugSafetyEngineTab: React.FC = () => {
  const { language } = useLanguage();
  const { isAuthenticated, token } = useAuth();
  const isAr = language === 'ar';

  const [currentMedications, setCurrentMedications] = useState<string[]>(['Warfarin', 'Ibuprofen']);
  const [medInput, setMedInput] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');
  const [isPregnant, setIsPregnant] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState<DrugSafetyCheckResult | null>(null);

  // Quick Preset Scenarios
  const presetScenarios = [
    {
      titleAr: 'تكرار المادة الفعالة (Panadol + Tylenol)',
      titleEn: 'Duplicate Paracetamol (Panadol + Tylenol)',
      meds: ['Panadol', 'Tylenol'],
      allergies: [],
      conditions: [],
      pregnant: false,
    },
    {
      titleAr: 'حساسية البنسلين مع أوجمنتين',
      titleEn: 'Penicillin Allergy + Augmentin',
      meds: ['Augmentin'],
      allergies: ['Penicillin and Beta-lactams'],
      conditions: [],
      pregnant: false,
    },
    {
      titleAr: 'قرحة المعدة مع إيبوبروفين',
      titleEn: 'Peptic Ulcer + Ibuprofen',
      meds: ['Ibuprofen'],
      allergies: [],
      conditions: ['Peptic Ulcer Disease'],
      pregnant: false,
    },
    {
      titleAr: 'نزيف سيولة: وارفارين + إيبوبروفين',
      titleEn: 'Critical Bleed: Warfarin + Ibuprofen',
      meds: ['Warfarin', 'Ibuprofen'],
      allergies: [],
      conditions: [],
      pregnant: false,
    },
    {
      titleAr: 'حمل + أتورفاستاتين + ليزينوبريل',
      titleEn: 'Pregnancy + Statin + Lisinopril',
      meds: ['Atorvastatin', 'Lisinopril'],
      allergies: [],
      conditions: [],
      pregnant: true,
    },
    {
      titleAr: 'نظام آمن متوافق (Paracetamol + Metformin)',
      titleEn: 'Safe Compatible Regimen (Paracetamol + Metformin)',
      meds: ['Paracetamol', 'Metformin'],
      allergies: [],
      conditions: [],
      pregnant: false,
    },
  ];

  // Quick chips
  const commonMeds = ['Panadol', 'Tylenol', 'Advil', 'Augmentin', 'Glucophage', 'Lipitor', 'Plavix', 'Lasix', 'Zestril', 'Cipralex'];
  const commonAllergies = ['Penicillin', 'Sulfa / Sulfonamides', 'NSAIDs / Aspirin', 'Statins', 'Opioids'];
  const commonConditions = ['Peptic Ulcer Disease', 'Chronic Kidney Disease (CKD)', 'Asthma', 'Heart Failure', 'Liver Disease'];

  const addMed = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !currentMedications.includes(trimmed)) {
      setCurrentMedications([...currentMedications, trimmed]);
      setMedInput('');
    }
  };

  const removeMed = (name: string) => {
    setCurrentMedications(currentMedications.filter(m => m !== name));
  };

  const addAllergy = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (name: string) => {
    setAllergies(allergies.filter(a => a !== name));
  };

  const addCondition = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !conditions.includes(trimmed)) {
      setConditions([...conditions, trimmed]);
      setConditionInput('');
    }
  };

  const removeCondition = (name: string) => {
    setConditions(conditions.filter(c => c !== name));
  };

  const loadScenario = (s: typeof presetScenarios[0]) => {
    setCurrentMedications(s.meds);
    setAllergies(s.allergies);
    setConditions(s.conditions);
    setIsPregnant(s.pregnant);
    setNewMedication('');
    setSafetyResult(null);
  };

  const handleImportProfile = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/clinical/ehr', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.medications && data.medications.length > 0) {
        setCurrentMedications(data.medications.map((m: any) => m.nameEn || m.nameAr));
      }
      if (data.allergies && data.allergies.length > 0) {
        setAllergies(data.allergies.map((a: any) => a.allergenEn || a.allergenAr));
      }
      if (data.conditions && data.conditions.length > 0) {
        setConditions(data.conditions.map((c: any) => c.nameEn || c.nameAr));
      }
    } catch (err) {
      console.error('Failed to import user profile:', err);
    }
  };

  const handleEvaluateSafety = async () => {
    if (currentMedications.length === 0 && !newMedication) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/drugs/safety-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentMedications,
          newMedication: newMedication.trim() || undefined,
          allergies,
          conditions,
          isPregnant,
        }),
      });
      const data = await res.json();
      setSafetyResult(data);
    } catch (err) {
      console.error('Safety evaluation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadge = (level: DrugSafetyCheckResult['overallRiskLevel']) => {
    switch (level) {
      case 'CRITICAL_STOP':
        return {
          bg: 'bg-red-500/20 border-red-500/80 text-red-300',
          indicator: 'bg-red-500 animate-ping',
          titleAr: 'تنبيه حرج قطعي — إيقاف فوري (CRITICAL STOP)',
          titleEn: 'CRITICAL CLINICAL STOP (Absolute Contraindication)',
        };
      case 'HIGH_RISK':
        return {
          bg: 'bg-amber-500/20 border-amber-500/80 text-amber-300',
          indicator: 'bg-amber-500',
          titleAr: 'خطورة علاجية مرتفعة (HIGH RISK)',
          titleEn: 'HIGH RISK (Major Interventions Required)',
        };
      case 'MODERATE_PRECAUTION':
        return {
          bg: 'bg-yellow-500/20 border-yellow-500/80 text-yellow-300',
          indicator: 'bg-yellow-500',
          titleAr: 'احتياطات ومراقبة سريرية (MODERATE PRECAUTION)',
          titleEn: 'MODERATE PRECAUTION (Monitoring Recommended)',
        };
      case 'SAFE':
        return {
          bg: 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300',
          indicator: 'bg-emerald-500',
          titleAr: 'نظام دوائي آمن ومتوافق (SAFE)',
          titleEn: 'SAFE CLINICAL REGIMEN (No Incompatibilities)',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Preset Scenarios */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{isAr ? 'سيناريوهات سريرية معيارية للاختبار المباشر (1-Click Test):' : 'Clinical Benchmark Scenarios (1-Click Test):'}</span>
          </div>
          {isAuthenticated && (
            <button
              onClick={handleImportProfile}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'استيراد من سجلي الصحي' : 'Import from EHR'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {presetScenarios.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => loadScenario(sc)}
              className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-start text-xs transition-all space-y-1"
            >
              <div className="font-bold text-slate-200">{isAr ? sc.titleAr : sc.titleEn}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                [{sc.meds.join(', ')}]
                {sc.allergies.length > 0 && ` • حساسية: ${sc.allergies.join(', ')}`}
                {sc.conditions.length > 0 && ` • مرض: ${sc.conditions.join(', ')}`}
                {sc.pregnant && ' • حمل'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Safety Evaluation Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
        {/* 1. Current Medications */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? '1. قائمة الأدوية الحالية للمريض (Current Medications):' : '1. Current Medications:'}</span>
            </label>
            <span className="text-[11px] text-slate-400">{currentMedications.length} {isAr ? 'أدوية محددة' : 'selected'}</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={medInput}
              onChange={(e) => setMedInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMed(medInput)}
              placeholder={isAr ? 'أدخل اسم الدواء (مثال: Panadol, Warfarin, Metformin)...' : 'Enter medication name...'}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => addMed(medInput)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 min-h-[48px]">
            {currentMedications.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 text-xs font-medium"
              >
                <span>{m}</span>
                <button type="button" onClick={() => removeMed(m)} className="text-indigo-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {currentMedications.length === 0 && (
              <span className="text-xs text-slate-500 self-center">
                {isAr ? 'أدخل الأدوية الحالية أو اختر من الأزرار السريعة أدناه...' : 'No medications added yet...'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-slate-500 text-[11px]">{isAr ? 'إضافة سريعة:' : 'Quick add:'}</span>
            {commonMeds.map((med) => (
              <button
                key={med}
                type="button"
                onClick={() => addMed(med)}
                disabled={currentMedications.includes(med)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
              >
                + {med}
              </button>
            ))}
          </div>
        </div>

        {/* 2. New Medication to Evaluate (Optional single agent check) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '2. دواء جديد مقترح وصفه للمريض (New Medication to Prescribe - Optional):' : '2. New Medication to Evaluate (Optional):'}</span>
          </label>
          <input
            type="text"
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            placeholder={isAr ? 'مثال: Augmentin, Ibuprofen, Clarithromycin...' : 'e.g. Augmentin, Ibuprofen...'}
            className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 3. Patient Allergies */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-red-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{isAr ? '3. الحساسيات الدوائية المسجلة (Patient Drug Allergies):' : '3. Patient Drug Allergies:'}</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAllergy(allergyInput)}
              placeholder={isAr ? 'أدخل الحساسية (مثال: Penicillin, Sulfa, Aspirin)...' : 'Enter allergen...'}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
            <button
              type="button"
              onClick={() => addAllergy(allergyInput)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 min-h-[44px]">
            {allergies.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 text-red-200 border border-red-500/40 text-xs font-medium"
              >
                <span>{a}</span>
                <button type="button" onClick={() => removeAllergy(a)} className="text-red-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {allergies.length === 0 && (
              <span className="text-xs text-slate-500 self-center">
                {isAr ? 'لا توجد حساسيات مسجلة (انقر على الحساسيات الشائعة أدناه للاختبار)...' : 'No allergies selected...'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-slate-500 text-[11px]">{isAr ? 'حساسيات شائعة:' : 'Common allergies:'}</span>
            {commonAllergies.map((al) => (
              <button
                key={al}
                type="button"
                onClick={() => addAllergy(al)}
                disabled={allergies.includes(al)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-[11px] border border-slate-700"
              >
                + {al}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Relevant Medical Conditions */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-amber-400" />
            <span>{isAr ? '4. الحالات المرضية المشخصة (Relevant Medical Conditions):' : '4. Relevant Medical Conditions:'}</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCondition(conditionInput)}
              placeholder={isAr ? 'أدخل الحالة (مثال: Peptic Ulcer, Kidney Disease, Asthma)...' : 'Enter condition...'}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => addCondition(conditionInput)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 min-h-[44px]">
            {conditions.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/40 text-xs font-medium"
              >
                <span>{c}</span>
                <button type="button" onClick={() => removeCondition(c)} className="text-amber-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {conditions.length === 0 && (
              <span className="text-xs text-slate-500 self-center">
                {isAr ? 'لا توجد حالات مسجلة...' : 'No medical conditions added...'}
              </span>
            )}
          </div>

          {/* Quick Conditions & Pregnancy toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-slate-500 text-[11px]">{isAr ? 'أمراض شائعة:' : 'Common conditions:'}</span>
              {commonConditions.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => addCondition(cond)}
                  disabled={conditions.includes(cond)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-[11px] border border-slate-700"
                >
                  + {cond}
                </button>
              ))}
            </div>

            {/* Pregnancy Checkbox */}
            <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 hover:border-pink-500/50">
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className="rounded border-slate-700 text-pink-500 focus:ring-pink-500"
              />
              <Baby className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-semibold">{isAr ? 'حمل حالي (Pregnancy Flag)' : 'Active Pregnancy'}</span>
            </label>
          </div>
        </div>

        {/* Big Action Button */}
        <button
          onClick={handleEvaluateSafety}
          disabled={isLoading || (currentMedications.length === 0 && !newMedication)}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span>{isAr ? 'جارٍ فحص التفاعلات وتكرار المواد والحساسيات...' : 'Evaluating Multi-Dimensional Safety...'}</span>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5" />
              <span>
                {isAr
                  ? `تشغيل محرك الأمان الدوائي (${currentMedications.length + (newMedication ? 1 : 0)} أدوية)`
                  : `Execute Safety Engine (${currentMedications.length + (newMedication ? 1 : 0)} Medications)`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Safety Evaluation Results */}
      {safetyResult && (
        <div className="space-y-5">
          {/* Composite Risk Gauge Banner */}
          {(() => {
            const risk = getRiskBadge(safetyResult.overallRiskLevel);
            return (
              <div className={`p-5 rounded-2xl border-2 ${risk.bg} space-y-2 shadow-md relative overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${risk.indicator}`} />
                    <h2 className="text-base font-bold tracking-tight">
                      {isAr ? risk.titleAr : risk.titleEn}
                    </h2>
                  </div>
                  <div className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/60 font-bold">
                    Risk Score: {safetyResult.riskScore}/100
                  </div>
                </div>

                <p className="text-xs leading-relaxed font-medium">
                  {isAr ? safetyResult.clinicalSummaryAr : safetyResult.clinicalSummaryEn}
                </p>
              </div>
            );
          })()}

          {/* 1. Duplicate Active Ingredients Alerts */}
          {safetyResult.duplicateActiveIngredients.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-rose-400" />
                <span>
                  {isAr
                    ? 'تحذير تكرار المادة الفعالة (Duplicate Active Ingredients Alert):'
                    : 'Duplicate Active Ingredients Detected:'}
                </span>
              </h3>
              <div className="space-y-2.5">
                {safetyResult.duplicateActiveIngredients.map((dup, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/70 text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-rose-200">
                        {isAr ? 'المادة المشتركة:' : 'Shared Active Ingredient:'}{' '}
                        <span className="text-white underline">{isAr ? dup.activeIngredientAr : dup.activeIngredient}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/60">
                        {dup.severity} OVERDOSE RISK
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-slate-400">{isAr ? 'المستحضرات المتعارضة:' : 'Conflicting Drugs:'}</span>
                      {dup.conflictingMedications.map((m, mIdx) => (
                        <span key={mIdx} className="px-2 py-0.5 rounded bg-rose-900/60 text-white font-bold">
                          {m}
                        </span>
                      ))}
                    </div>

                    <p className="text-rose-200 leading-relaxed font-medium">
                      {isAr ? dup.clinicalRiskAr : dup.clinicalRiskEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Drug-Allergy Alerts */}
          {safetyResult.allergyAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>
                  {isAr
                    ? 'تعارض الحساسية الدوائية (Drug-Allergy Incompatibility):'
                    : 'Drug-Allergy Incompatibilities:'}
                </span>
              </h3>
              <div className="space-y-2">
                {safetyResult.allergyAlerts.map((al, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-red-950/40 border border-red-500/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{al.medication}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-300 border border-red-500/60">
                        {al.severity}
                      </span>
                    </div>
                    <div className="text-red-200 font-semibold">
                      {isAr ? 'الحساسية المسجلة:' : 'Patient Allergy:'} {al.patientAllergy}
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {isAr ? al.reactionRiskAr : al.reactionRiskEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Disease-Drug Contraindication Alerts */}
          {safetyResult.conditionContraindications.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  {isAr
                    ? 'تعارض الأدوية مع الحالات المرضية (Disease-Drug Incompatibility):'
                    : 'Disease-Drug Incompatibilities:'}
                </span>
              </h3>
              <div className="space-y-2">
                {safetyResult.conditionContraindications.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/60 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{c.medication} ⇄ {isAr ? c.conditionAr : c.condition}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/60">
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {isAr ? c.explanationAr : c.explanationEn}
                    </p>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-medium">
                      {isAr ? `التوصية: ${c.recommendationAr}` : `Recommendation: ${c.recommendationEn}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Drug-Drug Interactions */}
          {safetyResult.drugInteractions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>
                  {isAr
                    ? 'التفاعلات الدوائية المتبادلة (Drug-Drug Interactions):'
                    : 'Potential Drug-Drug Interactions:'}
                </span>
              </h3>
              <div className="space-y-3">
                {safetyResult.drugInteractions.map((inter, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="text-sm font-bold text-white">{inter.interactingDrugOrClass}</span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          inter.severity === 'CONTRAINDICATED'
                            ? 'bg-red-500/20 text-red-300 border-red-500/60'
                            : inter.severity === 'MAJOR'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60'
                        }`}
                      >
                        {inter.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400">{isAr ? 'الآلية الحركية:' : 'Mechanism:'}</span>
                        <p className="text-slate-300 leading-relaxed">
                          {isAr ? inter.mechanismAr : inter.mechanismEn}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-red-400">{isAr ? 'الأثر السريري:' : 'Clinical Effect:'}</span>
                        <p className="text-slate-200 leading-relaxed font-medium">
                          {isAr ? inter.clinicalEffectAr : inter.clinicalEffectEn}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-emerald-400">
                      <span className="font-bold">{isAr ? 'التدبير السريري: ' : 'Clinical Management: '}</span>
                      <span className="text-slate-200 font-normal">
                        {isAr ? inter.managementAr : inter.managementEn}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                      {isAr ? 'المرجع السريري:' : 'Source:'} {inter.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Clinical Recommendations */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'التوصيات السريرية وإرشادات الطبيب والصيدلي:' : 'Clinical Prescriber & Patient Recommendations:'}</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300 leading-relaxed">
              {(isAr ? safetyResult.recommendationsAr : safetyResult.recommendationsEn).map((rec, idx) => (
                <li key={idx} className="font-medium">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
