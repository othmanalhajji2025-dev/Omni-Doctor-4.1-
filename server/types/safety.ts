export type SafetyRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT' | 'EMERGENCY';

export type SafetyRuleCategory =
  | 'CARDIOVASCULAR'
  | 'NEUROLOGICAL'
  | 'RESPIRATORY'
  | 'SEPSIS_INFECTION'
  | 'ANAPHYLAXIS'
  | 'ACUTE_ABDOMEN'
  | 'TRAUMA_BLEEDING'
  | 'PSYCHIATRIC'
  | 'METABOLIC'
  | 'PEDIATRIC'
  | 'GENERAL';

export interface SafetyEvaluationInput {
  text: string;
  symptoms?: string;
  duration?: string;
  severity?: string;
  painScale?: number;
  vitalSigns?: {
    systolicBP?: number;
    diastolicBP?: number;
    heartRate?: number;
    spO2?: number;
    temperature?: number;
    bloodGlucose?: number;
  };
  patientContext?: {
    age?: number;
    gender?: string;
    pregnant?: boolean;
    chronicConditions?: string[];
    currentMedications?: string[];
    allergies?: string[];
  };
  language?: 'ar' | 'en';
}

export interface SafetyRule {
  ruleId: string;
  nameAr: string;
  nameEn: string;
  category: SafetyRuleCategory;
  trigger: string;
  conditions: {
    descriptionAr: string;
    descriptionEn: string;
    matches: (input: SafetyEvaluationInput) => boolean;
  };
  riskLevel: SafetyRiskLevel;
  explanation: {
    ar: string;
    en: string;
    clinicalRationaleAr: string;
    clinicalRationaleEn: string;
  };
  action: {
    ar: string;
    en: string;
    emergencyCallRequired: boolean;
    safeWaitingStepsAr: string[];
    safeWaitingStepsEn: string[];
  };
}

export interface TriggeredSafetyRuleSummary {
  ruleId: string;
  category: SafetyRuleCategory;
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
    category: SafetyRuleCategory;
    trigger: string;
    riskLevel: SafetyRiskLevel;
  }>;
  actionTaken: 'EMERGENCY_OVERRIDE' | 'SAFETY_WARNING' | 'ROUTINE_MONITOR';
  reviewStatus?: 'PENDING_REVIEW' | 'INVESTIGATED' | 'DISMISSED' | 'RESOLVED';
  reviewedBy?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  anonymizedContext: {
    symptomCategory: SafetyRuleCategory;
    characterCount: number;
    hasVitals: boolean;
    painScale?: number;
    sessionId?: string;
  };
}
