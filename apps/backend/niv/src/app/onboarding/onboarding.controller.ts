import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('test/connection')
  async testConnection() {
    this.logger.log('Testing PCC connection endpoint called');
    return await this.onboardingService.testPccConnection();
  }

  @Get('test/mock')
  async testMock() {
    this.logger.log('Testing mock data endpoint called');
    return await this.onboardingService.testMockData();
  }

  @Get('patient/:patientId')
  async getPatientQualifications(
    @Param('patientId') patientId: string,
    @Query('orgUuid') orgUuid: string
  ) {
    if (!orgUuid) {
      return {
        success: false,
        error: 'orgUuid query parameter is required',
      };
    }

    this.logger.log(`Getting patient qualifications: ${patientId}`);
    return await this.onboardingService.getPatientWithQualifications(
      orgUuid,
      parseInt(patientId, 10)
    );
  }
}
