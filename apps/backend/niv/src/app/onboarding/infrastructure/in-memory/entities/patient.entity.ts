export interface PatientState {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  medicalRecordNumber: string;
  facilityId: string;
  pccPatientId: string | null;
  diagnosisCodes: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PatientEntity implements PatientState {
  id!: string;
  firstName!: string;
  lastName!: string;
  dateOfBirth!: Date;
  medicalRecordNumber!: string;
  facilityId!: string;
  pccPatientId!: string | null;
  diagnosisCodes!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
