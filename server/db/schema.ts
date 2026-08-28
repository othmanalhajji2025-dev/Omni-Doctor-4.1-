import { z } from 'zod';

export type UserRole =
  | 'GUEST'
  | 'USER'
  | 'HEALTHCARE_PROFESSIONAL'
  | 'ADMINISTRATOR'
  | 'SUPER_ADMIN';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  fullName: string;
  fullNameEn: string;
  nationalId?: string;
  phoneNumber?: string;
  specialty?: string;      // For Healthcare Professional
  licenseNumber?: string;  // For Healthcare Professional
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRecord {
  id: string;
  userId: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  weightKg: number;
  ethnicity: string;       // العرق
  bloodType: string;       // فصيلة الدم
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MedicalConditionRecord {
  id: string;
  userId: string;
  nameAr: string;
  nameEn?: string;
  status: 'ACTIVE' | 'MANAGED' | 'REMISSION';
  diagnosedYear: number;
  notes?: string;
  createdAt: string;
}

export interface AllergyRecord {
  id: string;
  userId: string;
  allergenAr: string;
  allergenEn?: string;
  type: 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
  reactionAr: string;
  reactionEn?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  createdAt: string;
}

export interface MedicationRecord {
  id: string;
  userId: string;
  nameAr: string;
  nameEn?: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  prescriber?: string;
  indication?: string;
  status: 'ACTIVE' | 'DISCONTINUED';
  createdAt: string;
}

export interface SurgeryRecord {
  id: string;
  userId: string;
  surgeryNameAr: string;
  surgeryNameEn?: string;
  year: number;
  hospital?: string;
  notes?: string;
  createdAt: string;
}

export interface ConsultationRecord {
  id: string;
  userId: string;
  timestamp: string;
  symptoms: string;
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
  urgencyLabelAr: string;
  urgencyLabelEn: string;
  differentials: Array<{ nameAr: string; nameEn: string; probability: string }>;
  redFlagsCount: number;
  summaryAr: string;
  summaryEn: string;
  status: 'COMPLETED' | 'REFERRED_TO_CLINIC' | 'EMERGENCY_DISPATCHED';
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// Validation Schemas
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  fullNameEn: z.string().optional(),
  role: z.enum(['USER', 'HEALTHCARE_PROFESSIONAL', 'ADMINISTRATOR', 'SUPER_ADMIN']).optional(),
  age: z.number().min(0).max(130).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ProfileUpdateSchema = z.object({
  age: z.number().min(0).max(130).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  heightCm: z.number().min(30).max(300).optional(),
  weightKg: z.number().min(2).max(500).optional(),
  ethnicity: z.string().min(1).max(100).optional(),
  bloodType: z.string().min(1).max(10).optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    relation: z.string().min(1),
    phone: z.string().min(3),
  }).optional(),
});

export const ConditionSchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().optional(),
  status: z.enum(['ACTIVE', 'MANAGED', 'REMISSION']).default('ACTIVE'),
  diagnosedYear: z.number().min(1900).max(new Date().getFullYear()),
  notes: z.string().optional(),
});

export const AllergySchema = z.object({
  allergenAr: z.string().min(2),
  allergenEn: z.string().optional(),
  type: z.enum(['DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER']).default('DRUG'),
  reactionAr: z.string().min(2),
  reactionEn: z.string().optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).default('MODERATE'),
});

export const MedicationSchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().optional(),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  startDate: z.string().optional(),
  prescriber: z.string().optional(),
  indication: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISCONTINUED']).default('ACTIVE'),
});

export const SurgerySchema = z.object({
  surgeryNameAr: z.string().min(2),
  surgeryNameEn: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear()),
  hospital: z.string().optional(),
  notes: z.string().optional(),
});
