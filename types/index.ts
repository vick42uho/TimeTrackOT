
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
  createdAt?: string;
  updatedAt?: string;
}

export interface PeriodReport {
  period: string;
  startDate: string;
  endDate: string;
  totalRegularHours: number;
  totalOvertimeHours: number;
  entries: TimeEntry[];
}

export interface MonthlyReport {
  month: number;
  year: number;
  periods: PeriodReport[];
  totalRegularHours: number;
  totalOvertimeHours: number;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  themeMode: ThemeMode;
}
