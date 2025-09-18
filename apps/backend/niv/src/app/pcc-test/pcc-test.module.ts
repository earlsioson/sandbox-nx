// apps/backend/niv/src/app/pcc-test/pcc-test.module.ts
import { Module } from '@nestjs/common';
import { PCCTestController } from './pcc-test.controller';
import { PCCTestService } from './pcc-test.service';

@Module({
  controllers: [PCCTestController],
  providers: [PCCTestService],
  exports: [PCCTestService],
})
export class PCCTestModule {}
