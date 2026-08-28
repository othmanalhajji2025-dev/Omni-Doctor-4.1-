import { Router, Response } from 'express';
import { userDataStore } from '../db/userDataStore.js';
import { SignUpSchema, SignInSchema, UserRole } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../auth/middleware.js';

export const authRouter = Router();

function sanitizeUser(user: any) {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// Sign Up
authRouter.post('/signup', async (req, res) => {
  try {
    const parseResult = SignUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
        messageAr: 'يرجى التأكد من صحة البيانات المدخلة وكلمة المرور (6 خانات كحد أدنى)',
      });
    }

    const { email, password, fullName, fullNameEn, role, specialty, licenseNumber, age, gender } = parseResult.data;

    const { user, profile } = userDataStore.createUser({
      email,
      password,
      fullName,
      fullNameEn,
      role: (role as UserRole) || 'USER',
      specialty,
      licenseNumber,
      age,
      gender,
    });

    const session = userDataStore.createSession(user.id);

    res.status(201).json({
      message: 'Account successfully registered',
      messageAr: 'تم إنشاء الحساب الطبي وتفعيله بنجاح',
      user: sanitizeUser(user),
      profile,
      token: session.token,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/signup:', error);
    res.status(400).json({
      error: error.message || 'Registration failed',
      messageAr: error.message === 'Email is already registered'
        ? 'البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول'
        : 'فشل في إنشاء الحساب، يرجى المحاولة مرة أخرى',
    });
  }
});

// Sign In
authRouter.post('/signin', async (req, res) => {
  try {
    const parseResult = SignInSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
        messageAr: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
      });
    }

    const { email, password } = parseResult.data;
    const user = userDataStore.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
    }

    const isValid = userDataStore.verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
        messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
    }

    const session = userDataStore.createSession(user.id);
    const profile = userDataStore.getProfile(user, user.id);

    res.json({
      message: 'Signed in successfully',
      messageAr: `مرحبًا ${user.fullName}، اتمنى لك دوام الصحة والعافية`,
      user: sanitizeUser(user),
      profile,
      token: session.token,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/signin:', error);
    res.status(500).json({ error: 'Internal sign in error' });
  }
});

// Sign Out
authRouter.post('/signout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-session-token'] as string);

  if (token) {
    userDataStore.deleteSession(token);
  }
  res.json({
    message: 'Signed out successfully',
    messageAr: 'تم تسجيل الخروج بنجاح وحماية الجلسة',
  });
});

// Get Current User
authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const profile = userDataStore.getProfile(req.user, req.user.id);
  res.json({
    user: sanitizeUser(req.user),
    profile,
  });
});

// Demo Accounts Information (for review & quick access)
authRouter.get('/demo-accounts', (req, res) => {
  res.json([
    {
      role: 'USER',
      roleAr: 'مريض / مستخدم',
      email: 'user@omnidoctor.ai',
      password: 'password123',
      nameAr: 'عبدالله محمد السالم',
      nameEn: 'Abdullah M. Al-Salem',
      descriptionAr: 'حساب مريض يحتوي على أمراض مزمنة، أدوية حالية، وسجل حساسيات وعمليات سابقة',
      descriptionEn: 'Patient with chronic conditions, medications, allergies, and surgical history',
    },
    {
      role: 'HEALTHCARE_PROFESSIONAL',
      roleAr: 'طبيب ممارس صحي',
      email: 'doctor@omnidoctor.ai',
      password: 'doctor123',
      nameAr: 'د. سارة خالد الشمري',
      nameEn: 'Dr. Sarah K. Al-Shammari',
      specialty: 'استشاري طب الأسرة',
      licenseNumber: 'SCFHS-984210',
      descriptionAr: 'صلاحيات ممارس صحي مرخص لمراجعة السجلات السريرية واستعراض الفرز',
      descriptionEn: 'Licensed practitioner privileges to review clinical encounter files',
    },
    {
      role: 'ADMINISTRATOR',
      roleAr: 'مدير النظام',
      email: 'admin@omnidoctor.ai',
      password: 'admin123',
      nameAr: 'م. فيصل العتيبي',
      nameEn: 'Eng. Faisal Al-Otaibi',
      descriptionAr: 'صلاحيات إدارة المستخدمين والاطلاع على الامتثال الأمني',
      descriptionEn: 'Administrative control to manage users and security audit logs',
    },
    {
      role: 'SUPER_ADMIN',
      roleAr: 'المدير الأعلى للمنصة',
      email: 'superadmin@omnidoctor.ai',
      password: 'superadmin123',
      nameAr: 'م. ريان القحطاني',
      nameEn: 'Rayyan Al-Qahtani',
      descriptionAr: 'صلاحيات الحوكمة الكاملة وتعيين الأدوار والتحكم في النواة السريرية',
      descriptionEn: 'Full governance, role modification, and system core administration',
    },
  ]);
});

// Quick Login for Instant Role Switching in Testing
authRouter.post('/quick-login', (req, res) => {
  const { role, email } = req.body;
  let targetUser = email
    ? userDataStore.getUserByEmail(email)
    : userDataStore.getUserByEmail(
        role === 'HEALTHCARE_PROFESSIONAL'
          ? 'doctor@omnidoctor.ai'
          : role === 'ADMINISTRATOR'
          ? 'admin@omnidoctor.ai'
          : role === 'SUPER_ADMIN'
          ? 'superadmin@omnidoctor.ai'
          : 'user@omnidoctor.ai'
      );

  if (!targetUser) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const session = userDataStore.createSession(targetUser.id);
  const profile = userDataStore.getProfile(targetUser, targetUser.id);

  res.json({
    message: 'Quick login successful',
    messageAr: `مرحبًا ${targetUser.fullName}، اتمنى لك دوام الصحة والعافية`,
    user: sanitizeUser(targetUser),
    profile,
    token: session.token,
  });
});
