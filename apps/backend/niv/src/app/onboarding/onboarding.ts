// apps/backend/niv/src/app/onboarding/onboarding.ts

/**
 * Primary Adapter (Hexagonal Architecture)
 * Application Service Implementation (DDD)
 *
 * Framework-agnostic implementation of onboarding operations.
 * This is exactly what onboarding.service.ts currently does,
 * just extracted from NestJS for clean hexagonal architecture.
 *
 * Functional DDD: Factory function returns object with operation implementations
 */

import { createEhrAdapter, createMockEhrAdapter } from './ehr';
import {
  createQualifications,
  type AssessmentResult,
  type ConnectionTestResult,
  type MockTestResult,
  type Qualifications,
} from './qualifications';

import type {
  GetPatientWithQualifications,
  TestMockData,
  TestPccConnection,
} from './onboarding-operations';

/**
 * Onboarding operations implementation
 * Exactly matches what onboarding.service.ts exposes to the controller
 */
export type OnboardingOperations = {
  readonly qualifyPatient: GetPatientWithQualifications;
  readonly testPccConnection: TestPccConnection;
  readonly testWithMockData: TestMockData;
};

/**
 * Factory function to create onboarding operations
 *
 * This does exactly what onboarding.service.ts constructor currently does,
 * just without NestJS dependencies
 */
export function createOnboardingOperations(): OnboardingOperations {
  // Initialize EHR adapters using functional DDD pattern
  // Exactly the same as current onboarding.service.ts
  const ehrAdapter = createEhrAdapter();
  const mockEhrAdapter = createMockEhrAdapter();

  // Create domain service with dependency injection
  // Domain service is framework-agnostic and contains all business logic
  // Exactly the same as current onboarding.service.ts
  const qualifications: Qualifications = createQualifications(
    {
      getPatientWithDiagnoses: ehrAdapter.getPatientWithDiagnoses,
      testConnection: ehrAdapter.testConnection,
      getPatient: ehrAdapter.getPatient,
      getPatientDiagnoses: ehrAdapter.getPatientDiagnoses,
    },
    {
      getPatientWithDiagnoses: mockEhrAdapter.getPatientWithDiagnoses,
      testConnection: mockEhrAdapter.testConnection,
      getPatient: mockEhrAdapter.getPatient,
      getPatientDiagnoses: mockEhrAdapter.getPatientDiagnoses,
    }
  );

  /**
   * Get patient with NIV qualifications
   *
   * This is exactly what onboarding.service.getPatientWithQualifications() expects,
   * just moved here without NestJS logging (that stays in the service)
   */
  const qualifyPatient: GetPatientWithQualifications = async (
    orgUuid: string,
    patientId: number
  ): Promise<AssessmentResult> => {
    // Delegate to domain service - no business logic in adapter
    // Exactly the same call as current implementation
    return await qualifications.assessQualification(orgUuid, patientId);
  };

  /**
   * Test EHR connectivity - infrastructure health check
   *
   * This is exactly what onboarding.service.testPccConnection() expects,
   * just moved here without NestJS logging (that stays in the service)
   */
  const testPccConnection: TestPccConnection =
    async (): Promise<ConnectionTestResult> => {
      // Delegate to domain service - no business logic in adapter
      // Exactly the same call as current implementation
      return await qualifications.testConnection();
    };

  /**
   * Test with mock data for development
   *
   * This is exactly what onboarding.service.testMockData() expects,
   * just moved here without NestJS logging (that stays in the service)
   */
  const testWithMockData: TestMockData = async (): Promise<MockTestResult> => {
    // Delegate to domain service - no business logic in adapter
    // Exactly the same call as current implementation
    return await qualifications.testWithMockData();
  };

  return {
    qualifyPatient,
    testPccConnection,
    testWithMockData,
  };
}
