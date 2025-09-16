import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlarmsService } from '../../application/alarms.service';
import { AlarmsController } from './alarms.controller';

describe('AlarmsController', () => {
  let controller: AlarmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlarmsController],
      providers: [AlarmsService],
    }).compile();

    controller = module.get<AlarmsController>(AlarmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
