import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { PccPatientClinicalDataRepository } from '../pcc/repositories/pcc-patient-clinical-data.repository';

@Injectable()
export class OrmOnboardingRepository implements OnboardingRepository {
  private readonly logger = new Logger(OrmOnboardingRepository.name);

  constructor(
    @InjectRepository(NivOnboardingEntity)
    private readonly onboardingEntityRepository: Repository<NivOnboardingEntity>,
    @InjectRepository(PatientEntity)
    private readonly patientEntityRepository: Repository<PatientEntity>,
    @InjectRepository(DiagnosisCodeQualificationEntity)
    private readonly qualificationCriteriaRepository: Repository<DiagnosisCodeQualificationEntity>,
    private readonly pccPatientRepository: PccPatientClinicalDataRepository
  ) {}

  // ========== LOCAL WORKFLOW STATE METHODS ==========

  async findAll(): Promise<NivOnboarding[]> {
    this.logger.log('🔍 ORM: Finding all onboardings');

    const entities = await this.onboardingEntityRepository.find();
    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async findById(id: string): Promise<NivOnboarding | null> {
    this.logger.log(`🔍 ORM: Finding onboarding by ID: ${id}`);

    const entity = await this.onboardingEntityRepository.findOne({
      where: { id },
    });

    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByPatientId(patientId: string): Promise<NivOnboarding | null> {
    this.logger.log(`🔍 ORM: Finding onboarding by patient ID: ${patientId}`);

    const entity = await this.onboardingEntityRepository.findOne({
      where: { patientId },
    });

    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByFacilityId(facilityId: string): Promise<NivOnboarding[]> {
    this.logger.log(
      `🔍 ORM: Finding onboardings by facility ID: ${facilityId}`
    );

    const entities = await this.onboardingEntityRepository.find({
      where: { facilityId },
    });

    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async save(onboarding: NivOnboarding): Promise<NivOnboarding> {
    this.logger.log(`💾 ORM: Saving onboarding: ${onboarding.id}`);

    const persistenceModel = OnboardingMapper.toPersistence(onboarding);
    const savedEntity = await this.onboardingEntityRepository.save(
      persistenceModel
    );

    this.logger.log(`✅ ORM: Onboarding saved: ${savedEntity.id}`);
    return OnboardingMapper.toDomain(savedEntity);
  }

  // ========== PATIENT DATA METHODS (PCC INTEGRATION) ==========

  async findPatientById(patientId: string): Promise<Patient | null> {
    this.logger.log(`🔍 ORM: Finding patient by ID: ${patientId}`);

    try {
      // Check local cache first
      const cachedPatient = await this.patientEntityRepository.findOne({
        where: { id: patientId },
      });

      if (cachedPatient) {
        this.logger.log(`📋 Found cached patient: ${patientId}`);

        // Check if cache is fresh (e.g., less than 1 hour old)
        const cacheAge = Date.now() - cachedPatient.updatedAt.getTime();
        const cacheMaxAge = 60 * 60 * 1000; // 1 hour in milliseconds

        if (cacheAge < cacheMaxAge) {
          return OnboardingMapper.patientToDomain(cachedPatient);
        } else {
          this.logger.log(
            `🔄 Cache expired for patient ${patientId}, refreshing from PCC`
          );
        }
      }

      // Get fresh data from PCC
      const pccPatient = await this.pccPatientRepository.findPatientById(
        patientId
      );
      if (pccPatient) {
        // Update local cache
        await this.cachePatientLocally(pccPatient);
        this.logger.log(`✅ Patient found via PCC: ${patientId}`);
        return pccPatient;
      }

      this.logger.log(`❌ Patient not found: ${patientId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `❌ Error finding patient ${patientId}:`,
        error.message
      );

      // Fallback to cached data if PCC fails
      const cachedPatient = await this.patientEntityRepository.findOne({
        where: { id: patientId },
      });

      if (cachedPatient) {
        this.logger.warn(
          `⚠️ PCC failed, using cached data for patient ${patientId}`
        );
        return OnboardingMapper.patientToDomain(cachedPatient);
      }

      throw error;
    }
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    this.logger.log(`🔍 ORM: Finding patients for facility: ${facilityId}`);

    try {
      // Get cached patients for facility
      const cachedPatients = await this.patientEntityRepository.find({
        where: { facilityId },
      });

      const localPatients = cachedPatients.map((entity) =>
        OnboardingMapper.patientToDomain(entity)
      );

      // Get fresh data from PCC
      let pccPatients: Patient[] = [];
      try {
        pccPatients = await this.pccPatientRepository.findPatientsByFacility(
          facilityId
        );

        // Cache PCC patients locally
        for (const patient of pccPatients) {
          await this.cachePatientLocally(patient);
        }
      } catch (error) {
        this.logger.warn(
          `⚠️ PCC failed for facility ${facilityId}, using cached data:`,
          error.message
        );
      }

      // Merge and deduplicate (PCC data takes precedence)
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
      `🔄 ORM: Refreshing clinical data for patient ${patientId}`
    );

    try {
      const refreshedPatient =
        await this.pccPatientRepository.refreshPatientClinicalData(patientId);

      // Update local cache
      await this.cachePatientLocally(refreshedPatient);

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
    this.logger.log('🔍 ORM: Getting qualification criteria');

    const entities = await this.qualificationCriteriaRepository.find();
    return entities.map((entity) =>
      OnboardingMapper.qualificationCriteriaToDomain(entity)
    );
  }

  // ========== PRIVATE HELPER METHODS ==========

  private async cachePatientLocally(patient: Patient): Promise<void> {
    try {
      const persistenceModel = OnboardingMapper.patientToPersistence(patient);

      // Upsert: Insert or update if exists
      await this.patientEntityRepository.save(persistenceModel);

      this.logger.log(`💾 Cached patient locally: ${patient.id}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to cache patient ${patient.id}:`,
        error.message
      );
      // Don't throw - caching failure shouldn't break the flow
    }
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
}
