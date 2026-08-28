import { ingestionPipeline } from './ingestionPipeline.js';
import { vectorDatabase } from './vectorDatabase.js';

let isBootstrapped = false;

export async function bootstrapMedicalRAG(): Promise<void> {
  if (isBootstrapped) return;

  const telemetry = vectorDatabase.getTelemetry();
  if (telemetry.totalChunks > 0) {
    isBootstrapped = true;
    return;
  }

  console.log('[Medical RAG] Initializing Knowledge Base & Vector Indexing...');
  try {
    const results = await ingestionPipeline.ingestAll();
    const successful = results.filter((r) => r.success).length;
    const totalChunks = results.reduce((acc, r) => acc + r.chunksCreated, 0);
    console.log(
      `[Medical RAG] Initialization complete: ${successful}/${results.length} documents processed, ${totalChunks} chunks indexed.`
    );
    isBootstrapped = true;
  } catch (err: any) {
    console.error('[Medical RAG] Bootstrap indexing failed:', err.message);
  }
}
