// apps/backend/niv/src/app/onboarding/adapters.ts
import {
  createPccClient,
  createPccConfigFromEnv,
  PccConditionResponse,
  PccListResponse,
  PccPatientResponse,
} from '../ehr-integration/pcc';
import { createDiagnosis } from './diagnosis';
import { OnboardingError } from './errors';
import { createPatient } from './patient';
import {
  GetPatientDiagnosesPort,
  GetPatientPort,
  GetPatientsPort,
  GetPatientWithDiagnosesPort,
} from './ports';

// Create PCC adapter using our functional client with proper error handling
export function createPccAdapter() {
  const config = createPccConfigFromEnv();
  const pccClient = createPccClient(config);

  const getPatient: GetPatientPort = async (
    orgUuid: string,
    patientId: number
  ) => {
    try {
      const pccPatient = await pccClient.get<PccPatientResponse>(
        `/public/preview1/orgs/${orgUuid}/patients/${patientId}`
      );

      const birthDate = pccPatient.birthDate
        ? new Date(pccPatient.birthDate)
        : null;

      return createPatient(
        pccPatient.patientId,
        pccPatient.firstName,
        pccPatient.lastName,
        birthDate,
        pccPatient.facId
      );
    } catch (error) {
      // Map technical errors to business domain errors
      throw mapPccErrorToOnboardingError(error, 'patient_lookup', {
        orgUuid,
        patientId,
      });
    }
  };

  const getPatientDiagnoses: GetPatientDiagnosesPort = async (
    orgUuid: string,
    patientId: number
  ) => {
    try {
      const response = await pccClient.get<
        PccListResponse<PccConditionResponse>
      >(`/public/preview1/orgs/${orgUuid}/conditions`, { patientId });

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data.map((condition) =>
        createDiagnosis(
          condition.conditionId,
          condition.icd10,
          condition.icd10Description,
          new Date(condition.onsetDate),
          condition.principalDiagnosis
        )
      );
    } catch (error) {
      // For diagnosis lookup, missing data might be expected in some workflows
      // Only throw for truly exceptional cases, not missing diagnoses
      if (isPccNotFoundError(error)) {
        // Patient exists but has no diagnoses - return empty array, don't throw
        return [];
      }

      throw mapPccErrorToOnboardingError(error, 'diagnosis_lookup', {
        orgUuid,
        patientId,
      });
    }
  };

  const getPatientWithDiagnoses: GetPatientWithDiagnosesPort = async (
    orgUuid: string,
    patientId: number
  ) => {
    try {
      // Execute both calls in parallel for better performance
      const [patient, diagnoses] = await Promise.all([
        getPatient(orgUuid, patientId),
        getPatientDiagnoses(orgUuid, patientId),
      ]);

      return { patient, diagnoses };
    } catch (error) {
      // If either call fails, the error is already properly mapped
      // Create new error with additional context about the combined operation
      if (error instanceof OnboardingError) {
        // Create new error with enhanced context for combined lookup
        throw new OnboardingError(error.code, error.message, error.action, {
          cause: error.cause instanceof Error ? error.cause : undefined,
          context: {
            ...error.context,
            operation: 'patient_with_diagnoses_lookup',
            combinedLookup: true,
          },
        });
      }

      // Fallback for unexpected error types
      throw mapPccErrorToOnboardingError(
        error,
        'patient_with_diagnoses_lookup',
        { orgUuid, patientId }
      );
    }
  };

  const getPatients: GetPatientsPort = async (
    orgUuid: string,
    facilityId?: number,
    page = 1,
    pageSize = 50
  ) => {
    try {
      const params: Record<string, any> = { page, pageSize };
      if (facilityId) {
        params.facilityId = facilityId;
      }

      const response = await pccClient.get<PccListResponse<PccPatientResponse>>(
        `/public/preview1/orgs/${orgUuid}/patients`,
        params
      );

      return response.data.map((pccPatient) => {
        const birthDate = pccPatient.birthDate
          ? new Date(pccPatient.birthDate)
          : null;

        return createPatient(
          pccPatient.patientId,
          pccPatient.firstName,
          pccPatient.lastName,
          birthDate,
          pccPatient.facId
        );
      });
    } catch (error) {
      throw mapPccErrorToOnboardingError(error, 'patients_list_lookup', {
        orgUuid,
        facilityId,
        page,
        pageSize,
      });
    }
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      await pccClient.getAccessToken();
      return true;
    } catch {
      return false;
    }
  };

  return {
    getPatient,
    getPatientDiagnoses,
    getPatientWithDiagnoses,
    getPatients,
    testConnection,
  };
}

/**
 * Mock adapter for testing - provides same interface as PCC adapter
 */
export function createMockPccAdapter() {
  const getPatient: GetPatientPort = async (
    _orgUuid: string,
    patientId: number
  ) => {
    return createPatient(patientId, 'John', 'Doe', new Date('1960-05-15'), 1);
  };

  const getPatientDiagnoses: GetPatientDiagnosesPort = async (
    _orgUuid: string,
    _patientId: number
  ) => {
    return [
      createDiagnosis(
        1,
        'J44.1',
        'COPD with exacerbation',
        new Date('2023-01-15'),
        true
      ),
      createDiagnosis(
        2,
        'J96.11',
        'Chronic respiratory failure with hypoxia',
        new Date('2023-02-01'),
        false
      ),
    ];
  };

  const getPatientWithDiagnoses: GetPatientWithDiagnosesPort = async (
    orgUuid: string,
    patientId: number
  ) => {
    const [patient, diagnoses] = await Promise.all([
      getPatient(orgUuid, patientId),
      getPatientDiagnoses(orgUuid, patientId),
    ]);
    return { patient, diagnoses };
  };

  const getPatients: GetPatientsPort = async (
    _orgUuid: string,
    _facilityId?: number,
    _page = 1,
    _pageSize = 50
  ) => {
    return [
      createPatient(1, 'John', 'Doe', new Date('1960-05-15'), 1),
      createPatient(2, 'Jane', 'Smith', new Date('1955-08-22'), 1),
    ];
  };

  const testConnection = async (): Promise<boolean> => {
    return true;
  };

  return {
    getPatient,
    getPatientDiagnoses,
    getPatientWithDiagnoses,
    getPatients,
    testConnection,
  };
}

/**
 * Maps technical PCC errors to business domain OnboardingError instances
 * This is where we translate infrastructure concerns into domain language
 */
function mapPccErrorToOnboardingError(
  error: unknown,
  operation: string,
  context: Record<string, unknown>
): OnboardingError {
  // Log the technical details first
  console.error(`PCC API error during ${operation}:`, error);

  // Check if it's an HTTP error (axios, fetch, etc.)
  if (isHttpError(error)) {
    const status = getHttpStatus(error);
    const patientId =
      typeof context.patientId === 'number' ? context.patientId : 0;
    const orgUuid = typeof context.orgUuid === 'string' ? context.orgUuid : '';

    switch (status) {
      case 404:
        // Patient not found in PCC - this is a business-meaningful error
        return OnboardingError.patientNotFound(patientId, orgUuid);

      case 401:
      case 403:
        // Authentication/authorization failure - requires admin action
        return OnboardingError.pccUnauthorized(operation);

      case 408:
      case 504:
      case 522:
      case 524:
      case 429:
      case 502:
      case 503:
        // Timeout/rate limiting/service unavailable - recoverable
        return OnboardingError.pccUnavailable(operation);

      default:
        // Other HTTP errors - treat as PCC unavailable for now
        return OnboardingError.pccUnavailable(operation);
    }
  }

  // Network errors (ENOTFOUND, ECONNREFUSED, etc.)
  if (isNetworkError(error)) {
    return OnboardingError.pccUnavailable(operation);
  }

  // Fallback - treat unknown errors as PCC unavailable
  return OnboardingError.pccUnavailable(operation);
}

/**
 * Type guards and utility functions for error classification
 */
function isHttpError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  // Axios error
  if (
    'response' in error &&
    error.response &&
    typeof error.response === 'object'
  ) {
    return 'status' in error.response;
  }

  // Fetch error
  if ('status' in error && typeof (error as any).status === 'number') {
    return true;
  }

  // PCC client custom error format (check message for status code)
  if (error instanceof Error && /status code \d+/i.test(error.message)) {
    return true;
  }

  return false;
}

function getHttpStatus(error: unknown): number {
  if (!error || typeof error !== 'object') return 0;

  // Axios error
  if (
    'response' in error &&
    error.response &&
    typeof error.response === 'object'
  ) {
    const response = error.response as any;
    return typeof response.status === 'number' ? response.status : 0;
  }

  // Fetch error
  if ('status' in error && typeof (error as any).status === 'number') {
    return (error as any).status;
  }

  // PCC client custom error format - extract from message
  if (error instanceof Error) {
    const match = error.message.match(/status code (\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return 0;
}

function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  return /network|timeout|connection|enotfound|econnrefused|etimedout|econnreset/.test(
    lowerMessage
  );
}

function isPccNotFoundError(error: unknown): boolean {
  if (!error) return false;

  // Check for HTTP 404 status
  if (isHttpError(error) && getHttpStatus(error) === 404) {
    return true;
  }

  // Also check error message for 404 patterns
  const message = error instanceof Error ? error.message : String(error);
  return /status code 404|not found/i.test(message);
}
