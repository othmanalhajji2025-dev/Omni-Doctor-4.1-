import { userDataStore } from '../db/userDataStore.js';
import { TestResult } from './auth.test.js';

export async function runDataIsolationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Cross-Patient Health Profile Isolation (Strict HIPAA / GDPR tenant separation)
  {
    const start = Date.now();
    try {
      const patientA = userDataStore.getUserByEmail('user@omnidoctor.ai')!;
      
      // Create temporary patient B
      const tempEmailB = `patient_b_iso_${Date.now()}@omnidoctor.ai`;
      const { user: patientB } = userDataStore.createUser({
        email: tempEmailB,
        password: 'Password123!',
        fullName: 'Patient B Isolation Test',
        role: 'USER',
        age: 45,
        gender: 'FEMALE',
      });

      // 1. Patient A attempts to view Patient B's profile
      let patientABlockedFromB = false;
      try {
        userDataStore.getProfile(patientA, patientB.id);
      } catch {
        patientABlockedFromB = true;
      }

      // 2. Patient A attempts to view Patient B's medical conditions
      let patientABlockedFromBConditions = false;
      try {
        userDataStore.getConditions(patientA, patientB.id);
      } catch {
        patientABlockedFromBConditions = true;
      }

      // 3. Patient A attempts to inject an allergy into Patient B's record
      let patientABlockedFromBWrite = false;
      try {
        userDataStore.addAllergy(patientA, patientB.id, {
          allergenAr: 'بنسلين مزيف',
          allergenEn: 'Fake Penicillin',
          reactionAr: 'طفح جلدي شديد',
          type: 'DRUG',
          severity: 'SEVERE',
        });
      } catch {
        patientABlockedFromBWrite = true;
      }

      // 4. Patient B can access their own data cleanly
      const patientBOwnProfile = userDataStore.getProfile(patientB, patientB.id);

      // Clean up temp user
      const superAdmin = userDataStore.getUserByEmail('superadmin@omnidoctor.ai')!;
      userDataStore.deleteUser(superAdmin, patientB.id);

      const passed =
        patientABlockedFromB &&
        patientABlockedFromBConditions &&
        patientABlockedFromBWrite &&
        patientBOwnProfile.userId === patientB.id;

      results.push({
        suite: 'Data Isolation',
        name: 'Multi-Tenant Cross-Patient Health Data Isolation',
        passed,
        message: passed
          ? 'Patient A was strictly prevented from reading or writing Patient B health records'
          : 'Cross-patient data leak detected in data isolation check',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Data Isolation',
        name: 'Multi-Tenant Cross-Patient Health Data Isolation',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 2: Healthcare Professional (Doctor) Read-Only Clinical Access vs Write Protection
  {
    const start = Date.now();
    try {
      const doctor = userDataStore.getUserByEmail('doctor@omnidoctor.ai')!;
      const patient = userDataStore.getUserByEmail('user@omnidoctor.ai')!;

      // Doctor is allowed read-only access for clinical evaluations
      const patientProfileForDoctor = userDataStore.getProfile(doctor, patient.id);
      const isReadAllowed = !!patientProfileForDoctor && patientProfileForDoctor.userId === patient.id;

      // Doctor is blocked from unauthorized direct modification of patient's password/account core
      let doctorBlockedOnUserDelete = false;
      try {
        userDataStore.deleteUser(doctor, patient.id);
      } catch {
        doctorBlockedOnUserDelete = true;
      }

      const passed = isReadAllowed && doctorBlockedOnUserDelete;
      results.push({
        suite: 'Data Isolation',
        name: 'Clinician Authorized Read-Only Record Inspection vs Write Guard',
        passed,
        message: passed
          ? 'Clinician granted legitimate patient record view while administrative mutation rights were locked'
          : 'Clinician permissions misconfigured',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Data Isolation',
        name: 'Clinician Authorized Read-Only Record Inspection vs Write Guard',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  return results;
}
