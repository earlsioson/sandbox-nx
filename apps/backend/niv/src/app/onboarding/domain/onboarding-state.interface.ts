export interface OnboardingState {
  id: string;
  patientId: string;
  facilityId: string;
  status: string;
  assignedSpecialistId: string | null;
  qualifications: string; // JSON string of clinical qualifications
  createdAt: Date;
  updatedAt: Date;
}
