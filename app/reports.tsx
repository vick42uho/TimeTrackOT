import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  X,
  Clock,
  Zap,
  AlertTriangle,
  LogOut,
  Calendar,
  Edit3,
  Share2,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import { TimeEntry } from '../types';

type FilterType = 'all' | 'ot' | 'late' | 'early';

const ReportsContent: React.FC = () => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  const router = useRouter();
  const { getTimeEntriesForPeriod, getWorkSchedule, updateTimeEntry, isReady } = useDatabase();
  const {
    formatHours,
    formatHoursWithDecimal,
    formatDateThai,
    calculateWorkHours,
    calculateLateArrival,
    calculateEarlyLeave,
  } = useTimeCalculation();
  const { error } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthEntries, setMonthEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Share Summary ViewShot Ref & State
  const summaryViewShotRef = React.useRef<any>(null);
  const [isSharingSummary, setIsSharingSummary] = useState(false);

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  const thaiDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  const getDayOfWeekThai = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return thaiDayNames[d.getDay()] || '';
  };

  const loadReports = useCallback(async () => {
    if (!isReady) return;

    setIsLoading(true);
    try {
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const [workSchedule, allMonthEntries] = await Promise.all([
        getWorkSchedule(selectedMonth, selectedYear),
        getTimeEntriesForPeriod(startDate, endDate),
      ]);

      const processed = allMonthEntries.map((entry) => {
        let regularHours = entry.regularHours || 0;
        let overtimeHours = entry.overtimeHours || 0;
        let lateArrivalHours = entry.lateArrivalHours || 0;
        let earlyLeaveHours = entry.earlyLeaveHours || 0;

        if (entry.clockIn && entry.clockOut && workSchedule) {
          const calculated = calculateWorkHours(entry.clockIn, entry.clockOut, workSchedule);
          regularHours = calculated.regularHours;
          overtimeHours = calculated.overtimeHours;
          lateArrivalHours = calculateLateArrival(entry.clockIn, workSchedule);
          earlyLeaveHours = calculateEarlyLeave(entry.clockOut, workSchedule);
        } else {
          if (entry.clockIn && workSchedule) {
            lateArrivalHours = calculateLateArrival(entry.clockIn, workSchedule);
          }
          if (entry.clockOut && workSchedule) {
            earlyLeaveHours = calculateEarlyLeave(entry.clockOut, workSchedule);
          }
        }

        return {
          ...entry,
          regularHours,
          overtimeHours,
          lateArrivalHours,
          earlyLeaveHours,
        };
      });

      // Sort descending by date (most recent days first)
      processed.sort((a, b) => b.date.localeCompare(a.date));
      setMonthEntries(processed);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    isReady,
    selectedMonth,
    selectedYear,
    getWorkSchedule,
    getTimeEntriesForPeriod,
    calculateWorkHours,
    calculateLateArrival,
    calculateEarlyLeave,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        loadReports();
      }
    }, [isReady, loadReports])
  );

  const changeMonth = (direction: 'prev' | 'next') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Aggregated totals
  const totalRegularHours = useMemo(
    () => monthEntries.reduce((sum, e) => sum + (e.regularHours || 0), 0),
    [monthEntries]
  );
  const totalOvertimeHours = useMemo(
    () => monthEntries.reduce((sum, e) => sum + (e.overtimeHours || 0), 0),
    [monthEntries]
  );
  const totalLateHours = useMemo(
    () => monthEntries.reduce((sum, e) => sum + (e.lateArrivalHours || 0), 0),
    [monthEntries]
  );
  const totalEarlyLeaveHours = useMemo(
    () => monthEntries.reduce((sum, e) => sum + (e.earlyLeaveHours || 0), 0),
    [monthEntries]
  );
  const totalOvertimeUsed = useMemo(
    () =>
      monthEntries.reduce(
        (sum, e) => sum + (e.overtimeUsed && e.overtimeHours ? e.overtimeHours : 0),
        0
      ),
    [monthEntries]
  );
  const totalLateUsed = useMemo(
    () =>
      monthEntries.reduce(
        (sum, e) => sum + (e.lateArrivalUsed && e.lateArrivalHours ? e.lateArrivalHours : 0),
        0
      ),
    [monthEntries]
  );
  const totalEarlyLeaveUsed = useMemo(
    () =>
      monthEntries.reduce(
        (sum, e) => sum + (e.earlyLeaveUsed && e.earlyLeaveHours ? e.earlyLeaveHours : 0),
        0
      ),
    [monthEntries]
  );

  // Filter counts
  const otCount = useMemo(() => monthEntries.filter((e) => (e.overtimeHours || 0) > 0).length, [monthEntries]);
  const lateCount = useMemo(() => monthEntries.filter((e) => (e.lateArrivalHours || 0) > 0).length, [monthEntries]);
  const earlyCount = useMemo(() => monthEntries.filter((e) => (e.earlyLeaveHours || 0) > 0).length, [monthEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    switch (activeFilter) {
      case 'ot':
        return monthEntries.filter((e) => (e.overtimeHours || 0) > 0);
      case 'late':
        return monthEntries.filter((e) => (e.lateArrivalHours || 0) > 0);
      case 'early':
        return monthEntries.filter((e) => (e.earlyLeaveHours || 0) > 0);
      default:
        return monthEntries;
    }
  }, [monthEntries, activeFilter]);

  // Toggle handlers with optimistic UI
  const handleToggleOvertimeUsed = async (entry: TimeEntry) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newStatus = !entry.overtimeUsed;
      setMonthEntries((prev) =>
        prev.map((e) => (e.date === entry.date ? { ...e, overtimeUsed: newStatus } : e))
      );
      await updateTimeEntry(entry.date, { overtimeUsed: newStatus });
    } catch (err) {
      console.error('Error toggling overtime used:', err);
      error('ข้อผิดพลาด', 'ไม่สามารถบันทึกสถานะได้');
      loadReports();
    }
  };

  const handleToggleLateUsed = async (entry: TimeEntry) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newStatus = !entry.lateArrivalUsed;
      setMonthEntries((prev) =>
        prev.map((e) => (e.date === entry.date ? { ...e, lateArrivalUsed: newStatus } : e))
      );
      await updateTimeEntry(entry.date, { lateArrivalUsed: newStatus });
    } catch (err) {
      console.error('Error toggling late used:', err);
      error('ข้อผิดพลาด', 'ไม่สามารถบันทึกสถานะได้');
      loadReports();
    }
  };

  const handleToggleEarlyLeaveUsed = async (entry: TimeEntry) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newStatus = !entry.earlyLeaveUsed;
      setMonthEntries((prev) =>
        prev.map((e) => (e.date === entry.date ? { ...e, earlyLeaveUsed: newStatus } : e))
      );
      await updateTimeEntry(entry.date, { earlyLeaveUsed: newStatus });
    } catch (err) {
      console.error('Error toggling early leave used:', err);
      error('ข้อผิดพลาด', 'ไม่สามารถบันทึกสถานะได้');
      loadReports();
    }
  };

  const handleEntryPress = (entry: TimeEntry) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEntry(null);
  };

  // Share Monthly Summary Card Image Handler
  const handleShareSummary = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSharingSummary(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        error('ไม่สามารถแชร์ได้', 'อุปกรณ์นี้ไม่รองรับระบบแชร์ไฟล์');
        return;
      }

      if (summaryViewShotRef.current) {
        const uri = await captureRef(summaryViewShotRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `สรุปเวลาทำงานเดือน${thaiMonths[selectedMonth - 1]} ${selectedYear + 543}`,
          UTI: 'public.png',
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err) {
      console.error('Error sharing summary:', err);
      error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกภาพสรุปเวลาทำงานได้');
    } finally {
      setIsSharingSummary(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 4,
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.backgroundAlt,
    },
    monthText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    summaryCard: {
      backgroundColor: isDark ? '#1e3a8a' : '#1d4ed8',
      borderRadius: 20,
      padding: 18,
      marginBottom: 0,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      fontFamily: 'Sarabun_700Bold',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    summaryLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.85)',
      fontFamily: 'Sarabun_500Medium',
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
      fontFamily: 'Sarabun_700Bold',
    },
    summarySectionBlock: {
      marginVertical: 2,
    },
    summarySubRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 2,
      paddingLeft: 12,
    },
    summarySubLabel: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.75)',
      fontFamily: 'Sarabun_400Regular',
    },
    summarySubValueText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: 'Sarabun_600SemiBold',
    },
    summaryTotalLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
      fontFamily: 'Sarabun_700Bold',
    },
    summaryTotalValue: {
      fontSize: 17,
      fontWeight: '800',
      color: '#fef08a',
      fontFamily: 'Sarabun_800ExtraBold',
    },
    // Filter Pills
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterPillActive: {
      backgroundColor: isDark ? '#2563eb' : '#1d4ed8',
      borderColor: isDark ? '#2563eb' : '#1d4ed8',
    },
    filterPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
    },
    filterPillTextActive: {
      color: '#ffffff',
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
    // Daily Timeline Card
    dailyCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dailyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dailyDateText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    totalBadge: {
      backgroundColor: colors.backgroundAlt,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    totalBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    clockText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_500Medium',
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 10,
    },
    miniBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    miniBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    // Quick Action Checkboxes
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#27272a' : '#f1f5f9',
    },
    checkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundAlt,
    },
    checkButtonActive: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
    },
    checkButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_500Medium',
    },
    checkButtonTextActive: {
      color: '#16a34a',
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 12,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_500Medium',
      marginTop: 8,
    },
    // Detail Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    modalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#27272a' : '#f4f4f5',
    },
    modalLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_500Medium',
    },
    modalValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name={ArrowLeft} size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>รายงานเวลาทำงาน</Text>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth('prev')}>
            <Icon name={ChevronLeft} size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {thaiMonths[selectedMonth - 1]} {selectedYear + 543}
          </Text>

          <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth('next')}>
            <Icon name={ChevronRight} size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Container with ViewShot */}
        <ViewShot
          ref={summaryViewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 10,
          }}
        >
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>สรุปรายเดือน</Text>
              <Badge variant="secondary" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                {thaiMonths[selectedMonth - 1]}
              </Badge>
            </View>

            {/* Regular Hours */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ชั่วโมงปกติ:</Text>
              <Text style={styles.summaryValue}>{formatHoursWithDecimal(totalRegularHours)}</Text>
            </View>

            {/* Overtime Section */}
            <View style={styles.summarySectionBlock}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ชั่วโมง OT สะสม:</Text>
                <Text style={styles.summaryValue}>{formatHoursWithDecimal(totalOvertimeHours)}</Text>
              </View>
              {totalOvertimeUsed > 0 ? (
                <>
                  <View style={styles.summarySubRow}>
                    <Text style={styles.summarySubLabel}>  └ ใช้แล้ว:</Text>
                    <Text style={styles.summarySubValueText}>
                      {formatHoursWithDecimal(totalOvertimeUsed)}
                    </Text>
                  </View>
                  <View style={styles.summarySubRow}>
                    <Text style={[styles.summarySubLabel, { color: '#86efac', fontWeight: '600' }]}>
                      └ คงเหลือสุทธิ:
                    </Text>
                    <Text style={[styles.summarySubValueText, { color: '#86efac', fontWeight: '700' }]}>
                      {formatHoursWithDecimal(Math.max(0, totalOvertimeHours - totalOvertimeUsed))}
                    </Text>
                  </View>
                </>
              ) : totalOvertimeHours > 0 ? (
                <View style={styles.summarySubRow}>
                  <Text style={[styles.summarySubLabel, { color: '#86efac', fontWeight: '600' }]}>
                    └ คงเหลือสุทธิ:
                  </Text>
                  <Text style={[styles.summarySubValueText, { color: '#86efac', fontWeight: '700' }]}>
                    {formatHoursWithDecimal(totalOvertimeHours)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Late Arrival Section */}
            <View style={styles.summarySectionBlock}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ชั่วโมงมาสาย:</Text>
                <Text style={styles.summaryValue}>{formatHoursWithDecimal(totalLateHours)}</Text>
              </View>
              {totalLateHours > 0 && (
                <>
                  {totalLateUsed > 0 && (
                    <View style={styles.summarySubRow}>
                      <Text style={styles.summarySubLabel}>  └ ชดเชย/ใช้แล้ว:</Text>
                      <Text style={styles.summarySubValueText}>
                        {formatHoursWithDecimal(totalLateUsed)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.summarySubRow}>
                    <Text
                      style={[
                        styles.summarySubLabel,
                        {
                          color: totalLateHours - totalLateUsed > 0 ? '#fca5a5' : '#86efac',
                          fontWeight: '600',
                        },
                      ]}
                    >
                      └ สายคงค้าง:
                    </Text>
                    <Text
                      style={[
                        styles.summarySubValueText,
                        {
                          color: totalLateHours - totalLateUsed > 0 ? '#fca5a5' : '#86efac',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {formatHoursWithDecimal(Math.max(0, totalLateHours - totalLateUsed))}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Early Leave Section */}
            {totalEarlyLeaveHours > 0 && (
              <View style={styles.summarySectionBlock}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>กลับก่อนเวลา:</Text>
                  <Text style={styles.summaryValue}>{formatHoursWithDecimal(totalEarlyLeaveHours)}</Text>
                </View>
                {totalEarlyLeaveUsed > 0 && (
                  <View style={styles.summarySubRow}>
                    <Text style={styles.summarySubLabel}>  └ ชดเชยแล้ว:</Text>
                    <Text style={styles.summarySubValueText}>
                      {formatHoursWithDecimal(totalEarlyLeaveUsed)}
                    </Text>
                  </View>
                )}
                <View style={styles.summarySubRow}>
                  <Text
                    style={[
                      styles.summarySubLabel,
                      {
                        color:
                          totalEarlyLeaveHours - totalEarlyLeaveUsed > 0 ? '#fca5a5' : '#86efac',
                        fontWeight: '600',
                      },
                    ]}
                  >
                    └ คงค้าง:
                  </Text>
                  <Text
                    style={[
                      styles.summarySubValueText,
                      {
                        color:
                          totalEarlyLeaveHours - totalEarlyLeaveUsed > 0 ? '#fca5a5' : '#86efac',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {formatHoursWithDecimal(Math.max(0, totalEarlyLeaveHours - totalEarlyLeaveUsed))}
                  </Text>
                </View>
              </View>
            )}

            <Separator style={{ marginVertical: 10, backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.summaryTotalLabel]}>รวมเวลาทำงานจริง:</Text>
              <Text style={[styles.summaryValue, styles.summaryTotalValue]}>
                {formatHoursWithDecimal(totalRegularHours + totalOvertimeHours)}
              </Text>
            </View>

            {/* Watermark Footer on Shared Image */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.75)', fontFamily: 'Sarabun_400Regular' }}>
                รายงานสรุปเวลาทำงาน & OT
              </Text>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700', fontFamily: 'Sarabun_700Bold' }}>
                TimeTrack OT
              </Text>
            </View>
          </Card>
        </ViewShot>

        {/* Compact Share Summary Pill Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isSharingSummary}
          onPress={handleShareSummary}
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
            marginBottom: 14,
          }}
        >
          <Share2 size={14} color={isDark ? '#60a5fa' : '#2563eb'} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: isDark ? '#60a5fa' : '#2563eb',
              fontFamily: 'Sarabun_600SemiBold',
            }}
          >
            {isSharingSummary
              ? 'กำลังเตรียมภาพสรุป...'
              : `แชร์สรุปเวลาเดือน${thaiMonths[selectedMonth - 1]}`}
          </Text>
        </TouchableOpacity>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              ทั้งหมด ({monthEntries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'ot' && styles.filterPillActive]}
            onPress={() => setActiveFilter('ot')}
            activeOpacity={0.7}
          >
            <Icon
              name={Zap}
              size={13}
              color={activeFilter === 'ot' ? '#ffffff' : isDark ? '#4ade80' : '#16a34a'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'ot' && styles.filterPillTextActive,
              ]}
            >
              มี OT ({otCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'late' && styles.filterPillActive]}
            onPress={() => setActiveFilter('late')}
            activeOpacity={0.7}
          >
            <Icon
              name={AlertTriangle}
              size={13}
              color={activeFilter === 'late' ? '#ffffff' : isDark ? '#f87171' : '#dc2626'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'late' && styles.filterPillTextActive,
              ]}
            >
              มาสาย ({lateCount})
            </Text>
          </TouchableOpacity>

          {earlyCount > 0 && (
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'early' && styles.filterPillActive]}
              onPress={() => setActiveFilter('early')}
              activeOpacity={0.7}
            >
              <Icon
                name={LogOut}
                size={13}
                color={activeFilter === 'early' ? '#ffffff' : isDark ? '#fb923c' : '#ea580c'}
              />
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'early' && styles.filterPillTextActive,
                ]}
              >
                กลับก่อน ({earlyCount})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            รายการประจำวัน ({filteredEntries.length} วัน)
          </Text>
          <Text style={styles.sectionSubtitle}>แตะเพื่อดูรายละเอียด</Text>
        </View>

        {/* Timeline Daily Cards */}
        {isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name={Calendar} size={36} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {activeFilter === 'all'
                ? 'ยังไม่มีรายการบันทึกเวลาในเดือนนี้'
                : 'ไม่พบรายการที่ตรงกับเงื่อนไขที่เลือก'}
            </Text>
          </View>
        ) : (
          filteredEntries.map((entry, index) => {
            const dayOfWeek = getDayOfWeekThai(entry.date);
            const totalDayHours = (entry.regularHours || 0) + (entry.overtimeHours || 0);

            return (
              <Card key={index} style={styles.dailyCard}>
                {/* Header Row: Date & Total Hours */}
                <TouchableOpacity
                  style={styles.dailyHeader}
                  onPress={() => handleEntryPress(entry)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.dailyDateText}>
                      {formatDateThai(entry.date)} ({dayOfWeek})
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.totalBadge}>
                      <Text style={styles.totalBadgeText}>รวม {formatHours(totalDayHours)}</Text>
                    </View>
                    <Icon name={ChevronRight} size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>

                {/* Clock In / Out */}
                <TouchableOpacity
                  style={styles.timeRow}
                  onPress={() => handleEntryPress(entry)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name={Clock} size={14} color={colors.textSecondary} />
                    <Text style={styles.clockText}>
                      {entry.clockIn || '--:--'} - {entry.clockOut || '--:--'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Status Badges */}
                <View style={styles.badgesRow}>
                  {/* Regular */}
                  <View
                    style={[
                      styles.miniBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(37, 99, 235, 0.15)'
                          : 'rgba(37, 99, 235, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniBadgeText,
                        { color: isDark ? '#60a5fa' : '#2563eb' },
                      ]}
                    >
                      ปกติ: {formatHours(entry.regularHours || 0)}
                    </Text>
                  </View>

                  {/* Overtime */}
                  {(entry.overtimeHours || 0) > 0 && (
                    <View
                      style={[
                        styles.miniBadge,
                        {
                          backgroundColor: entry.overtimeUsed
                            ? isDark
                              ? '#27272a'
                              : '#f1f5f9'
                            : isDark
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(34, 197, 94, 0.1)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        },
                      ]}
                    >
                      <Zap
                        size={10}
                        color={
                          entry.overtimeUsed
                            ? colors.textSecondary
                            : isDark
                            ? '#4ade80'
                            : '#16a34a'
                        }
                      />
                      <Text
                        style={[
                          styles.miniBadgeText,
                          {
                            color: entry.overtimeUsed
                              ? colors.textSecondary
                              : isDark
                              ? '#4ade80'
                              : '#16a34a',
                          },
                        ]}
                      >
                        OT: {formatHours(entry.overtimeHours || 0)}
                        {entry.overtimeUsed ? ' (ใช้แล้ว)' : ''}
                      </Text>
                    </View>
                  )}

                  {/* Late Arrival */}
                  {(entry.lateArrivalHours || 0) > 0 && (
                    <View
                      style={[
                        styles.miniBadge,
                        {
                          backgroundColor: entry.lateArrivalUsed
                            ? isDark
                              ? '#27272a'
                              : '#f1f5f9'
                            : isDark
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(239, 68, 68, 0.1)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        },
                      ]}
                    >
                      <AlertTriangle
                        size={10}
                        color={
                          entry.lateArrivalUsed
                            ? colors.textSecondary
                            : isDark
                            ? '#f87171'
                            : '#dc2626'
                        }
                      />
                      <Text
                        style={[
                          styles.miniBadgeText,
                          {
                            color: entry.lateArrivalUsed
                              ? colors.textSecondary
                              : isDark
                              ? '#f87171'
                              : '#dc2626',
                          },
                        ]}
                      >
                        สาย: {formatHours(entry.lateArrivalHours || 0)}
                        {entry.lateArrivalUsed ? ' (ชดเชยแล้ว)' : ''}
                      </Text>
                    </View>
                  )}

                  {/* Early Leave */}
                  {(entry.earlyLeaveHours || 0) > 0 && (
                    <View
                      style={[
                        styles.miniBadge,
                        {
                          backgroundColor: entry.earlyLeaveUsed
                            ? isDark
                              ? '#27272a'
                              : '#f1f5f9'
                            : isDark
                            ? 'rgba(249, 115, 22, 0.15)'
                            : 'rgba(249, 115, 22, 0.1)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        },
                      ]}
                    >
                      <LogOut
                        size={10}
                        color={
                          entry.earlyLeaveUsed
                            ? colors.textSecondary
                            : isDark
                            ? '#fb923c'
                            : '#ea580c'
                        }
                      />
                      <Text
                        style={[
                          styles.miniBadgeText,
                          {
                            color: entry.earlyLeaveUsed
                              ? colors.textSecondary
                              : isDark
                              ? '#fb923c'
                              : '#ea580c',
                          },
                        ]}
                      >
                        ก่อน: {formatHours(entry.earlyLeaveHours || 0)}
                        {entry.earlyLeaveUsed ? ' (ชดเชยแล้ว)' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Quick Check Action Buttons (if day has OT/Late/Early) */}
                {((entry.overtimeHours || 0) > 0 ||
                  (entry.lateArrivalHours || 0) > 0 ||
                  (entry.earlyLeaveHours || 0) > 0) && (
                  <View style={styles.actionRow}>
                    {(entry.overtimeHours || 0) > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          entry.overtimeUsed && styles.checkButtonActive,
                        ]}
                        onPress={() => handleToggleOvertimeUsed(entry)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={entry.overtimeUsed ? CheckSquare : Square}
                          size={16}
                          color={entry.overtimeUsed ? '#16a34a' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.checkButtonText,
                            entry.overtimeUsed && styles.checkButtonTextActive,
                          ]}
                        >
                          ใช้ OT แล้ว
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(entry.lateArrivalHours || 0) > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          entry.lateArrivalUsed && styles.checkButtonActive,
                        ]}
                        onPress={() => handleToggleLateUsed(entry)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={entry.lateArrivalUsed ? CheckSquare : Square}
                          size={16}
                          color={entry.lateArrivalUsed ? '#dc2626' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.checkButtonText,
                            entry.lateArrivalUsed && styles.checkButtonTextActive,
                          ]}
                        >
                          ชดเชยสายแล้ว
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(entry.earlyLeaveHours || 0) > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          entry.earlyLeaveUsed && styles.checkButtonActive,
                        ]}
                        onPress={() => handleToggleEarlyLeaveUsed(entry)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={entry.earlyLeaveUsed ? CheckSquare : Square}
                          size={16}
                          color={entry.earlyLeaveUsed ? '#ea580c' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.checkButtonText,
                            entry.earlyLeaveUsed && styles.checkButtonTextActive,
                          ]}
                        >
                          ชดเชยกลับก่อนแล้ว
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดการทำงาน</Text>
              <TouchableOpacity onPress={closeModal} style={{ padding: 4 }}>
                <Icon name={X} size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedEntry && (
              <View style={{ gap: 4 }}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>วันที่:</Text>
                  <Text style={styles.modalValue}>
                    {formatDateThai(selectedEntry.date)} ({getDayOfWeekThai(selectedEntry.date)})
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>เวลาเข้างาน:</Text>
                  <Text style={styles.modalValue}>{selectedEntry.clockIn || 'ไม่ได้บันทึก'}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>เวลาเลิกงาน:</Text>
                  <Text style={styles.modalValue}>{selectedEntry.clockOut || 'ไม่ได้บันทึก'}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>ชั่วโมงปกติ:</Text>
                  <Text style={styles.modalValue}>
                    {formatHoursWithDecimal(selectedEntry.regularHours || 0)}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>ชั่วโมง OT:</Text>
                  <Text style={[styles.modalValue, { color: '#16a34a' }]}>
                    {formatHoursWithDecimal(selectedEntry.overtimeHours || 0)}
                  </Text>
                </View>

                {(selectedEntry.lateArrivalHours || 0) > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>ชั่วโมงมาสาย:</Text>
                    <Text style={[styles.modalValue, { color: '#dc2626' }]}>
                      {formatHoursWithDecimal(selectedEntry.lateArrivalHours || 0)}
                    </Text>
                  </View>
                )}

                {(selectedEntry.earlyLeaveHours || 0) > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>กลับก่อนเวลา:</Text>
                    <Text style={[styles.modalValue, { color: '#ea580c' }]}>
                      {formatHoursWithDecimal(selectedEntry.earlyLeaveHours || 0)}
                    </Text>
                  </View>
                )}

                {selectedEntry.reason ? (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>หมายเหตุ / เหตุผล:</Text>
                    <Text style={styles.modalValue}>{selectedEntry.reason}</Text>
                  </View>
                ) : null}

                <Button
                  variant="default"
                  size="sm"
                  icon={Edit3}
                  style={{ marginTop: 14 }}
                  onPress={() => {
                    closeModal();
                    router.push('/time-entry');
                  }}
                >
                  แก้ไขรายการนี้
                </Button>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <BottomNavigation />
    </View>
  );
};

export default function ReportsScreen() {
  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <ReportsContent />
      </SafeAreaView>
    </ThemeProvider>
  );
}
