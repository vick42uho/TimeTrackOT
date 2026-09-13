import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  InteractiveTourOverlay,
  APP_TOUR_STEPS,
  TargetLayout,
  markTourCompleted,
} from '@/components/InteractiveTourOverlay';

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
  Briefcase,
  Home,
  Coffee,
  Building2,
  Check,
  Share2,
  Bell,
  BellOff,
  MapPin,
  ExternalLink,
  ListTodo,
  Save,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
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
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';

// Custom Hooks & Providers
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { TimeInput } from '../components/TimeInput';
import { triggerHaptic } from '@/hooks/useHaptics';
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
  SmartAlarmConfig,
  SmartAlarmScheduleItem,
} from '../types';
import {
  scheduleActivityReminder,
  cancelActivityReminder,
} from '../services/notificationService';
import {
  getSmartAlarmConfig,
  saveSmartAlarmConfig,
  syncSmartAlarmSchedule,
  getSmartAlarmSummary,
  DEFAULT_SMART_ALARM_CONFIG,
} from '@/services/smartAlarmService';
import {
  THAI_MONTH_NAMES,
  WEEKDAY_NAMES,
  LEAVE_TYPE_OPTIONS,
  HOLIDAY_TYPE_CONFIG,
  ACTIVITY_CATEGORY_CONFIG,
  REMINDER_OPTIONS,
  LOCATION_PRESETS,
} from '@/components/leaves/leavesConstants';
import { CalendarGrid } from '@/components/leaves/CalendarGrid';
import { SelectedDayCard } from '@/components/leaves/SelectedDayCard';
import { DayActionSheet } from '@/components/leaves/DayActionSheet';
import { LeaveSheet } from '@/components/leaves/LeaveSheet';
import { LeavesDialogs } from '@/components/leaves/LeavesDialogs';
import type { CalendarDayItem } from '@/components/leaves/leavesConstants';

const LeavesContent: React.FC = () => {
  const router = useRouter();
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
    updateLeave,
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

  // Tour State
  const { tourStep } = useLocalSearchParams<{ tourStep?: string }>();
  const [tourLayout, setTourLayout] = useState<TargetLayout | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const calendarCardRef = useRef<View>(null);
  const alarmCardRef = useRef<View>(null);
  const quotasCardRef = useRef<View>(null);
  const requestLeaveBtnRef = useRef<View>(null);
  const calendarScrollViewRef = useRef<ScrollView>(null);
  const leavesScrollViewRef = useRef<ScrollView>(null);
  const quotaScrollViewRef = useRef<ScrollView>(null);

  const tourStepNum = tourStep ? parseInt(tourStep, 10) : 0;
  const isTourActiveInLeaves = tourStepNum >= 2 && tourStepNum <= 5;
  const currentTourConfig = isTourActiveInLeaves ? APP_TOUR_STEPS[tourStepNum - 1] : null;

  useEffect(() => {
    if (!tourStep) {
      setTourLayout(null);
      return;
    }

    if (tourStep === '2') {
      setActiveTab('calendar');
      calendarScrollViewRef.current?.scrollTo({ y: 0, animated: false });
      const timer = setTimeout(() => {
        calendarCardRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            setTourLayout({ x, y, width, height, borderRadius: 20 });
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    } else if (tourStep === '3') {
      setActiveTab('calendar');
      calendarScrollViewRef.current?.scrollTo({ y: 0, animated: false });
      const timer = setTimeout(() => {
        alarmCardRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            setTourLayout({ x, y, width, height, borderRadius: 18 });
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    } else if (tourStep === '4') {
      setActiveTab('quota');
      quotaScrollViewRef.current?.scrollTo({ y: 0, animated: false });
      const timer = setTimeout(() => {
        quotasCardRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            setTourLayout({ x, y, width, height, borderRadius: 16 });
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    } else if (tourStep === '5') {
      setActiveTab('leaves');
      leavesScrollViewRef.current?.scrollTo({ y: 0, animated: false });
      const timer = setTimeout(() => {
        requestLeaveBtnRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            setTourLayout({ x, y, width, height, borderRadius: 16 });
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setTourLayout(null);
    }
  }, [tourStep]);

  // Data State
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [summaries, setSummaries] = useState<LeaveSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Smart Workday Alarm State
  const [smartAlarmConfig, setSmartAlarmConfig] = useState<SmartAlarmConfig>(DEFAULT_SMART_ALARM_CONFIG);
  const [isSmartAlarmModalVisible, setIsSmartAlarmModalVisible] = useState(false);
  const [smartAlarmSchedule, setSmartAlarmSchedule] = useState<SmartAlarmScheduleItem[]>([]);

  const smartAlarmSummary = useMemo(() => {
    return getSmartAlarmSummary(smartAlarmSchedule);
  }, [smartAlarmSchedule]);

  const handleToggleSmartAlarm = async (newVal: boolean) => {
    triggerHaptic('selection');
    const updated = { ...smartAlarmConfig, enabled: newVal };
    setSmartAlarmConfig(updated);
    await saveSmartAlarmConfig(updated);
    const syncRes = await syncSmartAlarmSchedule(holidays, leaves, updated);
    setSmartAlarmSchedule(syncRes.schedule);
    if (newVal) {
      success('เปิดใช้งานแล้ว', `นาฬิกาปลุกจะทำงานเฉพาะวันทำงานจริง (${updated.alarmTime} น.)`);
    } else {
      toast({ title: 'ปิดใช้งาน', description: 'ปิดระบบนาฬิกาปลุกวันทำงานเรียบร้อยแล้ว' });
    }
  };

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

  // New Leave Form (Add / Edit)
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
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

      // Load & Sync Smart Workday Alarm
      try {
        const alarmCfg = await getSmartAlarmConfig();
        setSmartAlarmConfig(alarmCfg);
        const alarmSync = await syncSmartAlarmSchedule(hList, lList, alarmCfg);
        setSmartAlarmSchedule(alarmSync.schedule);
      } catch (alarmErr) {
        console.warn('Error loading/syncing smart alarm in loadAllData:', alarmErr);
      }
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

    const days: (CalendarDayItem | null)[] = [];

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
  }, [holidays, leaves, selectedYear, selectedMonth, formatDateThai, getHolidayBadge, getLeaveTypeBadge]);

  // Yearly Public & Company Holidays (set once for the whole year)
  const yearlyPublicHolidays = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    return holidays
      .filter((h) => h.date.startsWith(yearPrefix) && (h.type === 'public' || h.type === 'company' || h.type === 'special'))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, selectedYear]);

  // Handle Day Cell Press & Long Press (Smart 2-Tap / Long-Press UX)
  const handleDayPress = useCallback((dateStr: string) => {
    if (selectedCalendarDate === dateStr) {
      // 2nd tap on the already selected date opens the action sheet
      dayActionSheet.open();
    } else {
      // 1st tap: selects the date and smoothly updates the preview card below
      setSelectedCalendarDate(dateStr);
    }
  }, [selectedCalendarDate, dayActionSheet]);

  const handleDayLongPress = useCallback((dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    dayActionSheet.open();
  }, [dayActionSheet]);

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

  // Save Leave Request (Add / Edit)
  const handleOpenAddLeave = (defaultDate?: Date) => {
    setEditingLeave(null);
    setLeaveType('vacation');
    setLeaveDurationType('full_day');
    setLeaveReason('');
    const d = defaultDate || new Date(selectedYear, selectedMonth - 1, 1);
    setLeaveRange({ startDate: d, endDate: d });
    leaveSheet.open();
  };

  const handleOpenEditLeave = (l: LeaveRequest) => {
    setEditingLeave(l);
    setLeaveType(l.leaveType);
    setLeaveDurationType(l.durationType);
    setLeaveReason(l.reason || '');
    const [sy, sm, sd] = l.startDate.split('-').map(Number);
    const [ey, em, ed] = l.endDate.split('-').map(Number);
    setLeaveRange({
      startDate: new Date(sy, sm - 1, sd),
      endDate: new Date(ey, em - 1, ed),
    });
    leaveSheet.open();
  };

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
    const wasEditing = editingLeave;
    setEditingLeave(null);
    leaveSheet.close();
    dayActionSheet.close();

    if (wasEditing?.id) {
      // 1. Instant local state update for Edit
      setLeaves((prev) =>
        prev.map((x) =>
          x.id === wasEditing.id
            ? { ...x, leaveType, startDate: startStr, endDate: endStr, durationDays: duration, durationType: leaveDurationType, reason: leaveReason.trim() || undefined }
            : x
        )
      );

      const ok = await updateLeave(wasEditing.id, {
        leaveType,
        startDate: startStr,
        endDate: endStr,
        durationDays: duration,
        durationType: leaveDurationType,
        reason: leaveReason.trim() || undefined,
      });

      if (ok) {
        success('แก้ไขสำเร็จ', `อัปเดตการลา ${duration} วันเรียบร้อยแล้ว`);
        await loadAllData();
      } else {
        error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการแก้ไขได้');
        await loadAllData();
      }
      return;
    }

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
        <Tabs value={activeTab} onValueChange={setActiveTab} style={{ flex: 1 }}>
          <View style={{ marginBottom: 10 }}>
            <TabsList style={{ marginBottom: 0 }}>
              <TabsTrigger value="calendar">ปฏิทิน & วันหยุด</TabsTrigger>
              <TabsTrigger value="leaves">การลา ({leaves.length})</TabsTrigger>
              <TabsTrigger value="quota">โควตา</TabsTrigger>
            </TabsList>
          </View>

          {/* ========================================================= */}
          {/* TAB 1: INTERACTIVE CALENDAR & HOLIDAYS */}
          {/* ========================================================= */}
          <TabsContent value="calendar" style={{ flex: 1 }}>
            <ScrollView ref={calendarScrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
              {/* Smart Workday Alarm Card */}
              <View ref={alarmCardRef} collapsable={false}>
                <Card
                  style={{
                    marginBottom: 10,
                    padding: 12,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: smartAlarmConfig.enabled
                            ? isDark
                              ? 'rgba(37, 99, 235, 0.2)'
                              : '#eff6ff'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : '#f1f5f9',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon
                          name={Bell}
                          size={18}
                          color={smartAlarmConfig.enabled ? '#2563eb' : colors.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, fontFamily: 'Sarabun_700Bold' }}>
                            นาฬิกาปลุกวันทำงาน
                          </Text>
                          {smartAlarmConfig.enabled ? (
                            <Badge variant="default" style={{ paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#2563eb' }}>
                              <Text style={{ fontSize: 10, color: '#ffffff', fontFamily: 'Sarabun_700Bold' }}>
                                {smartAlarmConfig.alarmTime} น.
                              </Text>
                            </Badge>
                          ) : (
                            <Badge variant="secondary" style={{ paddingHorizontal: 6, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: 'Sarabun_600SemiBold' }}>
                                ปิดอยู่
                              </Text>
                            </Badge>
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            color: smartAlarmConfig.enabled
                              ? smartAlarmSummary.isTomorrowWorkday
                                ? colors.primary
                                : '#d97706'
                              : colors.textSecondary,
                            fontFamily: 'Sarabun_500Medium',
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {smartAlarmConfig.enabled
                            ? smartAlarmSummary.tomorrowText
                            : 'ปลุกเฉพาะวันทำงาน และเว้นวันหยุด/วันลาให้อัตโนมัติ'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Switch
                        value={smartAlarmConfig.enabled}
                        onValueChange={handleToggleSmartAlarm}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic('impact-light');
                          setIsSmartAlarmModalVisible(true);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                        }}
                      >
                        <Icon name={Settings} size={15} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              </View>

              {/* Calendar Container with ViewShot for Sharing */}
              <View ref={calendarCardRef} collapsable={false}>
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
                <Card style={{ padding: 16, borderRadius: 24, backgroundColor: colors.card }}>
                  <CalendarGrid
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    calendarDays={calendarDays}
                    selectedCalendarDate={selectedCalendarDate}
                    isDark={isDark}
                    colors={colors}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onDayPress={handleDayPress}
                    onDayLongPress={handleDayLongPress}
                  />

                  {/* Subtle Watermark Footer on Shared Image */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 14,
                      paddingTop: 4,
                    }}
                  >
                    <Text variant="caption" style={{ fontSize: 12, color: colors.textSecondary }}>
                      ตารางวันหยุด & วันทำงาน
                    </Text>
                    <Text
                      variant="caption"
                      style={{ fontSize: 12, color: colors.primary, fontWeight: '700', fontFamily: 'Sarabun_700Bold' }}
                    >
                      TimeTrack OT
                    </Text>
                  </View>
                </Card>
              </ViewShot>
              </View>

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
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 999,
                  borderWidth: 0,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                  marginVertical: 8,
                }}
              >
                <Share2 size={14} color={colors.primary} />
                <Text
                  variant="caption"
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.primary,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  {isSharingCalendar
                    ? 'กำลังเตรียมภาพปฏิทิน...'
                    : `แชร์รูปปฏิทินเดือน${THAI_MONTH_NAMES[selectedMonth - 1]}`}
                </Text>
              </TouchableOpacity>

              {/* SELECTED DAY SCHEDULE & ACTIVITIES CARD */}
              <SelectedDayCard
                selectedCalendarDate={selectedCalendarDate}
                selectedDateHoliday={selectedDateHoliday || null}
                selectedDateLeave={selectedDateLeave || null}
                selectedDayActivities={selectedDayActivities}
                colors={colors}
                isDark={isDark}
                getThaiDayName={getThaiDayName}
                formatDateThai={formatDateThai}
                getLeaveTypeBadge={getLeaveTypeBadge}
                getHolidayBadge={getHolidayBadge}
                onEditActivity={handleOpenEditActivity}
                onDeleteActivity={handleDeleteActivityPrompt}
                onAddActivity={handleOpenAddActivity}
                onManageDay={dayActionSheet.open}
              />

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
            <ScrollView ref={leavesScrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
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
              <View ref={requestLeaveBtnRef} collapsable={false} style={{ marginVertical: 12 }}>
                <Button
                  variant="default"
                  size="lg"
                  icon={Plus}
                  onPress={() => handleOpenAddLeave()}
                >
                  ยื่นขอลา / บันทึกการลา
                </Button>
              </View>

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
                          {l.reason || 'ไม่ได้ระบุเหตุผล'}
                        </Text>
                        <Text variant="caption" style={{ color: colors.primary, fontWeight: '500' }}>
                          {formatDateThai(l.startDate)}
                          {l.startDate !== l.endDate && ` - ${formatDateThai(l.endDate)}`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => handleOpenEditLeave(l)}
                          style={[styles.iconDeleteBtn, { backgroundColor: isDark ? '#1e3a8a55' : '#e0e7ff' }]}
                        >
                          <Edit3 size={16} color={colors.primary} />
                        </TouchableOpacity>
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
            <ScrollView ref={quotaScrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
              <View ref={quotasCardRef} collapsable={false} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
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
      <DayActionSheet
        isVisible={dayActionSheet.isVisible}
        onClose={dayActionSheet.close}
        selectedCalendarDate={selectedCalendarDate}
        formatDateThai={formatDateThai}
        getThaiDayName={getThaiDayName}
        currentDayHoliday={currentDayHoliday}
        currentDayLeave={currentDayLeave}
        selectedDayActivities={selectedDayActivities}
        colors={colors}
        isDark={isDark}
        getHolidayBadge={getHolidayBadge}
        getLeaveTypeBadge={getLeaveTypeBadge}
        onAddActivity={() => {
          dayActionSheet.close();
          handleOpenAddActivity();
        }}
        onEditActivity={(act) => {
          dayActionSheet.close();
          handleOpenEditActivity(act);
        }}
        onDeleteActivity={(act) => {
          dayActionSheet.close();
          handleDeleteActivityPrompt(act);
        }}
        onQuickSetStatus={handleQuickSetStatus}
        onRequestLeaveForDay={() => {
          const targetDate = new Date(selectedCalendarDate);
          setEditingLeave(null);
          setLeaveType('vacation');
          setLeaveDurationType('full_day');
          setLeaveReason('');
          setLeaveRange({ startDate: targetDate, endDate: targetDate });
          dayActionSheet.close();
          leaveSheet.open();
        }}
        onEditHoliday={() => {
          dayActionSheet.close();
          if (currentDayHoliday) {
            handleOpenEditHoliday(currentDayHoliday);
          } else {
            handleOpenAddHoliday(new Date(selectedCalendarDate));
          }
        }}
        onClearStatus={() => {
          dayActionSheet.close();
          clearStatusDialog.open();
        }}
      />

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
      {/* BOTTOM SHEET 3: LEAVE REQUEST FORM (Add / Edit) */}
      {/* ========================================================= */}
      <LeaveSheet
        isVisible={leaveSheet.isVisible}
        onClose={() => { setEditingLeave(null); leaveSheet.close(); }}
        editingLeave={editingLeave}
        leaveType={leaveType}
        onChangeLeaveType={setLeaveType}
        leaveDurationType={leaveDurationType}
        onChangeDurationType={setLeaveDurationType}
        leaveRange={leaveRange}
        onChangeLeaveRange={(r) => setLeaveRange(r)}
        leaveReason={leaveReason}
        onChangeLeaveReason={setLeaveReason}
        colors={colors}
        onSave={handleSaveLeave}
      />

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

      {/* Delete / Confirm Dialogs + Smart Alarm */}
      <LeavesDialogs
        deleteHolidayVisible={deleteHolidayDialog.isVisible}
        onCloseDeleteHoliday={deleteHolidayDialog.close}
        deleteLeaveVisible={deleteLeaveDialog.isVisible}
        onCloseDeleteLeave={deleteLeaveDialog.close}
        clearStatusVisible={clearStatusDialog.isVisible}
        onCloseClearStatus={clearStatusDialog.close}
        deleteActivityVisible={deleteActivityDialog.isVisible}
        onCloseDeleteActivity={deleteActivityDialog.close}
        itemToDeleteName={itemToDelete?.name}
        activityToDeleteTitle={activityToDelete?.title}
        clearStatusDateLabel={formatDateThai(selectedCalendarDate)}
        onConfirmDelete={handleConfirmDelete}
        onConfirmClearStatus={handleQuickClearStatus}
        onConfirmDeleteActivity={handleConfirmDeleteActivity}
        alarmVisible={isSmartAlarmModalVisible}
        onCloseAlarm={() => setIsSmartAlarmModalVisible(false)}
        holidays={holidays}
        leaves={leaves}
        onAlarmSaved={loadAllData}
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
                      borderRadius: 999,
                      borderWidth: 0,
                      backgroundColor: isSel
                        ? isDark
                          ? `${cfg.color}30`
                          : cfg.bgColor
                        : colors.backgroundAlt,
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
                      borderRadius: 999,
                      borderWidth: 0,
                      backgroundColor: isSel
                        ? isDark
                          ? 'rgba(245, 158, 11, 0.25)'
                          : '#fef3c7'
                        : colors.backgroundAlt,
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

          {/* Location Input with Map Helper & Quick Suggestions */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text variant="caption" style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                สถานที่ / พิกัด (ไม่บังคับ)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const query = encodeURI((actLocation || '').trim());
                  const mapUrl = Platform.select({
                    ios: query ? `maps:0,0?q=${query}` : 'maps:',
                    android: query ? `geo:0,0?q=${query}` : 'geo:0,0',
                    default: query ? `https://www.google.com/maps/search/?api=1&query=${query}` : 'https://www.google.com/maps',
                  });
                  Linking.openURL(mapUrl).catch(() => {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                  });
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <MapPin size={13} color="#8b5cf6" />
                <Text style={{ fontSize: 12, color: '#8b5cf6', fontWeight: '700', fontFamily: 'Sarabun_700Bold' }}>
                  {actLocation.trim() ? 'เปิดดูในแผนที่' : 'เปิด Google Maps'}
                </Text>
                <ExternalLink size={11} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
            <Input
              placeholder="เช่น สวนรถไฟ, ห้องประชุม 2, ร้านอาหาร"
              value={actLocation}
              onChangeText={setActLocation}
            />

            {/* Quick Location Suggestion Chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {LOCATION_PRESETS.map((loc) => {
                const isSelected = actLocation === loc.val;
                const IconComp = loc.icon;
                return (
                  <TouchableOpacity
                    key={loc.val}
                    onPress={() => setActLocation(loc.val)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(139, 92, 246, 0.25)' : '#ede9fe')
                        : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'),
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: '#8b5cf6',
                    }}
                  >
                    <IconComp
                      size={12}
                      color={
                        isSelected
                          ? (isDark ? '#c4b5fd' : '#7c3aed')
                          : (isDark ? '#94a3b8' : '#64748b')
                      }
                    />
                    <Text
                      style={{
                        fontSize: 11.5,
                        color: isSelected
                          ? (isDark ? '#c4b5fd' : '#7c3aed')
                          : colors.textSecondary,
                        fontFamily: isSelected ? 'Sarabun_700Bold' : 'Sarabun_600SemiBold',
                      }}
                    >
                      {loc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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

      {/* Interactive Tour Overlay for Steps 2, 3, 4, and 5 */}
      <InteractiveTourOverlay
        visible={isTourActiveInLeaves && !!currentTourConfig}
        currentStepIndex={tourStepNum - 1}
        totalSteps={APP_TOUR_STEPS.length}
        stepData={{
          ...(currentTourConfig || APP_TOUR_STEPS[1]),
          targetLayout: tourLayout,
        }}
        onNext={() => {
          if (tourStep === '2') {
            router.replace('/leaves?tourStep=3');
          } else if (tourStep === '3') {
            router.replace('/leaves?tourStep=4');
          } else if (tourStep === '4') {
            router.replace('/leaves?tourStep=5');
          } else if (tourStep === '5') {
            router.replace('/time-entry?tourStep=6');
          }
        }}
        onPrev={() => {
          if (tourStep === '2') {
            router.replace('/settings?tourStep=1');
          } else if (tourStep === '3') {
            router.replace('/leaves?tourStep=2');
          } else if (tourStep === '4') {
            router.replace('/leaves?tourStep=3');
          } else if (tourStep === '5') {
            router.replace('/leaves?tourStep=4');
          }
        }}
        onSkip={() => {
          markTourCompleted();
          router.replace('/');
        }}
        onFinish={() => {
          markTourCompleted();
          router.replace('/');
        }}
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
    borderRadius: 999,
    borderWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 3,
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
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 10,
  },
  dateNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 13,
    fontFamily: 'Sarabun_600SemiBold',
  },
  statusDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  calendarDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 2,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
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
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
  },
  iconEditBtn: {
    padding: 8,
    borderRadius: 999,
  },
  iconDeleteBtn: {
    padding: 8,
    borderRadius: 999,
  },
  leaveStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  leaveStatBox: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
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
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  currentStatusBox: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
    marginBottom: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
  },
  leaveTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
  durationPill: {
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
});
