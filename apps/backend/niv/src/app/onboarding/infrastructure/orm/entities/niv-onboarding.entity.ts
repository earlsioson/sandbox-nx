import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OnboardingState } from '../../../domain/onboarding-state.interface';

@Entity('niv_onboardings')
export class NIVOnboardingEntity implements OnboardingState {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @Column({ name: 'facility_id' })
  facilityId!: string;

  @Column()
  status!: string;

  @Column({ name: 'assigned_specialist_id', nullable: true })
  assignedSpecialistId!: string | null;

  @Column({ type: 'text' })
  qualifications!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
