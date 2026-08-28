import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Clock,
  Code2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface TestCaseResult {
  testId: string;
  name: string;
  nameAr: string;
  passed: boolean;
  durationMs: number;
  details: any;
}

export const Phase8TestSuiteTab: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    suiteName: string;
    suiteNameAr: string;
    allPassed: boolean;
    passedCount: number;
    totalCount: number;
    tests: TestCaseResult[];
  } | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const runVerificationSuite = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/documents/test-suite', { method: 'POST' });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Error running test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'حزمة اختبارات المرحلة 8: المستندات الطبية ومفسر التحاليل' : 'Phase 8: Documents & Lab Safety Test Suite'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'فحص شامل ومؤتمت: رفع الملفات، التحكم بالصلاحيات، أمان OCR، مراجعة واعتماد المستخدم، والتفسير السريري المتعدد المعايير.'
                : 'Automated verification: File Validation, Access Control, OCR Safety, User Confirmation & Multi-Parameter Lab Interpretation.'}
            </p>
          </div>

          <button
            type="button"
            onClick={runVerificationSuite}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{isAr ? 'تشغيل حزمة الاختبارات' : 'Run Verification Tests'}</span>
          </button>
        </div>

        {/* Results Banner */}
        {results && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {results.allPassed ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-white">
                  {results.allPassed
                    ? isAr
                      ? 'جميع اختبارات المرحلة 8 اجتازت بنجاح 100%'
                      : 'All Phase 8 Safety Tests Passed (100%)'
                    : isAr
                    ? 'فشلت بعض الاختبارات'
                    : 'Some tests failed'}
                </h3>
                <p className="text-xs text-slate-400">
                  {results.passedCount} / {results.totalCount} {isAr ? 'اختبار تم اجتيازه' : 'tests passed successfully'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {results.tests.reduce((acc, t) => acc + t.durationMs, 0)}ms total
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tests Detail List */}
      {results && (
        <div className="space-y-3">
          {results.tests.map((test, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={test.testId}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {test.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">
                        {isAr ? test.nameAr : test.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {test.testId} • {test.durationMs}ms
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                        test.passed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {test.passed ? 'PASSED' : 'FAILED'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 font-mono mb-2 text-[11px]">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Execution Details & Payload Output:</span>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
