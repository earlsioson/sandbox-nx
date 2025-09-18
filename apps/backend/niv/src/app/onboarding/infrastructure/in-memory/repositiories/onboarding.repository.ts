// onboarding/infrastructure/in-memory/repositories/onboarding.repository.ts (Updated)
import { Injectable, Logger } from '@nestjs/common';
import { OnboardingRepository } from '../../../application/ports/onboarding.repository';
import { NIVOnboarding } from '../../../domain/niv-onboarding';
import { Patient } from '../../../domain/patient';
import { QualificationCriteria } from '../../../domain/services/clinical-qualification.service';
import { DiagnosisCodeQualificationEntity } from '../entities/diagnosis-code-qualification.entity';
import { NIVOnboardingEntity } from '../entities/niv-onboarding.entity';
import { PatientEntity } from '../entities/patient.entity';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { MockPCCPatientClinicalDataRepository } from './mock-pcc-patient-clinical-data.repository';

@Injectable()
export class InMemoryOnboardingRepository implements OnboardingRepository {
  private readonly logger = new Logger(InMemoryOnboardingRepository.name);
  private readonly onboardings = new Map<string, NIVOnboardingEntity>();
  private readonly patients = new Map<string, PatientEntity>();
  private readonly qualificationCriteria: DiagnosisCodeQualificationEntity[] =
    [];

  constructor(private mockPccRepository: MockPCCPatientClinicalDataRepository) {
    this.seedQualificationCriteria();
    this.seedBasicPatientData();
  }

  // ========== LOCAL WORKFLOW STATE METHODS ==========

  async findAll(): Promise<NIVOnboarding[]> {
    const entities = Array.from(this.onboardings.values());
    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async findById(id: string): Promise<NIVOnboarding | null> {
    const entity = this.onboardings.get(id);
    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByPatientId(patientId: string): Promise<NIVOnboarding | null> {
    const entity = Array.from(this.onboardings.values()).find(
      (o) => o.patientId === patientId
    );
    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByFacilityId(facilityId: string): Promise<NIVOnboarding[]> {
    const entities = Array.from(this.onboardings.values()).filter(
      (o) => o.facilityId === facilityId
    );
    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async save(onboarding: NIVOnboarding): Promise<NIVOnboarding> {
    const persistenceModel = OnboardingMapper.toPersistence(onboarding);
    this.onboardings.set(persistenceModel.id, persistenceModel);

    const newEntity = this.onboardings.get(persistenceModel.id)!;
    return OnboardingMapper.toDomain(newEntity);
  }

  // ========== PATIENT CLINICAL DATA METHODS (MOCK PCC INTEGRATION) ==========

  async findPatientById(patientId: string): Promise<Patient | null> {
    try {
      this.logger.log(`🔍 In-memory: Looking up patient ${patientId}`);

      // First check local cache
      const localPatient = this.patients.get(patientId);
      if (localPatient) {
        this.logger.log(`📋 Found patient in local cache: ${patientId}`);
        return OnboardingMapper.patientToDomain(localPatient);
      }

      // Fetch from mock PCC
      this.logger.log(`🧪 Fetching from mock PCC: ${patientId}`);
      const pccPatient = await this.mockPccRepository.findPatientById(
        patientId
      );

      if (pccPatient) {
        // Cache locally
        this.cachePatientLocally(pccPatient);
        this.logger.log(
          `✅ Patient fetched from mock PCC and cached: ${patientId}`
        );
        return pccPatient;
      }

      this.logger.log(`❌ Patient not found: ${patientId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `❌ Error finding patient ${patientId}:`,
        error.message
      );

      // Fallback to local cache
      const localPatient = this.patients.get(patientId);
      if (localPatient) {
        this.logger.log(
          `⚠️ Mock PCC failed, returning cached patient: ${patientId}`
        );
        return OnboardingMapper.patientToDomain(localPatient);
      }

      throw error;
    }
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    try {
      this.logger.log(
        `🔍 In-memory: Looking up patients for facility ${facilityId}`
      );

      // Get from local cache
      const localPatients = Array.from(this.patients.values())
        .filter((p) => p.facilityId === facilityId)
        .map((entity) => OnboardingMapper.patientToDomain(entity));

      // Get from mock PCC
      let pccPatients: Patient[] = [];
      try {
        pccPatients = await this.mockPccRepository.findPatientsByFacility(
          facilityId
        );

        // Cache PCC patients locally
        pccPatients.forEach((patient) => this.cachePatientLocally(patient));
      } catch (error) {
        this.logger.warn(
          `⚠️ Mock PCC failed for facility ${facilityId}, using cached data:`,
          error.message
        );
      }

      // Merge and deduplicate
      const allPatients = this.mergePatientData(localPatients, pccPatients);

      this.logger.log(
        `✅ Found ${allPatients.length} patients for facility: ${facilityId}`
      );
      return allPatients;
    } catch (error) {
      this.logger.error(
        `❌ Error finding patients for facility ${facilityId}:`,
        error.message
      );
      throw error;
    }
  }

  async refreshPatientClinicalData(patientId: string): Promise<Patient> {
    this.logger.log(
      `🔄 In-memory: Refreshing clinical data for patient ${patientId}`
    );

    try {
      const refreshedPatient =
        await this.mockPccRepository.refreshPatientClinicalData(patientId);

      // Update local cache
      this.cachePatientLocally(refreshedPatient);

      this.logger.log(`✅ Patient clinical data refreshed: ${patientId}`);
      return refreshedPatient;
    } catch (error) {
      this.logger.error(
        `❌ Failed to refresh patient data ${patientId}:`,
        error.message
      );
      throw new Error(
        `Failed to refresh patient clinical data: ${error.message}`
      );
    }
  }

  // ========== QUALIFICATION CRITERIA METHODS ==========

  async getQualificationCriteria(): Promise<QualificationCriteria[]> {
    return this.qualificationCriteria.map((entity) =>
      OnboardingMapper.qualificationCriteriaToDomain(entity)
    );
  }

  // ========== PRIVATE HELPER METHODS ==========

  private cachePatientLocally(patient: Patient): void {
    const patientEntity = OnboardingMapper.patientToPersistence(patient);
    this.patients.set(patient.id, patientEntity);
    this.logger.log(`💾 Patient cached locally: ${patient.id}`);
  }

  private mergePatientData(
    localPatients: Patient[],
    pccPatients: Patient[]
  ): Patient[] {
    const patientMap = new Map<string, Patient>();

    // Add local patients first
    localPatients.forEach((patient) => {
      patientMap.set(patient.demographics.medicalRecordNumber, patient);
    });

    // Overlay with PCC data (fresher data takes priority)
    pccPatients.forEach((patient) => {
      patientMap.set(patient.demographics.medicalRecordNumber, patient);
    });

    return Array.from(patientMap.values());
  }

  private seedQualificationCriteria(): void {
    // Same qualification criteria as before
    const criteria = [
      {
        id: 1,
        icd10Code: 'J44.0',
        qualificationType: 'COPD' as const,
        isQualifying: true,
        description: 'COPD with acute lower respiratory infection',
        notes: null,
      },
      {
        id: 2,
        icd10Code: 'J44.1',
        qualificationType: 'COPD' as const,
        isQualifying: true,
        description: 'COPD with acute exacerbation',
        notes: null,
      },
      {
        id: 3,
        icd10Code: 'J96.01',
        qualificationType: 'ARF' as const,
        isQualifying: true,
        description: 'Acute respiratory failure with hypoxia',
        notes: null,
      },
      {
        id: 4,
        icd10Code: 'J96.02',
        qualificationType: 'ARF' as const,
        isQualifying: true,
        description: 'Acute respiratory failure with hypercapnia',
        notes: null,
      },
      {
        id: 5,
        icd10Code: 'J96.11',
        qualificationType: 'ARF' as const,
        isQualifying: true,
        description: 'Chronic respiratory failure with hypoxia',
        notes: null,
      },
      {
        id: 6,
        icd10Code: 'G12.21',
        qualificationType: 'NMD' as const,
        isQualifying: true,
        description: 'Amyotrophic lateral sclerosis',
        notes: null,
      },
      {
        id: 7,
        icd10Code: 'G70.00',
        qualificationType: 'NMD' as const,
        isQualifying: true,
        description: 'Myasthenia gravis',
        notes: null,
      },
      {
        id: 8,
        icd10Code: 'G71.0',
        qualificationType: 'NMD' as const,
        isQualifying: true,
        description: 'Muscular dystrophy',
        notes: null,
      },
    ];

    criteria.forEach((c) => this.qualificationCriteria.push(c));
  }

  private seedBasicPatientData(): void {
    // Minimal patient data - detailed clinical data comes from mock PCC
    const basicPatients = [
      {
        id: 'mock-patient-1',
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: new Date('1945-03-15'),
        medicalRecordNumber: 'MR-001',
        facilityId: 'facility-1',
        pccPatientId: 'pcc-001',
        diagnosisCodes: '[]', // Will be populated from mock PCC
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'mock-patient-2',
        firstName: 'Mary',
        lastName: 'Johnson',
        dateOfBirth: new Date('1960-07-22'),
        medicalRecordNumber: 'MR-002',
        facilityId: 'facility-1',
        pccPatientId: 'pcc-002',
        diagnosisCodes: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    basicPatients.forEach((p) => this.patients.set(p.id, p));
  }
}
