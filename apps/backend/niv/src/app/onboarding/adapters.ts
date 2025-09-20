import {
  createPccClient,
  createPccConfigFromEnv,
  PccConditionResponse,
  PccListResponse,
  PccPatientResponse,
} from '../ehr-integration/pcc';
import { createDiagnosis } from './diagnosis';
import { createPatient } from './patient';
import {
  GetPatientDiagnosesPort,
  GetPatientPort,
  GetPatientsPort,
  GetPatientWithDiagnosesPort,
} from './ports';

// Create PCC adapter using our fixed functional client
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
      console.error(`Failed to get patient ${patientId}:`, error);
      return null;
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
      console.error(`Failed to get diagnoses for patient ${patientId}:`, error);
      return [];
    }
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
      console.error(`Failed to get patients for org ${orgUuid}:`, error);
      return [];
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

// Mock adapter - same as before
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
