import { Injectable } from '@nestjs/common';
import { NIVOnboardingFactory } from '../domain/factories/niv-onboarding.factory';
import { NIVOnboarding } from '../domain/niv-onboarding';
import { Patient } from '../domain/patient';
import { ClinicalQualificationService } from '../domain/services/clinical-qualification.service';
import { OnboardingRepository } from './ports/onboarding.repository';

export interface PatientWithQualifications {
  patient: Patient;
  onboarding: NIVOnboarding | null;
  hasQualifications: boolean;
  qualificationTypes: string[];
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly onboardingFactory: NIVOnboardingFactory,
    private readonly clinicalQualificationService: ClinicalQualificationService
  ) {}

  async getPatientsWithQualifications(
    facilityId?: string
  ): Promise<PatientWithQualifications[]> {
    // Get patients from specified facility or all facilities
    const patients = facilityId
      ? await this.onboardingRepository.findPatientsByFacility(facilityId)
      : await this.getAllPatients();

    // Get qualification criteria (reference data)
    const qualificationCriteria =
      await this.onboardingRepository.getQualificationCriteria();

    // Get existing onboardings
    const onboardings = facilityId
      ? await this.onboardingRepository.findByFacilityId(facilityId)
      : await this.onboardingRepository.findAll();

    // Map patients to their qualifications
    return Promise.all(
      patients.map(async (patient) => {
        // Find existing onboarding for this patient
        const existingOnboarding = onboardings.find(
          (o) => o.patientId === patient.id
        );

        // Assess clinical qualifications
        const qualifications =
          this.clinicalQualificationService.assessQualifications(
            patient.diagnosisCodes,
            qualificationCriteria
          );

        return {
          patient,
          onboarding: existingOnboarding || null,
          hasQualifications: qualifications.hasAnyQualification(),
          qualificationTypes: qualifications.getQualificationTypes(),
        };
      })
    );
  }

  async getPatientWithQualifications(
    patientId: string
  ): Promise<PatientWithQualifications | null> {
    const patient = await this.onboardingRepository.findPatientById(patientId);
    if (!patient) return null;

    const onboarding = await this.onboardingRepository.findByPatientId(
      patientId
    );
    const qualificationCriteria =
      await this.onboardingRepository.getQualificationCriteria();

    const qualifications =
      this.clinicalQualificationService.assessQualifications(
        patient.diagnosisCodes,
        qualificationCriteria
      );

    return {
      patient,
      onboarding,
      hasQualifications: qualifications.hasAnyQualification(),
      qualificationTypes: qualifications.getQualificationTypes(),
    };
  }

  async refreshPatientData(patientId: string): Promise<Patient> {
    return this.onboardingRepository.refreshPatientClinicalData(patientId);
  }

  async findAllOnboardings(): Promise<NIVOnboarding[]> {
    return this.onboardingRepository.findAll();
  }

  private async getAllPatients(): Promise<Patient[]> {
    // This would need to be implemented based on business requirements
    // For now, return empty array as we typically work with specific facilities
    return [];
  }
}
