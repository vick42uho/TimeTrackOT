
import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { WorkSchedule, TimeEntry } from '../types';

const DATABASE_NAME = 'timetracking.db';

export const useDatabase = () => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('Initializing database...');
        
        // ตรวจสอบว่า SQLite พร้อมใช้งานหรือไม่
        if (!SQLite.openDatabaseAsync) {
          throw new Error('SQLite is not available');
        }
        
        const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
        
        // ตรวจสอบว่า database object ถูกสร้างสำเร็จ
        if (!database) {
          throw new Error('Failed to create database instance');
        }
        
        // Create tables with better error handling
        try {
          await database.execAsync(`
            CREATE TABLE IF NOT EXISTS work_schedules (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              month INTEGER NOT NULL,
              year INTEGER NOT NULL,
              start_time TEXT NOT NULL,
              end_time TEXT NOT NULL,
              work_days INTEGER DEFAULT 22,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(month, year)
            );
          `);
        } catch (tableError) {
          console.error('Error creating work_schedules table:', tableError);
          throw tableError;
        }

        try {
          await database.execAsync(`
            DROP TABLE IF EXISTS time_entries;
          `);
          
          await database.execAsync(`
            CREATE TABLE IF NOT EXISTS time_entries (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              date TEXT NOT NULL UNIQUE,
              clock_in TEXT,
              clock_out TEXT,
              reason TEXT,
              regular_hours REAL DEFAULT 0,
              overtime_hours REAL DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
        } catch (tableError) {
          console.error('Error creating time_entries table:', tableError);
          throw tableError;
        }

        console.log('Database initialized successfully');
        setDb(database);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing database:', error);
        setIsReady(false);
        setDb(null);
        
        // แสดง error ให้ผู้ใช้เห็น
        if (typeof error === 'object' && error !== null && 'message' in error) {
          console.error('Database initialization failed:', (error as Error).message);
        }
      }
    };

    initDatabase();
  }, []);

  const getWorkSchedule = async (month: number, year: number): Promise<WorkSchedule | null> => {
    if (!db || !isReady) {
      console.warn('Database not ready for getWorkSchedule');
      return null;
    }
    
    try {
      const result = await db.getFirstAsync<WorkSchedule>(
        'SELECT * FROM work_schedules WHERE month = ? AND year = ?',
        [month, year]
      );
      
      if (result) {
        return {
          id: result.id,
          month: result.month,
          year: result.year,
          startTime: result.startTime,
          endTime: result.endTime,
          workDays: result.workDays,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting work schedule:', error);
      return null;
    }
  };

  const saveWorkSchedule = async (schedule: Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!db || !isReady) {
      console.warn('Database not ready for saveWorkSchedule');
      return false;
    }
    
    try {
      const workDays = schedule.workDays || 22; // ใช้ค่า default 22 วันถ้าไม่ได้ระบุ
      
      await db.runAsync(
        `INSERT OR REPLACE INTO work_schedules (month, year, start_time, end_time, work_days, updated_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [schedule.month, schedule.year, schedule.startTime, schedule.endTime, workDays]
      );
      
      console.log('Work schedule saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving work schedule:', error);
      return false;
    }
  };

  const getTimeEntry = async (date: string): Promise<TimeEntry | null> => {
    if (!db || !isReady) {
      console.warn('Database not ready for getTimeEntry');
      return null;
    }
    
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM time_entries WHERE date = ?',
        [date]
      );
      
      if (result) {
        return {
          id: result.id,
          date: result.date,
          clockIn: result.clock_in,
          clockOut: result.clock_out,
          reason: result.reason,
          regularHours: result.regular_hours,
          overtimeHours: result.overtime_hours,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting time entry:', error);
      return null;
    }
  };

  const saveTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!db || !isReady) {
      console.warn('Database not ready for saveTimeEntry');
      return false;
    }
    
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO time_entries 
         (date, clock_in, clock_out, reason, regular_hours, overtime_hours, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [entry.date, entry.clockIn || null, entry.clockOut || null, entry.reason || null, entry.regularHours, entry.overtimeHours]
      );
      
      console.log('Time entry saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving time entry:', error);
      return false;
    }
  };

  const getTimeEntriesForPeriod = async (startDate: string, endDate: string): Promise<TimeEntry[]> => {
    if (!db || !isReady) {
      console.warn('Database not ready for getTimeEntriesForPeriod');
      return [];
    }
    
    try {
      const results = await db.getAllAsync<any>(
        'SELECT * FROM time_entries WHERE date >= ? AND date <= ? ORDER BY date',
        [startDate, endDate]
      );
      
      return results.map(result => ({
        id: result.id,
        date: result.date,
        clockIn: result.clock_in,
        clockOut: result.clock_out,
        reason: result.reason,
        regularHours: result.regular_hours,
        overtimeHours: result.overtime_hours,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));
    } catch (error) {
      console.error('Error getting time entries for period:', error);
      return [];
    }
  };

  const deleteTimeEntry = async (date: string): Promise<boolean> => {
    if (!db || !isReady) {
      console.warn('Database not ready for deleteTimeEntry');
      return false;
    }
    
    try {
      await db.runAsync('DELETE FROM time_entries WHERE date = ?', [date]);
      console.log('Time entry deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }
  };

  const updateTimeEntry = async (date: string, entry: Partial<Omit<TimeEntry, 'id' | 'date' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
    if (!db || !isReady) {
      console.warn('Database not ready for updateTimeEntry');
      return false;
    }
    
    try {
      const updateFields = [];
      const values = [];
      
      if (entry.clockIn !== undefined) {
        updateFields.push('clock_in = ?');
        values.push(entry.clockIn || null);
      }
      if (entry.clockOut !== undefined) {
        updateFields.push('clock_out = ?');
        values.push(entry.clockOut || null);
      }
      if (entry.reason !== undefined) {
        updateFields.push('reason = ?');
        values.push(entry.reason || null);
      }
      if (entry.regularHours !== undefined) {
        updateFields.push('regular_hours = ?');
        values.push(entry.regularHours);
      }
      if (entry.overtimeHours !== undefined) {
        updateFields.push('overtime_hours = ?');
        values.push(entry.overtimeHours);
      }
      
      if (updateFields.length === 0) {
        console.warn('No fields to update');
        return false;
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(date);
      
      const query = `UPDATE time_entries SET ${updateFields.join(', ')} WHERE date = ?`;
      await db.runAsync(query, values);
      
      console.log('Time entry updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating time entry:', error);
      return false;
    }
  };

  const getAllTimeEntries = async (): Promise<TimeEntry[]> => {
    if (!db || !isReady) {
      console.warn('Database not ready for getAllTimeEntries');
      return [];
    }
    
    try {
      const results = await db.getAllAsync<any>(
        'SELECT * FROM time_entries ORDER BY date DESC'
      );
      
      return results.map(result => ({
        id: result.id,
        date: result.date,
        clockIn: result.clock_in,
        clockOut: result.clock_out,
        reason: result.reason,
        regularHours: result.regular_hours,
        overtimeHours: result.overtime_hours,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));
    } catch (error) {
      console.error('Error getting all time entries:', error);
      return [];
    }
  };

  return {
    db,
    isReady,
    getWorkSchedule,
    saveWorkSchedule,
    getTimeEntry,
    saveTimeEntry,
    getTimeEntriesForPeriod,
    deleteTimeEntry,
    updateTimeEntry,
    getAllTimeEntries,
  };
};
