// apps/backend/niv/src/app/pcc-test/pcc-test.controller.ts
import { Controller, Get, Logger } from '@nestjs/common';
import { PCCTestService } from './pcc-test.service';

@Controller('pcc-test')
export class PCCTestController {
  private readonly logger = new Logger(PCCTestController.name);

  constructor(private pccTestService: PCCTestService) {}

  @Get('certs')
  async testCertificates() {
    this.logger.log('Testing certificate loading...');
    return await this.pccTestService.testCertificates();
  }

  @Get('auth')
  async testAuth() {
    this.logger.log('Testing PCC OAuth authentication...');
    return await this.pccTestService.testPCCAuth();
  }

  @Get('api')
  async testAPI() {
    this.logger.log('Testing PCC API call...');
    return await this.pccTestService.testPCCAPI();
  }

  @Get('full')
  async testFull() {
    this.logger.log('Running full PCC integration test...');

    const results = {
      timestamp: new Date().toISOString(),
      certificates: await this.pccTestService.testCertificates(),
      authentication: null as any,
      api: null as any,
    };

    if (results.certificates.success) {
      results.authentication = await this.pccTestService.testPCCAuth();

      if (results.authentication.success) {
        results.api = await this.pccTestService.testPCCAPI();
      }
    }

    return results;
  }
}
