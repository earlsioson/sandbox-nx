import { Controller, Get, Inject, Param } from '@nestjs/common';
import {
  getPatientQualifications,
  PatientWithQualifications,
} from './get-patient-qualifications';
import type { PatientRepository } from './patient-repository';

@Controller('onboarding/patients')
export class PatientQualificationsController {
  constructor(
    @Inject('PatientRepository')
    private readonly patientRepository: PatientRepository
  ) {}

  /**
   * Get patient with their NIV clinical qualifications
   *
   * @param patientId PCC patient identifier
   * @returns Patient data with COPD/ARF/NMD/TRD qualification flags
   */
  @Get(':patientId/qualifications')
  async getPatientQualifications(
    @Param('patientId') patientId: string
  ): Promise<PatientWithQualifications> {
    return getPatientQualifications(patientId, this.patientRepository);
  }
}
