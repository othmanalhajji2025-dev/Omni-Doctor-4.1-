import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  Coins,
  AlertOctagon,
  RefreshCw,
  Play,
  Lock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Server,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Select, Alert, LoadingState } from '../../components/ui/index.js';
import { AiMonitoringOverview, AiRequestLogItem } from '../../types/index.js';

export const AiMonitoringTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [overview, setOverview] = useState<AiMonitoringOverview | null>(null);
  const [logs, setLogs] = useState<AiRequestLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState('ALL');
  const [errorsOnly, setErrorsOnly] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, logsRes] = await Promise.all([
        fetchWithAuth('/api/admin/monitoring/overview'),
        fetchWithAuth(`/api/admin/monitoring/logs?limit=50${errorsOnly ? '&errorsOnly=true' : ''}${selectedModel !== 'ALL' ? `&model=${selectedModel}` : ''}`),
      ]);

      if (overviewRes.ok) {
        const oData = await overviewRes.json();
        setOverview(oData.summary || null);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedModel, errorsOnly]);

  const handleSimulateTraffic = async () => {
    setIsSimulating(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/monitoring/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 8 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate traffic');

      setSuccessMsg(data.messageAr || (isAr ? 'تم توليد حركة مرور تجريبية وتحديث الإحصائيات' : 'Simulated traffic generated'));
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-100 block">
              {isAr ? 'حوكمة خصوصية الذكاء الاصطناعي (Strict PII Exclusion)' : 'AI Privacy & Telemetry Governance'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isAr
                ? 'لا يتم تسجيل أو تخزين أي بيانات طبية حساسة أو استفسارات المرضى. تُحفظ فقط مقاييس الأداء واستهلاك الرموز.'
                : 'Zero PII stored. Only technical metrics, token volume, latency, and sanitized categories are logged.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSimulateTraffic}
            isLoading={isSimulating}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            {isAr ? 'محاكاة أحمال (Traffic Drill)' : 'Simulate Traffic'}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{isAr ? 'إجمالي الطلبات' : 'Requests'}</span>
            </div>
            <div className="text-xl font-black text-slate-100">{overview.totalRequests.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Gemini API Calls</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{isAr ? 'إجمالي الأخطاء' : 'Errors'}</span>
            </div>
            <div className="text-xl font-black text-rose-400">{overview.totalErrors}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{overview.errorRatePercentage}% error rate</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'متوسط الاستجابة' : 'Avg Latency'}</span>
            </div>
            <div className="text-xl font-black text-amber-300 font-mono">{overview.averageLatencyMs}ms</div>
            <div className="text-[10px] text-slate-400 mt-0.5">P90: {overview.p90LatencyMs}ms</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>{isAr ? 'الرموز المستهلكة' : 'Total Tokens'}</span>
            </div>
            <div className="text-xl font-black text-purple-300 font-mono">
              {((overview.totalTokensUsed || 0) / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              In: {((overview.promptTokensUsed || 0) / 1000).toFixed(1)}k
            </div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>{isAr ? 'نموذج Flash' : 'Flash Calls'}</span>
            </div>
            <div className="text-xl font-black text-slate-100">
              {(overview.modelBreakdown?.['gemini-3.7-flash']?.requests || 0) +
                (overview.modelBreakdown?.['gemini-2.5-flash']?.requests || 0)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Fast Tier</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold mb-1">
              <Server className="w-3.5 h-3.5" />
              <span>{isAr ? 'نموذج Pro' : 'Pro Calls'}</span>
            </div>
            <div className="text-xl font-black text-slate-100">
              {overview.modelBreakdown?.['gemini-2.5-pro']?.requests || 0}
            </div>
            <div className="text-[10px] text-indigo-400 mt-0.5">Reasoning</div>
          </Card>
        </div>
      )}

      {/* Latency Percentiles & Endpoint Analysis */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 bg-slate-900/80 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              {isAr ? 'توزيع زمن الاستجابة (Latency Percentiles)' : 'Latency Percentiles'}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>P50 (Median)</span>
                  <span className="font-mono font-bold text-cyan-400">{overview.p50LatencyMs} ms</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min((overview.p50LatencyMs / 1000) * 100, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>P90 (Fast 90%)</span>
                  <span className="font-mono font-bold text-amber-400">{overview.p90LatencyMs} ms</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((overview.p90LatencyMs / 1000) * 100, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>P99 (Tail Latency)</span>
                  <span className="font-mono font-bold text-rose-400">{overview.p99LatencyMs} ms</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min((overview.p99LatencyMs / 1000) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-slate-900/80 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              {isAr ? 'توزيع الطلبات حسب المسارات (Endpoints)' : 'Endpoint Breakdown'}
            </h3>

            <div className="space-y-2 text-xs">
              {Object.entries(overview.endpointBreakdown).map(([ep, stats], i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-mono text-slate-300">{ep}</span>
                  <span className="font-bold text-cyan-400">{typeof stats === 'object' ? stats.requests : stats} calls</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filter and Log Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            {isAr ? 'سجل مراقبة العمليات الآمن (Privacy-Safe Audit Logs)' : 'Privacy-Safe Audit Logs'}
          </h3>

          <div className="flex items-center gap-2">
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              options={[
                { value: 'ALL', label: isAr ? 'جميع النماذج' : 'All Models' },
                { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                { value: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
              ]}
            />

            <Button
              variant={errorsOnly ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setErrorsOnly(!errorsOnly)}
            >
              {errorsOnly ? (isAr ? 'الأخطاء فقط' : 'Errors Only') : (isAr ? 'عرض الكل' : 'All Statuses')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message={isAr ? 'جاري قراءة سجل المراقبة...' : 'Loading monitoring telemetry...'} />
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center bg-slate-900/60 border-slate-800">
            <Activity className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">
              {isAr ? 'لا توجد سجلات تطابق الفلترة الحالية' : 'No logs found'}
            </h4>
          </Card>
        ) : (
          <Card className="overflow-hidden bg-slate-900/70 border-slate-800 p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">{isAr ? 'الوقت' : 'Time'}</th>
                    <th className="py-3 px-4">{isAr ? 'المسار' : 'Endpoint'}</th>
                    <th className="py-3 px-4">{isAr ? 'النموذج' : 'Model'}</th>
                    <th className="py-3 px-4">{isAr ? 'الاستجابة' : 'Latency'}</th>
                    <th className="py-3 px-4">{isAr ? 'الرموز' : 'Tokens'}</th>
                    <th className="py-3 px-4">{isAr ? 'التصنيف' : 'Intent'}</th>
                    <th className="py-3 px-4">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{l.endpoint}</td>
                      <td className="py-3 px-4 text-cyan-300">{l.model}</td>
                      <td className="py-3 px-4 text-amber-300 font-bold">{l.latencyMs}ms</td>
                      <td className="py-3 px-4 text-purple-300">{l.totalTokens} tkn</td>
                      <td className="py-3 px-4 font-sans text-slate-300">{l.anonymizedIntent}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans text-[10px] font-bold border ${
                            l.success
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                              : 'bg-rose-950/80 border-rose-800 text-rose-300'
                          }`}
                        >
                          {l.success ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          {l.statusCode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
