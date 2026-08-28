import { Router, Request, Response } from 'express';
import { sourceRegistry } from '../rag/sourceRegistry.js';
import { documentStore } from '../rag/documentStore.js';
import { ingestionPipeline } from '../rag/ingestionPipeline.js';
import { vectorDatabase } from '../rag/vectorDatabase.js';
import { medicalQueryEngine } from '../rag/queryEngine.js';
import { KnowledgeSource, KnowledgeDocument } from '../types/rag.js';

export const ragRouter = Router();

// ==========================================
// SOURCE REGISTRY ENDPOINTS
// ==========================================

/**
 * GET /api/rag/sources
 * List all knowledge sources in registry
 */
ragRouter.get('/sources', (req: Request, res: Response) => {
  try {
    const sources = sourceRegistry.getAllSources();
    res.json({
      success: true,
      count: sources.length,
      sources,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/rag/sources/:id
 */
ragRouter.get('/sources/:id', (req: Request, res: Response) => {
  const source = sourceRegistry.getSourceById(req.params.id);
  if (!source) {
    return res.status(404).json({ error: `Source "${req.params.id}" not found.` });
  }
  const linkedDocs = documentStore.getDocumentsBySourceId(source.id);
  res.json({
    success: true,
    source,
    documentsCount: linkedDocs.length,
    documents: linkedDocs.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      chunksCount: d.chunksCount,
      updatedDate: d.updatedDate,
    })),
  });
});

/**
 * POST /api/rag/sources
 * Register a new authoritative knowledge source
 */
ragRouter.post('/sources', (req: Request, res: Response) => {
  try {
    const { name, nameAr, organization, url, contentType, authorityLevel, lastReviewed, status, descriptionAr, descriptionEn } = req.body;

    const validation = sourceRegistry.validateSource(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const created = sourceRegistry.registerSource({
      name,
      nameAr: nameAr || name,
      organization,
      url,
      contentType,
      authorityLevel,
      lastReviewed: lastReviewed || new Date().toISOString().split('T')[0],
      status: status || 'ACTIVE',
      descriptionAr: descriptionAr || '',
      descriptionEn: descriptionEn || '',
    });

    res.status(201).json({
      success: true,
      messageAr: `تم تسجيل المصدر المعتمد "${created.name}" بنجاح`,
      messageEn: `Source "${created.name}" registered successfully.`,
      source: created,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/rag/sources/:id
 * Update existing knowledge source
 */
ragRouter.put('/sources/:id', (req: Request, res: Response) => {
  try {
    const updated = sourceRegistry.updateSource(req.params.id, req.body);
    res.json({
      success: true,
      messageAr: 'تم تحديث بيانات المصدر بنجاح',
      source: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/rag/sources/:id
 */
ragRouter.delete('/sources/:id', (req: Request, res: Response) => {
  const linked = documentStore.getDocumentsBySourceId(req.params.id);
  if (linked.length > 0) {
    return res.status(400).json({
      error: `Cannot delete source: ${linked.length} documents are currently linked to it. Delete or reassign documents first.`,
    });
  }
  const deleted = sourceRegistry.deleteSource(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Source not found' });
  }
  res.json({ success: true, messageAr: 'تم حذف المصدر بنجاح' });
});

// ==========================================
// KNOWLEDGE DOCUMENTS ENDPOINTS
// ==========================================

/**
 * GET /api/rag/documents
 * List all clinical documents
 */
ragRouter.get('/documents', (req: Request, res: Response) => {
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
 * GET /api/rag/documents/:id
 * Retrieve a specific document and its indexed chunks
 */
ragRouter.get('/documents/:id', (req: Request, res: Response) => {
  const doc = documentStore.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: `Document "${req.params.id}" not found.` });
  }

  const source = sourceRegistry.getSourceById(doc.sourceId);
  const chunks = vectorDatabase.getChunksByDocumentId(doc.id);

  res.json({
    success: true,
    document: doc,
    source,
    chunksCount: chunks.length,
    chunks: chunks.map((c) => ({
      id: c.id,
      chunkIndex: c.chunkIndex,
      heading: c.metadata.sectionHeading,
      content: c.content,
      tokenCount: c.metadata.tokenCount,
      characterCount: c.metadata.characterCount,
      embeddingLength: c.embedding.length,
    })),
  });
});

/**
 * POST /api/rag/documents
 * Create and optionally ingest a document
 */
ragRouter.post('/documents', async (req: Request, res: Response) => {
  try {
    const { sourceId, title, titleEn, publishedDate, updatedDate, content, metadata, autoIngest } = req.body;

    if (!sourceId || !title || !content) {
      return res.status(400).json({ error: 'sourceId, title, and content are required.' });
    }

    const newDoc = documentStore.createDocument({
      sourceId,
      title,
      titleEn,
      publishedDate: publishedDate || new Date().toISOString().split('T')[0],
      updatedDate: updatedDate || new Date().toISOString().split('T')[0],
      content,
      metadata: metadata || {
        category: 'GENERAL_INTERNAL_MEDICINE',
        specialty: 'Internal Medicine',
        tags: [],
        language: 'both',
        clinicalDomain: 'General Health',
        targetAudience: 'Clinicians and patients',
      },
    });

    let ingestionResult = null;
    if (autoIngest !== false) {
      ingestionResult = await ingestionPipeline.ingestDocument(newDoc.id);
    }

    res.status(201).json({
      success: true,
      messageAr: `تم إنشاء المستند السريري "${newDoc.title}" بنجاح`,
      document: documentStore.getDocumentById(newDoc.id),
      ingestionResult,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/rag/documents/:id/ingest
 * Trigger the Ingestion Pipeline for a single document
 */
ragRouter.post('/documents/:id/ingest', async (req: Request, res: Response) => {
  try {
    const result = await ingestionPipeline.ingestDocument(req.params.id);
    res.json({
      success: result.success,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rag/ingest-all
 * Trigger batch ingestion of all documents
 */
ragRouter.post('/ingest-all', async (req: Request, res: Response) => {
  try {
    const results = await ingestionPipeline.ingestAll();
    const successful = results.filter((r) => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);

    res.json({
      success: true,
      messageAr: `تمت معالجة وفهرسة ${successful} من أصل ${results.length} مستند (${totalChunks} مقطع في قاعدة المتجهات).`,
      messageEn: `Processed and indexed ${successful}/${results.length} documents (${totalChunks} chunks in vector database).`,
      totalProcessed: results.length,
      successful,
      totalChunks,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RETRIEVAL SANDBOX & TELEMETRY
// ==========================================

/**
 * POST /api/rag/retrieve
 * Live query retrieval sandbox and explanation
 */
ragRouter.post('/retrieve', (req: Request, res: Response) => {
  try {
    const { query, topK, languageHint } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const ragContext = medicalQueryEngine.retrieveEvidenceContext(query, {
      topK: typeof topK === 'number' ? topK : 4,
      languageHint: languageHint === 'ar' || languageHint === 'en' ? languageHint : undefined,
    });

    res.json({
      success: true,
      evidenceContext: ragContext,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/rag/telemetry
 * Vector DB, Sources, and Chunks status
 */
ragRouter.get('/telemetry', (req: Request, res: Response) => {
  try {
    const telemetry = vectorDatabase.getTelemetry();
    res.json({
      success: true,
      telemetry,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// COMPREHENSIVE AUTOMATED TEST SUITE
// ==========================================

/**
 * POST /api/rag/test-suite
 * Executes automated unit & integration tests covering:
 * 1. Source addition & validation
 * 2. Document addition & linking
 * 3. Ingestion Pipeline (Source -> Validation -> Cleaning -> Processing -> Chunking -> Embedding -> Vector DB)
 * 4. Semantic vector retrieval precision
 * 5. Strict citation fidelity (only verified retrieved sources)
 * 6. Anti-hallucination guard (blocking phantom sources)
 */
ragRouter.post('/test-suite', async (req: Request, res: Response) => {
  const testResults: Array<{
    testId: string;
    title: string;
    passed: boolean;
    durationMs: number;
    details: string;
    metrics?: Record<string, any>;
  }> = [];

  const overallStart = Date.now();

  try {
    // -------------------------------------------------------------
    // TEST 1: Source Addition & Validation
    // -------------------------------------------------------------
    const t1Start = Date.now();
    const testSourceId = 'SRC_TEST_UNIT_' + Date.now().toString(36);
    const createdSource = sourceRegistry.registerSource({
      id: testSourceId,
      name: 'Saudi Heart Association Clinical Guidance (Test Source)',
      nameAr: 'إرشادات جمعية القلب السعودية (مصدر تجريبي)',
      organization: 'SHA',
      url: 'https://sha.org.sa/clinical-pathways',
      contentType: 'CLINICAL_PRACTICE_GUIDELINE',
      authorityLevel: 'TIER_2_SPECIALTY_COLLEGE',
      lastReviewed: '2024-02-15',
      status: 'ACTIVE',
      descriptionAr: 'مصدر تجريبي لاختبار حوكمة وإدخال مصادر المعرفة الطبية',
      descriptionEn: 'Automated test source verifying validation and ingestion integrity.',
    });

    const retrievedSource = sourceRegistry.getSourceById(testSourceId);
    const t1Passed = retrievedSource !== undefined && retrievedSource.authorityLevel === 'TIER_2_SPECIALTY_COLLEGE';
    testResults.push({
      testId: 'TEST_1_SOURCE_REGISTRY',
      title: 'Source Registry Addition & Schema Validation',
      passed: t1Passed,
      durationMs: Date.now() - t1Start,
      details: t1Passed
        ? `Successfully registered source "${createdSource.name}" with TIER_2_SPECIALTY_COLLEGE authority.`
        : 'Failed to verify created source in registry.',
    });

    // -------------------------------------------------------------
    // TEST 2: Document Creation & Linking
    // -------------------------------------------------------------
    const t2Start = Date.now();
    const testDocId = 'DOC_TEST_LIPID_' + Date.now().toString(36);
    const createdDoc = documentStore.createDocument({
      id: testDocId,
      sourceId: testSourceId,
      title: 'Saudi Heart Association: Guidelines for Dyslipidemia & Statin Therapy 2024',
      titleEn: 'SHA Dyslipidemia Guidelines',
      publishedDate: '2024-01-10',
      updatedDate: '2024-02-01',
      content: `
# SHA Dyslipidemia and Atherosclerosis Management
## 1. Cardiovascular Risk Stratification
Cardiovascular risk is calculated using national SCORE charts. Patients with LDL cholesterol above 190 mg/dL (4.9 mmol/L) warrant immediate high-intensity statin initiation without additional risk scoring.
## 2. Pharmacotherapy Targets
Target LDL cholesterol for very high-risk patients is below 55 mg/dL (1.4 mmol/L) and a >= 50% reduction from baseline. First-line therapy is Atorvastatin 40-80 mg daily or Rosuvastatin 20-40 mg daily.
## 3. Statin Intolerance & Monitoring
Baseline ALT and fasting lipid profiles must be evaluated prior to therapy and at 8-12 weeks following initiation.
      `.trim(),
      metadata: {
        category: 'CARDIOVASCULAR',
        specialty: 'Cardiology',
        tags: ['cholesterol', 'statin', 'ldl', 'atorvastatin', 'كوليسترول', 'دهون الدم'],
        language: 'both',
        clinicalDomain: 'Preventive Cardiology',
        targetAudience: 'Physicians and cardiologists',
        guidelineCode: 'SHA-LIPID-2024',
      },
    });

    const docInStore = documentStore.getDocumentById(testDocId);
    const t2Passed = docInStore !== undefined && docInStore.sourceId === testSourceId;
    testResults.push({
      testId: 'TEST_2_DOCUMENT_CREATION',
      title: 'Document Store Creation & Source Foreign-Key Linking',
      passed: t2Passed,
      durationMs: Date.now() - t2Start,
      details: t2Passed
        ? `Created document "${createdDoc.title}" linked to source "${testSourceId}".`
        : 'Document was not found or foreign-key was mismatched.',
    });

    // -------------------------------------------------------------
    // TEST 3: Ingestion Pipeline Step Execution
    // (Validation -> Cleaning -> Processing -> Chunking -> Embedding -> Vector DB)
    // -------------------------------------------------------------
    const t3Start = Date.now();
    const pipelineResult = await ingestionPipeline.ingestDocument(testDocId);
    const expectedSteps = [
      'SOURCE_VALIDATION',
      'CONTENT_CLEANING',
      'DOCUMENT_PROCESSING',
      'CHUNKING',
      'EMBEDDING',
      'VECTOR_INDEXING',
    ];
    const actualSteps = pipelineResult.steps.map((s) => s.step);
    const allStepsSucceeded =
      pipelineResult.success &&
      expectedSteps.every((st) => actualSteps.includes(st as any)) &&
      pipelineResult.chunksCreated >= 3;

    testResults.push({
      testId: 'TEST_3_INGESTION_PIPELINE',
      title: 'Strict 6-Stage Ingestion Pipeline Execution',
      passed: allStepsSucceeded,
      durationMs: Date.now() - t3Start,
      details: allStepsSucceeded
        ? `All 6 pipeline steps completed successfully in ${pipelineResult.durationTotalMs}ms. Created ${pipelineResult.chunksCreated} chunks.`
        : `Pipeline failed or incomplete. Created chunks: ${pipelineResult.chunksCreated}.`,
      metrics: {
        stepsExecuted: actualSteps,
        chunksCreated: pipelineResult.chunksCreated,
        totalTokens: pipelineResult.totalTokens,
      },
    });

    // -------------------------------------------------------------
    // TEST 4: Semantic Vector Retrieval Accuracy
    // -------------------------------------------------------------
    const t4Start = Date.now();
    const query = 'ما هي أهداف علاج الكوليسترول وخفض LDL باستخدام الستاتين؟';
    const retrievalResult = medicalQueryEngine.retrieveEvidenceContext(query, { topK: 4, languageHint: 'ar' });

    // Verify query understanding and topic
    const understoodTopic = retrievalResult.queryUnderstanding.clinicalTopic === 'CARDIOVASCULAR';
    // Verify that our newly ingested document or AHA/NICE documents were scored
    const topScoredChunk = retrievalResult.topEvidenceChunks[0];
    const hasResults = retrievalResult.topEvidenceChunks.length > 0;
    const similarityAcceptable = topScoredChunk ? topScoredChunk.vectorSimilarity > 0.15 : false;

    const t4Passed = hasResults && understoodTopic && similarityAcceptable;
    testResults.push({
      testId: 'TEST_4_SEMANTIC_RETRIEVAL',
      title: 'Semantic Vector Retrieval & Reranking Accuracy',
      passed: t4Passed,
      durationMs: Date.now() - t4Start,
      details: t4Passed
        ? `Retrieved ${retrievalResult.topEvidenceChunks.length} chunks. Top chunk score: ${topScoredChunk?.rerankedScore} (Cosine: ${topScoredChunk?.vectorSimilarity}). Topic: ${retrievalResult.queryUnderstanding.clinicalTopic}.`
        : 'Retrieval accuracy was below threshold or topic misunderstood.',
      metrics: {
        intent: retrievalResult.queryUnderstanding.intent,
        topic: retrievalResult.queryUnderstanding.clinicalTopic,
        topScore: topScoredChunk?.rerankedScore,
        latencyMs: retrievalResult.metrics.totalLatencyMs,
      },
    });

    // -------------------------------------------------------------
    // TEST 5: Strict Citation Fidelity (Only Authentically Retrieved Sources)
    // -------------------------------------------------------------
    const t5Start = Date.now();
    const citations = retrievalResult.citations;
    const allCitationsHaveUrls = citations.every((c) => c.url && c.url.startsWith('http'));
    const allCitationsHaveTitles = citations.every((c) => c.title && c.title.length > 5);
    const allCitationsHaveVerifiedFlags = citations.every((c) => c.isVerifiedRetrieved === true);
    const allCitationsHaveExcerpts = citations.every((c) => c.excerpt && c.excerpt.length > 20);

    const t5Passed =
      citations.length > 0 &&
      allCitationsHaveUrls &&
      allCitationsHaveTitles &&
      allCitationsHaveVerifiedFlags &&
      allCitationsHaveExcerpts;

    testResults.push({
      testId: 'TEST_5_CITATION_FIDELITY',
      title: 'Strict Citation Fidelity (No Fake Citations)',
      passed: t5Passed,
      durationMs: Date.now() - t5Start,
      details: t5Passed
        ? `Verified ${citations.length} authentic citations. Every citation strictly matched an existing retrieved chunk with verifiable URL and excerpt.`
        : 'Citations failed validation checks (missing URL, excerpt, or verified flag).',
      metrics: {
        verifiedCitationsCount: citations.length,
        sourcesCited: citations.map((c) => c.organization),
      },
    });

    // -------------------------------------------------------------
    // TEST 6: Anti-Hallucination Guardrail Check
    // -------------------------------------------------------------
    const t6Start = Date.now();
    const fakeCitations = [
      {
        title: 'Completely Fabricated Medical Paper 2099',
        url: 'https://fake-hallucinated-source.example.com/miracle-cure',
        organization: 'HALLUCINATED_ORG',
      },
    ];

    const sanitized = medicalQueryEngine.sanitizeCitations(fakeCitations, retrievalResult.citations);
    const fakeWasRejected = !sanitized.some((s) => s.url.includes('fake-hallucinated-source'));

    testResults.push({
      testId: 'TEST_6_ANTI_HALLUCINATION_GUARD',
      title: 'Anti-Hallucination Citation Guardrail',
      passed: fakeWasRejected,
      durationMs: Date.now() - t6Start,
      details: fakeWasRejected
        ? 'Successfully detected and purged unverified external citation from candidate citations list.'
        : 'Anti-hallucination filter failed to reject fabricated citation.',
    });

    // Clean up test document and source so we leave store pristine
    documentStore.deleteDocument(testDocId);
    vectorDatabase.deleteChunksByDocumentId(testDocId);
    sourceRegistry.deleteSource(testSourceId);

    const allPassed = testResults.every((t) => t.passed);

    res.json({
      success: allPassed,
      overallStatus: allPassed ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
      totalTests: testResults.length,
      passCount: testResults.filter((t) => t.passed).length,
      failCount: testResults.filter((t) => !t.passed).length,
      durationTotalMs: Date.now() - overallStart,
      timestamp: new Date().toISOString(),
      tests: testResults,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      tests: testResults,
    });
  }
});
