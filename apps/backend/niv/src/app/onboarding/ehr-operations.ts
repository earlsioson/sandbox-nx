// apps/backend/niv/src/app/onboarding/ehr-operations.ts

/**
 * Secondary Ports (Hexagonal Architecture)
 * Repository Interfaces (DDD)
 *
 * Defines contracts for EHR data access operations that the domain needs.
 * These interfaces are implemented by EHR adapters (ehr.ts) which handle
 * the technical details of connecting to specific EHR systems like PointClickCare.
 *
 * Healthcare staff understand these as "EHR operations" - the fundamental
 * ways to access patient information from the electronic health record system.
 */

import { Diagnosis } from './diagnosis';
import { Patient } from './patient';

/**
 * Contract for retrieving individual patient data from EHR
 *
 * Business operation: "Look up a specific patient in the EHR"
 */
export type GetPatient = (
  orgUuid: string,
  patientId: number
) => Promise<Patient | null>;

/**
 * Contract for retrieving diagnosis data for a patient from EHR
 *
 * Business operation: "Get all diagnoses for this patient from their EHR record"
 */
export type GetPatientDiagnoses = (
  orgUuid: string,
  patientId: number
) => Promise<Diagnosis[]>;

/**
 * Contract for getting patient with their diagnoses in one operation
 *
 * Business operation: "Pull complete patient record with diagnoses from EHR"
 * Optimized version that can fetch both patient and diagnosis data efficiently
 */
export type GetPatientWithDiagnoses = (
  orgUuid: string,
  patientId: number
) => Promise<{
  patient: Patient | null;
  diagnoses: Diagnosis[];
}>;

/**
 * Contract for getting multiple patients (for batch operations)
 *
 * Business operation: "List patients in a facility from the EHR"
 * Used for workflows that need to process multiple patients
 */
export type GetPatients = (
  orgUuid: string,
  facilityId?: number,
  page?: number,
  pageSize?: number
) => Promise<Patient[]>;
