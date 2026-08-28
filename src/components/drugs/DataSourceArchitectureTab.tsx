import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  Play,
  Server,
  ShieldCheck,
  ExternalLink,
  Code2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

export const DataSourceArchitectureTab: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [sources, setSources] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<{
    success: boolean;
    totalTests: number;
    passedCount: number;
    failedCount: number;
    tests: TestResult[];
    timestamp: string;
  } | null>(null);

  const loadSources = async () => {
    try {
      const res = await fetch('/api/drugs/sources');
      const data = await res.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error('Failed to load data sources info:', err);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/drugs/test-suite', { method: 'POST' });
      const data = await res.json();
      setTestSuiteResults(data);
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  useEffect(() => {
    loadSources();
    // Run tests once on mount for immediate verification display
    handleRunTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Architecture Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {isAr ? 'معمارية مصادر البيانات الدوائية (Data Source Architecture)' : 'Pluggable Drug Data Source Architecture'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'فصل صارم بين خوارزميات محرك الأمان (Safety Engine) ومصادر البيانات عبر واجهة موحدة IDrugDataSource تسمح بربط مصادر خارجية موثوقة'
                : 'Decoupled repository architecture allowing seamless binding of international & regional pharmacopeia providers'}
            </p>
          </div>
        </div>

        {/* Golden Rule Callout */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'القاعدة الأساسية (Core Rule): عدم تزييف أو توليد بيانات دوائية عشوائية' : 'Core Rule: No Synthetic or Invented Pharmacology Data'}</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {isAr
              ? 'البيانات الحالية موسومة بشكل صريح كـ (Demo Seed Data) وتتضمن أدوية معيارية دقيقة لاختبار التفاعلات والتكرار، مع جاهزية المحولات للربط مع RxNorm و DailyMed و BNF لاحقاً.'
              : 'Current benchmark records are explicitly flagged with isDemoSeedData: true. Production adapters are architecturally mapped and pluggable without modifying core clinical algorithms.'}
          </p>
        </div>
      </div>

      {/* Multi-Tier Source Registry Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>{isAr ? 'سجل مصادر البيانات والمحولات المتاحة:' : 'Data Source & Adapter Registry:'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map((src) => (
            <div
              key={src.sourceId}
              className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                src.isConfigured
                  ? 'bg-slate-900 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-white text-sm">{src.sourceName}</div>
                  <div className="text-[11px] text-slate-400">{src.organization}</div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    src.isConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {src.isConfigured ? 'ACTIVE PROVIDER' : 'ADAPTER READY'}
                </span>
              </div>

              <div className="text-[11px] space-y-1 text-slate-400">
                <div>
                  <span className="text-slate-500">{isAr ? 'المستوى المرجعي:' : 'Authority Tier:'}</span>{' '}
                  <span className="text-slate-300 font-medium">{src.authorityTier}</span>
                </div>
                <div>
                  <span className="text-slate-500">{isAr ? 'الاستخدام المقصود:' : 'Intended Use:'}</span>{' '}
                  <span className="text-slate-300">{src.intendedUse}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>{src.sourceId}</span>
                {src.isConfigured && <span className="text-emerald-400">● 100% Seed Benchmark</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Test Suite Section (Phase 7 Final Check) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {isAr ? 'حزمة التحقق الآلي من المرحلة 7 (Automated Test Suite)' : 'Phase 7 Live Verification Suite'}
              </h3>
              {testSuiteResults && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    testSuiteResults.success
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                      : 'bg-red-500/20 text-red-300 border-red-500/60'
                  }`}
                >
                  {testSuiteResults.passedCount}/{testSuiteResults.totalTests} PASSED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'اختبار حقيقي على الخادم يفحص: البحث (Brand, Generic, Ingredient)، والملف الدوائي، وتكرار المواد الفعالة، والحساسية، والتعارض المرضي، والتفاعلات، ووحدة اليمنMD.'
                : 'Server-side integration test verifying Search, Profile, Duplicate Ingredients, Allergies, Conditions, DDIs, and YemenMD.'}
            </p>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-950/40 disabled:opacity-50 shrink-0"
          >
            {isRunningTests ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isRunningTests ? (isAr ? 'جارٍ الاختبار...' : 'Executing Tests...') : (isAr ? 'إعادة تشغيل الفحص الآلي' : 'Run Full Test Suite')}</span>
          </button>
        </div>

        {/* Test Cases Results List */}
        {testSuiteResults && (
          <div className="space-y-2.5">
            {testSuiteResults.tests.map((t, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-200">{t.testName}</div>
                    <div className="text-[11px] text-slate-400">{t.message}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 border ${
                    t.passed
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-300 border-red-500/30'
                  }`}
                >
                  {t.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
