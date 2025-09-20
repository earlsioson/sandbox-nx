// apps/backend/niv/src/app/onboarding/onboarding.controller.ts
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { NIV_ERRORS, OnboardingError } from './errors';
import { OnboardingService } from './onboarding.service';

/**
 * Controller for NIV Patient Onboarding endpoints
 *
 * Responsibilities:
 * - Maps domain errors to appropriate HTTP responses
 * - Provides consistent API response format
 * - Handles input validation and transformation
 * - Logs requests for audit trails (important for healthcare)
 */
@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * Test PCC connectivity - infrastructure health check
   */
  @Get('test/connection')
  async testConnection() {
    this.logger.log('PCC connection test requested');

    try {
      return await this.onboardingService.testPccConnection();
    } catch (error) {
      this.logger.error('PCC connection test failed:', error);
      throw this.mapDomainErrorToHttp(error, 'connection_test');
    }
  }

  /**
   * Test with mock data - development endpoint
   */
  @Get('test/mock')
  async testMock() {
    this.logger.log('Mock data test requested');

    try {
      return await this.onboardingService.testMockData();
    } catch (error) {
      this.logger.error('Mock data test failed:', error);
      throw this.mapDomainErrorToHttp(error, 'mock_test');
    }
  }

  /**
   * Get patient NIV qualifications - core business operation
   *
   * Demonstrates how domain errors bubble up and get mapped to HTTP responses
   */
  @Get('patient/:patientId')
  async getPatientQualifications(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query('orgUuid') orgUuid: string
  ) {
    // Input validation - let domain handle business validation
    if (!orgUuid?.trim()) {
      this.logger.warn(
        `Patient lookup attempted without orgUuid: ${patientId}`
      );
      throw new HttpException(
        {
          error: 'INVALID_ORG_UUID',
          message: 'Organization UUID is required',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.BAD_REQUEST
      );
    }

    this.logger.log(
      `Patient qualification lookup: ${patientId} in org ${orgUuid}`
    );

    try {
      const result = await this.onboardingService.getPatientWithQualifications(
        orgUuid.trim(),
        patientId
      );

      // Success response with structured format
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Log the full error context for healthcare audit trails
      this.logger.error(
        `Patient qualification lookup failed for ${patientId}:`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          patientId,
          orgUuid,
          operation: 'patient_qualification_lookup',
        }
      );

      // Map domain error to appropriate HTTP response
      throw this.mapDomainErrorToHttp(error, 'patient_qualification_lookup', {
        patientId,
        orgUuid,
      });
    }
  }

  /**
   * Maps domain errors to appropriate HTTP responses
   * This is where we translate business errors into HTTP status codes
   */
  private mapDomainErrorToHttp(
    error: unknown,
    operation: string,
    context?: Record<string, unknown>
  ): HttpException {
    if (error instanceof OnboardingError) {
      const httpStatus = this.getHttpStatusForDomainError(error);
      const responseBody = this.buildErrorResponse(error, operation, context);

      return new HttpException(responseBody, httpStatus);
    }

    // Fallback for unexpected errors
    this.logger.error(`Unexpected error in ${operation}:`, error);

    return new HttpException(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        operation,
        timestamp: new Date().toISOString(),
        ...(context && { context }),
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Maps domain error actions to HTTP status codes
   * This implements the cross-boundary error handling strategy
   */
  private getHttpStatusForDomainError(error: OnboardingError): HttpStatus {
    // Map based on the error's action guidance
    switch (error.action) {
      case 'stop':
        // Fatal errors that should stop processing
        switch (error.code) {
          case NIV_ERRORS.PATIENT_NOT_FOUND:
            return HttpStatus.NOT_FOUND;
          case NIV_ERRORS.PCC_UNAUTHORIZED:
            return HttpStatus.UNAUTHORIZED;
          case NIV_ERRORS.QUALIFICATION_FAILED:
            return HttpStatus.UNPROCESSABLE_ENTITY; // 422 - business rule violation
          default:
            return HttpStatus.BAD_REQUEST;
        }

      case 'retry':
        // Temporary failures that can be retried
        switch (error.code) {
          case NIV_ERRORS.PCC_UNAVAILABLE:
          case NIV_ERRORS.PCC_TIMEOUT:
            return HttpStatus.SERVICE_UNAVAILABLE; // 503 - retry later
          default:
            return HttpStatus.SERVICE_UNAVAILABLE;
        }

      case 'user-input':
        // Errors requiring user action
        switch (error.code) {
          case NIV_ERRORS.MISSING_CLINICAL_DATA:
          case NIV_ERRORS.RT_ASSIGNMENT_FAILED:
            return HttpStatus.UNPROCESSABLE_ENTITY; // 422 - user action needed
          default:
            return HttpStatus.BAD_REQUEST;
        }

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Builds consistent error response format
   * Includes information needed for client-side error handling
   */
  private buildErrorResponse(
    error: OnboardingError,
    operation: string,
    context?: Record<string, unknown>
  ): Record<string, unknown> {
    const baseResponse = {
      error: error.code,
      message: error.message,
      action: error.action,
      operation,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
    };

    // Add retry guidance for recoverable errors
    if (error.action === 'retry') {
      return {
        ...baseResponse,
        retryable: true,
        retryAfter: this.getRetryAfterSeconds(error.code),
      };
    }

    // Add action guidance for user-input errors
    if (error.action === 'user-input' && error.context) {
      const actionContext: Record<string, unknown> = {};

      if (error.context.actionRequired) {
        actionContext.actionRequired = error.context.actionRequired;
      }

      if (error.context.missingData) {
        actionContext.missingData = error.context.missingData;
      }

      return {
        ...baseResponse,
        ...actionContext,
      };
    }

    return baseResponse;
  }

  /**
   * Provides retry guidance for recoverable errors
   */
  private getRetryAfterSeconds(errorCode: string): number {
    switch (errorCode) {
      case NIV_ERRORS.PCC_UNAVAILABLE:
        return 30; // Retry after 30 seconds
      case NIV_ERRORS.PCC_TIMEOUT:
        return 60; // Retry after 1 minute for timeouts
      default:
        return 30;
    }
  }
}
