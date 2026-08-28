import { Router, Response } from 'express';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../auth/middleware.js';
import { documentPipelineService } from '../documents/documentPipeline.js';
import { documentStore } from '../documents/documentStore.js';
import { labInterpretationEngine, BIOMARKER_DATABASE } from '../documents/labInterpretationEngine.js';
import { timelineEngine } from '../documents/timelineEngine.js';
import { userDataStore } from '../db/userDataStore.js';

export const documentRouter = Router();

/**
 * 1. FILE UPLOAD & PIPELINE PROCESSING
 * POST /api/documents/upload
 */
documentRouter.post('/upload', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, mimeType, fileSizeBytes, base64Data, rawTextContent, sampleId, patientContext } = req.body;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({
        error: 'File name is required.',
        messageAr: 'اسم الملف مطلوب لإتمام عملية الرفع والمعالجة.',
      });
    }

    const effectiveUserId = req.user?.id || 'usr_pat_001';

    // Enrich context with patient profile if available
    let enrichedContext = patientContext;
    if (req.user) {
      const profile = userDataStore.getProfile(req.user, req.user.id);
      const conditions = userDataStore.getConditions(req.user, req.user.id);
      const meds = userDataStore.getMedications(req.user, req.user.id);
      enrichedContext = {
        age: patientContext?.age || profile.age,
        gender: patientContext?.gender || profile.gender,
        activeConditions: patientContext?.activeConditions || conditions.map((c) => c.nameAr),
        currentMedications: patientContext?.currentMedications || meds.map((m) => m.nameAr),
      };
    }

    const result = documentPipelineService.processDocumentUpload({
      userId: effectiveUserId,
      fileName,
      mimeType,
      fileSizeBytes: Number(fileSizeBytes) || 102400,
      base64Data,
      rawTextContent,
      sampleId,
      patientContext: enrichedContext,
    });

    if (!result.success || !result.document) {
      return res.status(400).json({
        error: result.error || 'File validation failed',
        messageAr: result.errorAr || 'فشل التحقق من صحة الملف المرفوع.',
        validation: result.validation,
      });
    }

    // Save initial draft document (Status: EXTRACTED_PENDING_CONFIRMATION)
    documentStore.saveDocument(result.document);

    res.json({
      success: true,
      messageAr: 'تم رفع المستند واستخراج البيانات بنجاح، وهي الآن جاهزة للمراجعة والاعتماد.',
      messageEn: 'Document uploaded and data extracted successfully; pending user confirmation.',
      document: result.document,
    });
  } catch (error: any) {
    console.error('Error in /api/documents/upload:', error);
    res.status(500).json({
      error: 'Failed to process document upload pipeline',
      details: error.message,
      messageAr: 'حدث خطأ أثناء معالجة مسار رفع واستخراج المستند الطبي.',
    });
  }
});

/**
 * 2. GET ALL DOCUMENTS FOR USER (Access Control Enforced)
 * GET /api/documents
 */
documentRouter.get('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = documentStore.getDocumentsForUser(req.user, req.query.userId as string);
    res.json({
      count: docs.length,
      documents: docs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. GET SINGLE DOCUMENT
 * GET /api/documents/:id
 */
documentRouter.get('/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = documentStore.getDocumentById(req.params.id, req.user);
    if (!doc) {
      return res.status(404).json({
        error: 'Document not found',
        messageAr: 'المستند الطبي غير موجود.',
      });
    }
    res.json(doc);
  } catch (error: any) {
    if (error.message?.includes('ACCESS_DENIED')) {
      return res.status(403).json({
        error: 'Forbidden: Access denied to this medical record',
        messageAr: 'تم رفض الوصول: ليس لديك الصلاحية للاطلاع على هذا المستند الطبي.',
      });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. USER CONFIRMATION & STRUCTURED LAB STORAGE
 * PUT /api/documents/:id/confirm
 */
documentRouter.put('/:id/confirm', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewedItems, userReviewNotes } = req.body;
    const doc = documentStore.getDocumentById(req.params.id, req.user);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!Array.isArray(reviewedItems)) {
      return res.status(400).json({
        error: 'reviewedItems array is required for confirmation',
        messageAr: 'قائمة التحاليل المعتمدة مطلوبة لتأكيد حفظ النتائج المخبرية.',
      });
    }

    // Re-evaluate interpretation for any edited items
    const reEvaluatedItems = reviewedItems.map((item: any) => {
      const interpretation = labInterpretationEngine.interpretTest({
        testName: item.testName,
        resultValue: item.resultValue,
        unit: item.unit,
        documentReferenceRange: item.referenceRange?.textRange,
      });

      return {
        ...item,
        status: interpretation.status,
        interpretation: interpretation.interpretation,
        userConfirmed: true,
      };
    });

    const confirmedDoc = documentPipelineService.confirmDocumentData(doc, reEvaluatedItems, userReviewNotes);
    documentStore.saveDocument(confirmedDoc);

    res.json({
      success: true,
      messageAr: 'تم اعتماد وتأكيد نتائج الفحوصات المخبرية وتخزينها بنجاح في سجلك الصحي.',
      messageEn: 'Lab results reviewed, confirmed, and saved to structured health storage.',
      document: confirmedDoc,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. DELETE DOCUMENT
 * DELETE /api/documents/:id
 */
documentRouter.delete('/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = documentStore.deleteDocument(req.params.id, req.user);
    if (!success) {
      return res.status(404).json({ error: 'Document not found or cannot be deleted' });
    }
    res.json({
      success: true,
      messageAr: 'تم حذف المستند بنجاح.',
      messageEn: 'Document deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. PHASE 8 AUTOMATED VERIFICATION TEST SUITE
 * POST /api/documents/test-suite
 */
documentRouter.post('/test-suite', async (_req, res) => {
  const testResults: Array<{
    testId: string;
    name: string;
    nameAr: string;
    passed: boolean;
    durationMs: number;
    details: any;
  }> = [];

  const runTest = (
    testId: string,
    name: string,
    nameAr: string,
    fn: () => { passed: boolean; details: any }
  ) => {
    const t0 = Date.now();
    try {
      const { passed, details } = fn();
      testResults.push({
        testId,
        name,
        nameAr,
        passed,
        durationMs: Date.now() - t0,
        details,
      });
    } catch (err: any) {
      testResults.push({
        testId,
        name,
        nameAr,
        passed: false,
        durationMs: Date.now() - t0,
        details: { error: err.message },
      });
    }
  };

  // Test 1: File Validation & Size Limits
  runTest(
    'T1_FILE_VALIDATION',
    'File Validation & Format Restrictions',
    'التحقق من صحة الملفات والصيغ المسموح بها وحجم الملف',
    () => {
      const validPdf = documentPipelineService.validateFile({
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 500000,
      });
      const validPng = documentPipelineService.validateFile({
        fileName: 'lab_scan.png',
        mimeType: 'image/png',
        fileSizeBytes: 800000,
      });
      const invalidExe = documentPipelineService.validateFile({
        fileName: 'malware.exe',
        mimeType: 'application/octet-stream',
        fileSizeBytes: 100000,
      });
      const oversize = documentPipelineService.validateFile({
        fileName: 'giant_scan.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 20 * 1024 * 1024, // 20MB exceeds 15MB
      });

      const passed = validPdf.isValid && validPng.isValid && !invalidExe.isValid && !oversize.isValid;
      return {
        passed,
        details: {
          pdfAccepted: validPdf.isValid,
          pngAccepted: validPng.isValid,
          exeRejected: !invalidExe.isValid,
          oversizeRejected: !oversize.isValid,
          oversizeMessage: oversize.errorMessage,
        },
      };
    }
  );

  // Test 2: Access Control Verification
  runTest(
    'T2_ACCESS_CONTROL',
    'Access Control & Multi-Role Data Isolation',
    'التحكم بالصلاحيات وعزل بيانات المرضى عن المستخدمين الآخرين',
    () => {
      const ownerUser = {
        id: 'usr_pat_001',
        email: 'patient1@test.com',
        passwordHash: '',
        salt: '',
        role: 'USER' as const,
        fullName: 'المريض الأول',
        fullNameEn: 'Patient One',
        createdAt: '',
        updatedAt: '',
      };
      const foreignUser = {
        id: 'usr_pat_999',
        email: 'intruder@test.com',
        passwordHash: '',
        salt: '',
        role: 'USER' as const,
        fullName: 'مستخدم آخر',
        fullNameEn: 'Other User',
        createdAt: '',
        updatedAt: '',
      };
      const doc = documentStore.getDocumentById('doc_seed_cbc_001', ownerUser);
      let foreignDenied = false;
      try {
        documentStore.getDocumentById('doc_seed_cbc_001', foreignUser);
      } catch (e: any) {
        foreignDenied = e.message.includes('ACCESS_DENIED');
      }

      const passed = !!doc && foreignDenied;
      return {
        passed,
        details: {
          ownerGranted: !!doc,
          foreignUserDenied: foreignDenied,
        },
      };
    }
  );

  // Test 3: OCR Safety & Data Extraction
  runTest(
    'T3_OCR_SAFETY_EXTRACTION',
    'OCR Safety & Biomarker Parameter Extraction',
    'أمان استخراج البيانات وعدم اعتبار الاستخراج نهائياً دون تأكيد',
    () => {
      const rawText = `TEST NAME               RESULT    UNIT       REFERENCE RANGE
Hemoglobin (Hb)         8.8       g/dL       13.5 - 17.5
Fasting Blood Sugar     142       mg/dL      70 - 99
Serum Creatinine        1.2       mg/dL      0.7 - 1.3`;

      const extracted = documentPipelineService.extractLabItemsFromText(rawText);
      const hb = extracted.find((e) => e.testName.toLowerCase().includes('hemoglobin'));
      const glucose = extracted.find((e) => e.testName.toLowerCase().includes('glucose'));

      const allRequireConfirmation = extracted.every((e) => e.userConfirmed === false);
      const passed =
        extracted.length >= 3 &&
        allRequireConfirmation &&
        hb?.status === 'Low' &&
        glucose?.status === 'High';

      return {
        passed,
        details: {
          extractedCount: extracted.length,
          allRequireConfirmation,
          hbStatus: hb?.status,
          glucoseStatus: glucose?.status,
        },
      };
    }
  );

  // Test 4: User Confirmation & Lab Storage Pipeline
  runTest(
    'T4_USER_CONFIRMATION_STORAGE',
    'User Confirmation & Structured Lab Storage',
    'مراجعة المستخدم للمستند وحفظ البيانات المهيكلة',
    () => {
      const uploadRes = documentPipelineService.processDocumentUpload({
        userId: 'usr_pat_001',
        fileName: 'Test_Lipid_Panel.pdf',
        fileSizeBytes: 120000,
        sampleId: 'diabetic_lipid',
      });

      const initialStatus = uploadRes.document?.status;
      const initialStep = uploadRes.document?.pipelineStep;

      // Confirm with modified item
      const confirmed = documentPipelineService.confirmDocumentData(
        uploadRes.document!,
        uploadRes.document!.extractedLabResults,
        'Patient reviewed and approved values.'
      );

      documentStore.saveDocument(confirmed);

      const passed =
        initialStatus === 'EXTRACTED_PENDING_CONFIRMATION' &&
        initialStep === 'DATA_EXTRACTED' &&
        confirmed.status === 'CONFIRMED' &&
        confirmed.pipelineStep === 'USER_CONFIRMED';

      return {
        passed,
        details: {
          initialStatus,
          confirmedStatus: confirmed.status,
          pipelineStep: confirmed.pipelineStep,
          confirmedLabsStored: confirmed.confirmedLabResults?.length,
        },
      };
    }
  );

  // Test 5: Lab Interpretation Multi-Parameter Safety (Age/Sex/Unit/Critical)
  runTest(
    'T5_LAB_INTERPRETATION_SAFETY',
    'Clinical Interpretation Engine (Age, Sex, Unit & Critical Awareness)',
    'محرك التفسير السريري (مراعاة العمر والجنس والوحدات والحالات الحرجة)',
    () => {
      // 1. Critical Potassium Alert (>6.2)
      const criticalK = labInterpretationEngine.interpretTest({
        testName: 'Potassium',
        resultValue: 6.5,
        unit: 'mEq/L',
      });

      // 2. Sex-aware Hemoglobin: 12.5 is Normal for Female, Low for Male
      const maleHb = labInterpretationEngine.interpretTest({
        testName: 'Hemoglobin',
        resultValue: 12.5,
        unit: 'g/dL',
        context: { age: 35, gender: 'MALE' },
      });
      const femaleHb = labInterpretationEngine.interpretTest({
        testName: 'Hemoglobin',
        resultValue: 12.5,
        unit: 'g/dL',
        context: { age: 35, gender: 'FEMALE' },
      });

      // 3. Unit-aware Glucose: 7.0 mmol/L (~126 mg/dL) -> High
      const mmolGlucose = labInterpretationEngine.interpretTest({
        testName: 'Fasting Blood Glucose',
        resultValue: 7.0,
        unit: 'mmol/L',
      });

      // 4. Pediatric Age-aware Alkaline Phosphatase: 220 U/L is Normal in child, High in adult
      const childAlp = labInterpretationEngine.interpretTest({
        testName: 'Alkaline Phosphatase',
        resultValue: 220,
        unit: 'U/L',
        context: { age: 8, gender: 'MALE' },
      });
      const adultAlp = labInterpretationEngine.interpretTest({
        testName: 'Alkaline Phosphatase',
        resultValue: 220,
        unit: 'U/L',
        context: { age: 40, gender: 'MALE' },
      });

      const passed =
        criticalK.status === 'Critical' &&
        maleHb.status === 'Low' &&
        femaleHb.status === 'Normal' &&
        mmolGlucose.status === 'High' &&
        childAlp.status === 'Normal' &&
        adultAlp.status === 'High';

      return {
        passed,
        details: {
          criticalPotassiumStatus: criticalK.status,
          maleHbStatus: maleHb.status,
          femaleHbStatus: femaleHb.status,
          mmolGlucoseStatus: mmolGlucose.status,
          childAlpStatus: childAlp.status,
          adultAlpStatus: adultAlp.status,
        },
      };
    }
  );

  // Test 6: Health Timeline Longitudinal Correlation
  runTest(
    'T6_HEALTH_TIMELINE_CORRELATION',
    'Health Timeline (Date -> Symptom -> Consultation -> Medication -> Test -> Result)',
    'الخط الزمني الصحي الشامل وربط الأعراض والاستشارات والأدوية والنتائج',
    () => {
      const timeline = timelineEngine.generateHealthTimeline(null, 'usr_pat_001');

      const typesPresent = new Set(timeline.timelineEvents.map((e) => e.type));
      const hasSymptoms = typesPresent.has('SYMPTOM');
      const hasConsultations = typesPresent.has('CONSULTATION');
      const hasMedications = typesPresent.has('MEDICATION');
      const hasTests = typesPresent.has('TEST');
      const hasResults = typesPresent.has('RESULT');

      const passed =
        timeline.timelineEvents.length > 0 &&
        hasSymptoms &&
        hasConsultations &&
        hasMedications &&
        hasTests &&
        hasResults;

      return {
        passed,
        details: {
          totalEvents: timeline.timelineEvents.length,
          typesPresent: Array.from(typesPresent),
          summary: timeline.summary,
          biomarkerTrendsTracked: timeline.biomarkerTrends.map((t) => t.testName),
        },
      };
    }
  );

  const totalPassed = testResults.filter((t) => t.passed).length;
  const totalCount = testResults.length;

  res.json({
    suiteName: 'Phase 8: Medical Documents & Lab Interpretation Engine Test Suite',
    suiteNameAr: 'حزمة الاختبارات الشاملة للمرحلة 8: المستندات الطبية ومفسر التحاليل',
    allPassed: totalPassed === totalCount,
    passedCount: totalPassed,
    totalCount,
    tests: testResults,
  });
});
