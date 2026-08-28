import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  BookOpen,
  Filter,
  Eye,
  Lock,
  PhoneCall,
  Terminal,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { Card, Badge, Button, LoadingState, Alert } from '../../components/ui/index.js';
import { SafetyRiskLevel, SafetyEvent } from '../../types/index.js';

interface SafetyRuleCatalogItem {
  ruleId: string;
  nameAr: string;
  nameEn: string;
  category: string;
  trigger: string;
  riskLevel: SafetyRiskLevel;
  conditions: {
    descriptionAr: string;
    descriptionEn: string;
  };
  explanation: {
    ar: string;
    en: string;
  };
  action: {
    ar: string;
    en: string;
    emergencyCallRequired: boolean;
    safeWaitingStepsAr: string[];
    safeWaitingStepsEn: string[];
  };
}

interface SafetyMetrics {
  totalEvents: number;
  byRiskLevel: Record<SafetyRiskLevel, number>;
  emergencyOverridesCount: number;
  lastEventTimestamp: string | null;
}

export const ClinicalSafetyDashboard: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'events' | 'tester' | 'evaluator'>('rules');
  const [rules, setRules] = useState<SafetyRuleCatalogItem[]>([]);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Automated Test Suite State
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);

  // Live Evaluator State
  const [evalInput, setEvalInput] = useState<string>('ألم شديد في الصدر مع ضيق في التنفس وتعرق بارد');
  const [evalPain, setEvalPain] = useState<number>(8);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);

  useEffect(() => {
    loadSafetyData();
  }, []);

  const loadSafetyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rulesRes, eventsRes, metricsRes] = await Promise.all([
        fetch('/api/safety/rules'),
        fetch('/api/safety/events?limit=30'),
        fetch('/api/safety/metrics'),
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load safety engine telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  const runTestSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/safety/test-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResults(data.results || []);
    } catch (err: any) {
      setError('Test suite execution failed');
    } finally {
      setIsRunningTests(false);
    }
  };

  const runLiveEvaluation = async () => {
    if (!evalInput.trim()) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/safety/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: evalInput,
          painScale: evalPain,
          language: isAr ? 'ar' : 'en',
        }),
      });
      const data = await res.json();
      setEvalResult(data.result || null);
      // Refresh events
      fetch('/api/safety/events?limit=30')
        .then((r) => r.json())
        .then((d) => setEvents(d.events || []));
      fetch('/api/safety/metrics')
        .then((r) => r.json())
        .then((d) => setMetrics(d.metrics || null));
    } catch (err: any) {
      setError('Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const getRiskBadgeColor = (level: SafetyRiskLevel) => {
    switch (level) {
      case 'EMERGENCY':
        return 'bg-rose-600 text-white font-black animate-pulse';
      case 'URGENT':
        return 'bg-amber-600 text-white font-bold';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
      case 'MODERATE':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const filteredRules = rules.filter((r) =>
    selectedRiskFilter === 'ALL' ? true : r.riskLevel === selectedRiskFilter
  );

  return (
    <div className="space-y-6">
      {/* 1. Top Status Banner */}
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              <h2 className="text-xl font-bold text-slate-100">
                {isAr ? 'محرك الأمان السريري (Clinical Safety Engine)' : 'Clinical Safety Engine'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono">
                HIGHER PRIORITY THAN AI
              </span>
            </div>
            <p className="text-sm text-slate-300">
              {isAr
                ? 'وحدة مستقلة تعمل بنظام القواعد القطعية (Rule-Based Architecture). تمنع الردود المطمئنة في حالات الطوارئ وتفعل Emergency Response Mode فوراً.'
                : 'Deterministic rule-based safety unit. Prevents reassuring generative replies during emergencies and enforces Emergency Response Mode.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSafetyData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحديث القياسات' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">
                {isAr ? 'إجمالي أحداث الأمان' : 'Total Safety Events'}
              </span>
              <span className="text-xl font-bold text-slate-100 font-mono">
                {metrics.totalEvents}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-600/40">
              <span className="text-[11px] text-rose-300 block">
                {isAr ? 'قواطع الطوارئ (Overrides)' : 'Emergency Overrides'}
              </span>
              <span className="text-xl font-bold text-rose-400 font-mono">
                {metrics.emergencyOverridesCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">
                {isAr ? 'قواعد الأمان النشطة' : 'Active Rules'}
              </span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {rules.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">
                {isAr ? 'حالات URGENT المسجلة' : 'Urgent Triggers'}
              </span>
              <span className="text-xl font-bold text-amber-400 font-mono">
                {metrics.byRiskLevel.URGENT || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'rules'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          {isAr ? 'كتالوج القواعد السريرية (Rule Architecture)' : 'Safety Rules Catalog'} ({rules.length})
        </button>

        <button
          onClick={() => setActiveSubTab('events')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'events'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          {isAr ? 'سجل أحداث الأمان (SafetyEvents)' : 'SafetyEvents Log'} ({events.length})
        </button>

        <button
          onClick={() => setActiveSubTab('tester')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'tester'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          {isAr ? 'فحص قاطع الذكاء الاصطناعي (AI Override Test Suite)' : 'AI Override Test Suite'}
        </button>

        <button
          onClick={() => setActiveSubTab('evaluator')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'evaluator'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          {isAr ? 'المختبر السريري المباشر (Live Evaluator)' : 'Live Evaluator'}
        </button>
      </div>

      {error && (
        <Alert variant="destructive" title={isAr ? 'خطأ في الاتصال' : 'Connection Error'}>
          {error}
        </Alert>
      )}

      {/* TAB 1: SAFETY RULES CATALOG */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">{isAr ? 'تصفية حسب الخطورة:' : 'Filter by Risk:'}</span>
              {(['ALL', 'EMERGENCY', 'URGENT', 'HIGH', 'MODERATE', 'LOW'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedRiskFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    selectedRiskFilter === lvl
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {isAr ? `عرض ${filteredRules.length} قاعدة سريرية` : `Showing ${filteredRules.length} rules`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRules.map((rule) => (
              <div
                key={rule.ruleId}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-md hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400 font-bold">
                        {rule.ruleId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {rule.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mt-1">
                      {isAr ? rule.nameAr : rule.nameEn}
                    </h4>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider ${getRiskBadgeColor(
                      rule.riskLevel
                    )}`}
                  >
                    {rule.riskLevel}
                  </span>
                </div>

                {/* Trigger & Conditions */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'المشغّل (Trigger):' : 'Trigger:'}</span>
                  </div>
                  <p className="ps-5 text-slate-200 font-mono text-[11px] bg-slate-950/80 p-1.5 rounded border border-slate-800">
                    {rule.trigger}
                  </p>
                </div>

                {/* Explanation */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isAr ? 'التعليل السريري (Explanation):' : 'Explanation:'}</span>
                  </div>
                  <p className="ps-5 text-slate-300 leading-relaxed">
                    {isAr ? rule.explanation.ar : rule.explanation.en}
                  </p>
                </div>

                {/* Action */}
                <div className="text-xs space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAr ? 'الإجراء الإلزامي (Action):' : 'Action:'}</span>
                  </div>
                  <p className="ps-5 text-emerald-300 font-medium">
                    {isAr ? rule.action.ar : rule.action.en}
                  </p>
                  {rule.action.emergencyCallRequired && (
                    <div className="flex items-center gap-1.5 ps-5 text-[11px] text-rose-400 font-bold">
                      <PhoneCall className="w-3 h-3" />
                      <span>{isAr ? 'يستلزم توجيهاً فورياً للاتصال بـ 997 / 911' : 'Requires immediate dispatch to 997/911'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SAFETY EVENTS AUDIT LOG */}
      {activeSubTab === 'events' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>
                {isAr
                  ? 'مبدأ الخصوصية الصارم: يتم تسجيل فقط (الوقت، مستوى الخطورة، القواعد المفعلة، الفئة العامة) ولا يتم حفظ نصوص أو بيانات خاصة بالمرضى.'
                  : 'Privacy Principle: Only (Timestamp, Risk Level, Triggered Rules, and general category) are preserved; no raw transcripts or PII are retained.'}
              </span>
            </div>
            <span className="font-mono text-slate-400">
              {events.length} {isAr ? 'حدث مسجل' : 'events logged'}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {isAr ? 'لا توجد أحداث أمان مسجلة حتى الآن.' : 'No safety events logged yet.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              {events.map((ev) => (
                <div key={ev.eventId} className="p-3.5 hover:bg-slate-850 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${getRiskBadgeColor(
                          ev.riskLevel
                        )}`}
                      >
                        {ev.riskLevel}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {ev.actionTaken}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-slate-300 pt-0.5">
                      <span className="font-semibold text-slate-200">
                        {isAr ? 'القواعد المفعلة:' : 'Triggered Rules:'}
                      </span>
                      {ev.triggeredRules.length === 0 ? (
                        <span className="text-slate-400 italic">None</span>
                      ) : (
                        ev.triggeredRules.map((r, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[10px]"
                          >
                            {r.ruleId} ({r.category})
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="text-end text-[11px] text-slate-400 font-mono shrink-0">
                    <div>Category: {ev.anonymizedContext.symptomCategory || 'GENERAL'}</div>
                    <div>Pain: {ev.anonymizedContext.painScale ?? 'N/A'}/10</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTOMATED AI OVERRIDE TEST SUITE */}
      {activeSubTab === 'tester' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {isAr
                    ? 'جناح الاختبار التلقائي لمنع تجاوز الذكاء الاصطناعي (AI Override Verification)'
                    : 'Automated AI Override Verification Suite'}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'يختبر حالات الطوارئ والحالات العاجلة والمتوسطة والبسيطة للتأكد رياضياً وسريرياً من استحالة إرسال ردود مطمئنة في حالات الطوارئ.'
                  : 'Validates Emergency, Urgent, High, Moderate, and Low cases to ensure reassuring phrases can never bypass the Safety Circuit Breaker.'}
              </p>
            </div>

            <button
              onClick={runTestSuite}
              disabled={isRunningTests}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-lg"
            >
              <Play className="w-4 h-4" />
              <span>
                {isRunningTests
                  ? isAr
                    ? 'جارٍ تشغيل الاختبارات...'
                    : 'Running Tests...'
                  : isAr
                  ? 'تشغيل فحص الأمان الشامل'
                  : 'Execute Safety Suite'}
              </span>
            </button>
          </div>

          {testResults && (
            <div className="space-y-2.5">
              {testResults.map((tc, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    tc.passed
                      ? 'bg-slate-900 border-emerald-500/40 text-slate-200'
                      : 'bg-rose-950/40 border-rose-500 text-rose-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {tc.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold text-slate-100 text-sm">{tc.testName}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300 ps-6">
                      <span>Expected: <strong className="text-slate-100">{tc.expectedRisk}</strong></span>
                      <span>•</span>
                      <span>Actual: <strong className="text-emerald-400">{tc.actualRisk}</strong></span>
                      <span>•</span>
                      <span>Circuit Breaker Override: <strong className={tc.isOverrideActive ? 'text-rose-400' : 'text-slate-400'}>{tc.isOverrideActive ? 'ACTIVE' : 'INACTIVE'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ps-6 sm:ps-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        tc.passed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {tc.passed ? 'PASSED (Protected)' : 'FAILED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LIVE EVALUATOR */}
      {activeSubTab === 'evaluator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'إدخال الأعراض للفحص المباشر' : 'Live Symptom Input'}</span>
            </h3>

            <textarea
              rows={4}
              value={evalInput}
              onChange={(e) => setEvalInput(e.target.value)}
              placeholder={isAr ? 'اكتب الأعراض هنا...' : 'Enter symptoms...'}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
            />

            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">{isAr ? 'مقياس الألم (0-10):' : 'Pain Scale:'}</span>
              <div className="flex items-center gap-1.5">
                {[0, 2, 4, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEvalPain(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      evalPain === num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runLiveEvaluation}
              disabled={evaluating || !evalInput.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow"
            >
              {evaluating
                ? isAr
                  ? 'جارٍ الفحص عبر محرك الأمان...'
                  : 'Evaluating Safety...'
                : isAr
                ? 'تقييم مستوى الخطورة وقاطع الأمان'
                : 'Evaluate Risk & Safety'}
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{isAr ? 'نتيجة محرك الأمان السريري' : 'Safety Engine Output'}</span>
            </h3>

            {evalResult ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-semibold">{isAr ? 'مستوى الخطورة:' : 'Risk Level:'}</span>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${getRiskBadgeColor(
                      evalResult.riskLevel
                    )}`}
                  >
                    {evalResult.riskLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-semibold">{isAr ? 'قاطع الطوارئ (Override Active):' : 'Emergency Override:'}</span>
                  <span
                    className={`font-bold ${
                      evalResult.isOverrideActive ? 'text-rose-400 font-black' : 'text-emerald-400'
                    }`}
                  >
                    {evalResult.isOverrideActive ? 'ACTIVATED (AI Suppressed)' : 'INACTIVE'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 font-semibold block">{isAr ? 'التعليل السريري:' : 'Clinical Explanation:'}</span>
                  <p className="text-slate-200">
                    {isAr ? evalResult.clinicalExplanationAr : evalResult.clinicalExplanationEn}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 font-semibold block">{isAr ? 'الإجراء الموصى به:' : 'Action Required:'}</span>
                  <p className="text-emerald-300 font-medium">
                    {isAr ? evalResult.recommendedActionAr : evalResult.recommendedActionEn}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                {isAr ? 'أدخل الأعراض واضغط على تقييم لعرض النتائج' : 'Enter symptoms and evaluate to see results'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
