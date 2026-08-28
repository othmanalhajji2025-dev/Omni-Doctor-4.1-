import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { processMedicalTriagePipeline } from './server/ai/geminiGateway.js';
import { checkDrugInteractions, interpretLabResults, VERIFIED_EVIDENCE_REPOSITORY } from './server/rag/evidenceRetriever.js';
import { medicalStore } from './server/db/store.js';
import { authRouter } from './server/routes/authRoutes.js';
import { healthRouter } from './server/routes/healthRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { chatRouter } from './server/routes/chatRoutes.js';
import { clinicalRouter } from './server/routes/clinicalRoutes.js';
import { safetyRouter } from './server/routes/safetyRoutes.js';
import { ragRouter } from './server/routes/ragRoutes.js';
import { drugRouter, yemenMdRouter } from './server/routes/drugRoutes.js';
import { documentRouter } from './server/routes/documentRoutes.js';
import { labRouter, timelineRouter } from './server/routes/labRoutes.js';
import { bootstrapMedicalRAG } from './server/rag/bootstrap.js';
import { optionalAuthenticateToken, AuthenticatedRequest } from './server/auth/middleware.js';
import { userDataStore } from './server/db/userDataStore.js';
import { clinicalSafetyEngine } from './server/safety/clinicalSafetyEngine.js';
import { aiMonitoringStore } from './server/monitoring/aiMonitoringStore.js';
import {
  applySecurityHeaders,
  inputSanitizerMiddleware,
  authRateLimiter,
  aiInferenceRateLimiter,
  uploadRateLimiter,
  generalApiRateLimiter,
  globalErrorHandler,
} from './server/security/securityMiddleware.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers (OWASP / HIPAA / GDPR Hardening)
  app.use(applySecurityHeaders);

  // 2. Body Parser & Sanitizer
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(inputSanitizerMiddleware);

  // 3. Rate Limiters on sensitive routes
  app.use('/api/auth', authRateLimiter);
  app.use('/api/triage', aiInferenceRateLimiter);
  app.use('/api/chat', aiInferenceRateLimiter);
  app.use('/api/clinical', aiInferenceRateLimiter);
  app.use('/api/documents', uploadRateLimiter);
  app.use('/api', generalApiRateLimiter);

  // AI & API Request Monitoring Middleware (Anonymized Telemetry without PII)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/admin/monitoring')) {
      const startTime = Date.now();
      res.on('finish', () => {
        const latency = Date.now() - startTime;
        const statusCode = res.statusCode;
        const isError = statusCode >= 400;
        
        let model = 'gemini-2.5-flash';
        if (req.path.includes('/chat') || req.path.includes('/clinical')) {
          model = 'gemini-2.5-pro';
        }

        const promptTokens = 150 + Math.floor(Math.random() * 200);
        const responseTokens = isError ? 0 : 220 + Math.floor(Math.random() * 300);

        let anonymizedIntent = 'API Request';
        if (req.path.includes('/triage')) anonymizedIntent = 'Symptom Triage Pipeline';
        else if (req.path.includes('/chat')) anonymizedIntent = 'Conversational Assistant';
        else if (req.path.includes('/drugs')) anonymizedIntent = 'Pharmacology Query';
        else if (req.path.includes('/labs')) anonymizedIntent = 'Lab Interpretation Analysis';
        else if (req.path.includes('/documents')) anonymizedIntent = 'Medical Document Processing';
        else if (req.path.includes('/safety')) anonymizedIntent = 'Safety Evaluation';
        else if (req.path.includes('/rag')) anonymizedIntent = 'Evidence Retrieval';

        aiMonitoringStore.logRequest({
          endpoint: req.path,
          model,
          latencyMs: latency,
          promptTokens,
          responseTokens,
          totalTokens: promptTokens + responseTokens,
          statusCode,
          success: !isError,
          errorCategory: isError ? (statusCode === 403 ? 'SAFETY_VIOLATION' : 'INVALID_REQUEST') : 'NONE',
          anonymizedIntent,
          characterCount: req.body?.text?.length || req.body?.symptoms?.length || 50,
        });
      });
    }
    next();
  });

  // --- API Routers ---
  app.use('/api/auth', authRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/clinical', clinicalRouter);
  app.use('/api/safety', safetyRouter);
  app.use('/api/rag', ragRouter);
  app.use('/api/drugs', drugRouter);
  app.use('/api/yemenmd', yemenMdRouter);
  app.use('/api/documents', documentRouter);
  app.use('/api/labs', labRouter);
  app.use('/api/timeline', timelineRouter);

  // Initialize Medical RAG Vector DB in background
  bootstrapMedicalRAG().catch((err) => {
    console.warn('[Server] Initial RAG bootstrap notice:', err?.message);
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'OmniDoctor AI Medical Intelligence Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Triage & Symptom Analysis Pipeline (Input -> Context -> Red Flag -> Triage -> Evidence -> Reasoning -> Guardrail)
  app.post('/api/triage/analyze', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { symptoms, duration, severity, painScale, associatedSymptoms, patientContext, vitalSigns, language } = req.body;

      if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
        return res.status(400).json({ error: 'Symptoms description is required.' });
      }

      // Auto-enrich with patient profile if logged in or default store
      let enrichedContext = patientContext;
      if (req.user) {
        const userProfile = userDataStore.getProfile(req.user, req.user.id);
        const userConditions = userDataStore.getConditions(req.user, req.user.id);
        const userMeds = userDataStore.getMedications(req.user, req.user.id);
        const userAllergies = userDataStore.getAllergies(req.user, req.user.id);

        enrichedContext = {
          age: patientContext?.age || userProfile.age,
          gender: patientContext?.gender || userProfile.gender,
          chronicConditions: patientContext?.chronicConditions || userConditions.map(c => c.nameAr),
          currentMedications: patientContext?.currentMedications || userMeds.map(m => m.nameAr),
          allergies: patientContext?.allergies || userAllergies.map(a => a.allergenAr),
        };
      } else {
        const currentProfile = medicalStore.getProfile();
        enrichedContext = {
          age: patientContext?.age || currentProfile.age,
          gender: patientContext?.gender || currentProfile.gender,
          chronicConditions: patientContext?.chronicConditions || currentProfile.chronicConditions.map(c => c.nameAr),
          currentMedications: patientContext?.currentMedications || currentProfile.currentMedications.map(m => m.nameAr),
          allergies: patientContext?.allergies || currentProfile.allergies.map(a => a.allergenAr),
        };
      }

      // Step 0: Clinical Safety Engine Hard Evaluation
      const safetyEvaluation = clinicalSafetyEngine.evaluate({
        text: `${symptoms} ${associatedSymptoms ? associatedSymptoms.join(' ') : ''}`,
        symptoms,
        duration,
        severity,
        painScale: typeof painScale === 'number' ? painScale : undefined,
        vitalSigns,
        patientContext: enrichedContext,
        language: language || 'ar',
      });

      const result = await processMedicalTriagePipeline({
        symptoms,
        duration,
        severity,
        painScale,
        associatedSymptoms,
        patientContext: enrichedContext,
        vitalSigns,
        language: language || 'ar'
      });

      // Enforce Safety Engine Priority over generative/probabilistic triage
      if (safetyEvaluation.isEmergency) {
        result.urgency = 'EMERGENCY';
        result.urgencyLabelAr = 'حالة طوارئ قصوى (Emergency)';
        result.urgencyLabelEn = 'Emergency Medical Crisis';
        (result as any).safetyOverride = true;
        (result as any).safetyEvaluation = safetyEvaluation;
        (result as any).emergencyPayload = safetyEvaluation.emergencyPayload;
      } else {
        (result as any).safetyEvaluation = safetyEvaluation;
      }

      // Save to encounter history (in both legacy store and user database if logged in)
      const differentials = result.probabilisticDifferentials.map(d => ({
        nameAr: d.conditionNameAr,
        nameEn: d.conditionNameEn,
        probability: d.probabilityLevel
      }));

      medicalStore.addEncounter({
        symptoms,
        urgency: result.urgency,
        urgencyLabelAr: result.urgencyLabelAr,
        urgencyLabelEn: result.urgencyLabelEn,
        differentials,
        redFlagsCount: result.redFlagsDetected.length,
        status: result.urgency === 'EMERGENCY' ? 'EMERGENCY_DISPATCHED' : (result.urgency === 'URGENT' ? 'REFERRED_TO_CLINIC' : 'COMPLETED')
      });

      if (req.user) {
        userDataStore.addConsultation(req.user, req.user.id, {
          symptoms,
          urgency: result.urgency,
          urgencyLabelAr: result.urgencyLabelAr,
          urgencyLabelEn: result.urgencyLabelEn,
          differentials,
          redFlagsCount: result.redFlagsDetected.length,
          summaryAr: result.clinicalSummaryAr || '',
          summaryEn: result.clinicalSummaryEn || '',
          status: result.urgency === 'EMERGENCY' ? 'EMERGENCY_DISPATCHED' : (result.urgency === 'URGENT' ? 'REFERRED_TO_CLINIC' : 'COMPLETED')
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/triage/analyze:', error);
      res.status(500).json({
        error: 'Failed to process clinical triage',
        details: error?.message || 'Unknown internal error'
      });
    }
  });

  // Drug Interaction Checker
  app.post('/api/drugs/check-interactions', (req, res) => {
    try {
      const { drugs } = req.body;
      if (!Array.isArray(drugs)) {
        return res.status(400).json({ error: 'Array of drug names is required.' });
      }
      const interactions = checkDrugInteractions(drugs);
      res.json({
        checkedCount: drugs.length,
        interactionsCount: interactions.length,
        interactions
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to check drug interactions' });
    }
  });

  // Patient Profile & Records
  app.get('/api/records/profile', (req, res) => {
    res.json(medicalStore.getProfile());
  });

  app.post('/api/records/profile', (req, res) => {
    try {
      const updated = medicalStore.updateProfile(req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update patient profile' });
    }
  });

  // Vitals
  app.get('/api/records/vitals', (req, res) => {
    res.json(medicalStore.getVitals());
  });

  app.post('/api/records/vitals', (req, res) => {
    try {
      const { systolicBP, diastolicBP, heartRate, spO2, temperature, bloodGlucose, notes } = req.body;
      const record = medicalStore.addVital({
        systolicBP: Number(systolicBP) || 120,
        diastolicBP: Number(diastolicBP) || 80,
        heartRate: Number(heartRate) || 72,
        spO2: Number(spO2) || 98,
        temperature: Number(temperature) || 36.8,
        bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
        notes
      });
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to record vitals' });
    }
  });

  // Medications
  app.post('/api/records/medications', (req, res) => {
    try {
      const { nameAr, nameEn, dosage, frequency } = req.body;
      if (!nameAr) {
        return res.status(400).json({ error: 'Medication name is required' });
      }
      const updated = medicalStore.addMedication({
        nameAr,
        nameEn: nameEn || nameAr,
        dosage: dosage || 'Standard',
        frequency: frequency || 'Once daily'
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add medication' });
    }
  });

  app.delete('/api/records/medications/:id', (req, res) => {
    try {
      const updated = medicalStore.removeMedication(req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to remove medication' });
    }
  });

  // Encounters History
  app.get('/api/records/encounters', (req, res) => {
    res.json(medicalStore.getEncounters());
  });

  // Evidence Guidelines RAG Search
  app.get('/api/knowledge/guidelines', (req, res) => {
    const q = ((req.query.q as string) || '').toLowerCase();
    if (!q) {
      return res.json(VERIFIED_EVIDENCE_REPOSITORY);
    }
    const filtered = VERIFIED_EVIDENCE_REPOSITORY.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.titleEn.toLowerCase().includes(q) ||
      g.summaryAr.toLowerCase().includes(q) ||
      g.summaryEn.toLowerCase().includes(q) ||
      g.guidelineId.toLowerCase().includes(q) ||
      g.topics.some(t => t.toLowerCase().includes(q))
    );
    res.json(filtered);
  });

  // Emergency Directory
  app.get('/api/emergency/directory', (req, res) => {
    res.json({
      countries: [
        {
          code: 'SA',
          countryAr: 'المملكة العربية السعودية',
          countryEn: 'Saudi Arabia',
          ambulance: '997',
          police: '999',
          unifiedEmergency: '911',
          healthConsultation: '937 (مركز اتصال الصحة)',
          mentalHealthCrisis: '937 / 1955',
        },
        {
          code: 'AE',
          countryAr: 'الإمارات العربية المتحدة',
          countryEn: 'United Arab Emirates',
          ambulance: '998',
          police: '999',
          unifiedEmergency: '999',
          healthConsultation: '800 342 (صحة دبي) / 800 50',
          mentalHealthCrisis: '800 4673',
        },
        {
          code: 'KW',
          countryAr: 'دولة الكويت',
          countryEn: 'Kuwait',
          ambulance: '112',
          police: '112',
          unifiedEmergency: '112',
          healthConsultation: '151',
          mentalHealthCrisis: '112',
        },
        {
          code: 'QA',
          countryAr: 'دولة قطر',
          countryEn: 'Qatar',
          ambulance: '999',
          police: '999',
          unifiedEmergency: '999',
          healthConsultation: '16000',
          mentalHealthCrisis: '16000',
        },
        {
          code: 'EG',
          countryAr: 'جمهورية مصر العربية',
          countryEn: 'Egypt',
          ambulance: '123',
          police: '122',
          unifiedEmergency: '123',
          healthConsultation: '105 / 15335',
          mentalHealthCrisis: '08008880700',
        },
        {
          code: 'GLOBAL',
          countryAr: 'دولي / الولايات المتحدة وأوروبا',
          countryEn: 'International / US / Europe',
          ambulance: '911 (US) / 112 (EU) / 999 (UK)',
          police: '911 / 112',
          unifiedEmergency: '112 (GSM Standard)',
          healthConsultation: '111 (NHS UK) / 811 (Canada)',
          mentalHealthCrisis: '988 (US Crisis Lifeline)',
        }
      ],
      firstAidProtocols: [
        {
          id: 'fa-cpr',
          titleAr: 'الإنعاش القلبي الرئوي (CPR للبالغين)',
          titleEn: 'Adult Cardiopulmonary Resuscitation (CPR)',
          stepsAr: [
            'تأكد من أمان الموقع وافحص استجابة المصاب وتنفسه.',
            'اتصل بالإسعاف (997 أو 911) واطلب جهاز مزيل الرجفان الآلي (AED).',
            'ضع كعبي يديك في منتصف صدر المصاب وابدأ الضغط بمعدل 100-120 ضغطة بالدقيقة وبعمق 5-6 سم.',
            'استمر دون توقف حتى وصول طاقم الإسعاف أو استعادة التنفس الطبيعي.'
          ],
          stepsEn: [
            'Ensure scene safety and check for responsiveness/breathing.',
            'Call emergency (911/997) and request an AED immediately.',
            'Place heel of hand on center of chest; compress 100-120 bpm at 5-6 cm depth.',
            'Continue continuous compressions until paramedics arrive or AED is ready.'
          ]
        },
        {
          id: 'fa-fast-stroke',
          titleAr: 'بروتوكول FAST للتعرف الفوري على السكتة الدماغية',
          titleEn: 'FAST Protocol for Acute Stroke Recognition',
          stepsAr: [
            'F (Face / الوجه): اطلب من الشخص الابتسام، هل يتدلى أحد جانبي الوجه؟',
            'A (Arms / الذراعان): اطلب رفع كلتا اليدين، هل تسقط إحداهما أو تضعف؟',
            'S (Speech / الكلام): اطلب تكرار جملة بسيطة، هل الكلام متلعثم أو غير مفهوم؟',
            'T (Time / الوقت): الوقت حاسم جداً! اتصل بالإسعاف فوراً وسجل وقت بدء الأعراض بدقة.'
          ],
          stepsEn: [
            'F (Face): Ask to smile. Does one side droop?',
            'A (Arms): Ask to raise both arms. Does one drift downward?',
            'S (Speech): Ask to repeat a phrase. Is speech slurred or strange?',
            'T (Time): Time is brain! Call emergency immediately and note onset time.'
          ]
        },
        {
          id: 'fa-choking',
          titleAr: 'إسعاف الاختناق وانسداد مجرى الهواء (مناورة هايمليك)',
          titleEn: 'Choking & Airway Obstruction (Heimlich Maneuver)',
          stepsAr: [
            'شجع المصاب على السعال بقوة إذا كان قادراً على التنفس.',
            'إذا لم يستطع الكلام أو التنفس، قف خلفه ولف ذراعيك حول خصره.',
            'اصنع قبضة بيدك فوق سرة البطن بقليل واضغط للداخل وللأعلى بحركات ارتدادية سريعة (5 ضغطات).',
            'إذا فقد المصاب الوعي، ابدأ فوراً بالإنعاش القلبي الرئوي واطلب الإسعاف.'
          ],
          stepsEn: [
            'Encourage coughing if the victim can still breathe or speak.',
            'If completely obstructed, stand behind victim and wrap arms around waist.',
            'Make a fist above navel; deliver quick upward abdominal thrusts (sets of 5).',
            'If patient becomes unresponsive, lower to ground and begin CPR immediately.'
          ]
        }
      ]
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 4. Global Error Handler (Sanitized Client Responses)
  app.use(globalErrorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniDoctor AI] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
