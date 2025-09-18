import { Injectable } from '@nestjs/common';
import { ClinicalQualifications } from '../value-objects/clinical-qualifications';
import { DiagnosisCode } from '../value-objects/diagnosis-code';

export interface QualificationCriteria {
  icd10Code: string;
  qualificationType: 'COPD' | 'ARF' | 'NMD' | 'TRD';
  isQualifying: boolean;
}

@Injectable()
export class ClinicalQualificationService {
  assessQualifications(
    diagnosisCodes: DiagnosisCode[],
    qualificationCriteria: QualificationCriteria[]
  ): ClinicalQualifications {
    const copdQualified = this.hasQualifyingCodes(
      diagnosisCodes,
      qualificationCriteria,
      'COPD'
    );
    const arfQualified = this.hasQualifyingCodes(
      diagnosisCodes,
      qualificationCriteria,
      'ARF'
    );
    const nmdQualified = this.hasQualifyingCodes(
      diagnosisCodes,
      qualificationCriteria,
      'NMD'
    );
    const trdQualified = this.hasQualifyingCodes(
      diagnosisCodes,
      qualificationCriteria,
      'TRD'
    );

    return new ClinicalQualifications(
      copdQualified,
      arfQualified,
      nmdQualified,
      trdQualified
    );
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

  getQualificationReasons(
    diagnosisCodes: DiagnosisCode[],
    qualificationCriteria: QualificationCriteria[]
  ): Record<string, string[]> {
    const reasons: Record<string, string[]> = {
      COPD: [],
      ARF: [],
      NMD: [],
      TRD: [],
    };

    diagnosisCodes.forEach((diagnosisCode) => {
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
}
