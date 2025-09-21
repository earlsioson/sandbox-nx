// apps/backend/niv/src/app/onboarding/onboarding-operations.ts

/**
 * Primary Ports (Hexagonal Architecture)
 * Use Case Interfaces (DDD)
 *
 * Defines contracts for onboarding operations that the domain exposes
 * to external systems (HTTP clients, scheduled jobs, etc.).
 *
 * These exactly match what onboarding.service.ts currently exposes.
 * No new functionality added - pure structural refactor.
 *
 * Functional DDD: Type aliases for function signatures, not classes/interfaces
 */

import type {
  AssessmentResult,
  ConnectionTestResult,
  MockTestResult,
} from './qualifications';

/**
 * Contract for getting patient with NIV qualifications
 *
 * Business operation: "Get patient information with their NIV qualification status"
 *
 * Exactly matches onboarding.service.getPatientWithQualifications()
 */
export type GetPatientWithQualifications = (
  orgUuid: string,
  patientId: number
) => Promise<AssessmentResult>;

/**
 * Contract for testing EHR connectivity
 *
 * Business operation: "Check if we can connect to PointClickCare EHR system"
 *
 * Exactly matches onboarding.service.testPccConnection()
 */
export type TestPccConnection = () => Promise<ConnectionTestResult>;

/**
 * Contract for testing with mock data
 *
 * Business operation: "Test qualification logic with known test data"
 *
 * Exactly matches onboarding.service.testMockData()
 */
export type TestMockData = () => Promise<MockTestResult>;
