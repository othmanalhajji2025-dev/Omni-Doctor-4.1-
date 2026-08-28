import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  Lock,
  Database,
  Cpu,
  Server,
  RefreshCw,
  Terminal,
  Activity,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, LoadingState, Alert } from '../../components/ui/index.js';

interface TestResultItem {
  layer: string;
  name: string;
  descriptionAr: string;
  passed: boolean;
  details: string;
}

interface TestSuiteResponse {
  success: boolean;
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  executedAt: string;
  testedBy: string;
  testResults: TestResultItem[];
}

export const AdminSecurityTestSuiteTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [isRunning, setIsRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<TestSuiteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTestSuite = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/test-suite', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Access denied or test execution failure');
      }
      const data = await res.json();
      setSuiteResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed running security test suite');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Executive Card */}
      <Card className="p-5 bg-slate-900/90 border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">
                {isAr ? 'حزمة اختبارات التحقق الأمني والصلاحيات (4-Tier RBAC & Isolation Suite)' : '4-Tier RBAC & Security Test Suite'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? 'تنفيذ فحص شامل ومباشر لآليات التحقق من الصلاحيات على كافة الطبقات: الواجهة (Frontend)، مسارات الخادم (Backend Middleware)، حواجز الواجهات البرمجية (API)، وعزل قواعد البيانات (Database Data Isolation).'
                : 'Automated verification across Frontend guards, Backend middleware, API authorization, and Multi-tenant Database Isolation.'}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={runTestSuite}
            isLoading={isRunning}
            leftIcon={<Play className="w-4 h-4" />}
          >
            {isAr ? 'تشغيل فحص الأمان الشامل' : 'Execute Test Suite'}
          </Button>
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="danger" title={isAr ? 'خطأ في تشغيل الاختبارات' : 'Test Execution Error'}>
          {error}
        </Alert>
      )}

      {/* Suite Results Display */}
      {suiteResult && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Status Bar */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  suiteResult.allPassed
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-700/50'
                }`}
              >
                {suiteResult.allPassed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  {suiteResult.allPassed
                    ? (isAr ? 'كافة فحوصات الصلاحيات والعزل اجتازت بنجاح 100%' : 'All 6 Security Tiers Passed (100%)')
                    : (isAr ? 'تم رصد إخفاق في بعض طبقات الفحص' : 'Security Vulnerabilities Detected')}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {suiteResult.passedTests} / {suiteResult.totalTests} Tests Verified • {suiteResult.testedBy}
                </p>
              </div>
            </div>

            <Badge variant={suiteResult.allPassed ? 'success' : 'danger'} size="md">
              {suiteResult.allPassed ? 'CERTIFIED SECURE' : 'ACTION REQUIRED'}
            </Badge>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suiteResult.testResults.map((t, idx) => (
              <Card
                key={idx}
                className={`p-4 bg-slate-900/90 border transition-all ${
                  t.passed
                    ? 'border-slate-800 hover:border-emerald-800/60'
                    : 'border-rose-900 bg-rose-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        t.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {t.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-200">{t.name}</span>
                      <Badge variant="neutral" size="sm" className="ms-2 font-mono text-[9px]">
                        {t.layer}
                      </Badge>
                    </div>
                  </div>

                  <Badge variant={t.passed ? 'success' : 'danger'} size="sm">
                    {t.passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  {isAr ? t.descriptionAr : t.name}
                </p>

                <div className="mt-3 p-2 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="text-slate-500">Details:</span>
                  <span className="text-emerald-400 truncate max-w-xs">{t.details}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
