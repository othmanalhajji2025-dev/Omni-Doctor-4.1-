import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Activity,
  FileText,
  Pill,
  Stethoscope,
  FlaskConical,
  TrendingUp,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  HealthTimelineEvent,
  BiomarkerTrendSeries,
} from '../../../server/documents/types.js';

export const HealthTimelineTab: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';

  const [events, setEvents] = useState<HealthTimelineEvent[]>([]);
  const [trends, setTrends] = useState<BiomarkerTrendSeries[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrendIndex, setSelectedTrendIndex] = useState<number>(0);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/timeline');
      const data = await res.json();
      if (data.timelineEvents) {
        setEvents(data.timelineEvents);
        setTrends(data.biomarkerTrends || []);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (selectedFilter === 'ALL') return true;
    return ev.type === selectedFilter;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SYMPTOM':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'CONSULTATION':
        return <Stethoscope className="w-4 h-4 text-cyan-400" />;
      case 'MEDICATION':
        return <Pill className="w-4 h-4 text-emerald-400" />;
      case 'TEST':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'RESULT':
        return <FlaskConical className="w-4 h-4 text-purple-400" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/50 font-bold';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'success':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'info':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const currentTrend = trends[selectedTrendIndex];

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <span>{isAr ? 'الخط الزمني الصحي الشامل' : 'Longitudinal Health Timeline'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'تتبع زمني مترابط: التاريخ ➔ العَرَض ➔ الاستشارة ➔ العلاج ➔ الفحص ➔ النتائج.'
                : 'Correlated chronological flow: Date ➔ Symptom ➔ Consultation ➔ Medication ➔ Test ➔ Result.'}
            </p>
          </div>

          <button
            onClick={fetchTimeline}
            className="self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث الخط الزمني' : 'Refresh Timeline'}</span>
          </button>
        </div>

        {/* Summary Metric Badges */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'إجمالي الأحداث' : 'Total Events'}</span>
              <span className="text-sm font-bold text-white">{summary.totalEvents}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-amber-400 block">{isAr ? 'الأعراض المسجلة' : 'Symptoms'}</span>
              <span className="text-sm font-bold text-amber-300">{summary.symptomsCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-cyan-400 block">{isAr ? 'الاستشارات والفرز' : 'Consults'}</span>
              <span className="text-sm font-bold text-cyan-300">{summary.consultationsCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-emerald-400 block">{isAr ? 'الأدوية' : 'Medications'}</span>
              <span className="text-sm font-bold text-emerald-300">{summary.medicationsCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-blue-400 block">{isAr ? 'الفحوصات والمستندات' : 'Tests'}</span>
              <span className="text-sm font-bold text-blue-300">{summary.testsCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-purple-400 block">{isAr ? 'النتائج المخبرية' : 'Lab Results'}</span>
              <span className="text-sm font-bold text-purple-300">{summary.resultsCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Longitudinal Biomarker Trend Visualizer */}
      {trends.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'مخطط تتبع المؤشرات الحيوية عبر الزمن' : 'Longitudinal Biomarker Trend Tracker'}
              </h3>
            </div>

            {/* Selector for which biomarker to chart */}
            <div className="flex flex-wrap gap-1.5">
              {trends.map((trend, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedTrendIndex(idx)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                    selectedTrendIndex === idx
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isAr ? trend.testNameAr : trend.testName}
                </button>
              ))}
            </div>
          </div>

          {currentTrend && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-white">
                  {isAr ? currentTrend.testNameAr : currentTrend.testName} ({currentTrend.unit})
                </span>
                <span className="text-slate-400">
                  {isAr ? 'النطاق الطبيعي: ' : 'Normal Range: '}
                  {currentTrend.standardMin} - {currentTrend.standardMax} {currentTrend.unit}
                </span>
              </div>

              {/* Visual Trend Points Bar Graph */}
              <div className="space-y-2 pt-2">
                {currentTrend.points.map((pt, pIdx) => {
                  const isHigh = pt.value > currentTrend.standardMax;
                  const isLow = pt.value < currentTrend.standardMin;
                  const percent = Math.min(100, Math.max(10, (pt.value / (currentTrend.standardMax * 1.5)) * 100));

                  return (
                    <div key={pIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono">{pt.date}</span>
                        <span className={`font-mono font-bold ${isHigh ? 'text-amber-400' : isLow ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {pt.value} {pt.unit} ({pt.status})
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pt.status === 'Critical'
                              ? 'bg-red-500'
                              : isHigh
                              ? 'bg-amber-500'
                              : isLow
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', labelAr: 'الكل', labelEn: 'All Events' },
          { id: 'SYMPTOM', labelAr: 'الأعراض', labelEn: 'Symptoms' },
          { id: 'CONSULTATION', labelAr: 'الاستشارات والفرز', labelEn: 'Consultations' },
          { id: 'MEDICATION', labelAr: 'الأدوية', labelEn: 'Medications' },
          { id: 'TEST', labelAr: 'الفحوصات والمستندات', labelEn: 'Tests & Documents' },
          { id: 'RESULT', labelAr: 'النتائج المخبرية', labelEn: 'Lab Results' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedFilter === tab.id
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Chronological Vertical Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {isAr ? 'لا توجد أحداث مطابقة لهذا الفلتر.' : 'No timeline events found for this filter.'}
          </div>
        ) : (
          <div className="relative border-s-2 border-slate-800 ms-3 space-y-6">
            {filteredEvents.map((ev, index) => (
              <div key={ev.id || index} className="mb-6 ms-6 relative group">
                {/* Node icon dot on timeline stem */}
                <span className="absolute -start-[35px] flex items-center justify-center w-7 h-7 rounded-full bg-slate-950 border border-slate-700 shadow-md">
                  {getEventIcon(ev.type)}
                </span>

                {/* Event Card Content */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{isAr ? ev.titleAr : ev.titleEn}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {ev.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ev.statusBadge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${getBadgeClass(ev.statusBadge.variant)}`}>
                          {isAr ? ev.statusBadge.textAr : ev.statusBadge.textEn}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">{ev.date}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAr ? ev.descriptionAr : ev.descriptionEn}
                  </p>

                  {/* Associated Context Metadata */}
                  {ev.associatedData && (
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                      {ev.associatedData.doctorName && (
                        <span>Attending: {ev.associatedData.doctorName}</span>
                      )}
                      {ev.associatedData.dosage && (
                        <span>Dose: {ev.associatedData.dosage}</span>
                      )}
                      {ev.associatedData.referenceRange && (
                        <span>Ref: {ev.associatedData.referenceRange}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
