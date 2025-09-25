
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkSchedule, TimeEntry } from '../types';

const WORK_SCHEDULES_KEY = 'work_schedules';
const TIME_ENTRIES_KEY = 'time_entries';

export const useStorage = () => {
  
  const getWorkSchedules = async (): Promise<WorkSchedule[]> => {
    try {
      const data = await AsyncStorage.getItem(WORK_SCHEDULES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting work schedules:', error);
      return [];
    }
  };

  const saveWorkSchedules = async (schedules: WorkSchedule[]): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(WORK_SCHEDULES_KEY, JSON.stringify(schedules));
      return true;
    } catch (error) {
      console.error('Error saving work schedules:', error);
      return false;
    }
  };

  const getWorkSchedule = async (month: number, year: number): Promise<WorkSchedule | null> => {
    const schedules = await getWorkSchedules();
    return schedules.find(s => s.month === month && s.year === year) || null;
  };

  const saveWorkSchedule = async (schedule: Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const schedules = await getWorkSchedules();
    const existingIndex = schedules.findIndex(s => s.month === schedule.month && s.year === schedule.year);
    
    const newSchedule: WorkSchedule = {
      ...schedule,
      id: existingIndex >= 0 ? schedules[existingIndex].id : Date.now(),
      createdAt: existingIndex >= 0 ? schedules[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      schedules[existingIndex] = newSchedule;
    } else {
      schedules.push(newSchedule);
    }

    return await saveWorkSchedules(schedules);
  };

  const getTimeEntries = async (): Promise<TimeEntry[]> => {
    try {
      const data = await AsyncStorage.getItem(TIME_ENTRIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting time entries:', error);
      return [];
    }
  };

  const saveTimeEntries = async (entries: TimeEntry[]): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Error saving time entries:', error);
      return false;
    }
  };

  const getTimeEntry = async (date: string): Promise<TimeEntry | null> => {
    const entries = await getTimeEntries();
    return entries.find(e => e.date === date) || null;
  };

  const saveTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const entries = await getTimeEntries();
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    const newEntry: TimeEntry = {
      ...entry,
      id: existingIndex >= 0 ? entries[existingIndex].id : Date.now(),
      createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }

    return await saveTimeEntries(entries);
  };

  const getTimeEntriesForPeriod = async (startDate: string, endDate: string): Promise<TimeEntry[]> => {
    const entries = await getTimeEntries();
    return entries.filter(e => e.date >= startDate && e.date <= endDate).sort((a, b) => a.date.localeCompare(b.date));
  };

  return {
    isReady: true, // AsyncStorage is always ready
    getWorkSchedule,
    saveWorkSchedule,
    getTimeEntry,
    saveTimeEntry,
    getTimeEntriesForPeriod,
  };
};
