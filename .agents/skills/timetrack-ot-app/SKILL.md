---
name: timetrack-ot-app
description: >-
  Master reference and technical blueprint for TimeTrack OT: a high-performance React Native / Expo
  work time tracking and overtime (OT) management mobile app with Thai Buddhist Era localization,
  SQLite database with WAL mode, morning/evening OT engine, BNA UI components, and leave management.
---

# TimeTrack OT — Architecture, Business Logic & Engineering Guide

A comprehensive architectural and engineering reference for the **TimeTrack OT** application. Use this skill when developing, debugging, extending, or maintaining the TimeTrack OT codebase.

---

## 🏛️ 1. Tech Stack & Architecture

- **Core Framework**: React Native 0.81 + Expo SDK 54 (New Architecture / Hermes Bytecode).
- **Navigation & Routing**: Expo Router v6 (File-based routing with native tab bar and stacks).
- **Local Database**: Expo SQLite v16 (WAL journal mode, target indexes, singleton pattern).
- **UI & Design System**: BNA UI (`@/components/ui/*`), `@/theme/*`, Lucide React Native icons.
- **Animation & Motion**: `react-native-reanimated`, `expo-haptics`.
- **Localization**: Thai Buddhist Era (พ.ศ. = ค.ศ. + 543), Thai day/month localization, Sarabun Google Font.

---

## ⏱️ 2. Core Time Calculation & OT Engine (`hooks/useTimeCalculation.ts`)

### Overtime & Working Hours Formulas
The calculation engine strictly differentiates between **Morning Overtime (OT เช้า)**, **Shift Regular Hours (เวลาทำงานปกติ)**, and **Evening Overtime (OT เย็น)**:

```ts
// 1. Morning Overtime: Worked BEFORE scheduled start time (e.g. 07:30 to 08:00 = 0.50 ชม.)
const morningOT = Math.max(0, Math.min(actualClockOut, scheduledStart) - actualClockIn);

// 2. Regular Shift Hours: Worked WITHIN the scheduled shift window (e.g. 08:00 to 17:00 = 9.00 ชม.)
const effectiveStart = Math.max(actualClockIn, scheduledStart);
const effectiveEnd = Math.min(actualClockOut, scheduledEnd);
const regularHours = Math.max(0, effectiveEnd - effectiveStart);

// 3. Evening/Night Overtime: Worked AFTER scheduled end time (e.g. 17:00 to 19:00 = 2.00 ชม.)
const eveningOT = Math.max(0, actualClockOut - Math.max(actualClockIn, scheduledEnd));

// Total Overtime
const overtimeHours = Number((morningOT + eveningOT).toFixed(2));
```

### Late Arrival & Early Departure
- **Late Arrival**: `Math.max(0, actualClockIn - scheduledStart)` (only if clocked in after start).
- **Early Departure**: `Math.max(0, scheduledEnd - actualClockOut)` (only if clocked out before end).

### OT Balance vs. Actual Work Time
- **Total Logged Work Time (เวลาทำงานจริงทั้งเดือน)**: `totalRegularHours + totalOvertimeHours` (Audit log of actual body hours worked; **NEVER** deduct used OT from this total).
- **Net Remaining OT (OT คงเหลือสุทธิ)**: `Math.max(0, totalOvertimeHours - totalOvertimeUsed)` (Available OT balance after compensation/claims).

---

## 🗄️ 3. Database Architecture & SQLite Performance (`hooks/useDatabase.ts`)

### Singleton Connection & WAL Mode
```ts
const database = await SQLite.openDatabaseAsync('timetracker.db');
await database.execAsync('PRAGMA journal_mode = WAL;');
```

### Table Schemas & Target Indexes
```sql
-- Work Schedules
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

-- Time Entries
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

-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'public',
  is_recurring INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leaves
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

-- Leave Quotas
CREATE TABLE IF NOT EXISTS leave_quotas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  leave_type TEXT NOT NULL,
  quota_days REAL NOT NULL,
  UNIQUE(year, leave_type)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_work_schedules_month_year ON work_schedules(month, year);
```

### High-Performance Batch Queries
Never execute waterfall sequential queries in loops (e.g. `for (let month = 1; month <= 12; month++)`).
Always use parallel batch queries:
```ts
const [yearSchedules, allYearEntries] = await Promise.all([
  getWorkSchedulesForYear(currentYear),
  getTimeEntriesForPeriod(`${currentYear}-01-01`, `${currentYear}-12-31`),
]);
```

---

## 🎨 4. UI/UX Guidelines & BNA UI Integration

### BNA UI Components Used
- `Card`: Container surface for metrics, period groups, and accordions.
- `Button`: Primary, outline, destructive, and icon buttons.
- `Input`: Single-line inputs and textareas (`type="textarea"`).
- `Accordion`: AccordionItem, AccordionTrigger, AccordionContent for hierarchical lists.
- `AlertDialog`: Destructive confirmation modals (with symmetrical 50%/50% width and `confirmVariant="destructive"`).
- `BottomSheet`: Modal bottom sheets for quick actions, holiday editing, and quota edits.
- `Toast`: Global feedback notification (`success`, `warning`, `error`).

### Screen Layout Patterns

#### 1. Dashboard (`app/index.tsx`)
- **2x2 Balanced Stats Grid**:
  - `OT คงเหลือทั้งปี`: Net OT for the year (`totalOT - totalOTUsed`).
  - `มาสายเดือนนี้`: Net uncompensated late count (`lateCount - lateUsedCount`).
  - `ทำงานรวมเดือนนี้`: Month regular hours (`monthWorkHours`).
  - `OT รวมเดือนนี้`: Net OT remaining for the month (`monthOTHours - monthOTUsed`).
- **Today's Status Card**: Displays clock in, clock out, regular hours, late time, and OT hours.
- **Schedule Card**: Shows current month's standard schedule (`08:00 - 17:00`).

#### 2. Reports (`app/reports.tsx`)
- **3-Tier Monthly Summary Card (Blue)**:
  - `ชั่วโมงปกติ`: Regular hours.
  - `ชั่วโมง OT สะสม`: Gross earned OT.
    - `└ ใช้แล้ว`: Compensated/used OT.
    - `└ คงเหลือสุทธิ`: Net available OT (highlighted in `#86efac`).
  - `ชั่วโมงมาสาย`: Gross late time.
    - `└ ชดเชย/ใช้แล้ว`: Compensated late.
    - `└ สายคงค้าง`: Outstanding late time.
  - `รวมเวลาทำงานจริง`: Gross actual hours (`regularHours + overtimeHours`).
- **Quick Filter Pills**: `ทั้งหมด (N)` | `⚡ มี OT (N)` | `⚠️ มาสาย (N)` | `🏃 กลับก่อน (N)`
- **Monthly Summary Image Sharing (`react-native-view-shot` + `expo-sharing`)**:
  - Captures the 3-Tier summary card into a crisp high-res PNG image with title, breakdown, and TimeTrack OT branding.
  - Centered compact pill button: `แชร์สรุปเวลาเดือน[ชื่อเดือน]`.
- **Compact Monthly Timeline List**:
  - Shows chronologically sorted daily cards (`date`, `dayOfWeek in Thai`, `total hours badge`, `clock in/out`).
  - Mini badges: `ปกติ X ชม.`, `⚡ OT Y ชม.`, `⚠️ สาย Z ชม.`, `🏃 ก่อน W ชม.`.
  - Quick action toggles: `[ ✓ ใช้ OT แล้ว ]`, `[ ✓ ชดเชยสายแล้ว ]`, `[ ✓ ชดเชยกลับก่อนแล้ว ]` with optimistic UI updates.
  - Tap card to open Detail Modal with full breakdown and edit shortcut.

#### 3. Holidays & Leaves (`app/leaves.tsx`)
- **Interactive Calendar**: Custom date selector with Thai Buddhist Year banner.
- **Visual Calendar Image Sharing (`react-native-view-shot` + `expo-sharing`)**:
  - Captures the exact interactive calendar grid into a crisp high-res PNG image.
  - Includes Month/Year title, day status tags (WFH, Day Off, Leaves, Holidays), color legend, and `TimeTrack OT` branding footer.
  - Native share sheet integration to send directly to LINE / Facebook / Files / Photos.
- **2-Accordion Split**:
  - `📅 รายการในเดือนนี้` (Default Open): Shows WFH, Day Off, Leaves, and Month Holidays with tap-to-edit ✏️ and delete 🗑️.
  - `🏛️ วันหยุดประจำปี พ.ศ. 2569` (Collapsible): Preload Thai holidays button + add holiday button + annual list with tap-to-edit.
- **Destructive Confirmation**: Deleting or clearing day status is protected by `AlertDialog`.

---

## 🚀 5. Performance Best Practices

1. **Database-First Hydration**: Prefer persisted values from database over recalculating on every render, but recalculate dynamically if missing.
2. **In-Memory Filtering**: Fetch month data in one query, filter period slices in memory.
3. **Optimistic State Updates**: Update local React state immediately on user action before background DB write finishes.
4. **Haptic Feedback**: Trigger `Haptics.impactAsync` on button presses, toggles, and modals for tactile response.

---

## 💾 6. Backup & Restore Architecture (`hooks/useDatabase.ts` & `app/settings.tsx`)

- **JSON Payload Format (`BackupPayload`)**: Contains `metadata` (appName, appVersion, schemaVersion, exportedAt, totalRecords) and `data` (timeEntries, workSchedules, holidays, leaves, leaveQuotas).
- **Export Flow**: `exportBackupData()` $\rightarrow$ `FileSystem.writeAsStringAsync` to cache $\rightarrow$ `Sharing.shareAsync` to Google Drive / iCloud / LINE / Email.
- **Restore Flow**: `DocumentPicker.getDocumentAsync` $\rightarrow$ `FileSystem.readAsStringAsync` $\rightarrow$ JSON validation $\rightarrow$ `AlertDialog` prompt (Clean Replace vs Merge) $\rightarrow$ `importBackupData()` inside `db.withTransactionAsync`.

