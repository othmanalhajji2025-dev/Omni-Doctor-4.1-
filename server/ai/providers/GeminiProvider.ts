import { GoogleGenAI, Type } from '@google/genai';
import {
  AIProvider,
  ClinicalDialogueRequest,
  ClinicalDialogueResponse,
  ExtractedClinicalAttributes,
  NextFollowUpQuestion,
  ClinicalConversationContext,
} from './AIProvider.js';
import { detectRedFlags } from '../../safety/redFlagEngine.js';
import { retrieveRelevantEvidence } from '../../rag/evidenceRetriever.js';
import { TriageUrgency } from '../../types/medical.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini 3.7 Flash (Clinical Intelligence Core)';
  private genAIClient: GoogleGenAI | null = null;

  isAvailable(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  private getGenAI(): GoogleGenAI {
    if (!this.genAIClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured.');
      }
      this.genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-omni-doctor',
          },
        },
      });
    }
    return this.genAIClient;
  }

  async processClinicalDialogue(
    request: ClinicalDialogueRequest
  ): Promise<ClinicalDialogueResponse> {
    const isAr = request.language !== 'en';
    const rawMsg = request.message.trim();
    const prevContext = request.clinicalContext;
    const history = request.conversationHistory || [];

    // Deterministic Red-Flag Safety Pass
    const deterministicFlags = detectRedFlags(rawMsg);
    const deterministicRedFlags = deterministicFlags.map((rf) => ({
      nameAr: rf.nameAr,
      nameEn: rf.nameEn,
      urgency: rf.urgency,
      actionAr: rf.actionAr,
      actionEn: rf.actionEn,
    }));

    const isDeterministicEmergency = deterministicRedFlags.some(
      (rf) => rf.urgency === 'EMERGENCY'
    );

    // Retrieve RAG Evidence
    const evidenceRetrieved = retrieveRelevantEvidence(
      `${prevContext?.primarySymptom || ''} ${rawMsg}`
    );

    const systemInstruction = `You are OmniDoctor AI, an advanced Clinical AI Health Companion and decision support system adhering strictly to WHO, NICE, and Saudi MOH clinical standards.
Your goal is to conduct structured, step-by-step clinical triage dialogues.

CRITICAL CLINICAL RULES:
1. Never give definitive diagnoses. Use rigorous probabilistic language ("قد يشير إلى", "من المحتمل", "احتمال وارد").
2. Follow progressive questioning: DO NOT ask multiple follow-up questions at once. Ask the SINGLE MOST IMPORTANT missing clinical attribute first (Onset -> Location -> Character -> Severity 1-10 -> Associated Red Flags).
3. If red flags or emergencies are detected (chest pain, acute stroke FAST signs, severe dyspnea, rigid abdomen, anaphylaxis), escalate immediately to 997 / 911 dispatch and warn the patient firmly.
4. If non-health inquiries are made, politely redirect to health triage.
5. Provide helpful questions for the patient to ask their doctor.
6. Provide output in ${isAr ? 'Arabic (العربية السريرية الفصحى والواضحة للمريض)' : 'English'}.
7. Return strictly valid JSON conforming to the schema.`;

    const promptContext = JSON.stringify({
      currentMessage: rawMsg,
      language: isAr ? 'ar' : 'en',
      patientContext: request.patientContext ? {
        age: request.patientContext.age,
        gender: request.patientContext.gender,
        chronicConditions: request.patientContext.chronicConditions,
        currentMedications: request.patientContext.currentMedications,
        allergies: request.patientContext.allergies,
      } : null,
      previousClinicalContext: prevContext || null,
      recentHistory: history.slice(-6).map(h => ({ sender: h.sender, content: h.content.slice(0, 300) })),
      verifiedEvidenceAvailable: evidenceRetrieved.map(e => ({ title: e.title, summary: isAr ? e.summaryAr : e.summaryEn }))
    });

    try {
      const ai = this.getGenAI();

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: promptContext,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                enum: [
                  'SYMPTOM_INQUIRY',
                  'MEDICATION_QUESTION',
                  'LAB_EXPLANATION',
                  'GENERAL_HEALTH',
                  'EMERGENCY_CRISIS',
                  'FOLLOW_UP_ANSWER',
                  'DOCTOR_PREPARATION',
                  'NON_HEALTH',
                ],
              },
              isHealthRelated: { type: Type.BOOLEAN },
              suggestedConversationTitle: { type: Type.STRING },
              extractedAttributes: {
                type: Type.OBJECT,
                properties: {
                  primarySymptom: { type: Type.STRING },
                  onset: { type: Type.STRING },
                  location: { type: Type.STRING },
                  character: { type: Type.STRING },
                  severity: { type: Type.INTEGER },
                  radiation: { type: Type.STRING },
                  aggravatingRelieving: { type: Type.STRING },
                  associatedSymptoms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
              missingAttributes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              redFlagsDetected: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nameAr: { type: Type.STRING },
                    nameEn: { type: Type.STRING },
                    urgency: { type: Type.STRING, enum: ['EMERGENCY', 'URGENT', 'ROUTINE', 'SELF_CARE'] },
                    actionAr: { type: Type.STRING },
                    actionEn: { type: Type.STRING },
                  },
                  required: ['nameAr', 'nameEn', 'urgency', 'actionAr', 'actionEn'],
                },
              },
              urgency: {
                type: Type.STRING,
                enum: ['EMERGENCY', 'URGENT', 'ROUTINE', 'SELF_CARE'],
              },
              needsFollowUp: { type: Type.BOOLEAN },
              nextFollowUpQuestion: {
                type: Type.OBJECT,
                properties: {
                  questionAr: { type: Type.STRING },
                  questionEn: { type: Type.STRING },
                  attribute: { type: Type.STRING },
                  quickOptionsAr: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  quickOptionsEn: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  priority: { type: Type.INTEGER },
                },
              },
              empatheticClinicalResponse: { type: Type.STRING },
              questionsForDoctorAr: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              questionsForDoctorEn: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'intent',
              'isHealthRelated',
              'extractedAttributes',
              'missingAttributes',
              'urgency',
              'needsFollowUp',
              'empatheticClinicalResponse',
              'questionsForDoctorAr',
              'questionsForDoctorEn',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      // Combine AI red flags with deterministic ones for strict safety
      const mergedRedFlags = [...deterministicRedFlags];
      if (Array.isArray(parsed.redFlagsDetected)) {
        for (const rf of parsed.redFlagsDetected) {
          if (!mergedRedFlags.some(m => m.nameAr === rf.nameAr || m.nameEn === rf.nameEn)) {
            mergedRedFlags.push(rf);
          }
        }
      }

      let finalUrgency: TriageUrgency = isDeterministicEmergency
        ? 'EMERGENCY'
        : (parsed.urgency as TriageUrgency) || 'ROUTINE';

      if (mergedRedFlags.some(rf => rf.urgency === 'EMERGENCY')) {
        finalUrgency = 'EMERGENCY';
      }

      return {
        conversationId: request.conversationId,
        messageId: 'msg_' + Math.random().toString(36).substring(2, 9),
        content: parsed.empatheticClinicalResponse || '',
        intent: parsed.intent || (isDeterministicEmergency ? 'EMERGENCY_CRISIS' : 'SYMPTOM_INQUIRY'),
        isHealthRelated: parsed.isHealthRelated !== false,
        extractedAttributes: parsed.extractedAttributes || {},
        missingAttributes: parsed.missingAttributes || [],
        redFlagsDetected: mergedRedFlags,
        urgency: finalUrgency,
        needsFollowUp: Boolean(parsed.needsFollowUp && !isDeterministicEmergency),
        nextFollowUpQuestion: parsed.nextFollowUpQuestion || undefined,
        evidenceRetrieved,
        questionsForDoctorAr: parsed.questionsForDoctorAr || [],
        questionsForDoctorEn: parsed.questionsForDoctorEn || [],
        providerUsed: this.name,
        pipelineAudits: [
          {
            step: '1_INTENT_ANALYSIS',
            status: 'PASSED',
            detailsAr: `تحليل النية السريرية عبر Gemini: ${parsed.intent}`,
            detailsEn: `Clinical intent via Gemini: ${parsed.intent}`,
          },
          {
            step: '2_SYMPTOM_EXTRACTION',
            status: 'PASSED',
            detailsAr: `استخراج الأعراض والمحددات: ${parsed.extractedAttributes?.primarySymptom || 'نص سريري'}`,
            detailsEn: `Attributes extracted: ${parsed.extractedAttributes?.primarySymptom || 'Clinical text'}`,
          },
          {
            step: '3_RED_FLAG_SAFETY',
            status: mergedRedFlags.length > 0 ? 'TRIGGERED' : 'PASSED',
            detailsAr: `رصد علامات الخطر: ${mergedRedFlags.length} مؤشر تحذيري`,
            detailsEn: `Red flag scan: ${mergedRedFlags.length} warnings detected`,
          },
          {
            step: '4_PROGRESSIVE_FOLLOW_UP',
            status: parsed.nextFollowUpQuestion ? 'APPLIED' : 'PASSED',
            detailsAr: parsed.nextFollowUpQuestion ? `توجيه السؤال السريري الأهم: ${parsed.nextFollowUpQuestion.attribute}` : 'اكتملت عناصر الفحص الأولي',
            detailsEn: parsed.nextFollowUpQuestion ? `Highest priority follow-up: ${parsed.nextFollowUpQuestion.attribute}` : 'Baseline inquiry satisfied',
          },
          {
            step: '5_EVIDENCE_GROUNDING',
            status: 'PASSED',
            detailsAr: `مطابقة الأدلة السريرية: ${evidenceRetrieved.length} مرجع معتمد`,
            detailsEn: `Evidence grounded: ${evidenceRetrieved.length} verified guidelines`,
          },
        ],
        suggestedConversationTitle: parsed.suggestedConversationTitle,
      };
    } catch (error: any) {
      console.warn('Gemini Provider encountered an issue, gracefully falling back to Clinical Fallback Provider:', error?.message);
      throw error; // Let AI Gateway handle fallback seamlessly
    }
  }
}
