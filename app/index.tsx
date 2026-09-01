
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
import { Activity, LeaveSummary } from '../types';

const { width } = Dimensions.get('window');

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
    getLeaveSummary,
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
  const [leaveSummaries, setLeaveSummaries] = useState<LeaveSummary[]>([]);
  const [nextHoliday, setNextHoliday] = useState<{ name: string; date: string; daysLeft: number } | null>(null);
  const [currentDate] = useState(new Date());
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
    
    // Use actual current date from system
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const day = today.getDate();
    
    // Format date string properly
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // High Performance: Fetch today data and yearly stats concurrently in parallel
    const [schedule, entry, dayStatus, todayActs, yearHolidays, leaveSum] = await Promise.all([
      getWorkSchedule(month, year),
      getTimeEntry(dateString),
      checkDateStatus(dateString),
      getActivitiesForDate(dateString),
      getHolidays(year),
      getLeaveSummary(year),
      loadYearlyStats(year),
    ]);

    setActivities(todayActs || []);
    setLeaveSummaries(leaveSum || []);

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
  }, [isReady, getWorkSchedule, getTimeEntry, calculateWorkHours, calculateLateArrival, calculateEarlyLeave, checkDateStatus, getActivitiesForDate, getHolidays, getLeaveSummary, loadYearlyStats]);

  // Refresh data when screen comes into focus or database becomes ready
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        loadTodayData();
      }
    }, [isReady, loadTodayData])
  );

  const currentMonth = new Date().toLocaleDateString('th-TH', { 
    month: 'long', 
    year: 'numeric' 
  });

  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleActionPress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace(route as any);
  };

  const isDark = themeMode === 'dark';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'สวัสดีตอนเช้า', icon: Sun, color: '#f59e0b' };
    if (hour < 17) return { text: 'สวัสดีตอนบ่าย', icon: CloudSun, color: '#f59e0b' };
    return { text: 'สวัสดีตอนเย็น', icon: Moon, color: '#6366f1' };
  };

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

  const getLeaveTypeMeta = (leaveType: string) => {
    switch (leaveType) {
      case 'vacation':
        return {
          icon: Palmtree,
          label: 'พักร้อน',
          color: '#10b981',
          lightBg: '#ecfdf5',
          lightBorder: '#a7f3d0',
          darkBg: 'rgba(5, 150, 105, 0.12)',
          darkBorder: 'rgba(16, 185, 129, 0.25)',
        };
      case 'sick':
        return {
          icon: HeartPulse,
          label: 'ลาป่วย',
          color: '#ef4444',
          lightBg: '#fef2f2',
          lightBorder: '#fecaca',
          darkBg: 'rgba(220, 38, 38, 0.12)',
          darkBorder: 'rgba(239, 68, 68, 0.25)',
        };
      case 'personal':
        return {
          icon: UserCheck,
          label: 'ลากิจ',
          color: '#f59e0b',
          lightBg: '#fffbeb',
          lightBorder: '#fde68a',
          darkBg: 'rgba(217, 119, 6, 0.12)',
          darkBorder: 'rgba(245, 158, 11, 0.25)',
        };
      case 'other':
      default:
        return {
          icon: FileText,
          label: 'อื่นๆ',
          color: '#8b5cf6',
          lightBg: '#f5f3ff',
          lightBorder: '#ddd6fe',
          darkBg: 'rgba(139, 92, 246, 0.12)',
          darkBorder: 'rgba(139, 92, 246, 0.25)',
        };
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
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusChipText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
    },
    // Compact Bento Metrics Grid
    dashboardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    statCardWrapper: {
      width: (width - 36) / 2,
    },
    statCard: {
      borderRadius: 16,
      padding: 10,
      minHeight: 74,
      justifyContent: 'space-between',
      borderWidth: 1,
    },
    otCard: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ecfdf5',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#a7f3d0',
    },
    lateCard: {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.12)' : '#fef2f2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca',
    },
    regularCard: {
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe',
    },
    overtimeCard: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : '#fffbeb',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#fde68a',
    },
    statHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
      marginTop: 2,
    },
    otVal: {
      color: isDark ? '#34d399' : '#059669',
    },
    lateVal: {
      color: isDark ? '#f87171' : '#dc2626',
    },
    regularVal: {
      color: isDark ? '#60a5fa' : '#2563eb',
    },
    overtimeVal: {
      color: isDark ? '#fbbf24' : '#d97706',
    },
    statSubLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
    // Banner styling
    statusNoticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 10,
      borderWidth: 1,
    },
    // Integrated Shift Card
    bnaCard: {
      marginBottom: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 13,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    schedulePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    timeBox: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 12,
    },
    timeLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
      marginBottom: 2,
    },
    timeVal: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
    },
    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginVertical: 6,
    },
    progressBarFill: {
      height: 6,
      borderRadius: 3,
    },
    metricMiniRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
    },
    metricMiniChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    metricMiniText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    // Today's Agenda
    agendaItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    agendaIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    emptyAgendaBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    // Upcoming Holiday Pill
    nextHolidayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 10,
    },
    // Quota Cards (4 slots)
    quotaCard: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 3,
      alignItems: 'center',
      borderWidth: 1,
    },
    quotaLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
      marginBottom: 2,
    },
    quotaVal: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
    },
    quotaSub: {
      fontSize: 9,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dynamic Header with Greeting & Live Status */}
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View>
              {(() => {
                const greeting = getGreeting();
                const GreetingIcon = greeting.icon;
                const hh = String(liveTime.getHours()).padStart(2, '0');
                const mm = String(liveTime.getMinutes()).padStart(2, '0');
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <GreetingIcon size={15} color={greeting.color} />
                    <Text style={styles.greetingText}>{greeting.text}</Text>
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
              })()}
              <Text style={styles.dateTitle}>
                วัน{getThaiDayName(currentDate.toISOString().split('T')[0])}ที่ {formatDateThai(currentDate.toISOString().split('T')[0])}
              </Text>
            </View>

            {/* Header Live Status Chip */}
            <View
              style={[
                styles.statusChip,
                todayStatus.isHoliday
                  ? { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', borderColor: '#3b82f6' }
                  : todayStatus.isLeave
                    ? { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#f5f3ff', borderColor: '#8b5cf6' }
                    : todayStatus.isWFH
                      ? { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: '#22c55e' }
                      : todayEntry?.clockOut
                        ? { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7', borderColor: '#16a34a' }
                        : todayEntry?.clockIn
                          ? { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe', borderColor: '#2563eb' }
                          : { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
              ]}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: todayStatus.isHoliday
                    ? '#3b82f6'
                    : todayStatus.isLeave
                      ? '#8b5cf6'
                      : todayStatus.isWFH
                        ? '#22c55e'
                        : todayEntry?.clockOut
                          ? '#16a34a'
                          : todayEntry?.clockIn
                            ? '#2563eb'
                            : colors.textSecondary,
                  marginRight: 5,
                }}
              />
              <Text
                style={[
                  styles.statusChipText,
                  {
                    color: todayStatus.isHoliday
                      ? '#3b82f6'
                      : todayStatus.isLeave
                        ? '#8b5cf6'
                        : todayStatus.isWFH
                          ? '#16a34a'
                          : todayEntry?.clockOut
                            ? '#16a34a'
                            : todayEntry?.clockIn
                              ? '#2563eb'
                              : colors.textSecondary,
                  },
                ]}
              >
                {todayStatus.isHoliday
                  ? 'วันหยุด'
                  : todayStatus.isLeave
                    ? 'ลางาน'
                    : todayStatus.isWFH
                      ? 'WFH'
                      : todayEntry?.clockOut
                        ? 'เสร็จสิ้น'
                        : todayEntry?.clockIn
                          ? 'กำลังทำงาน'
                          : 'ยังไม่ลงเวลา'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2x2 High-Density Bento Stats Grid */}
        <View style={styles.dashboardGrid}>
          {/* Card 1: OT Balance (Yearly) */}
          <View style={styles.statCardWrapper}>
            <View style={[styles.statCard, styles.otCard]}>
              <View style={styles.statHeaderRow}>
                <Text style={styles.statLabel}>OT คงเหลือทั้งปี</Text>
                <TrendingUp size={16} color={isDark ? '#34d399' : '#059669'} />
              </View>
              <View>
                <Text style={[styles.statValue, styles.otVal]}>
                  {formatHours(monthlyStats.totalOT - monthlyStats.totalOTUsed)}{' '}
                  <Text style={{ fontSize: 13 }}>ชม.</Text>
                </Text>
                {monthlyStats.totalOTUsed > 0 ? (
                  <Text style={styles.statSubLabel} numberOfLines={1}>
                    (ใช้แล้ว {formatHours(monthlyStats.totalOTUsed)} ชม.)
                  </Text>
                ) : monthlyStats.totalOT > 0 ? (
                  <Text style={styles.statSubLabel} numberOfLines={1}>
                    (สะสม {formatHours(monthlyStats.totalOT)} ชม.)
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Card 2: Monthly OT */}
          <View style={styles.statCardWrapper}>
            <View style={[styles.statCard, styles.overtimeCard]}>
              <View style={styles.statHeaderRow}>
                <Text style={styles.statLabel}>OT รวมเดือนนี้</Text>
                <Zap size={16} color={isDark ? '#fbbf24' : '#d97706'} />
              </View>
              <View>
                <Text style={[styles.statValue, styles.overtimeVal]}>
                  {formatHours(monthlyStats.monthOTHours - monthlyStats.monthOTUsed)}{' '}
                  <Text style={{ fontSize: 13 }}>ชม.</Text>
                </Text>
                {monthlyStats.monthOTUsed > 0 ? (
                  <Text style={styles.statSubLabel} numberOfLines={1}>
                    (ใช้แล้ว {formatHours(monthlyStats.monthOTUsed)} ชม.)
                  </Text>
                ) : (
                  <Text style={styles.statSubLabel} numberOfLines={1}>
                    (สะสม {formatHours(monthlyStats.monthOTHours)} ชม.)
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Card 3: Monthly Work Hours */}
          <View style={styles.statCardWrapper}>
            <View style={[styles.statCard, styles.regularCard]}>
              <View style={styles.statHeaderRow}>
                <Text style={styles.statLabel}>ทำงานรวมเดือนนี้</Text>
                <Briefcase size={16} color={isDark ? '#60a5fa' : '#2563eb'} />
              </View>
              <View>
                <Text style={[styles.statValue, styles.regularVal]}>
                  {formatHours(monthlyStats.monthWorkHours)}{' '}
                  <Text style={{ fontSize: 13 }}>ชม.</Text>
                </Text>
                <Text style={styles.statSubLabel} numberOfLines={1}>
                  (ทำงาน {monthlyStats.monthWorkDays} วัน)
                </Text>
              </View>
            </View>
          </View>

          {/* Card 4: Late Count (Monthly) */}
          <View style={styles.statCardWrapper}>
            <View style={[styles.statCard, styles.lateCard]}>
              <View style={styles.statHeaderRow}>
                <Text style={styles.statLabel}>มาสายเดือนนี้</Text>
                <AlertCircle size={16} color={isDark ? '#f87171' : '#dc2626'} />
              </View>
              <View>
                <Text style={[styles.statValue, styles.lateVal]}>
                  {monthlyStats.lateCount - monthlyStats.lateUsedCount}{' '}
                  <Text style={{ fontSize: 13 }}>ครั้ง</Text>
                </Text>
                {monthlyStats.lateUsedCount > 0 ? (
                  <Text style={styles.statSubLabel} numberOfLines={1}>
                    (ใช้แล้ว {monthlyStats.lateUsedCount} ครั้ง)
                  </Text>
                ) : (
                  <Text style={styles.statSubLabel} numberOfLines={1}>
                    (รวม {monthlyStats.lateCount} ครั้ง)
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Special Status Notices (if any) */}
        {todayStatus.isHoliday && (
          <View
            style={[
              styles.statusNoticeBanner,
              {
                backgroundColor: isDark ? '#1e3a8a25' : '#eff6ff',
                borderColor: isDark ? '#3b82f640' : '#bfdbfe',
              },
            ]}
          >
            <Palmtree size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.primary,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                วันนี้เป็นวันหยุด: {todayStatus.holidayName}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Sarabun_400Regular' }}>
                วันหยุดนักขัตฤกษ์ / ประจำปี ไม่นับเป็นวันทำงาน
              </Text>
            </View>
          </View>
        )}

        {todayStatus.isWFH && (
          <View
            style={[
              styles.statusNoticeBanner,
              {
                backgroundColor: isDark ? '#14532d25' : '#f0fdf4',
                borderColor: isDark ? '#16a34a40' : '#bbf7d0',
              },
            ]}
          >
            <Home size={20} color="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#16a34a',
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                วันนี้ทำงานที่บ้าน (Work From Home)
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Sarabun_400Regular' }}>
                บันทึกเวลาทำงานและคำนวณ OT ได้ตามปกติ
              </Text>
            </View>
          </View>
        )}

        {todayStatus.isLeave && (
          <View
            style={[
              styles.statusNoticeBanner,
              {
                backgroundColor: isDark ? '#312e8125' : '#f5f3ff',
                borderColor: isDark ? '#8b5cf640' : '#ddd6fe',
              },
            ]}
          >
            <FileText size={20} color="#8b5cf6" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#8b5cf6',
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                วันนี้อยู่ในช่วงลา:{' '}
                {todayStatus.leaveType === 'vacation'
                  ? 'ลาพักร้อน'
                  : todayStatus.leaveType === 'sick'
                    ? 'ลาป่วย'
                    : todayStatus.leaveType === 'personal'
                      ? 'ลากิจ'
                      : 'การลา'}
              </Text>
              {todayStatus.leaveReason && (
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Sarabun_400Regular' }}>
                  เหตุผล: {todayStatus.leaveReason}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Integrated Today's Shift Card */}
        <Card style={styles.bnaCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>การทำงานวันนี้</Text>
            </View>
            {currentSchedule && (
              <View
                style={[
                  styles.schedulePill,
                  { backgroundColor: colors.backgroundAlt, flexDirection: 'row', alignItems: 'center', gap: 4 },
                ]}
              >
                <Clock size={11} color={colors.textSecondary} />
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_600SemiBold',
                  }}
                >
                  กะ {currentSchedule.startTime} - {currentSchedule.endTime} น.
                </Text>
              </View>
            )}
          </View>

          {todayEntry ? (
            <>
              {/* Clock In / Out Times */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                <View
                  style={[
                    styles.timeBox,
                    { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : '#f0fdf4' },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <LogIn size={12} color="#16a34a" />
                    <Text style={styles.timeLabel}>เวลาเข้างาน</Text>
                  </View>
                  <Text style={[styles.timeVal, { color: '#16a34a' }]}>
                    {todayEntry.clockIn ? `${todayEntry.clockIn} น.` : '-'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.timeBox,
                    {
                      backgroundColor: todayEntry.clockOut
                        ? isDark
                          ? 'rgba(239, 68, 68, 0.08)'
                          : '#fef2f2'
                        : colors.backgroundAlt,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <LogOut size={12} color="#dc2626" />
                    <Text style={styles.timeLabel}>เวลาเลิกงาน</Text>
                  </View>
                  <Text
                    style={[
                      styles.timeVal,
                      { color: todayEntry.clockOut ? '#dc2626' : colors.textSecondary },
                    ]}
                  >
                    {todayEntry.clockOut ? `${todayEntry.clockOut} น.` : 'ยังไม่เลิกงาน'}
                  </Text>
                </View>
              </View>

              {/* Visual Shift Progress Bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.backgroundAlt }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${getShiftProgress()}%`,
                      backgroundColor: todayEntry.clockOut ? '#16a34a' : colors.primary,
                    },
                  ]}
                />
              </View>

              {/* Metric Mini Chips */}
              <View style={styles.metricMiniRow}>
                <View
                  style={[
                    styles.metricMiniChip,
                    {
                      backgroundColor: colors.backgroundAlt,
                      borderColor: colors.border,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4,
                    },
                  ]}
                >
                  <Briefcase size={12} color={colors.text} />
                  <Text style={[styles.metricMiniText, { color: colors.text }]}>
                    ทำงาน {todayEntry.regularHours ? formatHours(todayEntry.regularHours) : '0'} ชม.
                  </Text>
                </View>

                {todayEntry.overtimeHours > 0 && (
                  <View
                    style={[
                      styles.metricMiniChip,
                      {
                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#ecfdf5',
                        borderColor: '#10b981',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 4,
                      },
                    ]}
                  >
                    <Zap size={12} color="#10b981" />
                    <Text style={[styles.metricMiniText, { color: '#10b981' }]}>
                      OT +{formatHours(todayEntry.overtimeHours)} ชม.
                    </Text>
                  </View>
                )}

                {todayEntry.lateArrivalHours > 0 && (
                  <View
                    style={[
                      styles.metricMiniChip,
                      {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                        borderColor: '#ef4444',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 4,
                      },
                    ]}
                  >
                    <AlertCircle size={12} color="#dc2626" />
                    <Text style={[styles.metricMiniText, { color: '#dc2626' }]}>
                      สาย {formatHours(todayEntry.lateArrivalHours)} ชม.
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => handleActionPress('/time-entry')}
              activeOpacity={0.7}
              style={[
                styles.emptyAgendaBox,
                { borderColor: colors.border, backgroundColor: colors.backgroundAlt, marginVertical: 4 },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={15} color={colors.textSecondary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_600SemiBold',
                  }}
                >
                  ยังไม่ได้บันทึกเวลาทำงานวันนี้
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.primary,
                  fontFamily: 'Sarabun_600SemiBold',
                  marginTop: 3,
                }}
              >
                แตะที่นี่เพื่อลงเวลาเข้างาน
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Today's Agenda (Activities & Appointments) */}
        <Card style={styles.bnaCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Calendar size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>กิจกรรม & นัดหมายวันนี้</Text>
              {activities.length > 0 && (
                <Badge variant="secondary">{activities.length}</Badge>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleActionPress('/leaves')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Plus size={14} color={colors.primary} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.primary,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                เพิ่ม
              </Text>
            </TouchableOpacity>
          </View>

          {activities.length > 0 ? (
            activities.map((item, idx) => {
              const meta = getCategoryMeta(item.category);
              const CatIcon = meta.icon;
              const isLast = idx === activities.length - 1;
              return (
                <View
                  key={item.id || idx}
                  style={[
                    styles.agendaItemRow,
                    { borderColor: colors.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={[styles.agendaIconBadge, { backgroundColor: meta.bg }]}>
                    <CatIcon size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: colors.text,
                        fontFamily: 'Sarabun_700Bold',
                      }}
                    >
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.primary,
                          fontFamily: 'Sarabun_600SemiBold',
                        }}
                      >
                        {item.startTime} - {item.endTime} น.
                      </Text>
                      {item.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <MapPin size={10} color={colors.textSecondary} />
                          <Text
                            style={{
                              fontSize: 11,
                              color: colors.textSecondary,
                              fontFamily: 'Sarabun_400Regular',
                            }}
                            numberOfLines={1}
                          >
                            {item.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {item.reminderMinutes !== null && item.reminderMinutes !== undefined && (
                    <Bell size={13} color="#f59e0b" style={{ marginLeft: 6 }} />
                  )}
                </View>
              );
            })
          ) : (
            <TouchableOpacity
              onPress={() => handleActionPress('/leaves')}
              activeOpacity={0.7}
              style={[
                styles.emptyAgendaBox,
                { borderColor: colors.border, backgroundColor: colors.backgroundAlt },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                }}
              >
                ไม่มีนัดหมายวันนี้
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.primary,
                  fontFamily: 'Sarabun_600SemiBold',
                  marginTop: 3,
                }}
              >
                แตะเพื่อเพิ่มนัดหมายใหม่
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Upcoming Holiday Countdown Pill */}
        {nextHoliday && (
          <TouchableOpacity
            onPress={() => handleActionPress('/leaves')}
            activeOpacity={0.8}
            style={[
              styles.nextHolidayCard,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                borderColor: isDark ? '#1e3a8a' : '#bfdbfe',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Palmtree size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.text,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                  numberOfLines={1}
                >
                  วันหยุดถัดไป: {nextHoliday.name}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_400Regular',
                  }}
                >
                  {formatDateThai(nextHoliday.date)}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.primary,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                {nextHoliday.daysLeft === 0
                  ? 'วันนี้'
                  : nextHoliday.daysLeft === 1
                    ? 'พรุ่งนี้'
                    : `อีก ${nextHoliday.daysLeft} วัน`}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Leave Quotas (4 Slots) - Replaced redundant menu shortcuts */}
        <View style={{ marginTop: 4, marginBottom: 26 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              paddingHorizontal: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.text,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                โควต้าวันลาคงเหลือ ({new Date().getFullYear() + 543})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleActionPress('/leaves')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.primary,
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                ดูทั้งหมด
              </Text>
              <ChevronRight size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {leaveSummaries.length > 0 ? (
              leaveSummaries.map((item) => {
                const meta = getLeaveTypeMeta(item.leaveType);
                const LeaveIcon = meta.icon;
                return (
                  <TouchableOpacity
                    key={item.leaveType}
                    onPress={() => handleActionPress('/leaves')}
                    activeOpacity={0.7}
                    style={[
                      styles.quotaCard,
                      {
                        backgroundColor: isDark ? meta.darkBg : meta.lightBg,
                        borderColor: isDark ? meta.darkBorder : meta.lightBorder,
                      },
                    ]}
                  >
                    <View style={{ marginBottom: 4 }}>
                      <LeaveIcon size={18} color={meta.color} />
                    </View>
                    <Text style={styles.quotaLabel} numberOfLines={1}>
                      {meta.label}
                    </Text>
                    <Text style={[styles.quotaVal, { color: meta.color }]}>
                      {item.remainingDays}
                      <Text style={{ fontSize: 10, fontWeight: 'normal', color: colors.textSecondary }}>
                        {' '}วัน
                      </Text>
                    </Text>
                    <Text style={styles.quotaSub} numberOfLines={1}>
                      ใช้ {item.usedDays}/{item.quotaDays}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              ['vacation', 'sick', 'personal', 'other'].map((type) => {
                const meta = getLeaveTypeMeta(type);
                const LeaveIcon = meta.icon;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => handleActionPress('/leaves')}
                    activeOpacity={0.7}
                    style={[
                      styles.quotaCard,
                      {
                        backgroundColor: isDark ? meta.darkBg : meta.lightBg,
                        borderColor: isDark ? meta.darkBorder : meta.lightBorder,
                      },
                    ]}
                  >
                    <View style={{ marginBottom: 4 }}>
                      <LeaveIcon size={18} color={meta.color} />
                    </View>
                    <Text style={styles.quotaLabel} numberOfLines={1}>
                      {meta.label}
                    </Text>
                    <Text style={[styles.quotaVal, { color: meta.color }]}>
                      -
                      <Text style={{ fontSize: 10, fontWeight: 'normal', color: colors.textSecondary }}>
                        {' '}วัน
                      </Text>
                    </Text>
                    <Text style={styles.quotaSub} numberOfLines={1}>
                      แตะเพื่อดู
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

export default function MainScreen() {
  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <HomeContent />
      </SafeAreaView>
    </ThemeProvider>
  );
}
