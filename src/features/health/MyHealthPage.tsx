import React, { useState, useEffect } from 'react';
import {
  Heart,
  User,
  Activity,
  AlertTriangle,
  Pill,
  Scissors,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  Weight,
  Ruler,
  Dna,
  RefreshCw,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  LoadingState,
  Alert,
} from '../../components/ui/index.js';
import {
  PersonalInformation,
  MedicalCondition,
  Allergy,
  Medication,
  Surgery,
  NavigationTab,
} from '../../types/index.js';

interface MyHealthPageProps {
  onNavigate?: (tab: NavigationTab) => void;
  onOpenAuth?: () => void;
}

export const MyHealthPage: React.FC<MyHealthPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { language } = useLanguage();
  const { user, isAuthenticated, fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<PersonalInformation | null>(null);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [isAddSurgeryOpen, setIsAddSurgeryOpen] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    age: 44,
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    heightCm: 176,
    weightKg: 82,
    ethnicity: 'عربي (Middle Eastern)',
    bloodType: 'O+',
    emergencyName: 'فاطمة السالم (الزوجة)',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+966 50 765 4321',
  });

  // Condition Form State
  const [conditionForm, setConditionForm] = useState({
    nameAr: '',
    nameEn: '',
    status: 'ACTIVE' as 'ACTIVE' | 'MANAGED' | 'REMISSION',
    diagnosedYear: new Date().getFullYear(),
    notes: '',
  });

  // Allergy Form State
  const [allergyForm, setAllergyForm] = useState({
    allergenAr: '',
    allergenEn: '',
    type: 'DRUG' as 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER',
    reactionAr: '',
    reactionEn: '',
    severity: 'MODERATE' as 'MILD' | 'MODERATE' | 'SEVERE',
  });

  // Medication Form State
  const [medicationForm, setMedicationForm] = useState({
    nameAr: '',
    nameEn: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    prescriber: '',
    indication: '',
  });

  // Surgery Form State
  const [surgeryForm, setSurgeryForm] = useState({
    surgeryNameAr: '',
    surgeryNameEn: '',
    year: new Date().getFullYear() - 2,
    hospital: '',
    notes: '',
  });

  // Load all health data for authenticated user
  const loadHealthData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [pRes, cRes, aRes, mRes, sRes] = await Promise.all([
        fetchWithAuth('/api/health/profile'),
        fetchWithAuth('/api/health/conditions'),
        fetchWithAuth('/api/health/allergies'),
        fetchWithAuth('/api/health/medications'),
        fetchWithAuth('/api/health/surgeries'),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
        setProfileForm({
          age: pData.age,
          gender: pData.gender,
          heightCm: pData.heightCm,
          weightKg: pData.weightKg,
          ethnicity: pData.ethnicity,
          bloodType: pData.bloodType,
          emergencyName: pData.emergencyContact?.name || '',
          emergencyRelation: pData.emergencyContact?.relation || '',
          emergencyPhone: pData.emergencyContact?.phone || '',
        });
      }

      if (cRes.ok) setConditions(await cRes.json());
      if (aRes.ok) setAllergies(await aRes.json());
      if (mRes.ok) setMedications(await mRes.json());
      if (sRes.ok) setSurgeries(await sRes.json());
    } catch (err) {
      console.error('Error fetching health profile data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, [isAuthenticated, user?.id]);

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/health/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: Number(profileForm.age),
          gender: profileForm.gender,
          heightCm: Number(profileForm.heightCm),
          weightKg: Number(profileForm.weightKg),
          ethnicity: profileForm.ethnicity,
          bloodType: profileForm.bloodType,
          emergencyContact: {
            name: profileForm.emergencyName,
            relation: profileForm.emergencyRelation,
            phone: profileForm.emergencyPhone,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setProfile(data.profile);
      setIsEditProfileOpen(false);
      setFeedback({
        type: 'success',
        message: isAr ? 'تم تحديث المعلومات الشخصية بنجاح' : 'Personal information updated',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating profile' });
    }
  };

  // Add Condition Handler
  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/health/conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: conditionForm.nameAr,
          nameEn: conditionForm.nameEn || conditionForm.nameAr,
          status: conditionForm.status,
          diagnosedYear: Number(conditionForm.diagnosedYear),
          notes: conditionForm.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to add condition');
      const data = await res.json();
      setConditions([...conditions, data.condition]);
      setIsAddConditionOpen(false);
      setConditionForm({
        nameAr: '',
        nameEn: '',
        status: 'ACTIVE',
        diagnosedYear: new Date().getFullYear(),
        notes: '',
      });
      setFeedback({
        type: 'success',
        message: isAr ? 'تمت إضافة الحالة الصحية للملف' : 'Medical condition added',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Delete Condition
  const handleDeleteCondition = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/health/conditions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete condition');
      setConditions(conditions.filter((c) => c.id !== id));
      setFeedback({
        type: 'success',
        message: isAr ? 'تم حذف الحالة الصحية' : 'Condition removed',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Add Allergy Handler
  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/health/allergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allergenAr: allergyForm.allergenAr,
          allergenEn: allergyForm.allergenEn || allergyForm.allergenAr,
          type: allergyForm.type,
          reactionAr: allergyForm.reactionAr,
          reactionEn: allergyForm.reactionEn || allergyForm.reactionAr,
          severity: allergyForm.severity,
        }),
      });

      if (!res.ok) throw new Error('Failed to record allergy');
      const data = await res.json();
      setAllergies([...allergies, data.allergy]);
      setIsAddAllergyOpen(false);
      setAllergyForm({
        allergenAr: '',
        allergenEn: '',
        type: 'DRUG',
        reactionAr: '',
        reactionEn: '',
        severity: 'MODERATE',
      });
      setFeedback({
        type: 'success',
        message: isAr ? 'تم توثيق الحساسية بنجاح' : 'Allergy record saved',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Delete Allergy
  const handleDeleteAllergy = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/health/allergies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete allergy');
      setAllergies(allergies.filter((a) => a.id !== id));
      setFeedback({
        type: 'success',
        message: isAr ? 'تم حذف سجل الحساسية' : 'Allergy removed',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Add Medication Handler
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/health/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicationForm),
      });

      if (!res.ok) throw new Error('Failed to add medication');
      const data = await res.json();
      setMedications([...medications, data.medication]);
      setIsAddMedicationOpen(false);
      setMedicationForm({
        nameAr: '',
        nameEn: '',
        dosage: '',
        frequency: '',
        startDate: new Date().toISOString().split('T')[0],
        prescriber: '',
        indication: '',
      });
      setFeedback({
        type: 'success',
        message: isAr ? 'تم حفظ الدواء في قائمة العلاجات' : 'Medication added',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Delete Medication
  const handleDeleteMedication = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/health/medications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete medication');
      setMedications(medications.filter((m) => m.id !== id));
      setFeedback({
        type: 'success',
        message: isAr ? 'تم حذف الدواء من السجل' : 'Medication removed',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Add Surgery Handler
  const handleAddSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/health/surgeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surgeryNameAr: surgeryForm.surgeryNameAr,
          surgeryNameEn: surgeryForm.surgeryNameEn || surgeryForm.surgeryNameAr,
          year: Number(surgeryForm.year),
          hospital: surgeryForm.hospital,
          notes: surgeryForm.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to record surgery');
      const data = await res.json();
      setSurgeries([...surgeries, data.surgery]);
      setIsAddSurgeryOpen(false);
      setSurgeryForm({
        surgeryNameAr: '',
        surgeryNameEn: '',
        year: new Date().getFullYear() - 1,
        hospital: '',
        notes: '',
      });
      setFeedback({
        type: 'success',
        message: isAr ? 'تم توثيق العملية الجراحية' : 'Surgery record added',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Delete Surgery
  const handleDeleteSurgery = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/health/surgeries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete surgery');
      setSurgeries(surgeries.filter((s) => s.id !== id));
      setFeedback({
        type: 'success',
        message: isAr ? 'تم حذف سجل العملية الجراحية' : 'Surgery removed',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Calculate BMI
  const bmi =
    profile && profile.heightCm > 0
      ? Number((profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1))
      : 22.0;

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-6 animate-fadeIn">
        <Card className="p-8 text-center space-y-5 bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-100">
              {isAr ? 'الملف الصحي الشامل (صحتي)' : 'My Health Profile'}
            </h2>
            <p className="text-sm text-slate-400">
              {isAr
                ? 'يرجى تسجيل الدخول للوصول إلى معلوماتك الشخصية، الأمراض والحالات الصحية، الحساسية، الأدوية، والعمليات السابقة.'
                : 'Please sign in to access and manage your personal information, medical conditions, allergies, medications, and surgical history.'}
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="md" onClick={onOpenAuth} className="px-8">
              {isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <LoadingState text={isAr ? 'جارِ استرجاع السجلات الصحية الموثقة...' : 'Retrieving isolated health records...'} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
              <Heart className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              {isAr ? 'صحتي (My Health)' : 'My Health Profile'}
            </h1>
            <Badge variant="success" size="sm">
              {isAr ? 'عزل أمني تام' : 'Strictly Isolated'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'إدارة متكاملة لمعلوماتك الشخصية، الحالات المزمنة، سجل الحساسية، العلاجات الدوائية، والتاريخ الجراحي'
              : 'Comprehensive management of personal vitals, conditions, allergies, medications, and surgical history'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadHealthData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isAr ? 'تحديث السجلات' : 'Refresh'}
          </Button>
          {onNavigate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('dashboard')}
            >
              {isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'danger'}
          title={feedback.type === 'success' ? (isAr ? 'نجاح العملية' : 'Success') : (isAr ? 'تنبيه' : 'Alert')}
        >
          <div className="flex items-center justify-between">
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: Personal Information (المعلومات الشخصية)                       */}
      {/* ========================================================================= */}
      <Card className="p-6 border-slate-800/80 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/70">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isAr ? 'المعلومات الشخصية (Personal Information)' : 'Personal Information'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'العمر، الجنس، الطول، الوزن، والعرق' : 'Age, Gender, Height, Weight, and Ethnicity'}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditProfileOpen(true)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            {isAr ? 'تعديل المعلومات' : 'Edit Info'}
          </Button>
        </div>

        {profile && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. العمر */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'العمر' : 'Age'}</span>
              </div>
              <p className="text-lg font-bold text-slate-100">
                {profile.age} <span className="text-xs font-normal text-slate-400">{isAr ? 'سنة' : 'years'}</span>
              </p>
            </div>

            {/* 2. الجنس */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'الجنس' : 'Gender'}</span>
              </div>
              <p className="text-lg font-bold text-slate-100">
                {profile.gender === 'MALE'
                  ? isAr ? 'ذكر' : 'Male'
                  : profile.gender === 'FEMALE'
                  ? isAr ? 'أنثى' : 'Female'
                  : isAr ? 'آخر' : 'Other'}
              </p>
            </div>

            {/* 3. الطول */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Ruler className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'الطول' : 'Height'}</span>
              </div>
              <p className="text-lg font-bold text-slate-100">
                {profile.heightCm} <span className="text-xs font-normal text-slate-400">cm</span>
              </p>
            </div>

            {/* 4. الوزن */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Weight className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'الوزن' : 'Weight'}</span>
              </div>
              <p className="text-lg font-bold text-slate-100">
                {profile.weightKg} <span className="text-xs font-normal text-slate-400">kg</span>
              </p>
            </div>

            {/* 5. العرق */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Dna className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'العرق' : 'Ethnicity'}</span>
              </div>
              <p className="text-sm font-bold text-slate-100 truncate">
                {profile.ethnicity || (isAr ? 'عربي' : 'Middle Eastern')}
              </p>
            </div>
          </div>
        )}

        {/* Secondary Personal Details: BMI & Emergency Contact */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400">{isAr ? 'مؤشر كتلة الجسم (BMI):' : 'Calculated BMI:'}</span>
                <span className="text-base font-bold text-slate-100 block">{bmi} kg/m²</span>
              </div>
              <span className="text-slate-400">
                {isAr ? 'فصيلة الدم:' : 'Blood Type:'}{' '}
                <strong className="text-emerald-400 text-sm ml-1">{profile.bloodType}</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {isAr ? 'جهة اتصال الطوارئ:' : 'Emergency Contact:'}
                </span>
                <span className="font-semibold text-slate-200 block">
                  {profile.emergencyContact?.name || (isAr ? 'غير محدد' : 'Not set')}{' '}
                  {profile.emergencyContact?.relation && `(${profile.emergencyContact.relation})`}
                </span>
              </div>
              <span className="text-slate-400 dir-ltr text-left">
                {profile.emergencyContact?.phone}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 2: Medical Conditions (الأمراض والحالات الصحية)                     */}
      {/* ========================================================================= */}
      <Card className="p-6 border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/70">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isAr ? 'الأمراض والحالات الصحية (Medical Conditions)' : 'Medical Conditions'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'الأمراض المزمنة والمشخصة سريرياً' : 'Diagnosed chronic diseases and clinical conditions'}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddConditionOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة حالة' : 'Add Condition'}
          </Button>
        </div>

        {conditions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {conditions.map((cond) => (
              <div
                key={cond.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">{cond.nameAr}</span>
                    <Badge
                      variant={
                        cond.status === 'ACTIVE'
                          ? 'danger'
                          : cond.status === 'MANAGED'
                          ? 'success'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {cond.status === 'ACTIVE'
                        ? isAr ? 'نشط' : 'Active'
                        : cond.status === 'MANAGED'
                        ? isAr ? 'تحت السيطرة' : 'Managed'
                        : isAr ? 'خامل' : 'Remission'}
                    </Badge>
                  </div>
                  {cond.nameEn && (
                    <span className="text-xs text-slate-400 block">{cond.nameEn}</span>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                    <span>{isAr ? `تشخيص سنة ${cond.diagnosedYear}` : `Diagnosed in ${cond.diagnosedYear}`}</span>
                  </div>
                  {cond.notes && (
                    <p className="text-xs text-slate-300/90 pt-1 border-t border-slate-800/80">
                      {cond.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCondition(cond.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={isAr ? 'حذف الحالة' : 'Delete condition'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <p className="text-xs">
              {isAr ? 'لم يتم تسجيل أي أمراض أو حالات صحية حتى الآن.' : 'No medical conditions recorded.'}
            </p>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 3: Allergies (الحساسية)                                           */}
      {/* ========================================================================= */}
      <Card className="p-6 border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/70">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isAr ? 'الحساسية والمحاذير (Allergies)' : 'Allergies & Sensitivities'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'الحساسية الدوائية والغذائية وتفاعلاتها المهددة للحياة' : 'Drug & food allergies to avoid adverse reactions'}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddAllergyOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة حساسية' : 'Add Allergy'}
          </Button>
        </div>

        {allergies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {allergies.map((allg) => (
              <div
                key={allg.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  allg.severity === 'SEVERE'
                    ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">{allg.allergenAr}</span>
                    <Badge
                      variant={
                        allg.severity === 'SEVERE'
                          ? 'danger'
                          : allg.severity === 'MODERATE'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {allg.severity === 'SEVERE'
                        ? isAr ? 'شديدة وخطيرة' : 'Severe'
                        : allg.severity === 'MODERATE'
                        ? isAr ? 'متوسطة' : 'Moderate'
                        : isAr ? 'خفيفة' : 'Mild'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      {allg.type === 'DRUG'
                        ? isAr ? 'حساسية أدوية' : 'Drug'
                        : allg.type === 'FOOD'
                        ? isAr ? 'حساسية طعام' : 'Food'
                        : isAr ? 'بيئية' : 'Environmental'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pt-1">
                    <strong className="text-slate-400">{isAr ? 'رد الفعل السريري: ' : 'Reaction: '}</strong>
                    {allg.reactionAr}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAllergy(allg.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={isAr ? 'حذف الحساسية' : 'Delete allergy'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <p className="text-xs">
              {isAr ? 'لا توجد حساسيات مسجلة في ملفك الطبي.' : 'No allergies recorded.'}
            </p>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 4: Medications (الأدوية الحالية)                                   */}
      {/* ========================================================================= */}
      <Card className="p-6 border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/70">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isAr ? 'الأدوية الحالية (Medications)' : 'Current Medications'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'الوصفات الطبية المستمرة والجرعات ومواعيد التناول' : 'Active prescriptions, dosages, and administration timing'}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddMedicationOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة دواء' : 'Add Medication'}
          </Button>
        </div>

        {medications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {medications.map((med) => (
              <div
                key={med.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">{med.nameAr}</span>
                    <Badge variant="success" size="sm">
                      {med.dosage}
                    </Badge>
                  </div>
                  {med.nameEn && (
                    <span className="text-xs text-slate-400 block">{med.nameEn}</span>
                  )}
                  <div className="text-xs text-emerald-400/90 font-medium">
                    {med.frequency}
                  </div>
                  {med.indication && (
                    <p className="text-xs text-slate-300 pt-0.5">
                      <span className="text-slate-400">{isAr ? 'دواعي الاستعمال: ' : 'Indication: '}</span>
                      {med.indication}
                    </p>
                  )}
                  {med.prescriber && (
                    <span className="text-[11px] text-slate-500 block">
                      {isAr ? `الطبيب الواصف: ${med.prescriber}` : `Prescriber: ${med.prescriber}`}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMedication(med.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={isAr ? 'حذف الدواء' : 'Delete medication'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <p className="text-xs">
              {isAr ? 'لا توجد أدوية حالية مسجلة.' : 'No current medications recorded.'}
            </p>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 5: Surgeries (العمليات السابقة)                                    */}
      {/* ========================================================================= */}
      <Card className="p-6 border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-950/80 text-teal-400 border border-teal-800/70">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isAr ? 'العمليات السابقة (Surgeries)' : 'Previous Surgical History'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'التاريخ الجراحي والعمليات السابقة ومستشفيات الإجراء' : 'Past surgical procedures and post-operative outcomes'}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddSurgeryOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة عملية' : 'Add Surgery'}
          </Button>
        </div>

        {surgeries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {surgeries.map((surg) => (
              <div
                key={surg.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">{surg.surgeryNameAr}</span>
                    <Badge variant="neutral" size="sm">
                      {surg.year}
                    </Badge>
                  </div>
                  {surg.surgeryNameEn && (
                    <span className="text-xs text-slate-400 block">{surg.surgeryNameEn}</span>
                  )}
                  {surg.hospital && (
                    <p className="text-xs text-slate-400">
                      {isAr ? `المستشفى: ${surg.hospital}` : `Hospital: ${surg.hospital}`}
                    </p>
                  )}
                  {surg.notes && (
                    <p className="text-xs text-slate-300/90 pt-1 border-t border-slate-800/70">
                      {surg.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSurgery(surg.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={isAr ? 'حذف العملية' : 'Delete surgery'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <p className="text-xs">
              {isAr ? 'لا توجد عمليات جراحية سابقة مسجلة.' : 'No previous surgeries recorded.'}
            </p>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: Edit Personal Information                                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title={isAr ? 'تعديل المعلومات الشخصية' : 'Edit Personal Information'}
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isAr ? 'العمر' : 'Age'}
              type="number"
              value={profileForm.age}
              onChange={(e) => setProfileForm({ ...profileForm, age: Number(e.target.value) })}
              required
            />
            <Select
              label={isAr ? 'الجنس' : 'Gender'}
              value={profileForm.gender}
              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
              options={[
                { value: 'MALE', label: isAr ? 'ذكر' : 'Male' },
                { value: 'FEMALE', label: isAr ? 'أنثى' : 'Female' },
                { value: 'OTHER', label: isAr ? 'آخر' : 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isAr ? 'الطول (سم)' : 'Height (cm)'}
              type="number"
              value={profileForm.heightCm}
              onChange={(e) => setProfileForm({ ...profileForm, heightCm: Number(e.target.value) })}
              required
            />
            <Input
              label={isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
              type="number"
              value={profileForm.weightKg}
              onChange={(e) => setProfileForm({ ...profileForm, weightKg: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isAr ? 'العرق' : 'Ethnicity'}
              value={profileForm.ethnicity}
              onChange={(e) => setProfileForm({ ...profileForm, ethnicity: e.target.value })}
              placeholder={isAr ? 'عربي (Middle Eastern)' : 'Middle Eastern'}
              required
            />
            <Select
              label={isAr ? 'فصيلة الدم' : 'Blood Type'}
              value={profileForm.bloodType}
              onChange={(e) => setProfileForm({ ...profileForm, bloodType: e.target.value })}
              options={[
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
              ]}
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block">
              {isAr ? 'جهة اتصال الطوارئ' : 'Emergency Contact'}
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label={isAr ? 'اسم جهة الاتصال' : 'Name'}
                value={profileForm.emergencyName}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyName: e.target.value })}
              />
              <Input
                label={isAr ? 'صلة القرابة' : 'Relation'}
                value={profileForm.emergencyRelation}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyRelation: e.target.value })}
              />
            </div>
            <Input
              label={isAr ? 'رقم الهاتف' : 'Phone'}
              value={profileForm.emergencyPhone}
              onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditProfileOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: Add Medical Condition                                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddConditionOpen}
        onClose={() => setIsAddConditionOpen(false)}
        title={isAr ? 'إضافة حالة صحية جديدة' : 'Add Medical Condition'}
        size="md"
      >
        <form onSubmit={handleAddCondition} className="space-y-3.5">
          <Input
            label={isAr ? 'اسم الحالة أو المرض بالعربية' : 'Condition Name (Arabic)'}
            value={conditionForm.nameAr}
            onChange={(e) => setConditionForm({ ...conditionForm, nameAr: e.target.value })}
            placeholder={isAr ? 'مثال: السكري من النوع الثاني' : 'Type 2 Diabetes'}
            required
          />
          <Input
            label={isAr ? 'اسم الحالة بالإنجليزية (اختياري)' : 'Condition Name (English)'}
            value={conditionForm.nameEn}
            onChange={(e) => setConditionForm({ ...conditionForm, nameEn: e.target.value })}
            placeholder="e.g. Type 2 Diabetes Mellitus"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={isAr ? 'حالة المرض' : 'Status'}
              value={conditionForm.status}
              onChange={(e) => setConditionForm({ ...conditionForm, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: isAr ? 'نشط (Active)' : 'Active' },
                { value: 'MANAGED', label: isAr ? 'تحت السيطرة (Managed)' : 'Managed' },
                { value: 'REMISSION', label: isAr ? 'خامل (Remission)' : 'Remission' },
              ]}
            />
            <Input
              label={isAr ? 'سنة التشخيص' : 'Diagnosed Year'}
              type="number"
              value={conditionForm.diagnosedYear}
              onChange={(e) => setConditionForm({ ...conditionForm, diagnosedYear: Number(e.target.value) })}
              required
            />
          </div>
          <Input
            label={isAr ? 'ملاحظات الطبيب والمتابعة' : 'Clinical Notes'}
            value={conditionForm.notes}
            onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
            placeholder={isAr ? 'تعليمات المتابعة أو التحاليل الدورية...' : 'Follow-up instructions...'}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddConditionOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {isAr ? 'إضافة الحالة' : 'Add Condition'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: Add Allergy                                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddAllergyOpen}
        onClose={() => setIsAddAllergyOpen(false)}
        title={isAr ? 'توثيق حساسية جديدة' : 'Add Allergy Record'}
        size="md"
      >
        <form onSubmit={handleAddAllergy} className="space-y-3.5">
          <Input
            label={isAr ? 'مسبب الحساسية بالعربية' : 'Allergen Name (Arabic)'}
            value={allergyForm.allergenAr}
            onChange={(e) => setAllergyForm({ ...allergyForm, allergenAr: e.target.value })}
            placeholder={isAr ? 'مثال: البنسلين ومشتقاته' : 'Penicillin'}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={isAr ? 'نوع الحساسية' : 'Type'}
              value={allergyForm.type}
              onChange={(e) => setAllergyForm({ ...allergyForm, type: e.target.value as any })}
              options={[
                { value: 'DRUG', label: isAr ? 'دوائية (Drug)' : 'Drug' },
                { value: 'FOOD', label: isAr ? 'غذائية (Food)' : 'Food' },
                { value: 'ENVIRONMENTAL', label: isAr ? 'بيئية (Environmental)' : 'Environmental' },
                { value: 'OTHER', label: isAr ? 'أخرى (Other)' : 'Other' },
              ]}
            />
            <Select
              label={isAr ? 'درجة الخطورة' : 'Severity'}
              value={allergyForm.severity}
              onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value as any })}
              options={[
                { value: 'SEVERE', label: isAr ? 'شديدة (Severe - Anaphylaxis)' : 'Severe' },
                { value: 'MODERATE', label: isAr ? 'متوسطة (Moderate)' : 'Moderate' },
                { value: 'MILD', label: isAr ? 'خفيفة (Mild)' : 'Mild' },
              ]}
            />
          </div>
          <Input
            label={isAr ? 'رد الفعل السريري والأعراض الناتجة' : 'Clinical Reaction'}
            value={allergyForm.reactionAr}
            onChange={(e) => setAllergyForm({ ...allergyForm, reactionAr: e.target.value })}
            placeholder={isAr ? 'مثال: طفح جلدي، ضيق تنفس، انتفاخ الشفاه' : 'Rash, swelling, dyspnea'}
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddAllergyOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {isAr ? 'توثيق الحساسية' : 'Save Allergy'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: Add Medication                                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddMedicationOpen}
        onClose={() => setIsAddMedicationOpen(false)}
        title={isAr ? 'إضافة دواء جديد' : 'Add Medication'}
        size="md"
      >
        <form onSubmit={handleAddMedication} className="space-y-3.5">
          <Input
            label={isAr ? 'اسم الدواء (التجاري أو العلمي)' : 'Medication Name'}
            value={medicationForm.nameAr}
            onChange={(e) => setMedicationForm({ ...medicationForm, nameAr: e.target.value })}
            placeholder={isAr ? 'مثال: أملوديبين (Amlodipine)' : 'Amlodipine'}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isAr ? 'الجرعة' : 'Dosage'}
              value={medicationForm.dosage}
              onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
              placeholder="e.g. 5 mg / 500 mg"
              required
            />
            <Input
              label={isAr ? 'التكرار ومواعيد التناول' : 'Frequency'}
              value={medicationForm.frequency}
              onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
              placeholder={isAr ? 'مرة واحدة صباحاً' : 'Once daily in morning'}
              required
            />
          </div>
          <Input
            label={isAr ? 'دواعي الاستعمال' : 'Indication'}
            value={medicationForm.indication}
            onChange={(e) => setMedicationForm({ ...medicationForm, indication: e.target.value })}
            placeholder={isAr ? 'مثال: خفض ضغط الدم الشرياني' : 'Blood pressure regulation'}
          />
          <Input
            label={isAr ? 'اسم الطبيب أو المركز الواصف' : 'Prescriber'}
            value={medicationForm.prescriber}
            onChange={(e) => setMedicationForm({ ...medicationForm, prescriber: e.target.value })}
            placeholder={isAr ? 'د. محمد العلي' : 'Dr. Al-Ali'}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddMedicationOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {isAr ? 'حفظ الدواء' : 'Save Medication'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: Add Surgery                                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddSurgeryOpen}
        onClose={() => setIsAddSurgeryOpen(false)}
        title={isAr ? 'توثيق عملية جراحية سابقة' : 'Record Surgical Procedure'}
        size="md"
      >
        <form onSubmit={handleAddSurgery} className="space-y-3.5">
          <Input
            label={isAr ? 'اسم العملية الجراحية' : 'Surgery Name'}
            value={surgeryForm.surgeryNameAr}
            onChange={(e) => setSurgeryForm({ ...surgeryForm, surgeryNameAr: e.target.value })}
            placeholder={isAr ? 'مثال: استئصال المرارة بالمنظار' : 'Laparoscopic Cholecystectomy'}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isAr ? 'سنة إجراء العملية' : 'Year'}
              type="number"
              value={surgeryForm.year}
              onChange={(e) => setSurgeryForm({ ...surgeryForm, year: Number(e.target.value) })}
              required
            />
            <Input
              label={isAr ? 'اسم المستشفى أو المركز' : 'Hospital / Center'}
              value={surgeryForm.hospital}
              onChange={(e) => setSurgeryForm({ ...surgeryForm, hospital: e.target.value })}
              placeholder={isAr ? 'مستشفى الملك فيصل' : 'King Faisal Hospital'}
            />
          </div>
          <Input
            label={isAr ? 'ملاحظات ونتائج التعافي' : 'Notes & Recovery'}
            value={surgeryForm.notes}
            onChange={(e) => setSurgeryForm({ ...surgeryForm, notes: e.target.value })}
            placeholder={isAr ? 'تمت بنجاح بدون مضاعفات' : 'Recovered without complications'}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddSurgeryOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {isAr ? 'حفظ العملية' : 'Save Surgery'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
