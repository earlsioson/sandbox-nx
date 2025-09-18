import { NIVOnboarding } from '../../domain/niv-onboarding';
import { Patient } from '../../domain/patient';
import { QualificationCriteria } from '../../domain/services/clinical-qualification.service';

export abstract class OnboardingRepository {
  abstract findAll(): Promise<NIVOnboarding[]>;
  abstract findById(id: string): Promise<NIVOnboarding | null>;
  abstract findByPatientId(patientId: string): Promise<NIVOnboarding | null>;
  abstract findByFacilityId(facilityId: string): Promise<NIVOnboarding[]>;
  abstract save(onboarding: NIVOnboarding): Promise<NIVOnboarding>;

  // Patient-related methods (integrates with PCC)
  abstract findPatientById(patientId: string): Promise<Patient | null>;
  abstract findPatientsByFacility(facilityId: string): Promise<Patient[]>;
  abstract refreshPatientClinicalData(patientId: string): Promise<Patient>;

  // Qualification criteria (reference data)
  abstract getQualificationCriteria(): Promise<QualificationCriteria[]>;
}
