export class DiagnosisCode {
  constructor(
    readonly code: string,
    readonly codeLibrary: 'ICD-10-CM' | 'ICD-10-CA',
    readonly description?: string
  ) {}

  equals(other: DiagnosisCode): boolean {
    return this.code === other.code && this.codeLibrary === other.codeLibrary;
  }

  isCOPDCode(): boolean {
    return this.code.startsWith('J44') || this.code === 'J42';
  }

  isRespiratoryFailureCode(): boolean {
    return this.code.startsWith('J96');
  }

  isNeuromuscularCode(): boolean {
    return (
      this.code.startsWith('G12') ||
      this.code.startsWith('G70') ||
      this.code.startsWith('G71') ||
      this.code.startsWith('G73') ||
      this.code.startsWith('G80')
    );
  }

  getCategory(): string {
    return this.code.substring(0, 3);
  }

  toString(): string {
    return this.description ? `${this.code}: ${this.description}` : this.code;
  }
}
