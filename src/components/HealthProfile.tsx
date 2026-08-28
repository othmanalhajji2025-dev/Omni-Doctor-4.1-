import React, { useState, useEffect } from 'react';
import {
  FolderHeart,
  Activity,
  Plus,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { PatientProfileRecord, VitalLogRecord, EncounterHistoryRecord } from '../../server/db/store.js';

export const HealthProfile: React.FC = () => {
  const { language } = useLanguage();

  const [profile, setProfile] = useState<PatientProfileRecord | null>(null);
  const [vitals, setVitals] = useState<VitalLogRecord[]>([]);
  const [encounters, setEncounters] = useState<EncounterHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Vital Form State
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [newSys, setNewSys] = useState('124');
  const [newDia, setNewDia] = useState('80');
  const [newHr, setNewHr] = useState('72');
  const [newSpo2, setNewSpo2] = useState('98');
  const [newTemp, setNewTemp] = useState('36.8');
  const [newGlucose, setNewGlucose] = useState('102');
  const [newNotes, setNewNotes] = useState('');

  // New Medication Form State
  const [showMedModal, setShowMedModal] = useState(false);
  const [newMedNameAr, setNewMedNameAr] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');

  const loadData = async () => {
    try {
      const [pRes, vRes, eRes] = await Promise.all([
        fetch('/api/records/profile'),
        fetch('/api/records/vitals'),
        fetch('/api/records/encounters')
      ]);
      const pData = await pRes.json();
      const vData = await vRes.json();
      const eData = await eRes.json();
      setProfile(pData);
      setVitals(vData);
      setEncounters(eData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/records/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systolicBP: newSys,
          diastolicBP: newDia,
          heartRate: newHr,
          spO2: newSpo2,
          temperature: newTemp,
          bloodGlucose: newGlucose,
          notes: newNotes
        })
      });
      if (res.ok) {
        setShowVitalModal(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedNameAr) return;
    try {
      const res = await fetch('/api/records/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: newMedNameAr,
          dosage: newMedDosage,
          frequency: newMedFreq
        })
      });
      if (res.ok) {
        setShowMedModal(false);
        setNewMedNameAr('');
        setNewMedDosage('');
        setNewMedFreq('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMedication = async (id: string) => {
    try {
      await fetch(`/api/records/medications/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <span>{language === 'ar' ? 'جارٍ تحميل السجل الطبي الموحد...' : 'Loading Medical Record...'}</span>
      </div>
    );
  }

  const bmi = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <FolderHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {language === 'ar' ? 'الملف الصحي والمؤشرات الحيوية' : 'Health Profile & Electronic Health Record'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'سجل طبي موحد يربط الأمراض المزمنة والأدوية وقراءات العلامات الحيوية بجلسات الفرز السريري'
                  : 'Unified patient record coordinating chronic comorbidities, vitals, and triage encounters'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Demographic Profile Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">
              {language === 'ar' ? profile.fullName : profile.fullNameEn}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              {profile.age} {language === 'ar' ? 'سنة' : 'years'} • {profile.gender} • {language === 'ar' ? 'فصيلة الدم: ' : 'Blood: '}
              <span className="text-emerald-400 font-bold">{profile.bloodType}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
              {language === 'ar' ? 'الطول: ' : 'Height: '} <span className="font-mono text-white">{profile.heightCm} cm</span>
            </div>
            <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
              {language === 'ar' ? 'الوزن: ' : 'Weight: '} <span className="font-mono text-white">{profile.weightKg} kg</span>
            </div>
            <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
              {language === 'ar' ? 'مؤشر كتلة الجسم (BMI): ' : 'BMI: '} <span className="font-mono text-emerald-400 font-bold">{bmi}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Chronic Conditions */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300 block">
              {language === 'ar' ? 'الأمراض والمشكلات المزمنة المصاحبة:' : 'Chronic Comorbidities:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.chronicConditions.map(c => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  {language === 'ar' ? c.nameAr : c.nameEn} ({c.sinceYear})
                </span>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-red-300 block flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{language === 'ar' ? 'الحساسية الدوائية والغذائية المسجلة:' : 'Documented Drug & Food Allergies:'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.allergies.map(a => (
                <span
                  key={a.id}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-semibold"
                >
                  {language === 'ar' ? a.allergenAr : a.allergenEn} [{a.severity}]
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Medications Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">
            {language === 'ar' ? 'الأدوية والعلاجات الحالية:' : 'Current Active Medications:'}
          </h2>
          <button
            onClick={() => setShowMedModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'إضافة دواء' : 'Add Medication'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {profile.currentMedications.map(med => (
            <div
              key={med.id}
              className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-2"
            >
              <div>
                <div className="font-bold text-xs text-white">{med.nameAr}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{med.dosage} • {med.frequency}</div>
                <div className="text-[10px] text-slate-500 mt-1">{language === 'ar' ? 'تاريخ البدء: ' : 'Start Date: '} {med.startDate}</div>
              </div>
              <button
                onClick={() => handleRemoveMedication(med.id)}
                className="text-slate-500 hover:text-red-400 p-1"
                title={language === 'ar' ? 'حذف الدواء' : 'Remove Medication'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Vitals History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">
              {language === 'ar' ? 'سجل المؤشرات والعلامات الحيوية:' : 'Vital Signs Log & History:'}
            </h2>
          </div>
          <button
            onClick={() => setShowVitalModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تسجيل قراءة حيوية' : 'Log New Vitals'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5 font-semibold text-start">{language === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                <th className="p-2.5 font-semibold text-start">{language === 'ar' ? 'ضغط الدم (BP)' : 'Blood Pressure'}</th>
                <th className="p-2.5 font-semibold text-start">{language === 'ar' ? 'النبض' : 'Heart Rate'}</th>
                <th className="p-2.5 font-semibold text-start">{language === 'ar' ? 'الأكسجين SpO2' : 'SpO2'}</th>
                <th className="p-2.5 font-semibold text-start">{language === 'ar' ? 'الحرارة' : 'Temp'}</th>
                <th className="p-2.5 font-semibold text-start">{language === 'ar' ? 'السكر' : 'Glucose'}</th>
                <th className="p-2.5 font-semibold text-start">{language === 'ar' ? 'ملاحظات' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vitals.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/40">
                  <td className="p-2.5 text-slate-300 font-mono">
                    {new Date(v.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-white">
                    {v.systolicBP}/{v.diastolicBP} mmHg
                  </td>
                  <td className="p-2.5 font-mono text-slate-200">{v.heartRate} bpm</td>
                  <td className="p-2.5 font-mono text-emerald-400 font-bold">{v.spO2}%</td>
                  <td className="p-2.5 font-mono text-slate-200">{v.temperature}°C</td>
                  <td className="p-2.5 font-mono text-slate-200">{v.bloodGlucose ? `${v.bloodGlucose} mg/dL` : '-'}</td>
                  <td className="p-2.5 text-slate-400">{v.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Past Triage Encounters History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-400" />
          <span>{language === 'ar' ? 'سجل استشارات الفرز السريري السابقة:' : 'Clinical Consultation & Triage Encounters:'}</span>
        </h2>

        <div className="space-y-2.5">
          {encounters.map(enc => (
            <div
              key={enc.id}
              className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">{enc.symptoms}</div>
                <div className="text-[11px] text-slate-400">
                  {language === 'ar' ? 'الاحتمالات المطروحة: ' : 'Differentials: '}
                  {enc.differentials.map(d => (language === 'ar' ? d.nameAr : d.nameEn)).join(' • ')}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {language === 'ar' ? enc.urgencyLabelAr : enc.urgencyLabelEn}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(enc.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Vital Modal */}
      {showVitalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="text-base font-bold mb-4">
              {language === 'ar' ? 'تسجيل مؤشرات حيوية جديدة' : 'Log New Vital Signs'}
            </h3>
            <form onSubmit={handleAddVital} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الضغط الانقباضي</label>
                  <input
                    type="number"
                    value={newSys}
                    onChange={e => setNewSys(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الضغط الانبساطي</label>
                  <input
                    type="number"
                    value={newDia}
                    onChange={e => setNewDia(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">النبض</label>
                  <input
                    type="number"
                    value={newHr}
                    onChange={e => setNewHr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الأكسجين %</label>
                  <input
                    type="number"
                    value={newSpo2}
                    onChange={e => setNewSpo2(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الحرارة °C</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTemp}
                    onChange={e => setNewTemp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ملاحظات سريرية</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="مثال: بعد التمرين، صائم 8 ساعات..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVitalModal(false)}
                  className="px-4 py-2 bg-slate-800 text-xs rounded-lg text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white"
                >
                  حفظ القراءة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="text-base font-bold mb-4">
              {language === 'ar' ? 'إضافة دواء جديد للملف' : 'Add Medication to Record'}
            </h3>
            <form onSubmit={handleAddMedication} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">اسم الدواء العلمي أو التجاري</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أوميبرازول (Omeprazole)"
                  value={newMedNameAr}
                  onChange={e => setNewMedNameAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">الجرعة</label>
                <input
                  type="text"
                  placeholder="مثال: 20 mg"
                  value={newMedDosage}
                  onChange={e => setNewMedDosage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">التكرار والتعليمات</label>
                <input
                  type="text"
                  placeholder="مثال: مرة واحدة صباحاً قبل الإفطار"
                  value={newMedFreq}
                  onChange={e => setNewMedFreq(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 bg-slate-800 text-xs rounded-lg text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white"
                >
                  إضافة الدواء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
