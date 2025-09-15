import { AlarmState } from '../../../../domain/alarm-state.interface';

export class AlarmEntity implements AlarmState {
  id!: string;
  name!: string;
  severity!: string;
}
