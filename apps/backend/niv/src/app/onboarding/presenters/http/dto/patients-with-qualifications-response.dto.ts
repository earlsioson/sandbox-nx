export class PatientResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  fullName!: string;
  dateOfBirth!: string;
  age!: number;
  medicalRecordNumber!: string;
  facilityId!: string;
}

export class OnboardingResponseDto {
  id!: string;
  status!: string;
  assignedSpecialistId!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class ClinicalQualificationsResponseDto {
  copd!: boolean;
  arf!: boolean;
  nmd!: boolean;
  trd!: boolean;
  hasAnyQualification!: boolean;
  qualificationTypes!: string[];
}

export class PatientWithQualificationsResponseDto {
  patient!: PatientResponseDto;
  onboarding!: OnboardingResponseDto | null;
  qualifications!: ClinicalQualificationsResponseDto;
}

export class GetPatientsWithQualificationsResponseDto {
  patients!: PatientWithQualificationsResponseDto[];
  totalCount!: number;
  facilityId!: string | null;
}
