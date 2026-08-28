export type TriageUrgency = 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';

export type Language = 'ar' | 'en';

export interface RedFlagRule {
  id: string;
  nameAr: string;
  nameEn: string;
  keywordsAr: string[];
  keywordsEn: string[];
  urgency: TriageUrgency;
  actionAr: string;
  actionEn: string;
  category: 'CARDIOVASCULAR' | 'NEUROLOGICAL' | 'RESPIRATORY' | 'ABDOMINAL' | 'INFECTION' | 'TRAUMA' | 'PSYCHIATRIC' | 'TOXICOLOGY';
}

export interface VitalSignInput {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  bloodGlucose?: number;
}

export interface PatientContext {
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  pregnant?: boolean;
  chronicConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  smoking?: boolean;
}

export interface SymptomAnalysisRequest {
  symptoms: string;
  duration?: string;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  painScale?: number; // 1 to 10
  associatedSymptoms?: string[];
  patientContext?: PatientContext;
  vitalSigns?: VitalSignInput;
  language?: Language;
}

export interface EvidenceSource {
  id: string;
  title: string;
  titleEn: string;
  organization: 'WHO' | 'NICE' | 'CDC' | 'MOH_SA' | 'UPTODATE' | 'AHA' | 'ESC' | 'ADA' | string;
  guidelineId: string;
  year: number;
  url?: string;
  summaryAr: string;
  summaryEn: string;
  topics: string[];
  authorityLevel?: string;
  isVerifiedRetrieved?: boolean;
  lastUpdated?: string;
  excerpt?: string;
  chunkId?: string;
}

export interface DifferentialPossibility {
  conditionNameAr: string;
  conditionNameEn: string;
  probabilityLevel: 'POSSIBLE' | 'CONSIDERATION' | 'LESS_LIKELY';
  probabilisticStatementAr: string;
  probabilisticStatementEn: string;
  clinicalRationaleAr: string;
  clinicalRationaleEn: string;
  typicalSymptomsAr: string[];
  typicalSymptomsEn: string[];
}

export interface ClinicalSafetyStepAudit {
  step: 'INPUT' | 'CLINICAL_CONTEXT' | 'RED_FLAG_DETECTION' | 'SAFETY_CLASSIFICATION' | 'EVIDENCE_RETRIEVAL' | 'AI_REASONING' | 'SAFE_RESPONSE_GUARDRAIL';
  status: 'PASSED' | 'TRIGGERED' | 'APPLIED';
  timestamp: string;
  detailsAr: string;
  detailsEn: string;
}

export interface SymptomAnalysisResult {
  encounterId: string;
  timestamp: string;
  urgency: TriageUrgency;
  urgencyLabelAr: string;
  urgencyLabelEn: string;
  redFlagsDetected: Array<{
    nameAr: string;
    nameEn: string;
    actionAr: string;
    actionEn: string;
  }>;
  probabilisticDifferentials: DifferentialPossibility[];
  clinicalSummaryAr: string;
  clinicalSummaryEn: string;
  recommendedActionsAr: string[];
  recommendedActionsEn: string[];
  questionsForDoctorAr: string[];
  questionsForDoctorEn: string[];
  evidenceSources: EvidenceSource[];
  safetyDisclaimersAr: string;
  safetyDisclaimersEn: string;
  pipelineAuditTrail: ClinicalSafetyStepAudit[];
  usedAiModel: string;
}

export interface DrugItem {
  id: string;
  genericName: string;
  brandNames: string[];
  nameAr: string;
  category: string;
  commonUsesAr: string[];
  commonUsesEn: string[];
}

export interface DrugInteractionResult {
  drugA: string;
  drugB: string;
  severity: 'CONTRAINDICATED' | 'MAJOR' | 'MODERATE' | 'MINOR';
  mechanismAr: string;
  mechanismEn: string;
  clinicalEffectAr: string;
  clinicalEffectEn: string;
  managementAr: string;
  managementEn: string;
  source: string;
}

export interface LabParameterInput {
  name: string;
  value: number;
  unit: string;
}

export interface LabAnalysisResult {
  parameterName: string;
  parameterNameAr: string;
  value: number;
  unit: string;
  referenceRange: { min: number; max: number; optimalText?: string };
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW';
  clinicalSignificanceAr: string;
  clinicalSignificanceEn: string;
  suggestedFollowUpAr: string;
  suggestedFollowUpEn: string;
}

// ==========================================
// PHASE 4: CLINICAL REASONING ENGINE TYPES
// ==========================================

export interface OLDCARTS {
  onset?: string;                // O — Onset (البداية والظهور)
  location?: string;             // L — Location (الموضع والامتداد)
  duration?: string;             // D — Duration (المدة الزمنية)
  character?: string;            // C — Character (طبيعة الألم/العَرَض)
  aggravatingFactors?: string[]; // A — Aggravating Factors (عوامل التفاقم)
  relievingFactors?: string[];   // R — Relieving Factors (عوامل التخفيف)
  timing?: string;               // T — Timing (التوقيت والنمط الزمني)
  severity?: number;             // S — Severity (الشدة 1-10)
}

export interface MissingOLDCARTSElement {
  field: keyof OLDCARTS;
  code: 'O' | 'L' | 'D' | 'C' | 'A' | 'R' | 'T' | 'S';
  labelAr: string;
  labelEn: string;
  isPertinent: boolean;
  priority: number;
  questionAr: string;
  questionEn: string;
  whyThisQuestionAr: string;
  whyThisQuestionEn: string;
  quickOptionsAr?: string[];
  quickOptionsEn?: string[];
}

export interface ExtractedSymptomData {
  symptoms: string[];
  duration?: string;
  severity?: string;
  painScale?: number;
  location?: string;
  associatedSymptoms: string[];
  medicationContext: string[];
  medicalHistoryContext: string[];
  consentGranted: boolean;
  oldcarts: OLDCARTS;
}

export interface DifferentialItem {
  nameAr: string;
  nameEn: string;
  supportingFactorsAr: string[];
  supportingFactorsEn: string[];
  missingFactorsAr: string[];
  missingFactorsEn: string[];
  concernLevel: 'LOW' | 'MODERATE' | 'HIGH';
  recommendedEvaluationAr: string;
  recommendedEvaluationEn: string;
  whyAppearedAr: string;
  whyAppearedEn: string;
}

export interface ExplainabilityReport {
  whyQuestionAsked?: {
    questionAr: string;
    questionEn: string;
    clinicalReasonAr: string;
    clinicalReasonEn: string;
  };
  whyUrgencyLevel: {
    urgency: TriageUrgency;
    rationaleAr: string;
    rationaleEn: string;
    triggers: string[];
  };
  whyDifferentialsAppeared: Array<{
    conditionAr: string;
    conditionEn: string;
    rationaleAr: string;
    rationaleEn: string;
    supportingFactors: string[];
  }>;
}

export interface ClinicalFinalResponse {
  summaryAr: string;
  summaryEn: string;
  understoodSymptoms: {
    chiefSymptomAr: string;
    chiefSymptomEn: string;
    oldcartsSummaryAr: Record<string, string>;
    oldcartsSummaryEn: Record<string, string>;
    associatedSymptomsAr: string[];
    associatedSymptomsEn: string[];
    medicationsNoteAr?: string;
    medicationsNoteEn?: string;
    medicalHistoryNoteAr?: string;
    medicalHistoryNoteEn?: string;
  };
  possibleDifferentials: DifferentialItem[];
  redFlagsSummary: Array<{
    nameAr: string;
    nameEn: string;
    urgency: TriageUrgency;
    actionAr: string;
    actionEn: string;
    isTriggered: boolean;
  }>;
  immediateActions: {
    actionsAr: string[];
    actionsEn: string[];
  };
  whenToSeeDoctor: {
    timingAr: string;
    timingEn: string;
    criteriaAr: string[];
    criteriaEn: string[];
  };
  sources: EvidenceSource[];
}

export interface ClinicalReasoningEncounter {
  encounterId: string;
  timestamp: string;
  requestText: string;
  consentGranted: boolean;
  // 7-Step Protocol Results
  step1CollectSymptoms: ExtractedSymptomData;
  step2ClarifySymptoms: {
    oldcarts: OLDCARTS;
    missingElements: MissingOLDCARTSElement[];
    nextPriorityQuestion?: MissingOLDCARTSElement;
  };
  step3DetectRedFlags: {
    detected: Array<{
      nameAr: string;
      nameEn: string;
      urgency: TriageUrgency;
      actionAr: string;
      actionEn: string;
    }>;
    elevationReasonAr?: string;
    elevationReasonEn?: string;
  };
  step4GenerateDifferentials: {
    differentials: DifferentialItem[];
  };
  step5EstimateUrgency: {
    urgency: TriageUrgency;
    urgencyLabelAr: string;
    urgencyLabelEn: string;
    rationaleAr: string;
    rationaleEn: string;
  };
  step6VerifyEvidence: {
    evidenceSources: EvidenceSource[];
  };
  step7GenerateSafeResponse: {
    finalResponse: ClinicalFinalResponse;
  };
  explainability: ExplainabilityReport;
}
