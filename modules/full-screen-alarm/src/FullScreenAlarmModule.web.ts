import { registerWebModule, NativeModule } from 'expo';
import { FullScreenAlarmModuleType, InitialAlarmData, Subscription } from './FullScreenAlarm.types';

class FullScreenAlarmModuleWeb extends NativeModule implements FullScreenAlarmModuleType {
  async scheduleAlarm(): Promise<boolean> {
    return false;
  }
  async cancelAlarm(): Promise<boolean> {
    return false;
  }
  async dismissAlarm(): Promise<boolean> {
    return false;
  }
  canScheduleExactAlarms(): boolean {
    return false;
  }
  canUseFullScreenIntent(): boolean {
    return false;
  }
  async openExactAlarmSettings(): Promise<boolean> {
    return false;
  }
  async openFullScreenIntentSettings(): Promise<boolean> {
    return false;
  }
  getInitialAlarm(): InitialAlarmData | null {
    return null;
  }
  addListener(): Subscription {
    return { remove: () => {} };
  }
  removeListener(): void {}
}

export const isFullScreenAlarmAvailable: boolean = false;
export default registerWebModule(FullScreenAlarmModuleWeb, 'FullScreenAlarm');
