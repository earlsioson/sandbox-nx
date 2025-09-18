import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NivOnboarding } from '../niv-onboarding';
import { ClinicalQualifications } from '../value-objects/clinical-qualifications';
import { OnboardingStatus } from '../value-objects/onboarding-status';

@Injectable()
export class NivOnboardingFactory {
  create(
    patientId: string,
    facilityId: string,
    assignedSpecialistId?: string,
    qualifications?: ClinicalQualifications
  ): NivOnboarding {
    const onboardingId = randomUUID();
    const status = new OnboardingStatus('NEW');
    const clinicalQualifications =
      qualifications || new ClinicalQualifications();

    return new NivOnboarding(
      onboardingId,
      patientId,
      facilityId,
      status,
      assignedSpecialistId || null,
      clinicalQualifications
    );
  }

  createWithStatus(
    patientId: string,
    facilityId: string,
    status: 'NEW' | 'WATCHLIST' | 'PENDING' | 'ACTIVE' | 'REVIEWED' | 'CHANGED',
    assignedSpecialistId?: string,
    qualifications?: ClinicalQualifications
  ): NivOnboarding {
    const onboardingId = randomUUID();
    const onboardingStatus = new OnboardingStatus(status);
    const clinicalQualifications =
      qualifications || new ClinicalQualifications();

    return new NivOnboarding(
      onboardingId,
      patientId,
      facilityId,
      onboardingStatus,
      assignedSpecialistId || null,
      clinicalQualifications
    );
  }
}
