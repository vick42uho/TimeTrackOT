import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Lucide Icons
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  Palmtree,
  HeartPulse,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  Coffee,
  Check,
  Building2,
  Info,
  Share2,
  Bell,
  BellOff,
  Dumbbell,
  Heart,
  Utensils,
  Compass,
  Tag,
  MapPin,
  ListTodo,
  Save,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';

// BNA UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker, DateRange } from '@/components/ui/date-picker';
import { BottomSheet, useBottomSheet } from '@/components/ui/bottom-sheet';
import { AlertDialog, useAlertDialog } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

// Custom Hooks & Providers
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { TimeInput } from '../components/TimeInput';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import {
  Holiday,
  HolidayType,
  LeaveRequest,
  LeaveType,
  LeaveDurationType,
  LeaveSummary,
  Activity,
  ActivityCategory,
} from '../types';
import {
  scheduleActivityReminder,
  cancelActivityReminder,
} from '../services/notificationService';

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEKDAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const LEAVE_TYPE_OPTIONS: { type: LeaveType; label: string; shortLabel: string; icon: any; color: string }[] = [
  { type: 'vacation', label: 'ลาพักร้อน (Vacation)', shortLabel: 'พักร้อน', icon: Palmtree, color: '#3b82f6' },
  { type: 'sick', label: 'ลาป่วย (Sick Leave)', shortLabel: 'ลาป่วย', icon: HeartPulse, color: '#ef4444' },
  { type: 'personal', label: 'ลากิจ (Personal Leave)', shortLabel: 'ลากิจ', icon: Briefcase, color: '#f59e0b' },
  { type: 'other', label: 'ลาอื่นๆ (Other)', shortLabel: 'อื่นๆ', icon: Layers, color: '#8b5cf6' },
];

const HOLIDAY_TYPE_CONFIG: Record<
  HolidayType,
  { label: string; shortLabel: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'success'; color: string; icon: any }
> = {
  public: { label: 'วันหยุดนักขัตฤกษ์', shortLabel: 'นักขัตฯ', badgeVariant: 'default', color: '#2563eb', icon: Sparkles },
  company: { label: 'วันหยุดบริษัท', shortLabel: 'หยุด บ.', badgeVariant: 'secondary', color: '#7c3aed', icon: Building2 },
  special: { label: 'วันหยุดพิเศษ', shortLabel: 'พิเศษ', badgeVariant: 'outline', color: '#d97706', icon: Info },
  regular_off: { label: 'วันหยุดปกติ (Day Off)', shortLabel: 'หยุดปกติ', badgeVariant: 'outline', color: '#64748b', icon: Coffee },
  wfh: { label: 'Work From Home (WFH)', shortLabel: 'WFH', badgeVariant: 'success', color: '#16a34a', icon: Home },
};

const ACTIVITY_CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; shortLabel: string; icon: any; color: string; bgColor: string }
> = {
  work: { label: 'งาน / ประชุม', shortLabel: 'งาน', icon: Briefcase, color: '#2563eb', bgColor: '#eff6ff' },
  exercise: { label: 'ออกกำลังกาย', shortLabel: 'วิ่ง/ฟิตเนส', icon: Dumbbell, color: '#10b981', bgColor: '#ecfdf5' },
  personal: { label: 'ส่วนตัว / แฟน', shortLabel: 'นัดแฟน', icon: Heart, color: '#ec4899', bgColor: '#fdf2f8' },
  dining: { label: 'กินข้าว / สังสรรค์', shortLabel: 'กินข้าว', icon: Utensils, color: '#f59e0b', bgColor: '#fffbeb' },
  travel: { label: 'เที่ยว / ทำบุญ', shortLabel: 'เที่ยว/วัด', icon: Compass, color: '#8b5cf6', bgColor: '#f5f3ff' },
  general: { label: 'ทั่วไป', shortLabel: 'ทั่วไป', icon: Tag, color: '#64748b', bgColor: '#f8fafc' },
};

const REMINDER_OPTIONS = [
  { label: 'ไม่เตือน', value: null },
  { label: 'ตรงเวลา', value: 0 },
  { label: 'ก่อน 15 นาที', value: 15 },
  { label: 'ก่อน 30 นาที', value: 30 },
  { label: 'ก่อน 1 ชม.', value: 60 },
  { label: 'ก่อน 1 วัน', value: 1440 },
];

const LeavesContent: React.FC = () => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  const { toast, success, error, warning } = useToast();
  const {
    isReady,
    getHolidays,
    saveHoliday,
    updateHoliday,
    deleteHoliday,
    preloadThaiHolidays,
    setDayHolidayStatus,
    clearDayHolidayStatus,
    getLeaves,
    saveLeave,
    deleteLeave,
    getLeaveSummary,
    saveLeaveQuota,
    getActivitiesForMonth,
    saveActivity,
    updateActivity,
    deleteActivity,
  } = useDatabase();
  const { formatDateThai, getThaiDayName } = useTimeCalculation();

  // Selected Month & Year
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data State
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [summaries, setSummaries] = useState<LeaveSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selected Date on Calendar for quick action
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // BottomSheet & Dialog States
  const dayActionSheet = useBottomSheet();
  const holidaySheet = useBottomSheet();
  const leaveSheet = useBottomSheet();
  const quotaSheet = useBottomSheet();
  const activitySheet = useBottomSheet();
  const deleteHolidayDialog = useAlertDialog();
  const deleteLeaveDialog = useAlertDialog();
  const clearStatusDialog = useAlertDialog();
  const deleteActivityDialog = useAlertDialog();

  // Share Calendar ViewShot Ref & State
  const calendarViewShotRef = React.useRef<any>(null);
  const [isSharingCalendar, setIsSharingCalendar] = useState(false);

  // Item to delete
  const [itemToDelete, setItemToDelete] = useState<{ type: 'holiday' | 'leave'; id: number; name: string } | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  // Holiday Form State (Add / Edit)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState<Date>(new Date());
  const [holidayType, setHolidayType] = useState<HolidayType>('public');

  // Activity Form State (Add / Edit)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [actTitle, setActTitle] = useState('');
  const [actCategory, setActCategory] = useState<ActivityCategory>('general');
  const [actIsAllDay, setActIsAllDay] = useState(false);
  const [actStartTime, setActStartTime] = useState('09:00');
  const [actEndTime, setActEndTime] = useState('10:00');
  const [actReminder, setActReminder] = useState<number | null>(15);
  const [actLocation, setActLocation] = useState('');
  const [actNote, setActNote] = useState('');

  // New Leave Form
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation');
  const [leaveRange, setLeaveRange] = useState<DateRange | undefined>({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [leaveDurationType, setLeaveDurationType] = useState<LeaveDurationType>('full_day');
  const [leaveReason, setLeaveReason] = useState('');

  // Edit Quota State
  const [editingQuotas, setEditingQuotas] = useState<Record<LeaveType, string>>({
    vacation: '6',
    sick: '30',
    personal: '3',
    other: '5',
  });

  // Load Data (High-Performance Single Batch Query)
  const loadAllData = useCallback(async () => {
    if (!isReady) return;
    setIsLoading(true);
    try {
      const [hList, lList, sList, aList] = await Promise.all([
        getHolidays(selectedYear),
        getLeaves(selectedYear),
        getLeaveSummary(selectedYear),
        getActivitiesForMonth(selectedYear, selectedMonth),
      ]);
      setHolidays(hList);
      setLeaves(lList);
      setSummaries(sList);
      setActivities(aList);

      setEditingQuotas((prev) => {
        const quotaMap: Record<LeaveType, string> = { ...prev };
        sList.forEach((s) => {
          quotaMap[s.leaveType] = String(s.quotaDays);
        });
        return quotaMap;
      });
    } catch (err) {
      console.error('Error loading leaves/holidays/activities:', err);
      error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  }, [isReady, selectedYear, selectedMonth, getHolidays, getLeaves, getLeaveSummary, getActivitiesForMonth, error]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  // Quick Holiday / Status Maps by Date String
  const holidayMapByDate = useMemo(() => {
    const map: Record<string, Holiday> = {};
    holidays.forEach((h) => {
      map[h.date] = h;
    });
    return map;
  }, [holidays]);

  // Leave Map by Date
  const leaveMapByDate = useMemo(() => {
    const map: Record<string, LeaveRequest> = {};
    leaves.forEach((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0];
        map[dStr] = l;
      }
    });
    return map;
  }, [leaves]);

  // High-Performance Activity Map by Date String O(1)
  const activitiesByDateMap = useMemo(() => {
    const map = new Map<string, Activity[]>();
    activities.forEach((act) => {
      const list = map.get(act.date) || [];
      list.push(act);
      map.set(act.date, list);
    });
    return map;
  }, [activities]);

  // Selected Day Items
  const selectedDayActivities = useMemo(() => {
    return activitiesByDateMap.get(selectedCalendarDate) || [];
  }, [activitiesByDateMap, selectedCalendarDate]);

  const selectedDateHoliday = holidayMapByDate[selectedCalendarDate];
  const selectedDateLeave = leaveMapByDate[selectedCalendarDate];

  // Preload Thai Holidays Handler
  const handlePreloadThaiHolidays = async () => {
    try {
      setIsLoading(true);
      const count = await preloadThaiHolidays(selectedYear);
      if (count > 0) {
        success('โหลดวันหยุดไทยสำเร็จ', `เพิ่มวันหยุดนักขัตฤกษ์ ${count} วันเรียบร้อยแล้ว`);
      } else {
        toast({
          title: 'มีข้อมูลครบแล้ว',
          description: `วันหยุดนักขัตฤกษ์ปี ${selectedYear + 543} มีอยู่ในระบบเรียบร้อยแล้ว`,
          variant: 'info',
        });
      }
      await loadAllData();
    } catch (err) {
      error('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลวันหยุดได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Calendar Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const days: ({
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      holiday?: Holiday;
      leave?: LeaveRequest;
      activities?: Activity[];
      isToday: boolean;
      isWeekend: boolean;
    } | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Days in month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = selectedMonth.toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();

      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        holiday: holidayMapByDate[dateStr],
        leave: leaveMapByDate[dateStr],
        activities: activitiesByDateMap.get(dateStr) || [],
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, holidayMapByDate, leaveMapByDate, activitiesByDateMap]);

  // Get Leave Badge Helper
  const getLeaveTypeBadge = useCallback((type: LeaveType) => {
    const opt = LEAVE_TYPE_OPTIONS.find((o) => o.type === type);
    if (!opt) return <Badge variant="outline">{type}</Badge>;
    return (
      <Badge
        style={{
          backgroundColor: isDark ? `${opt.color}30` : `${opt.color}15`,
          borderColor: opt.color,
        }}
        textStyle={{ color: opt.color, fontWeight: '600' }}
      >
        {opt.shortLabel}
      </Badge>
    );
  }, [isDark]);

  // Get Holiday Badge Helper
  const getHolidayBadge = useCallback((type: HolidayType, isShort = false) => {
    const cfg = HOLIDAY_TYPE_CONFIG[type] || HOLIDAY_TYPE_CONFIG.public;
    return (
      <Badge
        variant={cfg.badgeVariant}
        style={{
          backgroundColor: isDark ? `${cfg.color}30` : `${cfg.color}15`,
          borderColor: cfg.color,
        }}
        textStyle={{ color: cfg.color, fontWeight: '600' }}
      >
        {isShort ? cfg.shortLabel : cfg.label}
      </Badge>
    );
  }, [isDark]);

  // Unified Monthly Items (Holidays + WFH + Leaves)
  const monthlyItems = useMemo(() => {
    const monthPrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    const items: ({
      type: 'holiday' | 'leave';
      id: number;
      date: string;
      title: string;
      badge: React.ReactNode;
      subText?: string;
      rawHoliday?: Holiday;
      rawLeave?: LeaveRequest;
    })[] = [];

    // 1. Add Holidays / WFH / Regular Off
    holidays.forEach((h) => {
      if (h.date.startsWith(monthPrefix)) {
        items.push({
          type: 'holiday',
          id: h.id || Date.now(),
          date: h.date,
          title: h.name,
          badge: getHolidayBadge(h.type),
          subText: formatDateThai(h.date),
          rawHoliday: h,
        });
      }
    });

    // 2. Add Leaves in this month
    leaves.forEach((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const mStart = new Date(selectedYear, selectedMonth - 1, 1);
      const mEnd = new Date(selectedYear, selectedMonth, 0);

      if (start <= mEnd && end >= mStart) {
        const leaveLabelMap: Record<LeaveType, string> = {
          vacation: 'ลาพักร้อน',
          sick: 'ลาป่วย',
          personal: 'ลากิจ',
          other: 'ลาอื่นๆ',
        };
        const durationText =
          l.durationType === 'half_day_morning'
            ? 'ครึ่งวันเช้า'
            : l.durationType === 'half_day_afternoon'
              ? 'ครึ่งวันบ่าย'
              : `${l.durationDays} วัน`;

        const dateRangeText =
          l.startDate === l.endDate
            ? formatDateThai(l.startDate)
            : `${formatDateThai(l.startDate)} - ${formatDateThai(l.endDate)}`;

        items.push({
          type: 'leave',
          id: l.id || Date.now(),
          date: l.startDate,
          title: `${leaveLabelMap[l.leaveType]} (${durationText})`,
          badge: getLeaveTypeBadge(l.leaveType),
          subText: `${dateRangeText}${l.reason ? ` • ${l.reason}` : ''}`,
          rawLeave: l,
        });
      }
    });

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, leaves, selectedYear, selectedMonth, colors]);

  // Yearly Public & Company Holidays (set once for the whole year)
  const yearlyPublicHolidays = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    return holidays
      .filter((h) => h.date.startsWith(yearPrefix) && (h.type === 'public' || h.type === 'company' || h.type === 'special'))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, selectedYear]);

  // Handle Day Cell Press
  const handleDayPress = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    dayActionSheet.open();
  };

  // Quick Set Day Status (1-Tap)
  const handleQuickSetStatus = async (type: HolidayType, customName?: string) => {
    const defaultNames: Record<HolidayType, string> = {
      wfh: 'ทำงานที่บ้าน (WFH)',
      regular_off: 'วันหยุดปกติ',
      public: 'วันหยุดนักขัตฤกษ์',
      company: 'วันหยุดบริษัท',
      special: 'วันหยุดพิเศษ',
    };

    const name = customName || defaultNames[type];

    // 1. Instant local state update (no freezing/delay)
    setHolidays((prev) => {
      const filtered = prev.filter((h) => h.date !== selectedCalendarDate);
      return [
        ...filtered,
        {
          id: Date.now(),
          name,
          date: selectedCalendarDate,
          type,
          isRecurring: false,
        },
      ].sort((a, b) => a.date.localeCompare(b.date));
    });

    dayActionSheet.close();

    // 2. Persist to SQLite
    const ok = await setDayHolidayStatus(selectedCalendarDate, type, name);
    if (ok) {
      success('บันทึกสำเร็จ', `${name} ในวันที่ ${formatDateThai(selectedCalendarDate)} เรียบร้อย`);
      await loadAllData();
    } else {
      error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกสถานะได้');
      await loadAllData();
    }
  };

  // Quick Clear Day Status
  const handleQuickClearStatus = async () => {
    // 1. Instant local state update
    setHolidays((prev) => prev.filter((h) => h.date !== selectedCalendarDate));
    setLeaves((prev) =>
      prev.filter(
        (l) => !(l.startDate <= selectedCalendarDate && l.endDate >= selectedCalendarDate)
      )
    );

    dayActionSheet.close();

    // 2. Persist to SQLite
    const ok = await clearDayHolidayStatus(selectedCalendarDate);
    if (ok) {
      success('ลบสำเร็จ', `ลบสถานะของวันที่ ${formatDateThai(selectedCalendarDate)} เรียบร้อยแล้ว`);
      await loadAllData();
    } else {
      error('เกิดข้อผิดพลาด', 'ไม่สามารถลบสถานะได้');
      await loadAllData();
    }
  };

  // Share Calendar Image Handler
  const handleShareCalendar = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSharingCalendar(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        warning('ไม่สามารถแชร์ได้', 'อุปกรณ์นี้ไม่รองรับระบบแชร์ไฟล์');
        return;
      }

      if (calendarViewShotRef.current) {
        const uri = await captureRef(calendarViewShotRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `ปฏิทินวันหยุดเดือน${THAI_MONTH_NAMES[selectedMonth - 1]} ${selectedYear + 543}`,
          UTI: 'public.png',
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err) {
      console.error('Error sharing calendar:', err);
      error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกภาพปฏิทินได้');
    } finally {
      setIsSharingCalendar(false);
    }
  };

  // ----------------------------------------------------
  // ACTIVITY HANDLERS (Add, Edit, Delete, Reminder Alert)
  // ----------------------------------------------------
  const handleOpenAddActivity = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingActivity(null);
    setActTitle('');
    setActCategory('general');
    setActIsAllDay(false);
    setActStartTime('09:00');
    setActEndTime('10:00');
    setActReminder(15);
    setActLocation('');
    setActNote('');
    activitySheet.open();
  };

  const handleOpenEditActivity = (act: Activity) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingActivity(act);
    setActTitle(act.title);
    setActCategory(act.category);
    setActIsAllDay(!!act.isAllDay);
    setActStartTime(act.startTime || '09:00');
    setActEndTime(act.endTime || '10:00');
    setActReminder(act.reminderMinutes !== undefined ? act.reminderMinutes : null);
    setActLocation(act.location || '');
    setActNote(act.note || '');
    activitySheet.open();
  };

  const handleSaveActivity = async () => {
    if (!actTitle.trim()) {
      warning('กรุณากรอกข้อมูล', 'กรุณาระบุชื่อกิจกรรมหรือนัดหมาย');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (editingActivity?.id) {
        // 1. Edit existing activity
        const updatedFields: Partial<Activity> = {
          title: actTitle.trim(),
          category: actCategory,
          isAllDay: actIsAllDay,
          startTime: actIsAllDay ? undefined : actStartTime,
          endTime: actIsAllDay ? undefined : actEndTime,
          reminderMinutes: actReminder,
          location: actLocation.trim() || undefined,
          note: actNote.trim() || undefined,
        };

        // Instant local state update
        setActivities((prev) =>
          prev.map((a) => (a.id === editingActivity.id ? { ...a, ...updatedFields } : a))
        );

        activitySheet.close();

        // Background notification management
        if (editingActivity.notificationId) {
          await cancelActivityReminder(editingActivity.notificationId);
        }

        let newNotificationId: string | undefined;
        if (actReminder !== null) {
          newNotificationId = await scheduleActivityReminder({
            ...editingActivity,
            ...updatedFields,
          });
        }

        await updateActivity(editingActivity.id, {
          ...updatedFields,
          notificationId: newNotificationId,
        });

        success('แก้ไขสำเร็จ', `อัปเดตนัดหมาย "${actTitle.trim()}" เรียบร้อยแล้ว`);
      } else {
        // 2. Add new activity
        const newActData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> = {
          title: actTitle.trim(),
          date: selectedCalendarDate,
          category: actCategory,
          isAllDay: actIsAllDay,
          startTime: actIsAllDay ? undefined : actStartTime,
          endTime: actIsAllDay ? undefined : actEndTime,
          reminderMinutes: actReminder,
          location: actLocation.trim() || undefined,
          note: actNote.trim() || undefined,
        };

        activitySheet.close();

        // Instant local state update with temp ID
        const tempId = Date.now();
        setActivities((prev) => [...prev, { ...newActData, id: tempId }]);

        const newId = await saveActivity(newActData);

        // Schedule notification if reminder set
        if (actReminder !== null) {
          const notificationId = await scheduleActivityReminder({
            ...newActData,
            id: newId,
          });
          if (notificationId) {
            await updateActivity(newId, { notificationId });
          }
        }

        const refreshed = await getActivitiesForMonth(selectedYear, selectedMonth);
        setActivities(refreshed);

        success('บันทึกสำเร็จ', `เพิ่มนัดหมาย "${actTitle.trim()}" เรียบร้อยแล้ว`);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกกิจกรรมได้');
      const refreshed = await getActivitiesForMonth(selectedYear, selectedMonth);
      setActivities(refreshed);
    }
  };

  const handleDeleteActivityPrompt = (act: Activity) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setActivityToDelete(act);
    deleteActivityDialog.open();
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete || activityToDelete.id === undefined) return;
    const target = activityToDelete;
    const targetId = target.id!;
    deleteActivityDialog.close();

    // Instant local state update
    setActivities((prev) => prev.filter((a) => a.id !== targetId));

    try {
      if (target.notificationId) {
        await cancelActivityReminder(target.notificationId);
      }
      await deleteActivity(targetId);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      success('ลบกิจกรรมสำเร็จ', `ลบ "${target.title}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Error deleting activity:', err);
      error('เกิดข้อผิดพลาด', 'ไม่สามารถลบกิจกรรมได้');
      const refreshed = await getActivitiesForMonth(selectedYear, selectedMonth);
      setActivities(refreshed);
    }
  };

  // Open Add Holiday
  const handleOpenAddHoliday = (defaultDate?: Date) => {
    setEditingHoliday(null);
    setHolidayName('');
    setHolidayDate(defaultDate || new Date(selectedYear, selectedMonth - 1, 1));
    setHolidayType('public');
    holidaySheet.open();
  };

  // Open Edit Holiday
  const handleOpenEditHoliday = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayName(h.name);
    if (h.date) {
      const [y, m, d] = h.date.split('-').map(Number);
      setHolidayDate(new Date(y, m - 1, d));
    } else {
      setHolidayDate(new Date());
    }
    setHolidayType(h.type);
    holidaySheet.open();
  };

  // Save or Update Holiday Form
  const handleSaveCustomHoliday = async () => {
    if (!holidayName.trim()) {
      warning('กรุณากรอกข้อมูล', 'กรุณาระบุชื่อวันหยุด');
      return;
    }

    const year = holidayDate.getFullYear();
    const month = (holidayDate.getMonth() + 1).toString().padStart(2, '0');
    const day = holidayDate.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    if (editingHoliday?.id) {
      // 1. Instant local state update for Edit
      setHolidays((prev) =>
        prev
          .map((h) =>
            h.id === editingHoliday.id
              ? { ...h, name: holidayName.trim(), date: dateString, type: holidayType }
              : h
          )
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      holidaySheet.close();

      const ok = await updateHoliday(editingHoliday.id, {
        name: holidayName.trim(),
        date: dateString,
        type: holidayType,
      });

      if (ok) {
        success('แก้ไขสำเร็จ', `อัปเดต "${holidayName.trim()}" เรียบร้อยแล้ว`);
        await loadAllData();
      } else {
        error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการแก้ไขได้');
        await loadAllData();
      }
    } else {
      // 1. Instant local state update for New
      setHolidays((prev) => {
        const filtered = prev.filter((h) => h.date !== dateString);
        return [
          ...filtered,
          {
            id: Date.now(),
            name: holidayName.trim(),
            date: dateString,
            type: holidayType,
            isRecurring: false,
          },
        ].sort((a, b) => a.date.localeCompare(b.date));
      });

      holidaySheet.close();

      const ok = await saveHoliday({
        name: holidayName.trim(),
        date: dateString,
        type: holidayType,
        isRecurring: false,
      });

      if (ok) {
        success('บันทึกสำเร็จ', `เพิ่ม "${holidayName.trim()}" เรียบร้อยแล้ว`);
        await loadAllData();
      } else {
        error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกวันหยุดได้');
        await loadAllData();
      }
    }
  };

  // Save Leave Request
  const handleSaveLeave = async () => {
    if (!leaveRange?.startDate || !leaveRange?.endDate) {
      warning('กรุณากรอกข้อมูล', 'กรุณาเลือกช่วงวันที่ต้องการลา');
      return;
    }

    const sDate = leaveRange.startDate;
    const eDate = leaveRange.endDate;

    const sYear = sDate.getFullYear();
    const sMonth = (sDate.getMonth() + 1).toString().padStart(2, '0');
    const sDay = sDate.getDate().toString().padStart(2, '0');
    const startStr = `${sYear}-${sMonth}-${sDay}`;

    const eYear = eDate.getFullYear();
    const eMonth = (eDate.getMonth() + 1).toString().padStart(2, '0');
    const eDay = eDate.getDate().toString().padStart(2, '0');
    const endStr = `${eYear}-${eMonth}-${eDay}`;

    let duration = 0;
    if (leaveDurationType !== 'full_day') {
      duration = 0.5;
    } else {
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      duration = diffDays;
    }

    setLeaveReason('');
    setLeaveDurationType('full_day');
    leaveSheet.close();
    dayActionSheet.close();

    const ok = await saveLeave({
      leaveType,
      startDate: startStr,
      endDate: endStr,
      durationDays: duration,
      durationType: leaveDurationType,
      reason: leaveReason.trim() || undefined,
      status: 'approved',
    });

    if (ok) {
      success('บันทึกการลาสำเร็จ', `บันทึกการลา ${duration} วันเรียบร้อยแล้ว`);
      await loadAllData();
    } else {
      error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการลาได้');
      await loadAllData();
    }
  };

  // Save Quota Changes
  const handleSaveQuotas = async () => {
    try {
      setIsLoading(true);
      for (const t of ['vacation', 'sick', 'personal', 'other'] as LeaveType[]) {
        const val = parseFloat(editingQuotas[t] || '0');
        await saveLeaveQuota(selectedYear, t, isNaN(val) ? 0 : val);
      }
      success('อัปเดตโควตาสำเร็จ', `บันทึกโควตาวันลาประจำปี ${selectedYear + 543} เรียบร้อยแล้ว`);
      quotaSheet.close();
      await loadAllData();
    } catch (err) {
      error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกโควตาได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Item Action
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'holiday') {
      setHolidays((prev) => prev.filter((h) => h.id !== itemToDelete.id));
      deleteHolidayDialog.close();
      const ok = await deleteHoliday(itemToDelete.id);
      if (ok) {
        success('ลบสำเร็จ', `ลบรายการ "${itemToDelete.name}" เรียบร้อยแล้ว`);
        await loadAllData();
      } else {
        error('เกิดข้อผิดพลาด', 'ไม่สามารถลบรายการได้');
        await loadAllData();
      }
    } else {
      setLeaves((prev) => prev.filter((l) => l.id !== itemToDelete.id));
      deleteLeaveDialog.close();
      const ok = await deleteLeave(itemToDelete.id);
      if (ok) {
        success('ลบสำเร็จ', `ลบประวัติการลาเรียบร้อยแล้ว`);
        await loadAllData();
      } else {
        error('เกิดข้อผิดพลาด', 'ไม่สามารถลบประวัติได้');
        await loadAllData();
      }
    }
  };

  // Current selected day status
  const currentDayHoliday = holidayMapByDate[selectedCalendarDate];
  const currentDayLeave = leaveMapByDate[selectedCalendarDate];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text variant="title" style={{ fontSize: 20, fontWeight: '700' }}>
            วันหยุด & วันลา
          </Text>
          <Text variant="caption" style={{ color: colors.textSecondary }}>
            จัดการปฏิทินวันหยุด วันลา และ Work From Home
          </Text>
        </View>

        {/* Year Selector */}
        <View style={styles.headerRightRow}>
          <View style={[styles.yearBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setSelectedYear((prev) => prev - 1)}
              style={styles.yearArrowBtn}
            >
              <ChevronLeft size={16} color={colors.text} />
            </TouchableOpacity>
            <Text variant="caption" style={{ fontWeight: '700', paddingHorizontal: 6 }}>
              พ.ศ. {selectedYear + 543}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedYear((prev) => prev + 1)}
              style={styles.yearArrowBtn}
            >
              <ChevronRight size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Tabs */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
        <Tabs defaultValue="calendar" style={{ flex: 1 }}>
          <TabsList style={{ marginBottom: 10 }}>
            <TabsTrigger value="calendar">ปฏิทิน & วันหยุด</TabsTrigger>
            <TabsTrigger value="leaves">การลา ({leaves.length})</TabsTrigger>
            <TabsTrigger value="quota">โควตา</TabsTrigger>
          </TabsList>

          {/* ========================================================= */}
          {/* TAB 1: INTERACTIVE CALENDAR & HOLIDAYS */}
          {/* ========================================================= */}
          <TabsContent value="calendar" style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
              {/* Calendar Container with ViewShot for Sharing */}
              <ViewShot
                ref={calendarViewShotRef}
                options={{ format: 'png', quality: 1.0 }}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  overflow: 'hidden',
                  marginBottom: 10,
                }}
              >
                <Card style={{ padding: 12, backgroundColor: colors.card }}>
                  {/* Month Navigator Header */}
                  <View style={styles.calendarMonthHeader}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                      <ChevronLeft size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <Text variant="subtitle" style={{ fontWeight: '700', fontSize: 16 }}>
                      {THAI_MONTH_NAMES[selectedMonth - 1]} {selectedYear + 543}
                    </Text>

                    <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                      <ChevronRight size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Weekday Row */}
                  <View style={styles.weekdayRow}>
                    {WEEKDAY_NAMES.map((w, idx) => (
                      <View key={w} style={styles.weekdayCell}>
                        <Text
                          variant="caption"
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: idx === 0 ? '#ef4444' : idx === 6 ? '#8b5cf6' : colors.textSecondary,
                          }}
                        >
                          {w}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Days Grid */}
                  <View style={styles.daysGrid}>
                    {calendarDays.map((item, index) => {
                      if (!item) {
                        return <View key={`empty-${index}`} style={styles.dayCell} />;
                      }

                      const isSelected = item.dateStr === selectedCalendarDate;
                      const hasHoliday = !!item.holiday;
                      const hasLeave = !!item.leave;
                      const hasActivities = (item.activities?.length || 0) > 0;

                      return (
                        <TouchableOpacity
                          key={item.dateStr}
                          onPress={() => handleDayPress(item.dateStr)}
                          style={[
                            styles.dayCell,
                            item.isWeekend && { backgroundColor: isDark ? '#ffffff05' : '#f8fafc' },
                            isSelected && {
                              borderColor: colors.primary,
                              borderWidth: 1.5,
                              backgroundColor: isDark ? `${colors.primary}25` : '#eff6ff',
                            },
                            item.isToday && !isSelected && {
                              borderWidth: 1,
                              borderColor: colors.primary,
                            },
                          ]}
                        >
                          {/* Day Number */}
                          <Text
                            style={[
                              styles.dayNumberText,
                              {
                                color: item.isToday
                                  ? colors.primary
                                  : item.isWeekend
                                    ? colors.textSecondary
                                    : colors.text,
                                fontWeight: item.isToday || isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {item.dayNumber}
                          </Text>

                          {/* Status Badges on Calendar Day */}
                          {hasHoliday && (
                            <View
                              style={[
                                styles.calendarMiniTag,
                                {
                                  backgroundColor: isDark
                                    ? `${HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.color || '#3b82f6'}40`
                                    : `${HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.color || '#3b82f6'}20`,
                                },
                              ]}
                            >
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.calendarMiniTagText,
                                  { color: HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.color || colors.primary },
                                ]}
                              >
                                {HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.shortLabel || 'หยุด'}
                              </Text>
                            </View>
                          )}

                          {hasLeave && (
                            <View
                              style={[
                                styles.calendarMiniTag,
                                {
                                  backgroundColor: isDark
                                    ? `${LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.color || '#f59e0b'}40`
                                    : `${LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.color || '#f59e0b'}20`,
                                },
                              ]}
                            >
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.calendarMiniTagText,
                                  {
                                    color:
                                      LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.color ||
                                      '#f59e0b',
                                  },
                                ]}
                              >
                                {LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.shortLabel || 'ลา'}
                              </Text>
                            </View>
                          )}

                          {/* Activity Dot on Calendar Day */}
                          {hasActivities && (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                marginTop: 1,
                              }}
                            >
                              <View
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 2.5,
                                  backgroundColor: '#8b5cf6',
                                }}
                              />
                              {item.activities && item.activities.length > 1 && (
                                <Text style={{ fontSize: 8, color: '#8b5cf6', fontWeight: '700' }}>
                                  {item.activities.length}
                                </Text>
                              )}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Calendar Legend / Guide */}
                  <View style={styles.calendarLegendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                      <Text variant="caption" style={{ fontSize: 11 }}>นักขัตฯ</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
                      <Text variant="caption" style={{ fontSize: 11 }}>WFH</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#64748b' }]} />
                      <Text variant="caption" style={{ fontSize: 11 }}>หยุดปกติ</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                      <Text variant="caption" style={{ fontSize: 11 }}>วันลา</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
                      <Text variant="caption" style={{ fontSize: 11 }}>กิจกรรม</Text>
                    </View>
                  </View>

                  {/* Subtle Watermark Footer on Shared Image */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: isDark ? '#27272a' : '#f1f5f9',
                    }}
                  >
                    <Text variant="caption" style={{ fontSize: 11, color: colors.textSecondary }}>
                      ตารางวันหยุด & วันทำงาน
                    </Text>
                    <Text
                      variant="caption"
                      style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}
                    >
                      TimeTrack OT
                    </Text>
                  </View>
                </Card>
              </ViewShot>

              {/* Compact Share Calendar Pill Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isSharingCalendar}
                onPress={handleShareCalendar}
                style={{
                  alignSelf: 'center',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe',
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff',
                  marginVertical: 8,
                }}
              >
                <Share2 size={14} color={isDark ? '#60a5fa' : '#2563eb'} />
                <Text
                  variant="caption"
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: isDark ? '#60a5fa' : '#2563eb',
                    fontFamily: 'Sarabun_600SemiBold',
                  }}
                >
                  {isSharingCalendar
                    ? 'กำลังเตรียมภาพปฏิทิน...'
                    : `แชร์รูปปฏิทินเดือน${THAI_MONTH_NAMES[selectedMonth - 1]}`}
                </Text>
              </TouchableOpacity>

              {/* SELECTED DAY SCHEDULE & ACTIVITIES CARD */}
              <Card style={{ marginBottom: 14, padding: 14 }}>
                {/* Header with Date & Day Status */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                      variant="caption"
                      style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 12 }}
                    >
                      {getThaiDayName(selectedCalendarDate)}
                    </Text>
                    <Text variant="subtitle" style={{ fontWeight: '700', fontSize: 15 }}>
                      {formatDateThai(selectedCalendarDate)}
                    </Text>
                  </View>

                  {/* Day Status Badge */}
                  {selectedDateHoliday ? (
                    getHolidayBadge(selectedDateHoliday.type)
                  ) : selectedDateLeave ? (
                    getLeaveTypeBadge(selectedDateLeave.leaveType)
                  ) : (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                      }}
                    >
                      <Briefcase size={12} color={colors.textSecondary} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                        วันทำงานปกติ
                      </Text>
                    </View>
                  )}
                </View>

                {/* Activities List for Selected Day */}
                {selectedDayActivities.length > 0 ? (
                  <View style={{ gap: 8, marginBottom: 12 }}>
                    {selectedDayActivities.map((act) => {
                      const catCfg =
                        ACTIVITY_CATEGORY_CONFIG[act.category] || ACTIVITY_CATEGORY_CONFIG.general;
                      const CatIcon = catCfg.icon;

                      return (
                        <View
                          key={act.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 10,
                            borderRadius: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: catCfg.color,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                            borderWidth: 1,
                            borderColor: isDark ? '#27272a' : '#f1f5f9',
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 8 }}>
                            {/* Title & Category */}
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 2,
                              }}
                            >
                              <CatIcon size={14} color={catCfg.color} />
                              <Text
                                style={{
                                  fontWeight: '700',
                                  fontSize: 14,
                                  color: colors.text,
                                }}
                              >
                                {act.title}
                              </Text>
                            </View>

                            {/* Time & Badges */}
                            <View
                              style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 2,
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} color={colors.textSecondary} />
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                  {act.isAllDay
                                    ? 'ตลอดวัน'
                                    : `${act.startTime || ''}${act.endTime ? ` - ${act.endTime}` : ''} น.`}
                                </Text>
                              </View>

                              {act.location && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                  <MapPin size={12} color={colors.textSecondary} />
                                  <Text
                                    style={{ fontSize: 12, color: colors.textSecondary }}
                                    numberOfLines={1}
                                  >
                                    {act.location}
                                  </Text>
                                </View>
                              )}

                              {act.reminderMinutes !== null && act.reminderMinutes !== undefined && (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 3,
                                    backgroundColor: isDark
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : '#fef3c7',
                                    paddingHorizontal: 6,
                                    paddingVertical: 1,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Bell size={10} color="#f59e0b" />
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      color: '#d97706',
                                      fontWeight: '600',
                                    }}
                                  >
                                    {act.reminderMinutes === 0
                                      ? 'ตรงเวลา'
                                      : act.reminderMinutes === 15
                                      ? 'ก่อน 15 นาที'
                                      : act.reminderMinutes === 30
                                      ? 'ก่อน 30 นาที'
                                      : act.reminderMinutes === 60
                                      ? 'ก่อน 1 ชม.'
                                      : act.reminderMinutes === 1440
                                      ? 'ก่อน 1 วัน'
                                      : `ก่อน ${act.reminderMinutes} น.`}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {act.note && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textSecondary,
                                  marginTop: 3,
                                }}
                              >
                                {act.note}
                              </Text>
                            )}
                          </View>

                          {/* Actions: Edit & Delete */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <TouchableOpacity
                              onPress={() => handleOpenEditActivity(act)}
                              style={{ padding: 6 }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Edit3 size={16} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteActivityPrompt(act)}
                              style={{ padding: 6 }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View
                    style={{
                      paddingVertical: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      ยังไม่มีกิจกรรมหรือนัดหมายในวันนี้
                    </Text>
                  </View>
                )}

                {/* Button to Add Activity */}
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onPress={handleOpenAddActivity}
                  style={{
                    borderColor: colors.primary,
                    backgroundColor: isDark ? `${colors.primary}15` : '#eff6ff',
                    minHeight: 38,
                  }}
                  textStyle={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}
                >
                  เพิ่มกิจกรรม / นัดหมายในวันนี้
                </Button>
              </Card>

              {/* Accordion: Monthly vs Yearly */}
              <View style={{ marginTop: 14 }}>
                <Accordion type="multiple" defaultValue={['item-month']}>
                  {/* ACCORDION 1: Monthly Events List */}
                  <AccordionItem value="item-month">
                    <Card style={{ marginBottom: 12 }}>
                      <AccordionTrigger>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <CalendarIcon size={18} color={colors.primary} />
                          <Text variant="subtitle" style={{ fontWeight: '700' }}>
                            รายการในเดือน{THAI_MONTH_NAMES[selectedMonth - 1]} ({monthlyItems.length})
                          </Text>
                        </View>
                      </AccordionTrigger>
                      <AccordionContent style={{ marginTop: 10, paddingBottom: 4 }}>
                        {isLoading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                          </View>
                        ) : monthlyItems.length > 0 ? (
                          <View style={{ gap: 8 }}>
                            {monthlyItems.map((item) => (
                              <View
                                key={`${item.type}-${item.id}`}
                                style={[
                                  styles.accordionItemCard,
                                  {
                                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                    borderColor: colors.border,
                                  },
                                ]}
                              >
                                <TouchableOpacity
                                  style={{ flex: 1, marginRight: 8 }}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    if (item.type === 'holiday' && item.rawHoliday) {
                                      handleOpenEditHoliday(item.rawHoliday);
                                    }
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    {item.badge}
                                    <Text variant="caption" style={{ color: colors.textSecondary }}>
                                      {getThaiDayName(item.date)}
                                    </Text>
                                  </View>
                                  <Text variant="subtitle" style={{ fontWeight: '600', marginBottom: 2 }}>
                                    {item.title}
                                  </Text>
                                  <Text variant="caption" style={{ color: colors.primary, fontWeight: '500' }}>
                                    {item.subText}
                                  </Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  {item.type === 'holiday' && item.rawHoliday && (
                                    <TouchableOpacity
                                      onPress={() => handleOpenEditHoliday(item.rawHoliday!)}
                                      style={[styles.iconEditBtn, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}
                                    >
                                      <Edit3 size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                  )}
                                  <TouchableOpacity
                                    onPress={() => {
                                      setItemToDelete({ type: item.type, id: item.id, name: item.title });
                                      if (item.type === 'holiday') {
                                        deleteHolidayDialog.open();
                                      } else {
                                        deleteLeaveDialog.open();
                                      }
                                    }}
                                    style={[styles.iconDeleteBtn, { backgroundColor: colors.errorLight || '#fee2e2' }]}
                                  >
                                    <Trash2 size={16} color="#ef4444" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                            <Text variant="caption" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                              ไม่มีรายการในเดือนนี้ แตะวันที่บนปฏิทินเพื่อกำหนด WFH, วันหยุด หรือการลา
                            </Text>
                          </View>
                        )}
                      </AccordionContent>
                    </Card>
                  </AccordionItem>

                  {/* ACCORDION 2: Yearly Public / Company Holidays */}
                  <AccordionItem value="item-year">
                    <Card style={{ marginBottom: 12 }}>
                      <AccordionTrigger>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Building2 size={18} color="#2563eb" />
                          <Text variant="subtitle" style={{ fontWeight: '700' }}>
                            วันหยุดประจำปี พ.ศ. {selectedYear + 543} ({yearlyPublicHolidays.length} วัน)
                          </Text>
                        </View>
                      </AccordionTrigger>
                      <AccordionContent style={{ marginTop: 10, paddingBottom: 4 }}>
                        {/* Quick action bar for preload / add */}
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Download}
                            style={{ flex: 1 }}
                            onPress={handlePreloadThaiHolidays}
                          >
                            โหลดวันหยุดไทย
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            icon={Plus}
                            style={{ flex: 1 }}
                            onPress={() => handleOpenAddHoliday(new Date(selectedYear, selectedMonth - 1, 1))}
                          >
                            เพิ่มวันหยุด
                          </Button>
                        </View>

                        {yearlyPublicHolidays.length > 0 ? (
                          <View style={{ gap: 8 }}>
                            {yearlyPublicHolidays.map((h) => (
                              <View
                                key={h.id || h.date}
                                style={[
                                  styles.accordionItemCard,
                                  {
                                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                    borderColor: colors.border,
                                  },
                                ]}
                              >
                                <TouchableOpacity
                                  style={{ flex: 1, marginRight: 8 }}
                                  activeOpacity={0.7}
                                  onPress={() => handleOpenEditHoliday(h)}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    {getHolidayBadge(h.type)}
                                    <Text variant="caption" style={{ color: colors.textSecondary }}>
                                      {getThaiDayName(h.date)}
                                    </Text>
                                  </View>
                                  <Text variant="subtitle" style={{ fontWeight: '600', marginBottom: 2 }}>
                                    {h.name}
                                  </Text>
                                  <Text variant="caption" style={{ color: colors.primary, fontWeight: '500' }}>
                                    {formatDateThai(h.date)}
                                  </Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <TouchableOpacity
                                    onPress={() => handleOpenEditHoliday(h)}
                                    style={[styles.iconEditBtn, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}
                                  >
                                    <Edit3 size={16} color={colors.primary} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => {
                                      setItemToDelete({ type: 'holiday', id: h.id!, name: h.name });
                                      deleteHolidayDialog.open();
                                    }}
                                    style={[styles.iconDeleteBtn, { backgroundColor: colors.errorLight || '#fee2e2' }]}
                                  >
                                    <Trash2 size={16} color="#ef4444" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                            <Text
                              variant="caption"
                              style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 8 }}
                            >
                              ยังไม่ได้ตั้งค่าวัดหยุดประจำปี {selectedYear + 543}
                            </Text>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Download}
                              onPress={handlePreloadThaiHolidays}
                            >
                              โหลดวันหยุดไทยอัตโนมัติ ({selectedYear + 543})
                            </Button>
                          </View>
                        )}
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                </Accordion>
              </View>
            </ScrollView>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: LEAVE HISTORY & REQUEST */}
          {/* ========================================================= */}
          <TabsContent value="leaves" style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
              {/* Summary Stats Pill Row */}
              <View style={styles.leaveStatsRow}>
                {summaries.map((s) => (
                  <View
                    key={s.leaveType}
                    style={[
                      styles.leaveStatBox,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text variant="caption" style={{ color: colors.textSecondary, fontSize: 11 }}>
                      {s.leaveType === 'vacation'
                        ? 'พักร้อน'
                        : s.leaveType === 'sick'
                          ? 'ลาป่วย'
                          : s.leaveType === 'personal'
                            ? 'ลากิจ'
                            : 'อื่นๆ'}
                    </Text>
                    <Text variant="title" style={{ fontWeight: '700', marginVertical: 2, fontSize: 14 }}>
                      {s.usedDays}{' '}
                      <Text variant="caption" style={{ fontSize: 11 }}>
                        / {s.quotaDays} วัน
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              <Button
                variant="default"
                size="lg"
                icon={Plus}
                style={{ marginVertical: 12 }}
                onPress={leaveSheet.open}
              >
                ยื่นขอลา / บันทึกการลา
              </Button>

              {/* Leave List */}
              <View style={{ gap: 8 }}>
                {leaves.map((l) => (
                  <Card key={l.id} style={styles.holidayCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {getLeaveTypeBadge(l.leaveType)}
                          <Text variant="caption" style={{ color: colors.textSecondary }}>
                            {l.durationDays} วัน
                          </Text>
                        </View>
                        <Text variant="subtitle" style={{ fontWeight: '600', marginBottom: 2 }}>
                          {formatDateThai(l.startDate)} - {formatDateThai(l.endDate)}
                        </Text>
                        {l.reason && (
                          <Text variant="caption" style={{ color: colors.textSecondary }}>{l.reason}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setItemToDelete({ type: 'leave', id: l.id!, name: 'ประวัติการลา' });
                          deleteLeaveDialog.open();
                        }}
                        style={[styles.iconDeleteBtn, { backgroundColor: colors.errorLight || '#fee2e2' }]}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </View>
            </ScrollView>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 3: QUOTA & SUMMARY */}
          {/* ========================================================= */}
          <TabsContent value="quota" style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text variant="subtitle" style={{ fontWeight: '700' }}>
                  โควตาวันลาประจำปี {selectedYear + 543}
                </Text>
                <Button variant="outline" size="sm" icon={RefreshCw} onPress={quotaSheet.open}>
                  แก้ไขโควตา
                </Button>
              </View>

              <View style={{ gap: 12 }}>
                {summaries.map((s) => {
                  const percent = s.quotaDays > 0 ? Math.min(100, Math.round((s.usedDays / s.quotaDays) * 100)) : 0;
                  return (
                    <Card key={s.leaveType}>
                      <CardHeader style={{ marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {getLeaveTypeBadge(s.leaveType)}
                            <Text variant="subtitle" style={{ fontWeight: '600' }}>{s.label.split(' ')[0]}</Text>
                          </View>
                          <Badge variant={s.remainingDays > 0 ? 'success' : 'destructive'}>
                            เหลือ {s.remainingDays} วัน
                          </Badge>
                        </View>
                      </CardHeader>
                      <CardContent>
                        <View style={styles.quotaBarBg}>
                          <View
                            style={[
                              styles.quotaBarFill,
                              {
                                width: `${percent}%`,
                                backgroundColor:
                                  percent > 90 ? '#ef4444' : percent > 60 ? '#f59e0b' : colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                          <Text variant="caption" style={{ color: colors.textSecondary }}>
                            ใช้ไป {s.usedDays} วัน ({percent}%)
                          </Text>
                          <Text variant="caption" style={{ color: colors.textSecondary }}>
                            โควตาทั้งหมด {s.quotaDays} วัน
                          </Text>
                        </View>
                      </CardContent>
                    </Card>
                  );
                })}
              </View>
            </ScrollView>
          </TabsContent>
        </Tabs>
      </View>

      {/* ========================================================= */}
      {/* BOTTOM SHEET 1: DAY QUICK ACTION & ACTIVITIES (1-TAP) */}
      {/* ========================================================= */}
      <BottomSheet
        isVisible={dayActionSheet.isVisible}
        onClose={dayActionSheet.close}
        snapPoints={[0.95]}
        title="จัดการวันที่ & กิจกรรม"
      >
        <View style={{ paddingBottom: 20 }}>
          {/* Selected Date Header */}
          <View style={[styles.dayActionHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <CalendarIcon size={18} color={colors.primary} />
            <Text variant="subtitle" style={{ fontWeight: '700', marginLeft: 8, fontSize: 14 }}>
              {formatDateThai(selectedCalendarDate)} ({getThaiDayName(selectedCalendarDate)})
            </Text>
          </View>

          {/* Current Status on this date if any */}
          {(currentDayHoliday || currentDayLeave) && (
            <View style={[styles.currentStatusBox, { borderColor: colors.border }]}>
              <Text variant="caption" style={{ color: colors.textSecondary, marginBottom: 2 }}>
                สถานะปัจจุบัน:
              </Text>
              {currentDayHoliday && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {getHolidayBadge(currentDayHoliday.type)}
                  <Text variant="subtitle" style={{ fontWeight: '600', fontSize: 14 }}>{currentDayHoliday.name}</Text>
                </View>
              )}
              {currentDayLeave && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {getLeaveTypeBadge(currentDayLeave.leaveType)}
                  <Text variant="subtitle" style={{ fontWeight: '600', fontSize: 14 }}>
                    ลางาน ({currentDayLeave.durationDays} วัน) {currentDayLeave.reason ? `- ${currentDayLeave.reason}` : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Existing Activities on this Date */}
          {selectedDayActivities.length > 0 && (
            <View
              style={[
                styles.currentStatusBox,
                {
                  borderColor: '#8b5cf6',
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#f5f3ff',
                  marginBottom: 12,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text variant="caption" style={{ color: '#8b5cf6', fontWeight: '700', fontSize: 12 }}>
                  กิจกรรมในวันนี้ ({selectedDayActivities.length}):
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    dayActionSheet.close();
                    handleOpenAddActivity();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>+ เพิ่มอีก</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 6 }}>
                {selectedDayActivities.map((act) => {
                  const catCfg =
                    ACTIVITY_CATEGORY_CONFIG[act.category] || ACTIVITY_CATEGORY_CONFIG.general;
                  const CatIcon = catCfg.icon;
                  return (
                    <View
                      key={act.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.card,
                        padding: 8,
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: catCfg.color,
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <CatIcon size={12} color={catCfg.color} />
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                            {act.title}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {act.isAllDay ? 'ตลอดวัน' : `${act.startTime || ''}${act.endTime ? ` - ${act.endTime}` : ''} น.`}
                          {act.location ? ` • ${act.location}` : ''}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity
                          onPress={() => {
                            dayActionSheet.close();
                            handleOpenEditActivity(act);
                          }}
                          style={{ padding: 4 }}
                        >
                          <Edit3 size={15} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            dayActionSheet.close();
                            handleDeleteActivityPrompt(act);
                          }}
                          style={{ padding: 4 }}
                        >
                          <Trash2 size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <Text variant="caption" style={{ color: colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>
            เลือกการดำเนินการ:
          </Text>

          {/* Quick Action Grid */}
          <View style={{ gap: 8 }}>
            {/* 1. Add Activity / Appointment for this day (Highlighted Option) */}
            <TouchableOpacity
              style={[
                styles.quickActionBtn,
                {
                  borderColor: '#8b5cf6',
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                },
              ]}
              onPress={() => {
                dayActionSheet.close();
                handleOpenAddActivity();
              }}
            >
              <Plus size={20} color="#8b5cf6" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: '#8b5cf6', fontSize: 15 }}>
                  เพิ่มกิจกรรม / นัดหมาย
                </Text>
                <Text variant="caption" style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>
                  บันทึกกิจกรรม พร้อมตั้งเวลาแจ้งเตือน
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2. Set as WFH */}
            <TouchableOpacity
              style={[styles.quickActionBtn, { borderColor: '#16a34a', backgroundColor: isDark ? '#14532d30' : '#f0fdf4' }]}
              onPress={() => handleQuickSetStatus('wfh', 'ทำงานที่บ้าน (WFH)')}
            >
              <Home size={20} color="#16a34a" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: '#16a34a' }}>Work From Home (WFH)</Text>
                <Text variant="caption" style={{ color: isDark ? '#86efac' : '#15803d' }}>
                  กำหนดให้วันนี้เป็นการทำงานที่บ้าน
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Set as Regular Day Off */}
            <TouchableOpacity
              style={[styles.quickActionBtn, { borderColor: '#64748b', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              onPress={() => handleQuickSetStatus('regular_off', 'วันหยุดปกติ')}
            >
              <Coffee size={20} color="#64748b" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>วันหยุดปกติ (Day Off)</Text>
                <Text variant="caption" style={{ color: colors.textSecondary }}>
                  กำหนดให้วันนี้เป็นวันหยุดประจำสัปดาห์
                </Text>
              </View>
            </TouchableOpacity>

            {/* 4. Leave Request for this day */}
            <TouchableOpacity
              style={[styles.quickActionBtn, { borderColor: '#3b82f6', backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}
              onPress={() => {
                const targetDate = new Date(selectedCalendarDate);
                setLeaveRange({ startDate: targetDate, endDate: targetDate });
                dayActionSheet.close();
                leaveSheet.open();
              }}
            >
              <Briefcase size={20} color="#3b82f6" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: '#3b82f6' }}>ยื่นขอลาสำหรับวันนี้</Text>
                <Text variant="caption" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                  ขอลาพักร้อน, ลาป่วย หรือลากิจ
                </Text>
              </View>
            </TouchableOpacity>

            {/* 5. Custom Holiday / Edit Holiday */}
            <TouchableOpacity
              style={[styles.quickActionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => {
                dayActionSheet.close();
                if (currentDayHoliday) {
                  handleOpenEditHoliday(currentDayHoliday);
                } else {
                  handleOpenAddHoliday(new Date(selectedCalendarDate));
                }
              }}
            >
              <Building2 size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>
                  {currentDayHoliday ? 'แก้ไขวันหยุด / สถานะ' : 'เพิ่มวันหยุดนักขัตฤกษ์ / บริษัท'}
                </Text>
                <Text variant="caption" style={{ color: colors.textSecondary }}>
                  {currentDayHoliday ? 'แก้ไขชื่อ, วันที่ หรือประเภทสถานะ' : 'กรอกชื่อวันหยุดเฉพาะสำหรับวันนี้'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 6. Clear Status if exists */}
            {(currentDayHoliday || currentDayLeave) && (
              <Button
                variant="destructive"
                icon={Trash2}
                style={{ marginTop: 8 }}
                onPress={() => {
                  dayActionSheet.close();
                  clearStatusDialog.open();
                }}
              >
                ลบ / ยกเลิกสถานะของวันนี้
              </Button>
            )}
          </View>
        </View>
      </BottomSheet>

      {/* ========================================================= */}
      {/* BOTTOM SHEET 2: ADD / EDIT HOLIDAY */}
      {/* ========================================================= */}
      <BottomSheet
        isVisible={holidaySheet.isVisible}
        onClose={holidaySheet.close}
        snapPoints={[0.96]}
        title={editingHoliday ? 'แก้ไขวันหยุด / สถานะ' : 'เพิ่มวันหยุด / WFH'}
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={holidaySheet.close}>
              ยกเลิก
            </Button>
            <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={handleSaveCustomHoliday}>
              {editingHoliday ? 'บันทึกการแก้ไข' : 'บันทึกวันหยุด'}
            </Button>
          </View>
        }
      >
        <View style={{ gap: 16, paddingBottom: 16 }}>
          {/* Holiday Name */}
          <Input
            label="ชื่อวันหยุด / หมายเหตุ"
            placeholder="เช่น วันหยุดประจำปีบริษัท, WFH ประจำสัปดาห์"
            value={holidayName}
            onChangeText={setHolidayName}
          />

          {/* Date Picker */}
          <DatePicker
            label="วันที่"
            mode="date"
            value={holidayDate}
            onChange={(d) => d && setHolidayDate(d)}
          />

          {/* Holiday Type Selector */}
          <View>
            <Text variant="caption" style={{ marginBottom: 8, color: colors.textSecondary, fontWeight: '600' }}>
              ประเภทวันหยุด / สถานะ:
            </Text>
            <View style={{ gap: 8 }}>
              {(Object.keys(HOLIDAY_TYPE_CONFIG) as HolidayType[]).map((t) => {
                const isSel = holidayType === t;
                const cfg = HOLIDAY_TYPE_CONFIG[t];
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setHolidayType(t)}
                    style={[
                      styles.typeSelectorRow,
                      {
                        backgroundColor: isSel
                          ? isDark
                            ? `${cfg.color}30`
                            : `${cfg.color}15`
                          : colors.card,
                        borderColor: isSel ? cfg.color : colors.border,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      {getHolidayBadge(t)}
                      <Text variant="subtitle" style={{ fontWeight: isSel ? '700' : '400' }}>
                        {cfg.label}
                      </Text>
                    </View>
                    {isSel && <Check size={18} color={cfg.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* ========================================================= */}
      {/* BOTTOM SHEET 3: LEAVE REQUEST FORM */}
      {/* ========================================================= */}
      <BottomSheet
        isVisible={leaveSheet.isVisible}
        onClose={leaveSheet.close}
        snapPoints={[0.96]}
        title="บันทึกการลา / ยื่นขอลา"
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={leaveSheet.close}>
              ยกเลิก
            </Button>
            <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={handleSaveLeave}>
              บันทึกการลา
            </Button>
          </View>
        }
      >
        <View style={{ gap: 16, paddingBottom: 16 }}>
          {/* Leave Type Selector */}
          <View>
            <Text variant="caption" style={{ marginBottom: 8, color: colors.textSecondary, fontWeight: '600' }}>
              ประเภทการลา:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LEAVE_TYPE_OPTIONS.map((opt) => {
                const isSel = leaveType === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => setLeaveType(opt.type)}
                    style={[
                      styles.leaveTypePill,
                      {
                        backgroundColor: isSel ? opt.color : colors.card,
                        borderColor: isSel ? opt.color : colors.border,
                      },
                    ]}
                  >
                    <opt.icon size={16} color={isSel ? '#fff' : colors.text} />
                    <Text
                      variant="caption"
                      style={{
                        color: isSel ? '#fff' : colors.text,
                        fontWeight: isSel ? '700' : '500',
                        marginLeft: 6,
                      }}
                    >
                      {opt.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration Type: Full day / Half day */}
          <View>
            <Text variant="caption" style={{ marginBottom: 8, color: colors.textSecondary, fontWeight: '600' }}>
              ระยะเวลาการลา:
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { type: 'full_day' as LeaveDurationType, label: 'เต็มวัน' },
                { type: 'half_day_morning' as LeaveDurationType, label: 'ครึ่งวันเช้า' },
                { type: 'half_day_afternoon' as LeaveDurationType, label: 'ครึ่งวันบ่าย' },
              ].map((d) => (
                <TouchableOpacity
                  key={d.type}
                  onPress={() => setLeaveDurationType(d.type)}
                  style={[
                    styles.durationPill,
                    {
                      flex: 1,
                      backgroundColor: leaveDurationType === d.type ? colors.primary : colors.card,
                      borderColor: leaveDurationType === d.type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: leaveDurationType === d.type ? '#fff' : colors.text,
                      fontWeight: leaveDurationType === d.type ? '700' : '400',
                      textAlign: 'center',
                    }}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Picker (Range or Single Date) */}
          <DatePicker
            label="ช่วงวันที่ลา"
            mode="range"
            value={leaveRange}
            onChange={(r) => r && setLeaveRange(r)}
          />

          {/* Reason Input */}
          <Input
            label="เหตุผลการลา (ไม่บังคับ)"
            placeholder="เช่น พักผ่อนประจำปี, ลาไปหาหมอ"
            value={leaveReason}
            onChangeText={setLeaveReason}
          />
        </View>
      </BottomSheet>

      {/* ========================================================= */}
      {/* BOTTOM SHEET 4: EDIT ANNUAL QUOTAS */}
      {/* ========================================================= */}
      <BottomSheet
        isVisible={quotaSheet.isVisible}
        onClose={quotaSheet.close}
        snapPoints={[0.92]}
        title={`แก้ไขโควตาวันลาประจำปี ${selectedYear + 543}`}
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={quotaSheet.close}>
              ยกเลิก
            </Button>
            <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={handleSaveQuotas}>
              บันทึกโควตา
            </Button>
          </View>
        }
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          <Text variant="caption" style={{ color: colors.textSecondary }}>
            กำหนดจำนวนวันลาที่ได้รับสิทธิ์ในแต่ละประเภทประจำปี:
          </Text>

          <Input
            label="โควตาลาพักร้อน (วัน)"
            keyboardType="numeric"
            value={editingQuotas.vacation}
            onChangeText={(v) => setEditingQuotas((prev) => ({ ...prev, vacation: v }))}
          />
          <Input
            label="โควตาลาป่วย (วัน)"
            keyboardType="numeric"
            value={editingQuotas.sick}
            onChangeText={(v) => setEditingQuotas((prev) => ({ ...prev, sick: v }))}
          />
          <Input
            label="โควตาลากิจ (วัน)"
            keyboardType="numeric"
            value={editingQuotas.personal}
            onChangeText={(v) => setEditingQuotas((prev) => ({ ...prev, personal: v }))}
          />
          <Input
            label="โควตาลาอื่นๆ (วัน)"
            keyboardType="numeric"
            value={editingQuotas.other}
            onChangeText={(v) => setEditingQuotas((prev) => ({ ...prev, other: v }))}
          />
        </View>
      </BottomSheet>

      {/* Delete Holiday Dialog */}
      <AlertDialog
        isVisible={deleteHolidayDialog.isVisible}
        onClose={deleteHolidayDialog.close}
        title="ยืนยันการลบวันหยุด"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${itemToDelete?.name}" ออกจากระบบ?`}
        confirmText="ลบรายการ"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={handleConfirmDelete}
      />

      {/* Delete Leave Dialog */}
      <AlertDialog
        isVisible={deleteLeaveDialog.isVisible}
        onClose={deleteLeaveDialog.close}
        title="ยืนยันการลบประวัติการลา"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการลานี้? โควตาวันลาจะถูกคืนให้อัตโนมัติ"
        confirmText="ลบประวัติ"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={handleConfirmDelete}
      />

      {/* Clear Day Status Confirmation Dialog */}
      <AlertDialog
        isVisible={clearStatusDialog.isVisible}
        onClose={clearStatusDialog.close}
        title="ยืนยันการยกเลิกสถานะ"
        description={`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกสถานะของวันที่ ${formatDateThai(selectedCalendarDate)}?`}
        confirmText="ลบสถานะ"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={handleQuickClearStatus}
      />

      {/* ========================================================= */}
      {/* BOTTOM SHEET 5: ADD / EDIT ACTIVITY & REMINDER */}
      {/* ========================================================= */}
      <BottomSheet
        isVisible={activitySheet.isVisible}
        onClose={activitySheet.close}
        snapPoints={[0.96]}
        title={editingActivity ? 'แก้ไขกิจกรรม / นัดหมาย' : `เพิ่มกิจกรรม (${formatDateThai(selectedCalendarDate)})`}
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={activitySheet.close}>
              ยกเลิก
            </Button>
            <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={handleSaveActivity}>
              {editingActivity ? 'บันทึกการแก้ไข' : 'บันทึกนัดหมาย'}
            </Button>
          </View>
        }
      >
        <View style={{ gap: 14, paddingBottom: 16 }}>
          {/* Activity Title */}
          <View>
            <Text variant="caption" style={{ marginBottom: 6, color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
              ชื่อกิจกรรม / นัดหมาย *
            </Text>
            <Input
              placeholder="เช่น นัดวิ่งกับเพื่อน, ประชุมทีม, กินข้าวกับแฟน"
              value={actTitle}
              onChangeText={setActTitle}
            />
          </View>

          {/* Category Selector Chips */}
          <View>
            <Text variant="caption" style={{ marginBottom: 8, color: colors.textSecondary, fontWeight: '600' }}>
              หมวดหมู่กิจกรรม:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(ACTIVITY_CATEGORY_CONFIG) as ActivityCategory[]).map((cat) => {
                const isSel = actCategory === cat;
                const cfg = ACTIVITY_CATEGORY_CONFIG[cat];
                const IconComponent = cfg.icon;

                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActCategory(cat)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isSel ? cfg.color : colors.border,
                      backgroundColor: isSel
                        ? isDark
                          ? `${cfg.color}30`
                          : cfg.bgColor
                        : colors.card,
                    }}
                  >
                    <IconComponent size={14} color={isSel ? cfg.color : colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isSel ? '700' : '500',
                        color: isSel ? cfg.color : colors.text,
                      }}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* All Day Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 4,
            }}
          >
            <View>
              <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>
                กิจกรรมตลอดวัน
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary }}>
                ไม่ระบุเวลาเริ่มและสิ้นสุด
              </Text>
            </View>
            <Switch value={actIsAllDay} onValueChange={setActIsAllDay} />
          </View>

          {/* Time Picker Range (if not all day) */}
          {!actIsAllDay && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TimeInput
                  label="เวลาเริ่มต้น"
                  value={actStartTime}
                  onChange={setActStartTime}
                  placeholder="เลือกเวลาเริ่ม"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TimeInput
                  label="เวลาสิ้นสุด"
                  value={actEndTime}
                  onChange={setActEndTime}
                  placeholder="เลือกเวลาสิ้นสุด"
                />
              </View>
            </View>
          )}

          {/* Reminder / Alert Options */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Bell size={13} color={colors.textSecondary} />
              <Text variant="caption" style={{ color: colors.textSecondary, fontWeight: '600' }}>
                การแจ้งเตือน (Alert Reminder):
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REMINDER_OPTIONS.map((opt) => {
                const isSel = actReminder === opt.value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    onPress={() => setActReminder(opt.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isSel ? '#f59e0b' : colors.border,
                      backgroundColor: isSel
                        ? isDark
                          ? 'rgba(245, 158, 11, 0.25)'
                          : '#fef3c7'
                        : colors.card,
                    }}
                  >
                    {opt.value === null ? (
                      <BellOff size={12} color={isSel ? '#d97706' : colors.textSecondary} />
                    ) : (
                      <Bell size={12} color={isSel ? '#d97706' : colors.textSecondary} />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSel ? '700' : '500',
                        color: isSel ? '#d97706' : colors.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Location Input */}
          <View>
            <Text variant="caption" style={{ marginBottom: 6, color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
              สถานที่ (ไม่บังคับ)
            </Text>
            <Input
              placeholder="เช่น สวนรถไฟ, ห้องประชุม 2, ร้านอาหาร"
              value={actLocation}
              onChangeText={setActLocation}
            />
          </View>

          {/* Note Input */}
          <View>
            <Text variant="caption" style={{ marginBottom: 6, color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
              บันทึกช่วยจำ (ไม่บังคับ)
            </Text>
            <Input
              placeholder="ข้อความหรือรายละเอียดเพิ่มเติม..."
              value={actNote}
              onChangeText={setActNote}
              type="textarea"
              rows={2}
            />
          </View>

        </View>
      </BottomSheet>

      {/* Delete Activity Dialog */}
      <AlertDialog
        isVisible={deleteActivityDialog.isVisible}
        onClose={deleteActivityDialog.close}
        title="ยืนยันการลบกิจกรรม"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมาย "${activityToDelete?.title}" ออกจากระบบ? การแจ้งเตือนจะถูกยกเลิกด้วย`}
        confirmText="ลบกิจกรรม"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={handleConfirmDeleteActivity}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </SafeAreaView>
  );
};

export default function LeavesScreen() {
  return (
    <ThemeProvider>
      <LeavesContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  yearArrowBtn: {
    padding: 4,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f030',
    paddingBottom: 6,
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 8,
    marginVertical: 1,
  },
  dayNumberText: {
    fontSize: 13,
  },
  calendarMiniTag: {
    marginTop: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
    maxWidth: '90%',
    alignItems: 'center',
  },
  calendarMiniTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  calendarLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f030',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayCard: {
    padding: 12,
    borderRadius: 12,
  },
  accordionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconEditBtn: {
    padding: 8,
    borderRadius: 8,
  },
  iconDeleteBtn: {
    padding: 8,
    borderRadius: 8,
  },
  leaveStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  leaveStatBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  quotaBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f040',
    overflow: 'hidden',
  },
  quotaBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  currentStatusBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  leaveTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationPill: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
