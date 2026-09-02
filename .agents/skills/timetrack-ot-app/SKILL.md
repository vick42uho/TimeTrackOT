---
name: timetrack-ot-app
description: >-
  Master reference and technical blueprint for TimeTrack OT: a high-performance React Native / Expo
  work time tracking and overtime (OT) management mobile app with Thai Buddhist Era localization,
  SQLite database with WAL mode, morning/evening OT engine, BNA UI components, local background notifications,
  and leave & activity management.
---

# TimeTrack OT — Architecture, Business Logic & Engineering Guide

A comprehensive architectural and engineering reference for the **TimeTrack OT** application. Use this skill when developing, debugging, extending, or maintaining the TimeTrack OT codebase.

---

## 1. Tech Stack & Architecture

- **Core Framework**: React Native 0.81 + Expo SDK 54 (New Architecture / Hermes Bytecode).
- **Navigation & Routing**: Expo Router v6 (File-based routing with tab bar using `router.replace` to prevent memory leaks and screen stack accumulation).
- **Local Database**: Expo SQLite v16 (WAL journal mode, target composite indexes, singleton pattern, bulk transaction safety).
- **UI & Design System**: BNA UI (`@/components/ui/*`), `@/theme/*`, Lucide React Native vector icons. (Strict policy: Zero emojis in app code).
- **Local Notification Engine**: Modular `expo-notifications`, Android Notification Channel (`activity-reminders`) with `AndroidImportance.MAX` and public lockscreen visibility for background alerts when the app is closed.
- **Haptic Engine**: Configurable `useHaptics` hook with persistent storage, defaulted to OFF to eliminate unwanted touch vibrations, toggleable in Settings.
- **Localization**: Thai Buddhist Era (พ.ศ. = ค.ศ. + 543), Thai day/month localization, Sarabun Google Font.
- **Data Privacy**: 100% Offline, local-only SQLite storage with JSON Export/Import capabilities.

---

## 2. Core Time Calculation & OT Engine (`hooks/useTimeCalculation.ts`)

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

## 3. Database Architecture & SQLite Performance (`hooks/useDatabase.ts`)

### Singleton Connection & WAL Mode
```ts
const database = await SQLite.openDatabaseAsync('timetracker.db');
await database.execAsync(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = -2000;
`);
```

### Table Schemas & Target Indexes
```sql
-- Work Schedules (Monthly & Annual Shifts)
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

-- Time Entries (Daily Clock In/Out)
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

-- Holidays & WFH Days
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

-- Daily Activities & Appointments
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_all_day INTEGER DEFAULT 1,
  start_time TEXT,
  end_time TEXT,
  reminder_minutes INTEGER,
  location TEXT,
  note TEXT,
  notification_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_work_schedules_month_year ON work_schedules(month, year);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
```

### Annual Schedule Bulk Save Engine
When the user configures standard hours across an entire year, it executes in an atomic transaction:
```ts
export const saveYearlyWorkSchedule = async (
  year: number,
  startTime: string,
  endTime: string,
  workDays: number = 22
): Promise<void> => {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let month = 1; month <= 12; month++) {
      await db.runAsync(
        `INSERT INTO work_schedules (month, year, start_time, end_time, work_days, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(month, year) DO UPDATE SET
           start_time = excluded.start_time,
           end_time = excluded.end_time,
           work_days = excluded.work_days,
           updated_at = CURRENT_TIMESTAMP`,
        [month, year, startTime, endTime, workDays]
      );
    }
  });
};
```

---

## 4. Background Notification Engine (`services/notificationService.ts`)

For local reminders to alert the user even when the app is completely closed/killed:
1. **`app.json` Configuration**:
   - Plugin: `["expo-notifications", { "icon": "./assets/images/timetrack-icon.png", "color": "#2563EB", "defaultChannel": "activity-reminders" }]`
   - Permissions: `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `VIBRATE`.
2. **Android Channel**:
   - Channel ID: `activity-reminders`
   - Importance: `AndroidImportance.MAX`
   - Visibility: `AndroidNotificationVisibility.PUBLIC`
   - Initialized at startup in `app/_layout.tsx`.
3. **Modular Imports**: Import from `expo-notifications/build/...` to bypass Remote Push auto-token registration, avoiding Expo Go SDK 53 warning errors.

---

## 5. UI Architecture & Full-Height Pinned Footer BottomSheet (`components/ui/bottom-sheet.tsx`)

### BottomSheet Structure
- **Positioning & Full Height**: Fixed to `position: 'absolute', bottom: 0` with `height: maxSheetHeight` and default offset `0`. All modal forms (Activities, Leaves, Holidays, Quotas) spring up to full height (`snapPoints={[0.96]}`) right below the status bar.
- **Pinned Footer (`footer` prop)**: Action buttons (`[X ยกเลิก]` and `[Save บันทึก...]`) sit in a dedicated bottom bar above `insets.bottom`. They remain 100% visible on screen without requiring the user to scroll or losing sight when the keyboard appears.
- **Isolated Drag Gesture**: `GestureDetector` is attached exclusively to the top drag handle/header area. The internal `ScrollView` scrolls freely without pan gesture conflicts or double-scroll traps.
- **Single ScrollView Rule**: Never nest a `<ScrollView>` inside `BottomSheet` content. Pass a `<View style={{ gap: 14 }}>` as children.

---

## 6. Navigation & Performance Architecture

### Tab Navigation (`components/BottomNavigation.tsx`)
- **Use `router.replace`**: Top-level tabs must navigate via `router.replace(tab.route)`. Never use `router.push()` for tab switching, as `push()` accumulates unmounted screens in memory, resulting in memory ballooning and device sluggishness.
- **Current Tab Guard**: Check `if (pathname === route) return;` to avoid redundant renders.
- **Static Tab Registry & Memoization**: `NAV_TABS` is declared at module scope, styles are cached with `useMemo([colors])`, and the component is wrapped in `React.memo`.

### App-Wide Re-render Prevention (`components/ThemeProvider.tsx`)
- Context value `{ themeMode, colors, toggleTheme, isLoading: false }` is strictly wrapped in `useMemo` with `toggleTheme` wrapped in `useCallback`. This guarantees context consumers across the app only re-render when the user actually changes theme mode.

### Isolated Live Clock (`LiveGreetingRow` in `app/index.tsx`)
- The 10-second timer (`setInterval`) is isolated inside `<LiveGreetingRow />` with `React.memo`. The main dashboard (Bento Grid cards, SQLite stats, agenda items, and quota docks) remains static and does not re-render every 10 seconds, eliminating CPU overhead and battery drain.

### Configurable Haptics (`hooks/useHaptics.ts`)
- Stored in AsyncStorage (`@timetrack_haptics_enabled`).
- Default: **OFF** (false). Eliminates harsh Android buzzer vibrations and micro-stutters during rapid tapping.
- User can toggle on/off anytime in `app/settings.tsx`.

---

## 7. Screen Specifications

### 1. Dashboard (`app/index.tsx`)
- **Dynamic Greeting with Live Clock**: Shows greeting (Morning/Afternoon/Evening) paired with real-time digital clock badge `[Clock Icon] HH:mm น.` updated every 10 seconds via isolated `LiveGreetingRow`.
- **Hero Quick Action (1-Tap Clock In/Out)**:
  - When not clocked in: prominent `[ 🟢 บันทึกเวลาเข้างาน ]` button navigating directly to time entry pre-filled.
  - When clocked in: live elapsed progress bar and clear `[ 🔴 บันทึกเวลาเลิกงาน ]` button.
  - When shift complete: clean summary and edit link.
- **2x2 Balanced Stats Grid**: Net Annual OT, Monthly Late Count, Monthly Regular Hours, Monthly Net Remaining OT.
- **Today's Status Card**: Shift progress bar, clock-in/out times, OT breakdown.
- **Leave Quota Quick Dock**: Displays remaining quotas for Vacation, Sick, Personal, and Other leaves.

### 2. Time Entry (`app/time-entry.tsx`)
- Clean root header without back button.
- Date picker, Time pickers for Clock In and Clock Out with quick presets (Now, Shift Start, Shift End).
- Detailed Live Preview: Real-time calculation of regular hours, morning OT, evening OT, and late minutes before saving.
- Textarea note input.

### 3. Calendar, Leaves & Activities (`app/leaves.tsx`)
- Interactive Thai Buddhist calendar grid (พ.ศ. 2569) with status dots (Holiday, Leave, WFH, Activity).
- Tap any date to open `dayActionSheet` (1-tap quick actions for WFH, Holiday, Leave, or Activity).
- Full-height BottomSheets (0.96) with Pinned Footer for Activities, Leaves, Holidays, and Quotas.
- Shareable Calendar Image Export via `react-native-view-shot` and `expo-sharing`.

### 4. Reports (`app/reports.tsx`)
- Clean root header without back button.
- 3-Tier Monthly Summary Card with clean decimal hours (e.g. `9.00 ชม.` without redundant duplicate text).
- Pay period split (1st-10th, 11th-20th, 21st-End of month).
- Quick filter pills: All, Has OT, Late, Early Leave.
- Detail Modal with toggles for OT used and late compensated.
- Shareable Monthly Summary Card image generator.

### 5. Settings (`app/settings.tsx`)
- Clean root header without back button.
- **Work Schedule**: Monthly vs. Entire Year configuration with Single Smart Action button dynamically adapting to the selected scope.
- **App Settings**: Dark / Light mode toggle, Haptic feedback vibration switch.
- **Database Management (Danger Zone)**: Solid opaque dark card (prevents Android elevation artifact), backup export to JSON, restore import from file, and reset database.
- **About App**: Version badge (v1.3.0), 100% Offline Local Storage chip, Developer name "Wick", Copyright, and interactive Google Form feedback button (`forms.gle/BKx4Pz6VB65kdaka8`).
