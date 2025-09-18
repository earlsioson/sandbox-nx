// onboarding/infrastructure/in-memory/repositories/mock-pcc-patient-clinical-data.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Patient } from '../../../domain/patient';
import { DiagnosisCode } from '../../../domain/value-objects/diagnosis-code';
import { PatientDemographics } from '../../../domain/value-objects/patient-demographics';

@Injectable()
export class MockPccPatientClinicalDataRepository {
  private readonly logger = new Logger(
    MockPccPatientClinicalDataRepository.name
  );

  // Mock PCC patient data for testing
  private readonly mockPatients = new Map<string, Patient>();

  constructor() {
    this.seedMockPatients();
  }

  async findPatientById(patientId: string): Promise<Patient | null> {
    this.logger.log(`🧪 Mock PCC: Fetching patient ${patientId}`);

    // Simulate network delay
    await this.simulateDelay(200);

    const patient = this.mockPatients.get(patientId);
    if (patient) {
      this.logger.log(`✅ Mock PCC: Found patient ${patientId}`);
      return patient;
    }

    this.logger.log(`❌ Mock PCC: Patient ${patientId} not found`);
    return null;
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    this.logger.log(
      `🧪 Mock PCC: Fetching patients for facility ${facilityId}`
    );

    // Simulate network delay
    await this.simulateDelay(500);

    const patients = Array.from(this.mockPatients.values()).filter(
      (patient) => patient.demographics.facilityId === facilityId
    );

    this.logger.log(
      `✅ Mock PCC: Found ${patients.length} patients for facility ${facilityId}`
    );
    return patients;
  }

  async refreshPatientClinicalData(patientId: string): Promise<Patient> {
    this.logger.log(`🧪 Mock PCC: Refreshing patient data for ${patientId}`);

    // Simulate network delay
    await this.simulateDelay(300);

    const patient = await this.findPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found in mock PCC`);
    }

    this.logger.log(`✅ Mock PCC: Refreshed patient data for ${patientId}`);
    return patient;
  }

  async testConnection(): Promise<boolean> {
    this.logger.log('🧪 Mock PCC: Testing connection...');
    await this.simulateDelay(100);
    this.logger.log('✅ Mock PCC: Connection test successful');
    return true;
  }

  private seedMockPatients(): void {
    // Mock patient with COPD
    const copdPatient = new Patient(
      'mock-patient-1',
      new PatientDemographics(
        'John',
        'Smith',
        new Date('1945-03-15'),
        'MR-001',
        'facility-1'
      ),
      [
        new DiagnosisCode('J44.1', 'ICD-10-CM', 'COPD with acute exacerbation'),
        new DiagnosisCode(
          'J44.0',
          'ICD-10-CM',
          'COPD with acute lower respiratory infection'
        ),
      ]
    );

    // Mock patient with ARF and NMD
    const multiPatient = new Patient(
      'mock-patient-2',
      new PatientDemographics(
        'Mary',
        'Johnson',
        new Date('1960-07-22'),
        'MR-002',
        'facility-1'
      ),
      [
        new DiagnosisCode(
          'J96.01',
          'ICD-10-CM',
          'Acute respiratory failure with hypoxia'
        ),
        new DiagnosisCode(
          'G12.21',
          'ICD-10-CM',
          'Amyotrophic lateral sclerosis'
        ),
        new DiagnosisCode(
          'G70.00',
          'ICD-10-CM',
          'Myasthenia gravis without (acute) exacerbation'
        ),
      ]
    );

    // Mock patient with no qualifying conditions
    const nonQualifyingPatient = new Patient(
      'mock-patient-3',
      new PatientDemographics(
        'Robert',
        'Wilson',
        new Date('1970-11-08'),
        'MR-003',
        'facility-1'
      ),
      [
        new DiagnosisCode('I10', 'ICD-10-CM', 'Essential hypertension'),
        new DiagnosisCode(
          'E11.9',
          'ICD-10-CM',
          'Type 2 diabetes mellitus without complications'
        ),
      ]
    );

    // Mock patient for different facility
    const facilityTwoPatient = new Patient(
      'mock-patient-4',
      new PatientDemographics(
        'Sarah',
        'Davis',
        new Date('1955-12-03'),
        'MR-004',
        'facility-2'
      ),
      [
        new DiagnosisCode(
          'J96.11',
          'ICD-10-CM',
          'Chronic respiratory failure with hypoxia'
        ),
        new DiagnosisCode('G71.0', 'ICD-10-CM', 'Muscular dystrophy'),
      ]
    );

    this.mockPatients.set('mock-patient-1', copdPatient);
    this.mockPatients.set('mock-patient-2', multiPatient);
    this.mockPatients.set('mock-patient-3', nonQualifyingPatient);
    this.mockPatients.set('mock-patient-4', facilityTwoPatient);

    this.logger.log(
      `🧪 Mock PCC: Seeded ${this.mockPatients.size} mock patients`
    );
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
