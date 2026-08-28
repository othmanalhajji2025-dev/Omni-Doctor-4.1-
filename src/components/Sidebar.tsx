import React from 'react';
import {
  Home,
  Bot,
  Stethoscope,
  Pill,
  FlaskConical,
  FolderHeart,
  BookOpenCheck,
  ShieldCheck,
  Siren,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';
import { NavigationTab } from '../types/index.js';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Badge } from './ui/Badge.js';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { language } = useLanguage();
  const { hasRole, isAuthenticated } = useAuth();
  const isAr = language === 'ar';

  const navItems: Array<{
    id: NavigationTab;
    labelAr: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeAr?: string;
    badgeEn?: string;
    badgeVariant?: 'primary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';
  }> = [
    {
      id: 'dashboard',
      labelAr: 'لوحة التحكم الصحية',
      labelEn: 'Patient Dashboard',
      icon: LayoutDashboard,
      badgeAr: 'مباشر',
      badgeEn: 'Live',
      badgeVariant: 'primary',
    },
    {
      id: 'home',
      labelAr: 'الرئيسية (نظرة عامة)',
      labelEn: 'Home (Overview)',
      icon: Home,
      badgeAr: 'الرئيسية',
      badgeEn: 'Home',
      badgeVariant: 'outline',
    },
    {
      id: 'assistant',
      labelAr: 'المساعد الصحي الذكي',
      labelEn: 'AI Health Assistant',
      icon: Bot,
      badgeAr: 'تفاعلي',
      badgeEn: 'AI Chat',
      badgeVariant: 'primary',
    },
    {
      id: 'triage',
      labelAr: 'فحص الأعراض والفرز',
      labelEn: 'Symptom Triage & Analysis',
      icon: Stethoscope,
      badgeAr: '7 مراحل',
      badgeEn: '7 Stages',
      badgeVariant: 'info',
    },
    {
      id: 'health',
      labelAr: 'صحتي (السجل والمؤشرات)',
      labelEn: 'My Health & Records',
      icon: FolderHeart,
      badgeAr: 'سجل محمي',
      badgeEn: 'Vault',
      badgeVariant: 'success',
    },
    {
      id: 'drugs',
      labelAr: 'فاحص التفاعلات الدوائية',
      labelEn: 'Drug Interaction Safety',
      icon: Pill,
      badgeAr: 'فارمكولوجي',
      badgeEn: 'Rx Safety',
      badgeVariant: 'warning',
    },
    {
      id: 'labs',
      labelAr: 'مفسر التحاليل المخبرية',
      labelEn: 'Lab Biomarker Interpreter',
      icon: FlaskConical,
      badgeAr: 'تحاليل',
      badgeEn: 'Biomarkers',
      badgeVariant: 'outline',
    },
    {
      id: 'evidence',
      labelAr: 'مكتبة الأدلة والإرشادات',
      labelEn: 'Verified Evidence RAG',
      icon: BookOpenCheck,
      badgeAr: 'NICE/WHO',
      badgeEn: 'Evidence',
      badgeVariant: 'outline',
    },
    {
      id: 'emergency',
      labelAr: 'دليل وبروتوكولات الطوارئ',
      labelEn: 'Emergency & First-Aid',
      icon: Siren,
      badgeAr: '997/911',
      badgeEn: 'Dispatch',
      badgeVariant: 'destructive',
    },
  ];

  if (hasRole(['ADMINISTRATOR', 'SUPER_ADMIN'])) {
    navItems.push({
      id: 'admin',
      labelAr: 'إدارة الصلاحيات (RBAC)',
      labelEn: 'Admin Governance',
      icon: ShieldAlert,
      badgeAr: 'مشرف',
      badgeEn: 'Admin',
      badgeVariant: 'warning',
    });
  }

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l border-slate-800 p-3 lg:p-4 flex flex-col justify-between shrink-0 text-start">
      <div className="space-y-2">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {isAr ? 'الوحدات السريرية المعتمدة' : 'Clinical Modules'}
        </div>

        <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                </div>
                {item.badgeAr && (
                  <span className="hidden xl:inline-block">
                    <Badge variant={item.badgeVariant as any} size="sm">
                      {isAr ? item.badgeAr : item.badgeEn}
                    </Badge>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Safety Charter Pill */}
      <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300 space-y-1.5 hidden lg:block">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'ميثاق النزاهة الطبية' : 'Medical Integrity Charter'}</span>
        </div>
        <p className="text-slate-400 text-[10px] leading-relaxed">
          {isAr
            ? 'تلتزم المنصة بعدم اختراع مراجع طبية وتطبيق لغة احتمالية سريرية محكمة مع استبعاد التشخيص القاطع.'
            : 'Enforces zero hallucination, strict probabilistic language, and non-definitive clinical triage.'}
        </p>
      </div>
    </aside>
  );
};
