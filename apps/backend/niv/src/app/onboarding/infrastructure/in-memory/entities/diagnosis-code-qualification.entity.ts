export class DiagnosisCodeQualificationEntity {
  id!: number;
  icd10Code!: string;
  qualificationType!: 'COPD' | 'ARF' | 'NMD' | 'TRD';
  isQualifying!: boolean;
  description!: string | null;
  notes!: string | null;
}
