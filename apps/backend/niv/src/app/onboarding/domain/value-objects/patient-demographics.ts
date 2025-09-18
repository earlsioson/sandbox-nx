export class PatientDemographics {
  constructor(
    readonly firstName: string,
    readonly lastName: string,
    readonly dateOfBirth: Date,
    readonly medicalRecordNumber: string,
    readonly facilityId: string
  ) {}

  equals(other: PatientDemographics): boolean {
    return (
      this.firstName === other.firstName &&
      this.lastName === other.lastName &&
      this.dateOfBirth.getTime() === other.dateOfBirth.getTime() &&
      this.medicalRecordNumber === other.medicalRecordNumber &&
      this.facilityId === other.facilityId
    );
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())
    ) {
      age--;
    }

    return age;
  }

  isMinor(): boolean {
    return this.getAge() < 18;
  }
}
