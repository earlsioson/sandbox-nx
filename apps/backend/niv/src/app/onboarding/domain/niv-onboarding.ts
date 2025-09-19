import { Patient } from './patient';
import { ClinicalQualifications } from './value-objects/clinical-qualifications';
import { DiagnosisCode } from './value-objects/diagnosis-code';
import { OnboardingStatus } from './value-objects/onboarding-status';

export interface QualificationCriteria {
  icd10Code: string;
  qualificationType: 'COPD' | 'ARF' | 'NMD' | 'TRD';
  isQualifying: boolean;
}

export class NivOnboarding {
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

  // MOVED FROM SERVICE: Clinical qualification assessment logic
  assessClinicalQualifications(
    patient: Patient,
    qualificationCriteria: QualificationCriteria[]
  ): void {
    const copdQualified = this.hasQualifyingCodes(
      patient.diagnosisCodes,
      qualificationCriteria,
      'COPD'
    );
    const arfQualified = this.hasQualifyingCodes(
      patient.diagnosisCodes,
      qualificationCriteria,
      'ARF'
    );
    const nmdQualified = this.hasQualifyingCodes(
      patient.diagnosisCodes,
      qualificationCriteria,
      'NMD'
    );
    const trdQualified = this.hasQualifyingCodes(
      patient.diagnosisCodes,
      qualificationCriteria,
      'TRD'
    );

    // Update aggregate state - maintaining consistency boundary
    this._qualifications = new ClinicalQualifications(
      copdQualified,
      arfQualified,
      nmdQualified,
      trdQualified
    );

    // Could emit domain event here for cross-context communication
    // this.addDomainEvent(new PatientQualificationsAssessed(this.id, this._qualifications));
  }

  getQualificationReasons(
    patient: Patient,
    qualificationCriteria: QualificationCriteria[]
  ): Record<string, string[]> {
    const reasons: Record<string, string[]> = {
      COPD: [],
      ARF: [],
      NMD: [],
      TRD: [],
    };

    patient.diagnosisCodes.forEach((diagnosisCode) => {
      const matchingCriteria = qualificationCriteria.find(
        (criteria) =>
          criteria.icd10Code === diagnosisCode.code && criteria.isQualifying
      );

      if (matchingCriteria) {
        reasons[matchingCriteria.qualificationType].push(
          diagnosisCode.description || diagnosisCode.code
        );
      }
    });

    return reasons;
  }

  private hasQualifyingCodes(
    diagnosisCodes: DiagnosisCode[],
    qualificationCriteria: QualificationCriteria[],
    qualificationType: 'COPD' | 'ARF' | 'NMD' | 'TRD'
  ): boolean {
    const qualifyingCriteria = qualificationCriteria.filter(
      (criteria) =>
        criteria.qualificationType === qualificationType &&
        criteria.isQualifying
    );

    return diagnosisCodes.some((diagnosisCode) =>
      qualifyingCriteria.some(
        (criteria) => criteria.icd10Code === diagnosisCode.code
      )
    );
  }

  // Existing rich domain behavior
  isEligibleForNiv(): boolean {
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

  requiresRtReview(): boolean {
    return this._status.value === 'WATCHLIST';
  }
}
