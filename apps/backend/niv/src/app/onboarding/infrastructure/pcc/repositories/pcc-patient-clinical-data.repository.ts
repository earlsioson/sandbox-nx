// onboarding/infrastructure/pcc/repositories/pcc-patient-clinical-data.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PccAPIClient } from '../../../../shared/infrastructure/pcc/pcc-api.client';
import { Patient } from '../../../domain/patient';
import {
  PccPatientClinicalDataResponse,
  PccPatientResponse,
} from '../entities/pcc-patient-response.entity';
import { PccPatientClinicalDataMapper } from '../mappers/pcc-patient-clinical-data.mapper';

@Injectable()
export class PccPatientClinicalDataRepository {
  private readonly logger = new Logger(PccPatientClinicalDataRepository.name);

  constructor(private pccApiClient: PccAPIClient) {}

  async findPatientById(patientId: string): Promise<Patient | null> {
    try {
      this.logger.log(`🔍 Fetching patient data from PCC: ${patientId}`);

      // Get patient basic information
      const patientData = await this.pccApiClient.get<PccPatientResponse>(
        `/api/public/preview1/patients/${patientId}`
      );

      // Get patient conditions/diagnoses
      const conditions = await this.pccApiClient.get<any[]>(
        `/api/public/preview1/patients/${patientId}/conditions`
      );

      // Combine into clinical data response
      const clinicalData: PccPatientClinicalDataResponse = {
        patient: patientData,
        medicalDiagnosis: [], // Would be populated from another endpoint if available
        treatmentDiagnosis: [], // Would be populated from another endpoint if available
        conditions: conditions || [],
      };

      const patient =
        PccPatientClinicalDataMapper.patientToDomain(clinicalData);

      this.logger.log(
        `✅ Successfully fetched patient data for: ${patientId}`,
        {
          diagnosisCount: patient.diagnosisCodes.length,
        }
      );

      return patient;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch patient data for ${patientId}:`,
        error.message
      );

      // Return null if patient not found, throw for other errors
      if (
        error.message.includes('404') ||
        error.message.includes('not found')
      ) {
        return null;
      }

      throw new Error(
        `Failed to fetch patient data from PCC: ${error.message}`
      );
    }
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    try {
      this.logger.log(`🔍 Fetching patients for facility: ${facilityId}`);

      // Get facility patients list
      const patientsResponse = await this.pccApiClient.get<{
        data: PccPatientResponse[];
      }>(`/api/public/preview1/facilities/${facilityId}/patients`, {
        // Add query parameters as needed for pagination, filtering, etc.
        limit: 100,
        status: 'active',
      });

      // For each patient, get their detailed clinical data
      const patientsWithClinicalData = await Promise.all(
        patientsResponse.data.map(async (patient) => {
          try {
            // Get detailed patient data including conditions
            const conditions = await this.pccApiClient.get<any[]>(
              `/api/public/preview1/patients/${patient.patientId}/conditions`
            );

            const clinicalData: PccPatientClinicalDataResponse = {
              patient,
              conditions: conditions || [],
              medicalDiagnosis: [],
              treatmentDiagnosis: [],
            };

            return PccPatientClinicalDataMapper.patientToDomain(clinicalData);
          } catch (error) {
            this.logger.warn(
              `⚠️ Failed to fetch clinical data for patient ${patient.patientId}:`,
              error.message
            );

            // Return patient with basic data only if clinical data fetch fails
            const basicClinicalData: PccPatientClinicalDataResponse = {
              patient,
              conditions: [],
              medicalDiagnosis: [],
              treatmentDiagnosis: [],
            };

            return PccPatientClinicalDataMapper.patientToDomain(
              basicClinicalData
            );
          }
        })
      );

      this.logger.log(
        `✅ Successfully fetched ${patientsWithClinicalData.length} patients for facility: ${facilityId}`
      );

      return patientsWithClinicalData;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch patients for facility ${facilityId}:`,
        error.message
      );
      throw new Error(`Failed to fetch patients from PCC: ${error.message}`);
    }
  }

  async refreshPatientClinicalData(patientId: string): Promise<Patient> {
    this.logger.log(`🔄 Refreshing clinical data for patient: ${patientId}`);

    const patient = await this.findPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found in PCC`);
    }

    this.logger.log(`✅ Clinical data refreshed for patient: ${patientId}`);
    return patient;
  }

  // Utility method for testing PCC connectivity
  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('🧪 Testing PCC connection...');

      // Test with a simple endpoint that should be accessible
      await this.pccApiClient.get(
        '/api/public/preview1/webhook-subscriptions',
        {
          applicationName: 'centara-dev',
        }
      );

      this.logger.log('✅ PCC connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ PCC connection test failed:', error.message);
      return false;
    }
  }
}
