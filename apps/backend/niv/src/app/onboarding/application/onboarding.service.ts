// apps/backend/niv/src/app/onboarding/application/onboarding.service.ts
// ✅ COMPLETE FILE - Only use if you accidentally replaced the original

import { Injectable } from '@nestjs/common';
import { NivOnboardingFactory } from '../domain/factories/niv-onboarding.factory';
import { NivOnboarding } from '../domain/niv-onboarding';
import { Patient } from '../domain/patient';
import { OnboardingStatus } from '../domain/value-objects/onboarding-status';
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

      // Use aggregate method instead of service
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

  // ✅ MISSING METHOD - This was the main error
  async findAllOnboardings(): Promise<NivOnboarding[]> {
    return await this.onboardingRepository.findAll();
  }

  async getOnboardingById(id: string): Promise<NivOnboarding | null> {
    return await this.onboardingRepository.findById(id);
  }

  async getOnboardingByPatientId(
    patientId: string
  ): Promise<NivOnboarding | null> {
    return await this.onboardingRepository.findByPatientId(patientId);
  }

  async updateOnboardingStatus(
    id: string,
    status: 'NEW' | 'WATCHLIST' | 'PENDING' | 'ACTIVE' | 'REVIEWED' | 'CHANGED'
  ): Promise<NivOnboarding> {
    const onboarding = await this.onboardingRepository.findById(id);
    if (!onboarding) {
      throw new Error(`Onboarding not found: ${id}`);
    }

    // Use aggregate method to maintain business rules
    const newStatus = new OnboardingStatus(status);
    onboarding.updateStatus(newStatus);

    return await this.onboardingRepository.save(onboarding);
  }

  // ✅ IMPLEMENTED - This was throwing an error before
  private async getAllPatients(): Promise<Patient[]> {
    // Get all patients from all facilities
    const allOnboardings = await this.onboardingRepository.findAll();
    const facilityIds = [...new Set(allOnboardings.map((o) => o.facilityId))];

    const allPatients: Patient[] = [];
    for (const facilityId of facilityIds) {
      const patients = await this.onboardingRepository.findPatientsByFacility(
        facilityId
      );
      allPatients.push(...patients);
    }

    // Remove duplicates by patient ID
    const uniquePatients = allPatients.filter(
      (patient, index, array) =>
        array.findIndex((p) => p.id === patient.id) === index
    );

    return uniquePatients;
  }
}
