import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Clock,
  Coins,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Server,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  EyeOff,
  Filter,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, LoadingState, Alert } from '../../components/ui/index.js';

interface AiRequestLog {
  id: string;
  timestamp: string;
  endpoint: string;
  moduleName: string;
  model: string;
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  status: 'SUCCESS' | 'ERROR';
  errorCode?: string;
  errorMessageSanitized?: string;
  anonymizedSessionId?: string;
  anonymizedCategory: string;
  isEmergencyTriggered?: boolean;
}

interface AiMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  errorRatePercentage: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalEstimatedCostUsd: number;
  moduleBreakdown: Record<string, {
    requests: number;
    errors: number;
    avgLatencyMs: number;
    tokens: number;
    costUsd: number;
  }>;
  hourlyTrends: Array<{
    hour: string;
    requests: number;
    avgLatencyMs: number;
    tokens: number;
    errors: number;
  }>;
}

export const AdminAiMonitoringTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [metrics, setMetrics] = useState<AiMetrics | null>(null);
  const [logs, setLogs] = useState<AiRequestLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let logsUrl = '/api/admin/ai/logs?limit=50';
      if (statusFilter !== 'ALL') {
        logsUrl += `&status=${statusFilter}`;
      }

      const [metricsRes, logsRes] = await Promise.all([
        fetchWithAuth('/api/admin/ai/metrics'),
        fetchWithAuth(logsUrl),
      ]);

      if (metricsRes.ok) {
        const d = await metricsRes.json();
        setMetrics(d.metrics);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d.logs || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load AI telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'إجمالي الطلبات (Inferences)' : 'Total AI Requests'}</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-slate-100 mt-2">
            {metrics?.totalRequests.toLocaleString() || 0}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-emerald-400">
              {metrics ? `${(100 - metrics.errorRatePercentage).toFixed(1)}% Success` : '100%'}
            </span>
            <span className="text-slate-500 font-mono">Gemini 2.5 Flash</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'متوسط زمن الاستجابة' : 'Latency (Avg / P95)'}</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            {metrics?.avgLatencyMs || 0} <span className="text-sm font-normal text-slate-400">ms</span>
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>P50: {metrics?.p50LatencyMs || 0}ms</span>
            <span className="text-amber-400">P95: {metrics?.p95LatencyMs || 0}ms</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'استهلاك الرموز (Tokens)' : 'Token Usage'}</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">
            {metrics?.totalTokens.toLocaleString() || 0}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>In: {metrics?.totalPromptTokens.toLocaleString() || 0}</span>
            <span>Out: {metrics?.totalCompletionTokens.toLocaleString() || 0}</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'التكلفة التقديرية (USD)' : 'Est. Cost'}</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">
            ${metrics?.totalEstimatedCostUsd.toFixed(4) || '0.0000'}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{isAr ? 'حساب التكلفة السحابية الحية' : 'Live Cloud Billing Tier'}</span>
          </div>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" title={isAr ? 'خطأ في تتبع الذكاء الاصطناعي' : 'AI Telemetry Error'}>
          {error}
        </Alert>
      )}

      {/* Module Breakdown Table */}
      {metrics?.moduleBreakdown && (
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'أداء نماذج الذكاء الاصطناعي حسب الوحدة الطبية' : 'AI Engine Performance by Module'}</span>
            </h4>
            <Badge variant="neutral" size="sm">Multi-Agent Gateway</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الوحدة السريرية' : 'Clinical Module'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الطلبات' : 'Requests'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الأخطاء' : 'Errors'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'متوسط الاستجابة' : 'Avg Latency'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الرموز (Tokens)' : 'Tokens'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'التكلفة' : 'Cost'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {Object.entries(metrics.moduleBreakdown).map(([modName, stats]: [string, any]) => (
                  <tr key={modName} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">{modName}</td>
                    <td className="py-3 px-3 font-mono">{stats.requests}</td>
                    <td className="py-3 px-3">
                      {stats.errors > 0 ? (
                        <Badge variant="danger" size="sm">{stats.errors}</Badge>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400">{stats.avgLatencyMs} ms</td>
                    <td className="py-3 px-3 font-mono text-purple-400">{stats.tokens.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-amber-400">${stats.costUsd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-slate-900/80 border border-emerald-800/40 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <EyeOff className="w-4 h-4" />
        </div>
        <div>
          <h5 className="text-xs font-bold text-slate-200">
            {isAr ? 'بروتوكول حماية خصوصية بيانات المرضى (Zero PII Telemetry)' : 'Zero-PII Privacy Protection Standard'}
          </h5>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {isAr
              ? 'وفقاً لمعايير الخصوصية الصارمة، يتم تجريد وتشفير كافة النصوص الحساسة، الأسماء، الهواتف، والسجلات المرضية قبل تسجيل أحداث المراقبة والتحليلات.'
              : 'All sensitive transcripts, patient names, and contact records are fully redacted before logging to prevent data leakage.'}
          </p>
        </div>
      </div>

      {/* AI Execution Stream Log */}
      <Card className="p-0 overflow-hidden border-slate-800">
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200">
              {isAr ? 'سجل عمليات الذكاء الاصطناعي (Privacy-Safe Execution Stream)' : 'AI Execution Stream (Sanitized)'}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg text-xs py-1 px-2 text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">{isAr ? 'كافة العمليات (All)' : 'All Status'}</option>
              <option value="SUCCESS">{isAr ? 'الناجحة (Success)' : 'Success'}</option>
              <option value="ERROR">{isAr ? 'الأخطاء (Errors)' : 'Errors'}</option>
            </select>

            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              {isAr ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingState text={isAr ? 'جارِ جلب سجلات المراقبة...' : 'Loading AI stream...'} />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {isAr ? 'لا توجد سجلات مطابقة' : 'No execution logs found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الوقت' : 'Timestamp'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الوحدة / المسار' : 'Module / Endpoint'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الفئة السريرية' : 'Category'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الاستجابة' : 'Latency'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الرموز' : 'Tokens'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'معرف الجلسة' : 'Session (Masked)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US')}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-200">
                      <div>{log.moduleName}</div>
                      <code className="text-[10px] text-slate-500 font-mono">{log.endpoint}</code>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-cyan-400">
                      {log.anonymizedCategory}
                    </td>

                    <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">
                      {log.durationMs} ms
                    </td>

                    <td className="py-3 px-3 font-mono text-purple-400">
                      {log.totalTokens} <span className="text-[10px] text-slate-500">tok</span>
                    </td>

                    <td className="py-3 px-3">
                      <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'} size="sm">
                        {log.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {log.anonymizedSessionId || 'sess_***'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
