import { Diagnosis } from './diagnosis';
import { Patient } from './patient';

// Port (contract) for retrieving patient data from PCC
export type GetPatientPort = (
  orgUuid: string,
  patientId: number
) => Promise<Patient | null>;

// Port (contract) for retrieving diagnosis data for a patient from PCC
export type GetPatientDiagnosesPort = (
  orgUuid: string,
  patientId: number
) => Promise<Diagnosis[]>;

// Combined port for getting patient with their diagnoses in one call
export type GetPatientWithDiagnosesPort = (
  orgUuid: string,
  patientId: number
) => Promise<{
  patient: Patient | null;
  diagnoses: Diagnosis[];
}>;

// Port for getting multiple patients (for batch operations)
export type GetPatientsPort = (
  orgUuid: string,
  facilityId?: number,
  page?: number,
  pageSize?: number
) => Promise<Patient[]>;
