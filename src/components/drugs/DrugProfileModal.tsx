import React from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, BookOpen, Clock, Activity, FileText } from 'lucide-react';
import { DrugProfile } from '../../../server/drugs/types.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface DrugProfileModalProps {
  profile: DrugProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DrugProfileModal: React.FC<DrugProfileModalProps> = ({ profile, isOpen, onClose }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isAr ? profile.genericNameAr : profile.genericName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                {profile.genericName}
              </span>
              {profile.metadata.isDemoSeedData && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                  {isAr ? 'بيانات تجريبية (Demo Seed)' : 'Demo Seed Data'}
                </span>
              )}
            </div>
            <div className="text-xs text-indigo-400 font-medium">
              {isAr ? profile.drugClassAr : profile.drugClass}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-200">
          {/* FDA Boxed Warning (if present) */}
          {profile.boxedWarningEn && (
            <div className="p-4 rounded-xl bg-red-950/40 border-2 border-red-500/80 text-red-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-300">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>{isAr ? 'تحذير الصندوق الأسود (FDA Boxed Warning)' : 'FDA Black Boxed Warning'}</span>
              </div>
              <p className="text-xs leading-relaxed text-red-200/90 font-medium">
                {isAr ? profile.boxedWarningAr || profile.boxedWarningEn : profile.boxedWarningEn}
              </p>
            </div>
          )}

          {/* Brand Names & Active Ingredients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{isAr ? 'الأسماء التجارية الشائعة (Brand Names):' : 'Common Brand Names:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.brandNames.map((bn, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    {bn}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'المواد الفعالة (Active Ingredients):' : 'Active Ingredients:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.activeIngredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-emerald-950/50 text-emerald-300 text-xs font-medium border border-emerald-500/30"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Common Uses */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isAr ? 'دواعي الاستعمال السريرية (Common Clinical Uses):' : 'Common Clinical Indications:'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(isAr ? profile.commonUsesAr : profile.commonUsesEn).map((use, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{use}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings & Precautions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{isAr ? 'التحذيرات والاحتياطات (Warnings & Precautions):' : 'Warnings & Precautions:'}</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5">
              {(isAr ? profile.warningsAr : profile.warningsEn).map((w, idx) => (
                <li key={idx} className="leading-relaxed">
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Contraindications */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>{isAr ? 'موانع الاستعمال (Contraindications):' : 'Contraindications:'}</span>
            </h3>
            <div className="space-y-1.5">
              {(isAr ? profile.contraindicationsAr : profile.contraindicationsEn).map((c, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-200 flex items-start gap-2"
                >
                  <span className="text-red-400 font-bold">•</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side Effects Grid (Common vs Serious) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                {isAr ? 'الآثار الجانبية الشائعة (Common):' : 'Common Side Effects:'}
              </span>
              <ul className="space-y-1 text-xs text-slate-400">
                {(isAr ? profile.commonSideEffectsAr : profile.commonSideEffectsEn).map((se, idx) => (
                  <li key={idx}>• {se}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
              <span className="text-xs font-bold text-rose-300 block">
                {isAr ? 'الآثار الجانبية الخطيرة (Serious - Alert):' : 'Serious Side Effects:'}
              </span>
              <ul className="space-y-1 text-xs text-rose-200/90">
                {(isAr ? profile.seriousSideEffectsAr : profile.seriousSideEffectsEn).map((se, idx) => (
                  <li key={idx}>⚠ {se}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Interactions */}
          {profile.interactions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                {isAr ? 'أهم التفاعلات الدوائية المرصودة (Key Interactions):' : 'Documented Drug Interactions:'}
              </h3>
              <div className="space-y-2">
                {profile.interactions.map((inter, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {inter.interactingDrugOrClass}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
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
                    <p className="text-slate-300">
                      {isAr ? inter.clinicalEffectAr : inter.clinicalEffectEn}
                    </p>
                    <div className="text-emerald-400 text-[11px] font-medium">
                      {isAr ? `التدبير: ${inter.managementAr}` : `Management: ${inter.managementEn}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provenance Metadata & Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>{isAr ? 'مصدر الوثيقة:' : 'Source:'} {profile.metadata.sourceName}</span>
              <span>{isAr ? 'آخر مراجعة:' : 'Last Reviewed:'} {profile.metadata.lastUpdated}</span>
            </div>
            <p className="text-slate-400 italic">
              {isAr
                ? 'ملاحظة: هذه البيانات مدرجة كعينة تجريبية (Demo Seed Data) ضمن معمارية مصادر البيانات متعددة الطبقات. لا تغني عن المراجع الرسمية.'
                : profile.metadata.disclaimer}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            {isAr ? 'إغلاق الملف' : 'Close Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
