import React, { useState } from 'react';
import {
  ShieldAlert,
  Crown,
  Users,
  BookOpen,
  Pill,
  MapPin,
  Cpu,
  ShieldCheck,
  Lock,
  Activity,
  KeyRound,
  FileCheck2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Alert } from '../../components/ui/index.js';
import { UsersManagementTab } from './UsersManagementTab.js';
import { MedicalKnowledgeTab } from './MedicalKnowledgeTab.js';
import { DrugDatabaseTab } from './DrugDatabaseTab.js';
import { YemenMdManagementTab } from './YemenMdManagementTab.js';
import { AiMonitoringTab } from './AiMonitoringTab.js';
import { SafetyEventsTab } from './SafetyEventsTab.js';
import { RbacMatrixTab } from './RbacMatrixTab.js';
import { AdminSecurityTestSuiteTab } from './AdminSecurityTestSuiteTab.js';

export const AdminPanel: React.FC = () => {
  const { language } = useLanguage();
  const { user, role, hasRole } = useAuth();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<
    'USERS' | 'KNOWLEDGE' | 'DRUGS' | 'YEMENMD' | 'AI_MONITORING' | 'SAFETY_EVENTS' | 'SECURITY_TESTS'
  >('USERS');

  const isAuthorized = hasRole(['ADMINISTRATOR', 'SUPER_ADMIN']);

  // RBAC Access Control Guard at the Frontend level
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
        <Card className="p-8 text-center bg-slate-900/90 border-rose-900/60 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800 flex items-center justify-center mx-auto text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {isAr ? 'منطقة إدارية مقيدة الصلاحيات (RBAC Restricted Area)' : 'Restricted Administrative Portal'}
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {isAr
              ? 'هذه المنطقة مخصصة فقط للمشرفين والمدراء المعتمدين (ADMINISTRATOR / SUPER_ADMIN). يتم تسجيل ومراجعة كافة محاولات الوصول غير المصرح بها أمنياً عبر الخادم وقاعدة البيانات.'
              : 'This portal requires verified administrative privileges. Multi-tier backend and database access control restricts unauthorized requests.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Badge variant="danger" size="md">
              {isAr ? 'الصلاحية الحالية:' : 'Current Role:'} {role || 'GUEST'}
            </Badge>
          </div>
        </Card>
      </div>
    );
  }

  const tabsConfig = [
    {
      id: 'USERS' as const,
      labelAr: 'إدارة المستخدمين',
      labelEn: 'Users & RBAC',
      icon: Users,
    },
    {
      id: 'KNOWLEDGE' as const,
      labelAr: 'المعرفة الطبية',
      labelEn: 'Medical Knowledge',
      icon: BookOpen,
    },
    {
      id: 'DRUGS' as const,
      labelAr: 'قاعدة الأدوية',
      labelEn: 'Drug Database',
      icon: Pill,
    },
    {
      id: 'YEMENMD' as const,
      labelAr: 'بيانات YemenMD',
      labelEn: 'YemenMD Local Data',
      icon: MapPin,
    },
    {
      id: 'AI_MONITORING' as const,
      labelAr: 'مراقبة الذكاء الاصطناعي',
      labelEn: 'AI Monitoring',
      icon: Cpu,
    },
    {
      id: 'SAFETY_EVENTS' as const,
      labelAr: 'أحداث الأمان',
      labelEn: 'Safety Events',
      icon: ShieldAlert,
    },
    {
      id: 'SECURITY_TESTS' as const,
      labelAr: 'فحص الصلاحيات والعزل',
      labelEn: 'RBAC Security Matrix',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-100">
                {isAr ? 'لوحة التحكم والإشراف السريري (Admin Governance Dashboard)' : 'Clinical Administration & Governance'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'إدارة المستخدمين، مصادر المعرفة، الأدوية، المراقبة اللحظية للذكاء الاصطناعي، وأحداث الأمان السريرية'
                  : 'Manage users, medical knowledge, pharmacopeia, AI monitoring telemetry, and clinical safety events'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={role === 'SUPER_ADMIN' ? 'primary' : 'warning'} size="md">
            {role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMINISTRATOR'}
          </Badge>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            {user?.fullName || user?.email}
          </span>
        </div>
      </div>

      {/* Main Module Navigation Tabs */}
      <div className="bg-slate-900/80 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'USERS' && <UsersManagementTab />}
        {activeTab === 'KNOWLEDGE' && <MedicalKnowledgeTab />}
        {activeTab === 'DRUGS' && <DrugDatabaseTab />}
        {activeTab === 'YEMENMD' && <YemenMdManagementTab />}
        {activeTab === 'AI_MONITORING' && <AiMonitoringTab />}
        {activeTab === 'SAFETY_EVENTS' && <SafetyEventsTab />}
        {activeTab === 'SECURITY_TESTS' && (
          <div className="space-y-8">
            <AdminSecurityTestSuiteTab />
            <RbacMatrixTab />
          </div>
        )}
      </div>
    </div>
  );
};
