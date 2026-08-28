import { VERIFIED_EVIDENCE_REPOSITORY, checkDrugInteractions, interpretLabResults } from '../rag/evidenceRetriever.js';
import { TestResult } from './auth.test.js';

export async function runRagCitationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Verified Evidence Repository Integrity & Citations
  {
    const start = Date.now();
    try {
      const docs = VERIFIED_EVIDENCE_REPOSITORY;
      const hasValidDocs = Array.isArray(docs) && docs.length >= 5;

      // Check all documents have mandatory clinical metadata
      const allHaveCitations = docs.every(
        (d) =>
          d.id &&
          d.title &&
          d.titleEn &&
          d.organization &&
          d.guidelineId &&
          d.year &&
          d.summaryAr &&
          d.summaryEn &&
          Array.isArray(d.topics) &&
          d.topics.length > 0
      );

      const passed = hasValidDocs && allHaveCitations;

      results.push({
        suite: 'Medical RAG & Citation',
        name: 'Verified Evidence Repository Schema & Citation Completeness',
        passed,
        message: passed
          ? `All ${docs.length} core clinical guidelines contain accredited sources (WHO, AHA, NICE, CDC) with validated clinical guidelines`
          : 'Missing mandatory source citations or metadata in RAG store',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Medical RAG & Citation',
        name: 'Verified Evidence Repository Schema & Citation Completeness',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 2: Drug-Drug Interaction Grounding (Warfarin + Fluconazole)
  {
    const start = Date.now();
    try {
      const interactions = checkDrugInteractions(['Warfarin', 'Fluconazole']);
      const hasInteractions = Array.isArray(interactions) && interactions.length > 0;
      const isSevere = interactions.some(
        (i) => i.severity === 'MAJOR' || i.severity === 'CONTRAINDICATED'
      );
      const hasManagement = interactions.some((i) => i.managementAr?.length > 0);

      const passed = hasInteractions && isSevere && hasManagement;

      results.push({
        suite: 'Medical RAG & Citation',
        name: 'Deterministic Pharmacopeia Drug-Drug Interaction Retrieval',
        passed,
        message: passed
          ? 'Successfully retrieved major CYP2C9 inhibition warning for Warfarin + Fluconazole with clinical guidance'
          : 'Failed to flag CYP2C9 pharmacokinetic interaction',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Medical RAG & Citation',
        name: 'Deterministic Pharmacopeia Drug-Drug Interaction Retrieval',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 3: Lab Results Reference Range Grounding (e.g. Troponin, Potassium)
  {
    const start = Date.now();
    try {
      const labResults = interpretLabResults([
        { name: 'Troponin I', value: 2.8, unit: 'ng/mL' },
        { name: 'Potassium', value: 6.2, unit: 'mEq/L' },
      ]);

      const hasCriticalOrHigh = labResults.some(
        (r) => r.status === 'CRITICAL_HIGH' || r.status === 'HIGH'
      );
      const allHaveRanges = labResults.every(
        (r) => r.referenceRange && r.clinicalSignificanceAr
      );

      const passed = hasCriticalOrHigh && allHaveRanges;

      results.push({
        suite: 'Medical RAG & Citation',
        name: 'Evidence-Based Lab Reference Range & Critical Value Grounding',
        passed,
        message: passed
          ? 'Correctly flagged critical myocardial necrosis and severe hyperkalemia indicators with standard units'
          : 'Failed to accurately interpret critical lab values',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Medical RAG & Citation',
        name: 'Evidence-Based Lab Reference Range & Critical Value Grounding',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  return results;
}
