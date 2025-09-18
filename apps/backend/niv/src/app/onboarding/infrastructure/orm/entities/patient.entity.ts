import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface PatientState {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  medicalRecordNumber: string;
  facilityId: string;
  pccPatientId: string | null;
  diagnosisCodes: string; // JSON array of diagnosis codes
  createdAt: Date;
  updatedAt: Date;
}

@Entity('patients')
export class PatientEntity implements PatientState {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth!: Date;

  @Column({ name: 'medical_record_number' })
  medicalRecordNumber!: string;

  @Column({ name: 'facility_id' })
  facilityId!: string;

  @Column({ name: 'pcc_patient_id', nullable: true })
  pccPatientId!: string | null;

  @Column({ name: 'diagnosis_codes', type: 'text' })
  diagnosisCodes!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
