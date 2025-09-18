import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('diagnosis_code_qualifications')
export class DiagnosisCodeQualificationEntity {
  @PrimaryColumn({ name: 'icd10_code' })
  icd10Code!: string;

  @Column({ name: 'qualification_type' })
  qualificationType!: 'COPD' | 'ARF' | 'NMD' | 'TRD';

  @Column({ name: 'is_qualifying', type: 'boolean' })
  isQualifying!: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  notes?: string;
}
