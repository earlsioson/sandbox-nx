// onboarding/infrastructure/pcc/mappers/pcc-patient-clinical-data.mapper.ts
import { randomUUID } from 'crypto';
import { Patient } from '../../../domain/patient';
import { DiagnosisCode } from '../../../domain/value-objects/diagnosis-code';
import { PatientDemographics } from '../../../domain/value-objects/patient-demographics';
import { PccPatientClinicalDataResponse } from '../entities/pcc-patient-response.entity';

export class PccPatientClinicalDataMapper {
  static patientToDomain(pccData: PccPatientClinicalDataResponse): Patient {
    const patientId = randomUUID(); // Generate local patient ID

    const demographics = new PatientDemographics(
      pccData.patient.firstName,
      pccData.patient.lastName,
      new Date(pccData.patient.birthDate),
      pccData.patient.medicalRecordNumber || `PCC-${pccData.patient.patientId}`,
      pccData.patient.facilityId?.toString() || 'unknown'
    );

    const diagnosisCodes = this.extractDiagnosisCodes(pccData);

    return new Patient(patientId, demographics, diagnosisCodes);
  }

  static patientListToDomain(
    pccDataList: PccPatientClinicalDataResponse[]
  ): Patient[] {
    return pccDataList.map((pccData) => this.patientToDomain(pccData));
  }

  private static extractDiagnosisCodes(
    pccData: PccPatientClinicalDataResponse
  ): DiagnosisCode[] {
    const diagnosisCodes: DiagnosisCode[] = [];

    // Extract from medicalDiagnosis array
    if (pccData.medicalDiagnosis) {
      const medicalCodes = pccData.medicalDiagnosis.map(
        (diagnosis) =>
          new DiagnosisCode(
            diagnosis.code,
            diagnosis.codeLibrary,
            diagnosis.description
          )
      );
      diagnosisCodes.push(...medicalCodes);
    }

    // Extract from treatmentDiagnosis array
    if (pccData.treatmentDiagnosis) {
      const treatmentCodes = pccData.treatmentDiagnosis.map(
        (diagnosis) =>
          new DiagnosisCode(
            diagnosis.code,
            diagnosis.codeLibrary,
            diagnosis.description
          )
      );
      diagnosisCodes.push(...treatmentCodes);
    }

    // Extract from conditions array (if they have ICD-10 codes)
    if (pccData.conditions) {
      const conditionCodes = pccData.conditions
        .filter((condition) => condition.identifier?.coding?.length > 0)
        .flatMap((condition) =>
          condition.identifier.coding
            .filter(
              (coding) =>
                coding.system.includes('ICD') || coding.system.includes('icd10')
            )
            .map((coding) => {
              // Determine code library from system URL
              const codeLibrary = coding.system.includes('icd10-CA')
                ? 'ICD-10-CA'
                : 'ICD-10-CM';

              return new DiagnosisCode(
                coding.code,
                codeLibrary as 'ICD-10-CM' | 'ICD-10-CA',
                coding.display
              );
            })
        );
      diagnosisCodes.push(...conditionCodes);
    }

    // Remove duplicates based on code and codeLibrary
    const uniqueCodes = diagnosisCodes.filter(
      (code, index, arr) =>
        index ===
        arr.findIndex(
          (c) => c.code === code.code && c.codeLibrary === code.codeLibrary
        )
    );

    return uniqueCodes;
  }

  static createMockPatientData(
    patientId: string,
    facilityId: string
  ): PccPatientClinicalDataResponse {
    // This method is useful for testing or when PCC data is not available
    return {
      patient: {
        patientId: parseInt(patientId),
        firstName: 'Mock',
        lastName: 'Patient',
        birthDate: '1950-01-01',
        gender: 'M',
        medicalRecordNumber: `MR-${patientId}`,
        facilityId: parseInt(facilityId),
        patientStatus: 'Active',
      },
      medicalDiagnosis: [
        {
          code: 'J44.1',
          codeLibrary: 'ICD-10-CM',
          onsetDate: '2024-01-01',
          description:
            'Chronic obstructive pulmonary disease with (acute) exacerbation',
        },
      ],
      treatmentDiagnosis: [],
      conditions: [],
    };
  }
}
