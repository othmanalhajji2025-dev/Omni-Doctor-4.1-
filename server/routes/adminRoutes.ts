import { Router, Response } from 'express';
import { userDataStore } from '../db/userDataStore.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../auth/middleware.js';
import { UserRole } from '../db/schema.js';
import { sourceRegistry } from '../rag/sourceRegistry.js';
import { documentStore } from '../rag/documentStore.js';
import { ingestionPipeline } from '../rag/ingestionPipeline.js';
import { vectorDatabase } from '../rag/vectorDatabase.js';
import { drugKnowledgeRepository } from '../drugs/dataSourceArchitecture.js';
import { yemenMdStore } from '../drugs/yemenMdStore.js';
import { yemenFacilitiesStore } from '../drugs/yemenFacilitiesStore.js';
import { aiMonitoringStore } from '../monitoring/aiMonitoringStore.js';
import { safetyEventStore } from '../safety/safetyEventStore.js';
import { clinicalSafetyEngine } from '../safety/clinicalSafetyEngine.js';
import { SafetyRiskLevel } from '../types/safety.js';
import { runAllTests } from '../tests/runAllTests.js';

export const adminRouter = Router();

// ==========================================
// STRICT MULTI-TIER RBAC MIDDLEWARE
// "لا تعتمد على إخفاء زر في الواجهة فقط"
// Backend, API, and DB checks enforce 403 Forbidden for unauthorized roles
// ==========================================
adminRouter.use(authenticateToken);
adminRouter.use(requireRole(['ADMINISTRATOR', 'SUPER_ADMIN']));

// ==========================================
// 1. USERS MANAGEMENT MODULE
// ==========================================

/**
 * GET /api/admin/users
 * List all users with search and filtering
 */
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const users = userDataStore.getAllUsers(user);
    const search = (req.query.search as string)?.toLowerCase();
    const roleFilter = req.query.role as UserRole | undefined;
    const statusFilter = req.query.status as string | undefined;

    let filtered = users;
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          (u.fullNameEn && u.fullNameEn.toLowerCase().includes(search)) ||
          u.email.toLowerCase().includes(search) ||
          (u.specialty && u.specialty.toLowerCase().includes(search))
      );
    }
    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter((u) => (u.status || 'ACTIVE') === statusFilter);
    }

    res.json({
      success: true,
      count: filtered.length,
      totalCount: users.length,
      users: filtered,
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user with specific role and profile
 */
adminRouter.post('/users', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestingUser = req.user!;
    const { email, password, fullName, fullNameEn, role, specialty, licenseNumber, age, gender } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (role === 'SUPER_ADMIN' && requestingUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Only Super Admins can create Super Admin accounts',
        messageAr: 'فقط المدير الأعلى يستطيع إنشاء حساب بصلاحية Super Admin',
      });
    }

    const { user: createdUser, profile } = userDataStore.createUser({
      email,
      password,
      fullName,
      fullNameEn,
      role: role || 'USER',
      specialty,
      licenseNumber,
      age: typeof age === 'number' ? age : 30,
      gender: gender || 'MALE',
    });

    res.status(201).json({
      success: true,
      messageAr: `تم إنشاء المستخدم "${createdUser.fullName}" بنجاح`,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        fullNameEn: createdUser.fullNameEn,
        role: createdUser.role,
        specialty: createdUser.specialty,
        licenseNumber: createdUser.licenseNumber,
        status: createdUser.status || 'ACTIVE',
        createdAt: createdUser.createdAt,
      },
      profile,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create user' });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user details
 */
adminRouter.put('/users/:userId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestingUser = req.user!;
    const { userId } = req.params;
    const { email, fullName, fullNameEn, specialty, licenseNumber, phoneNumber, status } = req.body;

    const updated = userDataStore.updateUser(requestingUser, userId, {
      email,
      fullName,
      fullNameEn,
      specialty,
      licenseNumber,
      phoneNumber,
      status,
    });

    res.json({
      success: true,
      messageAr: 'تم تحديث بيانات المستخدم بنجاح',
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        fullNameEn: updated.fullNameEn,
        role: updated.role,
        specialty: updated.specialty,
        licenseNumber: updated.licenseNumber,
        status: updated.status || 'ACTIVE',
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Update failed' });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Modify user role with RBAC privilege checks
 */
adminRouter.put('/users/:userId/role', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { userId } = req.params;
    const { newRole } = req.body;

    const validRoles: UserRole[] = [
      'GUEST',
      'USER',
      'HEALTHCARE_PROFESSIONAL',
      'ADMINISTRATOR',
      'SUPER_ADMIN',
    ];

    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: 'Invalid user role specified' });
    }

    if (user.role === 'ADMINISTRATOR' && newRole === 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Administrators cannot grant Super Admin role',
        messageAr: 'فقط المدير الأعلى يستطيع منح صلاحية Super Admin',
      });
    }

    const updated = userDataStore.updateUserRole(user, userId, newRole);
    res.json({
      success: true,
      message: 'User role updated successfully',
      messageAr: `تم تحديث صلاحية المستخدم إلى: ${newRole}`,
      user: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        status: updated.status || 'ACTIVE',
      },
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

/**
 * PUT /api/admin/users/:userId/status
 * Activate / Suspend user account
 */
adminRouter.put('/users/:userId/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestingUser = req.user!;
    const { userId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = userDataStore.updateUserStatus(requestingUser, userId, status);
    res.json({
      success: true,
      messageAr: `تم تغيير حالة المستخدم إلى ${status}`,
      user: {
        id: updated.id,
        fullName: updated.fullName,
        status: updated.status,
      },
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Status update failed' });
  }
});

/**
 * PUT /api/admin/users/:userId/password
 * Reset user password
 */
adminRouter.put('/users/:userId/password', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestingUser = req.user!;
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    userDataStore.resetUserPassword(requestingUser, userId, newPassword);
    res.json({
      success: true,
      messageAr: 'تمت إعادة تعيين كلمة المرور بنجاح',
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Password reset failed' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete / deactivate user
 */
adminRouter.delete('/users/:userId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestingUser = req.user!;
    const { userId } = req.params;

    const deleted = userDataStore.deleteUser(requestingUser, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      messageAr: 'تم حذف المستخدم وجميع سجلاته بنجاح',
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Delete failed' });
  }
});

// ==========================================
// 2. MEDICAL KNOWLEDGE (RAG) MODULE
// Sources, Documents, Processing, Status
// ==========================================

/**
 * GET /api/admin/knowledge/sources
 */
adminRouter.get('/knowledge/sources', (req: AuthenticatedRequest, res: Response) => {
  try {
    const sources = sourceRegistry.getAllSources();
    const docs = documentStore.getAllDocuments();
    const sourceDocCounts = new Map<string, number>();
    for (const d of docs) {
      sourceDocCounts.set(d.sourceId, (sourceDocCounts.get(d.sourceId) || 0) + 1);
    }

    const enriched = sources.map((s) => ({
      ...s,
      documentsCount: sourceDocCounts.get(s.id) || 0,
    }));

    res.json({
      success: true,
      count: sources.length,
      sources: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/knowledge/sources
 */
adminRouter.post('/knowledge/sources', (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = sourceRegistry.validateSource(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const created = sourceRegistry.registerSource(req.body);
    res.status(201).json({
      success: true,
      messageAr: `تم تسجيل المصدر المعتمد "${created.name}"`,
      source: created,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/knowledge/sources/:id
 */
adminRouter.put('/knowledge/sources/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = sourceRegistry.updateSource(req.params.id, req.body);
    res.json({
      success: true,
      messageAr: 'تم تحديث المصدر بنجاح',
      source: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/knowledge/sources/:id
 */
adminRouter.delete('/knowledge/sources/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const linked = documentStore.getDocumentsBySourceId(req.params.id);
    if (linked.length > 0) {
      return res.status(400).json({
        error: `Cannot delete: ${linked.length} documents linked to this source.`,
        messageAr: `لا يمكن حذف المصدر لوجود ${linked.length} مستند مرتبط به.`,
      });
    }
    const deleted = sourceRegistry.deleteSource(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Source not found' });
    res.json({ success: true, messageAr: 'تم حذف المصدر بنجاح' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/knowledge/documents
 */
adminRouter.get('/knowledge/documents', (req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = documentStore.getAllDocuments();
    const sources = new Map(sourceRegistry.getAllSources().map((s) => [s.id, s]));

    const enriched = docs.map((d) => {
      const src = sources.get(d.sourceId);
      return {
        ...d,
        sourceName: src?.name || 'Unknown Source',
        sourceOrg: src?.organization || 'N/A',
        authorityLevel: src?.authorityLevel || 'TIER_3_ACADEMIC_INSTITUTE',
      };
    });

    res.json({
      success: true,
      count: docs.length,
      documents: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/knowledge/documents
 */
adminRouter.post('/knowledge/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newDoc = documentStore.createDocument(req.body);
    let ingestionResult = null;
    if (req.body.autoIngest !== false) {
      ingestionResult = await ingestionPipeline.ingestDocument(newDoc.id);
    }

    res.status(201).json({
      success: true,
      messageAr: `تم إنشاء المستند السريري "${newDoc.title}"`,
      document: documentStore.getDocumentById(newDoc.id),
      ingestionResult,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/knowledge/documents/:id/ingest
 * Trigger Processing pipeline for single document
 */
adminRouter.post('/knowledge/documents/:id/ingest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await ingestionPipeline.ingestDocument(req.params.id);
    res.json({
      success: result.success,
      result,
      messageAr: result.success
        ? `تمت معالجة وتقطيع وفهرسة المستند بنجاح (${result.chunksCreated} مقطع).`
        : `فشلت معالجة المستند: ${(result as any).errors?.join(', ') || (result as any).error || 'خطأ غير محدد'}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/knowledge/ingest-all
 * Batch Processing pipeline for all documents
 */
adminRouter.post('/knowledge/ingest-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const results = await ingestionPipeline.ingestAll();
    const successful = results.filter((r) => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);

    res.json({
      success: true,
      messageAr: `تمت معالجة وفهرسة ${successful} من أصل ${results.length} مستند (${totalChunks} مقطع في قاعدة المتجهات).`,
      totalProcessed: results.length,
      successful,
      totalChunks,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/knowledge/status
 * Telemetry & Status of vector store and ingestion
 */
adminRouter.get('/knowledge/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const telemetry = vectorDatabase.getTelemetry();
    const docs = documentStore.getAllDocuments();
    const sources = sourceRegistry.getAllSources();

    res.json({
      success: true,
      status: {
        totalSources: sources.length,
        totalDocuments: docs.length,
        indexedDocuments: docs.filter((d) => d.status === 'INDEXED').length,
        pendingDocuments: docs.filter((d) => d.status === 'PROCESSED' || (d.status as string) === 'DRAFT').length,
        failedDocuments: docs.filter((d) => d.status === 'FAILED').length,
        vectorDb: telemetry,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. DRUG DATABASE MODULE
// Pharmacology Data, Class, Warnings, Adapters
// ==========================================

/**
 * GET /api/admin/drugs
 */
adminRouter.get('/drugs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profiles = await drugKnowledgeRepository.getAllProfiles();
    const sources = drugKnowledgeRepository.getAllSourcesInfo();

    res.json({
      success: true,
      count: profiles.length,
      profiles,
      drugs: profiles,
      sources,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/drugs/sources
 */
adminRouter.get('/drugs/sources', (req: AuthenticatedRequest, res: Response) => {
  try {
    const sources = drugKnowledgeRepository.getAllSourcesInfo();
    res.json({ success: true, sources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. YEMENMD (LOCAL DATA MANAGEMENT) MODULE
// Local drugs, Emergency facilities, Endemic alerts
// ==========================================

/**
 * GET /api/admin/yemenmd/drugs
 */
adminRouter.get('/yemenmd/drugs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    const drugs = yemenMdStore.search(query);
    const stats = yemenMdStore.getStatistics();
    res.json({
      success: true,
      count: drugs.length,
      drugs,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/yemenmd/drugs
 */
adminRouter.post('/yemenmd/drugs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { GenericName, BrandName, Strength, DosageForm, Manufacturer, Country, Availability, estimatedPriceYer, DomesticTradeNameAr } = req.body;
    if (!GenericName || !BrandName || !Manufacturer) {
      return res.status(400).json({ error: 'GenericName, BrandName, and Manufacturer are required.' });
    }

    const created = yemenMdStore.addDrug({
      GenericName,
      BrandName,
      Strength: Strength || 'N/A',
      DosageForm: DosageForm || 'Tablet',
      Manufacturer,
      Country: Country || 'Yemen',
      Availability: Availability || 'AVAILABLE',
      estimatedPriceYer: typeof estimatedPriceYer === 'number' ? estimatedPriceYer : undefined,
    });

    res.status(201).json({
      success: true,
      messageAr: `تمت إضافة الدواء المحلي "${created.BrandName}" بنجاح`,
      drug: created,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/yemenmd/facilities
 */
adminRouter.get('/yemenmd/facilities', (req: AuthenticatedRequest, res: Response) => {
  try {
    const facilities = yemenFacilitiesStore.getAllFacilities();
    res.json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/yemenmd/facilities
 */
adminRouter.post('/yemenmd/facilities', (req: AuthenticatedRequest, res: Response) => {
  try {
    const created = yemenFacilitiesStore.addFacility(req.body);
    res.status(201).json({
      success: true,
      messageAr: `تمت إضافة المنشأة الطبية "${created.nameAr}"`,
      facility: created,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/yemenmd/facilities/:id
 */
adminRouter.put('/yemenmd/facilities/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = yemenFacilitiesStore.updateFacility(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Facility not found' });
    res.json({
      success: true,
      messageAr: 'تم تحديث بيانات المنشأة الطبية بنجاح',
      facility: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/yemenmd/facilities/:id
 */
adminRouter.delete('/yemenmd/facilities/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = yemenFacilitiesStore.deleteFacility(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Facility not found' });
    res.json({ success: true, messageAr: 'تم حذف المنشأة الطبية' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/yemenmd/endemics
 */
adminRouter.get('/yemenmd/endemics', (req: AuthenticatedRequest, res: Response) => {
  try {
    const endemics = yemenFacilitiesStore.getAllEndemics();
    res.json({
      success: true,
      count: endemics.length,
      endemics,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/yemenmd/endemics
 */
adminRouter.post('/yemenmd/endemics', (req: AuthenticatedRequest, res: Response) => {
  try {
    const created = yemenFacilitiesStore.addEndemicAlert(req.body);
    res.status(201).json({
      success: true,
      messageAr: `تم تسجيل تنبيه الترصد الوبائي "${created.diseaseNameAr}"`,
      endemic: created,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/yemenmd/endemics/:id
 */
adminRouter.put('/yemenmd/endemics/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = yemenFacilitiesStore.updateEndemicAlert(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    res.json({
      success: true,
      messageAr: 'تم تحديث التنبيه الوبائي بنجاح',
      endemic: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. AI MONITORING MODULE
// Requests, Errors, Latency, Token Usage
// Privacy Principle: No PII exposure
// ==========================================

/**
 * GET /api/admin/monitoring/overview
 */
adminRouter.get('/monitoring/overview', (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = aiMonitoringStore.getSummary();
    res.json({
      success: true,
      summary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/monitoring/logs
 */
adminRouter.get('/monitoring/logs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const model = req.query.model as string | undefined;
    const endpoint = req.query.endpoint as string | undefined;
    const errorsOnly = req.query.errorsOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const logs = aiMonitoringStore.getLogs({ model, endpoint, errorsOnly, limit });
    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/monitoring/simulate
 * Simulates traffic for live dashboard inspection
 */
adminRouter.post('/monitoring/simulate', (req: AuthenticatedRequest, res: Response) => {
  try {
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.7-flash'];
    const endpoints = ['/api/chat', '/api/rag/retrieve', '/api/safety/evaluate', '/api/labs/interpret'];
    const intents = ['Symptom Triage Inquiry', 'Drug Interaction Screening', 'Lab Context Analysis', 'Guideline Search'];

    const count = typeof req.body.count === 'number' ? Math.min(req.body.count, 20) : 5;
    const generated: any[] = [];

    for (let i = 0; i < count; i++) {
      const model = models[Math.floor(Math.random() * models.length)];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const isError = Math.random() < 0.15;
      const latency = isError ? 1200 : model === 'gemini-2.5-pro' ? 700 : 250;
      const promptTokens = 200 + Math.floor(Math.random() * 300);
      const responseTokens = isError ? 0 : 350 + Math.floor(Math.random() * 400);

      const log = aiMonitoringStore.logRequest({
        endpoint,
        model,
        latencyMs: latency + Math.floor(Math.random() * 200),
        promptTokens,
        responseTokens,
        totalTokens: promptTokens + responseTokens,
        statusCode: isError ? 500 : 200,
        success: !isError,
        errorCategory: isError ? 'RATE_LIMIT' : 'NONE',
        anonymizedIntent: intents[Math.floor(Math.random() * intents.length)],
        characterCount: 150 + Math.floor(Math.random() * 300),
      });
      generated.push(log);
    }

    res.json({
      success: true,
      messageAr: `تم توليد ${generated.length} طلب تجريبي وتحديث الإحصائيات في الوقت الفعلي`,
      count: generated.length,
      logs: generated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. SAFETY EVENTS MODULE
// Risk Level, Triggered Rules, Timestamp, Review Status
// ==========================================

/**
 * GET /api/admin/safety-events
 */
adminRouter.get('/safety-events', (req: AuthenticatedRequest, res: Response) => {
  try {
    const riskLevel = req.query.riskLevel as SafetyRiskLevel | undefined;
    const reviewStatus = req.query.reviewStatus as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const events = safetyEventStore.getEvents({ riskLevel, reviewStatus, limit });
    const metrics = safetyEventStore.getMetrics();

    res.json({
      success: true,
      count: events.length,
      metrics,
      events,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/safety-events/:eventId/review
 * Update Review Status with Clinical Supervisor Notes
 */
adminRouter.put('/safety-events/:eventId/review', (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewer = req.user!;
    const { eventId } = req.params;
    const { reviewStatus, reviewerNotes } = req.body;

    if (!reviewStatus || !['PENDING_REVIEW', 'INVESTIGATED', 'DISMISSED', 'RESOLVED'].includes(reviewStatus)) {
      return res.status(400).json({ error: 'Valid reviewStatus is required' });
    }

    const updated = safetyEventStore.updateReviewStatus(
      eventId,
      reviewStatus,
      reviewer.fullName || reviewer.email,
      reviewerNotes
    );

    if (!updated) {
      return res.status(404).json({ error: 'Safety event not found' });
    }

    res.json({
      success: true,
      messageAr: 'تم تحديث حالة المراجعة السريرية للحدث بنجاح',
      event: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/safety-events/test-incident
 * Trigger a simulated high-risk safety event for drills
 */
adminRouter.post('/safety-events/test-incident', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { riskLevel = 'EMERGENCY', symptom = 'ألم ضاغط شديد في الصدر مع تعرق بارد وضيق تنفس' } = req.body;

    const result = clinicalSafetyEngine.evaluate({
      text: symptom,
      symptoms: symptom,
      severity: 'SEVERE',
      painScale: 9,
      vitalSigns: { systolicBP: 170, heartRate: 110, spO2: 92 },
      patientContext: { age: 58, gender: 'MALE', chronicConditions: ['Hypertension', 'Diabetes'] },
    });

    res.json({
      success: true,
      messageAr: 'تم تشغيل محاكاة حدث سلامة سريري بنجاح وتسجيله في سجل التدقيق الأمني',
      result,
      safetyEventsCount: safetyEventStore.getEvents().length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. RBAC MATRIX & AUDIT MODULE
// Multi-layer security: Frontend, Backend, API, DB
// ==========================================

/**
 * GET /api/admin/rbac/matrix
 */
adminRouter.get('/rbac/matrix', (req: AuthenticatedRequest, res: Response) => {
  const matrix = [
    {
      module: 'Medical Documents & Labs',
      frontend: 'Visible for all authenticated patients & doctors',
      backend: 'Require valid User Token (Strict Patient Isolation)',
      api: '/api/documents/*, /api/labs/*',
      dbAccess: 'Single-tenant user isolation enforced in userDataStore',
      guestAccess: 'Ephemeral OCR only (No storage)',
      userAccess: 'Full personal health records',
      doctorAccess: 'Full patient health records with clinical notes',
      adminAccess: 'Governance & audit logs',
      superAdminAccess: 'Full administrative access',
    },
    {
      module: 'Clinical Safety Engine',
      frontend: 'Emergency Banner displayed prominently to all users',
      backend: 'Stateless deterministic clinical rule execution',
      api: '/api/safety/evaluate',
      dbAccess: 'Anonymized logging (No PII stored in DB)',
      guestAccess: 'Full emergency evaluation & hotline triggers',
      userAccess: 'Full emergency evaluation & hotline triggers',
      doctorAccess: 'Full emergency evaluation & protocol overrides',
      adminAccess: 'Audit logs & Review Status management',
      superAdminAccess: 'Full rule governance & incident review',
    },
    {
      module: 'Drug & YemenMD Intelligence',
      frontend: 'Search & interaction checker visible for all users',
      backend: 'Verified Pharmacopeia & Local Yemen Registry',
      api: '/api/drugs/*, /api/yemenmd/*',
      dbAccess: 'Read-only for users; Write restricted to Admins',
      guestAccess: 'Read-only search & warnings',
      userAccess: 'Read-only search, local availability & alerts',
      doctorAccess: 'Full pharmacology, dosages & hospital guidelines',
      adminAccess: 'CRUD on local drug catalog & facilities',
      superAdminAccess: 'Full pharmaceutical catalog governance',
    },
    {
      module: 'Admin Dashboard & Telemetry',
      frontend: 'Protected Tab (Hidden from User & Doctor UI)',
      backend: 'Strict requireRole(["ADMINISTRATOR", "SUPER_ADMIN"])',
      api: '/api/admin/*',
      dbAccess: 'Multi-tenant admin inspection & user management',
      guestAccess: 'Blocked (401 / 403 Forbidden)',
      userAccess: 'Blocked (403 Forbidden)',
      doctorAccess: 'Blocked (403 Forbidden)',
      adminAccess: 'Full dashboard, user management, knowledge & safety',
      superAdminAccess: 'Full system ownership & role promotion',
    },
  ];

  res.json({
    success: true,
    userRole: req.user!.role,
    matrix,
  });
});

/**
 * POST /api/admin/test-suite
 * Executes Phase 10 Comprehensive Verification Suite across Auth, RBAC, Isolation, Safety, RAG, and Security
 */
adminRouter.post('/test-suite', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await runAllTests();
    
    // Flatten test results for UI consumption
    const testResults = report.suites.flatMap((suite) =>
      suite.results.map((r) => ({
        layer: suite.name,
        name: r.name,
        descriptionAr: r.message,
        passed: r.passed,
        details: `${r.message} (${r.durationMs}ms)`,
      }))
    );

    res.json({
      success: true,
      allPassed: report.allPassed,
      totalTests: report.totalTests,
      passedTests: report.passedTests,
      failedTests: report.failedTests,
      totalDurationMs: report.totalDurationMs,
      executedAt: report.timestamp,
      testedBy: req.user!.email,
      testResults,
      suites: report.suites,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to execute test suite' });
  }
});

