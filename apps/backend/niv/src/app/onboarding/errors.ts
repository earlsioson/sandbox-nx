// apps/backend/niv/src/app/onboarding/errors.ts

/**
 * NIV Onboarding error codes using const assertions for type safety
 * These codes reflect business domain concepts that domain experts understand
 */
export const NIV_ERRORS = {
  // Patient Lookup Errors (PCC Integration)
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',
  PCC_UNAVAILABLE: 'PCC_UNAVAILABLE',
  PCC_UNAUTHORIZED: 'PCC_UNAUTHORIZED',
  PCC_TIMEOUT: 'PCC_TIMEOUT',

  // Qualification Business Logic Errors
  QUALIFICATION_FAILED: 'QUALIFICATION_FAILED',
  MISSING_CLINICAL_DATA: 'MISSING_CLINICAL_DATA',
  INVALID_DIAGNOSIS_CODES: 'INVALID_DIAGNOSIS_CODES',

  // Workflow State Errors
  RT_ASSIGNMENT_FAILED: 'RT_ASSIGNMENT_FAILED',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',

  // Input Validation Errors
  INVALID_PATIENT_ID: 'INVALID_PATIENT_ID',
  INVALID_ORG_UUID: 'INVALID_ORG_UUID',
} as const;

/**
 * Type for NIV error codes - provides compile-time validation
 */
export type NivErrorCode = (typeof NIV_ERRORS)[keyof typeof NIV_ERRORS];

/**
 * Error recovery actions that tell each layer how to handle the error
 */
export type ErrorAction = 'stop' | 'retry' | 'user-input';

/**
 * Domain error for NIV onboarding workflow
 *
 * Simple error with business-meaningful code and action guidance
 */
export class OnboardingError extends Error {
  public readonly code: NivErrorCode;
  public readonly action: ErrorAction;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: NivErrorCode,
    message: string,
    action: ErrorAction,
    context?: Record<string, unknown>
  ) {
    super(message);

    this.name = 'OnboardingError';
    this.code = code;
    this.action = action;
    this.context = context;

    // Ensure stack trace points to where error was thrown, not constructor
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OnboardingError);
    }
  }

  /**
   * Create error for patient not found in PCC
   */
  static patientNotFound(
    patientId: number,
    orgUuid: string,
    cause?: Error
  ): OnboardingError {
    return new OnboardingError(
      NIV_ERRORS.PATIENT_NOT_FOUND,
      `Patient ${patientId} not found in organization ${orgUuid}`,
      'stop',
      {
        cause,
        context: { patientId, orgUuid, operation: 'patient_lookup' },
      }
    );
  }

  /**
   * Create error for PCC service unavailable (recoverable)
   */
  static pccUnavailable(operation: string, cause?: Error): OnboardingError {
    return new OnboardingError(
      NIV_ERRORS.PCC_UNAVAILABLE,
      `PointClickCare service unavailable during ${operation}`,
      'retry',
      {
        cause,
        context: { operation, service: 'pointclickcare' },
      }
    );
  }

  /**
   * Create error for PCC authentication failure
   */
  static pccUnauthorized(operation: string, cause?: Error): OnboardingError {
    return new OnboardingError(
      NIV_ERRORS.PCC_UNAUTHORIZED,
      `PointClickCare authentication failed during ${operation}`,
      'stop',
      {
        cause,
        context: {
          operation,
          service: 'pointclickcare',
          requiresAdminAction: true,
        },
      }
    );
  }

  /**
   * Check if this error represents a temporary/recoverable condition
   */
  isRecoverable(): boolean {
    return this.action === 'retry';
  }

  /**
   * Check if this error requires user action to resolve
   */
  requiresUserAction(): boolean {
    return this.action === 'user-input';
  }

  /**
   * Check if this error should stop processing permanently
   */
  isFatal(): boolean {
    return this.action === 'stop';
  }
}
