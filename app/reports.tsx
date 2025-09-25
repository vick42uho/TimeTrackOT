
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { useStorage } from '../hooks/useStorage';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import { PeriodReport } from '../types';
import Icon from '../components/Icon';

const ReportsContent: React.FC = () => {
  const { colors } = useThemeContext();
  const router = useRouter();
  const { getTimeEntriesForPeriod } = useStorage();
  const { getMonthPeriods, formatHours, formatDateThai } = useTimeCalculation();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodReports, setPeriodReports] = useState<PeriodReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [selectedMonth, selectedYear]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const periods = getMonthPeriods(selectedMonth, selectedYear);
      const reports: PeriodReport[] = [];

      for (const period of periods) {
        const entries = await getTimeEntriesForPeriod(period.startDate, period.endDate);
        const totalRegularHours = entries.reduce((sum, entry) => sum + entry.regularHours, 0);
        const totalOvertimeHours = entries.reduce((sum, entry) => sum + entry.overtimeHours, 0);

        reports.push({
          period: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          totalRegularHours,
          totalOvertimeHours,
          entries,
        });
      }

      setPeriodReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const totalRegularHours = periodReports.reduce((sum, report) => sum + report.totalRegularHours, 0);
  const totalOvertimeHours = periodReports.reduce((sum, report) => sum + report.totalOvertimeHours, 0);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    monthButton: {
      padding: 8,
    },
    monthText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
    },
    summaryCard: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 16,
      fontFamily: 'Sarabun_600SemiBold',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    summaryLabel: {
      fontSize: 16,
      color: '#ffffff',
      opacity: 0.9,
      fontFamily: 'Sarabun_400Regular',
    },
    summaryValue: {
      fontSize: 18,
      color: '#ffffff',
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
    },
    periodCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      boxShadow: `0px 2px 8px ${colors.shadow}`,
      elevation: 3,
    },
    periodHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    periodTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
    },
    periodDate: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
    periodStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.backgroundAlt,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      fontFamily: 'Sarabun_400Regular',
    },
    entryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryDate: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Sarabun_400Regular',
    },
    entryTime: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
    entryHours: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    loadingText: {
      textAlign: 'center',
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 40,
      fontFamily: 'Sarabun_400Regular',
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 40,
      fontFamily: 'Sarabun_400Regular',
    },
  });

  const changeMonth = (direction: 'prev' | 'next') => {
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>รายงานเวลาทำงาน</Text>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth('prev')}
          >
            <Icon name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {thaiMonths[selectedMonth - 1]} {selectedYear + 543}
          </Text>
          
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth('next')}
          >
            <Icon name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>สรุปรายเดือน</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ชั่วโมงปกติ:</Text>
            <Text style={styles.summaryValue}>{formatHours(totalRegularHours)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ชั่วโมง OT:</Text>
            <Text style={styles.summaryValue}>{formatHours(totalOvertimeHours)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>รวมทั้งหมด:</Text>
            <Text style={styles.summaryValue}>{formatHours(totalRegularHours + totalOvertimeHours)}</Text>
          </View>
        </View>

        {/* Period Reports */}
        {isLoading ? (
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        ) : periodReports.length === 0 ? (
          <Text style={styles.emptyText}>ไม่มีข้อมูลในเดือนนี้</Text>
        ) : (
          periodReports.map((report, index) => (
            <View key={index} style={styles.periodCard}>
              <View style={styles.periodHeader}>
                <Text style={styles.periodTitle}>งวดที่ {report.period}</Text>
                <Text style={styles.periodDate}>
                  {formatDateThai(report.startDate)} - {formatDateThai(report.endDate)}
                </Text>
              </View>

              <View style={styles.periodStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatHours(report.totalRegularHours)}</Text>
                  <Text style={styles.statLabel}>ชั่วโมงปกติ</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatHours(report.totalOvertimeHours)}</Text>
                  <Text style={styles.statLabel}>ชั่วโมง OT</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{report.entries.length}</Text>
                  <Text style={styles.statLabel}>วันทำงาน</Text>
                </View>
              </View>

              {/* Entry Details */}
              {report.entries.map((entry, entryIndex) => (
                <View key={entryIndex} style={styles.entryItem}>
                  <Text style={styles.entryDate}>{formatDateThai(entry.date)}</Text>
                  <Text style={styles.entryTime}>
                    {entry.clockIn || '-'} - {entry.clockOut || '-'}
                  </Text>
                  <Text style={styles.entryHours}>
                    {formatHours(entry.regularHours + entry.overtimeHours)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

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
