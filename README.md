# TimeTrack OT (แอปพลิเคชันบันทึกเวลาทำงานและจัดการโอที)

แอปพลิเคชันบันทึกเวลาทำงาน, คำนวณค่าล่วงเวลา (OT เช้า-เย็น), บันทึกกิจกรรม & แจ้งเตือนนัดหมาย, จัดการวันหยุด & วันลา และรายงานสรุปชั่วโมงทำงาน สร้างด้วย **React Native 0.81**, **Expo SDK 54**, **Expo SQLite (WAL Mode)**, **Expo Notifications** และระบบ UI ดีไซน์ **BNA UI** พร้อมสัญลักษณ์เวกเตอร์ไอคอนมาตรฐานระดับสากล

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-lightgrey.svg)
![Database](https://img.shields.io/badge/database-Expo%20SQLite%20(WAL)-green.svg)
![Design](https://img.shields.io/badge/UI-BNA%20UI%20%2B%20Sarabun-orange.svg)
![Storage](https://img.shields.io/badge/Storage-100%25%20Offline%20Local-success.svg)

---

## สารบัญ

- [คุณสมบัติหลัก (Key Features)](#คุณสมบัติหลัก-key-features)
- [ระบบคำนวณเวลา & OT Engine](#ระบบคำนวณเวลา--ot-engine)
- [ระบบแจ้งเตือนกิจกรรม & นัดหมาย](#ระบบแจ้งเตือนกิจกรรม--นัดหมาย)
- [โครงสร้างฐานข้อมูล & Performance](#โครงสร้างฐานข้อมูล--performance)
- [ระบบ UI/UX & BNA UI Integration](#ระบบ-uiux--bna-ui-integration)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้ง & วิธีรัน](#การติดตั้ง--วิธีรัน)
- [วิธี Build APK (Android)](#วิธี-build-apk-android)
- [ข้อมูลผู้พัฒนา & ข้อเสนอแนะ](#ข้อมูลผู้พัฒนา--ข้อเสนอแนะ)

---

## คุณสมบัติหลัก (Key Features)

### 1. หน้าแรก (Dashboard)
- **ทักทายตามช่วงเวลาพร้อมนาฬิกาเรียลไทม์**: แสดงคำทักทาย (สวัสดีตอนเช้า / บ่าย / เย็น) เคียงคู่กับชิปแสดงเวลาปัจจุบัน `[ไอคอนนาฬิกา] HH:mm น.` ที่อัปเดตแบบเรียลไทม์
- **2x2 Balanced Stats Grid**:
  - **OT คงเหลือทั้งปี**: คำนวณจาก `OT สะสมทั้งปี - OT ที่กดใช้ไปแล้ว`
  - **มาสายเดือนนี้**: แสดงจำนวนครั้งที่มาสายคงค้าง
  - **ทำงานรวมเดือนนี้**: รวมชั่วโมงทำงานปกติในเดือน พร้อมนับจำนวนวันที่มาทำงานจริง
  - **OT รวมเดือนนี้**: แสดง OT คงเหลือสุทธิของเดือนนี้ (หักยอดที่ใช้แล้วออก พร้อมระบุยอดสะสม/ใช้แล้ว)
- **สถานะวันนี้ (Today's Card)**: แสดงเวลาเข้างาน, เลิกงาน, แถบความคืบหน้ากะ, ชั่วโมงปกติ, ชั่วโมงมาสาย, และ OT เช้า-เย็น แบบเรียลไทม์
- **โควตาวันลาคงเหลือ (Leave Quota Dock)**: แถบสรุปยอดวันลาคงเหลือ 4 ประเภทหลัก (พักร้อน, ลาป่วย, ลากิจ, อื่นๆ)
- **เวลาทำงานมาตรฐาน**: แสดงช่วงเวลากะงานของเดือนปัจจุบัน

### 2. บันทึกเวลาทำงาน (Time Entry)
- บันทึกเวลาเข้า-ออกงานพร้อมปุ่ม Preset ด่วน: `ตอนนี้`, `เริ่มกะ` และ `เลิกกะ`
- **Detailed Live Preview**: จำลองการคำนวณชั่วโมงปกติ, OT เช้า, OT เย็น, มาสาย, กลับก่อนเวลา แบบสดๆ ก่อนกดบันทึก
- ช่องกรอกหมายเหตุ/เหตุผลด้วย **BNA UI Input (Textarea)**
- ระบบป้องกันการลบข้อมูลด้วย **AlertDialog (Destructive Guard)**

### 3. วันหยุด วันลา & กิจกรรม (Leaves, Calendar & Activities)
- **ปฏิทินไทย (พ.ศ. 2569)**: แสดงแถบเลือกวันและไฮไลท์สถานะแต่ละวันด้วยจุดสีเฉพาะ (วันหยุด, วันลา, WFH, มีนัดหมาย)
- **บันทึกกิจกรรม & นัดหมายประจำวัน (Daily Activities)**:
  - เพิ่มนัดหมายพร้อมเลือกหมวดหมู่ (งาน/ประชุม, ออกกำลังกาย, ส่วนตัว/แฟน, กินข้าว/สังสรรค์, เที่ยว/ทำบุญ, ทั่วไป)
  - กำหนดเวลาเริ่มต้น-สิ้นสุด หรือเลือกเป็นกิจกรรมตลอดวัน
  - ระบุสถานที่และบันทึกช่วยจำ
- **ระบบ BottomSheet ฟอร์มเพิ่มกิจกรรมแบบ Pinned Footer**:
  - โครงสร้าง `bottom: 0` แนบสนิทขอบล่างของหน้าจอ
  - ปุ่ม `[ยกเลิก]` และ `[บันทึกนัดหมาย]` ถูกตรึงอยู่ด้านล่างอย่างถาวร มองเห็นได้ชัดเจน 100% โดยไม่ต้องเลื่อนจอ
  - แยกก้านลาก (Handle) ออกจากฟอร์ม ทำให้เลื่อนดูข้อมูลได้อย่างอิสระ ไม่ติดขัด
- **ส่งออกภาพปฏิทิน (Share Calendar Image)**: แคปเจอร์หน้าปฏิทินเป็นภาพความละเอียดสูงเพื่อส่งต่อทาง LINE หรือแชร์ลงโซเชียล

### 4. รายงานเวลาทำงาน (Reports)
- **3-Tier Monthly Summary Card**:
  - `ชั่วโมงปกติ`: แสดงชั่วโมงทำงานปกติทั้งเดือน
  - `ชั่วโมง OT สะสม`: แสดงยอด OT รวมทั้งหมด $\rightarrow$ `ใช้แล้ว` $\rightarrow$ `คงเหลือสุทธิ (สีเขียวเด่น)`
  - `ชั่วโมงมาสาย`: แสดงยอดรวมมาสาย $\rightarrow$ `ชดเชยแล้ว` $\rightarrow$ `สายคงค้าง`
  - `รวมเวลาทำงานจริง`: แสดงเวลาที่ร่างกายทำงานจริงทั้งเดือน (`ปกติ + OT สะสม`) สำหรับ Time Card Audit Log
- **แบ่งรอบงวด 3 งวดต่อเดือน**: งวดที่ 1 (1-10), งวดที่ 2 (11-20), งวดที่ 3 (21-สิ้นเดือน)
- **Quick Filter Pills**: กรองเฉพาะวันที่มี OT, มาสาย หรือกลับก่อน
- **ส่งออกภาพสรุปรายเดือน**: บันทึกการ์ดสรุปเป็นรูปภาพพร้อมตราสัญลักษณ์ TimeTrack OT เพื่อส่งหัวหน้างานหรือฝ่ายบุคคล

### 5. ตั้งค่า (Settings)
- **กำหนดเวลากะมาตรฐาน**: เลือกตั้งค่าเฉพาะรายเดือน หรือตั้งค่าครอบคลุมทั้งปี (12 เดือน) ได้ในคลิกเดียวผ่านระบบ Database Transaction
- **สลับโหมด Light / Dark**: รองรับ Dark Mode คุณภาพสูง ปราศจากแสงสะท้อน
- **สวิตช์เปิด-ปิดการสั่นตอบสนอง (Haptic Feedback)**: ปิดเป็นค่าเริ่มต้นเพื่อความลื่นไหล สามารถเปิดได้หากต้องการ
- **จัดการฐานข้อมูล (Danger Zone)**:
  - สำรองข้อมูลออกเป็นไฟล์ JSON พร้อมแชร์ออกภายนอก
  - กู้คืนข้อมูลจากไฟล์ JSON สำรอง
  - ล้างข้อมูลระบบพร้อมการยืนยันความปลอดภัย
- **เกี่ยวกับแอปพลิเคชัน**:
  - ชิปแสดงสถานะ **การจัดเก็บข้อมูล: ออฟไลน์ 100% (ข้อมูลไม่รั่วไหล)**
  - ผู้พัฒนา: **Wick**
  - ปุ่มเปิดแบบฟอร์มแจ้งปัญหาและข้อเสนอแนะออนไลน์ (Google Forms)

---

## ระบบคำนวณเวลา & OT Engine

ระบบคำนวณเวลาของ TimeTrack OT ได้รับการออกแบบตามมาตรฐานชั่วโมงแรงงานสากล:

```text
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

## ระบบแจ้งเตือนกิจกรรม & นัดหมาย

- **แจ้งเตือนล่วงหน้าได้ตามต้องการ**: ตรงเวลา, ล่วงหน้า 15 นาที, 30 นาที, 1 ชั่วโมง หรือ 1 วัน
- **ทำงานได้แม้ปิดแอป (Background Alarm)**:
  - ใช้สิทธิ์ `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`
  - สร้าง Notification Channel `activity-reminders` ใน Android ระดับ `AndroidImportance.MAX` พร้อมเสียงและการปลุกหน้าจอ
- **Direct Modular Import**: ไม่โหลด Remote Push Auto-Registration มารบกวน ช่วยให้ทดสอบบน Expo Go ได้ลื่นไหล ปราศจาก Warning

---

## โครงสร้างฐานข้อมูล & Performance

### SQLite Database Optimization
- **WAL Journal Mode**: เปิดใช้งาน `PRAGMA journal_mode = WAL;` รองรับ Concurrent read/write
- **Targeted Indexes**: ติดตั้ง Index สำหรับค้นหาช่วงวันที่และเงื่อนไขหลัก:
  - `idx_time_entries_date` บน `time_entries(date)`
  - `idx_holidays_date` บน `holidays(date)`
  - `idx_leaves_dates` บน `leaves(start_date, end_date)`
  - `idx_work_schedules_month_year` บน `work_schedules(month, year)`
  - `idx_activities_date` บน `activities(date)`
- **Navigation Performance**: ปรับเปลี่ยนการสลับแท็บจาก `router.push()` เป็น `router.replace()` ป้องกันการสะสมหน้าจอใน Stack และแก้ไขปัญหาอาการแอปหน่วงได้อย่างเด็ดขาด

---

## ระบบ UI/UX & BNA UI Integration

- **BNA UI Components**: นำเข้าคอมโพเนนต์มาตรฐาน (`Card`, `Button`, `Input`, `Accordion`, `AlertDialog`, `BottomSheet`, `Toast`)
- **Zero Emojis Policy**: แสดงผลผ่านเวกเตอร์ไอคอน **Lucide React Native** ทุกจุดทั่วทั้งแอป
- **Typography**: รองรับภาษาไทยเต็มรูปแบบด้วยฟอนต์ **Sarabun** ทุกน้ำหนัก
- **Ergonomics**: ปุ่มแอ็กชันอยู่ในโซนเข้าถึงง่ายของนิ้วโป้ง (Thumb-Zone)

---

## โครงสร้างโปรเจกต์

```text
TimeTrackOT/
├── .agents/skills/timetrack-ot-app/ # Master Technical Blueprint & Skill
├── app/                             # File-Based Routing (Expo Router)
│   ├── _layout.tsx                  # Root Layout, Global Font Loader & Notification Init
│   ├── index.tsx                    # หน้าแรก (Dashboard 2x2 Stats, Live Clock & Quotas)
│   ├── time-entry.tsx               # หน้าบันทึกเวลาทำงาน & Live Preview
│   ├── leaves.tsx                   # หน้าปฏิทินวันหยุด วันลา & กิจกรรมนัดหมาย
│   ├── reports.tsx                  # หน้ารายงาน 3 งวด & การ์ดสรุปรายเดือน
│   └── settings.tsx                 # หน้าตั้งค่าเวลากะรายปี, Haptic, ธีม & ข้อมูลแอป
│
├── components/                      # Shared & UI Components
│   ├── ui/                          # BNA UI Design System
│   │   ├── accordion.tsx            # Accordion Collapsible List
│   │   ├── alert-dialog.tsx         # Confirmation Modal (Destructive Guard)
│   │   ├── badge.tsx                # Status Badges
│   │   ├── bottom-sheet.tsx         # Pinned Footer BottomSheet (bottom: 0)
│   │   ├── button.tsx               # BNA Themed Button
│   │   ├── card.tsx                 # Surface Container Card
│   │   ├── input.tsx                # Styled Input & Textarea
│   │   ├── separator.tsx            # Divider
│   │   └── toast.tsx                # Global Toast Feedback
│   ├── BottomNavigation.tsx         # Tab Navigation Bar (router.replace)
│   ├── DatePicker.tsx               # Date Picker Modal
│   ├── TimeInput.tsx                # Time Input with Wheel Selector
│   └── ThemeProvider.tsx            # Theme Context Provider
│
├── hooks/                           # Core Custom Hooks
│   ├── useDatabase.ts               # SQLite Database Engine & Singleton Connection
│   ├── useTimeCalculation.ts        # Overtime & Working Hours Calculation Engine
│   ├── useHaptics.ts                # Configurable Haptic Feedback Hook
│   └── useTheme.ts                  # Light/Dark Theme Tokens
│
├── services/                        # Core Background Services
│   └── notificationService.ts       # Local Push Notification & Android Channel Engine
│
├── types/                           # TypeScript Definitions
│   └── index.ts                     # TimeEntry, WorkSchedule, Leave, Holiday, Activity types
├── app.json                         # Expo Application Configuration & Permissions
├── eas.json                         # EAS Build Profiles
└── package.json                     # Project Dependencies
```

---

## การติดตั้ง & วิธีรัน

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

## วิธี Build APK (Android)

```bash
# Build APK ด้วย EAS Cloud (Preview Profile สำหรับทดสอบติดตั้งบนเครื่องจริง)
npx eas-cli@latest build -p android --profile preview
```

---

## ข้อมูลผู้พัฒนา & ข้อเสนอแนะ

- **ผู้พัฒนา (Developer)**: Wick
- **เวอร์ชัน**: 1.2.0 (กันยายน 2569)
- **การจัดเก็บข้อมูล**: ออฟไลน์ 100% ภายในเครื่อง ปลอดภัย เป็นส่วนตัวสูงสุด
- **แจ้งปัญหาและข้อเสนอแนะ**: [แบบฟอร์มรับฟังข้อเสนอแนะ](https://forms.gle/BKx4Pz6VB65kdaka8)
