// apps/backend/niv/src/app/onboarding/onboarding.service.ts

/**
 * Thin NestJS Adapter (Hexagonal Architecture)
 * Framework Service Wrapper (DDD)
 *
 * Pure NestJS wrapper that adds framework concerns (logging, DI) around
 * the framework-agnostic business operations in onboarding.ts.
 *
 * Responsibilities:
 * - NestJS dependency injection and lifecycle management
 * - Request logging and audit trails (important for healthcare)
 * - Error handling and HTTP context translation
 * - Delegating business operations to framework-agnostic adapter
 *
 * All business logic has been moved to onboarding.ts for clean separation.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  createOnboardingOperations,
  type OnboardingOperations,
} from './onboarding';
import type {
  AssessmentResult,
  ConnectionTestResult,
  MockTestResult,
} from './qualifications';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly onboardingOperations: OnboardingOperations;

  constructor() {
    // Create framework-agnostic onboarding operations
    // All business logic is now in onboarding.ts
    this.onboardingOperations = createOnboardingOperations();
  }

  /**
   * Get patient NIV qualifications - core business operation
   *
   * NestJS Adapter Responsibilities:
   * - Request logging for healthcare audit trails
   * - Error handling and context for monitoring
   * - Delegating to framework-agnostic business operations
   *
   * EXACT SAME INTERFACE as before - controller expects this method name
   */
  async getPatientWithQualifications(
    orgUuid: string,
    patientId: number
  ): Promise<AssessmentResult> {
    this.logger.log(
      `Patient qualification assessment requested for patient ${patientId} in org ${orgUuid}`
    );

    try {
      // Delegate to framework-agnostic business operations
      // Exactly the same call flow as before
      const result = await this.onboardingOperations.qualifyPatient(
        orgUuid,
        patientId
      );

      // Log result for healthcare audit trails
      this.logger.log(
        `Patient ${patientId} qualification assessment completed: ${
          result.data?.isNivEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE'
        }`
      );

      return result;
    } catch (error) {
      // Enhanced error logging for healthcare audit and debugging
      this.logger.error(
        `Patient qualification assessment failed for patient ${patientId}:`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          patientId,
          orgUuid,
          operation: 'patient_qualification_assessment',
        }
      );

      throw error; // Re-throw for controller to handle
    }
  }

  /**
   * Test EHR connectivity - infrastructure health check
   *
   * NestJS Adapter Responsibilities:
   * - Request logging for healthcare audit trails
   * - Error handling and context for monitoring
   * - Delegating to framework-agnostic business operations
   *
   * Exactly the same functionality as before - just delegating to onboarding.ts
   */
  async testPccConnection(): Promise<ConnectionTestResult> {
    this.logger.log('PCC connection test requested');

    try {
      // Delegate to framework-agnostic business operations
      // Exactly the same call flow as before
      const result = await this.onboardingOperations.testPccConnection();

      // Log result for healthcare audit trails
      this.logger.log(
        `PCC connection test ${result.success ? 'PASSED' : 'FAILED'}: ${
          result.message
        }`
      );

      return result;
    } catch (error) {
      // Enhanced error logging for infrastructure monitoring
      this.logger.error('PCC connection test failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'pcc_connection_test',
      });

      throw error; // Re-throw for controller to handle
    }
  }

  /**
   * Test with mock data for development
   *
   * NestJS Adapter Responsibilities:
   * - Request logging for development tracking
   * - Error handling and context for debugging
   * - Delegating to framework-agnostic business operations
   *
   * EXACT SAME INTERFACE as before - controller expects this method name
   */
  async testMockData(): Promise<MockTestResult> {
    this.logger.log('Mock data test requested');

    try {
      // Delegate to framework-agnostic business operations
      // Exactly the same call flow as before
      const result = await this.onboardingOperations.testWithMockData();

      // Log result for development tracking
      this.logger.log(
        `Mock data test completed: ${result.success ? 'PASSED' : 'FAILED'}`
      );

      return result;
    } catch (error) {
      // Enhanced error logging for development debugging
      this.logger.error('Mock data test failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'mock_data_test',
      });

      throw error; // Re-throw for controller to handle
    }
  }
}
