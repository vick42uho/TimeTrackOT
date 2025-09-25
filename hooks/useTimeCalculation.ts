
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
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const calculateWorkHours = (
    clockIn: string,
    clockOut: string,
    workSchedule: WorkSchedule
  ): { regularHours: number; overtimeHours: number } => {
    const clockInHours = parseTime(clockIn);
    const clockOutHours = parseTime(clockOut);
    const standardStart = parseTime(workSchedule.startTime);
    const standardEnd = parseTime(workSchedule.endTime);
    
    // Calculate total worked hours
    let totalWorked = clockOutHours - clockInHours;
    if (totalWorked < 0) {
      totalWorked += 24; // Handle overnight shifts
    }
    
    // Calculate standard work hours for the day
    let standardHours = standardEnd - standardStart;
    if (standardHours < 0) {
      standardHours += 24; // Handle overnight standard shifts
    }
    
    // Calculate regular and overtime hours
    const regularHours = Math.min(totalWorked, standardHours);
    const overtimeHours = Math.max(0, totalWorked - standardHours);
    
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

  return {
    parseTime,
    formatHours,
    calculateWorkHours,
    getMonthPeriods,
    formatDate,
    formatDateThai,
    getThaiDayName,
  };
};
