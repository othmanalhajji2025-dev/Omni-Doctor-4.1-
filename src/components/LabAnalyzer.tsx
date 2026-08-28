import React, { useState } from 'react';
import {
  FileUp,
  FlaskConical,
  Calendar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { MedicalDocumentsTab } from './documents/MedicalDocumentsTab.js';
import { LabInterpretationTab } from './documents/LabInterpretationTab.js';
import { HealthTimelineTab } from './documents/HealthTimelineTab.js';
import { Phase8TestSuiteTab } from './documents/Phase8TestSuiteTab.js';

export const LabAnalyzer: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'documents' | 'interpreter' | 'timeline' | 'test_suite'>('documents');

  const subTabs = [
    {
      id: 'documents' as const,
      labelAr: 'المستندات ومسح التقارير (OCR)',
      labelEn: 'Medical Documents & OCR',
      icon: FileUp,
      badge: isAr ? 'جديد' : 'New',
    },
    {
      id: 'interpreter' as const,
      labelAr: 'مفسر التحاليل والمؤشرات الحيوية',
      labelEn: 'Biomarker Interpreter',
      icon: FlaskConical,
    },
    {
      id: 'timeline' as const,
      labelAr: 'الخط الزمني الصحي الشامل',
      labelEn: 'Health Timeline',
      icon: Calendar,
      badge: '6-Points',
    },
    {
      id: 'test_suite' as const,
      labelAr: 'حزمة الاختبارات الشاملة (Phase 8)',
      labelEn: 'Phase 8 Test Suite',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Content Rendering */}
      <div>
        {activeSubTab === 'documents' && (
          <MedicalDocumentsTab
            onDocumentConfirmed={() => {
              // Optionally transition to timeline after confirmation
            }}
          />
        )}
        {activeSubTab === 'interpreter' && <LabInterpretationTab />}
        {activeSubTab === 'timeline' && <HealthTimelineTab />}
        {activeSubTab === 'test_suite' && <Phase8TestSuiteTab />}
      </div>
    </div>
  );
};
