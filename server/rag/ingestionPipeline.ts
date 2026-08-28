import {
  KnowledgeDocument,
  DocumentChunk,
  IngestionPipelineResult,
  IngestionStepAudit,
  ChunkMetadata,
  ChunkSourceReference,
} from '../types/rag.js';
import { sourceRegistry } from './sourceRegistry.js';
import { documentStore } from './documentStore.js';
import { vectorDatabase } from './vectorDatabase.js';

// ==========================================
// MEDICAL ONTOLOGY & SEMANTIC VOCABULARY
// Bridges Arabic and English clinical terms
// ==========================================
export const MEDICAL_ONTOLOGY: Record<string, { category: string; synonyms: string[] }> = {
  hypertension: {
    category: 'CARDIOVASCULAR',
    synonyms: ['ضغط الدم', 'ارتفاع الضغط', 'ضغط مرتفع', 'blood pressure', 'htn', 'bp', 'ramipril', 'amlodipine', 'lisinopril', 'ace-i', 'arb'],
  },
  diabetes: {
    category: 'ENDOCRINE_METABOLIC',
    synonyms: ['السكري', 'السكر', 'السكر التراكمي', 'تراكمي', 'ميتفورمين', 'glucose', 'hba1c', 'metformin', 'insulin', 'hyperglycemia', 'sglt2'],
  },
  chest_pain: {
    category: 'CARDIOVASCULAR',
    synonyms: ['ألم الصدر', 'الم بالصدر', 'ذبحة', 'نوبة قلبية', 'جلطة قلبية', 'chest pain', 'angina', 'myocardial infarction', 'stemi', 'troponin', 'ecg'],
  },
  dyspnea: {
    category: 'RESPIRATORY',
    synonyms: ['ضيق تنفس', 'كتمة', 'صعوبة تنفس', 'اختناق', 'shortness of breath', 'dyspnea', 'breathlessness', 'airway'],
  },
  respiratory_infection: {
    category: 'INFECTIOUS_RESPIRATORY',
    synonyms: ['نزلة برد', 'انفلونزا', 'رشح', 'سعال', 'كحة', 'احتقان الحلق', 'بلعوم', 'cold', 'flu', 'cough', 'sore throat', 'pharyngitis', 'antibiotic'],
  },
  headache: {
    category: 'NEUROLOGY',
    synonyms: ['صداع', 'شقيقة', 'صداع نصفي', 'ألم الرأس', 'headache', 'migraine', 'thunderclap', 'snoop', 'triptan'],
  },
  uti: {
    category: 'UROLOGY_NEPHROLOGY',
    synonyms: ['مسالك بولية', 'التهاب البول', 'حرقة البول', 'عسر تبول', 'حصوة', 'كلى', 'خاصرة', 'uti', 'cystitis', 'pyelonephritis', 'dysuria', 'hematuria', 'flank pain'],
  },
  gerd: {
    category: 'GASTROENTEROLOGY',
    synonyms: ['حموضة', 'حرقان', 'ارتجاع المريء', 'المعدة', 'عسر هضم', 'gerd', 'reflux', 'heartburn', 'dyspepsia', 'ppi', 'omeprazole'],
  },
  anticoagulation_bleeding: {
    category: 'PHARMACOLOGY_DRUG_SAFETY',
    synonyms: ['وارفارين', 'نزيف', 'تفاعل دوائي', 'ايبوبروفين', 'مسكنات', 'warfarin', 'bleeding', 'nsaid', 'ibuprofen', 'interaction', 'hemorrhage', 'inr'],
  },
  stroke: {
    category: 'NEUROLOGY',
    synonyms: ['سكتة دماغية', 'جلطة دماغية', 'شلل نصفي', 'ثقل اللسان', 'اعوجاج الوجه', 'stroke', 'fast', 'slurred speech', 'facial droop', 'hemiparesis'],
  },
};

/**
 * Deterministic Semantic Embedding Generator
 * Projects text into a 128-dimensional dense vector space with L2 unit normalization.
 * Combines medical ontology activation, n-gram hashing, and token frequencies.
 */
export function generateDenseEmbedding(text: string, dimension = 128): number[] {
  const embedding = new Array<number>(dimension).fill(0);
  const normalized = text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');

  // 1. Ontology Concept Activation (Dense Medical Semantics)
  let conceptIdx = 0;
  for (const [key, concept] of Object.entries(MEDICAL_ONTOLOGY)) {
    let matches = 0;
    if (normalized.includes(key.replace('_', ' '))) {
      matches += 3;
    }
    for (const syn of concept.synonyms) {
      if (normalized.includes(syn.toLowerCase())) {
        matches += 2;
      }
    }
    if (matches > 0) {
      const dimOffset = (conceptIdx * 7) % dimension;
      embedding[dimOffset] += matches * 2.5;
      embedding[(dimOffset + 1) % dimension] += matches * 1.8;
      embedding[(dimOffset + 3) % dimension] += matches * 1.2;
    }
    conceptIdx++;
  }

  // 2. Token & Subword N-Gram Projections
  const tokens = normalized.split(/[\s,.;:!?()[\]{}<>"'\-_/\\+=#*&^%$@~`]+/).filter((t) => t.length > 1);
  for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
    const token = tokens[tIdx];

    // Word hash
    let hash = 5381;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 33) ^ token.charCodeAt(i);
    }
    const bucket = Math.abs(hash) % dimension;
    embedding[bucket] += 1.0;

    // Bi-gram hash for contextual sequences
    if (tIdx < tokens.length - 1) {
      const nextToken = tokens[tIdx + 1];
      let biHash = 0;
      for (let j = 0; j < nextToken.length; j++) {
        biHash = (biHash * 31) ^ nextToken.charCodeAt(j);
      }
      const biBucket = Math.abs(hash ^ biHash) % dimension;
      embedding[biBucket] += 1.5;
    }

    // 3-char subword n-grams for morphological resilience in Arabic/English
    for (let c = 0; c <= token.length - 3; c++) {
      const tri = token.slice(c, c + 3);
      let triHash = 17;
      for (let k = 0; k < tri.length; k++) {
        triHash = (triHash * 23) ^ tri.charCodeAt(k);
      }
      const triBucket = Math.abs(triHash) % dimension;
      embedding[triBucket] += 0.4;
    }
  }

  // 3. L2 Unit Normalization (sum(v_i^2) = 1.0)
  let norm = 0;
  for (let i = 0; i < dimension; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      embedding[i] = embedding[i] / norm;
    }
  }

  return embedding;
}

export class IngestionPipeline {
  /**
   * Run the full pipeline for a specific document:
   * Source -> Validation -> Cleaning -> Document Processing -> Chunking -> Embeddings -> Vector Database
   */
  public async ingestDocument(documentId: string): Promise<IngestionPipelineResult> {
    const startTime = Date.now();
    const steps: IngestionStepAudit[] = [];
    const doc = documentStore.getDocumentById(documentId);

    if (!doc) {
      throw new Error(`Document with ID "${documentId}" does not exist in store.`);
    }

    try {
      // ==========================================
      // STEP 1: SOURCE VALIDATION
      // ==========================================
      const s1Start = Date.now();
      const source = sourceRegistry.getSourceById(doc.sourceId);
      if (!source) {
        throw new Error(`Linked source "${doc.sourceId}" does not exist in Source Registry.`);
      }
      if (source.status === 'DEPRECATED') {
        throw new Error(`Cannot ingest document linked to DEPRECATED source "${source.name}".`);
      }
      if (!doc.title || doc.title.trim().length < 5) {
        throw new Error('Document title must be at least 5 characters long.');
      }
      if (!doc.content || doc.content.trim().length < 50) {
        throw new Error('Document content is too short (minimum 50 characters).');
      }

      steps.push({
        step: 'SOURCE_VALIDATION',
        status: 'SUCCESS',
        message: `Validated source "${source.name}" (${source.organization} - ${source.authorityLevel}). Status: ${source.status}`,
        durationMs: Date.now() - s1Start,
        details: { sourceId: source.id, authorityLevel: source.authorityLevel },
      });

      // ==========================================
      // STEP 2: CONTENT CLEANING
      // ==========================================
      const s2Start = Date.now();
      const cleanedContent = this.cleanMedicalContent(doc.content);
      const charsRemoved = doc.content.length - cleanedContent.length;

      steps.push({
        step: 'CONTENT_CLEANING',
        status: 'SUCCESS',
        message: `Content normalized and sanitized. Cleaned character length: ${cleanedContent.length} chars (reduced ${charsRemoved} noisy characters).`,
        durationMs: Date.now() - s2Start,
        details: { originalLength: doc.content.length, cleanedLength: cleanedContent.length },
      });

      // ==========================================
      // STEP 3: DOCUMENT PROCESSING
      // ==========================================
      const s3Start = Date.now();
      const sections = this.processDocumentSections(cleanedContent, doc.title);

      steps.push({
        step: 'DOCUMENT_PROCESSING',
        status: 'SUCCESS',
        message: `Extracted ${sections.length} semantic clinical sections with hierarchical metadata.`,
        durationMs: Date.now() - s3Start,
        details: { sectionCount: sections.length, sectionHeadings: sections.map((s) => s.heading) },
      });

      // ==========================================
      // STEP 4: CHUNKING
      // ==========================================
      const s4Start = Date.now();
      const rawChunks = this.chunkSections(sections, doc, source);
      let totalTokens = 0;
      for (const rc of rawChunks) {
        totalTokens += rc.metadata.tokenCount;
      }

      steps.push({
        step: 'CHUNKING',
        status: 'SUCCESS',
        message: `Generated ${rawChunks.length} contextual chunks (~${Math.round(totalTokens / rawChunks.length)} tokens/chunk average).`,
        durationMs: Date.now() - s4Start,
        details: { chunksCreated: rawChunks.length, estimatedTokens: totalTokens },
      });

      // ==========================================
      // STEP 5: EMBEDDINGS GENERATION
      // ==========================================
      const s5Start = Date.now();
      for (const chunk of rawChunks) {
        const textForEmbedding = `${chunk.sourceReference.documentTitle} | ${chunk.metadata.sectionHeading || ''} | ${chunk.content}`;
        chunk.embedding = generateDenseEmbedding(textForEmbedding, 128);
      }

      steps.push({
        step: 'EMBEDDING',
        status: 'SUCCESS',
        message: `Generated 128-dimensional dense normalized embeddings for all ${rawChunks.length} chunks.`,
        durationMs: Date.now() - s5Start,
        details: { embeddingDimension: 128, chunkCount: rawChunks.length },
      });

      // ==========================================
      // STEP 6: VECTOR DATABASE INDEXING
      // ==========================================
      const s6Start = Date.now();
      // Remove any previously indexed chunks for this document to ensure idempotency
      vectorDatabase.deleteChunksByDocumentId(doc.id);
      // Upsert fresh chunks
      vectorDatabase.upsertChunks(rawChunks);

      // Update Document Status
      documentStore.updateDocument(doc.id, {
        status: 'INDEXED',
        chunksCount: rawChunks.length,
        processedAt: new Date().toISOString(),
      });

      steps.push({
        step: 'VECTOR_INDEXING',
        status: 'SUCCESS',
        message: `Indexed ${rawChunks.length} chunks into in-memory Vector Database. Ready for semantic search.`,
        durationMs: Date.now() - s6Start,
        details: { indexedCount: rawChunks.length },
      });

      return {
        documentId: doc.id,
        success: true,
        steps,
        chunksCreated: rawChunks.length,
        totalTokens,
        durationTotalMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      // Mark document as failed
      documentStore.updateDocument(doc.id, {
        status: 'FAILED',
      });

      steps.push({
        step: 'VECTOR_INDEXING',
        status: 'FAILED',
        message: `Ingestion failed: ${err.message}`,
        durationMs: Date.now() - startTime,
      });

      return {
        documentId: doc.id,
        success: false,
        steps,
        chunksCreated: 0,
        totalTokens: 0,
        durationTotalMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Ingest all registered documents in batch
   */
  public async ingestAll(): Promise<IngestionPipelineResult[]> {
    const docs = documentStore.getAllDocuments();
    const results: IngestionPipelineResult[] = [];
    for (const doc of docs) {
      const res = await this.ingestDocument(doc.id);
      results.push(res);
    }
    return results;
  }

  // ==========================================
  // HELPER TRANSFORMATION METHODS
  // ==========================================

  private cleanMedicalContent(rawText: string): string {
    return rawText
      // Remove Arabic Tashkeel/Tanween diacritics
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove zero-width characters and control codes
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Normalize multiple consecutive blank lines to double newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim line edges
      .split('\n')
      .map((l) => l.trimEnd())
      .join('\n')
      .trim();
  }

  private processDocumentSections(
    content: string,
    documentTitle: string
  ): Array<{ heading: string; body: string }> {
    const sections: Array<{ heading: string; body: string }> = [];
    const lines = content.split('\n');

    let currentHeading = documentTitle;
    let currentBodyLines: string[] = [];

    for (const line of lines) {
      if (/^#{1,3}\s+/.test(line)) {
        if (currentBodyLines.length > 0 && currentBodyLines.join('\n').trim().length > 20) {
          sections.push({
            heading: currentHeading,
            body: currentBodyLines.join('\n').trim(),
          });
          currentBodyLines = [];
        }
        currentHeading = line.replace(/^#{1,3}\s+/, '').trim();
      } else {
        currentBodyLines.push(line);
      }
    }

    if (currentBodyLines.length > 0 && currentBodyLines.join('\n').trim().length > 10) {
      sections.push({
        heading: currentHeading,
        body: currentBodyLines.join('\n').trim(),
      });
    }

    // Fallback if no markdown headings existed
    if (sections.length === 0) {
      sections.push({
        heading: documentTitle,
        body: content,
      });
    }

    return sections;
  }

  private chunkSections(
    sections: Array<{ heading: string; body: string }>,
    doc: KnowledgeDocument,
    source: any
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const maxChunkLength = 1200; // ~200-250 words
    const overlapLength = 180;

    let globalChunkIndex = 0;

    for (const section of sections) {
      const body = section.body;

      if (body.length <= maxChunkLength) {
        chunks.push(
          this.buildChunk(
            doc,
            source,
            globalChunkIndex++,
            section.heading,
            body
          )
        );
      } else {
        // Sliding window chunking respecting sentences / bullet points
        let start = 0;
        while (start < body.length) {
          let end = Math.min(start + maxChunkLength, body.length);

          // If not at the end of text, find closest paragraph break, sentence end, or bullet point
          if (end < body.length) {
            const lookback = body.slice(start + maxChunkLength - 250, end);
            const breakIdx = Math.max(
              lookback.lastIndexOf('\n-'),
              lookback.lastIndexOf('\n*'),
              lookback.lastIndexOf('.\n'),
              lookback.lastIndexOf('. '),
              lookback.lastIndexOf('، ')
            );
            if (breakIdx > 0) {
              end = start + maxChunkLength - 250 + breakIdx + 1;
            }
          }

          const chunkText = body.slice(start, end).trim();
          if (chunkText.length > 30) {
            chunks.push(
              this.buildChunk(
                doc,
                source,
                globalChunkIndex++,
                section.heading,
                chunkText
              )
            );
          }

          if (end >= body.length) break;
          start = Math.max(start + 1, end - overlapLength);
        }
      }
    }

    // Set totalChunks count on metadata
    for (const chunk of chunks) {
      chunk.metadata.totalChunks = chunks.length;
    }

    return chunks;
  }

  private buildChunk(
    doc: KnowledgeDocument,
    source: any,
    index: number,
    heading: string,
    content: string
  ): DocumentChunk {
    const chunkId = `CHK_${doc.id.replace('DOC_', '')}_${String(index).padStart(2, '0')}`;
    const tokenCount = Math.ceil(content.length / 4);

    const sourceRef: ChunkSourceReference = {
      sourceId: source.id,
      sourceName: source.name,
      organization: source.organization,
      url: source.url,
      authorityLevel: source.authorityLevel,
      documentTitle: doc.title,
      lastUpdated: doc.updatedDate || doc.publishedDate,
    };

    const metadata: ChunkMetadata = {
      sectionHeading: heading,
      chunkIndex: index,
      totalChunks: 1, // updated after loop
      tokenCount,
      characterCount: content.length,
      keywords: doc.metadata.tags || [],
      category: doc.metadata.category,
      specialty: doc.metadata.specialty,
    };

    return {
      id: chunkId,
      documentId: doc.id,
      chunkIndex: index,
      content,
      embedding: [], // populated in step 5
      metadata,
      sourceReference: sourceRef,
    };
  }
}

export const ingestionPipeline = new IngestionPipeline();
