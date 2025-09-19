/**
 * Patient data structure from PCC API
 * Contains the essential information needed for clinical qualification determination
 */
export interface PatientData {
  /** PCC patient identifier */
  patientId: string;

  /** PCC facility identifier */
  facilityId: string;

  /** Patient demographics */
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date string from PCC
  medicalRecordNumber?: string;

  /** ICD-10 diagnosis codes from all sources (conditions, medical diagnosis, treatment diagnosis) */
  diagnosisCodes: string[];
}

/**
 * Repository interface for fetching patient data from PCC API
 *
 * This interface defines what the domain needs from the PCC API.
 * The infrastructure layer will implement this contract.
 */
export interface PatientRepository {
  /**
   * Finds a patient by their PCC patient ID
   *
   * @param patientId PCC patient identifier
   * @returns Promise resolving to patient data with diagnosis codes
   * @throws Error if patient not found or API fails
   */
  findById(patientId: string): Promise<PatientData>;
}
