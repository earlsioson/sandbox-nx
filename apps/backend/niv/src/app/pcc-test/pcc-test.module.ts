// apps/backend/niv/src/app/pcc-test/pcc-test.module.ts
import { Module } from '@nestjs/common';
import { PccTestController } from './pcc-test.controller';
import { PccTestService } from './pcc-test.service';

@Module({
  controllers: [PccTestController],
  providers: [PccTestService],
  exports: [PccTestService],
})
export class PccTestModule {}
