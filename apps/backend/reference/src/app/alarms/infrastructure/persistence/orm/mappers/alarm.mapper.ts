import { Alarm } from '../../../../domain/alarm';
import { AlarmSeverity } from '../../../../domain/value-objects/alarm-severity';
import { AlarmEntity } from '../entities/alarm.entity';

export class AlarmMapper {
  static toDomain(entity: AlarmEntity): Alarm {
    return new Alarm(
      entity.id,
      entity.name,
      new AlarmSeverity(entity.severity as AlarmSeverity['value']) // ✅ Create AlarmSeverity object
    );
  }

  static toPersistence(alarm: Alarm): AlarmEntity {
    const entity = new AlarmEntity();

    entity.id = alarm.id;
    entity.name = alarm.name;
    entity.severity = alarm.severity; // ✅ Getter returns string

    return entity;
  }
}
