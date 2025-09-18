import { Controller, Get, Query } from '@nestjs/common';
import {
  ClinicalQualificationsResponseDto,
  GetPatientsWithQualificationsResponseDto,
  OnboardingResponseDto,
  PatientResponseDto,
  PatientWithQualificationsResponseDto,
} from './dto/patients-with-qualifications-response.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('patients-with-qualifications')
  async getPatientsWithQualifications(
    @Query('facilityId') facilityId?: string
  ): Promise<GetPatientsWithQualificationsResponseDto> {
    const patientsWithQualifications =
      await this.onboardingService.getPatientsWithQualifications(facilityId);

    const patients = patientsWithQualifications.map(
      (item) =>
        ({
          patient: {
            id: item.patient.id,
            firstName: item.patient.demographics.firstName,
            lastName: item.patient.demographics.lastName,
            fullName: item.patient.demographics.getFullName(),
            dateOfBirth: item.patient.demographics.dateOfBirth
              .toISOString()
              .split('T')[0],
            age: item.patient.demographics.getAge(),
            medicalRecordNumber: item.patient.demographics.medicalRecordNumber,
            facilityId: item.patient.demographics.facilityId,
          } as PatientResponseDto,
          onboarding: item.onboarding
            ? ({
                id: item.onboarding.id,
                status: item.onboarding.status,
                assignedSpecialistId: item.onboarding.assignedSpecialistId,
                createdAt: item.onboarding.createdAt.toISOString(),
                updatedAt: item.onboarding.updatedAt.toISOString(),
              } as OnboardingResponseDto)
            : null,
          qualifications: {
            copd: item.onboarding?.getQualificationsObject().copd || false,
            arf: item.onboarding?.getQualificationsObject().arf || false,
            nmd: item.onboarding?.getQualificationsObject().nmd || false,
            trd: item.onboarding?.getQualificationsObject().trd || false,
            hasAnyQualification: item.hasQualifications,
            qualificationTypes: item.qualificationTypes,
          } as ClinicalQualificationsResponseDto,
        } as PatientWithQualificationsResponseDto)
    );

    return {
      patients,
      totalCount: patients.length,
      facilityId: facilityId || null,
    };
  }

  @Get()
  async findAllOnboardings() {
    return this.onboardingService.findAllOnboardings();
  }
}
