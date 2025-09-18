import { DiagnosisCode } from './value-objects/diagnosis-code';
import { PatientDemographics } from './value-objects/patient-demographics';

export class Patient {
  constructor(
    public readonly id: string,
    private _demographics: PatientDemographics,
    private _diagnosisCodes: DiagnosisCode[] = []
  ) {}

  get demographics(): PatientDemographics {
    return this._demographics;
  }

  get diagnosisCodes(): DiagnosisCode[] {
    return [...this._diagnosisCodes];
  }

  updateDemographics(demographics: PatientDemographics): void {
    this._demographics = demographics;
  }

  updateDiagnosisCodes(codes: DiagnosisCode[]): void {
    this._diagnosisCodes = [...codes];
  }

  hasDiagnosisCode(code: string): boolean {
    return this._diagnosisCodes.some((diagnosis) => diagnosis.code === code);
  }

  getDiagnosisCodesByCategory(category: string): DiagnosisCode[] {
    return this._diagnosisCodes.filter(
      (diagnosis) => diagnosis.getCategory() === category
    );
  }

  getCOPDDiagnosisCodes(): DiagnosisCode[] {
    return this._diagnosisCodes.filter((diagnosis) => diagnosis.isCOPDCode());
  }

  getRespiratoryFailureDiagnosisCodes(): DiagnosisCode[] {
    return this._diagnosisCodes.filter((diagnosis) =>
      diagnosis.isRespiratoryFailureCode()
    );
  }

  getNeuromuscularDiagnosisCodes(): DiagnosisCode[] {
    return this._diagnosisCodes.filter((diagnosis) =>
      diagnosis.isNeuromuscularCode()
    );
  }
}
