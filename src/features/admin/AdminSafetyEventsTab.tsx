import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  FileCheck,
  UserCheck,
  MessageSquare,
  Activity,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Modal, LoadingState, Alert } from '../../components/ui/index.js';
import { SafetyRiskLevel } from '../../types/index.js';

interface SafetyEvent {
  eventId: string;
  timestamp: string;
  riskLevel: SafetyRiskLevel;
  triggeredRules: Array<{
    ruleId: string;
    category: string;
    trigger: string;
    riskLevel: SafetyRiskLevel;
  }>;
  actionTaken: 'EMERGENCY_OVERRIDE' | 'SAFETY_WARNING' | 'ROUTINE_MONITOR';
  reviewStatus?: 'PENDING_REVIEW' | 'INVESTIGATED' | 'DISMISSED' | 'RESOLVED';
  reviewedBy?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  anonymizedContext: {
    symptomCategory: string;
    characterCount: number;
    hasVitals: boolean;
    painScale?: number;
    sessionId?: string;
  };
}

export const AdminSafetyEventsTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth, user } = useAuth();
  const isAr = language === 'ar';

  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);
  const [reviewStatusChoice, setReviewStatusChoice] = useState<'PENDING_REVIEW' | 'INVESTIGATED' | 'DISMISSED' | 'RESOLVED'>('RESOLVED');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/admin/safety/events?limit=50';
      if (riskFilter !== 'ALL') url += `&riskLevel=${riskFilter}`;
      if (statusFilter !== 'ALL') url += `&reviewStatus=${statusFilter}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Failed to load safety events');
      const d = await res.json();
      setEvents(d.events || []);
      setMetrics(d.metrics || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [riskFilter, statusFilter]);

  const handleOpenReview = (event: SafetyEvent) => {
    setSelectedEvent(event);
    setReviewStatusChoice(event.reviewStatus || 'INVESTIGATED');
    setReviewerNotes(event.reviewerNotes || '');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/safety/events/${selectedEvent.eventId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: reviewStatusChoice,
          reviewerNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to update review');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تحديث حالة المراجعة بنجاح' : 'Review status updated'));
      setIsReviewModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = events.filter(e => (e.reviewStatus || 'PENDING_REVIEW') === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'إجمالي أحداث الأمان' : 'Total Safety Events'}</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-100 mt-2">{metrics?.totalEvents || events.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'قواطع الطوارئ (Overrides)' : 'Emergency Overrides'}</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{metrics?.emergencyCount || 0}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'حالات عاجلة (Urgent)' : 'Urgent Events'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{metrics?.urgentCount || 0}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'قيد المراجعة الإكلينيكية' : 'Pending Audit'}</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">{pendingCount}</p>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" title={isAr ? 'خطأ في أحداث الأمان' : 'Safety Error'}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" title={isAr ? 'اكتمل بنجاح' : 'Success'}>
          {successMsg}
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>{isAr ? 'مستوى الخطورة:' : 'Risk Level:'}</span>
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">{isAr ? 'كافة المستويات' : 'All Levels'}</option>
            <option value="EMERGENCY">EMERGENCY (طوارئ قصوى)</option>
            <option value="URGENT">URGENT (عاجل)</option>
            <option value="HIGH">HIGH (مرتفع)</option>
            <option value="MODERATE">MODERATE (متوسط)</option>
            <option value="LOW">LOW (منخفض)</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ms-2">
            <span>{isAr ? 'حالة المراجعة:' : 'Review Status:'}</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW (قيد المراجعة)</option>
            <option value="INVESTIGATED">INVESTIGATED (تم التحقيق)</option>
            <option value="RESOLVED">RESOLVED (تمت التسوية والمعالجة)</option>
            <option value="DISMISSED">DISMISSED (مرفوض / غير ذي صلة)</option>
          </select>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          {isAr ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Events Table */}
      <Card className="p-0 overflow-hidden border-slate-800">
        {isLoading ? (
          <div className="py-12">
            <LoadingState text={isAr ? 'جارِ جلب سجلات الأمان السريرية...' : 'Loading safety events...'} />
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {isAr ? 'لا توجد أحداث أمان تطابق شروط التصفية' : 'No safety events found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'معرف الحدث / التاريخ' : 'Event ID / Timestamp'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'مستوى الخطورة (Risk)' : 'Risk Level'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'القواعد المفعلة (Triggered Rules)' : 'Triggered Rules'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الإجراء المتخذ' : 'Action Taken'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'حالة المراجعة (Audit)' : 'Review Status'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'إجراءات المشرف' : 'Supervision'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {events.map((ev) => (
                  <tr key={ev.eventId} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="font-bold text-slate-200">{ev.eventId}</div>
                      <div className="text-slate-500 text-[10px]">
                        {new Date(ev.timestamp).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          ev.riskLevel === 'EMERGENCY'
                            ? 'danger'
                            : ev.riskLevel === 'URGENT'
                            ? 'danger'
                            : ev.riskLevel === 'HIGH'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {ev.riskLevel}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {ev.triggeredRules && ev.triggeredRules.length > 0 ? (
                        <div className="space-y-1">
                          {ev.triggeredRules.map((r, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-[11px]">
                              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="font-mono text-cyan-300 font-semibold">{r.ruleId}</span>
                              <span className="text-slate-400">({r.trigger})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">Routine Pattern</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <span className={ev.actionTaken === 'EMERGENCY_OVERRIDE' ? 'text-rose-400' : 'text-slate-300'}>
                        {ev.actionTaken}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          ev.reviewStatus === 'RESOLVED'
                            ? 'success'
                            : ev.reviewStatus === 'INVESTIGATED'
                            ? 'info'
                            : ev.reviewStatus === 'DISMISSED'
                            ? 'neutral'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {ev.reviewStatus || 'PENDING_REVIEW'}
                      </Badge>
                      {ev.reviewedBy && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          By: {ev.reviewedBy}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReview(ev)}
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                      >
                        {isAr ? 'مراجعة سريرية' : 'Audit'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={isAr ? `المراجعة والتحقيق السريري: ${selectedEvent?.eventId}` : `Clinical Audit: ${selectedEvent?.eventId}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveReview} className="space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'مستوى الخطورة المحدد:' : 'Assessed Risk:'}</span>
              <Badge variant="danger" size="sm">{selectedEvent?.riskLevel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'الإجراء المتخذ:' : 'Action Taken:'}</span>
              <span className="font-bold text-rose-400">{selectedEvent?.actionTaken}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isAr ? 'توقيت الحدث:' : 'Timestamp:'}</span>
              <span className="font-mono text-slate-300">
                {selectedEvent?.timestamp ? new Date(selectedEvent.timestamp).toLocaleString() : ''}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'قرار وحالة المراجعة' : 'Review Status Decision'} *
            </label>
            <select
              value={reviewStatusChoice}
              onChange={(e) => setReviewStatusChoice(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="RESOLVED">{isAr ? 'RESOLVED (تمت التسوية السريرية والتدقيق)' : 'RESOLVED'}</option>
              <option value="INVESTIGATED">{isAr ? 'INVESTIGATED (تم التحقيق وإخطار الفريق)' : 'INVESTIGATED'}</option>
              <option value="PENDING_REVIEW">{isAr ? 'PENDING_REVIEW (إبقاء الحالة قيد التدقيق)' : 'PENDING_REVIEW'}</option>
              <option value="DISMISSED">{isAr ? 'DISMISSED (استبعاد - إنذار خاطئ غير حرج)' : 'DISMISSED'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'ملاحظات المشرف السريري والإجراءات التصحيحية' : 'Clinical Supervisor Notes'}
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="تم التأكد من تطابق قاعدة الطوارئ وتوجيه المريض لأقرب مركز رعاية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isAr ? 'اعتماد التقرير وحفظ الحالة' : 'Save Audit Decision'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
