import { ClinicalQualifications } from './clinical-qualifications';
import { determineClinicalQualifications } from './determine-clinical-qualifications';
import { PatientData, PatientRepository } from './patient-repository';

/**
 * Result of patient qualifications query
 * Combines patient data with their NIV clinical qualifications
 */
export interface PatientWithQualifications {
  /** Patient demographic and clinical data */
  patient: PatientData;

  /** Calculated NIV program qualifications */
  qualifications: ClinicalQualifications;
}

/**
 * Gets a patient and determines their NIV clinical qualifications
 *
 * This use case orchestrates:
 * 1. Fetching patient data from PCC API (via repository)
 * 2. Extracting their diagnosis codes
 * 3. Determining clinical qualifications using business rules
 * 4. Returning the combined result
 *
 * @param patientId PCC patient identifier
 * @param patientRepository Repository for fetching patient data
 * @returns Promise resolving to patient data with qualifications
 * @throws Error if patient not found or qualification determination fails
 */
export async function getPatientQualifications(
  patientId: string,
  patientRepository: PatientRepository
): Promise<PatientWithQualifications> {
  // Step 1: Fetch patient data from PCC API
  const patient = await patientRepository.findById(patientId);

  // Step 2: Determine clinical qualifications from diagnosis codes
  const qualifications = determineClinicalQualifications(
    patient.diagnosisCodes
  );

  // Step 3: Return combined result
  return {
    patient,
    qualifications,
  };
}
