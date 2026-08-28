import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertOctagon,
  ShieldAlert,
  Info,
  RefreshCw,
  Sparkles,
  BookOpen,
  Tag,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Modal, LoadingState, Alert } from '../../components/ui/index.js';

interface DrugProfile {
  id: string;
  genericName: string;
  genericNameAr: string;
  brandNames: string[];
  brandNamesAr?: string[];
  activeIngredients: string[];
  activeIngredientsAr?: string[];
  drugClass: string;
  drugClassAr: string;
  atcCode: string;
  commonUsesEn: string[];
  commonUsesAr: string[];
  warningsEn: string[];
  warningsAr: string[];
  boxedWarningEn?: string;
  boxedWarningAr?: string;
  contraindicationsEn: string[];
  contraindicationsAr: string[];
  commonSideEffectsEn: string[];
  commonSideEffectsAr: string[];
  seriousSideEffectsEn: string[];
  seriousSideEffectsAr: string[];
  dosageGuidelinesEn: string[];
  dosageGuidelinesAr: string[];
}

export const AdminDrugDatabaseTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [drugs, setDrugs] = useState<DrugProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<DrugProfile | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formGenericName, setFormGenericName] = useState('');
  const [formGenericNameAr, setFormGenericNameAr] = useState('');
  const [formBrandNames, setFormBrandNames] = useState('');
  const [formDrugClass, setFormDrugClass] = useState('');
  const [formDrugClassAr, setFormDrugClassAr] = useState('');
  const [formUsesAr, setFormUsesAr] = useState('');
  const [formWarningsAr, setFormWarningsAr] = useState('');
  const [formBoxedWarningAr, setFormBoxedWarningAr] = useState('');
  const [formContraindicationsAr, setFormContraindicationsAr] = useState('');
  const [formDosageAr, setFormDosageAr] = useState('');

  const loadDrugs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/admin/drugs';
      if (searchQuery.trim()) {
        url += `?query=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Failed to fetch drug database');
      const data = await res.json();
      setDrugs(data.drugs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrugs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDrugs();
  };

  const handleCreateDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGenericName || !formGenericNameAr || !formDrugClass) {
      setError(isAr ? 'يرجى ملء الحقول الإلزامية' : 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const brands = formBrandNames.split(',').map(b => b.trim()).filter(Boolean);
      const uses = formUsesAr.split('\n').map(u => u.trim()).filter(Boolean);
      const warnings = formWarningsAr.split('\n').map(w => w.trim()).filter(Boolean);
      const contra = formContraindicationsAr.split('\n').map(c => c.trim()).filter(Boolean);
      const dosage = formDosageAr.split('\n').map(d => d.trim()).filter(Boolean);

      const res = await fetchWithAuth('/api/admin/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genericName: formGenericName,
          genericNameAr: formGenericNameAr,
          brandNames: brands,
          drugClass: formDrugClass,
          drugClassAr: formDrugClassAr || formDrugClass,
          commonUsesAr: uses,
          warningsAr: warnings,
          boxedWarningAr: formBoxedWarningAr || undefined,
          contraindicationsAr: contra,
          dosageGuidelinesAr: dosage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to create drug');

      setSuccessMsg(data.messageAr || (isAr ? 'تمت إضافة الدواء بنجاح' : 'Drug added'));
      setIsAddModalOpen(false);
      resetForm();
      loadDrugs();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrug) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const brands = formBrandNames.split(',').map(b => b.trim()).filter(Boolean);
      const uses = formUsesAr.split('\n').map(u => u.trim()).filter(Boolean);
      const warnings = formWarningsAr.split('\n').map(w => w.trim()).filter(Boolean);
      const contra = formContraindicationsAr.split('\n').map(c => c.trim()).filter(Boolean);
      const dosage = formDosageAr.split('\n').map(d => d.trim()).filter(Boolean);

      const res = await fetchWithAuth(`/api/admin/drugs/${selectedDrug.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genericName: formGenericName,
          genericNameAr: formGenericNameAr,
          brandNames: brands,
          drugClass: formDrugClass,
          drugClassAr: formDrugClassAr,
          commonUsesAr: uses,
          warningsAr: warnings,
          boxedWarningAr: formBoxedWarningAr || undefined,
          contraindicationsAr: contra,
          dosageGuidelinesAr: dosage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to update drug');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تحديث الدواء بنجاح' : 'Drug updated'));
      setIsEditModalOpen(false);
      loadDrugs();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDrug = async () => {
    if (!selectedDrug) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/drugs/${selectedDrug.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to delete drug');

      setSuccessMsg(data.messageAr || (isAr ? 'تم حذف الدواء من المستودع' : 'Drug deleted'));
      setIsDeleteModalOpen(false);
      loadDrugs();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (drug: DrugProfile) => {
    setSelectedDrug(drug);
    setFormGenericName(drug.genericName);
    setFormGenericNameAr(drug.genericNameAr);
    setFormBrandNames(drug.brandNames?.join(', ') || '');
    setFormDrugClass(drug.drugClass);
    setFormDrugClassAr(drug.drugClassAr || drug.drugClass);
    setFormUsesAr(drug.commonUsesAr?.join('\n') || '');
    setFormWarningsAr(drug.warningsAr?.join('\n') || '');
    setFormBoxedWarningAr(drug.boxedWarningAr || '');
    setFormContraindicationsAr(drug.contraindicationsAr?.join('\n') || '');
    setFormDosageAr(drug.dosageGuidelinesAr?.join('\n') || '');
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormGenericName('');
    setFormGenericNameAr('');
    setFormBrandNames('');
    setFormDrugClass('');
    setFormDrugClassAr('');
    setFormUsesAr('');
    setFormWarningsAr('');
    setFormBoxedWarningAr('');
    setFormContraindicationsAr('');
    setFormDosageAr('');
    setSelectedDrug(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'إجمالي الأدوية المسجلة' : 'Total Medications'}</span>
            <Pill className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{drugs.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'التحذيرات الصندوقية الحرجة (Boxed)' : 'Boxed Warnings'}</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">
            {drugs.filter(d => d.boxedWarningAr || d.boxedWarningEn).length}
          </p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'محرك التداخلات والتوافق' : 'Interaction Engine'}</span>
            <Badge variant="success" size="sm">ACTIVE</Badge>
          </div>
          <p className="text-sm font-bold text-slate-200 mt-2">Multi-Source Pharmacopeia</p>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" title={isAr ? 'خطأ في قاعدة بيانات الأدوية' : 'Pharmacopeia Error'}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" title={isAr ? 'اكتمل بنجاح' : 'Success'}>
          {successMsg}
        </Alert>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم العلمي، التجاري، أو الفئة الدوائية...' : 'Search generic, brand, or drug class...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 ps-9 pe-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            {isAr ? 'بحث' : 'Search'}
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDrugs} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة دواء جديد' : 'Add Medication'}
          </Button>
        </div>
      </div>

      {/* Drugs Directory Cards */}
      {isLoading ? (
        <div className="py-12">
          <LoadingState text={isAr ? 'جارِ جلب ملفات الأدوية...' : 'Loading drug database...'} />
        </div>
      ) : drugs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          {isAr ? 'لم يتم العثور على أدوية مطابقة للبحث' : 'No medications found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drugs.map((drug) => (
            <Card key={drug.id} className="p-4 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{drug.genericNameAr}</span>
                      <span className="text-xs text-slate-400 font-mono">({drug.genericName})</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="info" size="sm">{drug.drugClassAr || drug.drugClass}</Badge>
                      {drug.boxedWarningAr && (
                        <Badge variant="danger" size="sm">
                          <AlertOctagon className="w-2.5 h-2.5 me-1" />
                          Boxed Warning
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(drug)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                      title={isAr ? 'تعديل الدواء' : 'Edit drug'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDrug(drug);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 hover:text-white transition-colors cursor-pointer"
                      title={isAr ? 'حذف الدواء' : 'Delete drug'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Brands */}
                {drug.brandNames && drug.brandNames.length > 0 && (
                  <div className="mt-2.5 text-[11px] text-slate-400">
                    <span className="text-slate-500 font-semibold">{isAr ? 'الأسماء التجارية:' : 'Brands:'} </span>
                    <span>{drug.brandNames.join(' • ')}</span>
                  </div>
                )}

                {/* Uses */}
                {drug.commonUsesAr && drug.commonUsesAr.length > 0 && (
                  <div className="mt-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-semibold">{isAr ? 'دواعي الاستعمال:' : 'Uses:'} </span>
                    <span>{drug.commonUsesAr.slice(0, 2).join('، ')}</span>
                  </div>
                )}

                {/* Boxed Warning Callout */}
                {(drug.boxedWarningAr || drug.boxedWarningEn) && (
                  <div className="mt-3 p-2.5 bg-rose-950/30 border border-rose-800/40 rounded-lg text-xs text-rose-300 leading-relaxed flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{drug.boxedWarningAr || drug.boxedWarningEn}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>ID: {drug.id}</span>
                <span>ATC: {drug.atcCode || 'VARIOUS'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Drug Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={
          isEditModalOpen
            ? (isAr ? `تعديل الدواء: ${selectedDrug?.genericNameAr}` : `Edit Drug: ${selectedDrug?.genericName}`)
            : (isAr ? 'إضافة دواء جديد لمستودع الأدوية' : 'Add Medication to Pharmacopeia')
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={isEditModalOpen ? handleUpdateDrug : handleCreateDrug} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الاسم العلمي (عربي)' : 'Generic Name (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={formGenericNameAr}
                onChange={(e) => setFormGenericNameAr(e.target.value)}
                placeholder="باراسيتامول"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الاسم العلمي (إنجليزي)' : 'Generic Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={formGenericName}
                onChange={(e) => setFormGenericName(e.target.value)}
                placeholder="Paracetamol"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الأسماء التجارية (مفصولة بفواصل)' : 'Brand Names (Comma-separated)'}
              </label>
              <input
                type="text"
                value={formBrandNames}
                onChange={(e) => setFormBrandNames(e.target.value)}
                placeholder="Panadol, Fevadol, Adol"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الفئة الدوائية (عربي)' : 'Drug Class (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={formDrugClassAr}
                onChange={(e) => {
                  setFormDrugClassAr(e.target.value);
                  if (!formDrugClass) setFormDrugClass(e.target.value);
                }}
                placeholder="مسكنات وخافضات حرارة غير أفيونية"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'دواعي الاستعمال (سطر لكل داعي)' : 'Common Uses (One per line)'}
            </label>
            <textarea
              rows={2}
              value={formUsesAr}
              onChange={(e) => setFormUsesAr(e.target.value)}
              placeholder="تسكين الآلام الخفيفة إلى المتوسطة&#10;تخفيض درجات الحرارة المرتفعة"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'التحذيرات وموانع الاستعمال' : 'Contraindications & Warnings'}
              </label>
              <textarea
                rows={2}
                value={formContraindicationsAr}
                onChange={(e) => setFormContraindicationsAr(e.target.value)}
                placeholder="القصور الكبدي الشديد&#10;الحساسية المفرطة للمادة الفعالة"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rose-300 mb-1">
                {isAr ? 'التحذير الصندوقي الحرج (Boxed Warning)' : 'Boxed Warning (Critical)'}
              </label>
              <textarea
                rows={2}
                value={formBoxedWarningAr}
                onChange={(e) => setFormBoxedWarningAr(e.target.value)}
                placeholder="خطر التسمم الكبدي الحاد عند تجاوز الجرعة اليومية القصوى 4000 ملغ..."
                className="w-full bg-slate-950 border border-rose-800/60 rounded-lg text-xs py-2 px-3 text-rose-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'إرشادات الجرعات السريرية' : 'Dosage Guidelines'}
            </label>
            <textarea
              rows={2}
              value={formDosageAr}
              onChange={(e) => setFormDosageAr(e.target.value)}
              placeholder="البالغين: 500-1000 ملغ كل 4-6 ساعات حسب الحاجة (بحد أقصى 4 غرام يومياً)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isEditModalOpen ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة الدواء' : 'Create Drug')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={isAr ? 'تأكيد حذف الدواء' : 'Confirm Drug Deletion'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? `هل أنت متأكد من حذف الدواء "${selectedDrug?.genericNameAr}" (${selectedDrug?.genericName}) من مستودع الأدوية؟`
              : `Are you sure you want to delete "${selectedDrug?.genericName}" from pharmacopeia?`}
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              {isAr ? 'تراجع' : 'Cancel'}
            </Button>
            <Button type="button" variant="danger" size="sm" isLoading={isSubmitting} onClick={handleDeleteDrug}>
              {isAr ? 'حذف نهائي' : 'Delete Drug'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
