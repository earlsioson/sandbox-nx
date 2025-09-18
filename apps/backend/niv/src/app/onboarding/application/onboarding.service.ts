import { Injectable } from '@nestjs/common';
import { NivOnboardingFactory } from '../domain/factories/niv-onboarding.factory';
import { NivOnboarding } from '../domain/niv-onboarding';
import { Patient } from '../domain/patient';
import { OnboardingRepository } from './ports/onboarding.repository';

export interface PatientWithQualifications {
  patient: Patient;
  onboarding: NivOnboarding | null;
  hasQualifications: boolean;
  qualificationTypes: string[];
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly onboardingFactory: NivOnboardingFactory
  ) // NO LONGER NEED: ClinicalQualificationService - logic moved to aggregate
  {}

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

    // Create onboarding map for quick lookup
    const onboardingsByPatientId = new Map(
      onboardings.map((onboarding) => [onboarding.patientId, onboarding])
    );

    // Process each patient
    const results: PatientWithQualifications[] = [];

    for (const patient of patients) {
      let onboarding = onboardingsByPatientId.get(patient.id);

      // Create new onboarding if doesn't exist
      if (!onboarding) {
        onboarding = this.onboardingFactory.create(
          patient.id,
          patient.demographics.facilityId
        );
      }

      // REFACTORED: Use aggregate method instead of service
      onboarding.assessClinicalQualifications(patient, qualificationCriteria);

      // Save updated onboarding (with new qualifications)
      const savedOnboarding = await this.onboardingRepository.save(onboarding);

      const qualifications = savedOnboarding.getQualificationsObject();

      results.push({
        patient,
        onboarding: savedOnboarding,
        hasQualifications: qualifications.hasAnyQualification(),
        qualificationTypes: qualifications.getQualificationTypes(),
      });
    }

    return results;
  }

  async createOnboarding(
    patientId: string,
    facilityId: string,
    assignedSpecialistId?: string
  ): Promise<NivOnboarding> {
    // Check if onboarding already exists
    const existingOnboarding = await this.onboardingRepository.findByPatientId(
      patientId
    );
    if (existingOnboarding) {
      throw new Error(`Onboarding already exists for patient ${patientId}`);
    }

    // Get patient data for qualification assessment
    const patient = await this.onboardingRepository.findPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    // Create new onboarding
    const onboarding = this.onboardingFactory.create(
      patientId,
      facilityId,
      assignedSpecialistId
    );

    // Assess qualifications using aggregate method
    const qualificationCriteria =
      await this.onboardingRepository.getQualificationCriteria();
    onboarding.assessClinicalQualifications(patient, qualificationCriteria);

    // Save and return
    return await this.onboardingRepository.save(onboarding);
  }

  async getOnboardingById(id: string): Promise<NivOnboarding | null> {
    return await this.onboardingRepository.findById(id);
  }

  async getOnboardingByPatientId(
    patientId: string
  ): Promise<NivOnboarding | null> {
    return await this.onboardingRepository.findByPatientId(patientId);
  }

  private async getAllPatients(): Promise<Patient[]> {
    // This would need to be implemented based on how you want to get all patients
    // For now, throwing an error to indicate this needs implementation
    throw new Error('Getting all patients across facilities not implemented');
  }
}
