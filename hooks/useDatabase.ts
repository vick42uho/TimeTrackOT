
import * as SQLite from 'expo-sqlite';
import { useState, useEffect, useMemo } from 'react';
import {
  TimeEntry,
  WorkSchedule,
  PeriodReport,
  Holiday,
  HolidayType,
  LeaveRequest,
  LeaveQuota,
  LeaveSummary,
  LeaveType,
  BackupPayload,
  RestoreResult,
  Activity,
  TaskNote,
} from '../types';

const DATABASE_NAME = 'timetracker.db';

let globalDb: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getOrInitDb(): Promise<SQLite.SQLiteDatabase> {
  if (globalDb) return globalDb;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('Initializing singleton database...');
        const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await database.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA synchronous = NORMAL;
          PRAGMA cache_size = -16000;
          PRAGMA temp_store = MEMORY;
          PRAGMA mmap_size = 268435456;
        `);
        
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

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS holidays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL DEFAULT 'public',
            is_recurring INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leave_type TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            duration_days REAL NOT NULL,
            duration_type TEXT NOT NULL DEFAULT 'full_day',
            reason TEXT,
            status TEXT NOT NULL DEFAULT 'approved',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS leave_quotas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            leave_type TEXT NOT NULL,
            quota_days REAL NOT NULL,
            UNIQUE(year, leave_type)
          );
        `);

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            is_all_day INTEGER DEFAULT 0,
            category TEXT NOT NULL DEFAULT 'general',
            location TEXT,
            note TEXT,
            reminder_minutes INTEGER DEFAULT NULL,
            notification_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS tasks_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            type TEXT NOT NULL DEFAULT 'checklist',
            items_json TEXT,
            is_completed INTEGER DEFAULT 0,
            color TEXT DEFAULT 'default',
            is_pinned INTEGER DEFAULT 0,
            date TEXT,
            reminder_time TEXT,
            notification_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // High Performance Indexes
        await database.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
          CREATE INDEX IF NOT EXISTS idx_time_entries_date_hours ON time_entries(date, regular_hours, overtime_hours);
          CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
          CREATE INDEX IF NOT EXISTS idx_leaves_dates ON leaves(start_date, end_date);
          CREATE INDEX IF NOT EXISTS idx_leaves_status_dates ON leaves(status, start_date, end_date);
          CREATE INDEX IF NOT EXISTS idx_work_schedules_month_year ON work_schedules(month, year);
          CREATE INDEX IF NOT EXISTS idx_work_schedules_year ON work_schedules(year);
          CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
          CREATE INDEX IF NOT EXISTS idx_activities_date_order ON activities(date, is_all_day, start_time);
          CREATE INDEX IF NOT EXISTS idx_tasks_notes_date ON tasks_notes(date, is_pinned, is_completed);
          CREATE INDEX IF NOT EXISTS idx_tasks_notes_order ON tasks_notes(is_pinned DESC, is_completed ASC, updated_at DESC);
        `);

        // Migration safety checks
        try { await database.execAsync(`ALTER TABLE time_entries ADD COLUMN late_arrival_hours REAL DEFAULT 0;`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE time_entries ADD COLUMN overtime_used INTEGER DEFAULT 0;`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE time_entries ADD COLUMN late_arrival_used INTEGER DEFAULT 0;`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE time_entries ADD COLUMN early_leave_hours REAL DEFAULT 0;`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE time_entries ADD COLUMN early_leave_used INTEGER DEFAULT 0;`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE holidays ADD COLUMN type TEXT NOT NULL DEFAULT 'public';`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE holidays ADD COLUMN is_recurring INTEGER DEFAULT 0;`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE leaves ADD COLUMN duration_type TEXT NOT NULL DEFAULT 'full_day';`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE leaves ADD COLUMN reason TEXT;`); } catch (e) {}
        try { await database.execAsync(`ALTER TABLE leaves ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';`); } catch (e) {}

        console.log('Singleton database initialized successfully');
        globalDb = database;
        return database;
      } catch (error) {
        initPromise = null;
        console.error('Database initialization failed:', error);
        throw error;
      }
    })();
  }
  return initPromise;
}

export const useDatabase = () => {
  const [isReady, setIsReady] = useState(!!globalDb);

  useEffect(() => {
    let isMounted = true;
    getOrInitDb()
      .then(() => {
        if (isMounted) setIsReady(true);
      })
      .catch((err) => {
        console.error('Failed to init DB in hook:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getWorkSchedule = async (month: number, year: number): Promise<WorkSchedule | null> => {
    try {
      const db = await getOrInitDb();
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM work_schedules WHERE month = ? AND year = ?',
        [Number(month), Number(year)]
      );
      
      if (result) {
        return {
          id: result.id,
          month: result.month,
          year: result.year,
          startTime: result.start_time,
          endTime: result.end_time,
          workDays: result.work_days,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting work schedule:', error);
      return null;
    }
  };

  const getWorkSchedulesForYear = async (year: number): Promise<Record<number, WorkSchedule>> => {
    try {
      const db = await getOrInitDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM work_schedules WHERE year = ?',
        [year]
      );
      const scheduleMap: Record<number, WorkSchedule> = {};
      results.forEach(res => {
        scheduleMap[res.month] = {
          id: res.id,
          month: res.month,
          year: res.year,
          startTime: res.start_time,
          endTime: res.end_time,
          workDays: res.work_days,
          createdAt: res.created_at,
          updatedAt: res.updated_at,
        };
      });
      return scheduleMap;
    } catch (error) {
      console.error('Error getting work schedules for year:', error);
      return {};
    }
  };

  const saveWorkSchedule = async (schedule: WorkSchedule): Promise<void> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO work_schedules 
         (month, year, start_time, end_time, work_days, updated_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [Number(schedule.month), Number(schedule.year), schedule.startTime, schedule.endTime, schedule.workDays || 22]
      );
    } catch (error) {
      console.error('Error saving work schedule:', error);
      throw error;
    }
  };

  const saveWorkScheduleForYear = async (
    year: number,
    startTime: string,
    endTime: string,
    workDays: number = 22
  ): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.withTransactionAsync(async () => {
        for (let m = 1; m <= 12; m++) {
          await db.runAsync(
            `INSERT OR REPLACE INTO work_schedules 
             (month, year, start_time, end_time, work_days, updated_at) 
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [m, Number(year), startTime, endTime, workDays]
          );
        }
      });
      return true;
    } catch (error) {
      console.error('Error saving work schedule for year:', error);
      return false;
    }
  };

  const getTimeEntry = async (date: string): Promise<TimeEntry | null> => {
    try {
      const db = await getOrInitDb();
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
          lateArrivalHours: result.late_arrival_hours || 0,
          earlyLeaveHours: result.early_leave_hours || 0,
          overtimeUsed: result.overtime_used === 1,
          lateArrivalUsed: result.late_arrival_used === 1,
          earlyLeaveUsed: result.early_leave_used === 1,
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

  const saveTimeEntry = async (entry: TimeEntry): Promise<void> => {
    try {
      const db = await getOrInitDb();
      const existingEntry = await getTimeEntry(entry.date);
      
      if (existingEntry) {
        await db.runAsync(
          `UPDATE time_entries 
           SET clock_in = ?, clock_out = ?, reason = ?, regular_hours = ?, overtime_hours = ?, late_arrival_hours = ?, early_leave_hours = ?, overtime_used = ?, late_arrival_used = ?, early_leave_used = ?, updated_at = CURRENT_TIMESTAMP
           WHERE date = ?`,
          [entry.clockIn || null, entry.clockOut || null, entry.reason || null, entry.regularHours || 0, entry.overtimeHours || 0, entry.lateArrivalHours || 0, entry.earlyLeaveHours || 0, entry.overtimeUsed ? 1 : 0, entry.lateArrivalUsed ? 1 : 0, entry.earlyLeaveUsed ? 1 : 0, entry.date]
        );
      } else {
        await db.runAsync(
          `INSERT INTO time_entries (date, clock_in, clock_out, reason, regular_hours, overtime_hours, late_arrival_hours, early_leave_hours, overtime_used, late_arrival_used, early_leave_used)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [entry.date, entry.clockIn || null, entry.clockOut || null, entry.reason || null, entry.regularHours || 0, entry.overtimeHours || 0, entry.lateArrivalHours || 0, entry.earlyLeaveHours || 0, entry.overtimeUsed ? 1 : 0, entry.lateArrivalUsed ? 1 : 0, entry.earlyLeaveUsed ? 1 : 0]
        );
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      throw error;
    }
  };

  const getTimeEntriesForPeriod = async (startDate: string, endDate: string): Promise<TimeEntry[]> => {
    try {
      const db = await getOrInitDb();
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
    try {
      const db = await getOrInitDb();
      await db.runAsync('DELETE FROM time_entries WHERE date = ?', [date]);
      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }
  };

  const updateTimeEntry = async (date: string, entry: Partial<Omit<TimeEntry, 'id' | 'date' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
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
        return false;
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(date);
      
      const query = `UPDATE time_entries SET ${updateFields.join(', ')} WHERE date = ?`;
      await db.runAsync(query, values);
      return true;
    } catch (error) {
      console.error('Error updating time entry:', error);
      return false;
    }
  };

  const getAllTimeEntries = async (): Promise<TimeEntry[]> => {
    try {
      const db = await getOrInitDb();
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

  // ==========================================
  // HOLIDAYS MANAGEMENT
  // ==========================================

  const getHolidays = async (year?: number, month?: number): Promise<Holiday[]> => {
    try {
      const db = await getOrInitDb();
      let query = 'SELECT * FROM holidays';
      const params: any[] = [];

      if (year && month) {
        const monthStr = month.toString().padStart(2, '0');
        query += ' WHERE date LIKE ?';
        params.push(`${year}-${monthStr}%`);
      } else if (year) {
        query += ' WHERE date LIKE ?';
        params.push(`${year}-%`);
      }

      query += ' ORDER BY date ASC';
      const results = await db.getAllAsync<any>(query, params);

      return results.map((r) => ({
        id: r.id,
        name: r.name,
        date: r.date,
        type: r.type,
        isRecurring: r.is_recurring === 1,
        createdAt: r.created_at,
      }));
    } catch (error) {
      console.error('Error getting holidays:', error);
      return [];
    }
  };

  const saveHoliday = async (holiday: Omit<Holiday, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO holidays (name, date, type, is_recurring, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [holiday.name, holiday.date, holiday.type || 'public', holiday.isRecurring ? 1 : 0]
      );
      return true;
    } catch (error) {
      console.error('Error saving holiday:', error);
      return false;
    }
  };

  const updateHoliday = async (id: number, holiday: Partial<Holiday>): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync(
        `UPDATE holidays 
         SET name = COALESCE(?, name),
             date = COALESCE(?, date),
             type = COALESCE(?, type),
             is_recurring = COALESCE(?, is_recurring)
         WHERE id = ?`,
        [
          holiday.name ?? null,
          holiday.date ?? null,
          holiday.type ?? null,
          holiday.isRecurring !== undefined ? (holiday.isRecurring ? 1 : 0) : null,
          id,
        ]
      );
      return true;
    } catch (error) {
      console.error('Error updating holiday:', error);
      return false;
    }
  };

  const deleteHoliday = async (id: number): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync('DELETE FROM holidays WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting holiday:', error);
      return false;
    }
  };

  const preloadThaiHolidays = async (year: number): Promise<number> => {
    try {
      const db = await getOrInitDb();
      const thaiHolidays2026 = [
        { name: 'วันขึ้นปีใหม่', date: `${year}-01-01`, type: 'public' as const },
        { name: 'วันมาฆบูชา', date: `${year}-03-03`, type: 'public' as const },
        { name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์ (วันจักรี)', date: `${year}-04-06`, type: 'public' as const },
        { name: 'วันสงกรานต์', date: `${year}-04-13`, type: 'public' as const },
        { name: 'วันสงกรานต์', date: `${year}-04-14`, type: 'public' as const },
        { name: 'วันสงกรานต์', date: `${year}-04-15`, type: 'public' as const },
        { name: 'วันแรงงานแห่งชาติ', date: `${year}-05-01`, type: 'public' as const },
        { name: 'วันฉัตรมงคล', date: `${year}-05-04`, type: 'public' as const },
        { name: 'วันวิสาขบูชา', date: `${year}-05-31`, type: 'public' as const },
        { name: 'วันหยุดชดเชยวันวิสาขบูชา', date: `${year}-06-01`, type: 'public' as const },
        { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', date: `${year}-06-03`, type: 'public' as const },
        { name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (รัชกาลที่ 10)', date: `${year}-07-28`, type: 'public' as const },
        { name: 'วันอาสาฬหบูชา', date: `${year}-07-29`, type: 'public' as const },
        { name: 'วันเข้าพรรษา', date: `${year}-07-30`, type: 'public' as const },
        { name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ', date: `${year}-08-12`, type: 'public' as const },
        { name: 'วันนวมินทรมหาราช', date: `${year}-10-13`, type: 'public' as const },
        { name: 'วันปิยมหาราช', date: `${year}-10-23`, type: 'public' as const },
        { name: 'วันคล้ายวันพระบรมราชสมภพ รัชกาลที่ 9 / วันชาติ / วันพ่อแห่งชาติ', date: `${year}-12-05`, type: 'public' as const },
        { name: 'วันหยุดชดเชยวันพ่อแห่งชาติ', date: `${year}-12-07`, type: 'public' as const },
        { name: 'วันรัฐธรรมนูญ', date: `${year}-12-10`, type: 'public' as const },
        { name: 'วันสิ้นปี', date: `${year}-12-31`, type: 'public' as const },
      ];

      let insertedCount = 0;
      for (const h of thaiHolidays2026) {
        const existing = await db.getFirstAsync<any>('SELECT id FROM holidays WHERE date = ?', [h.date]);
        if (!existing) {
          await db.runAsync(
            'INSERT INTO holidays (name, date, type, is_recurring, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)',
            [h.name, h.date, h.type]
          );
          insertedCount++;
        }
      }
      return insertedCount;
    } catch (error) {
      console.error('Error preloading Thai holidays:', error);
      return 0;
    }
  };

  // ==========================================
  // LEAVES MANAGEMENT
  // ==========================================

  const getLeaves = async (year?: number, month?: number): Promise<LeaveRequest[]> => {
    try {
      const db = await getOrInitDb();
      let query = 'SELECT * FROM leaves';
      const params: any[] = [];

      if (year && month) {
        const monthStr = month.toString().padStart(2, '0');
        query += ' WHERE (start_date LIKE ? OR end_date LIKE ?)';
        params.push(`${year}-${monthStr}%`, `${year}-${monthStr}%`);
      } else if (year) {
        query += ' WHERE (start_date LIKE ? OR end_date LIKE ?)';
        params.push(`${year}-%`, `${year}-%`);
      }

      query += ' ORDER BY start_date DESC';
      const results = await db.getAllAsync<any>(query, params);

      return results.map((r) => ({
        id: r.id,
        leaveType: r.leave_type,
        startDate: r.start_date,
        endDate: r.end_date,
        durationDays: r.duration_days,
        durationType: r.duration_type,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
      }));
    } catch (error) {
      console.error('Error getting leaves:', error);
      return [];
    }
  };

  const saveLeave = async (leave: Omit<LeaveRequest, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync(
        `INSERT INTO leaves (leave_type, start_date, end_date, duration_days, duration_type, reason, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          leave.leaveType,
          leave.startDate,
          leave.endDate,
          leave.durationDays,
          leave.durationType || 'full_day',
          leave.reason || '',
          leave.status || 'approved',
        ]
      );
      return true;
    } catch (error) {
      console.error('Error saving leave:', error);
      return false;
    }
  };

  const updateLeave = async (id: number, leave: Partial<LeaveRequest>): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      const updateFields: string[] = [];
      const values: any[] = [];

      if (leave.leaveType !== undefined) {
        updateFields.push('leave_type = ?');
        values.push(leave.leaveType);
      }
      if (leave.startDate !== undefined) {
        updateFields.push('start_date = ?');
        values.push(leave.startDate);
      }
      if (leave.endDate !== undefined) {
        updateFields.push('end_date = ?');
        values.push(leave.endDate);
      }
      if (leave.durationDays !== undefined) {
        updateFields.push('duration_days = ?');
        values.push(leave.durationDays);
      }
      if (leave.durationType !== undefined) {
        updateFields.push('duration_type = ?');
        values.push(leave.durationType);
      }
      if (leave.reason !== undefined) {
        updateFields.push('reason = ?');
        values.push(leave.reason);
      }
      if (leave.status !== undefined) {
        updateFields.push('status = ?');
        values.push(leave.status);
      }

      if (updateFields.length === 0) return false;

      values.push(id);
      const query = `UPDATE leaves SET ${updateFields.join(', ')} WHERE id = ?`;
      await db.runAsync(query, values);
      return true;
    } catch (error) {
      console.error('Error updating leave:', error);
      return false;
    }
  };

  const deleteLeave = async (id: number): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync('DELETE FROM leaves WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting leave:', error);
      return false;
    }
  };

  // ==========================================
  // LEAVE QUOTAS & SUMMARY
  // ==========================================

  const DEFAULT_QUOTAS: Record<LeaveType, number> = {
    vacation: 6,
    sick: 30,
    personal: 3,
    other: 5,
  };

  const LEAVE_LABELS: Record<LeaveType, string> = {
    vacation: 'ลาพักร้อน (Vacation)',
    sick: 'ลาป่วย (Sick Leave)',
    personal: 'ลากิจ (Personal Leave)',
    other: 'ลาอื่นๆ (Other)',
  };

  const getLeaveQuotas = async (year: number): Promise<LeaveQuota[]> => {
    try {
      const db = await getOrInitDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM leave_quotas WHERE year = ?',
        [year]
      );

      const quotasMap: Partial<Record<LeaveType, number>> = {};
      results.forEach((r) => {
        quotasMap[r.leave_type as LeaveType] = r.quota_days;
      });

      const allTypes: LeaveType[] = ['vacation', 'sick', 'personal', 'other'];
      return allTypes.map((type) => ({
        year,
        leaveType: type,
        quotaDays: quotasMap[type] !== undefined ? quotasMap[type]! : DEFAULT_QUOTAS[type],
      }));
    } catch (error) {
      console.error('Error getting leave quotas:', error);
      return [];
    }
  };

  const saveLeaveQuota = async (year: number, leaveType: LeaveType, quotaDays: number): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO leave_quotas (year, leave_type, quota_days)
         VALUES (?, ?, ?)`,
        [year, leaveType, quotaDays]
      );
      return true;
    } catch (error) {
      console.error('Error saving leave quota:', error);
      return false;
    }
  };

  const getLeaveSummary = async (year: number): Promise<LeaveSummary[]> => {
    try {
      const quotas = await getLeaveQuotas(year);
      const leaves = await getLeaves(year);

      // Sum approved leaves per type
      const usedMap: Record<LeaveType, number> = {
        vacation: 0,
        sick: 0,
        personal: 0,
        other: 0,
      };

      leaves.forEach((l) => {
        if (l.status === 'approved' && usedMap[l.leaveType] !== undefined) {
          usedMap[l.leaveType] += Number(l.durationDays || 0);
        }
      });

      return quotas.map((q) => {
        const used = usedMap[q.leaveType] || 0;
        const total = q.quotaDays;
        return {
          leaveType: q.leaveType,
          label: LEAVE_LABELS[q.leaveType],
          usedDays: used,
          quotaDays: total,
          remainingDays: Math.max(0, total - used),
        };
      });
    } catch (error) {
      console.error('Error getting leave summary:', error);
      return [];
    }
  };

  const checkDateStatus = async (dateStr: string): Promise<{
    isHoliday: boolean;
    holidayName?: string;
    holidayType?: HolidayType;
    isLeave: boolean;
    leaveType?: LeaveType;
    leaveReason?: string;
    isWFH: boolean;
    isRegularOff: boolean;
  }> => {
    try {
      const db = await getOrInitDb();
      // Check holiday
      const holiday = await db.getFirstAsync<any>(
        'SELECT id, name, type FROM holidays WHERE date = ?',
        [dateStr]
      );

      // Check leave
      const leave = await db.getFirstAsync<any>(
        'SELECT leave_type, reason FROM leaves WHERE start_date <= ? AND end_date >= ? AND status = "approved"',
        [dateStr, dateStr]
      );

      const hType = holiday?.type as HolidayType | undefined;

      return {
        isHoliday: !!holiday && hType !== 'wfh' && hType !== 'regular_off',
        holidayName: holiday?.name,
        holidayType: hType,
        isLeave: !!leave,
        leaveType: leave?.leave_type,
        leaveReason: leave?.reason,
        isWFH: hType === 'wfh',
        isRegularOff: hType === 'regular_off',
      };
    } catch (error) {
      console.error('Error checking date status:', error);
      return { isHoliday: false, isLeave: false, isWFH: false, isRegularOff: false };
    }
  };

  const setDayHolidayStatus = async (
    dateStr: string,
    type: HolidayType,
    name: string
  ): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync('DELETE FROM holidays WHERE date = ?', [dateStr]);
      await db.runAsync(
        `INSERT INTO holidays (name, date, type, is_recurring, created_at)
         VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [name, dateStr, type]
      );
      return true;
    } catch (error) {
      console.error('Error setting day holiday status:', error);
      return false;
    }
  };

  const clearDayHolidayStatus = async (dateStr: string): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync('DELETE FROM holidays WHERE date = ?', [dateStr]);
      await db.runAsync('DELETE FROM leaves WHERE start_date <= ? AND end_date >= ?', [dateStr, dateStr]);
      return true;
    } catch (error) {
      console.error('Error clearing day holiday status:', error);
      return false;
    }
  };

  // ----------------------------------------------------
  // ACTIVITIES & APPOINTMENTS (High-Performance Engine)
  // ----------------------------------------------------
  const getActivitiesForMonth = async (year: number, month: number): Promise<Activity[]> => {
    try {
      const db = await getOrInitDb();
      const monthStr = String(month).padStart(2, '0');
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`;

      const rows = await db.getAllAsync<any>(
        'SELECT * FROM activities WHERE date >= ? AND date <= ? ORDER BY date ASC, is_all_day DESC, start_time ASC, id ASC',
        [startDate, endDate]
      );

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        date: r.date,
        startTime: r.start_time || undefined,
        endTime: r.end_time || undefined,
        isAllDay: r.is_all_day === 1,
        category: r.category || 'general',
        location: r.location || undefined,
        note: r.note || undefined,
        reminderMinutes:
          r.reminder_minutes !== null && r.reminder_minutes !== undefined
            ? Number(r.reminder_minutes)
            : null,
        notificationId: r.notification_id || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching activities for month:', error);
      return [];
    }
  };

  const getActivitiesForDate = async (date: string): Promise<Activity[]> => {
    try {
      const db = await getOrInitDb();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM activities WHERE date = ? ORDER BY is_all_day DESC, start_time ASC, id ASC',
        [date]
      );

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        date: r.date,
        startTime: r.start_time || undefined,
        endTime: r.end_time || undefined,
        isAllDay: r.is_all_day === 1,
        category: r.category || 'general',
        location: r.location || undefined,
        note: r.note || undefined,
        reminderMinutes:
          r.reminder_minutes !== null && r.reminder_minutes !== undefined
            ? Number(r.reminder_minutes)
            : null,
        notificationId: r.notification_id || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching activities for date:', error);
      return [];
    }
  };

  const saveActivity = async (
    activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> => {
    try {
      const db = await getOrInitDb();
      const result = await db.runAsync(
        `INSERT INTO activities 
         (title, date, start_time, end_time, is_all_day, category, location, note, reminder_minutes, notification_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          activity.title,
          activity.date,
          activity.startTime || null,
          activity.endTime || null,
          activity.isAllDay ? 1 : 0,
          activity.category || 'general',
          activity.location || null,
          activity.note || null,
          activity.reminderMinutes !== undefined && activity.reminderMinutes !== null
            ? activity.reminderMinutes
            : null,
          activity.notificationId || null,
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  };

  const updateActivity = async (id: number, activity: Partial<Activity>): Promise<void> => {
    try {
      const db = await getOrInitDb();
      const fields: string[] = [];
      const values: any[] = [];

      if (activity.title !== undefined) {
        fields.push('title = ?');
        values.push(activity.title);
      }
      if (activity.date !== undefined) {
        fields.push('date = ?');
        values.push(activity.date);
      }
      if (activity.startTime !== undefined) {
        fields.push('start_time = ?');
        values.push(activity.startTime || null);
      }
      if (activity.endTime !== undefined) {
        fields.push('end_time = ?');
        values.push(activity.endTime || null);
      }
      if (activity.isAllDay !== undefined) {
        fields.push('is_all_day = ?');
        values.push(activity.isAllDay ? 1 : 0);
      }
      if (activity.category !== undefined) {
        fields.push('category = ?');
        values.push(activity.category);
      }
      if (activity.location !== undefined) {
        fields.push('location = ?');
        values.push(activity.location || null);
      }
      if (activity.note !== undefined) {
        fields.push('note = ?');
        values.push(activity.note || null);
      }
      if (activity.reminderMinutes !== undefined) {
        fields.push('reminder_minutes = ?');
        values.push(activity.reminderMinutes);
      }
      if (activity.notificationId !== undefined) {
        fields.push('notification_id = ?');
        values.push(activity.notificationId || null);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      await db.runAsync(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`, values);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  const deleteActivity = async (id: number): Promise<void> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  };

  // ----------------------------------------------------
  // TASKS & NOTES (Google Keep Hybrid Engine)
  // ----------------------------------------------------
  const mapTaskNoteRow = (r: any): TaskNote => {
    let items: any[] = [];
    if (r.items_json) {
      try {
        items = typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json;
      } catch (e) {
        items = [];
      }
    }
    return {
      id: r.id,
      title: r.title,
      content: r.content || undefined,
      type: r.type || 'checklist',
      items: Array.isArray(items) ? items : [],
      isCompleted: r.is_completed === 1,
      color: r.color || 'default',
      isPinned: r.is_pinned === 1,
      date: r.date || undefined,
      reminderTime: r.reminder_time || undefined,
      notificationId: r.notification_id || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  };

  const getTasksNotes = async (filter?: {
    date?: string;
    completed?: boolean;
    search?: string;
    pinnedOnly?: boolean;
  }): Promise<TaskNote[]> => {
    try {
      const db = await getOrInitDb();
      let query = 'SELECT * FROM tasks_notes WHERE 1=1';
      const params: any[] = [];

      if (filter?.date) {
        query += ' AND (date = ? OR date IS NULL)';
        params.push(filter.date);
      }
      if (filter?.completed !== undefined) {
        query += ' AND is_completed = ?';
        params.push(filter.completed ? 1 : 0);
      }
      if (filter?.pinnedOnly) {
        query += ' AND is_pinned = 1';
      }
      if (filter?.search && filter.search.trim()) {
        const s = `%${filter.search.trim()}%`;
        query += ' AND (title LIKE ? OR content LIKE ? OR items_json LIKE ?)';
        params.push(s, s, s);
      }

      query += ' ORDER BY is_pinned DESC, is_completed ASC, updated_at DESC, id DESC';

      const rows = await db.getAllAsync<any>(query, params);
      return rows.map(mapTaskNoteRow);
    } catch (error) {
      console.error('Error fetching tasks & notes:', error);
      return [];
    }
  };

  const getTodayTasksNotes = async (): Promise<TaskNote[]> => {
    try {
      const db = await getOrInitDb();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM tasks_notes ORDER BY is_pinned DESC, is_completed ASC, updated_at DESC, id DESC'
      );
      return rows.map(mapTaskNoteRow);
    } catch (error) {
      console.error('Error fetching today tasks & notes:', error);
      return [];
    }
  };

  const saveTaskNote = async (
    taskNote: Omit<TaskNote, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> => {
    try {
      const db = await getOrInitDb();
      const itemsJson = JSON.stringify(taskNote.items || []);
      const result = await db.runAsync(
        `INSERT INTO tasks_notes 
         (title, content, type, items_json, is_completed, color, is_pinned, date, reminder_time, notification_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          taskNote.title,
          taskNote.content || null,
          taskNote.type || 'checklist',
          itemsJson,
          taskNote.isCompleted ? 1 : 0,
          taskNote.color || 'default',
          taskNote.isPinned ? 1 : 0,
          taskNote.date || null,
          taskNote.reminderTime || null,
          taskNote.notificationId || null,
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving task & note:', error);
      throw error;
    }
  };

  const updateTaskNote = async (id: number, data: Partial<TaskNote>): Promise<void> => {
    try {
      const db = await getOrInitDb();
      const fields: string[] = [];
      const values: any[] = [];

      if (data.title !== undefined) {
        fields.push('title = ?');
        values.push(data.title);
      }
      if (data.content !== undefined) {
        fields.push('content = ?');
        values.push(data.content || null);
      }
      if (data.type !== undefined) {
        fields.push('type = ?');
        values.push(data.type);
      }
      if (data.items !== undefined) {
        fields.push('items_json = ?');
        values.push(JSON.stringify(data.items));
      }
      if (data.isCompleted !== undefined) {
        fields.push('is_completed = ?');
        values.push(data.isCompleted ? 1 : 0);
      }
      if (data.color !== undefined) {
        fields.push('color = ?');
        values.push(data.color);
      }
      if (data.isPinned !== undefined) {
        fields.push('is_pinned = ?');
        values.push(data.isPinned ? 1 : 0);
      }
      if (data.date !== undefined) {
        fields.push('date = ?');
        values.push(data.date || null);
      }
      if (data.reminderTime !== undefined) {
        fields.push('reminder_time = ?');
        values.push(data.reminderTime || null);
      }
      if (data.notificationId !== undefined) {
        fields.push('notification_id = ?');
        values.push(data.notificationId || null);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      await db.runAsync(`UPDATE tasks_notes SET ${fields.join(', ')} WHERE id = ?`, values);
    } catch (error) {
      console.error('Error updating task & note:', error);
      throw error;
    }
  };

  const toggleTaskNoteCompleted = async (id: number, isCompleted: boolean): Promise<void> => {
    try {
      const db = await getOrInitDb();
      const row = await db.getFirstAsync<any>('SELECT * FROM tasks_notes WHERE id = ?', [id]);
      if (row) {
        let itemsJson = row.items_json;
        if (row.type === 'checklist' && row.items_json) {
          try {
            const items = JSON.parse(row.items_json);
            const updatedItems = items.map((it: any) => ({ ...it, isDone: isCompleted }));
            itemsJson = JSON.stringify(updatedItems);
          } catch (e) {}
        }
        await db.runAsync(
          'UPDATE tasks_notes SET is_completed = ?, items_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [isCompleted ? 1 : 0, itemsJson, id]
        );
      }
    } catch (error) {
      console.error('Error toggling task & note completed:', error);
      throw error;
    }
  };

  const toggleChecklistItem = async (noteId: number, itemId: string): Promise<void> => {
    try {
      const db = await getOrInitDb();
      const row = await db.getFirstAsync<any>('SELECT * FROM tasks_notes WHERE id = ?', [noteId]);
      if (row && row.items_json) {
        const items = JSON.parse(row.items_json);
        const updatedItems = items.map((it: any) =>
          it.id === itemId ? { ...it, isDone: !it.isDone } : it
        );
        const allDone = updatedItems.length > 0 && updatedItems.every((it: any) => it.isDone);
        await db.runAsync(
          'UPDATE tasks_notes SET items_json = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [JSON.stringify(updatedItems), allDone ? 1 : 0, noteId]
        );
      }
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      throw error;
    }
  };

  const deleteTaskNote = async (id: number): Promise<void> => {
    try {
      const db = await getOrInitDb();
      await db.runAsync('DELETE FROM tasks_notes WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting task & note:', error);
      throw error;
    }
  };

  // ----------------------------------------------------
  // BACKUP & RESTORE
  // ----------------------------------------------------
  const exportBackupData = async (): Promise<BackupPayload> => {
    const db = await getOrInitDb();

    // 1. Time entries
    const timeEntriesRaw = await db.getAllAsync<any>('SELECT * FROM time_entries ORDER BY date ASC');
    const timeEntries: TimeEntry[] = timeEntriesRaw.map((r) => ({
      id: r.id,
      date: r.date,
      clockIn: r.clock_in,
      clockOut: r.clock_out,
      reason: r.reason,
      regularHours: r.regular_hours || 0,
      overtimeHours: r.overtime_hours || 0,
      lateArrivalHours: r.late_arrival_hours || 0,
      earlyLeaveHours: r.early_leave_hours || 0,
      overtimeUsed: r.overtime_used === 1,
      lateArrivalUsed: r.late_arrival_used === 1,
      earlyLeaveUsed: r.early_leave_used === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // 2. Work schedules
    const schedulesRaw = await db.getAllAsync<any>('SELECT * FROM work_schedules ORDER BY year ASC, month ASC');
    const workSchedules: WorkSchedule[] = schedulesRaw.map((r) => ({
      id: r.id,
      month: r.month,
      year: r.year,
      startTime: r.start_time,
      endTime: r.end_time,
      workDays: r.work_days,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // 3. Holidays
    const holidaysRaw = await db.getAllAsync<any>('SELECT * FROM holidays ORDER BY date ASC');
    const holidays: Holiday[] = holidaysRaw.map((r) => ({
      id: r.id,
      name: r.name,
      date: r.date,
      type: r.type as HolidayType,
      isRecurring: r.is_recurring === 1,
      createdAt: r.created_at,
    }));

    // 4. Leaves
    const leavesRaw = await db.getAllAsync<any>('SELECT * FROM leaves ORDER BY start_date ASC');
    const leaves: LeaveRequest[] = leavesRaw.map((r) => ({
      id: r.id,
      leaveType: r.leave_type as LeaveType,
      startDate: r.start_date,
      endDate: r.end_date,
      durationDays: r.duration_days,
      durationType: r.duration_type,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    }));

    // 5. Leave quotas
    const quotasRaw = await db.getAllAsync<any>('SELECT * FROM leave_quotas ORDER BY year ASC');
    const leaveQuotas: LeaveQuota[] = quotasRaw.map((r) => ({
      id: r.id,
      year: r.year,
      leaveType: r.leave_type as LeaveType,
      quotaDays: r.quota_days,
    }));

    // 6. Activities
    const activitiesRaw = await db.getAllAsync<any>('SELECT * FROM activities ORDER BY date ASC, start_time ASC');
    const activities: Activity[] = activitiesRaw.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      startTime: r.start_time || undefined,
      endTime: r.end_time || undefined,
      isAllDay: r.is_all_day === 1,
      category: r.category || 'general',
      location: r.location || undefined,
      note: r.note || undefined,
      reminderMinutes:
        r.reminder_minutes !== null && r.reminder_minutes !== undefined
          ? Number(r.reminder_minutes)
          : null,
      notificationId: r.notification_id || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // 7. Tasks & Notes
    const tasksNotesRaw = await db.getAllAsync<any>('SELECT * FROM tasks_notes ORDER BY created_at ASC');
    const tasksNotes: TaskNote[] = tasksNotesRaw.map(mapTaskNoteRow);

    return {
      metadata: {
        appName: 'TimeTrackOT',
        appVersion: '1.4.0',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        totalRecords: {
          timeEntries: timeEntries.length,
          workSchedules: workSchedules.length,
          holidays: holidays.length,
          leaves: leaves.length,
          leaveQuotas: leaveQuotas.length,
          activities: activities.length,
          tasksNotes: tasksNotes.length,
        },
      },
      data: {
        timeEntries,
        workSchedules,
        holidays,
        leaves,
        leaveQuotas,
        activities,
        tasksNotes,
      },
    };
  };

  const importBackupData = async (
    payload: BackupPayload,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<RestoreResult> => {
    const db = await getOrInitDb();

    if (!payload?.data) {
      throw new Error('โครงสร้างไฟล์สำรองข้อมูลไม่ถูกต้อง (Invalid backup data)');
    }

    const {
      timeEntries = [],
      workSchedules = [],
      holidays = [],
      leaves = [],
      leaveQuotas = [],
      activities = [],
      tasksNotes = [],
    } = payload.data;

    await db.withTransactionAsync(async () => {
      if (mode === 'replace') {
        await db.runAsync('DELETE FROM time_entries;');
        await db.runAsync('DELETE FROM work_schedules;');
        await db.runAsync('DELETE FROM holidays;');
        await db.runAsync('DELETE FROM leaves;');
        await db.runAsync('DELETE FROM leave_quotas;');
        await db.runAsync('DELETE FROM activities;');
      }

      // 1. Insert time_entries
      for (const entry of timeEntries) {
        if (!entry.date) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO time_entries
           (date, clock_in, clock_out, reason, regular_hours, overtime_hours, late_arrival_hours, early_leave_hours, overtime_used, late_arrival_used, early_leave_used, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            entry.date,
            entry.clockIn || null,
            entry.clockOut || null,
            entry.reason || null,
            entry.regularHours || 0,
            entry.overtimeHours || 0,
            entry.lateArrivalHours || 0,
            entry.earlyLeaveHours || 0,
            entry.overtimeUsed ? 1 : 0,
            entry.lateArrivalUsed ? 1 : 0,
            entry.earlyLeaveUsed ? 1 : 0,
          ]
        );
      }

      // 2. Insert work_schedules
      for (const schedule of workSchedules) {
        if (!schedule.month || !schedule.year) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO work_schedules
           (month, year, start_time, end_time, work_days, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            Number(schedule.month),
            Number(schedule.year),
            schedule.startTime || '08:00',
            schedule.endTime || '17:00',
            schedule.workDays || 22,
          ]
        );
      }

      // 3. Insert holidays
      for (const holiday of holidays) {
        if (!holiday.date || !holiday.name) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO holidays
           (name, date, type, is_recurring, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            holiday.name,
            holiday.date,
            holiday.type || 'public',
            holiday.isRecurring ? 1 : 0,
          ]
        );
      }

      // 4. Insert leaves
      for (const leave of leaves) {
        if (!leave.startDate || !leave.endDate) continue;
        await db.runAsync(
          `INSERT INTO leaves
           (leave_type, start_date, end_date, duration_days, duration_type, reason, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            leave.leaveType || 'vacation',
            leave.startDate,
            leave.endDate,
            Number(leave.durationDays) || 1,
            leave.durationType || 'full_day',
            leave.reason || null,
            leave.status || 'approved',
          ]
        );
      }

      // 5. Insert leave_quotas
      for (const quota of leaveQuotas) {
        if (!quota.year || !quota.leaveType) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO leave_quotas
           (year, leave_type, quota_days)
           VALUES (?, ?, ?)`,
          [Number(quota.year), quota.leaveType, Number(quota.quotaDays) || 0]
        );
      }

      // 6. Insert activities
      for (const act of activities) {
        if (!act.title || !act.date) continue;
        await db.runAsync(
          `INSERT INTO activities
           (title, date, start_time, end_time, is_all_day, category, location, note, reminder_minutes, notification_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            act.title,
            act.date,
            act.startTime || null,
            act.endTime || null,
            act.isAllDay ? 1 : 0,
            act.category || 'general',
            act.location || null,
            act.note || null,
            act.reminderMinutes !== undefined && act.reminderMinutes !== null
              ? act.reminderMinutes
              : null,
            act.notificationId || null,
          ]
        );
      }

      // 7. Insert tasks_notes
      for (const tn of tasksNotes) {
        if (!tn.title) continue;
        await db.runAsync(
          `INSERT INTO tasks_notes
           (title, content, type, items_json, is_completed, color, is_pinned, date, reminder_time, notification_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            tn.title,
            tn.content || null,
            tn.type || 'checklist',
            JSON.stringify(tn.items || []),
            tn.isCompleted ? 1 : 0,
            tn.color || 'default',
            tn.isPinned ? 1 : 0,
            tn.date || null,
            tn.reminderTime || null,
            tn.notificationId || null,
          ]
        );
      }
    });

    return {
      success: true,
      timeEntriesCount: timeEntries.length,
      workSchedulesCount: workSchedules.length,
      holidaysCount: holidays.length,
      leavesCount: leaves.length,
      leaveQuotasCount: leaveQuotas.length,
      activitiesCount: activities.length,
      tasksNotesCount: tasksNotes.length,
    };
  };

  const clearAllDatabaseData = async (): Promise<boolean> => {
    try {
      const db = await getOrInitDb();
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM time_entries;');
        await db.runAsync('DELETE FROM work_schedules;');
        await db.runAsync('DELETE FROM holidays;');
        await db.runAsync('DELETE FROM leaves;');
        await db.runAsync('DELETE FROM leave_quotas;');
        await db.runAsync('DELETE FROM activities;');
        await db.runAsync('DELETE FROM tasks_notes;');
      });
      return true;
    } catch (error) {
      console.error('Error clearing database data:', error);
      return false;
    }
  };

  return useMemo(
    () => ({
      db: globalDb,
      isReady,
      getWorkSchedule,
      getWorkSchedulesForYear,
      saveWorkSchedule,
      saveWorkScheduleForYear,
      getTimeEntry,
      saveTimeEntry,
      getTimeEntriesForPeriod,
      deleteTimeEntry,
      updateTimeEntry,
      getAllTimeEntries,
      // Holidays
      getHolidays,
      saveHoliday,
      updateHoliday,
      deleteHoliday,
      preloadThaiHolidays,
      setDayHolidayStatus,
      clearDayHolidayStatus,
      // Leaves
      getLeaves,
      saveLeave,
      updateLeave,
      deleteLeave,
      // Quotas & Summary
      getLeaveQuotas,
      saveLeaveQuota,
      getLeaveSummary,
      checkDateStatus,
      // Activities & Appointments
      getActivitiesForMonth,
      getActivitiesForDate,
      saveActivity,
      updateActivity,
      deleteActivity,
      // Tasks & Notes (Google Keep Hybrid)
      getTasksNotes,
      getTodayTasksNotes,
      saveTaskNote,
      updateTaskNote,
      toggleTaskNoteCompleted,
      toggleChecklistItem,
      deleteTaskNote,
      // Backup & Restore
      exportBackupData,
      importBackupData,
      clearAllDatabaseData,
    }),
    [isReady]
  );
};


