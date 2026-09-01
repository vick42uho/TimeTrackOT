import { useMemo } from 'react';
import { WorkSchedule, TimeEntry } from '../types';

export const useTimeCalculation = () => {
  
  const parseTime = (timeString: string): number => {
    if (!timeString || typeof timeString !== 'string') {
      console.warn('parseTime received invalid input:', timeString);
      return 0;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  };

  const formatHours = (hours: number): string => {
    if (hours === undefined || hours === null || isNaN(hours)) {
      return '0.00';
    }
    return Math.max(0, hours).toFixed(2);
  };

  const formatHoursToReadable = (hours: number): string => {
    if (hours === undefined || hours === null || isNaN(hours) || hours <= 0) {
      return '0 นาที';
    }
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} นาที`;
    if (m === 0) return `${h} ชม.`;
    return `${h} ชม. ${m} นาที`;
  };

  const formatHoursWithDecimal = (hours: number): string => {
    if (hours === undefined || hours === null || isNaN(hours) || hours <= 0) {
      return '0 นาที (0.00 ชม.)';
    }
    const readable = formatHoursToReadable(hours);
    const decimal = Math.max(0, hours).toFixed(2);
    return `${readable} (${decimal} ชม.)`;
  };

  const calculateWorkHours = (
    clockIn: string,
    clockOut: string,
    workSchedule: WorkSchedule
  ): { regularHours: number; overtimeHours: number } => {
    if (!clockIn || !clockOut || !workSchedule) {
      return { regularHours: 0, overtimeHours: 0 };
    }

    const actualClockIn = parseTime(clockIn);
    let actualClockOut = parseTime(clockOut);
    const scheduledStart = parseTime(workSchedule.startTime);
    let scheduledEnd = parseTime(workSchedule.endTime);
    
    // Normalize overnight shifts
    if (scheduledEnd < scheduledStart) {
      scheduledEnd += 24;
    }
    if (actualClockOut < actualClockIn) {
      actualClockOut += 24;
    }

    // 1. Morning Overtime: Hours worked BEFORE scheduled start time
    const morningOT = Math.max(0, Math.min(actualClockOut, scheduledStart) - actualClockIn);

    // 2. Regular hours: Hours worked WITHIN scheduled shift window
    const effectiveStart = Math.max(actualClockIn, scheduledStart);
    const effectiveEnd = Math.min(actualClockOut, scheduledEnd);
    const regularHours = Math.max(0, effectiveEnd - effectiveStart);

    // 3. Evening/Night Overtime: Hours worked AFTER scheduled end time
    const eveningOT = Math.max(0, actualClockOut - Math.max(actualClockIn, scheduledEnd));

    // Total Overtime = Morning OT + Evening OT
    const overtimeHours = morningOT + eveningOT;

    return {
      regularHours: Number(regularHours.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
    };
  };

  const getMonthPeriods = (month: number, year: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return [
      {
        name: '1-10',
        period: '1-10',
        startDate: `${year}-${month.toString().padStart(2, '0')}-01`,
        endDate: `${year}-${month.toString().padStart(2, '0')}-10`,
      },
      {
        name: '11-20',
        period: '11-20',
        startDate: `${year}-${month.toString().padStart(2, '0')}-11`,
        endDate: `${year}-${month.toString().padStart(2, '0')}-20`,
      },
      {
        name: `21-${daysInMonth}`,
        period: `21-${daysInMonth}`,
        startDate: `${year}-${month.toString().padStart(2, '0')}-21`,
        endDate: `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`,
      },
    ];
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateThai = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length !== 3) return dateString;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getThaiDayName = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length !== 3) return '';
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      return days[d.getDay()];
    } catch {
      return '';
    }
  };

  const calculateLateArrival = (
    clockIn: string,
    workSchedule: WorkSchedule
  ): number => {
    if (!clockIn || !workSchedule) return 0;
    
    const actualClockIn = parseTime(clockIn);
    const scheduledStart = parseTime(workSchedule.startTime);
    
    // Calculate late arrival in hours
    const lateHours = Math.max(0, actualClockIn - scheduledStart);
    return Number(lateHours.toFixed(2));
  };

  const calculateEarlyLeave = (
    clockOut: string,
    workSchedule: WorkSchedule
  ): number => {
    if (!clockOut || !workSchedule) return 0;
    
    const actualClockOut = parseTime(clockOut);
    const scheduledEnd = parseTime(workSchedule.endTime);
    
    // Calculate early leave in hours (only if left before scheduled end time)
    const earlyHours = Math.max(0, scheduledEnd - actualClockOut);
    return Number(earlyHours.toFixed(2));
  };

  return useMemo(
    () => ({
      parseTime,
      formatHours,
      formatHoursToReadable,
      formatHoursWithDecimal,
      calculateWorkHours,
      calculateLateArrival,
      calculateEarlyLeave,
      getMonthPeriods,
      formatDate,
      formatDateThai,
      getThaiDayName,
    }),
    []
  );
};
