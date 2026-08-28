export interface PatientProfileRecord {
  id: string;
  nationalId?: string;
  fullName: string;
  fullNameEn: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType: string;
  heightCm: number;
  weightKg: number;
  chronicConditions: Array<{ id: string; nameAr: string; nameEn: string; sinceYear: number }>;
  allergies: Array<{ id: string; allergenAr: string; allergenEn: string; severity: 'MILD' | 'MODERATE' | 'SEVERE' }>;
  currentMedications: Array<{ id: string; nameAr: string; nameEn: string; dosage: string; frequency: string; startDate: string }>;
  emergencyContact: { name: string; relation: string; phone: string };
  createdAt: string;
  updatedAt: string;
}

export interface VitalLogRecord {
  id: string;
  timestamp: string;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  spO2: number;
  temperature: number;
  bloodGlucose?: number;
  notes?: string;
}

export interface EncounterHistoryRecord {
  id: string;
  timestamp: string;
  symptoms: string;
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
  urgencyLabelAr: string;
  urgencyLabelEn: string;
  differentials: Array<{ nameAr: string; nameEn: string; probability: string }>;
  redFlagsCount: number;
  status: 'COMPLETED' | 'REFERRED_TO_CLINIC' | 'EMERGENCY_DISPATCHED';
}

// In-Memory Production-Grade Repository with Seed Data
class MedicalDatabaseStore {
  private profile: PatientProfileRecord = {
    id: 'pat_omni_8812',
    nationalId: '1092837461',
    fullName: 'عبدالله محمد السالم',
    fullNameEn: 'Abdullah M. Al-Salem',
    age: 44,
    gender: 'MALE',
    bloodType: 'O+',
    heightCm: 176,
    weightKg: 82,
    chronicConditions: [
      { id: 'cc-1', nameAr: 'ارتفاع ضغط الدم الشرياني (المرحلة 1)', nameEn: 'Essential Hypertension (Stage 1)', sinceYear: 2021 },
      { id: 'cc-2', nameAr: 'مقدمات السكري (Prediabetes)', nameEn: 'Impaired Fasting Glucose (Prediabetes)', sinceYear: 2023 }
    ],
    allergies: [
      { id: 'al-1', allergenAr: 'البنسلين ومشتقاته (Penicillin)', allergenEn: 'Penicillin and Beta-lactams', severity: 'SEVERE' },
      { id: 'al-2', allergenAr: 'حبوب اللقاح الموسمية', allergenEn: 'Seasonal Pollen', severity: 'MILD' }
    ],
    currentMedications: [
      { id: 'med-1', nameAr: 'أملوديبين (Amlodipine)', nameEn: 'Amlodipine', dosage: '5 mg', frequency: 'مرة واحدة صباحاً', startDate: '2022-01-15' },
      { id: 'med-2', nameAr: 'ميتفورمين (Metformin XR)', nameEn: 'Metformin XR', dosage: '500 mg', frequency: 'مرة واحدة مع العشاء', startDate: '2023-06-10' }
    ],
    emergencyContact: {
      name: 'فاطمة السالم (الزوجة)',
      relation: 'Spouse',
      phone: '+966 50 123 4567'
    },
    createdAt: '2023-01-01T08:00:00.000Z',
    updatedAt: '2026-08-20T10:30:00.000Z'
  };

  private vitals: VitalLogRecord[] = [
    {
      id: 'vit_01',
      timestamp: '2026-08-27T08:00:00.000Z',
      systolicBP: 128,
      diastolicBP: 82,
      heartRate: 74,
      spO2: 98,
      temperature: 36.8,
      bloodGlucose: 104,
      notes: 'قراءة صباحية بعد الاستيقاظ مباشرة'
    },
    {
      id: 'vit_02',
      timestamp: '2026-08-26T18:30:00.000Z',
      systolicBP: 132,
      diastolicBP: 85,
      heartRate: 78,
      spO2: 98,
      temperature: 37.0,
      bloodGlucose: 118,
      notes: 'بعد المشي المسائي'
    },
    {
      id: 'vit_03',
      timestamp: '2026-08-25T08:15:00.000Z',
      systolicBP: 126,
      diastolicBP: 80,
      heartRate: 72,
      spO2: 99,
      temperature: 36.7,
      bloodGlucose: 99,
      notes: 'صائم 8 ساعات'
    },
    {
      id: 'vit_04',
      timestamp: '2026-08-24T07:45:00.000Z',
      systolicBP: 135,
      diastolicBP: 88,
      heartRate: 80,
      spO2: 97,
      temperature: 36.9,
      bloodGlucose: 108
    }
  ];

  private encounters: EncounterHistoryRecord[] = [
    {
      id: 'enc_hist_01',
      timestamp: '2026-08-20T14:20:00.000Z',
      symptoms: 'صداع خفيف في الجبهة مع تعب وإرهاق عام بعد العمل المكتبي',
      urgency: 'SELF_CARE',
      urgencyLabelAr: 'رعاية منزلية ومراقبة ذاتية (أخضر)',
      urgencyLabelEn: 'Self-Care & Monitoring',
      differentials: [
        { nameAr: 'صداع التوتر العضلي وإجهاد العينين', nameEn: 'Tension-Type Headache & Eye Strain', probability: 'POSSIBLE' },
        { nameAr: 'إجهاد بدني وقلة نوم', nameEn: 'Physical Fatigue / Sleep Deprivation', probability: 'CONSIDERATION' }
      ],
      redFlagsCount: 0,
      status: 'COMPLETED'
    },
    {
      id: 'enc_hist_02',
      timestamp: '2026-07-12T10:15:00.000Z',
      symptoms: 'حرقة بول متكررة مع ألم خفيف في أسفل البطن',
      urgency: 'ROUTINE',
      urgencyLabelAr: 'استشارة عيادة روتينية (أصفر)',
      urgencyLabelEn: 'Routine Outpatient',
      differentials: [
        { nameAr: 'التهاب المسالك البولية السفلي البسيط (Cystitis)', nameEn: 'Uncomplicated Lower UTI', probability: 'POSSIBLE' }
      ],
      redFlagsCount: 0,
      status: 'REFERRED_TO_CLINIC'
    }
  ];

  getProfile(): PatientProfileRecord {
    return this.profile;
  }

  updateProfile(updates: Partial<PatientProfileRecord>): PatientProfileRecord {
    this.profile = {
      ...this.profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.profile;
  }

  getVitals(): VitalLogRecord[] {
    return this.vitals;
  }

  addVital(vital: Omit<VitalLogRecord, 'id' | 'timestamp'>): VitalLogRecord {
    const newRecord: VitalLogRecord = {
      id: 'vit_' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toISOString(),
      ...vital
    };
    this.vitals.unshift(newRecord);
    return newRecord;
  }

  getEncounters(): EncounterHistoryRecord[] {
    return this.encounters;
  }

  addEncounter(record: Omit<EncounterHistoryRecord, 'id' | 'timestamp'>): EncounterHistoryRecord {
    const newEncounter: EncounterHistoryRecord = {
      id: 'enc_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...record
    };
    this.encounters.unshift(newEncounter);
    return newEncounter;
  }

  addMedication(med: { nameAr: string; nameEn: string; dosage: string; frequency: string }): PatientProfileRecord {
    const newMed = {
      id: 'med-' + Math.random().toString(36).substring(2, 7),
      ...med,
      startDate: new Date().toISOString().split('T')[0]
    };
    this.profile.currentMedications.push(newMed);
    this.profile.updatedAt = new Date().toISOString();
    return this.profile;
  }

  removeMedication(medId: string): PatientProfileRecord {
    this.profile.currentMedications = this.profile.currentMedications.filter(m => m.id !== medId);
    this.profile.updatedAt = new Date().toISOString();
    return this.profile;
  }
}

export const medicalStore = new MedicalDatabaseStore();
