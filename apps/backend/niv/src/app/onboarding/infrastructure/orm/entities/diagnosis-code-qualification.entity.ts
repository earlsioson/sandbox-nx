import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('diagnosis_code_qualifications')
export class DiagnosisCodeQualificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'icd10_code' })
  icd10Code!: string;

  @Column({ name: 'qualification_type' })
  qualificationType!: 'COPD' | 'ARF' | 'NMD' | 'TRD';

  @Column({ name: 'is_qualifying', default: true })
  isQualifying!: boolean;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ nullable: true })
  notes!: string | null;
}
