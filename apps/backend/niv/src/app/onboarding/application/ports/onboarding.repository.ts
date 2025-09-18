import {
  NivOnboarding,
  QualificationCriteria,
} from '../../domain/niv-onboarding';
import { Patient } from '../../domain/patient';

export abstract class OnboardingRepository {
  abstract findAll(): Promise<NivOnboarding[]>;
  abstract findById(id: string): Promise<NivOnboarding | null>;
  abstract findByPatientId(patientId: string): Promise<NivOnboarding | null>;
  abstract findByFacilityId(facilityId: string): Promise<NivOnboarding[]>;
  abstract save(onboarding: NivOnboarding): Promise<NivOnboarding>;

  // Patient-related methods (integrates with PCC)
  abstract findPatientById(patientId: string): Promise<Patient | null>;
  abstract findPatientsByFacility(facilityId: string): Promise<Patient[]>;
  abstract refreshPatientClinicalData(patientId: string): Promise<Patient>;

  // Qualification criteria (reference data)
  abstract getQualificationCriteria(): Promise<QualificationCriteria[]>;
}
