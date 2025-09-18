// onboarding/infrastructure/pcc/entities/pcc-patient-response.entity.ts

export interface PCCPatientResponse {
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

export interface PCCMedicalDiagnosis {
  code: string;
  codeLibrary: 'ICD-10-CM' | 'ICD-10-CA';
  onsetDate: string; // YYYY-MM-DD format
  description?: string;
}

export interface PCCTreatmentDiagnosis {
  code: string;
  codeLibrary: 'ICD-10-CM' | 'ICD-10-CA';
  onsetDate: string; // YYYY-MM-DD format
  description?: string;
}

export interface PCCConditionIdentifier {
  coding: PCCConditionCoding[];
}

export interface PCCConditionCoding {
  code: string;
  display: string;
  system: string;
}

export interface PCCCondition {
  identifier: PCCConditionIdentifier;
  clinicalStatus?: string;
  onsetDate?: string;
  resolvedDate?: string;
  additionalInformation?: string;
}

export interface PCCPatientClinicalDataResponse {
  patient: PCCPatientResponse;
  medicalDiagnosis?: PCCMedicalDiagnosis[];
  treatmentDiagnosis?: PCCTreatmentDiagnosis[];
  conditions?: PCCCondition[];
}
