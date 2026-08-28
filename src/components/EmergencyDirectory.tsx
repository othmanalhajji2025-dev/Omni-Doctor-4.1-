import React, { useState, useEffect } from 'react';
import { Siren, PhoneCall, AlertTriangle, HeartPulse, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export const EmergencyDirectory: React.FC = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<{ countries: any[]; firstAidProtocols: any[] } | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<string>('fa-cpr');

  useEffect(() => {
    fetch('/api/emergency/directory')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  if (!data) {
    return <div className="p-8 text-center text-slate-400">Loading emergency directory...</div>;
  }

  const currentProtocol = data.firstAidProtocols.find(p => p.id === activeProtocol) || data.firstAidProtocols[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-950/60 border-2 border-red-500/60 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-950">
            <Siren className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {language === 'ar' ? 'دليل أرقام وبروتوكولات الطوارئ الطبية' : 'Emergency Directory & Critical First-Aid'}
            </h1>
            <p className="text-xs text-red-200 mt-0.5">
              {language === 'ar'
                ? 'أرقام الاتصال المباشر بهيئات الإسعاف الإقليمية وإرشادات الإسعاف الأولي المنقذة للحياة'
                : 'Direct emergency speed dials and standardized life-saving resuscitation algorithms'}
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Country Speed-Dial Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {language === 'ar' ? 'أرقام الطوارئ والإسعاف المعتمدة حسب الدولة:' : 'National Emergency Hotlines:'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.countries.map(c => (
            <div
              key={c.code}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-sm text-white">
                  {language === 'ar' ? c.countryAr : c.countryEn}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {c.code}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Ambulance */}
                <a
                  href={`tel:${c.ambulance.split(' ')[0]}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 hover:bg-red-900/60 transition-all text-red-200 font-bold"
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                    <span>{language === 'ar' ? 'الإسعاف الطبي:' : 'Ambulance:'}</span>
                  </span>
                  <span className="font-mono text-sm bg-red-600 text-white px-2 py-0.5 rounded">
                    {c.ambulance}
                  </span>
                </a>

                {/* Unified Emergency */}
                <a
                  href={`tel:${c.unifiedEmergency.split(' ')[0]}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-all text-slate-300"
                >
                  <span>{language === 'ar' ? 'الطوارئ الموحدة:' : 'Unified Emergency:'}</span>
                  <span className="font-mono font-bold text-emerald-400">{c.unifiedEmergency}</span>
                </a>

                {/* Health Consultation */}
                <a
                  href={`tel:${c.healthConsultation.split(' ')[0]}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-all text-slate-300"
                >
                  <span>{language === 'ar' ? 'الاستشارات الطبية:' : 'Medical Helpline:'}</span>
                  <span className="font-mono text-teal-400 font-semibold">{c.healthConsultation}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* First Aid Step-by-Step Interactive Guides */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span>{language === 'ar' ? 'بروتوكولات الإسعاف الأولي الطارئة (خوارزميات سريرية معتمدة):' : 'Standardized Clinical First-Aid Protocols:'}</span>
        </h2>

        {/* Tab selector for protocols */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {data.firstAidProtocols.map(proto => (
            <button
              key={proto.id}
              onClick={() => setActiveProtocol(proto.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeProtocol === proto.id
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/60 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {language === 'ar' ? proto.titleAr : proto.titleEn}
            </button>
          ))}
        </div>

        {/* Active Protocol Display */}
        {currentProtocol && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-emerald-300">
              {language === 'ar' ? currentProtocol.titleAr : currentProtocol.titleEn}
            </h3>

            <ol className="space-y-2.5">
              {(language === 'ar' ? currentProtocol.stepsAr : currentProtocol.stepsEn).map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-xs text-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold font-mono shrink-0 text-xs">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
