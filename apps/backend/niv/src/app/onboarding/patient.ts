// Domain data structure
export type Patient = {
  readonly patientId: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: Date | null;
  readonly facilityId: number;
};

// Factory function
export function createPatient(
  patientId: number,
  firstName: string,
  lastName: string,
  dateOfBirth: Date | null,
  facilityId: number
): Patient {
  return {
    patientId,
    firstName,
    lastName,
    dateOfBirth,
    facilityId,
  };
}

// Domain functions
export function getFullName(patient: Patient): string {
  return `${patient.firstName} ${patient.lastName}`;
}

export function getAge(patient: Patient): number | null {
  if (!patient.dateOfBirth) {
    return null;
  }

  const today = new Date();
  const birthDate = patient.dateOfBirth;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export function isAdult(patient: Patient): boolean {
  const age = getAge(patient);
  return age !== null && age >= 18;
}
