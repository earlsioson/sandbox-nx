// apps/backend/niv/src/app/onboarding/infrastructure/orm/repositories/onboarding.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExceptionTranslator } from '../../../../shared/application/services/exception-translator.service';
import { OnboardingRepository } from '../../../application/ports/onboarding.repository';
import {
  NivOnboarding,
  QualificationCriteria,
} from '../../../domain/niv-onboarding';
import { Patient } from '../../../domain/patient';
import { PccPatientClinicalDataRepository } from '../../pcc/repositories/pcc-patient-clinical-data.repository';
import { DiagnosisCodeQualificationEntity } from '../entities/diagnosis-code-qualification.entity';
import { NivOnboardingEntity } from '../entities/niv-onboarding.entity';
import { PatientEntity } from '../entities/patient.entity';
import { OnboardingMapper } from '../mappers/onboarding.mapper';

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

    try {
      const entities = await this.onboardingEntityRepository.find();
      return entities.map((entity) => OnboardingMapper.toDomain(entity));
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error finding all onboardings: ${errorMessage}`,
        errorStack
      );
      throw new Error(`Failed to find onboardings: ${errorMessage}`);
    }
  }

  async findById(id: string): Promise<NivOnboarding | null> {
    this.logger.log(`🔍 ORM: Finding onboarding by ID: ${id}`);

    try {
      const entity = await this.onboardingEntityRepository.findOne({
        where: { id },
      });

      return entity ? OnboardingMapper.toDomain(entity) : null;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error finding onboarding ${id}: ${errorMessage}`,
        errorStack
      );
      throw new Error(`Failed to find onboarding ${id}: ${errorMessage}`);
    }
  }

  async findByPatientId(patientId: string): Promise<NivOnboarding | null> {
    this.logger.log(`🔍 ORM: Finding onboarding by patient ID: ${patientId}`);

    try {
      const entity = await this.onboardingEntityRepository.findOne({
        where: { patientId },
      });

      return entity ? OnboardingMapper.toDomain(entity) : null;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error finding onboarding by patient ${patientId}: ${errorMessage}`,
        errorStack
      );
      throw new Error(
        `Failed to find onboarding for patient ${patientId}: ${errorMessage}`
      );
    }
  }

  async findByFacilityId(facilityId: string): Promise<NivOnboarding[]> {
    this.logger.log(
      `🔍 ORM: Finding onboardings by facility ID: ${facilityId}`
    );

    try {
      const entities = await this.onboardingEntityRepository.find({
        where: { facilityId },
      });

      return entities.map((entity) => OnboardingMapper.toDomain(entity));
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error finding onboardings by facility ${facilityId}: ${errorMessage}`,
        errorStack
      );
      throw new Error(
        `Failed to find onboardings for facility ${facilityId}: ${errorMessage}`
      );
    }
  }

  async save(onboarding: NivOnboarding): Promise<NivOnboarding> {
    this.logger.log(`💾 ORM: Saving onboarding: ${onboarding.id}`);

    try {
      const persistenceModel = OnboardingMapper.toPersistence(onboarding);
      const savedEntity = await this.onboardingEntityRepository.save(
        persistenceModel
      );

      this.logger.log(`✅ ORM: Onboarding saved: ${savedEntity.id}`);
      return OnboardingMapper.toDomain(savedEntity);
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error saving onboarding ${onboarding.id}: ${errorMessage}`,
        errorStack
      );
      throw new Error(
        `Failed to save onboarding ${onboarding.id}: ${errorMessage}`
      );
    }
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
        }

        this.logger.log(`🔄 Cache expired, refreshing from PCC: ${patientId}`);
      }

      // Get fresh data from PCC
      try {
        const pccPatient = await this.pccPatientRepository.findPatientById(
          patientId
        );

        // Cache the updated patient data
        await this.cachePatientLocally(pccPatient);

        this.logger.log(`📋 Found patient from PCC: ${patientId}`);
        return pccPatient;
      } catch (error) {
        const errorMessage = ExceptionTranslator.getMessage(error);

        if (cachedPatient) {
          this.logger.warn(
            `⚠️ PCC failed but using cached data for patient ${patientId}: ${errorMessage}`
          );
          return OnboardingMapper.patientToDomain(cachedPatient);
        }

        this.logger.warn(
          `⚠️ PCC lookup failed for patient ${patientId}: ${errorMessage}`
        );
        return null;
      }
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error finding patient ${patientId}: ${errorMessage}`,
        errorStack
      );
      throw new Error(`Failed to find patient ${patientId}: ${errorMessage}`);
    }
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    this.logger.log(`🔍 ORM: Finding patients by facility: ${facilityId}`);

    try {
      // Get local cached patients
      let localPatients: Patient[] = [];
      try {
        const cachedEntities = await this.patientEntityRepository.find({
          where: { facilityId },
        });
        localPatients = cachedEntities.map((entity) =>
          OnboardingMapper.patientToDomain(entity)
        );
      } catch (error) {
        const errorMessage = ExceptionTranslator.getMessage(error);
        this.logger.warn(
          `⚠️ Local patient cache lookup failed for facility ${facilityId}: ${errorMessage}`
        );
      }

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
        const errorMessage = ExceptionTranslator.getMessage(error);
        this.logger.warn(
          `⚠️ PCC failed for facility ${facilityId}, using cached data: ${errorMessage}`
        );
      }

      // Merge and deduplicate (PCC data takes precedence)
      const allPatients = this.mergePatientData(localPatients, pccPatients);

      this.logger.log(
        `✅ Found ${allPatients.length} patients for facility: ${facilityId}`
      );
      return allPatients;
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error finding patients for facility ${facilityId}: ${errorMessage}`,
        errorStack
      );
      throw new Error(
        `Failed to find patients for facility ${facilityId}: ${errorMessage}`
      );
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
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Failed to refresh patient data ${patientId}: ${errorMessage}`,
        errorStack
      );
      throw new Error(
        `Failed to refresh patient clinical data for ${patientId}: ${errorMessage}`
      );
    }
  }

  // ========== QUALIFICATION CRITERIA (REFERENCE DATA) ==========

  async getQualificationCriteria(): Promise<QualificationCriteria[]> {
    this.logger.log('🔍 ORM: Getting qualification criteria');

    try {
      const entities = await this.qualificationCriteriaRepository.find();
      return entities.map((entity) =>
        OnboardingMapper.qualificationCriteriaToDomain(entity)
      );
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      const errorStack = ExceptionTranslator.getStack(error);

      this.logger.error(
        `❌ Error getting qualification criteria: ${errorMessage}`,
        errorStack
      );
      throw new Error(`Failed to get qualification criteria: ${errorMessage}`);
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private async cachePatientLocally(patient: Patient): Promise<void> {
    try {
      const persistenceModel = OnboardingMapper.patientToPersistence(patient);
      persistenceModel.updatedAt = new Date(); // Update cache timestamp

      await this.patientEntityRepository.save(persistenceModel);
      this.logger.log(`💾 Patient cached locally: ${patient.id}`);
    } catch (error) {
      const errorMessage = ExceptionTranslator.getMessage(error);
      this.logger.warn(
        `⚠️ Failed to cache patient locally ${patient.id}: ${errorMessage}`
      );
    }
  }

  private mergePatientData(
    localPatients: Patient[],
    pccPatients: Patient[]
  ): Patient[] {
    const patientMap = new Map<string, Patient>();

    // Add local patients first
    localPatients.forEach((patient) => patientMap.set(patient.id, patient));

    // PCC data takes precedence (newer/more accurate)
    pccPatients.forEach((patient) => patientMap.set(patient.id, patient));

    return Array.from(patientMap.values());
  }
}
