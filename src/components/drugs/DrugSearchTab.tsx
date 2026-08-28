import React, { useState, useEffect } from 'react';
import { Search, Pill, ShieldAlert, Sparkles, ArrowRight, ExternalLink, Info, Filter } from 'lucide-react';
import { DrugSearchResult, DrugProfile } from '../../../server/drugs/types.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { DrugProfileModal } from './DrugProfileModal.js';

export const DrugSearchTab: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'brand' | 'generic' | 'ingredient'>('all');
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<DrugProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const quickSearches = [
    { label: 'Lipitor', type: 'brand' as const },
    { label: 'Metformin', type: 'generic' as const },
    { label: 'Augmentin', type: 'brand' as const },
    { label: 'Ibuprofen', type: 'ingredient' as const },
    { label: 'Warfarin', type: 'generic' as const },
    { label: 'Panadol', type: 'brand' as const },
    { label: 'Plavix', type: 'brand' as const },
    { label: 'Escitalopram', type: 'generic' as const },
  ];

  const handleSearch = async (overrideQuery?: string, overrideType?: typeof searchType) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    const t = overrideType || searchType;

    if (!q || q.trim().length === 0) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/drugs/search?q=${encodeURIComponent(q.trim())}&type=${t}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to search drugs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/drugs/profile/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.profile) {
        setSelectedProfile(data.profile);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  // Initial load with default search
  useEffect(() => {
    handleSearch('Lipitor');
  }, []);

  return (
    <div className="space-y-6">
      {/* Demo Seed Architecture Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-300">
            {isAr
              ? 'تنبيه: قاعدة بيانات تجريبية معتمدة (Demo Seed Dataset)'
              : 'Architecture Notice: Active Demo Seed Data Source'}
          </div>
          <p className="leading-relaxed text-amber-200/80">
            {isAr
              ? 'هذه البيانات تم بناؤها كبيانات تجريبية إرشادية لاختبار محرك السلامة الدوائية. تسمح معمارية مصادر البيانات بربط وتحديث مصادر دولية ومحلية موثوقة (مثل RxNorm و DailyMed و BNF ودليل وزارة الصحة) لاحقاً دون تعديل كود الفحص.'
              : 'This catalog is seeded with verified clinical benchmark drugs for safety engine validation. The pluggable Data Source Architecture enables seamless future integration with RxNorm, DailyMed, and national formularies.'}
          </p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                isAr
                  ? 'ابحث بالاسم التجاري (Lipitor, Augmentin) أو العلمي (Metformin) أو المادة الفعالة...'
                  : 'Search by Brand (Lipitor, Augmentin), Generic (Metformin), or Active Ingredient...'
              }
              className={`w-full py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors ${
                isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'
              }`}
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
          >
            {isLoading ? (isAr ? 'جارٍ البحث...' : 'Searching...') : (isAr ? 'بحث سريري' : 'Clinical Search')}
          </button>
        </div>

        {/* Search Type Filter Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAr ? 'نطاق البحث المحدد:' : 'Search Scope:'}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', labelAr: 'الكل (All)', labelEn: 'All Fields' },
              { id: 'brand', labelAr: 'الاسم التجاري (Brand)', labelEn: 'Brand Name' },
              { id: 'generic', labelAr: 'الاسم العلمي (Generic)', labelEn: 'Generic Name' },
              { id: 'ingredient', labelAr: 'المادة الفعالة (Ingredient)', labelEn: 'Active Ingredient' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSearchType(t.id as any);
                  if (query) handleSearch(undefined, t.id as any);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  searchType === t.id
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {isAr ? t.labelAr : t.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-500 text-[11px]">{isAr ? 'تجارب سريعة:' : 'Quick lookups:'}</span>
          {quickSearches.map((qs, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(qs.label);
                setSearchType(qs.type);
                handleSearch(qs.label, qs.type);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60 hover:border-indigo-500/40 transition-colors"
            >
              {qs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header & Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Pill className="w-4 h-4 text-indigo-400" />
            <span>{isAr ? 'الأدوية المطابقة في المعجم السريري:' : 'Matched Pharmacology Records:'}</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {results.length} {isAr ? 'نتيجة' : 'Results'}
          </span>
        </div>

        {results.length === 0 && !isLoading && (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-slate-400">
            <Pill className="w-8 h-8 mx-auto text-slate-600" />
            <div className="text-sm font-medium text-slate-300">
              {isAr ? 'لم يتم العثور على أدوية مطابقة للبحث' : 'No matching medications found'}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'جرب البحث عن أدوية شائعة مثل Metformin, Lipitor, Augmentin, Warfarin, Ibuprofen'
                : 'Try searching benchmark medications such as Metformin, Lipitor, Augmentin, Warfarin, Ibuprofen'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => handleOpenProfile(r.id)}
              className="group p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/60 rounded-2xl transition-all cursor-pointer space-y-3 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {isAr ? r.genericNameAr : r.genericName}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {r.genericName}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-400 font-medium">
                    {isAr ? r.drugClassAr : r.drugClass}
                  </div>
                </div>

                {/* Match Type Badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border bg-indigo-500/10 text-indigo-300 border-indigo-500/30 shrink-0">
                  {r.matchType} MATCH
                </span>
              </div>

              {/* Matched Brand or Ingredients Indicator */}
              {r.matchedBrandName && (
                <div className="text-xs text-amber-300 bg-amber-950/20 border border-amber-500/30 rounded-lg p-2 flex items-center gap-1.5">
                  <span className="font-semibold">{isAr ? 'الاسم التجاري المطابق:' : 'Matched Brand:'}</span>
                  <span className="font-bold">{r.matchedBrandName}</span>
                </div>
              )}

              {/* Active Ingredients */}
              <div className="text-xs text-slate-400 space-y-1">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {isAr ? 'المواد الفعالة الرئيسية:' : 'Active Ingredients:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {r.activeIngredients.map((ai, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]"
                    >
                      {ai}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {isAr ? r.summaryAr : r.summaryEn}
              </p>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  {r.isDemoSeedData ? 'Demo Seed' : 'Official Provider'}
                </span>
                <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <span>{isAr ? 'عرض الملف الدوائي الكامل' : 'View Full Profile'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Drug Profile Modal */}
      <DrugProfileModal
        profile={selectedProfile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
