import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileCheck,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Select, Modal, Alert, LoadingState } from '../../components/ui/index.js';
import { SafetyEvent, SafetyRiskLevel } from '../../types/index.js';

export const SafetyEventsTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrilling, setIsDrilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [reviewFilter, setReviewFilter] = useState<string>('ALL');

  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'PENDING_REVIEW' | 'INVESTIGATED' | 'DISMISSED' | 'RESOLVED'>('RESOLVED');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/admin/safety-events?limit=50';
      if (riskFilter !== 'ALL') url += `&riskLevel=${riskFilter}`;
      if (reviewFilter !== 'ALL') url += `&reviewStatus=${reviewFilter}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Failed to load clinical safety audit events');

      const data = await res.json();
      setEvents(data.events || []);
      setMetrics(data.metrics || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [riskFilter, reviewFilter]);

  const handleSimulateEmergencyDrill = async () => {
    setIsDrilling(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/safety-events/test-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskLevel: 'EMERGENCY',
          symptom: 'ألم ضاغط شديد في الصدر مع تعرق بارد وضيق تنفس مستمر منذ نصف ساعة',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate safety event');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تشغيل محاكاة حدث سلامة سريري بنجاح' : 'Safety drill incident triggered'));
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDrilling(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!selectedEvent) return;
    setIsSubmittingReview(true);
    setError(null);
    const eventId = (selectedEvent as any).id || selectedEvent.eventId;
    try {
      const res = await fetchWithAuth(`/api/admin/safety-events/${eventId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus,
          reviewerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review status');

      setSuccessMsg(data.messageAr || (isAr ? 'تم اعتماد المراجعة السريرية للحدث بنجاح' : 'Review status updated'));
      setSelectedEvent(null);
      setReviewerNotes('');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getRiskBadge = (level: SafetyRiskLevel | string) => {
    switch (level) {
      case 'EMERGENCY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-950 border border-rose-800 text-rose-300 animate-pulse">
            <Flame className="w-3 h-3 text-rose-400" />
            EMERGENCY (طوارئ)
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 border border-amber-800 text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            URGENT (عاجل)
          </span>
        );
      case 'HIGH':
        return <Badge variant="warning" size="sm">High Risk</Badge>;
      case 'MODERATE':
        return <Badge variant="secondary" size="sm">Moderate</Badge>;
      case 'LOW':
        return <Badge variant="success" size="sm">Low Risk</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'إجمالي الأحداث' : 'Total Events'}</span>
            </div>
            <div className="text-2xl font-black text-slate-100">{metrics.totalEvents}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Evaluated Rules</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>{isAr ? 'طوارئ قصوى' : 'Emergency'}</span>
            </div>
            <div className="text-2xl font-black text-rose-400">{metrics.emergencyCount}</div>
            <div className="text-[10px] text-rose-400 mt-0.5">Critical Flags</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAr ? 'حالات عاجلة' : 'Urgent Events'}</span>
            </div>
            <div className="text-2xl font-black text-amber-300">{metrics.urgentCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Urgent Triage</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isAr ? 'تجاوزات الحماية' : 'Overrides'}</span>
            </div>
            <div className="text-2xl font-black text-purple-300">{metrics.overridesTriggered}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Safety Overrides</div>
          </Card>

          <Card className="p-3.5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'بانتظار المراجعة' : 'Pending Review'}</span>
            </div>
            <div className="text-2xl font-black text-slate-100">
              {events.filter((e) => e.reviewStatus === 'PENDING_REVIEW').length}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Awaiting Doctor</div>
          </Card>
        </div>
      )}

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={[
              { value: 'ALL', label: isAr ? 'جميع مستويات الخطورة' : 'All Risk Levels' },
              { value: 'EMERGENCY', label: 'EMERGENCY' },
              { value: 'URGENT', label: 'URGENT' },
              { value: 'HIGH_RISK', label: 'HIGH_RISK' },
              { value: 'MODERATE_RISK', label: 'MODERATE_RISK' },
              { value: 'LOW_RISK', label: 'LOW_RISK' },
            ]}
          />

          <Select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value)}
            options={[
              { value: 'ALL', label: isAr ? 'جميع حالات المراجعة' : 'All Review Statuses' },
              { value: 'PENDING_REVIEW', label: 'PENDING_REVIEW' },
              { value: 'RESOLVED', label: 'RESOLVED' },
              { value: 'INVESTIGATED', label: 'INVESTIGATED' },
              { value: 'DISMISSED', label: 'DISMISSED' },
            ]}
          />
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
            variant="danger"
            size="sm"
            onClick={handleSimulateEmergencyDrill}
            isLoading={isDrilling}
            leftIcon={<Flame className="w-3.5 h-3.5" />}
          >
            {isAr ? 'محاكاة طوارئ (Drill)' : 'Simulate Drill'}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Safety Events Table */}
      {isLoading ? (
        <LoadingState message={isAr ? 'جاري تحميل سجل أحداث السلامة...' : 'Loading safety events...'} />
      ) : events.length === 0 ? (
        <Card className="p-8 text-center bg-slate-900/60 border-slate-800">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">
            {isAr ? 'لا توجد أحداث سلامة مسجلة' : 'No safety events found'}
          </h3>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-slate-900/70 border-slate-800 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{isAr ? 'الحدث والوقت' : 'Event & Time'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'مستوى الخطورة' : 'Risk Level'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'القواعد المفعلة' : 'Triggered Rules'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'الإجراء' : 'Action'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'حالة المراجعة' : 'Review Status'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'مراجعة' : 'Review'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((e) => {
                  const eventId = (e as any).id || e.eventId;
                  const ruleIds: string[] = (e as any).triggeredRuleIds || (e.triggeredRules?.map((r: any) => r.ruleId || r) || []);
                  return (
                    <tr key={eventId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-mono font-bold text-slate-200">{eventId}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            {new Date(e.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getRiskBadge(e.riskLevel)}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {ruleIds.map((rid, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700"
                            >
                              {rid}
                            </span>
                          ))}
                        </div>
                      </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {e.actionTaken || 'EMERGENCY_HOTLINE_DISPLAY'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200">{e.reviewStatus || 'PENDING_REVIEW'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(e);
                          setReviewStatus(e.reviewStatus || 'RESOLVED');
                          setReviewerNotes(e.reviewerNotes || '');
                        }}
                        leftIcon={<FileCheck className="w-3.5 h-3.5 text-cyan-400" />}
                      >
                        {isAr ? 'مراجعة' : 'Review'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Clinical Review */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? `${isAr ? 'مراجعة الحدث السريري:' : 'Review Event:'} ${(selectedEvent as any).id || selectedEvent.eventId}` : ''}
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'مستوى الخطورة:' : 'Risk Level:'}</span>
                {getRiskBadge(selectedEvent.riskLevel)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'الوقت:' : 'Time:'}</span>
                <span className="font-mono text-slate-200">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
              </div>
              {(selectedEvent as any).clinicalRationale && (
                <div>
                  <span className="text-slate-400 block mb-1">{isAr ? 'التعليل السريري:' : 'Rationale:'}</span>
                  <div className="text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    {(selectedEvent as any).clinicalRationale}
                  </div>
                </div>
              )}
            </div>

            <Select
              label={isAr ? 'حالة المراجعة' : 'Review Status'}
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as any)}
              options={[
                { value: 'RESOLVED', label: 'RESOLVED (تم الحل والاعتماد)' },
                { value: 'INVESTIGATED', label: 'INVESTIGATED (قيد التحقيق)' },
                { value: 'DISMISSED', label: 'DISMISSED (استبعاد)' },
                { value: 'PENDING_REVIEW', label: 'PENDING_REVIEW (قيد المراجعة)' },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'ملاحظات المشرف السريري' : 'Supervisor Notes'}
              </label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder={isAr ? 'أدخل ملاحظات التقييم...' : 'Enter review notes...'}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" onClick={handleUpdateReview} isLoading={isSubmittingReview}>
                {isAr ? 'حفظ المراجعة' : 'Save Review'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
