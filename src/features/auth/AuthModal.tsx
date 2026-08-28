import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  Stethoscope,
  ShieldAlert,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Modal, Button, Input, Select, Badge, Alert } from '../../components/ui/index.js';
import { UserRole } from '../../types/index.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup' | 'demo';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const { language } = useLanguage();
  const { signIn, signUp, quickLogin } = useAuth();
  const isAr = language === 'ar';

  const [tab, setTab] = useState<'signin' | 'signup' | 'demo'>(initialMode);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState('user@omnidoctor.ai');
  const [signInPassword, setSignInPassword] = useState('password123');

  // Sign Up Form
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpAge, setSignUpAge] = useState('35');
  const [signUpGender, setSignUpGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [signUpRole, setSignUpRole] = useState<UserRole>('USER');
  const [specialty, setSpecialty] = useState('طب الأسرة (Family Medicine)');
  const [licenseNumber, setLicenseNumber] = useState('SCFHS-872194');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const result = await signIn(signInEmail, signInPassword);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(result.messageAr || (isAr ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully'));
      setTimeout(() => {
        setSuccessMsg(null);
        onSuccess?.();
        onClose();
      }, 700);
    } else {
      setErrorMsg(result.messageAr || result.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const result = await signUp({
      email: signUpEmail,
      password: signUpPassword,
      fullName: signUpFullName,
      role: signUpRole,
      age: Number(signUpAge) || 30,
      gender: signUpGender,
      specialty: signUpRole === 'HEALTHCARE_PROFESSIONAL' ? specialty : undefined,
      licenseNumber: signUpRole === 'HEALTHCARE_PROFESSIONAL' ? licenseNumber : undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(isAr ? 'تم إنشاء الحساب الطبي وتفعيله بنجاح' : 'Account created & profile activated');
      setTimeout(() => {
        setSuccessMsg(null);
        onSuccess?.();
        onClose();
      }, 700);
    } else {
      setErrorMsg(result.messageAr || result.error || (isAr ? 'فشل إنشاء الحساب' : 'Registration failed'));
    }
  };

  const handleQuickDemoLogin = async (role: string) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await quickLogin(role);
    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg(isAr ? 'تم تفعيل الحساب التجريبي بنجاح' : 'Demo account activated');
      setTimeout(() => {
        setSuccessMsg(null);
        onSuccess?.();
        onClose();
      }, 600);
    } else {
      setErrorMsg(isAr ? 'تعذر التبديل للحساب التجريبي' : 'Failed to switch demo account');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {tab === 'signin'
                ? isAr
                  ? 'تسجيل الدخول للمنصة الطبية'
                  : 'Sign In to OmniDoctor'
                : tab === 'signup'
                ? isAr
                  ? 'إنشاء حساب طبي جديد'
                  : 'Create Health Account'
                : isAr
                ? 'الحسابات السريرية والتجريبية (RBAC)'
                : 'Demo Roles & Access Tiers'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'إدارة الهوية وحماية السجلات الطبية وفق معايير الأمان والخصوصية'
                : 'Identity management & strictly isolated clinical health records'}
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              tab === 'signin'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              tab === 'signup'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'إنشاء حساب جديد' : 'New Account'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('demo');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'demo'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-cyan-400 hover:text-cyan-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'أدوار تجريبية' : 'Demo Roles'}</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <Alert variant="danger" title={isAr ? 'خطأ في المصادقة' : 'Authentication Error'}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert variant="success" title={isAr ? 'اكتمل الإجراء بنجاح' : 'Success'}>
            {successMsg}
          </Alert>
        )}

        {/* TAB 1: SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <Input
              label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
              type="email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              placeholder="user@omnidoctor.ai"
              leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
              required
            />
            <Input
              label={isAr ? 'كلمة المرور' : 'Password'}
              type="password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              required
            />

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0" />
                <span>{isAr ? 'تذكر جلستي' : 'Remember my session'}</span>
              </label>
              <button
                type="button"
                onClick={() => setTab('demo')}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                {isAr ? 'تجربة الحسابات الجاهزة؟' : 'Use a demo account?'}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <Input
              label={isAr ? 'الاسم الكامل' : 'Full Name'}
              value={signUpFullName}
              onChange={(e) => setSignUpFullName(e.target.value)}
              placeholder={isAr ? 'عبدالله محمد السالم' : 'John Doe'}
              leftIcon={<User className="w-4 h-4 text-slate-500" />}
              required
            />

            <Input
              label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
              type="email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
              required
            />

            <Input
              label={isAr ? 'كلمة المرور (6 أحرف على الأقل)' : 'Password (min 6 chars)'}
              type="password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={isAr ? 'العمر' : 'Age'}
                type="number"
                value={signUpAge}
                onChange={(e) => setSignUpAge(e.target.value)}
                required
              />
              <Select
                label={isAr ? 'الجنس' : 'Gender'}
                value={signUpGender}
                onChange={(e) => setSignUpGender(e.target.value as any)}
                options={[
                  { value: 'MALE', label: isAr ? 'ذكر' : 'Male' },
                  { value: 'FEMALE', label: isAr ? 'أنثى' : 'Female' },
                  { value: 'OTHER', label: isAr ? 'آخر' : 'Other' },
                ]}
              />
            </div>

            <Select
              label={isAr ? 'نوع الحساب / الدور (Role)' : 'Account Role'}
              value={signUpRole}
              onChange={(e) => setSignUpRole(e.target.value as UserRole)}
              options={[
                { value: 'USER', label: isAr ? 'مريض / مستخدم عادي (User)' : 'Patient / Standard User' },
                {
                  value: 'HEALTHCARE_PROFESSIONAL',
                  label: isAr ? 'ممارس صحي / طبيب (Healthcare Professional)' : 'Healthcare Professional / Doctor',
                },
              ]}
            />

            {signUpRole === 'HEALTHCARE_PROFESSIONAL' && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-2.5">
                <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" />
                  <span>{isAr ? 'بيانات الاعتماد المهني السريري' : 'Clinical License Credentials'}</span>
                </div>
                <Input
                  label={isAr ? 'التخصص الطبي' : 'Medical Specialty'}
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Family Medicine"
                  required
                />
                <Input
                  label={isAr ? 'رقم ترخيص الهيئة الطبية' : 'License / Registration ID'}
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="SCFHS-123456"
                  required
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                {isAr ? 'إنشاء وتفعيل الحساب' : 'Register Account'}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 3: DEMO ROLES QUICK ACCESS */}
        {tab === 'demo' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              {isAr
                ? 'اختر دوراً سريرياً أو إدارياً للدخول الفوري وتجربة مصفوفة الصلاحيات (RBAC) وعزل البيانات الطبية:'
                : 'Select an account to instantly test Role-Based Access Control (RBAC) and clinical data isolation:'}
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {/* 1. Patient User */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('USER')}
                disabled={isSubmitting}
                className="w-full text-start p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-700/60 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {isAr ? 'عبدالله محمد السالم' : 'Abdullah Al-Salem'}
                    </span>
                    <Badge variant="success" size="sm">
                      {isAr ? 'مريض (User)' : 'Patient User'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'ملف صحي متكامل: ضغط دم وسكري، دواء أملوديبين وميتفورمين، حساسية بنسلين شديدة، وعملية زائدة.'
                      : 'Complete health profile: Hypertension, Amlodipine & Metformin, severe penicillin allergy.'}
                  </p>
                </div>
              </button>

              {/* 2. Healthcare Professional */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('HEALTHCARE_PROFESSIONAL')}
                disabled={isSubmitting}
                className="w-full text-start p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-700/60 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {isAr ? 'د. سارة خالد الشمري' : 'Dr. Sarah Al-Shammari'}
                    </span>
                    <Badge variant="info" size="sm">
                      {isAr ? 'طبيب (Healthcare Pro)' : 'Doctor'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'استشاري طب أسرة مرخص (SCFHS-984210)، صلاحية تدقيق الفرز السريري واستعراض سجلات الحالات.'
                      : 'Licensed Family Medicine Consultant with clinical review and encounter audit privileges.'}
                  </p>
                </div>
              </button>

              {/* 3. Administrator */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMINISTRATOR')}
                disabled={isSubmitting}
                className="w-full text-start p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-700/60 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {isAr ? 'م. فيصل العتيبي' : 'Eng. Faisal Al-Otaibi'}
                    </span>
                    <Badge variant="warning" size="sm">
                      {isAr ? 'مدير نظام (Admin)' : 'Administrator'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'إدارة حسابات المستخدمين ومتابعة حوكمة النظام وسجلات الامتثال للأمان الطبي.'
                      : 'User directory administration, compliance logging, and system role control.'}
                  </p>
                </div>
              </button>

              {/* 4. Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('SUPER_ADMIN')}
                disabled={isSubmitting}
                className="w-full text-start p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-700/60 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 group-hover:scale-105 transition-transform">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {isAr ? 'م. ريان القحطاني' : 'Rayyan Al-Qahtani'}
                    </span>
                    <Badge variant="primary" size="sm">
                      {isAr ? 'المدير الأعلى (Super Admin)' : 'Super Admin'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'أعلى مستوى صلاحيات: حوكمة النواة السريرية، ترقية وتخفيض أدوار المشرفين والأطباء.'
                      : 'Unrestricted clinical governance: Role escalation, system architecture configuration.'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Security & HIPAA / MOH compliance footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تشفير عالي الأمان وعزل فردي للبيانات' : 'Zero-Trust Clinical Data Isolation'}</span>
          </div>
          <span>PBKDF2-SHA512 + Session Auth</span>
        </div>
      </div>
    </Modal>
  );
};
