import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { LandingPage } from './features/landing/LandingPage.js';
import { UserDashboard } from './features/dashboard/UserDashboard.js';
import { MyHealthPage } from './features/health/MyHealthPage.js';
import { ChatAssistant } from './features/chat/ChatAssistant.js';
import { SymptomChecker } from './components/SymptomChecker.js';
import { DrugChecker } from './components/DrugChecker.js';
import { LabAnalyzer } from './components/LabAnalyzer.js';
import { EvidenceLibrary } from './components/EvidenceLibrary.js';
import { EmergencyDirectory } from './components/EmergencyDirectory.js';
import { AdminPanel } from './features/admin/AdminPanel.js';
import { AuthModal } from './features/auth/AuthModal.js';
import { NavigationTab } from './types/index.js';
import { ShieldCheck } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();

  const isAr = language === 'ar';

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'home':
        return (
          <LandingPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenEmergency={() => setCurrentTab('emergency')}
          />
        );
      case 'dashboard':
        return (
          <UserDashboard
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );
      case 'health':
        return (
          <MyHealthPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );
      case 'assistant':
        return (
          <ChatAssistant
            onNavigateToTriage={() => setCurrentTab('triage')}
            onOpenEmergency={() => setCurrentTab('emergency')}
          />
        );
      case 'triage':
        return <SymptomChecker />;
      case 'drugs':
        return <DrugChecker />;
      case 'labs':
        return <LabAnalyzer />;
      case 'evidence':
        return <EvidenceLibrary />;
      case 'emergency':
        return <EmergencyDirectory />;
      case 'admin':
        return <AdminPanel />;
      default:
        return (
          <LandingPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenEmergency={() => setCurrentTab('emergency')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenEmergency={() => setCurrentTab('emergency')}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Render Sidebar only for inner tool modules, or give full canvas to Landing */}
        {currentTab !== 'home' && (
          <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        )}

        {/* Content Viewport */}
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${
            currentTab === 'home' ? 'max-w-7xl w-full' : 'max-w-5xl'
          }`}
        >
          {renderActiveTab()}
        </main>
      </div>

      {/* Mandatory Medical Disclaimer Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr ? 'إخلاء مسؤولية طبي سريري وقانوني' : 'Clinical & Medical Legal Disclaimer'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isAr
              ? 'تعتبر منصة OmniDoctor AI أداة ذكاء اصطناعي داعمة للفرز السريري والتثقيف الصحي ولا تُعد بديلاً عن الفحص الطبي المباشر أو تشخيص الطبيب المعالج. في حالات الطوارئ الحادة والمهددة للحياة يرجى الاتصال فوراً برقم 997 أو 911.'
              : 'OmniDoctor AI is an evidence-based clinical decision support and triage tool. It does NOT provide a final medical diagnosis or replace consultation with a qualified physician. In case of acute or life-threatening emergencies, call 911 or 997 immediately.'}
          </p>
          <div className="text-[10px] text-slate-500 font-mono pt-1">
            OmniDoctor AI v2.4 • Gemini 3.1 Pro Clinical Engine • Zero-Trust Multi-Tenant Architecture • WHO & NICE Clinical Standards
          </div>
        </div>
      </footer>

      {/* User Authentication / Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          // After signing in, navigate to the User Dashboard!
          setCurrentTab('dashboard');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
