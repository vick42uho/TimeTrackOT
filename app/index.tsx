import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/components/ui/icon';
import { 
  PlusCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Briefcase, 
  Zap, 
  LogOut, 
  LogIn,
  Calendar,
  ChevronRight,
  Plus,
  FileText,
  CheckSquare,
  Check,
  Settings,
  Sparkles,
  MapPin,
  Bell,
  CheckCircle2,
  Sun,
  CloudSun,
  Moon,
  Dumbbell,
  Coffee,
  ShoppingBag,
  Palmtree,
  HeartPulse,
  UserCheck,
  Home,
} from 'lucide-react-native';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import { Activity, LeaveSummary, TaskNote } from '../types';
import { TaskNoteModal } from '@/components/TaskNoteModal';
import { StatsGrid } from '@/components/home/StatsGrid';
import { LeaveQuotas } from '@/components/home/LeaveQuotas';
import { ShiftCard } from '@/components/home/ShiftCard';
import { TasksActivitiesBento } from '@/components/home/TasksActivitiesBento';
import { StatusNotices, HeaderStatusChip } from '@/components/home/StatusNotices';
import { TaskNoteManagerSheet } from '@/components/TaskNoteManagerSheet';
import { ActivityDetailSheet } from '@/components/ActivityDetailSheet';
import { getSmartAlarmConfig, syncSmartAlarmSchedule } from '@/services/smartAlarmService';
import { triggerHaptic } from '@/hooks/useHaptics';
import { toLocalDateString } from '@/utils/dateHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InteractiveTourOverlay,
  TOUR_STORAGE_KEY,
  APP_TOUR_STEPS,
  TargetLayout,
  markTourCompleted,
} from '@/components/InteractiveTourOverlay';

const { width } = Dimensions.get('window');

const LiveGreetingRow = React.memo(({ isDark, textStyle }: { isDark: boolean; textStyle: import('react-native').TextStyle }) => {
  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const hour = liveTime.getHours();
  let greeting = { text: 'สวัสดีตอนเย็น', icon: Moon, color: '#6366f1' };
  if (hour < 12) greeting = { text: 'สวัสดีตอนเช้า', icon: Sun, color: '#f59e0b' };
  else if (hour < 17) greeting = { text: 'สวัสดีตอนบ่าย', icon: CloudSun, color: '#f59e0b' };

  const GreetingIcon = greeting.icon;
  const hh = String(liveTime.getHours()).padStart(2, '0');
  const mm = String(liveTime.getMinutes()).padStart(2, '0');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <GreetingIcon size={15} color={greeting.color} />
      <Text style={textStyle}>{greeting.text}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe',
        }}
      >
        <Clock size={11} color={isDark ? '#60a5fa' : '#2563eb'} />
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Sarabun_700Bold',
            color: isDark ? '#60a5fa' : '#2563eb',
          }}
        >
          {hh}:{mm} น.
        </Text>
      </View>
    </View>
  );
});
LiveGreetingRow.displayName = 'LiveGreetingRow';

const HomeContent: React.FC = () => {
  const { colors, themeMode } = useThemeContext();
  const router = useRouter();
  const { 
    getWorkSchedule, 
    getWorkSchedulesForYear, 
    getTimeEntry, 
    isReady, 
    getTimeEntriesForPeriod, 
    checkDateStatus,
    getActivitiesForDate,
    getHolidays,
    getLeaves,
    getLeaveSummary,
    getTasksNotes,
    saveTaskNote,
    updateTaskNote,
    toggleTaskNoteCompleted,
    toggleChecklistItem,
    deleteTaskNote,
  } = useDatabase();
  const { formatDateThai, getThaiDayName, formatHours, formatHoursWithDecimal, calculateLateArrival, calculateEarlyLeave, calculateWorkHours } = useTimeCalculation();
  
  const [currentSchedule, setCurrentSchedule] = useState<any>(undefined);
  const [todayEntry, setTodayEntry] = useState<any>(undefined);
  const [todayStatus, setTodayStatus] = useState<{
    isHoliday: boolean;
    holidayName?: string;
    isLeave: boolean;
    leaveType?: string;
    leaveReason?: string;
    isWFH?: boolean;
    isRegularOff?: boolean;
  }>({ isHoliday: false, isLeave: false, isWFH: false, isRegularOff: false });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isActivitySheetVisible, setIsActivitySheetVisible] = useState(false);
  const [isActivityCreateMode, setIsActivityCreateMode] = useState(false);
  const [tasksNotes, setTasksNotes] = useState<TaskNote[]>([]);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [isManagerSheetVisible, setIsManagerSheetVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<TaskNote | null>(null);

  const pendingTasksCount = useMemo(
    () => tasksNotes.filter((i) => !i.isCompleted).length,
    [tasksNotes]
  );
  const [leaveSummaries, setLeaveSummaries] = useState<LeaveSummary[]>([]);
  const [nextHoliday, setNextHoliday] = useState<{ name: string; date: string; daysLeft: number } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<{
    totalOT: number;
    totalOTUsed: number;
    lateCount: number;
    lateUsedCount: number;
    totalEarlyLeave: number;
    totalEarlyLeaveUsed: number;
    monthWorkHours: number;
    monthWorkDays: number;
    monthOTHours: number;
    monthOTUsed: number;
  }>({
    totalOT: 0,
    totalOTUsed: 0,
    lateCount: 0,
    lateUsedCount: 0,
    totalEarlyLeave: 0,
    totalEarlyLeaveUsed: 0,
    monthWorkHours: 0,
    monthWorkDays: 0,
    monthOTHours: 0,
    monthOTUsed: 0,
  });

  const { tourStep, startTour } = useLocalSearchParams<{ tourStep?: string; startTour?: string }>();

  // Interactive Tour Guide State (Step 5 of 5: Dashboard & Notes/Tasks)
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourLayout, setTourLayout] = useState<TargetLayout | null>(null);

  const mainScrollViewRef = useRef<ScrollView>(null);
  const shiftCardRef = useRef<View>(null);
  const metricsGridRef = useRef<View>(null);
  const tasksNotesRef = useRef<View>(null);
  const leaveQuotaRef = useRef<View>(null);

  useEffect(() => {
    if (['8', '9', '10', '11'].includes(tourStep || '')) {
      setIsTourActive(true);
      let targetRef: React.RefObject<any> | null = null;
      let scrollY = 0;
      let radius = 24;

      if (tourStep === '8') {
        targetRef = metricsGridRef;
        scrollY = 0;
        radius = 24;
      } else if (tourStep === '9') {
        targetRef = shiftCardRef;
        scrollY = 130;
        radius = 24;
      } else if (tourStep === '10') {
        targetRef = tasksNotesRef;
        scrollY = 320;
        radius = 24;
      } else if (tourStep === '11') {
        targetRef = leaveQuotaRef;
        scrollY = 560;
        radius = 24;
      }

      mainScrollViewRef.current?.scrollTo({ y: scrollY, animated: true });

      const timer = setTimeout(() => {
        targetRef?.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            setTourLayout({ x, y, width, height, borderRadius: radius });
          }
        });
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setIsTourActive(false);
      setTourLayout(null);
    }

    if (startTour === 'true') {
      router.replace('/settings?tourStep=1');
      return;
    }

    // First time install: Start guided tour at Step 1 (Settings -> Work Schedule)
    AsyncStorage.getItem(TOUR_STORAGE_KEY)
      .then((seen) => {
        if (!seen) {
          const timer = setTimeout(() => {
            router.replace('/settings?tourStep=1');
          }, 600);
          return () => clearTimeout(timer);
        }
      })
      .catch(() => {});
  }, [tourStep, startTour, router]);

  const loadYearlyStats = useCallback(async (currentYear: number) => {
    if (!isReady) return;

    try {
      let totalOT = 0;
      let totalOTUsed = 0;
      let lateCount = 0;
      let lateUsedCount = 0;
      let totalEarlyLeave = 0;
      let totalEarlyLeaveUsed = 0;
      let monthWorkHours = 0;
      let monthWorkDays = 0;
      let monthOTHours = 0;
      let monthOTUsed = 0;

      const currentMonth = new Date().getMonth() + 1;

      // High Performance: Batch fetch all schedules and entries for the year in 2 parallel queries
      const [yearSchedules, allYearEntries] = await Promise.all([
        getWorkSchedulesForYear(currentYear),
        getTimeEntriesForPeriod(`${currentYear}-01-01`, `${currentYear}-12-31`),
      ]);

      allYearEntries.forEach(entry => {
        const entryMonth = parseInt(entry.date.split('-')[1], 10);
        const monthSchedule = yearSchedules[entryMonth];

        let regularHours = entry.regularHours || 0;
        let overtimeHours = entry.overtimeHours || 0;
        let lateHours = entry.lateArrivalHours || 0;
        let earlyLeaveHours = entry.earlyLeaveHours || 0;

        if (entry.clockIn && entry.clockOut && monthSchedule) {
          const calculated = calculateWorkHours(entry.clockIn, entry.clockOut, monthSchedule);
          regularHours = calculated.regularHours;
          overtimeHours = calculated.overtimeHours;
          lateHours = calculateLateArrival(entry.clockIn, monthSchedule);
          earlyLeaveHours = calculateEarlyLeave(entry.clockOut, monthSchedule);
        } else {
          if (lateHours === 0 && entry.clockIn && monthSchedule) {
            lateHours = calculateLateArrival(entry.clockIn, monthSchedule);
          }
          if (earlyLeaveHours === 0 && entry.clockOut && monthSchedule) {
            earlyLeaveHours = calculateEarlyLeave(entry.clockOut, monthSchedule);
          }
        }

        totalOT += overtimeHours;
        if (entry.overtimeUsed) {
          totalOTUsed += overtimeHours;
        }

        if (entryMonth === currentMonth) {
          monthWorkHours += regularHours;
          monthOTHours += overtimeHours;
          if (entry.overtimeUsed) {
            monthOTUsed += overtimeHours;
          }
          if (entry.clockIn || entry.clockOut) {
            monthWorkDays++;
          }
          if (lateHours > 0) {
            lateCount++;
            if (entry.lateArrivalUsed) {
              lateUsedCount++;
            }
          }
        }

        totalEarlyLeave += earlyLeaveHours;
        if (entry.earlyLeaveUsed) {
          totalEarlyLeaveUsed += earlyLeaveHours;
        }
      });

      setMonthlyStats({
        totalOT,
        totalOTUsed,
        lateCount,
        lateUsedCount,
        totalEarlyLeave,
        totalEarlyLeaveUsed,
        monthWorkHours,
        monthWorkDays,
        monthOTHours,
        monthOTUsed,
      });
    } catch (error) {
      console.error('Error loading yearly stats:', error);
    }
  }, [isReady, getWorkSchedulesForYear, getTimeEntriesForPeriod, calculateWorkHours, calculateLateArrival, calculateEarlyLeave]);

  // Define loadTodayData function next
  const loadTodayData = useCallback(async () => {
    if (!isReady) {
      return;
    }
    
    // Use actual current date from system in local timezone
    const today = new Date();
    setCurrentDate(today);
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const day = today.getDate();
    
    // Format date string properly in local timezone
    const dateString = toLocalDateString(today);

    // High Performance: Fetch today data, yearly stats, and tasks concurrently in parallel
    const [schedule, entry, dayStatus, todayActs, yearHolidays, leaveSum, _yearlyStats, todayTasks] = await Promise.all([
      getWorkSchedule(month, year),
      getTimeEntry(dateString),
      checkDateStatus(dateString),
      getActivitiesForDate(dateString),
      getHolidays(year),
      getLeaveSummary(year),
      loadYearlyStats(year),
      getTasksNotes(),
    ]);

    setActivities(todayActs || []);
    setLeaveSummaries(leaveSum || []);
    setTasksNotes(todayTasks || []);

    // Find next upcoming holiday
    if (yearHolidays && yearHolidays.length > 0) {
      const upcoming = yearHolidays
        .filter((h) => h.date >= dateString && h.type !== 'wfh' && h.type !== 'regular_off')
        .sort((a, b) => a.date.localeCompare(b.date));
      if (upcoming.length > 0) {
        const target = upcoming[0];
        const [tYear, tMonth, tDay] = target.date.split('-').map(Number);
        const targetDate = new Date(tYear, tMonth - 1, tDay);
        const nowDate = new Date(year, month - 1, day);
        const diffTime = targetDate.getTime() - nowDate.getTime();
        const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
        setNextHoliday({ name: target.name, date: target.date, daysLeft });
      } else {
        setNextHoliday(null);
      }
    }

    // Background sync Smart Workday Alarm
    getSmartAlarmConfig()
      .then((alarmCfg) => {
        if (alarmCfg.enabled) {
          getLeaves(year).then((yearLeaves) => {
            syncSmartAlarmSchedule(yearHolidays || [], yearLeaves || [], alarmCfg);
          });
        }
      })
      .catch(() => {});

    // Calculate accurate hours for today's entry if available
    let todayEntryWithLate = entry;
    if (entry && entry.clockIn && schedule) {
      const lateHours = calculateLateArrival(entry.clockIn, schedule);
      let regularHours = entry.regularHours;
      let overtimeHours = entry.overtimeHours;
      let earlyLeaveHours = entry.earlyLeaveHours;

      if (entry.clockOut) {
        const calculated = calculateWorkHours(entry.clockIn, entry.clockOut, schedule);
        regularHours = calculated.regularHours;
        overtimeHours = calculated.overtimeHours;
        earlyLeaveHours = calculateEarlyLeave(entry.clockOut, schedule);
      }

      todayEntryWithLate = {
        ...entry,
        regularHours,
        overtimeHours,
        lateArrivalHours: lateHours,
        earlyLeaveHours,
      };
    }

    setCurrentSchedule(schedule);
    setTodayEntry(todayEntryWithLate);
    setTodayStatus(dayStatus);
  }, [isReady, getWorkSchedule, getTimeEntry, calculateWorkHours, calculateLateArrival, calculateEarlyLeave, checkDateStatus, getActivitiesForDate, getHolidays, getLeaves, getLeaveSummary, loadYearlyStats, getTasksNotes]);

  const handleSaveTaskNote = async (data: Omit<TaskNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedNote?.id) {
      await updateTaskNote(selectedNote.id, data);
    } else {
      await saveTaskNote(data);
    }
    const updated = await getTasksNotes();
    setTasksNotes(updated || []);
  };

  const handleToggleTaskNote = async (id: number, isCompleted: boolean) => {
    triggerHaptic('selection');
    await toggleTaskNoteCompleted(id, isCompleted);
    const updated = await getTasksNotes();
    setTasksNotes(updated || []);
  };

  const handleToggleTaskSubItem = async (noteId: number, itemId: string) => {
    triggerHaptic('selection');
    await toggleChecklistItem(noteId, itemId);
    const updated = await getTasksNotes();
    setTasksNotes(updated || []);
  };

  const handleDeleteTaskNote = async (id: number) => {
    await deleteTaskNote(id);
    const updated = await getTasksNotes();
    setTasksNotes(updated || []);
  };

  // Refresh data when screen comes into focus or database becomes ready
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        loadTodayData();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady])
  );

  // Auto-refresh date & data if midnight crosses while app remains in foreground
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDate((prev) => {
        if (
          prev.getDate() !== now.getDate() ||
          prev.getMonth() !== now.getMonth() ||
          prev.getFullYear() !== now.getFullYear()
        ) {
          if (isReady) {
            loadTodayData();
          }
          return now;
        }
        return prev;
      });
    }, 15000);
    return () => clearInterval(timer);
  }, [isReady, loadTodayData]);

  const currentMonth = new Date().toLocaleDateString('th-TH', { 
    month: 'long', 
    year: 'numeric' 
  });

  const handleActionPress = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace(route as any);
  }, [router]);

  const handleOpenTimeEntry = useCallback(() => {
    handleActionPress('/time-entry');
  }, [handleActionPress]);

  const isDark = themeMode === 'dark';

  const handleAddActivity = useCallback(() => {
    setSelectedActivity(null);
    setIsActivityCreateMode(true);
    setIsActivitySheetVisible(true);
  }, []);

  const handleOpenActivity = useCallback((item: any) => {
    setSelectedActivity(item);
    setIsActivityCreateMode(false);
    setIsActivitySheetVisible(true);
  }, []);

  const handleOpenLeaves = useCallback(() => {
    handleActionPress('/leaves');
  }, [handleActionPress]);

  const handleOpenTaskManager = useCallback(() => {
    setIsManagerSheetVisible(true);
  }, []);

  const handleAddNote = useCallback(() => {
    setSelectedNote(null);
    setIsNoteModalVisible(true);
  }, []);

  const handleOpenNote = useCallback((item: any) => {
    setSelectedNote(item);
    setIsNoteModalVisible(true);
  }, []);

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'meeting':
        return { icon: Briefcase, label: 'ประชุม', bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', color: '#3b82f6' };
      case 'exercise':
        return { icon: Dumbbell, label: 'ออกกำลังกาย', bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#fff7ed', color: '#ea580c' };
      case 'leisure':
        return { icon: Coffee, label: 'พักผ่อน', bg: isDark ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff', color: '#9333ea' };
      case 'errand':
        return { icon: ShoppingBag, label: 'ธุระส่วนตัว', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', color: '#16a34a' };
      default:
        return { icon: Calendar, label: 'กิจกรรม', bg: isDark ? 'rgba(100, 116, 139, 0.15)' : '#f8fafc', color: '#64748b' };
    }
  };

  const getShiftProgress = () => {
    if (!todayEntry?.clockIn || !currentSchedule) return 0;
    if (todayEntry.clockOut) return 100;
    const [startH, startM] = currentSchedule.startTime.split(':').map(Number);
    const [endH, endM] = currentSchedule.endTime.split(':').map(Number);
    const now = new Date();
    const currentH = now.getHours() + now.getMinutes() / 60;
    const startDec = startH + startM / 60;
    let endDec = endH + endM / 60;
    if (endDec < startDec) endDec += 24;
    if (currentH <= startDec) return 5;
    if (currentH >= endDec) return 100;
    return Math.min(95, Math.max(5, Math.round(((currentH - startDec) / (endDec - startDec)) * 100)));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 14,
    },
    header: {
      paddingTop: 12,
      paddingBottom: 10,
      paddingHorizontal: 2,
    },
    greetingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    greetingText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
    },
    dateTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
      letterSpacing: -0.3,
      marginTop: 1,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView ref={mainScrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dynamic Header with Greeting & Live Status */}
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View>
              <LiveGreetingRow isDark={isDark} textStyle={styles.greetingText} />
              <Text style={styles.dateTitle}>
                วัน{getThaiDayName(toLocalDateString(currentDate))}ที่ {formatDateThai(toLocalDateString(currentDate))}
              </Text>
            </View>

            <HeaderStatusChip
              todayStatus={todayStatus}
              todayEntry={todayEntry}
              colors={colors}
              isDark={isDark}
            />
          </View>
        </View>

        {/* 2x2 High-Density Bento Stats Grid */}
        <StatsGrid
          monthlyStats={monthlyStats}
          formatHours={formatHours}
          isDark={isDark}
          colors={colors}
          metricsGridRef={metricsGridRef}
        />

        <StatusNotices todayStatus={todayStatus} colors={colors} isDark={isDark} />

        <ShiftCard
          currentSchedule={currentSchedule}
          todayEntry={todayEntry}
          colors={colors}
          isDark={isDark}
          shiftProgress={getShiftProgress()}
          formatHours={formatHours}
          onOpenTimeEntry={handleOpenTimeEntry}
          shiftCardRef={shiftCardRef}
        />

      <TasksActivitiesBento
        activities={activities}
        tasksNotes={tasksNotes}
        pendingTasksCount={pendingTasksCount}
        nextHoliday={nextHoliday}
        colors={colors}
        isDark={isDark}
        getCategoryMeta={getCategoryMeta}
        formatDateThai={formatDateThai}
        triggerHaptic={triggerHaptic}
        onAddActivity={handleAddActivity}
        onOpenActivity={handleOpenActivity}
        onOpenLeaves={handleOpenLeaves}
        onOpenTaskManager={handleOpenTaskManager}
        onAddNote={handleAddNote}
        onOpenNote={handleOpenNote}
        onToggleTask={handleToggleTaskNote}
        tasksNotesRef={tasksNotesRef}
      />

        {/* Leave Quotas (4 Slots) - Replaced redundant menu shortcuts */}
        <LeaveQuotas
          leaveSummaries={leaveSummaries}
          colors={colors}
          isDark={isDark}
          onOpenLeaves={() => handleActionPress('/leaves')}
          leaveQuotaRef={leaveQuotaRef}
        />
      </ScrollView>

      <TaskNoteModal
        isVisible={isNoteModalVisible}
        onClose={() => {
          setIsNoteModalVisible(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveTaskNote}
        initialData={selectedNote}
        onDelete={handleDeleteTaskNote}
      />

      <TaskNoteManagerSheet
        isVisible={isManagerSheetVisible}
        onClose={() => setIsManagerSheetVisible(false)}
        tasksNotes={tasksNotes}
        onAddNew={() => {
          setSelectedNote(null);
          setIsNoteModalVisible(true);
        }}
        onEdit={(item) => {
          setSelectedNote(item);
          setIsNoteModalVisible(true);
        }}
        onToggleItem={handleToggleTaskSubItem}
        onToggleNote={handleToggleTaskNote}
        onDelete={handleDeleteTaskNote}
      />

      <ActivityDetailSheet
        visible={isActivitySheetVisible}
        activity={selectedActivity}
        isCreateMode={isActivityCreateMode}
        defaultDate={toLocalDateString(currentDate)}
        onClose={() => {
          setIsActivitySheetVisible(false);
          setSelectedActivity(null);
          setIsActivityCreateMode(false);
        }}
        onActivityUpdated={loadTodayData}
        onNavigateToCalendar={(dateStr) => {
          handleActionPress('/leaves');
        }}
      />

      {/* Interactive Tour Overlay for Steps 8, 9, 10, and 11 */}
      <InteractiveTourOverlay
        visible={['8', '9', '10', '11'].includes(tourStep || '') && isTourActive}
        currentStepIndex={
          tourStep === '9'
            ? 8
            : tourStep === '10'
            ? 9
            : tourStep === '11'
            ? 10
            : 7
        }
        totalSteps={APP_TOUR_STEPS.length}
        stepData={{
          ...APP_TOUR_STEPS[
            tourStep === '9'
              ? 8
              : tourStep === '10'
              ? 9
              : tourStep === '11'
              ? 10
              : 7
          ],
          targetLayout: tourLayout,
        }}
        onNext={() => {
          if (tourStep === '8') {
            router.replace('/?tourStep=9');
          } else if (tourStep === '9') {
            router.replace('/?tourStep=10');
          } else if (tourStep === '10') {
            router.replace('/?tourStep=11');
          } else {
            markTourCompleted();
            router.replace('/');
          }
        }}
        onPrev={() => {
          if (tourStep === '11') {
            router.replace('/?tourStep=10');
          } else if (tourStep === '10') {
            router.replace('/?tourStep=9');
          } else if (tourStep === '9') {
            router.replace('/?tourStep=8');
          } else {
            router.replace('/reports?tourStep=7');
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

      <BottomNavigation />
    </View>
  );
};

function MainScreenContent() {
  const { colors } = useThemeContext();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <HomeContent />
    </SafeAreaView>
  );
}

export default function MainScreen() {
  return (
    <ThemeProvider>
      <MainScreenContent />
    </ThemeProvider>
  );
}
