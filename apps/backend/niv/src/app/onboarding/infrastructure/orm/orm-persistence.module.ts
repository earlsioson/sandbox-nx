// onboarding/infrastructure/orm/orm-persistence.module.ts (Updated)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingRepository } from '../../application/ports/onboarding.repository';
import { PccIntegrationModule } from '../pcc/pcc-integration.module';
import { DiagnosisCodeQualificationEntity } from './entities/diagnosis-code-qualification.entity';
import { NivOnboardingEntity } from './entities/niv-onboarding.entity';
import { PatientEntity } from './entities/patient.entity';
import { OrmOnboardingRepository } from './repositories/onboarding.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NivOnboardingEntity,
      PatientEntity,
      DiagnosisCodeQualificationEntity,
    ]),
    PccIntegrationModule, // Import PCC integration
  ],
  providers: [
    {
      provide: OnboardingRepository,
      useClass: OrmOnboardingRepository,
    },
  ],
  exports: [OnboardingRepository],
})
export class OrmPersistenceModule {}
