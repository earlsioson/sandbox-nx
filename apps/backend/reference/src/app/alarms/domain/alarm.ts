import { AlarmSeverity } from './value-objects/alarm-severity';

export class Alarm {
  private _severity: AlarmSeverity; // ✅ Rich object (instructors' way)

  constructor(
    public id: string,
    public name: string,
    severity: AlarmSeverity // ✅ Back to AlarmSeverity object
  ) {
    this._severity = severity;
  }

  // ✅ Interface compliance via getter
  get severity(): string {
    return this._severity.value;
  }

  // ✅ Rich domain behavior (instructors' intent)
  getSeverityObject(): AlarmSeverity {
    return this._severity;
  }

  isHighPriority(): boolean {
    return (
      this._severity.value === 'critical' || this._severity.value === 'high'
    );
  }
}
