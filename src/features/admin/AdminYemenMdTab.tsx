import React, { useState, useEffect } from 'react';
import {
  MapPin,
  AlertTriangle,
  Hospital,
  BookA,
  Phone,
  Activity,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Flame,
  CheckCircle2,
  XCircle,
  Wind,
  HeartPulse,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Modal, LoadingState, Alert } from '../../components/ui/index.js';

interface YemenOutbreakRecord {
  id: string;
  diseaseNameAr: string;
  diseaseNameEn: string;
  category: 'INFECTIOUS' | 'WATERBORNE' | 'VECTOR_BORNE' | 'CHRONIC_EPIDEMIC' | 'NUTRITIONAL';
  governoratesAffected: string[];
  alertLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MONITORING';
  caseCountEstimated: number;
  reportedDate: string;
  transmissionModeAr: string;
  clinicalAdvisoryAr: string;
  emergencyProtocolAr: string;
}

interface YemenFacilityRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateAr: string;
  cityAr: string;
  facilityType: 'TERTIARY_HOSPITAL' | 'PUBLIC_HOSPITAL' | 'EMERGENCY_CENTER' | 'SPECIALIZED_CLINIC';
  emergencyHotline: string;
  has24HourEmergency: boolean;
  hasOxygenSupply: boolean;
  hasIcuCapacity: boolean;
  hasBloodBank: boolean;
  ambulanceAvailable: boolean;
  addressAr: string;
  operationalStatus: 'FULLY_OPERATIONAL' | 'LIMITED_CAPACITY' | 'EMERGENCY_ONLY';
}

interface YemenDialectLexiconItem {
  id: string;
  dialectPhraseAr: string;
  region: 'SANAANI' | 'ADENI' | 'TAIZI' | 'HODIEDAH_TIHAMA' | 'HADRAMI' | 'PAN_YEMENI';
  standardArabicMeaning: string;
  medicalConceptEn: string;
  clinicalCategory: 'SYMPTOM' | 'ANATOMICAL' | 'TEMPORAL' | 'SEVERITY';
  clinicalContextAr: string;
  icd10Hint?: string;
}

export const AdminYemenMdTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [activeSection, setActiveSection] = useState<'OUTBREAKS' | 'FACILITIES' | 'LEXICON'>('OUTBREAKS');
  const [outbreaks, setOutbreaks] = useState<YemenOutbreakRecord[]>([]);
  const [facilities, setFacilities] = useState<YemenFacilityRecord[]>([]);
  const [lexicon, setLexicon] = useState<YemenDialectLexiconItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isAddOutbreakOpen, setIsAddOutbreakOpen] = useState(false);
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const [isAddLexiconOpen, setIsAddLexiconOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outbreak Form
  const [obNameAr, setObNameAr] = useState('');
  const [obNameEn, setObNameEn] = useState('');
  const [obCategory, setObCategory] = useState<any>('WATERBORNE');
  const [obAlertLevel, setObAlertLevel] = useState<any>('CRITICAL');
  const [obGovernorates, setObGovernorates] = useState('صنعاء، الحديدة، تعز');
  const [obCases, setObCases] = useState(1200);
  const [obTransmission, setObTransmission] = useState('');
  const [obAdvisory, setObAdvisory] = useState('');
  const [obProtocol, setObProtocol] = useState('');

  // Facility Form
  const [facNameAr, setFacNameAr] = useState('');
  const [facNameEn, setFacNameEn] = useState('');
  const [facGov, setFacGov] = useState('صنعاء');
  const [facCity, setFacCity] = useState('أمانة العاصمة');
  const [facType, setFacType] = useState<any>('TERTIARY_HOSPITAL');
  const [facHotline, setFacHotline] = useState('');
  const [fac24h, setFac24h] = useState(true);
  const [facOxygen, setFacOxygen] = useState(true);
  const [facIcu, setFacIcu] = useState(true);
  const [facBlood, setFacBlood] = useState(true);
  const [facAddress, setFacAddress] = useState('');
  const [facStatus, setFacStatus] = useState<any>('FULLY_OPERATIONAL');

  // Lexicon Form
  const [lexPhrase, setLexPhrase] = useState('');
  const [lexRegion, setLexRegion] = useState<any>('PAN_YEMENI');
  const [lexStandardAr, setLexStandardAr] = useState('');
  const [lexConceptEn, setLexConceptEn] = useState('');
  const [lexContext, setLexContext] = useState('');
  const [lexIcd10, setLexIcd10] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [obRes, facRes, lexRes] = await Promise.all([
        fetchWithAuth('/api/admin/yemenmd/outbreaks'),
        fetchWithAuth('/api/admin/yemenmd/facilities'),
        fetchWithAuth('/api/admin/yemenmd/lexicon'),
      ]);

      if (obRes.ok) {
        const d = await obRes.json();
        setOutbreaks(d.outbreaks || []);
      }
      if (facRes.ok) {
        const d = await facRes.json();
        setFacilities(d.facilities || []);
      }
      if (lexRes.ok) {
        const d = await lexRes.json();
        setLexicon(d.lexicon || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOutbreak = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const govs = obGovernorates.split('،').map(g => g.trim()).filter(Boolean);
      const res = await fetchWithAuth('/api/admin/yemenmd/outbreaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diseaseNameAr: obNameAr,
          diseaseNameEn: obNameEn || obNameAr,
          category: obCategory,
          alertLevel: obAlertLevel,
          governoratesAffected: govs,
          caseCountEstimated: Number(obCases),
          reportedDate: new Date().toISOString().split('T')[0],
          transmissionModeAr: obTransmission,
          transmissionModeEn: obTransmission,
          clinicalAdvisoryAr: obAdvisory,
          clinicalAdvisoryEn: obAdvisory,
          emergencyProtocolAr: obProtocol,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to create outbreak');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تسجيل التنبيه الوبائي بنجاح' : 'Outbreak recorded'));
      setIsAddOutbreakOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOutbreak = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/yemenmd/outbreaks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete outbreak');
      setSuccessMsg(isAr ? 'تم حذف التنبيه الوبائي' : 'Outbreak deleted');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/yemenmd/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: facNameAr,
          nameEn: facNameEn || facNameAr,
          governorateAr: facGov,
          governorateEn: facGov,
          cityAr: facCity,
          facilityType: facType,
          emergencyHotline: facHotline,
          has24HourEmergency: fac24h,
          hasOxygenSupply: facOxygen,
          hasIcuCapacity: facIcu,
          hasBloodBank: facBlood,
          ambulanceAvailable: true,
          addressAr: facAddress,
          operationalStatus: facStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to create facility');

      setSuccessMsg(data.messageAr || (isAr ? 'تمت إضافة المنشأة الصحية بنجاح' : 'Facility added'));
      setIsAddFacilityOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFacility = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/yemenmd/facilities/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete facility');
      setSuccessMsg(isAr ? 'تم حذف المنشأة الصحية' : 'Facility deleted');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateLexicon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/yemenmd/lexicon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialectPhraseAr: lexPhrase,
          phoneticPronunciation: lexPhrase,
          region: lexRegion,
          standardArabicMeaning: lexStandardAr,
          medicalConceptEn: lexConceptEn,
          clinicalCategory: 'SYMPTOM',
          clinicalContextAr: lexContext,
          icd10Hint: lexIcd10 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to add lexicon item');

      setSuccessMsg(data.messageAr || (isAr ? 'تمت إضافة المصطلح اللهجي بنجاح' : 'Lexicon item added'));
      setIsAddLexiconOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLexicon = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/yemenmd/lexicon/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lexicon item');
      setSuccessMsg(isAr ? 'تم حذف المصطلح' : 'Lexicon item deleted');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'الإنذار الوبائي النشط' : 'Active Outbreak Alerts'}</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{outbreaks.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'مستشفيات الطوارئ المفهرسة' : 'Emergency Facilities'}</span>
            <Hospital className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400 mt-2">{facilities.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'قاموس المصطلحات اللهجية' : 'Dialect Clinical Lexicon'}</span>
            <BookA className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{lexicon.length}</p>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" title={isAr ? 'تنبيه YemenMD' : 'YemenMD Error'}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" title={isAr ? 'اكتمل بنجاح' : 'Success'}>
          {successMsg}
        </Alert>
      )}

      {/* Section Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSection('OUTBREAKS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'OUTBREAKS'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'ترصد الأوبئة (Epidemics)' : 'Outbreak Alerts'}
          </button>
          <button
            onClick={() => setActiveSection('FACILITIES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'FACILITIES'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'شبكة المستشفيات (Hospitals)' : 'Facilities'}
          </button>
          <button
            onClick={() => setActiveSection('LEXICON')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'LEXICON'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'القاموس اللهجي (Dialect)' : 'Clinical Lexicon'}
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>

          {activeSection === 'OUTBREAKS' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsAddOutbreakOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isAr ? 'تسجيل تنبيه وبائي' : 'Add Outbreak'}
            </Button>
          )}

          {activeSection === 'FACILITIES' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddFacilityOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isAr ? 'إضافة منشأة صحية' : 'Add Facility'}
            </Button>
          )}

          {activeSection === 'LEXICON' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddLexiconOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isAr ? 'إضافة مصطلح لهجي' : 'Add Lexicon Item'}
            </Button>
          )}
        </div>
      </div>

      {/* 1. Outbreaks View */}
      {activeSection === 'OUTBREAKS' && (
        <div className="space-y-4">
          {outbreaks.map((ob) => (
            <Card key={ob.id} className="p-4 bg-slate-900/90 border-slate-800 hover:border-rose-900/60 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{ob.diseaseNameAr}</span>
                    <Badge variant={ob.alertLevel === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                      {ob.alertLevel}
                    </Badge>
                    <Badge variant="info" size="sm">{ob.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{ob.governoratesAffected?.join('، ')}</span>
                    <span>• {isAr ? 'الحالات التقديرية:' : 'Est. Cases:'} {ob.caseCountEstimated}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteOutbreak(ob.id)}
                  className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">{isAr ? 'التوجيه السريري والتحذيرات:' : 'Advisory:'} </span>
                  <span className="text-slate-300">{ob.clinicalAdvisoryAr}</span>
                </div>
                <div>
                  <span className="text-rose-400 font-semibold">{isAr ? 'بروتوكول الطوارئ المعتمد:' : 'Protocol:'} </span>
                  <span className="text-slate-300 font-mono">{ob.emergencyProtocolAr}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 2. Facilities View */}
      {activeSection === 'FACILITIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map((fac) => (
            <Card key={fac.id} className="p-4 bg-slate-900/90 border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-sm text-slate-100">{fac.nameAr}</span>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{fac.governorateAr} - {fac.cityAr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant={fac.operationalStatus === 'FULLY_OPERATIONAL' ? 'success' : 'warning'} size="sm">
                      {fac.operationalStatus}
                    </Badge>
                    <button
                      onClick={() => handleDeleteFacility(fac.id)}
                      className="p-1 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    <span>24h طوارئ: {fac.has24HourEmergency ? 'متاح' : 'غير متوفر'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>أكسجين مركزي: {fac.hasOxygenSupply ? 'متوفر' : 'نقص'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-2">{fac.addressAr}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{isAr ? 'طوارئ:' : 'Hotline:'}</span>
                <a href={`tel:${fac.emergencyHotline}`} className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{fac.emergencyHotline}</span>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 3. Lexicon View */}
      {activeSection === 'LEXICON' && (
        <Card className="p-0 overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'المصطلح واللهجة' : 'Dialect Term'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المعنى الطبي المعياري' : 'Clinical Meaning'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المفهوم بالإنجليزي' : 'English Medical Concept'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'السياق السريري' : 'Clinical Context'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {lexicon.map((lex) => (
                  <tr key={lex.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      <div>{lex.dialectPhraseAr}</div>
                      <Badge variant="neutral" size="sm" className="mt-1 font-mono text-[10px]">{lex.region}</Badge>
                    </td>

                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                      {lex.standardArabicMeaning}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-cyan-400 text-[11px]">
                      {lex.medicalConceptEn}
                      {lex.icd10Hint && <span className="block text-[10px] text-slate-500">ICD-10: {lex.icd10Hint}</span>}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 leading-relaxed max-w-xs">
                      {lex.clinicalContextAr}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteLexicon(lex.id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Outbreak Modal */}
      <Modal
        isOpen={isAddOutbreakOpen}
        onClose={() => setIsAddOutbreakOpen(false)}
        title={isAr ? 'تسجيل تنبيه وبائي محلي جديد (Early Outbreak Alert)' : 'Register Outbreak Alert'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateOutbreak} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'اسم المرض والوباء (عربي)' : 'Disease (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={obNameAr}
                onChange={(e) => setObNameAr(e.target.value)}
                placeholder="حمى الضنك والنزفية"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'مستوى التحذير' : 'Alert Level'}
              </label>
              <select
                value={obAlertLevel}
                onChange={(e) => setObAlertLevel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="CRITICAL">CRITICAL (حرج)</option>
                <option value="HIGH">HIGH (مرتفع)</option>
                <option value="MODERATE">MODERATE (متوسط)</option>
                <option value="MONITORING">MONITORING (تحت المراقبة)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'المحافظات المتأثرة (مفصولة بفواصل)' : 'Affected Governorates'}
            </label>
            <input
              type="text"
              required
              value={obGovernorates}
              onChange={(e) => setObGovernorates(e.target.value)}
              placeholder="الحديدة، تعز، عدن، لحج"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'التوجيه السريري والتحذيرات الصارمة' : 'Clinical Advisory'}
            </label>
            <textarea
              rows={2}
              required
              value={obAdvisory}
              onChange={(e) => setObAdvisory(e.target.value)}
              placeholder="يمنع إعطاء الأسبرين والبروفين نهائياً؛ استخدام الباراسيتامول ومراقبة CBC..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'بروتوكول الطوارئ المعتمد' : 'Emergency Protocol'}
            </label>
            <textarea
              rows={2}
              required
              value={obProtocol}
              onChange={(e) => setObProtocol(e.target.value)}
              placeholder="فحص CBC يومي + محاليل وريدية Ringer Lactate عند هبوط الضغط..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOutbreakOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
              {isAr ? 'نشر التنبيه الوبائي' : 'Publish Alert'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Facility Modal */}
      <Modal
        isOpen={isAddFacilityOpen}
        onClose={() => setIsAddFacilityOpen(false)}
        title={isAr ? 'إضافة منشأة صحية أو مركز طوارئ' : 'Add Healthcare Facility'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateFacility} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'اسم المستشفى / المركز' : 'Facility Name'} *
              </label>
              <input
                type="text"
                required
                value={facNameAr}
                onChange={(e) => setFacNameAr(e.target.value)}
                placeholder="مستشفى الثورة العام"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'المحافظة' : 'Governorate'} *
              </label>
              <input
                type="text"
                required
                value={facGov}
                onChange={(e) => setFacGov(e.target.value)}
                placeholder="صنعاء"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'هاتف الطوارئ المركزي' : 'Emergency Hotline'} *
              </label>
              <input
                type="text"
                required
                value={facHotline}
                onChange={(e) => setFacHotline(e.target.value)}
                placeholder="01-246060"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'العنوان والشارع' : 'Address'}
              </label>
              <input
                type="text"
                value={facAddress}
                onChange={(e) => setFacAddress(e.target.value)}
                placeholder="شارع تعز - صنعاء"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddFacilityOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isAr ? 'حفظ المنشأة' : 'Save Facility'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Lexicon Modal */}
      <Modal
        isOpen={isAddLexiconOpen}
        onClose={() => setIsAddLexiconOpen(false)}
        title={isAr ? 'إضافة مصطلح لهجي للقاموس السريري' : 'Add Dialect Term to Clinical Lexicon'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateLexicon} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'العبارة اللهجية' : 'Dialect Phrase'} *
              </label>
              <input
                type="text"
                required
                value={lexPhrase}
                onChange={(e) => setLexPhrase(e.target.value)}
                placeholder="فتور وكسار بالعظام"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'المنطقة واللهجة' : 'Region'}
              </label>
              <select
                value={lexRegion}
                onChange={(e) => setLexRegion(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="PAN_YEMENI">عموم اليمن (Pan-Yemeni)</option>
                <option value="SANAANI">صنعاني (Sanaani)</option>
                <option value="ADENI">عدني (Adeni)</option>
                <option value="TAIZI">تعزي (Taizi)</option>
                <option value="HODIEDAH_TIHAMA">تهامي / الحديدة (Tihama)</option>
                <option value="HADRAMI">حضرمي (Hadrami)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'المعنى الطبي المعياري' : 'Standard Meaning'} *
              </label>
              <input
                type="text"
                required
                value={lexStandardAr}
                onChange={(e) => setLexStandardAr(e.target.value)}
                placeholder="إعياء شديد وآلام مبرحة بالمفاصل والعضلات"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'المفهوم بالإنجليزي' : 'English Concept'}
              </label>
              <input
                type="text"
                value={lexConceptEn}
                onChange={(e) => setLexConceptEn(e.target.value)}
                placeholder="Severe Myalgia and Arthralgia"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'السياق السريري والتشخيصي' : 'Clinical Context'}
            </label>
            <textarea
              rows={2}
              value={lexContext}
              onChange={(e) => setLexContext(e.target.value)}
              placeholder="العرض النموذجي لحمى الضنك؛ يمنع إعطاء مضادات الالتهاب غير الستيرويدية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddLexiconOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="secondary" size="sm" isLoading={isSubmitting}>
              {isAr ? 'حفظ المصطلح' : 'Save Lexicon'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
