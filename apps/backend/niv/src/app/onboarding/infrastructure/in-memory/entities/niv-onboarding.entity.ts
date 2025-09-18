import { OnboardingState } from '../../../domain/onboarding-state.interface';

export class NivOnboardingEntity implements OnboardingState {
  id!: string;
  patientId!: string;
  facilityId!: string;
  status!: string;
  assignedSpecialistId!: string | null;
  qualifications!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
