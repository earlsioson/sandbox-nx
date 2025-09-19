// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PatientData, PatientRepository } from './patient-repository';

/**
 * PCC API Response Types (based on OpenAPI spec)
 */
interface PccPatientResponse {
  patientId: number;
  facilityId?: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  medicalRecordNumber?: string;
}

interface PccDiagnosisCode {
  code: string;
  codeLibrary: string;
  onsetDate?: string;
}

interface PccCondition {
  identifier?: {
    coding?: Array<{
      code: string;
      system: string;
    }>;
  };
}

interface PccPatientClinicalData {
  patient: PccPatientResponse;
  medicalDiagnosis?: PccDiagnosisCode[];
  treatmentDiagnosis?: PccDiagnosisCode[];
  conditions?: PccCondition[];
}

/**
 * Repository implementation that fetches patient data from PCC API
 * Maps PCC response format to our domain PatientData interface
 */
@Injectable()
export class PccPatientRepository implements PatientRepository {
  private readonly logger = new Logger(PccPatientRepository.name);

  constructor(private readonly pccApiClient: any) {} // TODO: Type PccAPIClient properly

  /**
   * Fetches patient data from PCC API and extracts all diagnosis codes
   */
  async findById(patientId: string): Promise<PatientData> {
    this.logger.log(`🔍 Fetching patient data from PCC API: ${patientId}`);

    try {
      // Step 1: Get basic patient information
      const patientResponse = await this.pccApiClient.get<PccPatientResponse>(
        `/api/public/preview1/patients/${patientId}`
      );

      // Step 2: Get patient clinical data (conditions, diagnoses)
      const clinicalData = await this.fetchPatientClinicalData(patientId);

      // Step 3: Extract all diagnosis codes from various sources
      const diagnosisCodes = this.extractAllDiagnosisCodes(clinicalData);

      // Step 4: Map to our domain interface
      const patientData: PatientData = {
        patientId: patientResponse.patientId.toString(),
        facilityId: patientResponse.facilityId?.toString() || 'unknown',
        firstName: patientResponse.firstName,
        lastName: patientResponse.lastName,
        birthDate: patientResponse.birthDate,
        medicalRecordNumber: patientResponse.medicalRecordNumber,
        diagnosisCodes,
      };

      this.logger.log(
        `✅ Found patient: ${patientData.firstName} ${patientData.lastName} with ${diagnosisCodes.length} diagnosis codes`
      );
      this.logger.debug(`Diagnosis codes: ${diagnosisCodes.join(', ')}`);

      return patientData;
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch patient ${patientId} from PCC API:`,
        error
      );
      throw new Error(`Patient not found or PCC API error: ${error.message}`);
    }
  }

  /**
   * Fetches patient clinical data (conditions, medical/treatment diagnoses)
   */
  private async fetchPatientClinicalData(
    patientId: string
  ): Promise<Partial<PccPatientClinicalData>> {
    const clinicalData: Partial<PccPatientClinicalData> = {};

    try {
      // Try to get conditions
      clinicalData.conditions = await this.pccApiClient.get<PccCondition[]>(
        `/api/public/preview1/patients/${patientId}/conditions`
      );
    } catch (error) {
      this.logger.warn(
        `⚠️ Could not fetch conditions for patient ${patientId}: ${error.message}`
      );
      clinicalData.conditions = [];
    }

    // TODO: Add medical diagnosis and treatment diagnosis endpoints if available
    // These might be from therapy documents or other PCC endpoints

    return clinicalData;
  }

  /**
   * Extracts all ICD-10 diagnosis codes from PCC clinical data
   * Combines codes from conditions, medical diagnoses, and treatment diagnoses
   */
  private extractAllDiagnosisCodes(
    clinicalData: Partial<PccPatientClinicalData>
  ): string[] {
    const diagnosisCodes: string[] = [];

    // Extract from conditions (FHIR-style coding)
    if (clinicalData.conditions) {
      for (const condition of clinicalData.conditions) {
        if (condition.identifier?.coding) {
          for (const coding of condition.identifier.coding) {
            // Filter for ICD-10 codes only
            if (
              coding.system?.includes('ICD') ||
              coding.system?.includes('icd10')
            ) {
              diagnosisCodes.push(coding.code);
            }
          }
        }
      }
    }

    // Extract from medical diagnosis codes
    if (clinicalData.medicalDiagnosis) {
      for (const diagnosis of clinicalData.medicalDiagnosis) {
        if (diagnosis.codeLibrary?.includes('ICD-10')) {
          diagnosisCodes.push(diagnosis.code);
        }
      }
    }

    // Extract from treatment diagnosis codes
    if (clinicalData.treatmentDiagnosis) {
      for (const diagnosis of clinicalData.treatmentDiagnosis) {
        if (diagnosis.codeLibrary?.includes('ICD-10')) {
          diagnosisCodes.push(diagnosis.code);
        }
      }
    }

    // Remove duplicates and return
    return [...new Set(diagnosisCodes)];
  }
}
