import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingRepository } from '../../../application/ports/onboarding.repository';
import { NIVOnboarding } from '../../../domain/niv-onboarding';
import { Patient } from '../../../domain/patient';
import { QualificationCriteria } from '../../../domain/services/clinical-qualification.service';
import { DiagnosisCodeQualificationEntity } from '../entities/diagnosis-code-qualification.entity';
import { NIVOnboardingEntity } from '../entities/niv-onboarding.entity';
import { PatientEntity } from '../entities/patient.entity';
import { OnboardingMapper } from '../mappers/onboarding.mapper';

@Injectable()
export class OrmOnboardingRepository implements OnboardingRepository {
  constructor(
    @InjectRepository(NIVOnboardingEntity)
    private readonly onboardingRepository: Repository<NIVOnboardingEntity>,
    @InjectRepository(PatientEntity)
    private readonly patientRepository: Repository<PatientEntity>,
    @InjectRepository(DiagnosisCodeQualificationEntity)
    private readonly qualificationCriteriaRepository: Repository<DiagnosisCodeQualificationEntity>
  ) {}

  async findAll(): Promise<NIVOnboarding[]> {
    const entities = await this.onboardingRepository.find();
    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async findById(id: string): Promise<NIVOnboarding | null> {
    const entity = await this.onboardingRepository.findOne({ where: { id } });
    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByPatientId(patientId: string): Promise<NIVOnboarding | null> {
    const entity = await this.onboardingRepository.findOne({
      where: { patientId },
    });
    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByFacilityId(facilityId: string): Promise<NIVOnboarding[]> {
    const entities = await this.onboardingRepository.find({
      where: { facilityId },
    });
    return entities.map((entity) => OnboardingMapper.toDomain(entity));
  }

  async save(onboarding: NIVOnboarding): Promise<NIVOnboarding> {
    const persistenceModel = OnboardingMapper.toPersistence(onboarding);
    const newEntity = await this.onboardingRepository.save(persistenceModel);
    return OnboardingMapper.toDomain(newEntity);
  }

  // Patient methods (could integrate with PCC API in real implementation)
  async findPatientById(patientId: string): Promise<Patient | null> {
    const entity = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    return entity ? OnboardingMapper.patientToDomain(entity) : null;
  }

  async findPatientsByFacility(facilityId: string): Promise<Patient[]> {
    const entities = await this.patientRepository.find({
      where: { facilityId },
    });
    return entities.map((entity) => OnboardingMapper.patientToDomain(entity));
  }

  async refreshPatientClinicalData(patientId: string): Promise<Patient> {
    // In real implementation, this would call PCC API to refresh patient data
    // For now, just return existing patient or throw error if not found
    const patient = await this.findPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }
    return patient;
  }

  // Qualification criteria methods
  async getQualificationCriteria(): Promise<QualificationCriteria[]> {
    const entities = await this.qualificationCriteriaRepository.find();
    return entities.map((entity) =>
      OnboardingMapper.qualificationCriteriaToDomain(entity)
    );
  }
}
