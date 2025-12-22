
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import Icon from '../components/Icon';
import * as Font from 'expo-font';
import {
  Sarabun_400Regular,
  Sarabun_600SemiBold,
  Sarabun_700Bold,
} from '@expo-google-fonts/sarabun';
import { getWelcomeMessage } from '@/utils/welcome';

const { width } = Dimensions.get('window');

const HomeContent: React.FC = () => {
  const { colors } = useThemeContext();
  const router = useRouter();
  const { getWorkSchedule, getTimeEntry, isReady, getTimeEntriesForPeriod } = useDatabase();
  const { formatDateThai, getThaiDayName, formatHours, calculateLateArrival, calculateWorkHours } = useTimeCalculation();
  
  const [currentSchedule, setCurrentSchedule] = useState<any>(undefined);
  const [todayEntry, setTodayEntry] = useState<any>(undefined);
  const [currentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<{
    totalOT: number;
    totalOTUsed: number;
    lateCount: number;
    lateUsedCount: number;
  }>({ totalOT: 0, totalOTUsed: 0, lateCount: 0, lateUsedCount: 0 });

  // Define loadTodayData function first
  const loadTodayData = useCallback(async () => {
    if (!isReady) {
      console.log('Database not ready, skipping data load');
      return;
    }
    
    // Use actual current date from system
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const year = today.getFullYear();
    const day = today.getDate();
    
    // Format date string properly
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log('Loading data for date:', dateString); // Debug log
    console.log('Current system date:', today.toLocaleString()); // Debug log

    const schedule = await getWorkSchedule(month, year);
    const entry = await getTimeEntry(dateString);

    console.log('Loaded schedule:', schedule); // Debug log
    console.log('Loaded entry:', entry); // Debug log

    // Load monthly statistics for the entire year
    await loadYearlyStats(year, schedule);

    // Calculate late arrival for today's entry if available
    let todayEntryWithLate = entry;
    if (entry && entry.clockIn && schedule) {
      const lateHours = calculateLateArrival(entry.clockIn, schedule);
      todayEntryWithLate = { ...entry, lateArrivalHours: lateHours };
    }

    console.log('Setting schedule:', schedule); // Debug log
    console.log('Setting entry:', todayEntryWithLate); // Debug log

    setCurrentSchedule(schedule);
    setTodayEntry(todayEntryWithLate);
  }, [isReady, getWorkSchedule, getTimeEntry, calculateLateArrival]);

  useEffect(() => {
    initializeApp();
  }, []);

  // Load data when database becomes ready
  useEffect(() => {
    if (isReady && todayEntry === undefined && currentSchedule === undefined) {
      console.log('Database is now ready, loading initial data');
      loadTodayData();
    }
  }, [isReady, loadTodayData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isReady) {
        return;
      }
      
      // Reload yearly stats to get updated OT/late used counts
      console.log('Screen focused - reloading stats');
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      getWorkSchedule(month, year).then(schedule => {
        if (schedule) {
          loadYearlyStats(year, schedule);
        }
      });
    }, [isReady]) // Only depend on isReady to prevent loops
  );

  const initializeApp = async () => {
    try {
      // Only load data if database is ready
      if (isReady) {
        await loadTodayData();
      } else {
        console.log('Database not ready during app initialization, will load when ready');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadYearlyStats = async (year: number, schedule: any) => {
    if (!schedule) {
      setMonthlyStats({ totalOT: 0, totalOTUsed: 0, lateCount: 0, lateUsedCount: 0 });
      return;
    }

    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      
      // Get entire year data for OT calculation
      const firstDayYear = new Date(year, 0, 1).toISOString().split('T')[0];
      const lastDayYear = new Date(year, 11, 31).toISOString().split('T')[0];
      
      // Get current month data for late arrival count
      const firstDayMonth = new Date(year, currentMonth, 1).toISOString().split('T')[0];
      const lastDayMonth = new Date(year, currentMonth + 1, 0).toISOString().split('T')[0];
      
      const yearEntries = await getTimeEntriesForPeriod(firstDayYear, lastDayYear);
      const monthEntries = await getTimeEntriesForPeriod(firstDayMonth, lastDayMonth);
      
      let totalOT = 0;
      let totalOTUsed = 0;
      let lateCount = 0;
      let lateUsedCount = 0;
      
      // Calculate total OT for the year - recalculate using current logic
      yearEntries.forEach(entry => {
        if (entry.clockIn && entry.clockOut && schedule) {
          // Recalculate OT hours using current calculation logic
          const calculated = calculateWorkHours(entry.clockIn, entry.clockOut, schedule);
          totalOT += calculated.overtimeHours;
          if (entry.overtimeUsed) {
            totalOTUsed += calculated.overtimeHours;
          }
        } else if (entry.overtimeHours) {
          // Fallback to stored value if no clock times available
          totalOT += entry.overtimeHours;
          if (entry.overtimeUsed) {
            totalOTUsed += entry.overtimeHours;
          }
        }
      });
      
      // Count late arrivals for current month only
      monthEntries.forEach(entry => {
        if (entry.clockIn && schedule) {
          const lateHours = calculateLateArrival(entry.clockIn, schedule);
          if (lateHours > 0) {
            lateCount++;
            if (entry.lateArrivalUsed) {
              lateUsedCount++;
            }
          }
        }
      });
      
      setMonthlyStats({ totalOT, totalOTUsed, lateCount, lateUsedCount });
    } catch (error) {
      console.error('Error loading yearly stats:', error);
      setMonthlyStats({ totalOT: 0, totalOTUsed: 0, lateCount: 0, lateUsedCount: 0 });
    }
  };

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const currentMonth = thaiMonths[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear() + 543;

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
      paddingVertical: 16,
      paddingHorizontal: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: 'Sarabun_400Regular',
    },
    dashboardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 5,
      width: (width - 50) / 2,
      marginBottom: 10,
      alignItems: 'center',
      boxShadow: `0px 4px 8px ${colors.shadow}`,
      elevation: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    otStatCard: {
      backgroundColor: '#E8F5E8',
      borderColor: '#4CAF50',
      shadowColor: '#4CAF50',
    },
    lateStatCard: {
      backgroundColor: '#FFEBEE',
      borderColor: '#F44336',
      shadowColor: '#F44336',
    },
    regularHoursStatCard: {
      backgroundColor: '#E3F2FD',
      borderColor: '#2196F3',
      shadowColor: '#2196F3',
    },
    overtimeStatCard: {
      backgroundColor: '#FFF3E0',
      borderColor: '#FF9800',
      shadowColor: '#FF9800',
    },
    statValue: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Sarabun_700Bold',
      marginBottom: 6,
    },
    otStatValue: {
      color: '#2E7D32',
    },
    lateStatValue: {
      color: '#C62828',
    },
    regularHoursStatValue: {
      color: '#1565C0',
    },
    overtimeStatValue: {
      color: '#E65100',
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
      textAlign: 'center',
      fontWeight: '600',
    },
    otStatLabel: {
      color: '#388E3C',
    },
    lateStatLabel: {
      color: '#D32F2F',
    },
    regularHoursStatLabel: {
      color: '#1976D2',
    },
    overtimeStatLabel: {
      color: '#F57C00',
    },
    warningValue: {
      color: colors.warning,
    },
    successValue: {
      color: colors.success,
    },
    mainCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      boxShadow: `0px 2px 6px ${colors.shadow}`,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
    },
    statusBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    warningBadge: {
      backgroundColor: colors.warning,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
      textAlign: 'right',
    },
    highlightValue: {
      color: colors.primary,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 16,
      paddingHorizontal: 4,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 8,
      alignItems: 'center',
      marginHorizontal: 6,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    timeActionButton: {
      backgroundColor: '#E8F5E8',
      borderColor: '#4CAF50',
      borderWidth: 2,
    },
    reportsActionButton: {
      backgroundColor: '#E3F2FD',
      borderColor: '#2196F3',
      borderWidth: 2,
    },
    settingsActionButton: {
      backgroundColor: '#FFF3E0',
      borderColor: '#FF9800',
      borderWidth: 2,
    },
    actionIcon: {
      marginBottom: 8,
    },
    actionText: {
      fontSize: 13,
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
      fontWeight: '600',
      textAlign: 'center',
    },
    timeActionText: {
      color: '#2E7D32',
    },
    reportsActionText: {
      color: '#1565C0',
    },
    settingsActionText: {
      color: '#E65100',
    },
    setupButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    setupButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      fontFamily: 'Sarabun_400Regular',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{getWelcomeMessage()}</Text>
          <Text style={styles.subtitle}>
            {getThaiDayName(currentDate.toISOString().split('T')[0])} ที่ {formatDateThai(currentDate.toISOString().split('T')[0])}
          </Text>
        </View>

        {/* Dashboard Stats Grid */}
        <View style={styles.dashboardGrid}>
          <View style={[styles.statCard, styles.otStatCard]}>
            <Text style={[styles.statValue, styles.otStatValue]}>
              {formatHours(monthlyStats.totalOT - monthlyStats.totalOTUsed)}
            </Text>
            <Text style={[styles.statLabel, styles.otStatLabel]}>
              OT คงเหลือ{'\n'}ทั้งปี
              {monthlyStats.totalOTUsed > 0 && `\n(รวม: ${formatHours(monthlyStats.totalOT)})`}
            </Text>
          </View>

          <View style={[styles.statCard, styles.lateStatCard]}>
            <Text style={[styles.statValue, styles.lateStatValue]}>
              {monthlyStats.lateCount - monthlyStats.lateUsedCount}
            </Text>
            <Text style={[styles.statLabel, styles.lateStatLabel]}>
              มาสายคงเหลือ{'\n'}เดือนนี้
              {monthlyStats.lateUsedCount > 0 && `\n(รวม: ${monthlyStats.lateCount})`}
            </Text>
          </View>

          <View style={[styles.statCard, styles.regularHoursStatCard]}>
            <Text style={[styles.statValue, styles.regularHoursStatValue]}>
              {formatHours(todayEntry?.regularHours || 0)}
            </Text>
            <Text style={[styles.statLabel, styles.regularHoursStatLabel]}>ชั่วโมงปกติ{'\n'}วันนี้</Text>
          </View>

          <View style={[styles.statCard, styles.overtimeStatCard]}>
            <Text style={[styles.statValue, styles.overtimeStatValue]}>
              {formatHours(todayEntry?.overtimeHours || 0)}
            </Text>
            <Text style={[styles.statLabel, styles.overtimeStatLabel]}>ชั่วโมง OT{'\n'}วันนี้</Text>
          </View>
        </View>

        {/* Today's Status Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>สถานะวันนี้</Text>
            {todayEntry && (
              <View style={[styles.statusBadge, !todayEntry.clockOut && styles.warningBadge]}>
                <Text style={styles.statusBadgeText}>
                  {todayEntry.clockOut ? 'เสร็จสิ้น' : 'กำลังทำงาน'}
                </Text>
              </View>
            )}
          </View>
          
          {todayEntry ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>เวลาเข้างาน</Text>
                <Text style={[styles.infoValue, styles.highlightValue]}>{todayEntry.clockIn || '-'} น.</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>เวลาเลิกงาน</Text>
                <Text style={styles.infoValue}>
                  {todayEntry.clockOut ? `${todayEntry.clockOut} น.` : 'ยังไม่ได้เลิกงาน'}
                </Text>
              </View>
              {todayEntry.lateArrivalHours > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ชั่วโมงมาสาย</Text>
                  <Text style={[styles.infoValue, styles.warningValue]}>
                    {formatHours(todayEntry.lateArrivalHours)}
                  </Text>
                </View>
              )}
              {todayEntry?.overtimeHours > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ชั่วโมง OT</Text>
                  <Text style={[styles.infoValue, styles.warningValue]}>
                    {formatHours(todayEntry.overtimeHours)}
                  </Text>
                </View>
              )}
              {todayEntry.reason && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>เหตุผล</Text>
                  <Text style={styles.infoValue}>{todayEntry.reason}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.infoLabel}>ยังไม่ได้บันทึกเวลาวันนี้</Text>
          )}
        </View>

        {/* Work Schedule Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>เวลาทำงาน ({currentMonth})</Text>
            {currentSchedule && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>ตั้งค่าแล้ว</Text>
              </View>
            )}
          </View>
          
          {currentSchedule ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>เวลาเข้างาน</Text>
                <Text style={styles.infoValue}>{currentSchedule.startTime} น.</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>เวลาเลิกงาน</Text>
                <Text style={styles.infoValue}>{currentSchedule.endTime} น.</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.infoLabel}>ยังไม่ได้ตั้งค่าเวลาทำงานสำหรับเดือนนี้</Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => router.push('/settings')}
              >
                <Text style={styles.setupButtonText}>ตั้งค่าเวลาทำงาน</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.timeActionButton]}
            onPress={() => router.push('/time-entry')}
          >
            <Icon name="time" size={24} color="#4CAF50" style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.timeActionText]}>บันทึกเวลา</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.reportsActionButton]}
            onPress={() => router.push('/reports')}
          >
            <Icon name="bar-chart" size={24} color="#2196F3" style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.reportsActionText]}>รายงาน</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.settingsActionButton]}
            onPress={() => router.push('/settings')}
          >
            <Icon name="settings" size={24} color="#FF9800" style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.settingsActionText]}>ตั้งค่า</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

export default function MainScreen() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Sarabun_400Regular,
          Sarabun_600SemiBold,
          Sarabun_700Bold,
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <HomeContent />
      </SafeAreaView>
    </ThemeProvider>
  );
}
