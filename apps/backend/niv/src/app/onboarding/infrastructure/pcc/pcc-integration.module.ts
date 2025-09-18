// onboarding/infrastructure/pcc/pcc-integration.module.ts
import { Module } from '@nestjs/common';
import { PccIntegrationModule as SharedPccIntegrationModule } from '../../../shared/infrastructure/pcc/pcc-integration.module';
import { PccPatientClinicalDataRepository } from './repositories/pcc-patient-clinical-data.repository';

@Module({
  imports: [SharedPccIntegrationModule],
  providers: [PccPatientClinicalDataRepository],
  exports: [PccPatientClinicalDataRepository],
})
export class PccIntegrationModule {}
