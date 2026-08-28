import {
  TriageUrgency,
  Language,
  PatientContext,
  EvidenceSource,
} from '../../types/medical.js';
import {
  SafetyEvaluationResult,
  SafetyRiskLevel,
  EmergencyResponseModePayload,
} from '../../types/safety.js';

export interface ExtractedClinicalAttributes {
  primarySymptom?: string;
  onset?: string;
  location?: string;
  character?: string;
  severity?: number; // 1-10
  radiation?: string;
  aggravatingRelieving?: string;
  associatedSymptoms?: string[];
}

export interface NextFollowUpQuestion {
  questionAr: string;
  questionEn: string;
  attribute: string;
  quickOptionsAr: string[];
  quickOptionsEn: string[];
  priority: number; // 1 = highest priority
}

export interface ClinicalConversationContext {
  primarySymptom?: string;
  isHealthRelated: boolean;
  intent:
    | 'SYMPTOM_INQUIRY'
    | 'MEDICATION_QUESTION'
    | 'LAB_EXPLANATION'
    | 'GENERAL_HEALTH'
    | 'EMERGENCY_CRISIS'
    | 'FOLLOW_UP_ANSWER'
    | 'DOCTOR_PREPARATION'
    | 'NON_HEALTH';
  extractedAttributes: ExtractedClinicalAttributes;
  missingAttributes: string[];
  redFlags: Array<{
    nameAr: string;
    nameEn: string;
    urgency: TriageUrgency;
    actionAr: string;
    actionEn: string;
  }>;
  urgency: TriageUrgency;
  currentQuestionIndex: number;
  evidenceRetrieved?: EvidenceSource[];
  completedTriage: boolean;
}

export interface ClinicalDialogueRequest {
  conversationId: string;
  message: string;
  language: Language;
  patientContext?: PatientContext;
  conversationHistory: Array<{
    sender: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
  }>;
  clinicalContext?: ClinicalConversationContext;
}

export interface ClinicalDialogueResponse {
  conversationId: string;
  messageId: string;
  content: string;
  intent: ClinicalConversationContext['intent'];
  isHealthRelated: boolean;
  extractedAttributes: ExtractedClinicalAttributes;
  missingAttributes: string[];
  redFlagsDetected: Array<{
    nameAr: string;
    nameEn: string;
    urgency: TriageUrgency;
    actionAr: string;
    actionEn: string;
  }>;
  urgency: TriageUrgency;
  needsFollowUp: boolean;
  nextFollowUpQuestion?: NextFollowUpQuestion;
  evidenceRetrieved: EvidenceSource[];
  questionsForDoctorAr: string[];
  questionsForDoctorEn: string[];
  providerUsed: string;
  pipelineAudits: Array<{
    step: string;
    status: 'PASSED' | 'TRIGGERED' | 'APPLIED';
    detailsAr: string;
    detailsEn: string;
  }>;
  suggestedConversationTitle?: string;
  safetyOverride?: boolean;
  safetyRiskLevel?: SafetyRiskLevel;
  safetyEvaluation?: SafetyEvaluationResult;
  emergencyPayload?: EmergencyResponseModePayload;
}

export interface AIProvider {
  readonly name: string;
  isAvailable(): boolean;
  processClinicalDialogue(request: ClinicalDialogueRequest): Promise<ClinicalDialogueResponse>;
}
