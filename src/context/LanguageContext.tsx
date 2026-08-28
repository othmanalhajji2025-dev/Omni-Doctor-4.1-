import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types/client.js';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'rtl' | 'ltr';
  t: (key: string) => string;
}

const translations: Record<string, { ar: string; en: string }> = {
  appName: { ar: 'أومني دكتور | OmniDoctor AI', en: 'OmniDoctor AI' },
  tagline: {
    ar: 'منصة الذكاء الصحي والفرز السريري المبنية على الأدلة الطبية',
    en: 'Evidence-Based Clinical Intelligence & Medical Triage Platform'
  },
  emergencyCall: { ar: 'طوارئ الإسعاف (997 / 911)', en: 'Emergency Call (911 / 997)' },
  tabTriage: { ar: 'فحص الأعراض والفرز السريري', en: 'Symptom Triage & Analysis' },
  tabDrugs: { ar: 'فاحص التفاعلات الدوائية', en: 'Drug Interaction Safety' },
  tabLabs: { ar: 'مفسر التحاليل المخبرية', en: 'Lab Report Interpreter' },
  tabRecords: { ar: 'الملف الطبي والمؤشرات الحيوية', en: 'Health Records & Vitals' },
  tabEvidence: { ar: 'مكتبة الأدلة والإرشادات', en: 'Verified Evidence Library' },
  tabEmergency: { ar: 'أرقام وبروتوكولات الطوارئ', en: 'Emergency Protocols' },
  tabSafety: { ar: 'محرك الأمان والشفافية السريرية', en: 'Clinical Safety Engine' },
  symptomsPlaceholder: {
    ar: 'صف الأعراض التي تشعر بها بالتفصيل (مثل: صداع نابض في الجانب الأيمن منذ يومين مع حساسية من الضوء والضجيج)...',
    en: 'Describe your symptoms in detail (e.g., pulsating right-sided headache for 2 days with light and sound sensitivity)...'
  },
  analyzeSymptoms: { ar: 'بدء الفرز والتحليل السريري الآمن', en: 'Run Clinical Safety & Triage Analysis' },
  duration: { ar: 'مدة ظهور الأعراض', en: 'Symptom Duration' },
  severity: { ar: 'الشدة التقديرية للأعراض', en: 'Perceived Severity' },
  painScale: { ar: 'مقياس الألم (1 - 10)', en: 'Pain Scale (1 - 10)' },
  vitalsAccordion: { ar: 'إدخال القياسات الحيوية (اختياري - يعزز دقة الفرز)', en: 'Vital Signs Input (Optional - Refines Triage)' },
  redFlagAlertTitle: { ar: 'تنبيه سريري حرج: رصد علامات خطورة طارئة', en: 'Critical Clinical Alert: Red Flag Detected' },
  probabilisticDifferentialTitle: { ar: 'الاحتمالات والتشخيص التفريقي التقديري', en: 'Estimated Differential Possibilities' },
  clinicalRationale: { ar: 'المسوغ السريري المبني على الأعراض', en: 'Clinical Rationale & Symptom Match' },
  recommendedActions: { ar: 'الإجراءات والتوصيات المتبعة', en: 'Recommended Next Clinical Steps' },
  questionsForDoctor: { ar: 'أسئلة موجهة لطبيبك المعالج', en: 'Questions to Ask Your Doctor' },
  verifiedSources: { ar: 'المصادر والإرشادات السريرية المعتمدة المسترجعة', en: 'Retrieved Verified Clinical Guidelines' },
  disclaimer: {
    ar: 'تنبيه طبي سريري: هذا التقييم لأغراض الفرز والتثقيف الصحي فقط، ولا يعتبر تشخيصاً نهائياً قاطعاً ولا يغني عن الفحص الطبي المباشر.',
    en: 'Clinical Disclaimer: This assessment is for triage and health literacy only. It does NOT provide a definitive diagnosis or replace direct medical evaluation.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dir: language === 'ar' ? 'rtl' : 'ltr',
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
