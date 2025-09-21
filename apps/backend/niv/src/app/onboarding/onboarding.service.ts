// apps/backend/niv/src/app/onboarding/onboarding.service.ts

/**
 * Primary Adapter (Hexagonal Architecture)
 * Application Service (DDD)
 *
 * Thin NestJS adapter that translates framework concerns to domain operations.
 *
 * Responsibilities:
 * - NestJS dependency injection and lifecycle management
 * - Request logging and audit trails (important for healthcare)
 * - Error handling and HTTP context translation
 * - Delegating business operations to pure domain service
 *
 * Business logic has been extracted to qualifications.ts for framework-agnostic testing.
 */

import { Injectable, Logger } from '@nestjs/common';
import { createEhrAdapter, createMockEhrAdapter } from './ehr';
import {
  createQualifications,
  type AssessmentResult,
  type ConnectionTestResult,
  type MockTestResult,
  type Qualifications,
} from './qualifications';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly qualifications: Qualifications;

  constructor() {
    // Initialize EHR adapters using functional DDD pattern
    const ehrAdapter = createEhrAdapter();
    const mockEhrAdapter = createMockEhrAdapter();

    // Create domain service with dependency injection
    // Domain service is framework-agnostic and contains all business logic
    this.qualifications = createQualifications(
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
  }

  /**
   * Test EHR connectivity - infrastructure health check
   *
   * NestJS Adapter Responsibilities:
   * - Request logging for healthcare audit trails
   * - Error handling and context for monitoring
   * - Delegating to domain service for business logic
   */
  async testPccConnection(): Promise<ConnectionTestResult> {
    this.logger.log('PCC connection test requested');

    try {
      // Delegate to domain service - no business logic in adapter
      const result = await this.qualifications.testConnection();

      // Log result for healthcare audit trails
      this.logger.log(
        `PCC connection test ${result.success ? 'succeeded' : 'failed'}`
      );

      return result;
    } catch (error) {
      // Handle unexpected errors (domain service should handle expected errors)
      this.logger.error(
        'PCC connection test failed with unexpected error:',
        error
      );

      // Return consistent response format
      return {
        success: false,
        message: 'PCC connection failed: Unexpected error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get patient NIV qualifications - core business operation
   *
   * NestJS Adapter Responsibilities:
   * - Request logging with patient context (healthcare audit requirement)
   * - Input sanitization and logging
   * - Error context for monitoring and debugging
   * - Delegating to domain service for qualification assessment
   */
  async getPatientWithQualifications(
    orgUuid: string,
    patientId: number
  ): Promise<AssessmentResult> {
    // Healthcare audit logging - important for compliance
    this.logger.log(
      `Patient qualification assessment: ${patientId} in org ${orgUuid}`
    );

    try {
      // Delegate to domain service - all business logic is there
      const result = await this.qualifications.assessQualification(
        orgUuid.trim(),
        patientId
      );

      // Log outcome for healthcare audit trails
      if (result.success && result.data) {
        this.logger.log(
          `Patient ${patientId} qualification assessment completed. NIV eligible: ${result.data.isNivEligible}`
        );
      } else {
        this.logger.warn(
          `Patient ${patientId} qualification assessment failed: ${result.error}`
        );
      }

      return result;
    } catch (error) {
      // Log the full error context for healthcare audit trails and debugging
      this.logger.error(
        `Patient qualification assessment failed for ${patientId}:`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          operation: 'patient_qualification_assessment',
          patientId,
          orgUuid,
        }
      );

      // Domain errors bubble up to controller for proper HTTP mapping
      // Adapter only catches truly unexpected errors
      if (error instanceof Error) {
        throw error;
      }

      // Fallback for non-Error types (should not happen with proper error mapping)
      return {
        success: false,
        error: 'Unexpected error during qualification assessment',
      };
    }
  }

  /**
   * Test with mock data - development endpoint
   *
   * NestJS Adapter Responsibilities:
   * - Development request logging
   * - Delegating to domain service for mock testing logic
   */
  async testMockData(): Promise<MockTestResult> {
    this.logger.log('Mock data test requested');

    try {
      // Delegate to domain service - no business logic in adapter
      const result = await this.qualifications.testWithMockData();

      // Log result for development monitoring
      this.logger.log(
        `Mock data test ${result.success ? 'succeeded' : 'failed'}`
      );

      return result;
    } catch (error) {
      // Handle unexpected errors
      this.logger.error('Mock data test failed with unexpected error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
