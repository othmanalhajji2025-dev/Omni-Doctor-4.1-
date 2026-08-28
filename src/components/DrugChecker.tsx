import React, { useState } from 'react';
import {
  Pill,
  ShieldAlert,
  Search,
  Building2,
  Layers,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { DrugSafetyEngineTab } from './drugs/DrugSafetyEngineTab.js';
import { DrugSearchTab } from './drugs/DrugSearchTab.js';
import { YemenMdTab } from './drugs/YemenMdTab.js';
import { DataSourceArchitectureTab } from './drugs/DataSourceArchitectureTab.js';

type DrugTab = 'safety' | 'search' | 'yemenmd' | 'architecture';

export const DrugChecker: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<DrugTab>('safety');

  const tabs: { id: DrugTab; labelAr: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'safety',
      labelAr: 'محرك السلامة وتكرار المواد (Safety Engine)',
      labelEn: 'Safety & Interaction Engine',
      icon: ShieldAlert,
    },
    {
      id: 'search',
      labelAr: 'البحث الدوائي والملف الإكلينيكي (Drug Search)',
      labelEn: 'Drug Search & Clinical Profiles',
      icon: Search,
    },
    {
      id: 'yemenmd',
      labelAr: 'الدليل الدوائي اليمني (YemenMD)',
      labelEn: 'YemenMD Local Registry',
      icon: Building2,
    },
    {
      id: 'architecture',
      labelAr: 'معمارية المصادر والفحص الآلي (Architecture & Tests)',
      labelEn: 'Data Sources & Test Suite',
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Module Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isAr ? 'وحدة الاستخبارات الدوائية والفرز الإكلينيكي' : 'Drug Intelligence & Safety Platform'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40">
                  Phase 7
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'فحص موثوق للأدوية، تكرار المواد الفعالة، تعارضات الحساسية، والأمراض، مع الدليل الدوائي اليمني المستقل'
                  : 'Multi-parameter safety engine, clinical profiles, duplicate ingredient alerts & isolated YemenMD formulary'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isAr ? 'نظام الأمان نشط (FDA/BNF Benchmark)' : 'Safety Engine Active'}</span>
          </div>
        </div>

        {/* Sub-Navigation Segments */}
        <div className="flex flex-wrap gap-1.5 pt-4 mt-4 border-t border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === 'safety' && <DrugSafetyEngineTab />}
      {activeTab === 'search' && <DrugSearchTab />}
      {activeTab === 'yemenmd' && <YemenMdTab />}
      {activeTab === 'architecture' && <DataSourceArchitectureTab />}
    </div>
  );
};
export default DrugChecker;
