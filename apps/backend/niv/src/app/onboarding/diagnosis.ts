// Domain data structure - designed to map from PCC condition API
export type Diagnosis = {
  readonly conditionId: number;
  readonly icd10Code: string;
  readonly description: string;
  readonly onsetDate: Date;
  readonly isPrimary: boolean;
};

// Clinical qualification categories
export type ClinicalQualifications = {
  readonly COPD: boolean;
  readonly CRF: boolean; // Chronic Respiratory Failure
  readonly NMD: boolean; // Neuromuscular Disease
  readonly RTD: boolean; // Restrictive Thoracic Disorder
};

// Factory function - will be used by PCC adapter
export function createDiagnosis(
  conditionId: number,
  icd10Code: string,
  description: string,
  onsetDate: Date,
  isPrimary: boolean
): Diagnosis {
  return {
    conditionId,
    icd10Code,
    description,
    onsetDate,
    isPrimary,
  };
}

// ICD-10 code mappings for each clinical qualification category
const COPD_CODES = [
  'J44.0',
  'J44.1',
  'J42',
  'J43.9',
  'J44.9',
  'J47.9',
  'J43.8',
  'J44.89',
  'J45.909',
  'J45.998',
  'J45.50',
];

const CRF_CODES = [
  'J96.11',
  'J96.20',
  'J96.90',
  'J96.10',
  'J96.21',
  'J96.92',
  'J96.12',
  'J96.22',
  'J96.01',
  'J96.02',
  'J96.00',
];

const NMD_CODES = [
  'G80.0',
  'G80.1',
  'G82.22',
  'I69.964',
  'G12.0',
  'G12.21',
  'G12.9',
  'G14',
  'G23.1',
  'G35',
  'G47.31',
  'G47.34',
  'G47.35',
  'G61.0',
  'G70.00',
  'G70.01',
  'G70.2',
  'G70.80',
  'G71.0',
  'G71.01',
  'G71.02',
  'G71.021',
  'G71.032',
  'G71.033',
  'G71.034',
  'G71.11',
  'G71.2',
  'G73.1',
  'G73.7',
  'G73.81',
  'G73.89',
  'G80.9',
  'G90.9',
  'S14.109A',
];

const RTD_CODES = [
  'M40.00',
  'M40.204',
  'M40.294',
  'M41.34',
  'M41.46',
  'M40.209',
  'M40.299',
  'M41.9',
  'M45.9',
  'Q67.6',
  'Q76.49',
  'J95.1',
  'S22.49XA',
];

// Clinical qualification functions - pure functions operating on diagnosis arrays
export function hasCopdQualification(diagnoses: Diagnosis[]): boolean {
  return diagnoses.some((diagnosis) =>
    COPD_CODES.includes(diagnosis.icd10Code)
  );
}

export function hasCrfQualification(diagnoses: Diagnosis[]): boolean {
  return diagnoses.some((diagnosis) => CRF_CODES.includes(diagnosis.icd10Code));
}

export function hasNmdQualification(diagnoses: Diagnosis[]): boolean {
  return diagnoses.some((diagnosis) => NMD_CODES.includes(diagnosis.icd10Code));
}

export function hasRtdQualification(diagnoses: Diagnosis[]): boolean {
  return diagnoses.some((diagnosis) => RTD_CODES.includes(diagnosis.icd10Code));
}

// Combined function to get all clinical qualifications at once
export function getClinicalQualifications(
  diagnoses: Diagnosis[]
): ClinicalQualifications {
  return {
    COPD: hasCopdQualification(diagnoses),
    CRF: hasCrfQualification(diagnoses),
    NMD: hasNmdQualification(diagnoses),
    RTD: hasRtdQualification(diagnoses),
  };
}

// General NIV eligibility - patient qualifies if they have any of the 4 categories
export function isNivEligible(diagnoses: Diagnosis[]): boolean {
  const qualifications = getClinicalQualifications(diagnoses);
  return (
    qualifications.COPD ||
    qualifications.CRF ||
    qualifications.NMD ||
    qualifications.RTD
  );
}

// Helper function to get qualifying diagnosis codes for a specific category
export function getQualifyingCodesForCategory(
  diagnoses: Diagnosis[],
  category: keyof ClinicalQualifications
): string[] {
  const categoryCodeMap = {
    COPD: COPD_CODES,
    CRF: CRF_CODES,
    NMD: NMD_CODES,
    RTD: RTD_CODES,
  };

  const relevantCodes = categoryCodeMap[category];
  return diagnoses
    .filter((diagnosis) => relevantCodes.includes(diagnosis.icd10Code))
    .map((diagnosis) => diagnosis.icd10Code);
}
