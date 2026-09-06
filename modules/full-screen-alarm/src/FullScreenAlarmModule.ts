import { NativeModule, requireNativeModule } from 'expo';
import { FullScreenAlarmModuleType, FullScreenAlarmEvents, InitialAlarmData } from './FullScreenAlarm.types';

declare class FullScreenAlarmNativeModule extends NativeModule<FullScreenAlarmEvents> implements FullScreenAlarmModuleType {
  scheduleAlarm(
    id: string,
    timestampMs: number,
    title: string,
    message: string,
    alarmTime: string,
    reason: string
  ): Promise<boolean>;
  cancelAlarm(id: string): Promise<boolean>;
  dismissAlarm(id: string): Promise<boolean>;
  canScheduleExactAlarms(): boolean;
  canUseFullScreenIntent(): boolean;
  openExactAlarmSettings(): Promise<boolean>;
  openFullScreenIntentSettings(): Promise<boolean>;
  getInitialAlarm(): InitialAlarmData | null;
}

export default requireNativeModule<FullScreenAlarmNativeModule>('FullScreenAlarm');
