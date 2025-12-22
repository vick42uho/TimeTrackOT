
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
  overtimeUsed?: boolean;      // ติ๊กว่าใช้ OT ไปแล้ว
  lateArrivalUsed?: boolean;   // ติ๊กว่าใช้ชั่วโมงสายไปแล้ว
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
  totalOvertimeUsed?: number;      // รวม OT ที่ใช้ไปแล้ว
  totalLateUsed?: number;          // รวมสายที่ใช้ไปแล้ว
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
