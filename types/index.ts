
export interface WorkSchedule {
  id?: number;
  month: number;
  year: number;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  workDays?: number; // จำนวนวันทำงานในเดือน (default: 22)
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeEntry {
  id?: number;
  date: string; // YYYY-MM-DD format
  clockIn?: string; // HH:MM format
  clockOut?: string; // HH:MM format
  reason?: string;
  regularHours: number;
  overtimeHours: number;
  lateArrivalHours?: number;
  earlyLeaveHours?: number;    // ชั่วโมงที่กลับก่อนเวลา
  overtimeUsed?: boolean;      // ติ๊กว่าใช้ OT ไปแล้ว
  lateArrivalUsed?: boolean;   // ติ๊กว่าใช้ชั่วโมงสายไปแล้ว
  earlyLeaveUsed?: boolean;    // ติ๊กว่าชดเชยแล้ว
  createdAt?: string;
  updatedAt?: string;
}

export interface PeriodReport {
  period: string;
  startDate: string;
  endDate: string;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateHours?: number;
  totalEarlyLeaveHours?: number;   // รวมชั่วโมงกลับก่อน
  totalOvertimeUsed?: number;      // รวม OT ที่ใช้ไปแล้ว
  totalLateUsed?: number;          // รวมสายที่ใช้ไปแล้ว
  totalEarlyLeaveUsed?: number;    // รวมชั่วโมงที่ชดเชยแล้ว
  entries: TimeEntry[];
}

export interface MonthlyReport {
  month: number;
  year: number;
  periods: PeriodReport[];
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateHours?: number;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  themeMode: ThemeMode;
}

export type HolidayType = 'public' | 'company' | 'special' | 'regular_off' | 'wfh';

export interface Holiday {
  id?: number;
  name: string;
  date: string; // YYYY-MM-DD format
  type: HolidayType;
  isRecurring?: boolean;
  createdAt?: string;
}

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'other';
export type LeaveDurationType = 'full_day' | 'half_day_morning' | 'half_day_afternoon';
export type LeaveStatus = 'approved' | 'pending' | 'cancelled';

export interface LeaveRequest {
  id?: number;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  durationDays: number;
  durationType: LeaveDurationType;
  reason?: string;
  status: LeaveStatus;
  createdAt?: string;
}

export interface LeaveQuota {
  id?: number;
  year: number;
  leaveType: LeaveType;
  quotaDays: number;
}

export interface LeaveSummary {
  leaveType: LeaveType;
  label: string;
  usedDays: number;
  quotaDays: number;
  remainingDays: number;
}

export type ActivityCategory = 'work' | 'exercise' | 'personal' | 'dining' | 'travel' | 'general';

export interface Activity {
  id?: number;
  title: string;
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  isAllDay?: boolean;
  category: ActivityCategory;
  location?: string;
  note?: string;
  reminderMinutes?: number | null; // null = no reminder, 0 = at time, 15 = 15 mins before, 30 = 30 mins before, 60 = 1 hour before, 1440 = 1 day before
  notificationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackupMetadata {
  appName: string;
  appVersion: string;
  schemaVersion: number;
  exportedAt: string;
  totalRecords: {
    timeEntries: number;
    workSchedules: number;
    holidays: number;
    leaves: number;
    leaveQuotas: number;
    activities?: number;
    tasksNotes?: number;
  };
}

export interface BackupPayload {
  metadata: BackupMetadata;
  data: {
    timeEntries: TimeEntry[];
    workSchedules: WorkSchedule[];
    holidays: Holiday[];
    leaves: LeaveRequest[];
    leaveQuotas: LeaveQuota[];
    activities?: Activity[];
    tasksNotes?: TaskNote[];
  };
}

export interface RestoreResult {
  success: boolean;
  timeEntriesCount: number;
  workSchedulesCount: number;
  holidaysCount: number;
  leavesCount: number;
  leaveQuotasCount: number;
  activitiesCount?: number;
  tasksNotesCount?: number;
}

export type TaskNoteType = 'checklist' | 'note';
export type TaskNoteColor = 'default' | 'blue' | 'green' | 'yellow' | 'rose' | 'purple' | (string & {});

export interface TaskNoteItem {
  id: string;
  text: string;
  isDone: boolean;
}

export interface TaskNote {
  id?: number;
  title: string;
  content?: string;
  type: TaskNoteType;
  items: TaskNoteItem[];
  isCompleted: boolean;
  color: TaskNoteColor;
  isPinned: boolean;
  date?: string; // YYYY-MM-DD
  reminderTime?: string; // YYYY-MM-DD HH:mm
  notificationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

