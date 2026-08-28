import React, { useState, useEffect } from 'react';
import { BookOpenCheck, Search, ExternalLink, ShieldCheck, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { EvidenceSource } from '../../server/types/medical.js';

export const EvidenceLibrary: React.FC = () => {
  const { language } = useLanguage();
  const [guidelines, setGuidelines] = useState<EvidenceSource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const topics = [
    { id: 'ALL', labelAr: 'الكل', labelEn: 'All Topics' },
    { id: 'hypertension', labelAr: 'ضغط الدم والقلب', labelEn: 'Cardiovascular' },
    { id: 'diabetes', labelAr: 'السكري والغدد', labelEn: 'Diabetes & Endocrine' },
    { id: 'respiratory', labelAr: 'الجهاز التنفسي', labelEn: 'Respiratory' },
    { id: 'gastro', labelAr: 'الجهاز الهضمي', labelEn: 'Gastroenterology' },
    { id: 'headache', labelAr: 'الأعصاب والصداع', labelEn: 'Neurology' }
  ];

  const fetchGuidelines = async () => {
    try {
      const res = await fetch(`/api/knowledge/guidelines?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setGuidelines(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidelines();
  }, [searchQuery]);

  const filteredGuidelines = guidelines.filter(g => {
    if (selectedTopic === 'ALL') return true;
    return g.topics.some(t => t.toLowerCase().includes(selectedTopic.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {language === 'ar' ? 'مكتبة الأدلة والإرشادات السريرية المعتمدة' : 'Verified Clinical Practice Guidelines Library'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'قاعدة المعرفة السريرية الموثقة (RAG) المسترجعة من منظمة الصحة العالمية، وNICE، وCDC، ووزارة الصحة'
                : 'Curated evidence-based clinical practice guidelines from WHO, NICE, CDC, and MOH'}
            </p>
          </div>
        </div>
      </div>

      {/* Source Integrity Charter Banner */}
      <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-xs text-emerald-200">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">
            {language === 'ar' ? 'بروتوكول النزاهة العلمية وعدم اختلاق المراجع (Source Integrity):' : 'Evidence-Based Scientific Integrity Protocol:'}
          </span>
          <p className="text-emerald-300/80 leading-relaxed">
            {language === 'ar'
              ? 'تلتزم منصة OmniDoctor AI بعدم توليد أو اختلاق أي دراسات أو معرفات DOI أو إرشادات وهمية. يتم ربط كافة استنتاجات المنصة حصراً بهذه الأدلة السريرية الفعلية والمسجلة رسمياً.'
              : 'OmniDoctor AI strictly forbids hallucinating medical references, studies, or DOIs. All clinical reasoning maps directly to verified published guidance.'}
          </p>
        </div>
      </div>

      {/* Search & Topic Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'ابحث في الأدلة السريرية (مثال: ضغط الدم، السكري، NICE، الصداع)...' : 'Search clinical guidelines by keyword, organization, or topic...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 font-semibold me-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            {language === 'ar' ? 'التصنيف السريري:' : 'Clinical Topic:'}
          </span>
          {topics.map(tp => (
            <button
              key={tp.id}
              onClick={() => setSelectedTopic(tp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedTopic === tp.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {language === 'ar' ? tp.labelAr : tp.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuidelines.map(g => (
          <div
            key={g.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {g.organization} • {g.guidelineId} ({g.year})
                </span>
                {g.url && (
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-amber-400 p-1"
                    title="Open Official Guideline"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">
                {language === 'ar' ? g.title : g.titleEn}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                {language === 'ar' ? g.summaryAr : g.summaryEn}
              </p>
            </div>

            <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800/80">
              {g.topics.map((t, idx) => (
                <span key={idx} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
