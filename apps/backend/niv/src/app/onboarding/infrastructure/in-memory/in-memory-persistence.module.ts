// onboarding/infrastructure/in-memory/in-memory-persistence.module.ts (Updated)
import { Module } from '@nestjs/common';
import { OnboardingRepository } from '../../application/ports/onboarding.repository';
import { MockPCCPatientClinicalDataRepository } from './repositories/mock-pcc-patient-clinical-data.repository';
import { InMemoryOnboardingRepository } from './repositories/onboarding.repository';

@Module({
  imports: [],
  providers: [
    MockPCCPatientClinicalDataRepository,
    {
      provide: OnboardingRepository,
      useClass: InMemoryOnboardingRepository,
    },
  ],
  exports: [OnboardingRepository],
})
export class InMemoryPersistenceModule {}
