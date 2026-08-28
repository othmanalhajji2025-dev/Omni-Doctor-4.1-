import {
  MedicalQueryUnderstanding,
  RetrievedChunkScore,
  MedicalCitation,
  EvidenceContext,
  DocumentChunk,
  AuthorityLevel,
} from '../types/rag.js';
import { generateDenseEmbedding, MEDICAL_ONTOLOGY } from './ingestionPipeline.js';
import { vectorDatabase } from './vectorDatabase.js';

export class MedicalQueryEngine {
  /**
   * 1. Understand the Question (Intent, Entities, Expansions)
   */
  public understandQuery(query: string, languageHint?: 'ar' | 'en'): MedicalQueryUnderstanding {
    const rawQuery = query.trim();
    const normalized = rawQuery
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');

    const isArabic = languageHint === 'ar' || /[\u0600-\u06FF]/.test(rawQuery);
    const language: 'ar' | 'en' = isArabic ? 'ar' : 'en';

    // 1. Identify Intent
    let intent: MedicalQueryUnderstanding['intent'] = 'SYMPTOM_ASSESSMENT';
    if (/(تفاعل|دواء|جرعة|حبوب|أقراص|مرهم|اعراض جانبية|drug|medication|dose|interaction|adverse|contraindication)/i.test(normalized)) {
      intent = 'MEDICATION_SAFETY';
    } else if (/(تحليل|فحص|hba1c|تروبونين|ضغط الدم|سكر|بول|تشخيص|معايير|lab|test|criteria|diagnosis|ecg|troponin)/i.test(normalized)) {
      intent = 'DIAGNOSTIC_WORKUP';
    } else if (/(علاج|بروتوكول|ادارة|خطة|ارشاد|guideline|protocol|management|treatment|stepped)/i.test(normalized)) {
      intent = 'MANAGEMENT_PROTOCOL';
    } else if (/(طوارئ|اسعاف|جلطة|سكتة|اختناق|الم شديد جدا|emergency|crisis|severe|stroke|infarction)/i.test(normalized)) {
      intent = 'EMERGENCY_TRIAGE';
    } else if (/(ما هو|معلومات|تثقيف|نصائح|what is|education|lifestyle)/i.test(normalized)) {
      intent = 'GENERAL_EDUCATION';
    }

    // 2. Identify Entities
    const symptoms: string[] = [];
    const conditions: string[] = [];
    const medications: string[] = [];
    const labTests: string[] = [];

    // Symptom checks
    if (/(الم|وجع|ضغط|ثقل|نغز|pain|pressure|tightness|heaviness)/i.test(normalized)) symptoms.push('pain_discomfort');
    if (/(ضيق تنفس|كتمة|صعوبة تنفس|shortness of breath|dyspnea)/i.test(normalized)) symptoms.push('dyspnea');
    if (/(صداع|شقيقة|headache|migraine)/i.test(normalized)) symptoms.push('headache');
    if (/(حرقة بول|عسر تبول|dysuria)/i.test(normalized)) symptoms.push('dysuria');
    if (/(حموضة|ارتجاع|حرقان|heartburn|reflux)/i.test(normalized)) symptoms.push('pyrosis_reflux');
    if (/(سعال|كحة|cough)/i.test(normalized)) symptoms.push('cough');

    // Condition checks
    if (/(ضغط|ضغط الدم|hypertension|bp)/i.test(normalized)) conditions.push('hypertension');
    if (/(سكري|سكر|diabetes|hyperglycemia)/i.test(normalized)) conditions.push('diabetes');
    if (/(ذبحة|قلب|متلازمة تاجية|angina|coronary|heart attack)/i.test(normalized)) conditions.push('coronary_disease');
    if (/(نزلة برد|انفلونزا|رشح|cold|flu|pharyngitis)/i.test(normalized)) conditions.push('viral_urti');
    if (/(مسالك بولية|التهاب البول|uti|cystitis|pyelonephritis)/i.test(normalized)) conditions.push('uti');
    if (/(ارتجاع المريء|عسر هضم|gerd|dyspepsia)/i.test(normalized)) conditions.push('gerd');
    if (/(نزيف|خثار|bleeding|thrombosis)/i.test(normalized)) conditions.push('coagulopathy');

    // Medication checks
    if (/(وارفارين|warfarin)/i.test(normalized)) medications.push('Warfarin');
    if (/(ايبوبروفين|بروفين|ibuprofen|advil)/i.test(normalized)) medications.push('Ibuprofen');
    if (/(ميتفورمين|metformin|glucophage)/i.test(normalized)) medications.push('Metformin');
    if (/(باراسيتامول|بنادول|paracetamol|acetaminophen|panadol)/i.test(normalized)) medications.push('Paracetamol');
    if (/(املوديبين|amlodipine|norvasc)/i.test(normalized)) medications.push('Amlodipine');
    if (/(راميبريل|ليسينوبريل|ramipril|lisinopril)/i.test(normalized)) medications.push('ACE_Inhibitor');
    if (/(اوميبرازول|omeprazole|losec)/i.test(normalized)) medications.push('Omeprazole');
    if (/(تريبتان|سوماتريبتان|triptan|sumatriptan)/i.test(normalized)) medications.push('Triptan');

    // Lab tests
    if (/(تراكمي|hba1c)/i.test(normalized)) labTests.push('HbA1c');
    if (/(تروبونين|troponin)/i.test(normalized)) labTests.push('Troponin');
    if (/(تخطيط قلب|ecg|ekg)/i.test(normalized)) labTests.push('ECG');
    if (/(تحليل بول|بول|urinalysis)/i.test(normalized)) labTests.push('Urinalysis');
    if (/(كرياتينين|وظائف كلى|creatinine)/i.test(normalized)) labTests.push('Creatinine');

    // 3. Synonym Expansion
    const expandedKeywords: string[] = [];
    for (const [key, ontology] of Object.entries(MEDICAL_ONTOLOGY)) {
      const matchFound =
        normalized.includes(key.replace('_', ' ')) ||
        ontology.synonyms.some((s) => normalized.includes(s.toLowerCase()));

      if (matchFound) {
        expandedKeywords.push(key);
        expandedKeywords.push(...ontology.synonyms.slice(0, 4));
      }
    }

    // 4. Clinical Topic
    const clinicalTopic = this.determineClinicalTopic(normalized, conditions, symptoms);

    return {
      rawQuery,
      normalizedQuery: normalized,
      intent,
      clinicalTopic,
      identifiedEntities: {
        symptoms,
        conditions,
        medications,
        labTests,
      },
      expandedKeywords: Array.from(new Set(expandedKeywords)),
      language,
    };
  }

  /**
   * 2. Determine Clinical Topic
   */
  private determineClinicalTopic(normalized: string, conditions: string[], symptoms: string[]): string {
    if (
      conditions.includes('hypertension') ||
      conditions.includes('coronary_disease') ||
      normalized.includes('صدر') ||
      normalized.includes('chest') ||
      normalized.includes('كوليسترول') ||
      normalized.includes('cholesterol') ||
      normalized.includes('ldl') ||
      normalized.includes('statin') ||
      normalized.includes('ستاتين') ||
      normalized.includes('قلب') ||
      normalized.includes('heart')
    ) {
      return 'CARDIOVASCULAR';
    }
    if (conditions.includes('diabetes') || normalized.includes('تراكمي') || normalized.includes('glucose')) {
      return 'ENDOCRINE_METABOLIC';
    }
    if (conditions.includes('viral_urti') || symptoms.includes('dyspnea') || normalized.includes('سعال') || normalized.includes('throat')) {
      return 'RESPIRATORY';
    }
    if (symptoms.includes('headache') || normalized.includes('صداع') || normalized.includes('شقيقة')) {
      return 'NEUROLOGY';
    }
    if (conditions.includes('uti') || symptoms.includes('dysuria') || normalized.includes('بول') || normalized.includes('كلى')) {
      return 'UROLOGY_NEPHROLOGY';
    }
    if (conditions.includes('gerd') || symptoms.includes('pyrosis_reflux') || normalized.includes('معدة') || normalized.includes('حموضة')) {
      return 'GASTROENTEROLOGY';
    }
    if (conditions.includes('coagulopathy') || normalized.includes('وارفارين') || normalized.includes('تفاعل')) {
      return 'PHARMACOLOGY_DRUG_SAFETY';
    }
    return 'GENERAL_INTERNAL_MEDICINE';
  }

  /**
   * 3. Full Retrieval & Reranking Pipeline
   * Returns complete EvidenceContext ready for AI injection and grounded citation
   */
  public retrieveEvidenceContext(
    queryText: string,
    options: { topK?: number; languageHint?: 'ar' | 'en' } = {}
  ): EvidenceContext {
    const startTotal = Date.now();
    const topK = options.topK || 4;

    // Step 1 & 2: Understand Query & Topic
    const understanding = this.understandQuery(queryText, options.languageHint);

    // Build enhanced search string combining original query + clinical ontology expansions
    const searchString = `${understanding.rawQuery} ${understanding.expandedKeywords.join(' ')}`;
    const queryVec = generateDenseEmbedding(searchString, 128);

    // Step 3: Vector Retrieval
    const vecStart = Date.now();
    const candidateChunks = vectorDatabase.search(queryVec, {
      topK: 15, // Retrieve broader candidate pool for reranker
      minSimilarity: 0.08,
    });
    const vectorSearchTimeMs = Date.now() - vecStart;

    // Step 4: Reranking & Scoring
    const rerankStart = Date.now();
    const scoredChunks: RetrievedChunkScore[] = [];

    for (const item of candidateChunks) {
      const chunk = item.chunk;
      const vecSim = item.similarity;

      // Keyword Lexical Overlap Score
      const chunkLower = chunk.content.toLowerCase();
      let keywordHits = 0;
      const termsToCheck = [
        ...understanding.expandedKeywords,
        ...understanding.identifiedEntities.conditions,
        ...understanding.identifiedEntities.symptoms,
        ...understanding.identifiedEntities.medications,
      ];

      for (const term of termsToCheck) {
        if (term.length > 2 && chunkLower.includes(term.toLowerCase())) {
          keywordHits++;
        }
      }
      const keywordScore = Math.min(1.0, keywordHits / Math.max(2, termsToCheck.length || 1));

      // Authority Level Weight
      let authorityWeight = 1.0;
      if (chunk.sourceReference.authorityLevel === 'TIER_1_GLOBAL_MINISTRY') {
        authorityWeight = 1.15; // +15% boost for WHO, MOH, NICE, CDC
      } else if (chunk.sourceReference.authorityLevel === 'TIER_2_SPECIALTY_COLLEGE') {
        authorityWeight = 1.08; // +8% boost for AHA, ADA
      }

      // Recency Weight (newer guidelines receive modest advantage)
      let recencyWeight = 1.0;
      if (chunk.sourceReference.lastUpdated) {
        const year = new Date(chunk.sourceReference.lastUpdated).getFullYear();
        if (year >= 2023) recencyWeight = 1.05;
      }

      // Topic Match Bonus
      let topicBonus = 1.0;
      if (chunk.metadata.category === understanding.clinicalTopic) {
        topicBonus = 1.1;
      }

      // Composite Reranked Score
      const rawComposite = vecSim * 0.6 + keywordScore * 0.4;
      const rerankedScore = rawComposite * authorityWeight * recencyWeight * topicBonus;

      scoredChunks.push({
        chunk,
        vectorSimilarity: Number(vecSim.toFixed(4)),
        keywordScore: Number(keywordScore.toFixed(4)),
        authorityWeight,
        recencyWeight,
        rerankedScore: Number(rerankedScore.toFixed(4)),
        rank: 0, // Assigned after sorting
        explanation: `Vector Cosine: ${vecSim.toFixed(3)}, Lexical Matches: ${keywordHits}, Authority: ${chunk.sourceReference.authorityLevel}`,
      });
    }

    // Sort descending by reranked score
    scoredChunks.sort((a, b) => b.rerankedScore - a.rerankedScore);

    // Assign final ranks
    scoredChunks.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const rerankTimeMs = Date.now() - rerankStart;

    // Step 5: Select Top Evidence Chunks (Ensure diversity if multiple sources exist)
    const topEvidenceChunks = scoredChunks.slice(0, topK);

    // Step 6: Generate Verified Citations (STRICT: only from retrieved chunks)
    const citations: MedicalCitation[] = topEvidenceChunks.map((sc) => {
      const c = sc.chunk;
      // Extract clean excerpt from chunk
      const cleanExcerpt = c.content.replace(/^#+\s+[^\n]+\n/g, '').trim().slice(0, 220) + '...';

      return {
        sourceName: c.sourceReference.sourceName,
        title: c.sourceReference.documentTitle,
        url: c.sourceReference.url,
        lastUpdated: c.sourceReference.lastUpdated,
        organization: c.sourceReference.organization,
        authorityLevel: c.sourceReference.authorityLevel,
        documentId: c.documentId,
        chunkId: c.id,
        excerpt: cleanExcerpt,
        isVerifiedRetrieved: true,
      };
    });

    // Step 7: Build Grounded Evidence Context Prompt for AI
    const groundedContextPrompt = this.formatGroundedPrompt(understanding, topEvidenceChunks);

    const totalLatencyMs = Date.now() - startTotal;

    return {
      queryUnderstanding: understanding,
      retrievedChunks: scoredChunks,
      topEvidenceChunks,
      citations,
      groundedContextPrompt,
      retrievalTimestamp: new Date().toISOString(),
      metrics: {
        totalCandidatesScored: scoredChunks.length,
        vectorSearchTimeMs,
        rerankTimeMs,
        totalLatencyMs,
      },
    };
  }

  /**
   * Format Grounded Evidence Prompt
   * Enforces the CORE RULE: "لا تعتمد الإجابات الطبية الحساسة على ذاكرة نموذج AI فقط عندما تكون الحاجة إلى مصدر موثوق ضرورية"
   */
  private formatGroundedPrompt(
    understanding: MedicalQueryUnderstanding,
    topEvidence: RetrievedChunkScore[]
  ): string {
    if (topEvidence.length === 0) {
      return `=== CLINICAL KNOWLEDGE CONTEXT ===\nNo specific matching guidelines were retrieved in the RAG vector store for this topic. Use conservative, standard first-aid and self-care principles, and advise consulting a verified healthcare specialist.\n=== END CONTEXT ===`;
    }

    const lines: string[] = [];
    lines.push('=== VERIFIED CLINICAL EVIDENCE REPOSITORY (MANDATORY RAG CONTEXT) ===');
    lines.push(`Query Clinical Intent: ${understanding.intent} | Primary Topic: ${understanding.clinicalTopic}`);
    lines.push('CRITICAL CLINICAL DIRECTIVE: You MUST ground your medical advice directly in the verified guidelines below.');
    lines.push('NEVER invent or hallucinate citations. Cite ONLY the verified references included in this context block.\n');

    topEvidence.forEach((item, idx) => {
      const c = item.chunk;
      lines.push(`[EVIDENCE #${idx + 1}] Source: ${c.sourceReference.sourceName} (${c.sourceReference.organization})`);
      lines.push(`Title: ${c.sourceReference.documentTitle}`);
      lines.push(`Authority Level: ${c.sourceReference.authorityLevel} | Last Updated: ${c.sourceReference.lastUpdated || 'N/A'}`);
      lines.push(`Official URL: ${c.sourceReference.url}`);
      lines.push(`Section: ${c.metadata.sectionHeading || 'General Guidance'}`);
      lines.push('Content Excerpt:');
      lines.push('"""');
      lines.push(c.content.trim());
      lines.push('"""\n');
    });

    lines.push('=== END OF VERIFIED CLINICAL EVIDENCE ===');
    return lines.join('\n');
  }

  /**
   * Anti-Hallucination Citation Sanitizer
   * Strict validation: Confirms that every citation emitted by the system exists in the verified retrieved list.
   * Rejects/strips any invented sources or phantom URLs.
   */
  public sanitizeCitations(
    candidateCitations: Array<{ title?: string; url?: string; organization?: string }>,
    verifiedCitations: MedicalCitation[]
  ): MedicalCitation[] {
    // Only keep citations that match an actually retrieved chunk
    const verifiedUrlSet = new Set(verifiedCitations.map((v) => v.url.toLowerCase()));
    const verifiedOrgSet = new Set(verifiedCitations.map((v) => v.organization.toLowerCase()));
    const verifiedTitleSet = new Set(verifiedCitations.map((v) => v.title.toLowerCase()));

    const filtered: MedicalCitation[] = [];

    for (const vc of verifiedCitations) {
      // Check if candidate explicitly or implicitly referenced this
      const hasMatch = candidateCitations.some((c) => {
        if (c.url && verifiedUrlSet.has(c.url.toLowerCase())) return true;
        if (c.organization && verifiedOrgSet.has(c.organization.toLowerCase())) return true;
        if (c.title && verifiedTitleSet.has(c.title.toLowerCase())) return true;
        return false;
      });

      if (hasMatch || candidateCitations.length === 0) {
        filtered.push(vc);
      }
    }

    // Default to verified citations if candidates were empty
    return filtered.length > 0 ? filtered : verifiedCitations;
  }
}

export const medicalQueryEngine = new MedicalQueryEngine();
