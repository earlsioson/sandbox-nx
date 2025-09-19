import { Module } from '@nestjs/common';
import { PatientQualificationsController } from './patient-qualifications.controller';
import { PccPatientRepository } from './pcc-patient-repository';

// TODO: Import from shared infrastructure once available
// import { PccAPIClient } from '../shared/infrastructure/pcc/pcc-api.client';

@Module({
  controllers: [PatientQualificationsController],
  providers: [
    // Register PCC repository as the PatientRepository implementation
    {
      provide: 'PatientRepository',
      useClass: PccPatientRepository,
    },
    PccPatientRepository,
    // TODO: Add PccAPIClient provider when available
    // PccAPIClient,
  ],
  exports: [
    'PatientRepository', // Export for other modules if needed
  ],
})
export class OnboardingModule {}
