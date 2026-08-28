import fs from 'node:fs';
import path from 'node:path';
import { MedicalDocumentRecord, ExtractedLabItem } from './types.js';
import { UserRecord } from '../db/schema.js';

interface DocumentStorageState {
  documents: MedicalDocumentRecord[];
  confirmedLabs: Array<ExtractedLabItem & { userId: string; documentId: string; date: string }>;
}

export class DocumentStore {
  private dataDir = path.join(process.cwd(), 'server', 'db', 'data');
  private storeFile = path.join(this.dataDir, 'medical_documents.json');
  private state: DocumentStorageState = {
    documents: [],
    confirmedLabs: [],
  };

  constructor() {
    this.initStore();
  }

  private initStore() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.storeFile)) {
        const fileData = fs.readFileSync(this.storeFile, 'utf-8');
        this.state = JSON.parse(fileData);
      } else {
        this.seedInitialDocuments();
        this.saveToFile();
      }
    } catch (err) {
      console.warn('[DocumentStore] Failed to read store file, using seeds:', err);
      this.seedInitialDocuments();
    }
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.storeFile, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DocumentStore] Failed to write store file:', err);
    }
  }

  private seedInitialDocuments() {
    const defaultUserId = 'usr_pat_001';

    const seedDoc1: MedicalDocumentRecord = {
      id: 'doc_seed_cbc_001',
      userId: defaultUserId,
      fileName: 'CBC_Renal_Panel_August2026.pdf',
      fileType: 'PDF',
      mimeType: 'application/pdf',
      fileSizeBytes: 245000,
      uploadedAt: '2026-08-15T09:30:00Z',
      pipelineStep: 'USER_CONFIRMED',
      status: 'CONFIRMED',
      classification: {
        category: 'LAB_REPORT',
        categoryAr: 'تقرير فحوصات مخبرية',
        categoryEn: 'Laboratory Report',
        confidenceScore: 0.96,
        documentDate: '2026-08-15',
        issuingFacility: 'مستشفى ومختبرات الأمل التخصصية',
        doctorName: 'Dr. Tariq Al-Mansoor, MD',
        summaryAr: 'تقرير شامل لتعداد الدم ووظائف الكلى يظهر فقر دم معتدل وسلامة وظائف الكلى.',
        summaryEn: 'Complete blood count and renal profile showing mild anemia with normal renal markers.',
      },
      rawExtractedText: `AL-AMAL SPECIALIZED HOSPITAL
LABORATORY REPORT - CBC & RENAL
Hemoglobin (Hb): 10.2 g/dL (Low)
White Blood Cells (WBC): 8.4 x10^3/uL (Normal)
Platelets: 240 x10^3/uL (Normal)
Serum Creatinine: 1.1 mg/dL (Normal)
Fasting Glucose: 115 mg/dL (High)`,
      extractionSource: 'PDF_PARSER',
      extractedLabResults: [],
      confirmedLabResults: [
        {
          id: 'lab_item_seed_01',
          testName: 'Hemoglobin (Hb)',
          testNameAr: 'الهيموجلوبين (خضاب الدم)',
          category: 'Complete Blood Count (CBC)',
          categoryAr: 'تعداد الدم الكامل (CBC)',
          resultValue: 10.2,
          isNumeric: true,
          unit: 'g/dL',
          referenceRange: {
            min: 13.5,
            max: 17.5,
            textRange: '13.5 - 17.5 g/dL',
            textRangeAr: '13.5 - 17.5 غ/ديسيلتر',
            unit: 'g/dL',
            sexTarget: 'MALE',
          },
          status: 'Low',
          confidenceScore: 0.98,
          interpretation: {
            flagExplanationAr: 'منخفض: القيمة (10.2 غ/ديسيلتر) أقل من الحد الطبيعي الأدنى للذكور.',
            flagExplanationEn: 'LOW: Result (10.2 g/dL) is below the lower reference threshold for adult males.',
            clinicalContextNotesAr: 'ينصح بفحص مخزون الحديد (Ferritin) وفيتامين B12 لتحديد نوع فقر الدم.',
            clinicalContextNotesEn: 'Recommend investigating serum ferritin and B12 to delineate anemia etiology.',
            differentialPossibilitiesAr: ['فقر دم بنقص الحديد', 'أنيميا الأمراض المزمنة'],
            differentialPossibilitiesEn: ['Iron deficiency anemia', 'Anemia of chronic disease'],
            recommendedFollowUpAr: 'مراجعة الطبيب وتكرار الفحص بعد 4 أسابيع.',
            recommendedFollowUpEn: 'Follow up with physician and repeat in 4 weeks.',
          },
          userConfirmed: true,
        },
        {
          id: 'lab_item_seed_02',
          testName: 'Fasting Blood Glucose',
          testNameAr: 'سكر الدم الصائم',
          category: 'Diabetes & Metabolism',
          categoryAr: 'السكري والتمثيل الغذائي',
          resultValue: 115,
          isNumeric: true,
          unit: 'mg/dL',
          referenceRange: {
            min: 70,
            max: 99,
            textRange: '70 - 99 mg/dL',
            textRangeAr: '70 - 99 ملغ/ديسيلتر',
            unit: 'mg/dL',
          },
          status: 'High',
          confidenceScore: 0.97,
          interpretation: {
            flagExplanationAr: 'مرتفع: القيمة (115 ملغ/ديسيلتر) تقع في نطاق اضطراب السكر الصائم (ما قبل السكري).',
            flagExplanationEn: 'ELEVATED: Fasting Glucose (115 mg/dL) falls within the impaired fasting glucose range.',
            clinicalContextNotesAr: 'تنبيه: لا يتم تشخيص السكري من قراءة منفردة، يوصى بفحص السكر التراكمي (HbA1c).',
            clinicalContextNotesEn: 'Notice: Do not diagnose diabetes based on a single result alone. HbA1c correlation needed.',
            differentialPossibilitiesAr: ['مرحلة ما قبل السكري (Impaired Fasting Glucose)'],
            differentialPossibilitiesEn: ['Impaired fasting glucose (Prediabetes)'],
            recommendedFollowUpAr: 'إجراء فحص السكر التراكمي ومتابعة النمط الغذائي.',
            recommendedFollowUpEn: 'Perform HbA1c test and review lifestyle modifications.',
          },
          userConfirmed: true,
        },
        {
          id: 'lab_item_seed_03',
          testName: 'Serum Creatinine',
          testNameAr: 'الكرياتينين في مصل الدم',
          category: 'Renal Function',
          categoryAr: 'وظائف الكلى',
          resultValue: 1.1,
          isNumeric: true,
          unit: 'mg/dL',
          referenceRange: {
            min: 0.7,
            max: 1.3,
            textRange: '0.7 - 1.3 mg/dL',
            textRangeAr: '0.7 - 1.3 ملغ/ديسيلتر',
            unit: 'mg/dL',
            sexTarget: 'MALE',
          },
          status: 'Normal',
          confidenceScore: 0.98,
          interpretation: {
            flagExplanationAr: 'طبيعي: وظائف ترشيح الكلى ضمن النطاق السليم.',
            flagExplanationEn: 'NORMAL: Renal filtration marker is within healthy limits.',
            clinicalContextNotesAr: 'المؤشر يعكس كفاءة وظيفة الكلى الطبيعية.',
            clinicalContextNotesEn: 'Indicates normal renal clearance.',
            differentialPossibilitiesAr: ['وظيفة كلوية فيزيولوجية طبيعية'],
            differentialPossibilitiesEn: ['Normal physiological kidney function'],
            recommendedFollowUpAr: 'استمرار المتابعة الدورية.',
            recommendedFollowUpEn: 'Continue routine preventative checkups.',
          },
          userConfirmed: true,
        },
      ],
      confirmedAt: '2026-08-15T10:00:00Z',
      accessControl: {
        ownerId: defaultUserId,
        sharedWithRoles: ['HEALTHCARE_PROFESSIONAL', 'ADMINISTRATOR', 'SUPER_ADMIN'],
        isEncrypted: true,
        isArchived: false,
      },
    };

    this.state.documents = [seedDoc1];
    this.state.confirmedLabs = seedDoc1.confirmedLabResults!.map((item) => ({
      ...item,
      userId: defaultUserId,
      documentId: seedDoc1.id,
      date: '2026-08-15',
    }));
  }

  /**
   * ACCESS CONTROL VALIDATION
   * Checks if user has permission to read/write the document
   */
  public verifyAccess(doc: MedicalDocumentRecord, user?: UserRecord | null): boolean {
    if (!user) return true; // Guest demo access fallback
    if (user.role === 'ADMINISTRATOR' || user.role === 'SUPER_ADMIN' || user.role === 'HEALTHCARE_PROFESSIONAL') {
      return true;
    }
    return doc.userId === user.id || doc.accessControl.ownerId === user.id;
  }

  public getDocumentsForUser(user?: UserRecord | null, targetUserId?: string): MedicalDocumentRecord[] {
    const effectiveUserId = targetUserId || user?.id || 'usr_pat_001';

    return this.state.documents.filter((doc) => {
      if (user?.role === 'ADMINISTRATOR' || user?.role === 'SUPER_ADMIN' || user?.role === 'HEALTHCARE_PROFESSIONAL') {
        return targetUserId ? doc.userId === targetUserId : true;
      }
      return doc.userId === effectiveUserId;
    });
  }

  public getDocumentById(id: string, user?: UserRecord | null): MedicalDocumentRecord | undefined {
    const doc = this.state.documents.find((d) => d.id === id);
    if (!doc) return undefined;

    if (!this.verifyAccess(doc, user)) {
      throw new Error('ACCESS_DENIED: You do not have permission to access this medical document.');
    }

    return doc;
  }

  public saveDocument(doc: MedicalDocumentRecord): MedicalDocumentRecord {
    const index = this.state.documents.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      this.state.documents[index] = doc;
    } else {
      this.state.documents.unshift(doc);
    }

    // Sync confirmed labs
    if (doc.status === 'CONFIRMED' && doc.confirmedLabResults) {
      // Remove old records for this document
      this.state.confirmedLabs = this.state.confirmedLabs.filter((lab) => lab.documentId !== doc.id);

      // Add new confirmed items
      const docDate = doc.classification.documentDate || doc.uploadedAt.split('T')[0];
      for (const item of doc.confirmedLabResults) {
        this.state.confirmedLabs.push({
          ...item,
          userId: doc.userId,
          documentId: doc.id,
          date: docDate,
        });
      }
    }

    this.saveToFile();
    return doc;
  }

  public deleteDocument(id: string, user?: UserRecord | null): boolean {
    const doc = this.getDocumentById(id, user);
    if (!doc) return false;

    this.state.documents = this.state.documents.filter((d) => d.id !== id);
    this.state.confirmedLabs = this.state.confirmedLabs.filter((l) => l.documentId !== id);
    this.saveToFile();
    return true;
  }

  public getConfirmedLabsForUser(userId: string): Array<ExtractedLabItem & { userId: string; documentId: string; date: string }> {
    return this.state.confirmedLabs.filter((lab) => lab.userId === userId);
  }
}

export const documentStore = new DocumentStore();
