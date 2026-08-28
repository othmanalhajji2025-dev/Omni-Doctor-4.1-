import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Pill,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Stethoscope,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  RefreshCw,
  Crown,
  ShieldAlert,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, LoadingState, Alert } from '../../components/ui/index.js';
import { UserDashboardData, NavigationTab } from '../../types/index.js';

interface UserDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenAuth: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate, onOpenAuth }) => {
  const { language } = useLanguage();
  const { user, role, isAuthenticated, fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/health/dashboard');
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Error loading dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [isAuthenticated, user?.id]);

  // Guest view if not signed in
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 animate-fadeIn">
        <Card className="p-8 text-center space-y-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-100">
              {isAr ? 'لوحة التحكم الصحية وسجلات المريض' : 'Clinical Health Dashboard'}
            </h2>
            <p className="text-sm text-slate-400">
              {isAr
                ? 'قم بتسجيل الدخول للاطلاع على آخر استشاراتك الطبية، الأعراض النشطة، الأدوية، وتفاصيل ملفك الصحي المحمي.'
                : 'Sign in to access your personal clinical encounters, active symptoms, medications, and protected medical profile.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="md" onClick={onOpenAuth} className="px-6">
              {isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('triage')}
              className="px-6"
            >
              {isAr ? 'فحص الأعراض كزائر' : 'Symptom Triage as Guest'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <LoadingState
          text={isAr ? 'جارِ تحميل لوحة التحكم وسجلات المريض...' : 'Loading patient records and clinical dashboard...'}
          size="lg"
        />
      </div>
    );
  }

  const roleLabel = {
    USER: isAr ? 'مستخدم / مريض' : 'Patient User',
    HEALTHCARE_PROFESSIONAL: isAr ? 'طبيب ممارس صحي' : 'Healthcare Professional',
    ADMINISTRATOR: isAr ? 'مدير النظام' : 'Administrator',
    SUPER_ADMIN: isAr ? 'المدير الأعلى' : 'Super Admin',
    GUEST: isAr ? 'زائر' : 'Guest',
  }[role];

  const roleVariant: 'success' | 'info' | 'warning' | 'primary' | 'neutral' = {
    USER: 'success',
    HEALTHCARE_PROFESSIONAL: 'info',
    ADMINISTRATOR: 'warning',
    SUPER_ADMIN: 'primary',
    GUEST: 'neutral',
  }[role] as any;

  const consultation = dashboardData?.recentConsultation;
  const symptoms = dashboardData?.activeSymptoms;
  const medications = dashboardData?.currentMedications;
  const allergies = dashboardData?.allergies;
  const profile = dashboardData?.healthProfile;

  // BMI Category Helper
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: isAr ? 'نقص وزن' : 'Underweight', color: 'text-amber-400' };
    if (bmi < 25) return { label: isAr ? 'وزن طبيعي ومثالي' : 'Normal weight', color: 'text-emerald-400' };
    if (bmi < 30) return { label: isAr ? 'زيادة وزن معتدلة' : 'Overweight', color: 'text-amber-400' };
    return { label: isAr ? 'سمنة' : 'Obesity', color: 'text-rose-400' };
  };

  const bmiCat = profile ? getBmiCategory(profile.bmi) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* 1. Welcoming Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800/80 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant={roleVariant} size="sm">
                {role === 'SUPER_ADMIN' && <Crown className="w-3.5 h-3.5 inline mr-1" />}
                {role === 'ADMINISTRATOR' && <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />}
                {role === 'HEALTHCARE_PROFESSIONAL' && <Stethoscope className="w-3.5 h-3.5 inline mr-1" />}
                {roleLabel}
              </Badge>
              {user.specialty && (
                <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50">
                  {user.specialty}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'عزل بيانات موثق' : 'Isolated Data Vault'}
              </span>
            </div>

            {/* MANDATED GREETING TEXT */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              {isAr ? `مرحبًا ${user.fullName} اتمنى لك دوام الصحة والعافية` : `Welcome ${user.fullName}, wishing you enduring health and wellness`}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {isAr
                ? 'ملفك الطبي نشط، ويتم فحص ومطابقة جميع الأعراض والأدوية بدقة وفق الأدلة السريرية والإرشادات الطبية المعتمدة.'
                : 'Your medical records are active. Symptom tracking and drug safety checks are monitored against clinical evidence guidelines.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              {isAr ? 'تحديث' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('health')}
              leftIcon={<Heart className="w-4 h-4" />}
            >
              {isAr ? 'صفحة صحتي' : 'My Health'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title={isAr ? 'خطأ في جلب البيانات' : 'Data Load Error'}>
          {error}
        </Alert>
      )}

      {/* 2. The 5 Core Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* CARD 1: آخر استشارة (Recent Consultation / Triage) */}
        <Card className="flex flex-col justify-between border-slate-800/80 hover:border-slate-700 transition-all p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/70">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-100">
                  {isAr ? 'آخر استشارة طبية' : 'Recent Consultation'}
                </h2>
              </div>
              {consultation && (
                <Badge
                  variant={
                    consultation.urgency === 'EMERGENCY'
                      ? 'danger'
                      : consultation.urgency === 'URGENT'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {consultation.urgencyLabelAr}
                </Badge>
              )}
            </div>

            {consultation ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(consultation.timestamp).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium' })}</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium">
                    "{consultation.symptoms}"
                  </p>
                </div>

                {consultation.differentials && consultation.differentials.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isAr ? 'الاحتمالات السريرية المفحوصة:' : 'Evaluated Differentials:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {consultation.differentials.slice(0, 2).map((diff, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {diff.nameAr}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <p className="text-xs">
                  {isAr ? 'لا توجد استشارات سابقة مسجلة في ملفك.' : 'No previous triage encounters recorded.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('triage')}
              className="w-full text-xs justify-center"
            >
              {isAr ? 'بدء فحص وفرز سريري جديد' : 'New Clinical Triage'}
            </Button>
          </div>
        </Card>

        {/* CARD 2: الأعراض النشطة (Active Symptoms) */}
        <Card className="flex flex-col justify-between border-slate-800/80 hover:border-slate-700 transition-all p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/70">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-100">
                  {isAr ? 'الأعراض النشطة' : 'Active Symptoms'}
                </h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {symptoms ? (isAr ? 'حالة نشطة' : 'Active') : (isAr ? 'مستقرة' : 'Stable')}
              </span>
            </div>

            {symptoms ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-semibold block text-amber-300 mb-1">
                    {isAr ? 'الأعراض الجاري متابعتها:' : 'Monitored Symptoms:'}
                  </span>
                  {symptoms.reportedSymptoms}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span>{isAr ? 'مستوى خطورة الفرز:' : 'Triage Classification:'}</span>
                  <span className="font-semibold text-slate-200">{symptoms.urgencyLabelAr}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs">
                  {isAr ? 'لا توجد أعراض حادة نشطة مسجلة حالياً.' : 'No acute symptoms reported.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('assistant')}
              className="w-full text-xs justify-center"
            >
              {isAr ? 'استشارة الذكاء الطبي المساعد' : 'Consult OmniDoctor AI'}
            </Button>
          </div>
        </Card>

        {/* CARD 3: الأدوية الحالية (Current Medications) */}
        <Card className="flex flex-col justify-between border-slate-800/80 hover:border-slate-700 transition-all p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/70">
                  <Pill className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-100">
                  {isAr ? 'الأدوية الحالية' : 'Current Medications'}
                </h2>
              </div>
              <Badge variant="neutral" size="sm">
                {medications?.count || 0} {isAr ? 'أدوية نشطة' : 'active meds'}
              </Badge>
            </div>

            {medications && medications.items.length > 0 ? (
              <div className="space-y-2">
                {medications.items.slice(0, 3).map((med) => (
                  <div
                    key={med.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-200 block truncate">{med.nameAr}</span>
                      <span className="text-[11px] text-slate-400">{med.dosage} — {med.frequency}</span>
                    </div>
                    <Badge variant="success" size="sm">
                      {isAr ? 'مستمر' : 'Active'}
                    </Badge>
                  </div>
                ))}
                {medications.items.length > 3 && (
                  <p className="text-[11px] text-center text-slate-500">
                    +{medications.items.length - 3} {isAr ? 'أدوية أخرى مسجلة' : 'more medications'}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <p className="text-xs">
                  {isAr ? 'لا توجد أدوية مسجلة في ملفك الصحي.' : 'No current medications recorded.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('drugs')}
              className="flex-1 text-xs justify-center"
            >
              {isAr ? 'فحص التعارضات' : 'Safety Check'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('health')}
              className="text-xs"
            >
              {isAr ? 'إدارة' : 'Manage'}
            </Button>
          </div>
        </Card>

        {/* CARD 4: الحساسية (Allergies) */}
        <Card className="flex flex-col justify-between border-slate-800/80 hover:border-slate-700 transition-all p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/70">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-100">
                  {isAr ? 'الحساسية والمحاذير' : 'Allergies & Contraindications'}
                </h2>
              </div>
              {allergies?.hasSevere && (
                <Badge variant="danger" size="sm">
                  {isAr ? 'حساسية شديدة خطرة' : 'Severe Alert'}
                </Badge>
              )}
            </div>

            {allergies && allergies.items.length > 0 ? (
              <div className="space-y-2.5">
                {allergies.items.map((alg) => (
                  <div
                    key={alg.id}
                    className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      alg.severity === 'SEVERE'
                        ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{alg.allergenAr}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          alg.severity === 'SEVERE'
                            ? 'bg-rose-900 text-rose-200'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {alg.severity === 'SEVERE'
                          ? isAr ? 'شديدة (High Risk)' : 'Severe'
                          : isAr ? 'معتدلة' : 'Moderate'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{alg.reactionAr}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <p className="text-xs">
                  {isAr ? 'لم يتم توثيق أي حساسيات دوائية أو غذائية.' : 'No recorded allergies.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('health')}
              className="w-full text-xs justify-center"
            >
              {isAr ? 'تعديل قائمة الحساسية' : 'Manage Allergies'}
            </Button>
          </div>
        </Card>

        {/* CARD 5: الملف الصحي (Health Profile & Vitals) */}
        <Card className="flex flex-col justify-between border-slate-800/80 hover:border-slate-700 transition-all p-5 md:col-span-2 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/70">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">
                    {isAr ? 'الملف الصحي والمؤشرات الحيوية' : 'Health Profile & Biometrics'}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? 'المعلومات الشخصية والبيانات الفسيولوجية المعتمدة' : 'Personal health baseline & biometric indexes'}
                  </span>
                </div>
              </div>
              <Badge variant="success" size="sm">
                {isAr ? 'مكتمل وموثق' : 'Verified'}
              </Badge>
            </div>

            {profile ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'العمر' : 'Age'}</span>
                  <span className="text-base font-bold text-slate-100">{profile.age} {isAr ? 'سنة' : 'yrs'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'الجنس' : 'Gender'}</span>
                  <span className="text-base font-bold text-slate-100">
                    {profile.gender === 'MALE' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'الطول / الوزن' : 'Height / Weight'}</span>
                  <span className="text-sm font-bold text-slate-100">
                    {profile.heightCm} cm / {profile.weightKg} kg
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'مؤشر كتلة الجسم (BMI)' : 'BMI Index'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-slate-100">{profile.bmi}</span>
                    {bmiCat && <span className={`text-[10px] font-semibold ${bmiCat.color}`}>({bmiCat.label})</span>}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'فصيلة الدم' : 'Blood Type'}</span>
                  <span className="text-base font-bold text-emerald-400">{profile.bloodType || 'O+'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'العرق / الخلفية' : 'Ethnicity'}</span>
                  <span className="text-xs font-semibold text-slate-200 truncate block">{profile.ethnicity}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'الحالات المزمنة' : 'Conditions'}</span>
                  <span className="text-base font-bold text-slate-100">{profile.conditionsCount}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'العمليات السابقة' : 'Surgeries'}</span>
                  <span className="text-base font-bold text-slate-100">{profile.surgeriesCount}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {isAr ? 'تعديل البيانات الشخصية والتاريخ الطبي الكامل' : 'Update personal details and surgical history'}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('health')}
              rightIcon={isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            >
              {isAr ? 'فتح صفحة صحتي' : 'Open My Health'}
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. Quick Action Medical Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('triage')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-700/60 transition-all text-start cursor-pointer group"
        >
          <Activity className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-bold text-slate-200">
            {isAr ? 'فحص وفرز الأعراض' : 'Symptom Triage'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'فرز سريري متعدد المراحل' : 'Multi-stage red flag assessment'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('drugs')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-purple-700/60 transition-all text-start cursor-pointer group"
        >
          <Pill className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-bold text-slate-200">
            {isAr ? 'فاحص تعارض الأدوية' : 'Drug Interactions'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'التحقق التلقائي مع أدويتك' : 'Cross-check current meds'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('labs')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-700/60 transition-all text-start cursor-pointer group"
        >
          <FileText className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-bold text-slate-200">
            {isAr ? 'مفسر التحاليل الطبية' : 'Lab Biomarkers'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'تفسير نتائج الدم والهيموجلوبين' : 'Interpret CBC, HbA1c & lipids'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('health')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-700/60 transition-all text-start cursor-pointer group"
        >
          <Heart className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-bold text-slate-200">
            {isAr ? 'إدارة السجل والجراحة' : 'Health & Surgeries'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'تحديث العمليات والحالات' : 'Full history & conditions'}
          </p>
        </button>
      </div>

      {/* 4. RBAC Doctor & Admin Notice Panel (if logged in with elevated role) */}
      {(role === 'HEALTHCARE_PROFESSIONAL' || role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN') && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-900/60 text-cyan-300 border border-cyan-700/60">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                {isAr ? 'وضع الامتياز السريري والإداري المتقدم (RBAC Mode Active)' : 'Advanced RBAC Privilege Mode Active'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? `أنت متصل بصلاحيات: ${roleLabel}. يمكنك مراجعة الأدلة السريرية أو حوكمة النظام والأدوار.`
                  : `Signed in with role: ${roleLabel}. Clinical audit and role governance permissions active.`}
              </p>
            </div>
          </div>
          {(role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('admin')}
              className="text-xs border-cyan-800/80 text-cyan-300 hover:bg-cyan-950/60"
            >
              {isAr ? 'إدارة المستخدمين والصلاحيات' : 'Manage User Roles (RBAC)'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
