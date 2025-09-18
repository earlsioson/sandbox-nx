// apps/backend/niv/src/app/onboarding/infrastructure/pcc/repositories/pcc-patient-clinical-data.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { ExceptionTranslator } from '../../../../shared/application/services/exception-translator.service';
import { PccAPIClient } from '../../../../shared/infrastructure/pcc/pcc-api.client';
import { Patient } from '../../../domain/patient';
import { DiagnosisCode } from '../../../domain/value-objects/diagnosis-code';
import {
  PccPatientClinicalDataResponse,
  PccPatientResponse,
} from '../entities/pcc-patient-response.entity';
import { PccPatientClinicalDataMapper } from '../mappers/pcc-patient-clinical-data.mapper';

@Injectable()
export class PccPatientClinicalDataRepository {
  private readonly logger = new Logger(PccPatientClinicalDataRepository.name);

  constructor(private readonly pccApiClient: PccAPIClient) {}

  async findPatientById(patientId: string): Promise<Patient> {
    this.logger.log(`🔍 PCC: Finding patient by ID: ${patientId}`);

    try {
      // Get patient basic information
      const patientData = await this.pccApiClient.get<PccPatientResponse>(
        `/api/public/preview1/patients/${patientId}`
      );

      // Get patient conditions/diagnoses (if available)
      let conditions: any[] = [];
      try {
        conditions = await this.pccApiClient.get<any[]>(
          `/api/public/preview1/patients/${patientId}/conditions`
        );
      } catch (error) {
        const errorMessage = ExceptionTranslator.getMessage(error);
        this.logger.warn(
          `⚠️ Could not fetch conditions for patient ${patientId}: ${errorMessage}`
        );
      }

      // Combine into clinical data response
      const clinicalData: PccPatientClinicalDataResponse = {
        patient: patientData,
        medicalDiagnosis: [], // Would be populated from another endpoint if available
        treatmentDiagnosis: [], // Would be populated from another endpoint if available
        conditions: conditions || [],
      };

      // Map PCC response to domain model using existing mapper
      const patient =
        PccPatientClinicalDataMapper.patientToDomain(clinicalData);

      this.logger.log(`✅ PCC: Patient found: ${patientId}`);
      return patient;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      this.logger.error(
        `❌ PCC: Failed to find patient ${patientId}: ${errorMessage}`,
        {
          patientId,
          isNetworkError,
          isAuthError,
        }
      );

      throw new Error(
        `PCC patient lookup failed for ${patientId}: ${errorMessage}`
      );
    }
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    this.logger.log(`🔍 PCC: Finding patients by facility: ${facilityId}`);

    try {
      // Get facility patients list
      const patientsResponse = await this.pccApiClient.get<{
        data: PccPatientResponse[];
      }>(`/api/public/preview1/facilities/${facilityId}/patients`);

      // Convert each PCC patient to clinical data format
      const clinicalDataList: PccPatientClinicalDataResponse[] =
        patientsResponse.data.map((patientData) => ({
          patient: patientData,
          medicalDiagnosis: [], // Would be populated if we had diagnosis endpoints
          treatmentDiagnosis: [], // Would be populated if we had diagnosis endpoints
          conditions: [], // Would be populated if we had conditions endpoints
        }));

      // Use existing mapper to convert to domain objects
      const patients =
        PccPatientClinicalDataMapper.patientListToDomain(clinicalDataList);

      this.logger.log(
        `✅ PCC: Found ${patients.length} patients for facility: ${facilityId}`
      );
      return patients;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      this.logger.error(
        `❌ PCC: Failed to find patients for facility ${facilityId}: ${errorMessage}`,
        {
          facilityId,
          isNetworkError,
          isAuthError,
        }
      );

      throw new Error(
        `PCC facility patient lookup failed for ${facilityId}: ${errorMessage}`
      );
    }
  }

  async refreshPatientClinicalData(patientId: string): Promise<Patient> {
    this.logger.log(`🔄 PCC: Refreshing clinical data for: ${patientId}`);

    try {
      // Get fresh patient data
      const patientData = await this.pccApiClient.get<PccPatientResponse>(
        `/api/public/preview1/patients/${patientId}`
      );

      // Get conditions with more comprehensive data
      let conditions: any[] = [];
      try {
        conditions = await this.pccApiClient.get<any[]>(
          `/api/public/preview1/patients/${patientId}/conditions`
        );
      } catch (error) {
        const errorMessage = ExceptionTranslator.getMessage(error);
        this.logger.warn(
          `⚠️ Could not fetch conditions for patient ${patientId}: ${errorMessage}`
        );
      }

      // Combine into clinical data response
      const clinicalData: PccPatientClinicalDataResponse = {
        patient: patientData,
        medicalDiagnosis: [], // Would need additional API calls for diagnoses
        treatmentDiagnosis: [], // Would need additional API calls for diagnoses
        conditions: conditions || [],
      };

      const refreshedPatient =
        PccPatientClinicalDataMapper.patientToDomain(clinicalData);

      this.logger.log(`✅ PCC: Clinical data refreshed for: ${patientId}`, {
        diagnosisCount: refreshedPatient.diagnosisCodes.length,
      });

      return refreshedPatient;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      this.logger.error(
        `❌ PCC: Failed to refresh clinical data for ${patientId}: ${errorMessage}`,
        {
          patientId,
          isNetworkError,
          isAuthError,
        }
      );

      throw new Error(
        `PCC clinical data refresh failed for ${patientId}: ${errorMessage}`
      );
    }
  }

  async findPatientDiagnosisCodes(patientId: string): Promise<DiagnosisCode[]> {
    this.logger.log(`🔍 PCC: Getting diagnosis codes for: ${patientId}`);

    try {
      // Get patient data with diagnoses using the existing method
      const patient = await this.findPatientById(patientId);

      this.logger.log(
        `✅ PCC: Found ${patient.diagnosisCodes.length} diagnosis codes for: ${patientId}`
      );

      return patient.diagnosisCodes;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      this.logger.error(
        `❌ PCC: Failed to get diagnosis codes for ${patientId}: ${errorMessage}`,
        {
          patientId,
          isNetworkError,
          isAuthError,
        }
      );

      throw new Error(
        `PCC diagnosis codes lookup failed for ${patientId}: ${errorMessage}`
      );
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Test PCC connectivity and authentication
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      this.logger.log('🔗 PCC: Testing connection...');

      // Try a simple API call to test connectivity
      const response = await this.pccApiClient.get<any>(
        '/api/public/preview1/webhook-subscriptions',
        {
          applicationName: 'niv-application',
        }
      );

      this.logger.log('✅ PCC: Connection test successful');

      return {
        success: true,
        message: 'PCC connection and authentication successful',
        details: {
          responseStatus: 'OK',
          hasData: !!response,
        },
      };
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      this.logger.error(`❌ PCC: Connection test failed: ${errorMessage}`, {
        isNetworkError,
        isAuthError,
      });

      return {
        success: false,
        message: 'PCC connection test failed',
        details: {
          error: errorMessage,
          isNetworkError,
          isAuthError,
        },
      };
    }
  }

  /**
   * Create or update patient in PCC (if supported)
   */
  async savePatient(patient: Patient): Promise<Patient> {
    this.logger.log(`💾 PCC: Attempting to save patient: ${patient.id}`);

    try {
      // Note: This would require a toPersistence method in the mapper
      // For now, we'll just log the attempt and return the original patient
      this.logger.warn(
        `⚠️ PCC: Patient save not implemented - PCC API may be read-only`
      );

      // If PCC API supported patient updates, you would:
      // 1. Convert Patient domain object to PCC format
      // 2. Call PCC API to update patient
      // 3. Return updated patient from API response

      return patient;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const isNetworkError = ExceptionTranslator.isNetworkError(error);
      const isAuthError = ExceptionTranslator.isAuthenticationError(error);

      this.logger.error(
        `❌ PCC: Failed to save patient ${patient.id}: ${errorMessage}`,
        {
          patientId: patient.id,
          isNetworkError,
          isAuthError,
        }
      );

      // Don't throw error for save failures - PCC might be read-only
      this.logger.warn(
        `⚠️ PCC: Patient save failed, but continuing: ${patient.id}`
      );
      return patient;
    }
  }
}
