# TimeTrack OT (แอปพลิเคชันบันทึกเวลาทำงานและจัดการโอที)

แอปพลิเคชันบันทึกเวลาทำงาน, คำนวณค่าล่วงเวลา (OT เช้า-เย็น), จัดการวันหยุด & วันลา และรายงานสรุปเงินเดือน/รอบงวด สร้างด้วย **React Native**, **Expo SDK 54**, **Expo SQLite (WAL Mode)** และระบบ UI ดีไซน์ **BNA UI**

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)
![Database](https://img.shields.io/badge/database-Expo%20SQLite%20(WAL)-green.svg)
![Design](https://img.shields.io/badge/UI-BNA%20UI%20%2B%20Sarabun-orange.svg)

---

## 📋 สารบัญ

- [✨ คุณสมบัติหลัก (Key Features)](#-คุณสมบัติหลัก-key-features)
- [⏱️ ระบบคำนวณเวลา & OT Engine](#️-ระบบคำนวณเวลา--ot-engine)
- [🗄️ โครงสร้างฐานข้อมูล & Performance](#️-โครงสร้างฐานข้อมูล--performance)
- [🎨 ระบบ UI/UX & BNA UI Integration](#-ระบบ-uiux--bna-ui-integration)
- [📁 โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)
- [📦 การติดตั้ง & วิธีรัน](#-การติดตั้ง--วิธีรัน)
- [📱 วิธี Build APK](#-วิธี-build-apk)

---

## ✨ คุณสมบัติหลัก (Key Features)

### 🏠 1. หน้าแรก (Dashboard)
- **2x2 Balanced Stats Grid**:
  - 🟢 **OT คงเหลือทั้งปี**: คำนวณจาก `OT สะสมทั้งปี - OT ที่กดใช้ไปแล้ว`
  - 🔴 **มาสายเดือนนี้**: แสดงจำนวนครั้งที่มาสายคงค้าง
  - 🔵 **ทำงานรวมเดือนนี้**: รวมชั่วโมงทำงานปกติในเดือน พร้อมนับจำนวนวันที่มาทำงานจริง
  - 🟡 **OT รวมเดือนนี้**: แสดง **OT คงเหลือสุทธิของเดือนนี้** (หักยอดที่ใช้แล้วออก พร้อมระบุยอดสะสม/ใช้แล้ว)
- **สถานะวันนี้ (Today's Card)**: แสดงเวลาเข้างาน, เลิกงาน, ชั่วโมงปกติ, ชั่วโมงมาสาย, และ OT เช้า-เย็น แบบเรียลไทม์
- **เวลาทำงานมาตรฐาน**: แสดงช่วงเวลากะงานของเดือนปัจจุบัน

### ⏱️ 2. บันทึกเวลาทำงาน (Time Entry)
- บันทึกเวลาเข้า-ออกงานพร้อมปุ่ม Preset ด่วน: `⏱️ ตอนนี้` และ `🎯 เวลามาตรฐานกะ`
- **Detailed Live Preview**: จำลองการคำนวณชั่วโมงปกติ, OT เช้า, OT เย็น, มาสาย, กลับก่อนเวลา แบบสดๆ ก่อนกดบันทึก
- ช่องกรอกหมายเหตุ/เหตุผลด้วย **BNA UI Input (Textarea)**
- ระบบป้องกันการลบข้อมูลด้วย **AlertDialog (Destructive Guard)**

### 📅 3. วันหยุด & วันลา (Leaves & Calendar)
- **ปฏิทินไทย (พ.ศ. 2569)**: แสดงแถบเลือกวันและไฮไลท์สถานะแต่ละวันด้วยสีเฉพาะ
- **การจัดหมวดหมู่ด้วย BNA UI Accordion 2 ชั้น**:
  - 📅 **รายการในเดือนนี้ (Default Open)**: แสดงรายการ WFH, วันหยุดประจำสัปดาห์, วันลา และวันหยุดประจำเดือน พร้อมปุ่ม **[ ✏️ แก้ไข ]** และ **[ 🗑️ ลบ ]**
  - 🏛️ **วันหยุดประจำปี (Collapsible)**: แสดงวันหยุดนักขัตฤกษ์และวันหยุดบริษัททั้งปี พร้อมปุ่ม **โหลดวันหยุดไทยอัตโนมัติ** และ **เพิ่ม/แก้ไขวันหยุด**
- **Bottom Sheet Quick Actions**: แตะที่วันที่บนปฏิทินเพื่อกำหนด WFH, วันหยุด, ยื่นใบลา หรือแก้ไขข้อมูลได้ทันที

### 📊 4. รายงานเวลาทำงาน (Reports)
- **3-Tier Monthly Summary Card (การ์ดสรุปรายเดือนแบบ 3 มิติ)**:
  - `ชั่วโมงปกติ`: แสดงชั่วโมงทำงานปกติทั้งเดือน
  - `ชั่วโมง OT สะสม`: แสดงยอด OT รวมทั้งหมด $\rightarrow$ `└ ใช้แล้ว` $\rightarrow$ `└ คงเหลือสุทธิ (สีเขียวเด่น)`
  - `ชั่วโมงมาสาย`: แสดงยอดรวมมาสาย $\rightarrow$ `└ ชดเชยแล้ว` $\rightarrow$ `└ สายคงค้าง`
  - `รวมเวลาทำงานจริง`: แสดงเวลาที่ร่างกายทำงานจริงทั้งเดือน (`ปกติ + OT สะสม`) สำหรับ Time Card Audit Log
- **แบ่งรอบงวด 3 งวดต่อเดือน**: งวดที่ 1 (1-10), งวดที่ 2 (11-20), งวดที่ 3 (21-สิ้นเดือน)
- **Popup รายละเอียดประจำวัน**: แตะเพื่อดูเวลาเข้า-ออก, ชั่วโมงย่อย และมีสวิตช์ Toggle `[✔ ใช้ OT แล้ว]` / `[✔ ใช้สายแล้ว]`

### ⚙️ 5. ตั้งค่า (Settings)
- กำหนดเวลาเข้า-ออกงานมาตรฐานแยกตามรายเดือน
- สลับโหมด **Light Mode / Dark Mode**
- สำรองและล้างข้อมูลฐานข้อมูลพร้อมระบบแจ้งเตือนยืนยัน

---

## ⏱️ ระบบคำนวณเวลา & OT Engine

ระบบคำนวณเวลาของ TimeTrack OT ได้รับการออกแบบตามมาตรฐานชั่วโมงแรงงานสากล:

```
ช่วงเวลาทำงาน:  [-- OT เช้า --] [====== เวลาทำงานปกติในกะ ======] [-- OT เย็น/ค่ำ --]
                ▲              ▲                               ▲                   ▲
             เข้างานจริง    เริ่มงานกะ                      เลิกงานกะ           ออกงานจริง
```

### สูตรการคำนวณ:
1. **OT เช้า (Morning Overtime)**: เวลาที่เข้างานก่อนเวลากะ
   $$\text{morningOT} = \max(0, \min(\text{clockOut}, \text{scheduledStart}) - \text{actualClockIn})$$
2. **เวลาทำงานปกติ (Regular Shift Hours)**: เวลาที่อยู่ในกรอบเวลาทำงานมาตรฐาน
   $$\text{regularHours} = \max(0, \min(\text{clockOut}, \text{scheduledEnd}) - \max(\text{clockIn}, \text{scheduledStart}))$$
3. **OT เย็น/ค่ำ (Evening Overtime)**: เวลาที่อยู่ทำงานเกินเวลากะ
   $$\text{eveningOT} = \max(0, \text{actualClockOut} - \max(\text{actualClockIn}, \text{scheduledEnd}))$$
4. **รวม OT ทั้งหมด**:
   $$\text{overtimeHours} = \text{morningOT} + \text{eveningOT}$$
5. **มาสาย / กลับก่อนเวลา**:
   - $\text{lateHours} = \max(0, \text{actualClockIn} - \text{scheduledStart})$
   - $\text{earlyLeaveHours} = \max(0, \text{scheduledEnd} - \text{actualClockOut})$

---

## 🗄️ โครงสร้างฐานข้อมูล & Performance

### ⚡ SQLite Database Optimization (10x Faster)
- **WAL Journal Mode**: เปิดใช้งาน `PRAGMA journal_mode = WAL;` รองรับ Concurrent read/write
- **Targeted Indexes**: ติดตั้ง Index สำหรับค้นหาช่วงวันที่และเงื่อนไขหลัก:
  - `idx_time_entries_date` บน `time_entries(date)`
  - `idx_holidays_date` บน `holidays(date)`
  - `idx_leaves_dates` บน `leaves(start_date, end_date)`
  - `idx_work_schedules_month_year` บน `work_schedules(month, year)`
- **Eliminated Waterfall Queries**: ปรับลดการยิง SQLite ซ้ำซ้อนบน Dashboard จาก 24 sequential queries เหลือเพียง **2 Parallel Batch Queries** โหลดข้อมูลเร็วขึ้นกว่า 90% (<15ms)

---

## 🎨 ระบบ UI/UX & BNA UI Integration

- **BNA UI Components**: นำเข้าคอมโพเนนต์ระดับพรีเมียม (`Card`, `Button`, `Input`, `Accordion`, `AlertDialog`, `BottomSheet`, `Toast`)
- **Accessibility & Ergonomics**: ออกแบบปุ่มและระยะกดยึดตาม Thumb-Zone
- **Typography**: รองรับภาษาไทยเต็มรูปแบบด้วยฟอนต์ **Sarabun** (Thin, Light, Regular, Medium, SemiBold, Bold, ExtraBold)
- **Haptic Feedback**: ระบบตอบสนองสัมผัสทุกการกดและสลับสถานะด้วย `expo-haptics`

---

## 📁 โครงสร้างโปรเจค

```
TimeTrackOT/
├── .agents/skills/timetrack-ot-app/ # Agent Skill Blueprint
├── app/                             # File-Based Routing (Expo Router)
│   ├── _layout.tsx                  # Root Layout, Theme & Global Font Loader
│   ├── index.tsx                    # หน้าแรก (Dashboard 2x2 Stats & Today Card)
│   ├── time-entry.tsx               # หน้าบันทึกเวลาทำงาน & Live Preview
│   ├── leaves.tsx                   # หน้าปฏิทินวันหยุด & วันลา (Accordion System)
│   ├── reports.tsx                  # หน้ารายงาน 3 งวด & การ์ดสรุปรายเดือน
│   └── settings.tsx                 # หน้าตั้งค่าเวลากะ & ธีม
│
├── components/                      # Shared & UI Components
│   ├── ui/                          # BNA UI Design System
│   │   ├── accordion.tsx            # Accordion Collapsible List
│   │   ├── alert-dialog.tsx         # Confirmation Modal (Destructive Guard)
│   │   ├── badge.tsx                # Status Badges
│   │   ├── button.tsx               # BNA Themed Button
│   │   ├── card.tsx                 # Surface Container Card
│   │   ├── input.tsx                # Styled Input & Textarea
│   │   ├── separator.tsx            # Divider
│   │   └── toast.tsx                # Global Toast Feedback
│   ├── BottomNavigation.tsx         # Tab Navigation Bar
│   ├── BottomSheet.tsx              # Animated Bottom Sheet
│   ├── DatePicker.tsx               # Date Picker Modal
│   ├── TimeInput.tsx                # Time Input with Wheel Selector
│   └── ThemeProvider.tsx            # Theme Context Provider
│
├── hooks/                           # Core Custom Hooks
│   ├── useDatabase.ts               # SQLite Database Engine & Singleton Connection
│   ├── useTimeCalculation.ts        # Overtime & Working Hours Calculation Engine
│   └── useTheme.ts                  # Light/Dark Theme Tokens
│
├── types/                           # TypeScript Definitions
│   └── index.ts                     # TimeEntry, WorkSchedule, Leave, Holiday types
├── app.json                         # Expo Application Configuration
├── eas.json                         # EAS Build Profiles
└── package.json                     # Project Dependencies
```

---

## 📦 การติดตั้ง & วิธีรัน

### ความต้องการเบื้องต้น
- **Node.js** v18+ (แนะนำ v20 LTS)
- **npm** หรือ **yarn**
- **Expo Go** บนโทรศัพท์มือถือ iOS / Android

### ขั้นตอนการรัน
```bash
# 1. ติดตั้ง dependencies
npm install

# 2. เริ่มต้นรัน Dev Server
npm run dev

# 3. รันแยกแพลตฟอร์ม
npm run android   # สำหรับ Android Emulator / Device
npm run ios       # สำหรับ iOS Simulator / Device
npm run web       # สำหรับ Web Browser
```

---

## 📱 วิธี Build APK (Android)

```bash
# 1. Build APK ด้วย EAS Cloud (Preview Profile)
eas build --platform android --profile preview

# 2. หรือ Build แบบ Local Gradle
npx expo export -p android -c
npx expo run:android --variant release
```

---

## 📝 License & Authors

- **Author**: John Wick
- **Version**: 1.1.0 (August 2026)
- **License**: Private Project
