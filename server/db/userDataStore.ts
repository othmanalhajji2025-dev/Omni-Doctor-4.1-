import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  UserRecord,
  ProfileRecord,
  MedicalConditionRecord,
  AllergyRecord,
  MedicationRecord,
  SurgeryRecord,
  ConsultationRecord,
  SessionRecord,
  UserRole,
} from './schema.js';

interface DatabaseData {
  users: UserRecord[];
  profiles: ProfileRecord[];
  conditions: MedicalConditionRecord[];
  allergies: AllergyRecord[];
  medications: MedicationRecord[];
  surgeries: SurgeryRecord[];
  consultations: ConsultationRecord[];
  sessions: SessionRecord[];
}

export class UserDatabaseStore {
  private dataDir = path.join(process.cwd(), 'server', 'db', 'data');
  private dbFile = path.join(this.dataDir, 'database.json');
  private data: DatabaseData = {
    users: [],
    profiles: [],
    conditions: [],
    allergies: [],
    medications: [],
    surgeries: [],
    consultations: [],
    sessions: [],
  };

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFile)) {
        const fileContent = fs.readFileSync(this.dbFile, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.seedInitialData();
        this.saveToFile();
      }
    } catch (err) {
      console.warn('[DB] Warning loading database file, initializing seeds in memory:', err);
      this.seedInitialData();
    }
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save database file:', err);
    }
  }

  // Secure Password Hashing with PBKDF2
  public hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: generatedSalt };
  }

  public verifyPassword(password: string, salt: string, expectedHash: string): boolean {
    const { hash } = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  }

  private seedInitialData() {
    const now = new Date().toISOString();

    // 1. Standard Patient User
    const userSalt = crypto.randomBytes(16).toString('hex');
    const userPassHash = this.hashPassword('password123', userSalt).hash;
    const standardUser: UserRecord = {
      id: 'usr_pat_001',
      email: 'user@omnidoctor.ai',
      passwordHash: userPassHash,
      salt: userSalt,
      role: 'USER',
      fullName: 'عبدالله محمد السالم',
      fullNameEn: 'Abdullah M. Al-Salem',
      nationalId: '1092837461',
      phoneNumber: '+966 50 123 4567',
      createdAt: '2025-01-10T08:00:00.000Z',
      updatedAt: now,
    };

    // 2. Healthcare Professional (Doctor)
    const docSalt = crypto.randomBytes(16).toString('hex');
    const docPassHash = this.hashPassword('doctor123', docSalt).hash;
    const doctorUser: UserRecord = {
      id: 'usr_doc_002',
      email: 'doctor@omnidoctor.ai',
      passwordHash: docPassHash,
      salt: docSalt,
      role: 'HEALTHCARE_PROFESSIONAL',
      fullName: 'د. سارة خالد الشمري',
      fullNameEn: 'Dr. Sarah K. Al-Shammari',
      specialty: 'طب الأسرة والرعاية التلطيفية',
      licenseNumber: 'SCFHS-984210',
      phoneNumber: '+966 55 987 6543',
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: now,
    };

    // 3. Administrator
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminPassHash = this.hashPassword('admin123', adminSalt).hash;
    const adminUser: UserRecord = {
      id: 'usr_adm_003',
      email: 'admin@omnidoctor.ai',
      passwordHash: adminPassHash,
      salt: adminSalt,
      role: 'ADMINISTRATOR',
      fullName: 'م. فيصل العتيبي',
      fullNameEn: 'Eng. Faisal Al-Otaibi',
      phoneNumber: '+966 54 321 0987',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: now,
    };

    // 4. Super Admin
    const superSalt = crypto.randomBytes(16).toString('hex');
    const superPassHash = this.hashPassword('superadmin123', superSalt).hash;
    const superAdminUser: UserRecord = {
      id: 'usr_sup_004',
      email: 'superadmin@omnidoctor.ai',
      passwordHash: superPassHash,
      salt: superSalt,
      role: 'SUPER_ADMIN',
      fullName: 'م. ريان القحطاني',
      fullNameEn: 'Rayyan Al-Qahtani',
      phoneNumber: '+966 56 111 2233',
      createdAt: '2024-12-01T00:00:00.000Z',
      updatedAt: now,
    };

    this.data.users = [standardUser, doctorUser, adminUser, superAdminUser];

    // Seed Profile for Standard User
    const standardProfile: ProfileRecord = {
      id: 'prof_001',
      userId: standardUser.id,
      age: 44,
      gender: 'MALE',
      heightCm: 176,
      weightKg: 82,
      ethnicity: 'عربي (Middle Eastern)',
      bloodType: 'O+',
      emergencyContact: {
        name: 'فاطمة السالم (الزوجة)',
        relation: 'Spouse',
        phone: '+966 50 765 4321',
      },
      createdAt: '2025-01-10T08:00:00.000Z',
      updatedAt: now,
    };

    // Profile for Doctor
    const doctorProfile: ProfileRecord = {
      id: 'prof_002',
      userId: doctorUser.id,
      age: 38,
      gender: 'FEMALE',
      heightCm: 165,
      weightKg: 63,
      ethnicity: 'عربي (Middle Eastern)',
      bloodType: 'A+',
      emergencyContact: {
        name: 'خالد الشمري (الأخ)',
        relation: 'Brother',
        phone: '+966 55 222 3344',
      },
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: now,
    };

    this.data.profiles = [standardProfile, doctorProfile];

    // Seed Conditions for Standard User
    this.data.conditions = [
      {
        id: 'cond_001',
        userId: standardUser.id,
        nameAr: 'ارتفاع ضغط الدم الأساسي (المرحلة 1)',
        nameEn: 'Essential Hypertension (Stage 1)',
        status: 'MANAGED',
        diagnosedYear: 2021,
        notes: 'متابع بانتظام مع طبيب الأسرة وضغط الدم مستقر مع العلاج',
        createdAt: '2025-01-10T08:05:00.000Z',
      },
      {
        id: 'cond_002',
        userId: standardUser.id,
        nameAr: 'مقدمات السكري (Prediabetes)',
        nameEn: 'Impaired Fasting Glucose',
        status: 'MANAGED',
        diagnosedYear: 2023,
        notes: 'توصية حمية قليلة الكربوهيدرات وممارسة المشي 30 دقيقة يومياً',
        createdAt: '2025-01-10T08:06:00.000Z',
      },
    ];

    // Seed Allergies for Standard User
    this.data.allergies = [
      {
        id: 'allg_001',
        userId: standardUser.id,
        allergenAr: 'البنسلين ومشتقاته (Penicillin)',
        allergenEn: 'Penicillin and Beta-lactams',
        type: 'DRUG',
        reactionAr: 'طفح جلدي شديد، وذمة وعائية، وضيق تنفسي',
        reactionEn: 'Severe urticaria, angioedema, dyspnea',
        severity: 'SEVERE',
        createdAt: '2025-01-10T08:07:00.000Z',
      },
      {
        id: 'allg_002',
        userId: standardUser.id,
        allergenAr: 'حبوب اللقاح الموسمية (Pollen)',
        allergenEn: 'Seasonal Pollen',
        type: 'ENVIRONMENTAL',
        reactionAr: 'حكة بالعين وسيلان أنف وعطاس',
        reactionEn: 'Rhinitis and eye irritation',
        severity: 'MILD',
        createdAt: '2025-01-10T08:08:00.000Z',
      },
    ];

    // Seed Medications for Standard User
    this.data.medications = [
      {
        id: 'med_001',
        userId: standardUser.id,
        nameAr: 'أملوديبين (Amlodipine)',
        nameEn: 'Amlodipine Besylate',
        dosage: '5 mg',
        frequency: 'مرة واحدة صباحاً بعد الإفطار',
        startDate: '2022-02-01',
        prescriber: 'د. خالد الزهراني',
        indication: 'تنظيم ضغط الدم الشرياني',
        status: 'ACTIVE',
        createdAt: '2025-01-10T08:09:00.000Z',
      },
      {
        id: 'med_002',
        userId: standardUser.id,
        nameAr: 'ميتفورمين (Metformin XR)',
        nameEn: 'Metformin Extended-Release',
        dosage: '500 mg',
        frequency: 'مرة واحدة مع وجبة العشاء',
        startDate: '2023-06-15',
        prescriber: 'د. سارة الشمري',
        indication: 'تحسين حساسية الإنسولين وضبط السكر التراكمي',
        status: 'ACTIVE',
        createdAt: '2025-01-10T08:10:00.000Z',
      },
    ];

    // Seed Surgeries for Standard User
    this.data.surgeries = [
      {
        id: 'surg_001',
        userId: standardUser.id,
        surgeryNameAr: 'استئصال الزائدة الدودية بالمنظار',
        surgeryNameEn: 'Laparoscopic Appendectomy',
        year: 2018,
        hospital: 'مستشفى الملك فيصل التخصصي - الرياض',
        notes: 'تمت بنجاح بدون أي مضاعفات بعد العملية',
        createdAt: '2025-01-10T08:11:00.000Z',
      },
      {
        id: 'surg_002',
        userId: standardUser.id,
        surgeryNameAr: 'إصلاح فتق إربي بالمنظار',
        surgeryNameEn: 'Inguinal Hernia Repair with Mesh',
        year: 2012,
        hospital: 'مدينة الأمير سلطان الطبية العسكرية',
        notes: 'تركيب شبكة داعمة، التعافي ممتاز',
        createdAt: '2025-01-10T08:12:00.000Z',
      },
    ];

    // Seed Consultations for Standard User
    this.data.consultations = [
      {
        id: 'cns_001',
        userId: standardUser.id,
        timestamp: '2026-08-26T14:30:00.000Z',
        symptoms: 'صداع نابض مستمر في جانب الرأس الأيمن مع غثيان خفيف وحساسية للضوء',
        urgency: 'ROUTINE',
        urgencyLabelAr: 'استشارة عيادة روتينية (أصفر)',
        urgencyLabelEn: 'Routine Clinical Evaluation',
        differentials: [
          { nameAr: 'صداع نصفي شقيقي (Migraine without aura)', nameEn: 'Migraine without aura', probability: 'HIGH' },
          { nameAr: 'صداع التوتر العضلي الشديد', nameEn: 'Severe Tension Headache', probability: 'MODERATE' },
        ],
        redFlagsCount: 0,
        summaryAr: 'الأعراض تتطابق بشكل كبير مع نوبات الصداع النصفي الشائع، يُنصح بالراحة في غرفة مظلمة ومراجعة الطبيب لتأكيد العلاج الوقائي.',
        summaryEn: 'Symptoms align with common migraine. Rest in a darkened quiet room and follow up with physician for preventative therapy.',
        status: 'COMPLETED',
      },
    ];
  }

  // --- Data Isolation Enforcement Helper ---
  public checkDataIsolation(requestingUser: UserRecord, targetUserId: string, isWrite = false): boolean {
    // 1. Owner always has full access to their own data
    if (requestingUser.id === targetUserId) {
      return true;
    }
    // 2. Super Admin has full administrative access
    if (requestingUser.role === 'SUPER_ADMIN') {
      return true;
    }
    // 3. Administrator can read/manage accounts
    if (requestingUser.role === 'ADMINISTRATOR') {
      return true;
    }
    // 4. Healthcare Professionals can view patient records (read-only clinical review)
    if (requestingUser.role === 'HEALTHCARE_PROFESSIONAL' && !isWrite) {
      return true;
    }
    return false;
  }

  // --- Users & Sessions ---
  public getUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getAllUsers(requestingUser: UserRecord): Omit<UserRecord, 'passwordHash' | 'salt'>[] {
    if (requestingUser.role !== 'ADMINISTRATOR' && requestingUser.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Unauthorized to view user database');
    }
    return this.data.users.map(({ passwordHash, salt, ...rest }) => rest);
  }

  public updateUserRole(requestingUser: UserRecord, targetUserId: string, newRole: UserRole): UserRecord {
    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ADMINISTRATOR') {
      throw new Error('Access denied: Unauthorized to modify user roles');
    }
    const target = this.getUserById(targetUserId);
    if (!target) throw new Error('User not found');
    target.role = newRole;
    target.updatedAt = new Date().toISOString();
    this.saveToFile();
    return target;
  }

  public updateUser(
    requestingUser: UserRecord,
    targetUserId: string,
    updates: Partial<Omit<UserRecord, 'id' | 'passwordHash' | 'salt' | 'createdAt'>>
  ): UserRecord {
    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ADMINISTRATOR') {
      throw new Error('Access denied: Unauthorized to edit users');
    }
    const target = this.getUserById(targetUserId);
    if (!target) throw new Error('User not found');

    if (updates.email && updates.email !== target.email) {
      const existing = this.getUserByEmail(updates.email);
      if (existing && existing.id !== targetUserId) {
        throw new Error('Email is already in use by another account');
      }
      target.email = updates.email.trim().toLowerCase();
    }
    if (updates.fullName) target.fullName = updates.fullName.trim();
    if (updates.fullNameEn !== undefined) target.fullNameEn = updates.fullNameEn.trim();
    if (updates.role && (requestingUser.role === 'SUPER_ADMIN' || updates.role !== 'SUPER_ADMIN')) {
      target.role = updates.role;
    }
    if (updates.specialty !== undefined) target.specialty = updates.specialty;
    if (updates.licenseNumber !== undefined) target.licenseNumber = updates.licenseNumber;
    if (updates.phoneNumber !== undefined) target.phoneNumber = updates.phoneNumber;
    if (updates.status !== undefined) target.status = updates.status;

    target.updatedAt = new Date().toISOString();
    this.saveToFile();
    return target;
  }

  public updateUserStatus(
    requestingUser: UserRecord,
    targetUserId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  ): UserRecord {
    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ADMINISTRATOR') {
      throw new Error('Access denied: Unauthorized to change user status');
    }
    const target = this.getUserById(targetUserId);
    if (!target) throw new Error('User not found');
    if (target.role === 'SUPER_ADMIN' && requestingUser.role !== 'SUPER_ADMIN') {
      throw new Error('Only Super Admin can change Super Admin status');
    }
    target.status = status;
    target.updatedAt = new Date().toISOString();
    this.saveToFile();
    return target;
  }

  public resetUserPassword(
    requestingUser: UserRecord,
    targetUserId: string,
    newPassword: string
  ): boolean {
    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ADMINISTRATOR') {
      throw new Error('Access denied: Unauthorized to reset password');
    }
    const target = this.getUserById(targetUserId);
    if (!target) throw new Error('User not found');
    if (target.role === 'SUPER_ADMIN' && requestingUser.role !== 'SUPER_ADMIN') {
      throw new Error('Only Super Admin can reset Super Admin password');
    }
    const { hash, salt } = this.hashPassword(newPassword);
    target.passwordHash = hash;
    target.salt = salt;
    target.updatedAt = new Date().toISOString();
    this.saveToFile();
    return true;
  }

  public deleteUser(requestingUser: UserRecord, targetUserId: string): boolean {
    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ADMINISTRATOR') {
      throw new Error('Access denied: Unauthorized to delete users');
    }
    if (requestingUser.id === targetUserId) {
      throw new Error('Cannot delete your own administrator account');
    }
    const target = this.getUserById(targetUserId);
    if (!target) return false;

    if (target.role === 'SUPER_ADMIN' && requestingUser.role !== 'SUPER_ADMIN') {
      throw new Error('Only Super Admin can delete a Super Admin account');
    }

    const initCount = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== targetUserId);
    this.data.profiles = this.data.profiles.filter(p => p.userId !== targetUserId);
    this.data.sessions = this.data.sessions.filter(s => s.userId !== targetUserId);
    this.data.conditions = this.data.conditions.filter(c => c.userId !== targetUserId);
    this.data.allergies = this.data.allergies.filter(a => a.userId !== targetUserId);
    this.data.medications = this.data.medications.filter(m => m.userId !== targetUserId);
    this.data.surgeries = this.data.surgeries.filter(s => s.userId !== targetUserId);
    this.data.consultations = this.data.consultations.filter(c => c.userId !== targetUserId);

    this.saveToFile();
    return this.data.users.length < initCount;
  }

  public createUser(params: {
    email: string;
    password: string;
    fullName: string;
    fullNameEn?: string;
    role?: UserRole;
    specialty?: string;
    licenseNumber?: string;
    age?: number;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }): { user: UserRecord; profile: ProfileRecord } {
    const existing = this.getUserByEmail(params.email);
    if (existing) {
      throw new Error('Email is already registered');
    }

    const { hash, salt } = this.hashPassword(params.password);
    const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    const newUser: UserRecord = {
      id: userId,
      email: params.email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      role: params.role || 'USER',
      fullName: params.fullName.trim(),
      fullNameEn: params.fullNameEn?.trim() || params.fullName.trim(),
      specialty: params.specialty,
      licenseNumber: params.licenseNumber,
      createdAt: now,
      updatedAt: now,
    };

    const newProfile: ProfileRecord = {
      id: 'prof_' + crypto.randomBytes(6).toString('hex'),
      userId,
      age: params.age || 30,
      gender: params.gender || 'MALE',
      heightCm: 170,
      weightKg: 70,
      ethnicity: 'عربي (Middle Eastern)',
      bloodType: 'O+',
      emergencyContact: {
        name: 'جهة اتصال طوارئ',
        relation: 'Family',
        phone: '+966 50 000 0000',
      },
      createdAt: now,
      updatedAt: now,
    };

    this.data.users.push(newUser);
    this.data.profiles.push(newProfile);
    this.saveToFile();

    return { user: newUser, profile: newProfile };
  }

  public createSession(userId: string): SessionRecord {
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const session: SessionRecord = {
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.data.sessions.push(session);
    this.saveToFile();
    return session;
  }

  public validateSession(token: string): UserRecord | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      // Expired session cleanup
      this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
      this.saveToFile();
      return null;
    }

    return this.getUserById(session.userId) || null;
  }

  public deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.saveToFile();
  }

  // --- Profile Operations (Isolated by userId) ---
  public getProfile(requestingUser: UserRecord, targetUserId: string): ProfileRecord {
    if (!this.checkDataIsolation(requestingUser, targetUserId, false)) {
      throw new Error('Access denied: Strict health data isolation violation');
    }
    let profile = this.data.profiles.find((p) => p.userId === targetUserId);
    if (!profile) {
      // Create lazy profile if missing
      profile = {
        id: 'prof_' + crypto.randomBytes(6).toString('hex'),
        userId: targetUserId,
        age: 30,
        gender: 'MALE',
        heightCm: 170,
        weightKg: 70,
        ethnicity: 'عربي (Middle Eastern)',
        bloodType: 'O+',
        emergencyContact: { name: '', relation: '', phone: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.profiles.push(profile);
      this.saveToFile();
    }
    return profile;
  }

  public updateProfile(
    requestingUser: UserRecord,
    targetUserId: string,
    updates: Partial<Omit<ProfileRecord, 'id' | 'userId' | 'createdAt'>>
  ): ProfileRecord {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot modify another user health profile');
    }
    const profile = this.getProfile(requestingUser, targetUserId);
    Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
    this.saveToFile();
    return profile;
  }

  // --- Medical Conditions Operations ---
  public getConditions(requestingUser: UserRecord, targetUserId: string): MedicalConditionRecord[] {
    if (!this.checkDataIsolation(requestingUser, targetUserId, false)) {
      throw new Error('Access denied: Cannot read external medical conditions');
    }
    return this.data.conditions.filter((c) => c.userId === targetUserId);
  }

  public addCondition(
    requestingUser: UserRecord,
    targetUserId: string,
    condition: Omit<MedicalConditionRecord, 'id' | 'userId' | 'createdAt'>
  ): MedicalConditionRecord {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot modify another user medical conditions');
    }
    const newRecord: MedicalConditionRecord = {
      id: 'cond_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUserId,
      ...condition,
      nameEn: condition.nameEn || condition.nameAr,
      createdAt: new Date().toISOString(),
    };
    this.data.conditions.push(newRecord);
    this.saveToFile();
    return newRecord;
  }

  public deleteCondition(requestingUser: UserRecord, targetUserId: string, conditionId: string): boolean {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot delete another user medical conditions');
    }
    const initialLen = this.data.conditions.length;
    this.data.conditions = this.data.conditions.filter(
      (c) => !(c.id === conditionId && c.userId === targetUserId)
    );
    this.saveToFile();
    return this.data.conditions.length < initialLen;
  }

  // --- Allergies Operations ---
  public getAllergies(requestingUser: UserRecord, targetUserId: string): AllergyRecord[] {
    if (!this.checkDataIsolation(requestingUser, targetUserId, false)) {
      throw new Error('Access denied: Cannot read external allergies data');
    }
    return this.data.allergies.filter((a) => a.userId === targetUserId);
  }

  public addAllergy(
    requestingUser: UserRecord,
    targetUserId: string,
    allergy: Omit<AllergyRecord, 'id' | 'userId' | 'createdAt'>
  ): AllergyRecord {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot modify another user allergies');
    }
    const newRecord: AllergyRecord = {
      id: 'allg_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUserId,
      ...allergy,
      allergenEn: allergy.allergenEn || allergy.allergenAr,
      reactionEn: allergy.reactionEn || allergy.reactionAr,
      createdAt: new Date().toISOString(),
    };
    this.data.allergies.push(newRecord);
    this.saveToFile();
    return newRecord;
  }

  public deleteAllergy(requestingUser: UserRecord, targetUserId: string, allergyId: string): boolean {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot delete another user allergies');
    }
    const initialLen = this.data.allergies.length;
    this.data.allergies = this.data.allergies.filter(
      (a) => !(a.id === allergyId && a.userId === targetUserId)
    );
    this.saveToFile();
    return this.data.allergies.length < initialLen;
  }

  // --- Medications Operations ---
  public getMedications(requestingUser: UserRecord, targetUserId: string): MedicationRecord[] {
    if (!this.checkDataIsolation(requestingUser, targetUserId, false)) {
      throw new Error('Access denied: Cannot read external medications');
    }
    return this.data.medications.filter((m) => m.userId === targetUserId);
  }

  public addMedication(
    requestingUser: UserRecord,
    targetUserId: string,
    med: Omit<MedicationRecord, 'id' | 'userId' | 'createdAt'>
  ): MedicationRecord {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot modify another user medications');
    }
    const newRecord: MedicationRecord = {
      id: 'med_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUserId,
      ...med,
      nameEn: med.nameEn || med.nameAr,
      startDate: med.startDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    this.data.medications.push(newRecord);
    this.saveToFile();
    return newRecord;
  }

  public deleteMedication(requestingUser: UserRecord, targetUserId: string, medId: string): boolean {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot delete another user medications');
    }
    const initialLen = this.data.medications.length;
    this.data.medications = this.data.medications.filter(
      (m) => !(m.id === medId && m.userId === targetUserId)
    );
    this.saveToFile();
    return this.data.medications.length < initialLen;
  }

  // --- Surgeries Operations ---
  public getSurgeries(requestingUser: UserRecord, targetUserId: string): SurgeryRecord[] {
    if (!this.checkDataIsolation(requestingUser, targetUserId, false)) {
      throw new Error('Access denied: Cannot read external surgeries');
    }
    return this.data.surgeries.filter((s) => s.userId === targetUserId);
  }

  public addSurgery(
    requestingUser: UserRecord,
    targetUserId: string,
    surgery: Omit<SurgeryRecord, 'id' | 'userId' | 'createdAt'>
  ): SurgeryRecord {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot modify another user surgeries');
    }
    const newRecord: SurgeryRecord = {
      id: 'surg_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUserId,
      ...surgery,
      surgeryNameEn: surgery.surgeryNameEn || surgery.surgeryNameAr,
      createdAt: new Date().toISOString(),
    };
    this.data.surgeries.push(newRecord);
    this.saveToFile();
    return newRecord;
  }

  public deleteSurgery(requestingUser: UserRecord, targetUserId: string, surgeryId: string): boolean {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot delete another user surgeries');
    }
    const initialLen = this.data.surgeries.length;
    this.data.surgeries = this.data.surgeries.filter(
      (s) => !(s.id === surgeryId && s.userId === targetUserId)
    );
    this.saveToFile();
    return this.data.surgeries.length < initialLen;
  }

  // --- Consultations / Encounters ---
  public getConsultations(requestingUser: UserRecord, targetUserId: string): ConsultationRecord[] {
    if (!this.checkDataIsolation(requestingUser, targetUserId, false)) {
      throw new Error('Access denied: Cannot read external consultations');
    }
    return this.data.consultations.filter((c) => c.userId === targetUserId);
  }

  public addConsultation(
    requestingUser: UserRecord,
    targetUserId: string,
    consultation: Omit<ConsultationRecord, 'id' | 'userId' | 'timestamp'>
  ): ConsultationRecord {
    if (!this.checkDataIsolation(requestingUser, targetUserId, true)) {
      throw new Error('Access denied: Cannot create consultation for another user');
    }
    const newRecord: ConsultationRecord = {
      id: 'cns_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUserId,
      timestamp: new Date().toISOString(),
      ...consultation,
    };
    this.data.consultations.unshift(newRecord);
    this.saveToFile();
    return newRecord;
  }

  // --- User Dashboard Aggregated Data ---
  public getDashboardData(user: UserRecord) {
    const profile = this.getProfile(user, user.id);
    const conditions = this.getConditions(user, user.id);
    const allergies = this.getAllergies(user, user.id);
    const medications = this.getMedications(user, user.id);
    const surgeries = this.getSurgeries(user, user.id);
    const consultations = this.getConsultations(user, user.id);

    const bmi = profile.heightCm > 0
      ? Number((profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1))
      : 22.0;

    const recentConsultation = consultations.length > 0 ? consultations[0] : null;

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        fullNameEn: user.fullNameEn,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        licenseNumber: user.licenseNumber,
      },
      recentConsultation,
      activeSymptoms: recentConsultation
        ? {
            reportedSymptoms: recentConsultation.symptoms,
            urgency: recentConsultation.urgency,
            urgencyLabelAr: recentConsultation.urgencyLabelAr,
            urgencyLabelEn: recentConsultation.urgencyLabelEn,
            timestamp: recentConsultation.timestamp,
            differentials: recentConsultation.differentials,
          }
        : null,
      currentMedications: {
        count: medications.filter((m) => m.status === 'ACTIVE').length,
        items: medications,
      },
      allergies: {
        count: allergies.length,
        items: allergies,
        hasSevere: allergies.some((a) => a.severity === 'SEVERE'),
      },
      healthProfile: {
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bmi,
        ethnicity: profile.ethnicity,
        bloodType: profile.bloodType,
        conditionsCount: conditions.length,
        surgeriesCount: surgeries.length,
        emergencyContact: profile.emergencyContact,
        updatedAt: profile.updatedAt,
      },
      conditions,
      surgeries,
    };
  }
}

export const userDataStore = new UserDatabaseStore();
