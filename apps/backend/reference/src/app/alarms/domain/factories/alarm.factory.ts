// ✅ CHANGE TO: Back to creating AlarmSeverity objects
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Alarm } from '../alarm';
import { AlarmSeverity } from '../value-objects/alarm-severity';

@Injectable()
export class AlarmFactory {
  create(name: string, severity: string): Alarm {
    const alarmId = randomUUID();
    const alarmSeverity = new AlarmSeverity(severity as AlarmSeverity['value']); // ✅ Create rich object

    return new Alarm(
      alarmId,
      name,
      alarmSeverity // ✅ Pass rich object (instructors' way)
    );
  }
}
