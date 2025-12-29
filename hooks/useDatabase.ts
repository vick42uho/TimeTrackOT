
import * as SQLite from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { TimeEntry, WorkSchedule, PeriodReport } from '../types';

const DATABASE_NAME = 'timetracker.db';

export const useDatabase = () => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initDatabase = async () => {
      // Prevent multiple initialization attempts
      if (isInitializing || isReady) {
        return;
      }

      setIsInitializing(true);
      
      try {
        console.log('Initializing database...');
        
        // Use the modern openDatabaseAsync method
        const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
        
        if (!database) {
          console.error('Failed to create database instance');
          setIsReady(false);
          setIsInitializing(false);
          return;
        }
        
        console.log('Database instance created successfully');
        
        // Enable WAL mode for better performance
        await database.execAsync('PRAGMA journal_mode = WAL');
        
        // Create tables using execAsync with proper SQL syntax
        try {
          console.log('Creating work_schedules table...');
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
          
          console.log('Creating time_entries table...');
          await database.execAsync(`
            CREATE TABLE IF NOT EXISTS time_entries (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              date TEXT NOT NULL UNIQUE,
              clock_in TEXT,
              clock_out TEXT,
              reason TEXT,
              regular_hours REAL DEFAULT 0,
              overtime_hours REAL DEFAULT 0,
              late_arrival_hours REAL DEFAULT 0,
              early_leave_hours REAL DEFAULT 0,
              overtime_used INTEGER DEFAULT 0,
              late_arrival_used INTEGER DEFAULT 0,
              early_leave_used INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
          
          // Migration: Add new columns if they don't exist
          try {
            await database.execAsync(`ALTER TABLE time_entries ADD COLUMN late_arrival_hours REAL DEFAULT 0`);
          } catch (e) { /* Column might already exist */ }
          try {
            await database.execAsync(`ALTER TABLE time_entries ADD COLUMN overtime_used INTEGER DEFAULT 0`);
          } catch (e) { /* Column might already exist */ }
          try {
            await database.execAsync(`ALTER TABLE time_entries ADD COLUMN late_arrival_used INTEGER DEFAULT 0`);
          } catch (e) { /* Column might already exist */ }
          try {
            await database.execAsync(`ALTER TABLE time_entries ADD COLUMN early_leave_hours REAL DEFAULT 0`);
          } catch (e) { /* Column might already exist */ }
          try {
            await database.execAsync(`ALTER TABLE time_entries ADD COLUMN early_leave_used INTEGER DEFAULT 0`);
          } catch (e) { /* Column might already exist */ }
          
          console.log('Database initialized successfully');
          setDb(database);
          setIsReady(true);
        } catch (tableError) {
          console.error('Error creating tables:', tableError);
          setIsReady(false);
          setDb(null);
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
        setIsReady(false);
        setDb(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initDatabase();
  }, []); // Remove dependencies to prevent re-initialization

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
          startTime: (result as any).start_time,
          endTime: (result as any).end_time,
          workDays: (result as any).work_days,
          createdAt: (result as any).created_at,
          updatedAt: (result as any).updated_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting work schedule:', error);
      return null;
    }
  };

  const saveWorkSchedule = async (schedule: WorkSchedule): Promise<void> => {
    if (!db || !isReady) {
      console.log('Database not ready, cannot save work schedule');
      return;
    }

    try {
      console.log('Saving work schedule:', schedule);
      
      await db.runAsync(
        `INSERT OR REPLACE INTO work_schedules 
         (month, year, start_time, end_time, work_days, updated_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [schedule.month, schedule.year, schedule.startTime, schedule.endTime, schedule.workDays || 22]
      );
      
      console.log('Work schedule saved successfully');
    } catch (error) {
      console.error('Error saving work schedule:', error);
      throw error;
    }
  };

  const getTimeEntry = async (date: string): Promise<TimeEntry | null> => {
    if (!db || !isReady) {
      console.warn('Database not ready for getTimeEntry');
      return null;
    }
    
    try {
      console.log('Getting time entry for date:', date); // Debug log
      
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM time_entries WHERE date = ?',
        [date]
      );
      
      console.log('Raw database result:', result); // Debug log
      
      if (result) {
        const timeEntry = {
          id: result.id,
          date: result.date,
          clockIn: result.clock_in,
          clockOut: result.clock_out,
          reason: result.reason,
          regularHours: result.regular_hours,
          overtimeHours: result.overtime_hours,
          lateArrivalHours: result.late_arrival_hours || 0,
          earlyLeaveHours: result.early_leave_hours || 0,
          overtimeUsed: result.overtime_used === 1,
          lateArrivalUsed: result.late_arrival_used === 1,
          earlyLeaveUsed: result.early_leave_used === 1,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        };
        
        console.log('Formatted time entry:', timeEntry); // Debug log
        return timeEntry;
      }
      
      console.log('No time entry found for date:', date); // Debug log
      return null;
    } catch (error) {
      console.error('Error getting time entry:', error);
      return null;
    }
  };

  const saveTimeEntry = async (entry: TimeEntry): Promise<void> => {
    if (!db || !isReady) {
      console.log('Database not ready, cannot save time entry');
      return;
    }

    try {
      console.log('Saving time entry:', entry);
      
      const existingEntry = await getTimeEntry(entry.date);
      
      if (existingEntry) {
        // Update existing entry
        await db.runAsync(
          `UPDATE time_entries 
           SET clock_in = ?, clock_out = ?, reason = ?, regular_hours = ?, overtime_hours = ?, late_arrival_hours = ?, early_leave_hours = ?, overtime_used = ?, late_arrival_used = ?, early_leave_used = ?, updated_at = CURRENT_TIMESTAMP
           WHERE date = ?`,
          [entry.clockIn || null, entry.clockOut || null, entry.reason || null, entry.regularHours || 0, entry.overtimeHours || 0, entry.lateArrivalHours || 0, entry.earlyLeaveHours || 0, entry.overtimeUsed ? 1 : 0, entry.lateArrivalUsed ? 1 : 0, entry.earlyLeaveUsed ? 1 : 0, entry.date]
        );
        console.log('Time entry updated successfully');
      } else {
        // Insert new entry
        await db.runAsync(
          `INSERT INTO time_entries (date, clock_in, clock_out, reason, regular_hours, overtime_hours, late_arrival_hours, early_leave_hours, overtime_used, late_arrival_used, early_leave_used)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [entry.date, entry.clockIn || null, entry.clockOut || null, entry.reason || null, entry.regularHours || 0, entry.overtimeHours || 0, entry.lateArrivalHours || 0, entry.earlyLeaveHours || 0, entry.overtimeUsed ? 1 : 0, entry.lateArrivalUsed ? 1 : 0, entry.earlyLeaveUsed ? 1 : 0]
        );
        console.log('Time entry saved successfully');
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      throw error;
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
        lateArrivalHours: result.late_arrival_hours || 0,
        earlyLeaveHours: result.early_leave_hours || 0,
        overtimeUsed: result.overtime_used === 1,
        lateArrivalUsed: result.late_arrival_used === 1,
        earlyLeaveUsed: result.early_leave_used === 1,
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
      if (entry.lateArrivalHours !== undefined) {
        updateFields.push('late_arrival_hours = ?');
        values.push(entry.lateArrivalHours);
      }
      if (entry.earlyLeaveHours !== undefined) {
        updateFields.push('early_leave_hours = ?');
        values.push(entry.earlyLeaveHours);
      }
      if (entry.overtimeUsed !== undefined) {
        updateFields.push('overtime_used = ?');
        values.push(entry.overtimeUsed ? 1 : 0);
      }
      if (entry.lateArrivalUsed !== undefined) {
        updateFields.push('late_arrival_used = ?');
        values.push(entry.lateArrivalUsed ? 1 : 0);
      }
      if (entry.earlyLeaveUsed !== undefined) {
        updateFields.push('early_leave_used = ?');
        values.push(entry.earlyLeaveUsed ? 1 : 0);
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
        lateArrivalHours: result.late_arrival_hours || 0,
        overtimeUsed: result.overtime_used === 1,
        lateArrivalUsed: result.late_arrival_used === 1,
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
