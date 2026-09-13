import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  InteractiveTourOverlay,
  APP_TOUR_STEPS,
  TargetLayout,
  markTourCompleted,
} from '@/components/InteractiveTourOverlay';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';
import {
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
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import { TimeEntry } from '../types';
import { EntryRow } from '@/components/reports/EntryRow';
import { SummaryCard } from '@/components/reports/SummaryCard';
import { FilterPills, FilterType } from '@/components/reports/FilterPills';
import { DetailModal } from '@/components/reports/DetailModal';

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

  // Tour State
  const { tourStep } = useLocalSearchParams<{ tourStep?: string }>();
  const [tourLayout, setTourLayout] = useState<TargetLayout | null>(null);
  const summaryCardRef = useRef<View>(null);

  useEffect(() => {
    if (tourStep === '7') {
      const timer = setTimeout(() => {
        summaryCardRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            setTourLayout({ x, y, width, height, borderRadius: 28 });
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setTourLayout(null);
    }
  }, [tourStep]);

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, selectedMonth, selectedYear])
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
  const summaryTotals = useMemo(
    () => ({
      regular: totalRegularHours,
      ot: totalOvertimeHours,
      otUsed: totalOvertimeUsed,
      late: totalLateHours,
      lateUsed: totalLateUsed,
      early: totalEarlyLeaveHours,
      earlyUsed: totalEarlyLeaveUsed,
    }),
    [totalRegularHours, totalOvertimeHours, totalOvertimeUsed, totalLateHours, totalLateUsed, totalEarlyLeaveHours, totalEarlyLeaveUsed]
  );

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

  const handleEditEntry = (entry: TimeEntry) => {
    const targetDate = entry.date;
    closeModal();
    router.replace({
      pathname: '/time-entry',
      params: { date: targetDate },
    });
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
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 0,
      ...Platform.select({
        ios: {
          shadowColor: '#64748b',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 14,
        },
        android: {
          elevation: 0,
        },
      }),
    },
    monthButton: {
      padding: 8,
      borderRadius: 999,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    },
    monthText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
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
        <View ref={summaryCardRef} collapsable={false}>
          <ViewShot
          ref={summaryViewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={{
            borderRadius: 28,
            marginBottom: 10,
          }}
        >
          <SummaryCard
            monthName={thaiMonths[selectedMonth - 1]}
            totals={summaryTotals}
            colors={colors}
            isDark={isDark}
            formatHoursWithDecimal={formatHoursWithDecimal}
          />

        </ViewShot>
      </View>

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
            paddingHorizontal: 18,
            paddingVertical: 9,
            borderRadius: 999,
            borderWidth: 1.3,
            borderColor: colors.border,
            backgroundColor: colors.card,
            marginBottom: 14,
          }}
        >
          <Share2 size={14} color={colors.text} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: colors.text,
              fontFamily: 'Sarabun_700Bold',
            }}
          >
            {isSharingSummary
              ? 'กำลังเตรียมภาพสรุป...'
              : `แชร์สรุปเวลาเดือน${thaiMonths[selectedMonth - 1]}`}
          </Text>
        </TouchableOpacity>

        <FilterPills
          activeFilter={activeFilter}
          totalCount={monthEntries.length}
          otCount={otCount}
          lateCount={lateCount}
          earlyCount={earlyCount}
          colors={colors}
          isDark={isDark}
          onChange={setActiveFilter}
        />

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
          filteredEntries.map((entry, index) => (
            <EntryRow
              key={entry.id || index}
              entry={entry}
              dayOfWeek={getDayOfWeekThai(entry.date)}
              colors={colors}
              isDark={isDark}
              formatHours={formatHours}
              formatDateThai={formatDateThai}
              onPress={handleEntryPress}
              onToggleOvertime={handleToggleOvertimeUsed}
              onToggleLate={handleToggleLateUsed}
              onToggleEarly={handleToggleEarlyLeaveUsed}
            />
          ))
        )}
      </ScrollView>

      <DetailModal
        visible={modalVisible}
        entry={selectedEntry}
        colors={colors}
        formatHoursWithDecimal={formatHoursWithDecimal}
        formatDateThai={formatDateThai}
        getDayOfWeekThai={getDayOfWeekThai}
        onClose={closeModal}
        onEdit={handleEditEntry}
      />

      {/* Interactive Tour Overlay for Step 7 */}
      <InteractiveTourOverlay
        visible={tourStep === '7'}
        currentStepIndex={6}
        totalSteps={APP_TOUR_STEPS.length}
        stepData={{
          ...APP_TOUR_STEPS[6],
          targetLayout: tourLayout,
        }}
        onNext={() => router.replace('/?tourStep=8')}
        onPrev={() => router.replace('/time-entry?tourStep=6')}
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

function ReportsScreenContent() {
  const { colors } = useThemeContext();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ReportsContent />
    </SafeAreaView>
  );
}

export default function ReportsScreen() {
  return (
    <ThemeProvider>
      <ReportsScreenContent />
    </ThemeProvider>
  );
}
