// onboarding/infrastructure/pcc/pcc-integration.module.ts
import { Module } from '@nestjs/common';
import { PCCIntegrationModule as SharedPCCIntegrationModule } from '../../../shared/infrastructure/pcc/pcc-integration.module';
import { PCCPatientClinicalDataRepository } from './repositories/pcc-patient-clinical-data.repository';

@Module({
  imports: [SharedPCCIntegrationModule],
  providers: [PCCPatientClinicalDataRepository],
  exports: [PCCPatientClinicalDataRepository],
})
export class PCCIntegrationModule {}
