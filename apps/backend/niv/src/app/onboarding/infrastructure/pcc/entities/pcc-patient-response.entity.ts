// onboarding/infrastructure/pcc/entities/pcc-patient-response.entity.ts

export interface PccPatientResponse {
  patientId: number;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD format
  gender?: string;
  medicalRecordNumber?: string;
  facilityId?: number;
  admissionDate?: string;
  dischargeDate?: string;
  patientStatus?: string;
}

export interface PccMedicalDiagnosis {
  code: string;
  codeLibrary: 'ICD-10-CM' | 'ICD-10-CA';
  onsetDate: string; // YYYY-MM-DD format
  description?: string;
}

export interface PccTreatmentDiagnosis {
  code: string;
  codeLibrary: 'ICD-10-CM' | 'ICD-10-CA';
  onsetDate: string; // YYYY-MM-DD format
  description?: string;
}

export interface PccConditionIdentifier {
  coding: PccConditionCoding[];
}

export interface PccConditionCoding {
  code: string;
  display: string;
  system: string;
}

export interface PccCondition {
  identifier: PccConditionIdentifier;
  clinicalStatus?: string;
  onsetDate?: string;
  resolvedDate?: string;
  additionalInformation?: string;
}

export interface PccPatientClinicalDataResponse {
  patient: PccPatientResponse;
  medicalDiagnosis?: PccMedicalDiagnosis[];
  treatmentDiagnosis?: PccTreatmentDiagnosis[];
  conditions?: PccCondition[];
}
