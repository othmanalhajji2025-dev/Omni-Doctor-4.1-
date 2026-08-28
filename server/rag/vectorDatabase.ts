import { DocumentChunk, VectorDBTelemetry, AuthorityLevel } from '../types/rag.js';
import { sourceRegistry } from './sourceRegistry.js';
import { documentStore } from './documentStore.js';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp between 0 and 1 for positive embeddings
  return Math.max(0, Math.min(1, similarity));
}

export interface VectorSearchOptions {
  topK?: number;
  minSimilarity?: number;
  sourceId?: string;
  category?: string;
  authorityLevel?: AuthorityLevel;
}

export class VectorDatabase {
  private chunks: Map<string, DocumentChunk> = new Map();
  private lastIndexedAt?: string;
  private embeddingDimension = 128; // Standard dense projection dimension

  public setEmbeddingDimension(dim: number): void {
    this.embeddingDimension = dim;
  }

  public upsertChunks(newChunks: DocumentChunk[]): void {
    for (const chunk of newChunks) {
      this.chunks.set(chunk.id, chunk);
    }
    this.lastIndexedAt = new Date().toISOString();
  }

  public deleteChunksByDocumentId(documentId: string): number {
    let deletedCount = 0;
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  public getAllChunks(): DocumentChunk[] {
    return Array.from(this.chunks.values());
  }

  public getChunksByDocumentId(documentId: string): DocumentChunk[] {
    return Array.from(this.chunks.values()).filter((c) => c.documentId === documentId);
  }

  public getChunkById(chunkId: string): DocumentChunk | undefined {
    return this.chunks.get(chunkId);
  }

  public search(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Array<{ chunk: DocumentChunk; similarity: number }> {
    const topK = options.topK || 5;
    const minSimilarity = options.minSimilarity ?? 0.05;

    const scored: Array<{ chunk: DocumentChunk; similarity: number }> = [];

    for (const chunk of this.chunks.values()) {
      // Optional Filters
      if (options.sourceId && chunk.sourceReference.sourceId !== options.sourceId) {
        continue;
      }
      if (options.category && chunk.metadata.category !== options.category) {
        continue;
      }
      if (options.authorityLevel && chunk.sourceReference.authorityLevel !== options.authorityLevel) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity >= minSimilarity) {
        scored.push({ chunk, similarity });
      }
    }

    // Sort descending by similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK);
  }

  public clear(): void {
    this.chunks.clear();
  }

  public getTelemetry(): VectorDBTelemetry {
    const sources = sourceRegistry.getAllSources();
    const docs = documentStore.getAllDocuments();
    const totalChunks = this.chunks.size;

    // Approximate memory: chunk text + metadata + 128 floats * 8 bytes
    let approxBytes = 0;
    for (const chunk of this.chunks.values()) {
      approxBytes += chunk.content.length * 2;
      approxBytes += chunk.embedding.length * 8;
      approxBytes += 250; // metadata overhead
    }

    const memoryEstimateKb = Math.round(approxBytes / 1024);

    return {
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.status === 'ACTIVE').length,
      totalDocuments: docs.length,
      indexedDocuments: docs.filter((d) => d.status === 'INDEXED').length,
      totalChunks,
      embeddingDimension: this.embeddingDimension,
      memoryEstimateKb,
      lastIndexedAt: this.lastIndexedAt,
      indexStatus: totalChunks === 0 ? 'EMPTY' : 'HEALTHY',
    };
  }
}

export const vectorDatabase = new VectorDatabase();
