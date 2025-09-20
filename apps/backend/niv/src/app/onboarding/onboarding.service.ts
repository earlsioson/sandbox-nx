import { Injectable, Logger } from '@nestjs/common';
import { createMockPccAdapter, createPccAdapter } from './adapters';
import { getClinicalQualifications } from './diagnosis';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  // Use dependency injection pattern but with our functional adapters
  private readonly pccAdapter = createPccAdapter();
  private readonly mockAdapter = createMockPccAdapter();

  async testPccConnection(): Promise<any> {
    try {
      this.logger.log('Testing PCC connection...');
      const isConnected = await this.pccAdapter.testConnection();

      return {
        success: isConnected,
        message: isConnected
          ? 'PCC connection successful'
          : 'PCC connection failed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('PCC connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getPatientWithQualifications(
    orgUuid: string,
    patientId: number
  ): Promise<any> {
    try {
      this.logger.log(`Getting patient ${patientId} with qualifications...`);

      const { patient, diagnoses } =
        await this.pccAdapter.getPatientWithDiagnoses(orgUuid, patientId);

      if (!patient) {
        return {
          success: false,
          error: 'Patient not found',
        };
      }

      const qualifications = getClinicalQualifications(diagnoses);

      return {
        success: true,
        data: {
          patient: {
            ...patient,
            fullName: `${patient.firstName} ${patient.lastName}`,
          },
          diagnoses: diagnoses.map((d) => ({
            code: d.icd10Code,
            description: d.description,
            isPrimary: d.isPrimary,
          })),
          clinicalQualifications: qualifications,
          isNivEligible: Object.values(qualifications).some(Boolean),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get patient ${patientId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test with mock data
  async testMockData(): Promise<any> {
    try {
      const { patient, diagnoses } =
        await this.mockAdapter.getPatientWithDiagnoses('test-org', 123);
      const qualifications = getClinicalQualifications(diagnoses);

      return {
        success: true,
        data: {
          patient,
          diagnoses,
          clinicalQualifications: qualifications,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
