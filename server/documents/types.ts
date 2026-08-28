export type AllowedFileType = 'PDF' | 'PNG' | 'JPG' | 'JPEG';

export type DocumentCategory =
  | 'LAB_REPORT'
  | 'IMAGING_REPORT'
  | 'PRESCRIPTION'
  | 'DISCHARGE_SUMMARY'
  | 'CLINICAL_NOTE'
  | 'OTHER';

export type DocumentStatus =
  | 'UPLOADED'
  | 'EXTRACTED_PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED';

export type LabStatus = 'Normal' | 'High' | 'Low' | 'Critical';

export interface FileValidationResult {
  isValid: boolean;
  fileType?: AllowedFileType;
  mimeType: string;
  sizeBytes: number;
  errorMessage?: string;
  errorMessageAr?: string;
}

export interface ReferenceRange {
  min?: number;
  max?: number;
  textRange: string;
  textRangeAr?: string;
  unit: string;
  ageRange?: string;
  sexTarget?: 'ALL' | 'MALE' | 'FEMALE';
  criticalLow?: number;
  criticalHigh?: number;
}

export interface ExtractedLabItem {
  id: string;
  testName: string;
  testNameAr: string;
  category: string;
  categoryAr: string;
  resultValue: number | string;
  isNumeric: boolean;
  unit: string;
  referenceRange: ReferenceRange;
  status: LabStatus;
  confidenceScore: number; // 0 to 1 confidence from OCR
  ocrExtractedText?: string;
  interpretation: {
    flagExplanationAr: string;
    flagExplanationEn: string;
    clinicalContextNotesAr: string;
    clinicalContextNotesEn: string;
    ageAwareCommentAr?: string;
    ageAwareCommentEn?: string;
    sexAwareCommentAr?: string;
    sexAwareCommentEn?: string;
    unitAwareCommentAr?: string;
    unitAwareCommentEn?: string;
    criticalWarningAr?: string;
    criticalWarningEn?: string;
    differentialPossibilitiesAr: string[];
    differentialPossibilitiesEn: string[];
    recommendedFollowUpAr: string;
    recommendedFollowUpEn: string;
  };
  userConfirmed: boolean;
  editedByUser?: boolean;
}

export interface MedicalDocumentRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: AllowedFileType;
  mimeType: string;
  fileSizeBytes: number;
  storagePath?: string;
  fileDataUrl?: string; // For previews if image/PDF data
  uploadedAt: string;
  pipelineStep: 'UPLOADED' | 'TEXT_EXTRACTED' | 'CLASSIFIED' | 'DATA_EXTRACTED' | 'USER_CONFIRMED';
  status: DocumentStatus;
  classification: {
    category: DocumentCategory;
    categoryAr: string;
    categoryEn: string;
    confidenceScore: number;
    documentDate?: string;
    issuingFacility?: string;
    doctorName?: string;
    summaryAr: string;
    summaryEn: string;
  };
  rawExtractedText: string;
  extractionSource: 'GEMINI_VISION' | 'PDF_PARSER' | 'CLINICAL_OCR_ENGINE';
  extractedLabResults: ExtractedLabItem[];
  confirmedLabResults?: ExtractedLabItem[];
  userReviewNotes?: string;
  confirmedAt?: string;
  accessControl: {
    ownerId: string;
    sharedWithRoles: string[];
    isEncrypted: boolean;
    isArchived: boolean;
  };
}

export interface PatientLabContext {
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  isPregnant?: boolean;
  activeConditions?: string[];
  currentMedications?: string[];
  activeSymptoms?: string[];
}

export interface HealthTimelineEvent {
  id: string;
  date: string;
  type: 'SYMPTOM' | 'CONSULTATION' | 'MEDICATION' | 'TEST' | 'RESULT';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category?: string;
  statusBadge?: {
    textAr: string;
    textEn: string;
    variant: 'normal' | 'warning' | 'critical' | 'info' | 'success';
  };
  associatedData?: {
    symptomName?: string;
    severity?: string;
    urgency?: string;
    doctorName?: string;
    medicationName?: string;
    dosage?: string;
    testName?: string;
    resultValue?: string | number;
    unit?: string;
    referenceRange?: string;
    documentId?: string;
  };
}

export interface BiomarkerTrendPoint {
  date: string;
  value: number;
  unit: string;
  status: LabStatus;
  referenceMin?: number;
  referenceMax?: number;
  documentId?: string;
}

export interface BiomarkerTrendSeries {
  testName: string;
  testNameAr: string;
  unit: string;
  points: BiomarkerTrendPoint[];
  standardMin: number;
  standardMax: number;
}
