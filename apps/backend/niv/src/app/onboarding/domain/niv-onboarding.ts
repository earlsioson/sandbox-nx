import { OnboardingState } from './onboarding-state.interface';
import { ClinicalQualifications } from './value-objects/clinical-qualifications';
import { OnboardingStatus } from './value-objects/onboarding-status';

export class NIVOnboarding implements OnboardingState {
  private _status: OnboardingStatus;
  private _qualifications: ClinicalQualifications;

  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public readonly facilityId: string,
    status: OnboardingStatus,
    public readonly assignedSpecialistId: string | null = null,
    qualifications: ClinicalQualifications = new ClinicalQualifications(),
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this._status = status;
    this._qualifications = qualifications;
  }

  // Interface compliance via getters
  get status(): string {
    return this._status.value;
  }

  get qualifications(): string {
    return JSON.stringify(this._qualifications.toJSON());
  }

  // Rich domain behavior
  getStatusObject(): OnboardingStatus {
    return this._status;
  }

  getQualificationsObject(): ClinicalQualifications {
    return this._qualifications;
  }

  updateStatus(newStatus: OnboardingStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`
      );
    }
    this._status = newStatus;
  }

  updateQualifications(qualifications: ClinicalQualifications): void {
    this._qualifications = qualifications;
  }

  isEligibleForNIV(): boolean {
    return this._qualifications.hasAnyQualification();
  }

  isActive(): boolean {
    return this._status.isActive();
  }

  isInProgress(): boolean {
    return this._status.isInProgress();
  }

  canAssignSpecialist(): boolean {
    return this._status.value === 'NEW' || this._status.value === 'WATCHLIST';
  }

  requiresRTReview(): boolean {
    return this._status.value === 'WATCHLIST';
  }
}
