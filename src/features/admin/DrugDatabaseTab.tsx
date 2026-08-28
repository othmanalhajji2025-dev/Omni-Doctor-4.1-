import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Input, Select, Modal, Alert, LoadingState } from '../../components/ui/index.js';
import { DrugProfile } from '../../types/index.js';

export const DrugDatabaseTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [drugs, setDrugs] = useState<DrugProfile[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedDrug, setSelectedDrug] = useState<DrugProfile | null>(null);

  const [isAddDrugOpen, setIsAddDrugOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [drugForm, setDrugForm] = useState({
    genericName: '',
    genericNameAr: '',
    brandNames: '',
    drugClass: '',
    atcCode: '',
    indications: '',
    contraindications: '',
    pregnancyCategory: 'B',
    isWhoEssential: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/drugs');
      if (!res.ok) throw new Error('Failed to load drug repository');
      const data = await res.json();
      setDrugs(data.profiles || []);
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: Partial<DrugProfile> = {
        genericName: drugForm.genericName.trim(),
        genericNameAr: drugForm.genericNameAr.trim() || drugForm.genericName.trim(),
        brandNames: drugForm.brandNames.split(',').map((s) => s.trim()).filter(Boolean),
        brandNamesAr: [],
        drugClass: drugForm.drugClass.trim(),
        drugClassAr: drugForm.drugClass.trim(),
        atcCode: drugForm.atcCode.trim() || 'N02BE01',
        indications: drugForm.indications.split(',').map((s) => s.trim()).filter(Boolean),
        contraindications: drugForm.contraindications.split(',').map((s) => s.trim()).filter(Boolean),
        blackBoxWarnings: [],
        pregnancyCategory: drugForm.pregnancyCategory as any,
        isWhoEssential: drugForm.isWhoEssential,
        dosageForms: [{ form: 'Tablet', strengths: ['500mg'], route: 'Oral' }],
        pharmacokinetics: { halfLife: '2-3 hours', bioavailability: '80%', excretion: 'Renal' },
      };

      setDrugs((prev) => [...prev, payload as DrugProfile]);
      setSuccessMsg(isAr ? `تمت إضافة الدواء "${payload.genericName}" بنجاح` : `Drug "${payload.genericName}" added`);
      setIsAddDrugOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDrugs = drugs.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      d.genericName.toLowerCase().includes(term) ||
      (d.genericNameAr && d.genericNameAr.toLowerCase().includes(term)) ||
      (d.atcCode && d.atcCode.toLowerCase().includes(term)) ||
      d.brandNames.some((b) => b.toLowerCase().includes(term));

    const matchesClass = selectedClass === 'ALL' || d.drugClass === selectedClass;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(drugs.map((d) => d.drugClass).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Source Adapters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sources.map((s, idx) => (
          <Card key={idx} className="p-3 bg-slate-900/80 border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">{s.name}</div>
              <div className="text-[10px] text-slate-400">{s.authority}</div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 max-w-md">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم العلمي أو التجاري...' : 'Search generic or brand...'}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: 'ALL', label: isAr ? 'جميع الفئات' : 'All Classes' },
              ...uniqueClasses.map((c) => ({ value: c, label: c })),
            ]}
          />

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
            onClick={() => setIsAddDrugOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة دواء' : 'Add Drug'}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Table */}
      {isLoading ? (
        <LoadingState message={isAr ? 'جاري تحميل الأدوية...' : 'Loading drugs...'} />
      ) : (
        <Card className="overflow-hidden bg-slate-900/70 border-slate-800 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{isAr ? 'الاسم العلمي' : 'Generic'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'الفئة' : 'Class'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'كود ATC' : 'ATC'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'فئة الحمل' : 'Pregnancy'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'عرض' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDrugs.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">{d.genericNameAr || d.genericName}</td>
                    <td className="py-3.5 px-4 text-cyan-300">{d.drugClass}</td>
                    <td className="py-3.5 px-4 font-mono text-purple-300">{d.atcCode}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" size="sm">Cat {d.pregnancyCategory || 'N/A'}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDrug(d)}
                        leftIcon={<Info className="w-3 h-3 text-cyan-400" />}
                      >
                        {isAr ? 'التفاصيل' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: View Drug Details */}
      <Modal
        isOpen={!!selectedDrug}
        onClose={() => setSelectedDrug(null)}
        title={selectedDrug?.genericName || ''}
      >
        {selectedDrug && (
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 block mb-1">Indications:</span>
              <div className="text-slate-200">{selectedDrug.indications.join(', ')}</div>
            </div>
            <div>
              <span className="font-bold text-slate-400 block mb-1">Contraindications:</span>
              <div className="text-rose-300">{selectedDrug.contraindications.join(', ')}</div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="primary" onClick={() => setSelectedDrug(null)}>
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Drug */}
      <Modal
        isOpen={isAddDrugOpen}
        onClose={() => setIsAddDrugOpen(false)}
        title={isAr ? 'إضافة دواء جديد' : 'Add New Drug'}
      >
        <form onSubmit={handleCreateDrug} className="space-y-4">
          <Input
            label={isAr ? 'الاسم العلمي (Generic)' : 'Generic Name'}
            required
            value={drugForm.genericName}
            onChange={(e) => setDrugForm({ ...drugForm, genericName: e.target.value })}
            placeholder="Paracetamol"
          />
          <Input
            label={isAr ? 'الفئة الدوائية' : 'Drug Class'}
            required
            value={drugForm.drugClass}
            onChange={(e) => setDrugForm({ ...drugForm, drugClass: e.target.value })}
            placeholder="Analgesic"
          />
          <Input
            label={isAr ? 'الأسماء التجارية' : 'Brand Names'}
            required
            value={drugForm.brandNames}
            onChange={(e) => setDrugForm({ ...drugForm, brandNames: e.target.value })}
            placeholder="Panadol, Fevadol"
          />
          <Input
            label={isAr ? 'دواعي الاستعمال' : 'Indications'}
            required
            value={drugForm.indications}
            onChange={(e) => setDrugForm({ ...drugForm, indications: e.target.value })}
            placeholder="Fever, Pain"
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddDrugOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isAr ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
