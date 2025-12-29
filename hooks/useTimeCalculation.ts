
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
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    // Convert to decimal format (e.g., 0:30 becomes 0:5)
    if (m === 30) {
      return `${h}:5`;
    } else if (m === 15) {
      return `${h}:25`;
    } else if (m === 45) {
      return `${h}:75`;
    } else {
      return `${h}:${Math.round(m / 6)}`;
    }
  };

  const calculateWorkHours = (
    clockIn: string,
    clockOut: string,
    workSchedule: WorkSchedule
  ): { regularHours: number; overtimeHours: number } => {
    const actualClockIn = parseTime(clockIn);
    const actualClockOut = parseTime(clockOut);
    const scheduledStart = parseTime(workSchedule.startTime);
    const scheduledEnd = parseTime(workSchedule.endTime);
    
    // Calculate total worked hours
    let totalWorked = actualClockOut - actualClockIn;
    if (totalWorked < 0) {
      totalWorked += 24; // Handle overnight shifts
    }
    
    // Calculate standard work hours for the day
    let standardHours = scheduledEnd - scheduledStart;
    if (standardHours < 0) {
      standardHours += 24; // Handle overnight standard shifts
    }
    
    // Calculate late arrival penalty
    const lateArrival = Math.max(0, actualClockIn - scheduledStart);
    
    // Fixed OT calculation logic
    let regularHours = 0;
    let overtimeHours = 0;
    
    // Calculate overtime: any time worked beyond scheduled hours
    // 1. Early arrival overtime (before scheduled start time)
    const earlyArrival = Math.max(0, scheduledStart - actualClockIn);
    
    // 2. Late departure overtime (after scheduled end time)  
    const lateOvertimeHours = Math.max(0, actualClockOut - scheduledEnd);
    
    // Total overtime = early arrival + late departure
    overtimeHours = earlyArrival + lateOvertimeHours;
    
    // Calculate regular hours: total worked minus overtime, minus late arrival, capped at standard hours
    const workedWithinSchedule = totalWorked - overtimeHours;
    regularHours = Math.max(0, Math.min(workedWithinSchedule - lateArrival, standardHours));
    
    return {
      regularHours: Math.max(0, regularHours),
      overtimeHours: Math.max(0, overtimeHours),
    };
  };

  const getMonthPeriods = (month: number, year: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    
    return [
      {
        name: '1-10',
        startDate: `${year}-${month.toString().padStart(2, '0')}-01`,
        endDate: `${year}-${month.toString().padStart(2, '0')}-10`,
      },
      {
        name: '11-20',
        startDate: `${year}-${month.toString().padStart(2, '0')}-11`,
        endDate: `${year}-${month.toString().padStart(2, '0')}-20`,
      },
      {
        name: `21-${daysInMonth}`,
        startDate: `${year}-${month.toString().padStart(2, '0')}-21`,
        endDate: `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`,
      },
    ];
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateThai = (dateString: string): string => {
    const date = new Date(dateString);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    
    return `${day} ${month} ${year}`;
  };

  const getThaiDayName = (dateString: string): string => {
    const date = new Date(dateString);
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return thaiDays[date.getDay()];
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
    return lateHours;
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
    return earlyHours;
  };

  return {
    parseTime,
    formatHours,
    calculateWorkHours,
    calculateLateArrival,
    calculateEarlyLeave,
    getMonthPeriods,
    formatDate,
    formatDateThai,
    getThaiDayName,
  };
};
