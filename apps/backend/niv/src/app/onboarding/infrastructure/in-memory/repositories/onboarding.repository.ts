import { Injectable, Logger } from '@nestjs/common';
import { OnboardingRepository } from '../../../application/ports/onboarding.repository';
import {
  NivOnboarding,
  QualificationCriteria,
} from '../../../domain/niv-onboarding';
import { Patient } from '../../../domain/patient';
import { DiagnosisCodeQualificationEntity } from '../entities/diagnosis-code-qualification.entity';
import { NivOnboardingEntity } from '../entities/niv-onboarding.entity';
import { PatientEntity } from '../entities/patient.entity';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { MockPccPatientClinicalDataRepository } from './mock-pcc-patient-clinical-data.repository';

@Injectable()
export class InMemoryOnboardingRepository implements OnboardingRepository {
  private readonly logger = new Logger(InMemoryOnboardingRepository.name);
  private readonly onboardings = new Map<string, NivOnboardingEntity>();
  private readonly patients = new Map<string, PatientEntity>();
  private readonly qualificationCriteria: DiagnosisCodeQualificationEntity[] =
    [];

  constructor(private mockPccRepository: MockPccPatientClinicalDataRepository) {
    this.seedQualificationCriteria();
    this.seedBasicPatientData();
  }

  // ========== LOCAL WORKFLOW STATE METHODS ==========

  async findAll(): Promise<NivOnboarding[]> {
    const entities = Array.from(this.onboardings.values());
    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async findById(id: string): Promise<NivOnboarding | null> {
    const entity = this.onboardings.get(id);
    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByPatientId(patientId: string): Promise<NivOnboarding | null> {
    const entity = Array.from(this.onboardings.values()).find(
      (o) => o.patientId === patientId
    );
    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByFacilityId(facilityId: string): Promise<NivOnboarding[]> {
    const entities = Array.from(this.onboardings.values()).filter(
      (o) => o.facilityId === facilityId
    );
    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async save(onboarding: NivOnboarding): Promise<NivOnboarding> {
    const persistenceModel = OnboardingMapper.toPersistence(onboarding);
    this.onboardings.set(persistenceModel.id, persistenceModel);

    const newEntity = this.onboardings.get(persistenceModel.id)!;
    return OnboardingMapper.toDomain(newEntity);
  }

  // ========== PATIENT DATA METHODS (PCC INTEGRATION) ==========

  async findPatientById(patientId: string): Promise<Patient | null> {
    this.logger.log(`🔍 In-memory: Finding patient by ID: ${patientId}`);

    try {
      // Check local cache first
      const localPatient = this.patients.get(patientId);
      if (localPatient) {
        this.logger.log(`📋 Found cached patient: ${patientId}`);
        return OnboardingMapper.patientToDomain(localPatient);
      }

      // Get from mock PCC
      const pccPatient = await this.mockPccRepository.findPatientById(
        patientId
      );
      if (pccPatient) {
        // Cache locally
        this.cachePatientLocally(pccPatient);
        this.logger.log(`✅ Patient found via Mock PCC: ${patientId}`);
        return pccPatient;
      }

      this.logger.log(`❌ Patient not found: ${patientId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `❌ Error finding patient ${patientId}:`,
        error.message
      );
      throw error;
    }
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    this.logger.log(
      `🔍 In-memory: Finding patients for facility: ${facilityId}`
    );

    try {
      // Get cached patients for facility
      const localPatients = Array.from(this.patients.values())
        .filter((entity) => entity.facilityId === facilityId)
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
    const persistenceModel = OnboardingMapper.patientToPersistence(patient);
    this.patients.set(patient.id, persistenceModel);
    this.logger.log(`💾 Cached patient locally: ${patient.id}`);
  }

  private mergePatientData(
    localPatients: Patient[],
    pccPatients: Patient[]
  ): Patient[] {
    const patientMap = new Map<string, Patient>();

    // Add local patients first
    localPatients.forEach((patient) => {
      patientMap.set(patient.id, patient);
    });

    // Override/add with PCC data (PCC is source of truth for clinical data)
    pccPatients.forEach((patient) => {
      patientMap.set(patient.id, patient);
    });

    return Array.from(patientMap.values());
  }

  // ========== SEED DATA METHODS ==========

  private seedQualificationCriteria(): void {
    // COPD qualification codes
    const copdCodes = [
      {
        code: 'J44.0',
        description: 'COPD with acute lower respiratory infection',
      },
      { code: 'J44.1', description: 'COPD with acute exacerbation' },
      { code: 'J44.9', description: 'COPD, unspecified' },
      { code: 'J42', description: 'Unspecified chronic bronchitis' },
    ];

    // ARF qualification codes
    const arfCodes = [
      {
        code: 'J96.00',
        description:
          'Acute respiratory failure, unspecified whether with hypoxia or hypercapnia',
      },
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia' },
      {
        code: 'J96.02',
        description: 'Acute respiratory failure with hypercapnia',
      },
    ];

    // NMD qualification codes
    const nmdCodes = [
      { code: 'G12.21', description: 'Amyotrophic lateral sclerosis' },
      {
        code: 'G70.00',
        description: 'Myasthenia gravis without (acute) exacerbation',
      },
      { code: 'G71.0', description: 'Muscular dystrophy' },
    ];

    // Build qualification criteria
    [
      ...copdCodes.map((c) => ({ ...c, type: 'COPD' })),
      ...arfCodes.map((c) => ({ ...c, type: 'ARF' })),
      ...nmdCodes.map((c) => ({ ...c, type: 'NMD' })),
    ].forEach(({ code, description, type }) => {
      const entity = new DiagnosisCodeQualificationEntity();
      entity.icd10Code = code;
      entity.qualificationType = type as any;
      entity.isQualifying = true;
      entity.description = description;
      this.qualificationCriteria.push(entity);
    });

    this.logger.log(
      `📋 Seeded ${this.qualificationCriteria.length} qualification criteria`
    );
  }

  private seedBasicPatientData(): void {
    // Add some basic patient data for testing
    // This will be supplemented by mock PCC data
    this.logger.log(`💾 Basic patient data seeded for testing`);
  }
}
