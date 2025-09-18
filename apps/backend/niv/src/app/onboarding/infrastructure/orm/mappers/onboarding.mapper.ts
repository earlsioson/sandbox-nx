import {
  NivOnboarding,
  QualificationCriteria,
} from '../../../domain/niv-onboarding';
import { Patient } from '../../../domain/patient';
import { ClinicalQualifications } from '../../../domain/value-objects/clinical-qualifications';
import { DiagnosisCode } from '../../../domain/value-objects/diagnosis-code';
import { OnboardingStatus } from '../../../domain/value-objects/onboarding-status';
import { PatientDemographics } from '../../../domain/value-objects/patient-demographics';
import { DiagnosisCodeQualificationEntity } from '../entities/diagnosis-code-qualification.entity';
import { NivOnboardingEntity } from '../entities/niv-onboarding.entity';
import { PatientEntity } from '../entities/patient.entity';

export class OnboardingMapper {
  static toDomain(entity: NivOnboardingEntity): NivOnboarding {
    return new NivOnboarding(
      entity.id,
      entity.patientId,
      entity.facilityId,
      new OnboardingStatus(entity.status as any),
      entity.assignedSpecialistId,
      ClinicalQualifications.fromJSON(JSON.parse(entity.qualifications)),
      entity.createdAt,
      entity.updatedAt
    );
  }

  static toPersistence(onboarding: NivOnboarding): NivOnboardingEntity {
    const entity = new NivOnboardingEntity();

    entity.id = onboarding.id;
    entity.patientId = onboarding.patientId;
    entity.facilityId = onboarding.facilityId;
    entity.status = onboarding.status;
    entity.assignedSpecialistId = onboarding.assignedSpecialistId;
    entity.qualifications = onboarding.qualifications;

    return entity;
  }

  static patientToDomain(entity: PatientEntity): Patient {
    const demographics = new PatientDemographics(
      entity.firstName,
      entity.lastName,
      entity.dateOfBirth,
      entity.medicalRecordNumber,
      entity.facilityId
    );

    const diagnosisCodesData = JSON.parse(entity.diagnosisCodes || '[]');
    const diagnosisCodes = diagnosisCodesData.map(
      (codeData: any) =>
        new DiagnosisCode(
          codeData.code,
          codeData.codeLibrary,
          codeData.description
        )
    );

    return new Patient(entity.id, demographics, diagnosisCodes);
  }

  static patientToPersistence(patient: Patient): PatientEntity {
    const entity = new PatientEntity();

    entity.id = patient.id;
    entity.firstName = patient.demographics.firstName;
    entity.lastName = patient.demographics.lastName;
    entity.dateOfBirth = patient.demographics.dateOfBirth;
    entity.medicalRecordNumber = patient.demographics.medicalRecordNumber;
    entity.facilityId = patient.demographics.facilityId;
    entity.diagnosisCodes = JSON.stringify(
      patient.diagnosisCodes.map((code) => ({
        code: code.code,
        codeLibrary: code.codeLibrary,
        description: code.description,
      }))
    );

    return entity;
  }

  static qualificationCriteriaToDomain(
    entity: DiagnosisCodeQualificationEntity
  ): QualificationCriteria {
    return {
      icd10Code: entity.icd10Code,
      qualificationType: entity.qualificationType,
      isQualifying: entity.isQualifying,
    };
  }
}
