import { DynamicModule, Module, Type } from '@nestjs/common';
import { NIVOnboardingFactory } from '../domain/factories/niv-onboarding.factory';
import { ClinicalQualificationService } from '../domain/services/clinical-qualification.service';
import { OnboardingController } from '../presenters/http/onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    NIVOnboardingFactory,
    ClinicalQualificationService,
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
