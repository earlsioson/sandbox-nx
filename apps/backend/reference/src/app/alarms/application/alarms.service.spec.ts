// Update apps/backend/reference/src/app/alarms/application/alarms.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlarmsService } from './alarms.service';

describe('AlarmsService', () => {
  let service: AlarmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlarmsService],
    }).compile();

    service = module.get<AlarmsService>(AlarmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
