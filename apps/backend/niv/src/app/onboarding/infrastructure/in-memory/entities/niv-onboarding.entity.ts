import { OnboardingState } from '../../../domain/onboarding-state.interface';

export class NIVOnboardingEntity implements OnboardingState {
  id!: string;
  patientId!: string;
  facilityId!: string;
  status!: string;
  assignedSpecialistId!: string | null;
  qualifications!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
