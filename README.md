# TimeTrack OT

แอปพลิเคชันบันทึกเวลาทำงานและคำนวณค่าล่วงเวลา (OT) สร้างด้วย React Native และ Expo

npx expo start

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)

---

## 📋 สารบัญ

- [คุณสมบัติ](#-คุณสมบัติ)
- [เทคโนโลยี](#-เทคโนโลยี)
- [การติดตั้ง](#-การติดตั้ง)
- [วิธีรัน](#-วิธีรัน)
- [วิธี Build APK](#-วิธี-build-apk)
- [โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)

---

## ✨ คุณสมบัติ

### 🏠 หน้าแรก (Home)
- แสดง Dashboard สรุปภาพรวมชั่วโมงทำงาน
- สถิติรายปี: ชั่วโมงปกติ, ชั่วโมง OT, สายรวม
- บันทึกเวลาเข้า-ออกงานแบบรวดเร็ว

### ⏱️ บันทึกเวลา (Time Entry)
- บันทึกเวลาเข้างาน-ออกงาน
- คำนวณชั่วโมงปกติและชั่วโมง OT อัตโนมัติ
- รองรับ OT ก่อนเวลาเข้างาน (Early OT) และหลังเลิกงาน (Late OT)
- คำนวณเวลามาสาย
- เพิ่มเหตุผลประกอบการบันทึก
- แก้ไข/ลบข้อมูลได้

### 📊 รายงาน (Reports)
- แสดงรายงานแบ่งตามงวด 3 งวดต่อเดือน:
  - งวด 1: วันที่ 1-10
  - งวด 2: วันที่ 11-20
  - งวด 3: วันที่ 21-สิ้นเดือน
- สรุปชั่วโมง OT รวมของแต่ละงวด
- ดูรายละเอียดรายวันได้
- เลือกดูรายงานย้อนหลังได้

### ⚙️ ตั้งค่า (Settings)
- ตั้งค่าเวลาเข้า-ออกงานมาตรฐาน รายเดือน
- สลับธีม Light/Dark Mode
- ข้อมูลเกี่ยวกับแอป

### 🎨 UI/UX
- รองรับภาษาไทย
- ใช้ฟอนต์ Sarabun
- รองรับ Dark Mode
- ใช้ปฏิทินแบบ พ.ศ.

---

## 🛠 เทคโนโลยี

| เทคโนโลยี | เวอร์ชัน | รายละเอียด |
|-----------|---------|------------|
| **React Native** | 0.81.4 | Framework หลัก |
| **Expo** | 54.0.1 | Development platform |
| **Expo Router** | 6.0.0 | File-based routing |
| **Expo SQLite** | 16.0.8 | Local database |
| **TypeScript** | 5.8.3 | Type-safe development |
| **React Navigation** | 7.x | Navigation library |

---

## 📦 การติดตั้ง

### ความต้องการเบื้องต้น

- **Node.js** v18+ (แนะนำ v20 LTS)
- **npm** หรือ **yarn**
- **Git**
- **EAS CLI** (สำหรับ build APK)

### ขั้นตอนการติดตั้ง

```bash
# 1. Clone โปรเจค
git clone <repository-url>
cd TimeTrackOT

# 2. ติดตั้ง dependencies
npm install

# 3. ติดตั้ง EAS CLI (สำหรับ build APK)
npm install -g eas-cli

# 4. Login เข้า Expo account
eas login
```

---

## 🚀 วิธีรัน

### Development Mode

```bash
# รันแบบ tunnel mode (ใช้ได้ทั้ง iOS, Android, Web)
npm run dev

# รันเฉพาะ Android
npm run android

# รันเฉพาะ iOS
npm run ios

# รันเฉพาะ Web
npm run web
```

### หลังรันคำสั่ง

1. จะปรากฏ QR Code ใน terminal
2. **Android**: ติดตั้งแอป **Expo Go** จาก Play Store แล้วสแกน QR Code
3. **iOS**: ติดตั้งแอป **Expo Go** จาก App Store แล้วสแกน QR Code
4. **Web**: กด `w` ในเปิดเบราว์เซอร์

---

## 📱 วิธี Build APK

### ขั้นตอนการ Build

```bash
# 1. ตรวจสอบการตั้งค่า EAS
eas build:configure

# 2. Build APK สำหรับ Preview (Internal Distribution)
eas build --platform android --profile preview

# 3. Build APK สำหรับ Production
eas build --platform android --profile production

# 4. Build APK โดยเฉพาะ (apk profile)
eas build --platform android --profile apk
```

### Build Profiles

| Profile | ลักษณะการใช้งาน |
|---------|-----------------|
| `development` | สำหรับ development client |
| `preview` | สำหรับทดสอบภายใน (APK) |
| `production` | สำหรับ release (APK) |
| `apk` | สำหรับ build APK โดยเฉพาะ |

### หลัง Build เสร็จ

1. เข้าไปที่ [expo.dev](https://expo.dev) และ login
2. ไปที่โปรเจค → Builds
3. ดาวน์โหลด APK จากหน้า build ที่สำเร็จ

### Build บนเครื่อง Local (ไม่ต้องใช้ EAS Cloud)

```bash
# สร้าง native project
expo prebuild -p android

# Build APK โดยใช้ Gradle
cd android
./gradlew assembleRelease

# APK จะอยู่ที่: android/app/build/outputs/apk/release/
```

---

## 📁 โครงสร้างโปรเจค

```
TimeTrackOT/
├── app/                      # หน้าจอหลัก (File-based routing)
│   ├── _layout.tsx           # Layout หลัก
│   ├── index.tsx             # หน้าแรก (Dashboard)
│   ├── time-entry.tsx        # หน้าบันทึกเวลา
│   ├── reports.tsx           # หน้ารายงาน
│   └── settings.tsx          # หน้าตั้งค่า
│
├── components/               # UI Components
│   ├── BottomNavigation.tsx  # Navigation ด้านล่าง
│   ├── BottomSheet.tsx       # Bottom Sheet Modal
│   ├── Button.tsx            # ปุ่มสำเร็จรูป
│   ├── DateInput.tsx         # Input เลือกวันที่
│   ├── TimeInput.tsx         # Input เลือกเวลา
│   ├── Icon.tsx              # Icon component
│   ├── LoadingScreen.tsx     # หน้า Loading
│   └── ThemeProvider.tsx     # Theme Context Provider
│
├── hooks/                    # Custom Hooks
│   ├── useDatabase.ts        # SQLite database operations
│   ├── useStorage.ts         # AsyncStorage operations
│   ├── useTheme.ts           # Theme management
│   └── useTimeCalculation.ts # คำนวณชั่วโมง OT
│
├── types/                    # TypeScript types
│   └── index.ts              # Type definitions
│
├── utils/                    # Utility functions
├── assets/                   # รูปภาพและไอคอน
├── styles/                   # Global styles
├── config/                   # Configuration files
│
├── app.json                  # Expo configuration
├── eas.json                  # EAS Build configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

---

## 📊 Data Models

### WorkSchedule (เวลาทำงานมาตรฐาน)

```typescript
interface WorkSchedule {
  id?: number;
  month: number;          // เดือน (1-12)
  year: number;           // ปี (ค.ศ.)
  startTime: string;      // เวลาเข้างาน (HH:MM)
  endTime: string;        // เวลาออกงาน (HH:MM)
}
```

### TimeEntry (บันทึกเวลา)

```typescript
interface TimeEntry {
  id?: number;
  date: string;           // วันที่ (YYYY-MM-DD)
  clockIn?: string;       // เวลาเข้างาน (HH:MM)
  clockOut?: string;      // เวลาออกงาน (HH:MM)
  reason?: string;        // เหตุผล
  regularHours: number;   // ชั่วโมงปกติ
  overtimeHours: number;  // ชั่วโมง OT
  lateArrivalHours?: number; // ชั่วโมงสาย
}
```

---

## 🔧 Scripts

| คำสั่ง | รายละเอียด |
|--------|------------|
| `npm run dev` | รัน development server พร้อม tunnel |
| `npm run android` | รันบน Android |
| `npm run ios` | รันบน iOS |
| `npm run web` | รันบน Web Browser |
| `npm run build:web` | Build สำหรับ Web |
| `npm run build:android` | Prebuild สำหรับ Android |
| `npm run lint` | ตรวจสอบ code style ด้วย ESLint |

---

## 📝 License

Private Project

---

## 👨‍💻 ผู้พัฒนา

**John Wick**

Version 1.0.0 | December 2024
