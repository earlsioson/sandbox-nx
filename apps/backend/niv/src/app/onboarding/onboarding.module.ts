// apps/backend/niv/src/app/onboarding/onboarding.module.ts

/**
 * NestJS Module (Hexagonal Architecture)
 * Application Module (DDD)
 *
 * Configures the onboarding bounded context for dependency injection.
 *
 * Architecture Notes:
 * - OnboardingController: Primary Adapter (HTTP → Domain)
 * - OnboardingService: Thin NestJS Adapter (Framework → Domain)
 * - Domain logic is in qualifications.ts (framework-agnostic)
 * - EHR adapters are created functionally within the service
 *
 * Following functional DDD pattern - services create their own dependencies
 * using factory functions rather than complex DI configuration.
 */

import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
