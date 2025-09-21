// apps/backend/niv/src/app/onboarding/qualifications.ts

/**
 * Domain Service (Hexagonal Architecture)
 * Domain Service (DDD)
 *
 * Core business logic for patient clinical qualifications assessment.
 * This is the heart of the NIV onboarding domain - determining whether
 * patients qualify for Non-Invasive Ventilator programs based on their
 * clinical diagnoses and EHR data.
 *
 * Framework-agnostic and pure domain logic that can be unit tested
 * without any infrastructure dependencies.
 */

import { getClinicalQualifications } from './diagnosis';
import { GetPatient, GetPatientWithDiagnoses } from './ehr-operations';

/**
 * Assessment result for patient NIV qualification
 * Preserves exact response format from current getPatientWithQualifications
 */
export type AssessmentResult = {
  success: boolean;
  data?: {
    patient: {
      patientId: number;
      firstName: string;
      lastName: string;
      fullName: string;
      dateOfBirth: Date | null;
      facilityId: number;
    };
    diagnoses: Array<{
      code: string;
      description: string;
      isPrimary: boolean;
    }>;
    clinicalQualifications: {
      COPD: boolean;
      CRF: boolean;
      NMD: boolean;
      RTD: boolean;
    };
    isNivEligible: boolean;
  };
  error?: string;
};

/**
 * Connection test result
 * Preserves exact response format from current testPccConnection
 */
export type ConnectionTestResult = {
  success: boolean;
  message: string;
  timestamp: string;
};

/**
 * Mock test result
 * Preserves exact response format from current testMockData
 */
export type MockTestResult = {
  success: boolean;
  data?: {
    patient: any;
    diagnoses: any[];
    clinicalQualifications: {
      COPD: boolean;
      CRF: boolean;
      NMD: boolean;
      RTD: boolean;
    };
  };
  error?: string;
};

/**
 * EHR Operations dependencies that the domain needs
 * Injected by the factory function to maintain dependency inversion
 */
export type QualificationsDependencies = {
  getPatientWithDiagnoses: GetPatientWithDiagnoses;
  testConnection: () => Promise<boolean>;
  getPatient: GetPatient; // For mock testing
  getPatientDiagnoses: (orgUuid: string, patientId: number) => Promise<any[]>; // For mock testing
};

/**
 * Qualifications domain service interface
 * These are the core business operations for NIV clinical qualification assessment
 */
export interface Qualifications {
  /**
   * Assess patient qualifications for NIV program
   *
   * Core business operation: Determines if a patient is clinically eligible
   * for Non-Invasive Ventilator therapy based on their diagnoses from the EHR.
   *
   * Business rules:
   * - Patient must exist in EHR
   * - Clinical qualifications are based on ICD-10 diagnosis codes
   * - Eligible if patient has any qualifying condition (COPD, CRF, NMD, RTD)
   */
  assessQualification(
    orgUuid: string,
    patientId: number
  ): Promise<AssessmentResult>;

  /**
   * Test connectivity to EHR system
   *
   * Infrastructure health check to ensure EHR integration is working.
   * Used for system monitoring and troubleshooting.
   */
  testConnection(): Promise<ConnectionTestResult>;

  /**
   * Test with mock data for development
   *
   * Development utility for testing qualification logic with known data
   * when EHR system is not available.
   */
  testWithMockData(): Promise<MockTestResult>;
}

/**
 * Factory function to create qualifications domain service
 *
 * Following functional DDD pattern used throughout the project.
 * Takes EHR operations as dependencies and returns domain service
 * implementing core NIV qualification business logic.
 *
 * @param ehrOps - EHR operations for data access (dependency injection)
 * @param mockEhrOps - Mock EHR operations for development testing
 */
export function createQualifications(
  ehrOps: QualificationsDependencies,
  mockEhrOps: QualificationsDependencies
): Qualifications {
  const assessQualification = async (
    orgUuid: string,
    patientId: number
  ): Promise<AssessmentResult> => {
    try {
      // Core business logic: Get patient and diagnoses from EHR
      const { patient, diagnoses } = await ehrOps.getPatientWithDiagnoses(
        orgUuid,
        patientId
      );

      // Business rule: Patient must exist
      if (!patient) {
        return {
          success: false,
          error: 'Patient not found',
        };
      }

      // Core business logic: Assess clinical qualifications based on diagnoses
      const qualifications = getClinicalQualifications(diagnoses);

      // Business logic: Format response with all clinical data
      return {
        success: true,
        data: {
          patient: {
            ...patient,
            fullName: `${patient.firstName} ${patient.lastName}`,
          },
          diagnoses: diagnoses.map((d) => ({
            code: d.icd10Code,
            description: d.description,
            isPrimary: d.isPrimary,
          })),
          clinicalQualifications: qualifications,
          // Business rule: Eligible if any qualification category is true
          isNivEligible: Object.values(qualifications).some(Boolean),
        },
      };
    } catch (error) {
      // Domain errors bubble up (OnboardingError instances)
      // Infrastructure errors are already mapped by EHR adapter layer
      if (error instanceof Error) {
        throw error; // Let domain errors bubble up to be handled by controller
      }

      // Fallback for non-Error types (should not happen with proper error mapping)
      return {
        success: false,
        error: 'Unknown error occurred during qualification assessment',
      };
    }
  };

  const testConnection = async (): Promise<ConnectionTestResult> => {
    try {
      const isConnected = await ehrOps.testConnection();

      return {
        success: isConnected,
        message: isConnected
          ? 'PCC connection successful'
          : 'PCC connection failed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Infrastructure errors are already mapped to domain errors by adapter
      const message =
        error instanceof Error
          ? `PCC connection failed: ${error.message}`
          : 'PCC connection failed: Unknown error';

      return {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      };
    }
  };

  const testWithMockData = async (): Promise<MockTestResult> => {
    try {
      // Use mock EHR operations for development testing
      const { patient, diagnoses } = await mockEhrOps.getPatientWithDiagnoses(
        'test-org',
        123
      );

      // Apply same business logic as real assessment
      const qualifications = getClinicalQualifications(diagnoses);

      return {
        success: true,
        data: {
          patient,
          diagnoses,
          clinicalQualifications: qualifications,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  return {
    assessQualification,
    testConnection,
    testWithMockData,
  };
}
