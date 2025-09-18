// shared/infrastructure/pcc/pcc-integration.module.ts
import { Module } from '@nestjs/common';
import { PCCAPIClient } from './pcc-api.client';
import { PCCAuthService } from './pcc-auth.service';
import { PCCConfigService } from './pcc-config.service';

@Module({
  providers: [PCCConfigService, PCCAuthService, PCCAPIClient],
  exports: [PCCAPIClient, PCCAuthService, PCCConfigService],
})
export class PCCIntegrationModule {}
