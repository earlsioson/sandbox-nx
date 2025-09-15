import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AlarmState } from '../../../../domain/alarm-state.interface';

@Entity('alarms')
export class AlarmEntity implements AlarmState {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  severity!: string;
}
