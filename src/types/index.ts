/**
 * Unified TypeScript Type Definitions for OmniDoctor AI
 */

export type NavigationTab =
  | 'home'
  | 'dashboard'
  | 'assistant'
  | 'triage'
  | 'health'
  | 'drugs'
  | 'labs'
  | 'documents'
  | 'evidence'
  | 'emergency'
  | 'admin';

export type Language = 'ar' | 'en';

export type UserRole =
  | 'GUEST'
  | 'USER'
  | 'HEALTHCARE_PROFESSIONAL'
  | 'ADMINISTRATOR'
  | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  fullNameEn?: string;
  nationalId?: string;
  phoneNumber?: string;
  specialty?: string;
  licenseNumber?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt?: string;
}

export interface PersonalInformation {
  id?: string;
  userId?: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  weightKg: number;
  ethnicity: string;
  bloodType: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  updatedAt?: string;
}

export interface MedicalCondition {
  id: string;
  userId?: string;
  nameAr: string;
  nameEn?: string;
  status: 'ACTIVE' | 'MANAGED' | 'REMISSION';
  diagnosedYear: number;
  notes?: string;
  createdAt?: string;
}

export interface Allergy {
  id: string;
  userId?: string;
  allergenAr: string;
  allergenEn?: string;
  type: 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
  reactionAr: string;
  reactionEn?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  createdAt?: string;
}

export interface Medication {
  id: string;
  userId?: string;
  nameAr: string;
  nameEn?: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  prescriber?: string;
  indication?: string;
  status: 'ACTIVE' | 'DISCONTINUED';
  createdAt?: string;
}

export interface Surgery {
  id: string;
  userId?: string;
  surgeryNameAr: string;
  surgeryNameEn?: string;
  year: number;
  hospital?: string;
  notes?: string;
  createdAt?: string;
}

export interface ConsultationRecordItem {
  id: string;
  userId?: string;
  timestamp: string;
  symptoms: string;
  urgency: TriageUrgency;
  urgencyLabelAr: string;
  urgencyLabelEn: string;
  differentials: Array<{ nameAr: string; nameEn: string; probability: string }>;
  redFlagsCount: number;
  summaryAr: string;
  summaryEn: string;
  status: 'COMPLETED' | 'REFERRED_TO_CLINIC' | 'EMERGENCY_DISPATCHED';
}

export interface UserDashboardData {
  user: User;
  recentConsultation: ConsultationRecordItem | null;
  activeSymptoms: {
    reportedSymptoms: string;
    urgency: TriageUrgency;
    urgencyLabelAr: string;
    urgencyLabelEn: string;
    timestamp: string;
    differentials: Array<{ nameAr: string; nameEn: string; probability: string }>;
  } | null;
  currentMedications: {
    count: number;
    items: Medication[];
  };
  allergies: {
    count: number;
    items: Allergy[];
    hasSevere: boolean;
  };
  healthProfile: {
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    heightCm: number;
    weightKg: number;
    bmi: number;
    ethnicity: string;
    bloodType: string;
    conditionsCount: number;
    surgeriesCount: number;
    emergencyContact: {
      name: string;
      relation: string;
      phone: string;
    };
    updatedAt: string;
  };
  conditions: MedicalCondition[];
  surgeries: Surgery[];
}

export type TriageUrgency = 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';

export interface VitalsInput {
  systolicBP?: number | string;
  diastolicBP?: number | string;
  heartRate?: number | string;
  spO2?: number | string;
  temperature?: number | string;
  bloodGlucose?: number | string;
  respiratoryRate?: number | string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  fullNameEn?: string;
  nationalId?: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType?: string;
  heightCm?: number;
  weightKg?: number;
  chronicConditions: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    sinceYear?: number;
  }>;
  allergies: Array<{
    id: string;
    allergenAr: string;
    allergenEn: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
  }>;
  currentMedications: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    dosage: string;
    frequency: string;
  }>;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
}

export interface DrugInteraction {
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

export interface LabParameterResult {
  parameterName: string;
  parameterNameAr: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
    optimalText?: string;
  };
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL_HIGH' | 'CRITICAL_LOW';
  clinicalSignificanceAr: string;
  clinicalSignificanceEn: string;
  suggestedFollowUpAr: string;
  suggestedFollowUpEn: string;
}

export interface TriageResult {
  id: string;
  timestamp: string;
  rawInput: string;
  urgency: TriageUrgency;
  isRedFlag: boolean;
  redFlags: Array<{
    nameAr: string;
    nameEn: string;
    urgency: TriageUrgency;
    actionAr: string;
    actionEn: string;
  }>;
  differentialDiagnoses: Array<{
    conditionNameAr: string;
    conditionNameEn: string;
    likelihood: 'HIGH' | 'MODERATE' | 'LOW';
    clinicalRationaleAr: string;
    clinicalRationaleEn: string;
    recommendedActionsAr: string[];
    recommendedActionsEn: string[];
  }>;
  patientQuestionsForDoctorAr: string[];
  patientQuestionsForDoctorEn: string[];
  recommendedSpecialtiesAr: string[];
  recommendedSpecialtiesEn: string[];
  evidenceSources: Array<{
    title: string;
    organization: string;
    url?: string;
    summaryAr: string;
    summaryEn: string;
  }>;
  disclaimerAr: string;
  disclaimerEn: string;
}

export interface ClinicalNextQuestion {
  questionAr: string;
  questionEn: string;
  attribute: string;
  quickOptionsAr: string[];
  quickOptionsEn: string[];
  priority: number;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
  isHealthRelated?: boolean;
  extractedAttributes?: {
    primarySymptom?: string;
    onset?: string;
    location?: string;
    character?: string;
    severity?: number;
    radiation?: string;
    aggravatingRelieving?: string;
    associatedSymptoms?: string[];
  };
  nextFollowUpQuestion?: ClinicalNextQuestion;
  redFlagsDetected?: Array<{
    nameAr: string;
    nameEn: string;
    urgency: TriageUrgency;
    actionAr: string;
    actionEn: string;
  }>;
  evidenceSources?: Array<{
    id?: string;
    title: string;
    titleEn?: string;
    organization: string;
    summaryAr: string;
    summaryEn: string;
    url?: string;
    authorityLevel?: string;
    isVerifiedRetrieved?: boolean;
    lastUpdated?: string;
    excerpt?: string;
    chunkId?: string;
  }>;
  questionsForDoctorAr?: string[];
  questionsForDoctorEn?: string[];
  urgencyTag?: TriageUrgency;
  isEmergency?: boolean;
  safetyRiskLevel?: SafetyRiskLevel;
  safetyOverride?: boolean;
  safetyEvaluation?: SafetyEvaluationResult;
  emergencyPayload?: EmergencyResponseModePayload;
  providerUsed?: string;
  pipelineAudits?: Array<{
    step: string;
    status: 'PASSED' | 'TRIGGERED' | 'APPLIED';
    detailsAr: string;
    detailsEn: string;
  }>;
  references?: Array<{
    title: string;
    url?: string;
  }>;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
  urgency: TriageUrgency;
  status: 'ACTIVE' | 'ARCHIVED' | 'ESCALATED_EMERGENCY';
}

export interface ConversationDetail {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  clinicalContext: {
    primarySymptom?: string;
    isHealthRelated: boolean;
    intent: string;
    extractedAttributes: Record<string, any>;
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
    completedTriage: boolean;
  };
  status: 'ACTIVE' | 'ARCHIVED' | 'ESCALATED_EMERGENCY';
}

export interface DocumentRecord {
  id: string;
  title: string;
  type: 'LAB_REPORT' | 'PRESCRIPTION' | 'DISCHARGE_SUMMARY' | 'RADIOLOGY' | 'VACCINATION';
  date: string;
  doctorName?: string;
  facility?: string;
  summaryAr: string;
  summaryEn: string;
  tags: string[];
  fileUrl?: string;
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
  sources: Array<{
    id?: string;
    title: string;
    titleEn?: string;
    organization: string;
    summaryAr: string;
    summaryEn: string;
    url?: string;
  }>;
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
    evidenceSources: Array<{
      id?: string;
      title: string;
      titleEn?: string;
      organization: string;
      summaryAr: string;
      summaryEn: string;
      url?: string;
    }>;
  };
  step7GenerateSafeResponse: {
    finalResponse: ClinicalFinalResponse;
  };
  explainability: ExplainabilityReport;
}

export type SafetyRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT' | 'EMERGENCY';

export interface EmergencyResponseModePayload {
  isEmergencyMode: boolean;
  alertBannerAr: string;
  alertBannerEn: string;
  reasonForConcernAr: string;
  reasonForConcernEn: string;
  urgentGuidanceAr: string;
  urgentGuidanceEn: string;
  emergencyNumbers: {
    primary: string;
    serviceNameAr: string;
    serviceNameEn: string;
  };
  safeWaitingStepsAr: string[];
  safeWaitingStepsEn: string[];
  restrictedWarningAr: string;
  restrictedWarningEn: string;
}

export interface TriggeredSafetyRuleSummary {
  ruleId: string;
  category: string;
  trigger: string;
  riskLevel: SafetyRiskLevel;
  nameAr: string;
  nameEn: string;
  explanationAr: string;
  explanationEn: string;
  actionAr: string;
  actionEn: string;
  emergencyCallRequired: boolean;
  safeWaitingStepsAr: string[];
  safeWaitingStepsEn: string[];
}

export interface SafetyEvaluationResult {
  riskLevel: SafetyRiskLevel;
  isEmergency: boolean;
  isOverrideActive: boolean;
  triggeredRules: TriggeredSafetyRuleSummary[];
  highestRule?: TriggeredSafetyRuleSummary;
  emergencyPayload?: EmergencyResponseModePayload;
  clinicalExplanationAr: string;
  clinicalExplanationEn: string;
  recommendedActionAr: string;
  recommendedActionEn: string;
  safeWaitingStepsAr: string[];
  safeWaitingStepsEn: string[];
  evaluatedAt: string;
}

export interface SafetyEvent {
  eventId: string;
  timestamp: string;
  riskLevel: SafetyRiskLevel;
  triggeredRules: Array<{
    ruleId: string;
    category: string;
    trigger: string;
    riskLevel: SafetyRiskLevel;
  }>;
  actionTaken: 'EMERGENCY_OVERRIDE' | 'SAFETY_WARNING' | 'ROUTINE_MONITOR';
  reviewStatus?: 'PENDING_REVIEW' | 'INVESTIGATED' | 'DISMISSED' | 'RESOLVED';
  reviewedBy?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  anonymizedContext: {
    symptomCategory?: string;
    characterCount: number;
    hasVitals: boolean;
    painScale?: number;
    sessionId?: string;
  };
}

export interface AiRequestLogItem {
  id: string;
  timestamp: string;
  endpoint: string;
  model: string;
  latencyMs: number;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  statusCode: number;
  success: boolean;
  errorCategory?: 'NONE' | 'SAFETY_VIOLATION' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_REQUEST' | 'INTERNAL_ERROR';
  anonymizedIntent: string;
  characterCount: number;
}

export interface AiMonitoringOverview {
  totalRequests: number;
  totalErrors: number;
  errorRatePercentage: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p99LatencyMs: number;
  totalTokensUsed: number;
  promptTokensUsed: number;
  responseTokensUsed: number;
  modelBreakdown: Record<string, { requests: number; tokens: number; avgLatencyMs: number; errors: number }>;
  endpointBreakdown: Record<string, { requests: number; tokens: number; errors: number }>;
  errorBreakdown: Record<string, number>;
  hourlyMetrics: Array<{
    hour: string;
    requests: number;
    errors: number;
    avgLatency: number;
    tokens: number;
  }>;
}

export interface DrugProfile {
  id?: string;
  genericName: string;
  genericNameAr: string;
  brandNames: string[];
  brandNamesAr?: string[];
  drugClass: string;
  drugClassAr?: string;
  atcCode: string;
  indications: string[];
  contraindications: string[];
  blackBoxWarnings?: string[];
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A';
  isWhoEssential?: boolean;
  dosageForms?: Array<{ form: string; strengths: string[]; route: string }>;
  pharmacokinetics?: { halfLife?: string; bioavailability?: string; excretion?: string };
}




