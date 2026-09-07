export interface InitialAlarmData {
  isAlarmTriggered: boolean;
  alarmId: string;
  alarmTime: string;
  reason: string;
}

export type FullScreenAlarmEvents = {
  onAlarmTriggered: (data: InitialAlarmData) => void;
};

export interface Subscription {
  remove(): void;
}

export interface FullScreenAlarmModuleType {
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
  setCustomAlarmSound(soundPath: string | null): Promise<boolean>;
  getCustomAlarmSound(): string | null;
  getInitialAlarm(): InitialAlarmData | null;
  addListener(
    eventName: string,
    listener: (data: InitialAlarmData) => void
  ): Subscription;
  removeListener?(
    eventName: string,
    listener: (data: InitialAlarmData) => void
  ): void;
}
