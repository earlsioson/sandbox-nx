// apps/backend/niv/src/app/onboarding/application/onboarding.module.ts
import { DynamicModule, Module, Type } from '@nestjs/common';
import { NivOnboardingFactory } from '../domain/factories/niv-onboarding.factory'; // Fixed: was NIVOnboardingFactory
import { OnboardingController } from './onboarding.controller'; // Fixed path
import { OnboardingService } from './onboarding.service';

@Module({
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    NivOnboardingFactory, // Fixed: was NIVOnboardingFactory
    // Removed: ClinicalQualificationService
  ],
})
export class OnboardingModule {
  static withInfrastructure(infrastructureModule: Type | DynamicModule) {
    return {
      module: OnboardingModule,
      imports: [infrastructureModule],
    };
  }
}
