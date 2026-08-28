import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe2,
  Filter,
  Plus,
  ArrowUpDown,
  BookOpen,
  DollarSign,
  Tag,
  Shield,
  Pill,
} from 'lucide-react';
import { YemenMdRecord, YemenMdAvailability } from '../../../server/drugs/types.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { DrugProfileModal } from './DrugProfileModal.js';

export const YemenMdTab: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [drugs, setDrugs] = useState<YemenMdRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Cross-reference modal state
  const [selectedGlobalProfile, setSelectedGlobalProfile] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // New drug modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDrugForm, setNewDrugForm] = useState({
    GenericName: '',
    BrandName: '',
    Strength: '',
    DosageForm: 'Tablet',
    Manufacturer: '',
    Country: 'Yemen',
    Availability: 'AVAILABLE' as YemenMdAvailability,
    estimatedPriceYer: '',
    localDistributor: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (availabilityFilter !== 'ALL') params.append('availability', availabilityFilter);
      if (originFilter === 'YEMEN') params.append('country', 'Yemen');

      const [drugsRes, statsRes] = await Promise.all([
        fetch(`/api/yemenmd/drugs?${params.toString()}`),
        fetch('/api/yemenmd/statistics'),
      ]);

      const drugsData = await drugsRes.json();
      const statsData = await statsRes.json();

      let filtered = drugsData.drugs || [];
      if (originFilter === 'IMPORTED') {
        filtered = filtered.filter((d: YemenMdRecord) => !d.Country.toLowerCase().includes('yemen'));
      }

      setDrugs(filtered);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load YemenMD data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [availabilityFilter, originFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCrossReference = async (genericName: string) => {
    try {
      const res = await fetch(`/api/drugs/profile/${encodeURIComponent(genericName)}`);
      const data = await res.json();
      if (data.profile) {
        setSelectedGlobalProfile(data.profile);
        setIsProfileModalOpen(true);
      } else {
        alert(
          isAr
            ? `لا يوجد ملف مرجعي تجريبي مسجل حالياً للمركب العلمي: ${genericName}`
            : `No demo pharmacology profile found for generic: ${genericName}`
        );
      }
    } catch (err) {
      console.error('Error fetching linked profile:', err);
    }
  };

  const handleCreateDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/yemenmd/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDrugForm),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewDrugForm({
          GenericName: '',
          BrandName: '',
          Strength: '',
          DosageForm: 'Tablet',
          Manufacturer: '',
          Country: 'Yemen',
          Availability: 'AVAILABLE',
          estimatedPriceYer: '',
          localDistributor: '',
        });
        loadData();
      }
    } catch (err) {
      console.error('Failed to add drug:', err);
    }
  };

  const getAvailabilityBadge = (av: YemenMdAvailability) => {
    switch (av) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
          labelAr: 'متوفر بالسوق',
          labelEn: 'Available',
        };
      case 'SCARCE':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
          labelAr: 'شحيح / متقطع',
          labelEn: 'Scarce Supply',
        };
      case 'HOSPITAL_RESTRICTED':
        return {
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/40',
          labelAr: 'مقيد للمستشفيات',
          labelEn: 'Hospital Restricted',
        };
      case 'DISCONTINUED':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
          labelAr: 'منقطع / غير مسجل',
          labelEn: 'Discontinued',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Isolation Architectural Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {isAr ? 'الدليل الدوائي اليمني (YemenMD Registry)' : 'YemenMD Pharmaceutical Registry'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                Isolated Module
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'قاعدة بيانات منفصلة لحصر الأدوية المحلية والمستوردة في السوق اليمني وتتبع التوافر والأسعار'
                : 'Isolated local database tracking pharmaceutical availability, local producers, and market supply'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'تسجيل صنف دوائي محلي' : 'Register Drug'}</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-400 block">{isAr ? 'إجمالي الأصناف المسجلة:' : 'Total Registered:'}</span>
            <div className="text-xl font-bold text-white font-mono">{stats.totalProducts}</div>
            <div className="text-[10px] text-slate-500">{isAr ? 'مستحضر دوائي' : 'Drug items'}</div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] text-emerald-400 block">{isAr ? 'الصناعة الدوائية الوطنية:' : 'Domestic Industry:'}</span>
            <div className="text-xl font-bold text-emerald-300 font-mono">
              {stats.domesticPercentage}%
            </div>
            <div className="text-[10px] text-slate-400">
              {stats.domesticManufacturedCount} {isAr ? 'أصناف وطنية (شفاكو، هائل، ياديكو)' : 'Local Items'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] text-blue-400 block">{isAr ? 'الأصناف المتوفرة بانتظام:' : 'Available in Market:'}</span>
            <div className="text-xl font-bold text-blue-300 font-mono">
              {stats.availabilityBreakdown.AVAILABLE}
            </div>
            <div className="text-[10px] text-slate-500">{isAr ? 'في الصيدليات والمراكز' : 'Regular supply'}</div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] text-amber-400 block">{isAr ? 'أصناف شحيحة أو مقيدة:' : 'Scarce / Restricted:'}</span>
            <div className="text-xl font-bold text-amber-300 font-mono">
              {stats.availabilityBreakdown.SCARCE + stats.availabilityBreakdown.HOSPITAL_RESTRICTED}
            </div>
            <div className="text-[10px] text-slate-500">{isAr ? 'سلاسل إمداد حرجة' : 'Critical supply'}</div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث في اليمنMD بالاسم التجاري (Febradol, Amoclan) أو العلمي أو الشركة المصنعة...'
                  : 'Search by Brand, Generic, or Manufacturer...'
              }
              className={`w-full py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors shrink-0"
          >
            {isAr ? 'تصفية' : 'Filter'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          {/* Availability Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">{isAr ? 'حالة الوفرة:' : 'Availability:'}</span>
            {[
              { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
              { id: 'AVAILABLE', labelAr: 'متوفر', labelEn: 'Available' },
              { id: 'SCARCE', labelAr: 'شحيح', labelEn: 'Scarce' },
              { id: 'HOSPITAL_RESTRICTED', labelAr: 'مقيد للمستشفيات', labelEn: 'Restricted' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAvailabilityFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  availabilityFilter === f.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {isAr ? f.labelAr : f.labelEn}
              </button>
            ))}
          </div>

          {/* Origin Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">{isAr ? 'المنشأ:' : 'Origin:'}</span>
            {[
              { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
              { id: 'YEMEN', labelAr: 'صناعة يمنية 🇾🇪', labelEn: 'Domestic' },
              { id: 'IMPORTED', labelAr: 'مستورد 🌐', labelEn: 'Imported' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOriginFilter(o.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  originFilter === o.id
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {isAr ? o.labelAr : o.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mandatory Database Fields Display List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{isAr ? `عرض (${drugs.length}) صنف دوائي مسجل في YemenMD:` : `Showing (${drugs.length}) Registered Products:`}</span>
          <span className="font-mono text-[11px]">Fields: Generic, Brand, Strength, Form, Manufacturer, Country, Availability, Updated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {drugs.map((drug) => {
            const avBadge = getAvailabilityBadge(drug.Availability);
            return (
              <div
                key={drug.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700 transition-all text-xs"
              >
                {/* Required Fields: BrandName, GenericName, Availability */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white tracking-tight">{drug.BrandName}</span>
                      <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {drug.Strength}
                      </span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                      Generic: <span className="text-slate-200 font-semibold">{drug.GenericName}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${avBadge.bg}`}>
                    {isAr ? avBadge.labelAr : avBadge.labelEn}
                  </span>
                </div>

                {/* Required Fields: DosageForm, Manufacturer, Country */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                  <div>
                    <span className="text-slate-500 block">{isAr ? 'الشكل الدوائي (DosageForm):' : 'Dosage Form:'}</span>
                    <span className="text-slate-300 font-medium">{drug.DosageForm}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isAr ? 'الشركة المصنعة (Manufacturer):' : 'Manufacturer:'}</span>
                    <span className="text-slate-200 font-semibold truncate block">{drug.Manufacturer}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isAr ? 'بلد المنشأ (Country):' : 'Country:'}</span>
                    <span className="text-slate-300 font-medium">{drug.Country}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isAr ? 'آخر تحديث (LastUpdated):' : 'Last Updated:'}</span>
                    <span className="text-slate-400 font-mono">{drug.LastUpdated}</span>
                  </div>
                </div>

                {/* Additional Yemen market attributes: price, distributor */}
                {drug.estimatedPriceYer && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{isAr ? 'السعر التقريبي:' : 'Approx. Price:'} {drug.estimatedPriceYer.toLocaleString()} ريال يمني</span>
                    </span>
                    {drug.registrationNumber && (
                      <span className="font-mono text-slate-500 text-[10px]">
                        Reg: {drug.registrationNumber}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes in Arabic */}
                {drug.notesAr && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                    {drug.notesAr}
                  </p>
                )}

                {/* Separate Module Rule: Cross-reference to Global Pharmacology Bridge */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {drug.Country === 'Yemen' ? '🇾🇪 منتج محلي' : '🌐 مستحضر مستورد'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCrossReference(drug.GenericName)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الملف الإكلينيكي للمركب' : 'Global Clinical Profile'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Referenced Global Profile Modal */}
      <DrugProfileModal
        profile={selectedGlobalProfile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Modal: Register Drug in YemenMD */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'تسجيل صنف دوائي في YemenMD' : 'Register Medication in YemenMD'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDrug} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={newDrugForm.BrandName}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, BrandName: e.target.value })}
                    placeholder="e.g. Doloraz"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Generic Name *</label>
                  <input
                    type="text"
                    required
                    value={newDrugForm.GenericName}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, GenericName: e.target.value })}
                    placeholder="e.g. Ibuprofen"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    value={newDrugForm.Strength}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, Strength: e.target.value })}
                    placeholder="e.g. 400 mg"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Dosage Form *</label>
                  <input
                    type="text"
                    required
                    value={newDrugForm.DosageForm}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, DosageForm: e.target.value })}
                    placeholder="e.g. Tablet, Capsule, Syrup"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={newDrugForm.Manufacturer}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, Manufacturer: e.target.value })}
                    placeholder="e.g. Shaphaco, Modern Pharma"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={newDrugForm.Country}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, Country: e.target.value })}
                    placeholder="e.g. Yemen"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Availability *</label>
                  <select
                    value={newDrugForm.Availability}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, Availability: e.target.value as any })}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="AVAILABLE">AVAILABLE (متوفر)</option>
                    <option value="SCARCE">SCARCE (شحيح)</option>
                    <option value="HOSPITAL_RESTRICTED">HOSPITAL_RESTRICTED (مقيد)</option>
                    <option value="DISCONTINUED">DISCONTINUED (منقطع)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Estimated Price (YER)</label>
                  <input
                    type="number"
                    value={newDrugForm.estimatedPriceYer}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, estimatedPriceYer: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
