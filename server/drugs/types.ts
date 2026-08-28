/**
 * Drug Intelligence Types & Data Source Architecture
 * Phase 7: Pharmacopeia, Safety Verification & YemenMD
 */

export type AuthoritySourceTier = 
  | 'TIER_1_REGULATORY' // FDA, EMA, SFDA, WHO EML
  | 'TIER_2_FORMULARY'  // BNF, DailyMed, RxNorm
  | 'DEMO_SEED_DATASET'; // Explicit label for curated demo seed data

export interface DataSourceMetadata {
  sourceId: string;
  sourceName: string;
  authorityTier: AuthoritySourceTier;
  isDemoSeedData: boolean;
  intendedUse: string;
  disclaimer: string;
  version: string;
  lastUpdated: string;
}

export interface DrugInteractionDetail {
  interactingDrugOrClass: string;
  severity: 'CONTRAINDICATED' | 'MAJOR' | 'MODERATE' | 'MINOR';
  mechanismAr: string;
  mechanismEn: string;
  clinicalEffectAr: string;
  clinicalEffectEn: string;
  managementAr: string;
  managementEn: string;
  source: string;
}

export interface DrugProfile {
  id: string;
  genericName: string;
  genericNameAr: string;
  brandNames: string[];
  brandNamesAr?: string[];
  activeIngredients: string[];
  activeIngredientsAr?: string[];
  drugClass: string;
  drugClassAr: string;
  atcCode?: string;
  commonUsesAr: string[];
  commonUsesEn: string[];
  warningsAr: string[];
  warningsEn: string[];
  boxedWarningAr?: string;
  boxedWarningEn?: string;
  contraindicationsAr: string[];
  contraindicationsEn: string[];
  commonSideEffectsAr: string[];
  commonSideEffectsEn: string[];
  seriousSideEffectsAr: string[];
  seriousSideEffectsEn: string[];
  interactions: DrugInteractionDetail[];
  dosageGuidelinesAr?: string;
  dosageGuidelinesEn?: string;
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  renalAdjustmentRequired?: boolean;
  hepaticAdjustmentRequired?: boolean;
  metadata: DataSourceMetadata;
}

export interface DrugSearchResult {
  id: string;
  genericName: string;
  genericNameAr: string;
  matchedBrandName?: string;
  matchedActiveIngredient?: string;
  matchType: 'GENERIC' | 'BRAND' | 'ACTIVE_INGREDIENT';
  brandNames: string[];
  activeIngredients: string[];
  drugClass: string;
  drugClassAr: string;
  hasBoxedWarning: boolean;
  summaryAr: string;
  summaryEn: string;
  isDemoSeedData: boolean;
}

export interface DuplicateIngredientAlert {
  activeIngredient: string;
  activeIngredientAr: string;
  conflictingMedications: string[];
  clinicalRiskAr: string;
  clinicalRiskEn: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface AllergyAlert {
  medication: string;
  patientAllergy: string;
  allergyType: string;
  reactionRiskAr: string;
  reactionRiskEn: string;
  severity: 'CONTRAINDICATED' | 'HIGH_ALERT';
}

export interface ConditionContraindicationAlert {
  medication: string;
  condition: string;
  conditionAr: string;
  severity: 'ABSOLUTE_CONTRAINDICATION' | 'CAUTION_REQUIRED';
  explanationAr: string;
  explanationEn: string;
  recommendationAr: string;
  recommendationEn: string;
}

export interface DrugSafetyCheckRequest {
  currentMedications: string[];
  newMedication?: string;
  allergies?: string[];
  conditions?: string[];
  patientAge?: number;
  isPregnant?: boolean;
  eGFR?: number;
}

export interface DrugSafetyCheckResult {
  overallRiskLevel: 'SAFE' | 'MODERATE_PRECAUTION' | 'HIGH_RISK' | 'CRITICAL_STOP';
  riskScore: number; // 0 (completely safe) to 100 (critical stop)
  hasCriticalStop: boolean;
  duplicateActiveIngredients: DuplicateIngredientAlert[];
  allergyAlerts: AllergyAlert[];
  conditionContraindications: ConditionContraindicationAlert[];
  drugInteractions: DrugInteractionDetail[];
  clinicalSummaryAr: string;
  clinicalSummaryEn: string;
  recommendationsAr: string[];
  recommendationsEn: string[];
  evaluatedMedicationsCount: number;
  dataSourceMetadata: DataSourceMetadata;
  evaluatedAt: string;
}

/**
 * YemenMD Database Model (Dedicated Separate Module)
 * Required Fields:
 * - GenericName
 * - BrandName
 * - Strength
 * - DosageForm
 * - Manufacturer
 * - Country
 * - Availability
 * - LastUpdated
 */
export type YemenMdAvailability = 
  | 'AVAILABLE' 
  | 'SCARCE' 
  | 'DISCONTINUED' 
  | 'HOSPITAL_RESTRICTED';

export interface YemenMdRecord {
  id: string;
  GenericName: string;
  BrandName: string;
  Strength: string;
  DosageForm: string;
  Manufacturer: string;
  Country: string;
  Availability: YemenMdAvailability;
  LastUpdated: string;
  // Local marketplace extension fields:
  registrationNumber?: string;
  estimatedPriceYer?: number;
  localDistributor?: string;
  storageNotesAr?: string;
  storageNotesEn?: string;
  notesAr?: string;
  notesEn?: string;
}

/**
 * Data Source Architecture Interface
 */
export interface IDrugDataSource {
  id: string;
  name: string;
  authorityTier: AuthoritySourceTier;
  isDemoSeed: boolean;
  status: 'ACTIVE' | 'READY_FOR_INTEGRATION' | 'STANDBY';
  disclaimer: string;
  search(query: string, searchType?: 'all' | 'brand' | 'generic' | 'ingredient'): Promise<DrugSearchResult[]>;
  getProfile(idOrGeneric: string): Promise<DrugProfile | null>;
  getAllProfiles(): Promise<DrugProfile[]>;
}
