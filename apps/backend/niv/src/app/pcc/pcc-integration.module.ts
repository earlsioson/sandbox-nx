// shared/infrastructure/pcc/pcc-integration.module.ts
import { Module } from '@nestjs/common';
import { PccAPIClient } from './pcc-api.client';
import { PccAuthService } from './pcc-auth.service';
import { PccConfigService } from './pcc-config.service';

@Module({
  providers: [PccConfigService, PccAuthService, PccAPIClient],
  exports: [PccAPIClient, PccAuthService, PccConfigService],
})
export class PccIntegrationModule {}
