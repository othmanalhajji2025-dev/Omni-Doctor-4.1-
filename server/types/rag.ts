export type AuthorityLevel =
  | 'TIER_1_GLOBAL_MINISTRY' // WHO, Saudi MOH, NICE, CDC
  | 'TIER_2_SPECIALTY_COLLEGE' // AHA, ACC, ADA, ESC, AAFP
  | 'TIER_3_ACADEMIC_INSTITUTE'; // UpToDate, Mayo Clinic, Harvard Health

export type SourceContentType =
  | 'CLINICAL_PRACTICE_GUIDELINE'
  | 'DRUG_MONOGRAPH'
  | 'DIAGNOSTIC_PROTOCOL'
  | 'PUBLIC_HEALTH_ADVISORY'
  | 'SYSTEMATIC_REVIEW';

export type SourceStatus = 'ACTIVE' | 'PENDING_REVIEW' | 'DEPRECATED';

export interface KnowledgeSource {
  id: string;
  name: string;
  nameAr: string;
  organization: string;
  url: string;
  contentType: SourceContentType;
  authorityLevel: AuthorityLevel;
  lastReviewed: string; // YYYY-MM-DD
  status: SourceStatus;
  descriptionAr: string;
  descriptionEn: string;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'DRAFT' | 'PROCESSED' | 'INDEXED' | 'FAILED';

export interface DocumentMetadata {
  category: string;
  specialty: string;
  tags: string[];
  language: 'ar' | 'en' | 'both';
  clinicalDomain: string;
  targetAudience: string;
  guidelineCode?: string;
  evidenceGrade?: string;
  summaryAr?: string;
  summaryEn?: string;
}

export interface KnowledgeDocument {
  id: string;
  sourceId: string;
  title: string;
  titleEn?: string;
  publishedDate: string;
  updatedDate: string;
  content: string;
  metadata: DocumentMetadata;
  status: DocumentStatus;
  chunksCount: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChunkMetadata {
  sectionHeading?: string;
  chunkIndex: number;
  totalChunks: number;
  tokenCount: number;
  characterCount: number;
  keywords: string[];
  category?: string;
  specialty?: string;
}

export interface ChunkSourceReference {
  sourceId: string;
  sourceName: string;
  organization: string;
  url: string;
  authorityLevel: AuthorityLevel;
  documentTitle: string;
  lastUpdated?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
  sourceReference: ChunkSourceReference;
}

export interface IngestionStepAudit {
  step:
    | 'SOURCE_VALIDATION'
    | 'CONTENT_CLEANING'
    | 'DOCUMENT_PROCESSING'
    | 'CHUNKING'
    | 'EMBEDDING'
    | 'VECTOR_INDEXING';
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  message: string;
  durationMs: number;
  details?: Record<string, any>;
}

export interface IngestionPipelineResult {
  documentId: string;
  success: boolean;
  steps: IngestionStepAudit[];
  chunksCreated: number;
  totalTokens: number;
  durationTotalMs: number;
  timestamp: string;
}

export interface MedicalQueryUnderstanding {
  rawQuery: string;
  normalizedQuery: string;
  intent:
    | 'SYMPTOM_ASSESSMENT'
    | 'MEDICATION_SAFETY'
    | 'DIAGNOSTIC_WORKUP'
    | 'MANAGEMENT_PROTOCOL'
    | 'EMERGENCY_TRIAGE'
    | 'GENERAL_EDUCATION';
  clinicalTopic: string;
  identifiedEntities: {
    symptoms: string[];
    conditions: string[];
    medications: string[];
    labTests: string[];
  };
  expandedKeywords: string[];
  language: 'ar' | 'en';
}

export interface RetrievedChunkScore {
  chunk: DocumentChunk;
  vectorSimilarity: number; // 0 to 1
  keywordScore: number; // 0 to 1
  authorityWeight: number; // multiplier e.g. 1.0 - 1.2
  recencyWeight: number; // multiplier e.g. 0.95 - 1.05
  rerankedScore: number; // final composite score
  rank: number;
  explanation: string;
}

export interface MedicalCitation {
  sourceName: string;
  title: string;
  url: string;
  lastUpdated?: string;
  organization: string;
  authorityLevel: AuthorityLevel;
  documentId: string;
  chunkId: string;
  excerpt: string;
  isVerifiedRetrieved: boolean;
}

export interface EvidenceContext {
  queryUnderstanding: MedicalQueryUnderstanding;
  retrievedChunks: RetrievedChunkScore[];
  topEvidenceChunks: RetrievedChunkScore[];
  citations: MedicalCitation[];
  groundedContextPrompt: string;
  retrievalTimestamp: string;
  metrics: {
    totalCandidatesScored: number;
    vectorSearchTimeMs: number;
    rerankTimeMs: number;
    totalLatencyMs: number;
  };
}

export interface VectorDBTelemetry {
  totalSources: number;
  activeSources: number;
  totalDocuments: number;
  indexedDocuments: number;
  totalChunks: number;
  embeddingDimension: number;
  memoryEstimateKb: number;
  lastIndexedAt?: string;
  indexStatus: 'HEALTHY' | 'STALE' | 'EMPTY';
}
