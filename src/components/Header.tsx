import React, { useState } from 'react';
import {
  HeartPulse,
  PhoneCall,
  Globe,
  User,
  AlertTriangle,
  X,
  Menu,
  Stethoscope,
  Bot,
  Pill,
  BookOpen,
  Home,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Crown,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import { NavigationTab, UserRole } from '../types/index.js';
import { Button, Badge, Modal } from './ui/index.js';

interface HeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenEmergency: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenEmergency,
  onOpenAuth,
}) => {
  const { language, setLanguage } = useLanguage();
  const { user, role, isAuthenticated, signOut, hasRole } = useAuth();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAr = language === 'ar';

  const navLinks: Array<{ id: NavigationTab; labelAr: string; labelEn: string; icon: React.ReactNode }> = [
    { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: <Home className="w-4 h-4" /> },
    {
      id: 'dashboard',
      labelAr: 'لوحة التحكم',
      labelEn: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" />,
    },
    { id: 'assistant', labelAr: 'المساعد الصحي', labelEn: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { id: 'triage', labelAr: 'تحليل الأعراض', labelEn: 'Symptom Triage', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'health', labelAr: 'صحتي', labelEn: 'My Health', icon: <HeartPulse className="w-4 h-4 text-rose-400" /> },
    { id: 'drugs', labelAr: 'الأدوية', labelEn: 'Medications', icon: <Pill className="w-4 h-4" /> },
    { id: 'evidence', labelAr: 'المصادر', labelEn: 'Evidence', icon: <BookOpen className="w-4 h-4" /> },
  ];

  if (hasRole(['ADMINISTRATOR', 'SUPER_ADMIN'])) {
    navLinks.push({
      id: 'admin',
      labelAr: 'الإدارة (RBAC)',
      labelEn: 'Admin (RBAC)',
      icon: <ShieldAlert className="w-4 h-4 text-purple-400" />,
    });
  }

  const roleLabel: Record<UserRole, string> = {
    USER: isAr ? 'مريض' : 'Patient',
    HEALTHCARE_PROFESSIONAL: isAr ? 'طبيب' : 'Doctor',
    ADMINISTRATOR: isAr ? 'مشرف' : 'Admin',
    SUPER_ADMIN: isAr ? 'المدير الأعلى' : 'Super Admin',
    GUEST: isAr ? 'زائر' : 'Guest',
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onSelectTab(isAuthenticated ? 'dashboard' : 'home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40">
              <HeartPulse className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">OmniDoctor</span>
                <Badge variant="primary" size="sm">
                  AI Clinical
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {isAr ? 'الذكاء الطبي والفرز السريري' : 'Evidence-Based Clinical AI'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {link.icon}
                  <span>{isAr ? link.labelAr : link.labelEn}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Emergency Hotline, Auth, Language Toggle, Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Emergency Hotline Button */}
            <Button
              variant="emergency"
              size="sm"
              onClick={() => setShowEmergencyModal(true)}
              leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
              className="shadow-sm font-bold"
            >
              <span className="hidden sm:inline">{isAr ? 'طوارئ 997' : 'Emergency 911'}</span>
              <span className="sm:hidden">997</span>
            </Button>

            {/* Auth Button or User Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/80 flex items-center justify-center text-emerald-400">
                    {role === 'SUPER_ADMIN' ? (
                      <Crown className="w-3.5 h-3.5" />
                    ) : role === 'ADMINISTRATOR' ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : role === 'HEALTHCARE_PROFESSIONAL' ? (
                      <Stethoscope className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-slate-200 font-semibold max-w-[120px] truncate hidden sm:inline">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {roleLabel[role]}
                  </Badge>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute end-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
                    <div className="px-3 py-2 border-b border-slate-800/80">
                      <p className="text-xs font-bold text-slate-200 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg text-start cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                      <span>{isAr ? 'لوحة التحكم الصحية' : 'Health Dashboard'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTab('health');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg text-start cursor-pointer"
                    >
                      <HeartPulse className="w-4 h-4 text-rose-400" />
                      <span>{isAr ? 'صحتي (الملف الصحي)' : 'My Health'}</span>
                    </button>

                    {hasRole(['ADMINISTRATOR', 'SUPER_ADMIN']) && (
                      <button
                        onClick={() => {
                          onSelectTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-300 hover:bg-purple-950/40 rounded-lg text-start cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{isAr ? 'إدارة الصلاحيات (RBAC)' : 'Admin Directory'}</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        signOut();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg text-start cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenAuth}
                leftIcon={<User className="w-3.5 h-3.5 text-emerald-400" />}
                className="border-slate-700"
              >
                <span className="hidden md:inline">{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
              </Button>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-semibold transition-colors cursor-pointer"
              aria-label="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200 text-start">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onSelectTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.icon}
                <span>{isAr ? link.labelAr : link.labelEn}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emergency Hotline Modal */}
      {showEmergencyModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowEmergencyModal(false)}
          title={
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {isAr ? 'بروتوكول الطوارئ الطبية الفورية' : 'Immediate Emergency Dispatch'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'اتصل فوراً بالإسعاف في حال وجود أعراض حرجة' : 'Call dispatch immediately for critical symptoms'}
                </p>
              </div>
            </div>
          }
          size="md"
        >
          <div className="space-y-4 text-start">
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 leading-relaxed">
              {isAr
                ? 'إذا كنت تعاني من ألم ضاغط في الصدر يمتد إلى الذراع أو الفك، صعوبة تنفس حادة، فقدان مفاجئ للوعي، أو شلل نصفي مفاجئ؛ فهذه حالات إسعافية عاجلة تستدعي التدخل الفوري.'
                : 'If you experience crushing chest pain radiating to arm or jaw, acute dyspnea, sudden loss of consciousness, or unilateral paralysis; these are life-threatening emergencies requiring immediate dispatch.'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:997"
                className="p-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-center font-bold flex flex-col items-center justify-center gap-1 shadow-lg transition-transform hover:scale-[1.02]"
              >
                <span className="text-2xl">997</span>
                <span className="text-xs font-normal">
                  {isAr ? 'الهلال الأحمر السعودي (الإسعاف)' : 'Saudi Red Crescent (EMS)'}
                </span>
              </a>
              <a
                href="tel:911"
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-center font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 transition-transform hover:scale-[1.02]"
              >
                <span className="text-2xl">911</span>
                <span className="text-xs font-normal">
                  {isAr ? 'مركز العمليات الأمنية الموحدة' : 'Unified Emergency Operations'}
                </span>
              </a>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEmergencyModal(false)}>
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
};
