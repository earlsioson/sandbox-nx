export class ClinicalQualifications {
  constructor(
    readonly copd: boolean = false,
    readonly arf: boolean = false,
    readonly nmd: boolean = false,
    readonly trd: boolean = false
  ) {}

  equals(other: ClinicalQualifications): boolean {
    return (
      this.copd === other.copd &&
      this.arf === other.arf &&
      this.nmd === other.nmd &&
      this.trd === other.trd
    );
  }

  hasAnyQualification(): boolean {
    return this.copd || this.arf || this.nmd || this.trd;
  }

  getQualificationTypes(): string[] {
    const types: string[] = [];
    if (this.copd) types.push('COPD');
    if (this.arf) types.push('ARF');
    if (this.nmd) types.push('NMD');
    if (this.trd) types.push('TRD');
    return types;
  }

  toJSON(): object {
    return {
      copd: this.copd,
      arf: this.arf,
      nmd: this.nmd,
      trd: this.trd,
    };
  }

  static fromJSON(json: any): ClinicalQualifications {
    return new ClinicalQualifications(
      json.copd || false,
      json.arf || false,
      json.nmd || false,
      json.trd || false
    );
  }
}
