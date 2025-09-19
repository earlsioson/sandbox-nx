import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPatientQualifications } from './get-patient-qualifications';
import { PatientData, PatientRepository } from './patient-repository';

describe('Patient Qualifications End-to-End', () => {
  let mockPatientRepository: PatientRepository;

  beforeEach(() => {
    mockPatientRepository = {
      findById: vi.fn(),
    };
  });

  it('should get patient with COPD and ARF qualifications', async () => {
    // Arrange: Mock patient with COPD and respiratory failure codes
    const mockPatient: PatientData = {
      patientId: '12345',
      facilityId: '67890',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '1960-05-15',
      medicalRecordNumber: 'MRN123456',
      diagnosisCodes: ['J44.1', 'J96.01'], // COPD + Acute respiratory failure
    };

    vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);

    // Act: Call use case function
    const result = await getPatientQualifications(
      '12345',
      mockPatientRepository
    );

    // Assert: Verify patient data and qualifications
    expect(result.patient).toEqual(mockPatient);
    expect(result.qualifications).toEqual({
      copd: true, // J44.1 qualifies for COPD
      arf: true, // J96.01 qualifies for ARF
      nmd: false, // No neuromuscular codes
      trd: false, // No thoracic restrictive codes
    });
  });

  it('should get patient with ALS (NMD) qualification', async () => {
    // Arrange: Mock patient with ALS
    const mockPatient: PatientData = {
      patientId: '54321',
      facilityId: '09876',
      firstName: 'Jane',
      lastName: 'Smith',
      birthDate: '1955-10-20',
      medicalRecordNumber: 'MRN654321',
      diagnosisCodes: ['G12.21'], // ALS
    };

    vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);

    // Act
    const result = await getPatientQualifications(
      '54321',
      mockPatientRepository
    );

    // Assert
    expect(result.qualifications).toEqual({
      copd: false,
      arf: false,
      nmd: true, // G12.21 qualifies for NMD
      trd: false,
    });
  });

  it('should get patient with thoracic restrictive disease', async () => {
    // Arrange: Mock patient with kyphosis
    const mockPatient: PatientData = {
      patientId: '11111',
      facilityId: '22222',
      firstName: 'Bob',
      lastName: 'Wilson',
      birthDate: '1970-03-10',
      medicalRecordNumber: 'MRN111111',
      diagnosisCodes: ['M40.204'], // Kyphosis, thoracic region
    };

    vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);

    // Act
    const result = await getPatientQualifications(
      '11111',
      mockPatientRepository
    );

    // Assert
    expect(result.qualifications).toEqual({
      copd: false,
      arf: false,
      nmd: false,
      trd: true, // M40.204 qualifies for TRD
    });
  });

  it('should get patient with no qualifications', async () => {
    // Arrange: Mock patient with non-qualifying diagnosis
    const mockPatient: PatientData = {
      patientId: '99999',
      facilityId: '88888',
      firstName: 'Alice',
      lastName: 'Johnson',
      birthDate: '1980-08-25',
      medicalRecordNumber: 'MRN999999',
      diagnosisCodes: ['Z51.11'], // Non-qualifying code
    };

    vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);

    // Act
    const result = await getPatientQualifications(
      '99999',
      mockPatientRepository
    );

    // Assert: No qualifications
    expect(result.qualifications).toEqual({
      copd: false,
      arf: false,
      nmd: false,
      trd: false,
    });
  });

  it('should handle repository errors', async () => {
    // Arrange: Mock repository error
    vi.mocked(mockPatientRepository.findById).mockRejectedValue(
      new Error('Patient not found or PCC API error')
    );

    // Act & Assert: Should propagate error
    await expect(
      getPatientQualifications('invalid', mockPatientRepository)
    ).rejects.toThrow('Patient not found or PCC API error');
  });
});
