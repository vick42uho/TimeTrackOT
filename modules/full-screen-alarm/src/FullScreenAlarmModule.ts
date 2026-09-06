import { NativeModule, requireOptionalNativeModule } from 'expo';
import {
  FullScreenAlarmModuleType,
  FullScreenAlarmEvents,
  InitialAlarmData,
} from './FullScreenAlarm.types';

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
  openLockScreenPermissionSettings(): Promise<boolean>;
  getInitialAlarm(): InitialAlarmData | null;
}

const NativeModuleInstance = requireOptionalNativeModule<FullScreenAlarmNativeModule>('FullScreenAlarm');

export const isFullScreenAlarmAvailable: boolean = !!NativeModuleInstance;

const FallbackModule: FullScreenAlarmModuleType = {
  scheduleAlarm: async () => false,
  cancelAlarm: async () => false,
  dismissAlarm: async () => false,
  canScheduleExactAlarms: () => false,
  canUseFullScreenIntent: () => false,
  openExactAlarmSettings: async () => false,
  openFullScreenIntentSettings: async () => false,
  openLockScreenPermissionSettings: async () => false,
  getInitialAlarm: () => null,
  addListener: () => ({ remove: () => {} }),
  removeListener: () => {},
};

const FullScreenAlarm: FullScreenAlarmModuleType = NativeModuleInstance || FallbackModule;

export default FullScreenAlarm;
