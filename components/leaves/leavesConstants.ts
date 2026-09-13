import {
  Palmtree,
  HeartPulse,
  Briefcase,
  Layers,
  Sparkles,
  Building2,
  Info,
  Coffee,
  Home,
  Dumbbell,
  Heart,
  Utensils,
  Compass,
  Tag,
} from 'lucide-react-native';
import type { Holiday, HolidayType, LeaveType, Activity, ActivityCategory } from '../../types';

export const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const WEEKDAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export interface LeaveTypeOption {
  type: LeaveType;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
}

export const LEAVE_TYPE_OPTIONS: LeaveTypeOption[] = [
  { type: 'vacation', label: 'ลาพักร้อน (Vacation)', shortLabel: 'พักร้อน', icon: Palmtree, color: '#3b82f6' },
  { type: 'sick', label: 'ลาป่วย (Sick Leave)', shortLabel: 'ลาป่วย', icon: HeartPulse, color: '#ef4444' },
  { type: 'personal', label: 'ลากิจ (Personal Leave)', shortLabel: 'ลากิจ', icon: Briefcase, color: '#f59e0b' },
  { type: 'other', label: 'ลาอื่นๆ (Other)', shortLabel: 'อื่นๆ', icon: Layers, color: '#8b5cf6' },
];

export interface HolidayTypeConfig {
  label: string;
  shortLabel: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'success';
  color: string;
  icon: any;
}

export const HOLIDAY_TYPE_CONFIG: Record<HolidayType, HolidayTypeConfig> = {
  public: { label: 'วันหยุดนักขัตฤกษ์', shortLabel: 'นักขัตฯ', badgeVariant: 'default', color: '#2563eb', icon: Sparkles },
  company: { label: 'วันหยุดบริษัท', shortLabel: 'หยุด บ.', badgeVariant: 'secondary', color: '#7c3aed', icon: Building2 },
  special: { label: 'วันหยุดพิเศษ', shortLabel: 'พิเศษ', badgeVariant: 'outline', color: '#d97706', icon: Info },
  regular_off: { label: 'วันหยุดปกติ (Day Off)', shortLabel: 'หยุดปกติ', badgeVariant: 'outline', color: '#64748b', icon: Coffee },
  wfh: { label: 'Work From Home (WFH)', shortLabel: 'WFH', badgeVariant: 'success', color: '#16a34a', icon: Home },
};

export interface ActivityCategoryConfig {
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  bgColor: string;
}

export const ACTIVITY_CATEGORY_CONFIG: Record<ActivityCategory, ActivityCategoryConfig> = {
  work: { label: 'งาน / ประชุม', shortLabel: 'งาน', icon: Briefcase, color: '#8b5cf6', bgColor: '#f5f3ff' },
  exercise: { label: 'ออกกำลังกาย', shortLabel: 'วิ่ง/ฟิตเนส', icon: Dumbbell, color: '#10b981', bgColor: '#ecfdf5' },
  personal: { label: 'ส่วนตัว / แฟน', shortLabel: 'นัดแฟน', icon: Heart, color: '#ec4899', bgColor: '#fdf2f8' },
  dining: { label: 'กินข้าว / สังสรรค์', shortLabel: 'กินข้าว', icon: Utensils, color: '#f59e0b', bgColor: '#fffbeb' },
  travel: { label: 'เที่ยว / ทำบุญ', shortLabel: 'เที่ยว/วัด', icon: Compass, color: '#a855f7', bgColor: '#faf5ff' },
  general: { label: 'ทั่วไป', shortLabel: 'ทั่วไป', icon: Tag, color: '#64748b', bgColor: '#f8fafc' },
};

export const REMINDER_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'ไม่เตือน', value: null },
  { label: 'ตรงเวลา', value: 0 },
  { label: 'ก่อน 15 นาที', value: 15 },
  { label: 'ก่อน 30 นาที', value: 30 },
  { label: 'ก่อน 1 ชม.', value: 60 },
  { label: 'ก่อน 1 วัน', value: 1440 },
];

export interface LocationPreset {
  label: string;
  val: string;
  icon: any;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  { label: 'ที่ทำงาน', val: 'ที่ทำงาน', icon: Building2 },
  { label: 'ที่บ้าน', val: 'ที่บ้าน', icon: Home },
  { label: 'ร้านกาแฟ', val: 'ร้านกาแฟ', icon: Coffee },
  { label: 'ฟิตเนส', val: 'ฟิตเนส', icon: Dumbbell },
  { label: 'โรงพยาบาล', val: 'โรงพยาบาล', icon: HeartPulse },
];

export interface CalendarDayItem {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  holiday?: Holiday;
  leave?: import('../../types').LeaveRequest;
  activities?: Activity[];
  isToday: boolean;
  isWeekend: boolean;
}

export interface DayBadges {
  primaryBadge: { text: string; color: string; bgColor: string } | null;
  secondaryDots: { id: string; color: string }[];
  activityCount: number;
}

export function getDayBadges(
  item: CalendarDayItem,
  isDark: boolean
): DayBadges {
  const hasHoliday = !!item.holiday;
  const hasLeave = !!item.leave;
  const hasActivities = (item.activities?.length || 0) > 0;

  let primaryBadge: DayBadges['primaryBadge'] = null;
  const secondaryDots: DayBadges['secondaryDots'] = [];

  if (hasLeave && hasHoliday) {
    const leaveOpt = LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType);
    const leaveColor = leaveOpt?.color || '#f59e0b';
    primaryBadge = {
      text: leaveOpt?.shortLabel || 'ลา',
      color: leaveColor,
      bgColor: isDark ? `${leaveColor}35` : `${leaveColor}18`,
    };
    const holidayCfg = HOLIDAY_TYPE_CONFIG[item.holiday!.type] || HOLIDAY_TYPE_CONFIG.public;
    secondaryDots.push({ id: `holiday-${item.dateStr}`, color: holidayCfg.color || '#64748b' });
  } else if (hasLeave) {
    const leaveOpt = LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType);
    const leaveColor = leaveOpt?.color || '#f59e0b';
    primaryBadge = {
      text: leaveOpt?.shortLabel || 'ลา',
      color: leaveColor,
      bgColor: isDark ? `${leaveColor}35` : `${leaveColor}18`,
    };
  } else if (hasHoliday) {
    const holidayCfg = HOLIDAY_TYPE_CONFIG[item.holiday!.type] || HOLIDAY_TYPE_CONFIG.public;
    primaryBadge = {
      text: holidayCfg.shortLabel || 'หยุด',
      color: holidayCfg.color,
      bgColor: isDark ? `${holidayCfg.color}35` : `${holidayCfg.color}18`,
    };
  }

  if (hasActivities) {
    secondaryDots.push({ id: `act-${item.dateStr}`, color: '#8b5cf6' });
  }

  return { primaryBadge, secondaryDots, activityCount: item.activities?.length || 0 };
}
