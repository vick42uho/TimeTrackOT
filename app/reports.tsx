
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { useRouter } from 'expo-router';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import { TimeEntry, PeriodReport } from '../types';
import Icon from '../components/Icon';

const ReportsContent: React.FC = () => {
  const { colors } = useThemeContext();
  const router = useRouter();
  const { getTimeEntriesForPeriod, getWorkSchedule, updateTimeEntry, isReady } = useDatabase();
  const { getMonthPeriods, formatHours, formatDateThai, calculateWorkHours, calculateLateArrival, calculateEarlyLeave } = useTimeCalculation();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodReports, setPeriodReports] = useState<PeriodReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadReports();
  }, [selectedMonth, selectedYear]);

  // Refresh data when screen comes into focus (only if data is stale)
  useFocusEffect(
    React.useCallback(() => {
      if (isReady && periodReports.length === 0) {
        loadReports();
      }
    }, [isReady, selectedMonth, selectedYear, periodReports])
  );

  const loadReports = async () => {
    if (!isReady) {
      console.log('Database not ready, skipping reports load');
      return;
    }
    
    console.log(`Loading reports for ${selectedMonth}/${selectedYear}`);
    setIsLoading(true);
    try {
      const periods = getMonthPeriods(selectedMonth, selectedYear);
      console.log('Periods:', periods);
      const reports: PeriodReport[] = [];

      // Get work schedule for the selected month/year
      const workSchedule = await getWorkSchedule(selectedMonth, selectedYear);
      console.log('Work schedule:', workSchedule);

      for (const period of periods) {
        const entries = await getTimeEntriesForPeriod(period.startDate, period.endDate);
        console.log(`Entries for period ${period.name}:`, entries);
        
        // Recalculate hours for entries that don't have calculated values or have zero values
        const processedEntries = entries.map(entry => {
          let lateArrivalHours = 0;
          let earlyLeaveHours = 0;
          
          if ((!entry.regularHours && !entry.overtimeHours) || (entry.regularHours === 0 && entry.overtimeHours === 0)) {
            // Only recalculate if we have clock in/out times and work schedule
            if (entry.clockIn && entry.clockOut && workSchedule) {
              const calculated = calculateWorkHours(entry.clockIn, entry.clockOut, workSchedule);
              lateArrivalHours = calculateLateArrival(entry.clockIn, workSchedule);
              earlyLeaveHours = calculateEarlyLeave(entry.clockOut, workSchedule);
              console.log(`Recalculating for ${entry.date}: Regular: ${calculated.regularHours}, OT: ${calculated.overtimeHours}, Late: ${lateArrivalHours}, Early Leave: ${earlyLeaveHours}`);
              return {
                ...entry,
                regularHours: calculated.regularHours,
                overtimeHours: calculated.overtimeHours,
                lateArrivalHours,
                earlyLeaveHours,
              };
            } else {
              console.log(`Cannot recalculate for ${entry.date}: clockIn=${entry.clockIn}, clockOut=${entry.clockOut}, workSchedule=${!!workSchedule}`);
            }
          } else {
            // Calculate late arrival and early leave for existing entries
            if (entry.clockIn && workSchedule) {
              lateArrivalHours = calculateLateArrival(entry.clockIn, workSchedule);
            }
            if (entry.clockOut && workSchedule) {
              earlyLeaveHours = calculateEarlyLeave(entry.clockOut, workSchedule);
            }
          }
          
          return {
            ...entry,
            lateArrivalHours,
            earlyLeaveHours,
          };
        });

        const totalRegularHours = processedEntries.reduce((sum, entry) => sum + (entry.regularHours || 0), 0);
        const totalOvertimeHours = processedEntries.reduce((sum, entry) => sum + (entry.overtimeHours || 0), 0);
        const totalLateHours = processedEntries.reduce((sum, entry) => sum + (entry.lateArrivalHours || 0), 0);
        const totalEarlyLeaveHours = processedEntries.reduce((sum, entry) => sum + (entry.earlyLeaveHours || 0), 0);
        
        const totalOvertimeUsed = processedEntries.reduce((sum, entry) => sum + (entry.overtimeUsed && entry.overtimeHours ? entry.overtimeHours : 0), 0);
        const totalLateUsed = processedEntries.reduce((sum, entry) => sum + (entry.lateArrivalUsed && entry.lateArrivalHours ? entry.lateArrivalHours : 0), 0);
        const totalEarlyLeaveUsed = processedEntries.reduce((sum, entry) => sum + (entry.earlyLeaveUsed && entry.earlyLeaveHours ? entry.earlyLeaveHours : 0), 0);
        
        console.log(`Period ${period.name} - Regular: ${totalRegularHours}, OT: ${totalOvertimeHours}, Late: ${totalLateHours}, Early Leave: ${totalEarlyLeaveHours}`);

        reports.push({
          period: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          totalRegularHours,
          totalOvertimeHours,
          totalLateHours,
          totalEarlyLeaveHours,
          totalOvertimeUsed,
          totalLateUsed,
          totalEarlyLeaveUsed,
          entries: processedEntries,
        });
      }

      console.log('Final reports:', reports);
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

  const totalRegularHours = periodReports.reduce((sum, report) => sum + (report.totalRegularHours || 0), 0);
  const totalOvertimeHours = periodReports.reduce((sum, report) => sum + (report.totalOvertimeHours || 0), 0);
  const totalLateHours = periodReports.reduce((sum, report) => sum + (report.totalLateHours || 0), 0);
  const totalEarlyLeaveHours = periodReports.reduce((sum, report) => sum + (report.totalEarlyLeaveHours || 0), 0);
  const totalOvertimeUsed = periodReports.reduce((sum, report) => sum + (report.totalOvertimeUsed || 0), 0);
  const totalLateUsed = periodReports.reduce((sum, report) => sum + (report.totalLateUsed || 0), 0);
  const totalEarlyLeaveUsed = periodReports.reduce((sum, report) => sum + (report.totalEarlyLeaveUsed || 0), 0);

  // Toggle handlers
  const handleToggleOvertimeUsed = async (entry: TimeEntry) => {
    try {
      await updateTimeEntry(entry.date, { overtimeUsed: !entry.overtimeUsed });
      loadReports(); // Reload to reflect changes
    } catch (error) {
      console.error('Error toggling overtime used:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกสถานะได้');
    }
  };

  const handleToggleLateUsed = async (entry: TimeEntry) => {
    try {
      await updateTimeEntry(entry.date, { lateArrivalUsed: !entry.lateArrivalUsed });
      loadReports(); // Reload to reflect changes
    } catch (error) {
      console.error('Error toggling late used:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกสถานะได้');
    }
  };

  const handleToggleEarlyLeaveUsed = async (entry: TimeEntry) => {
    try {
      await updateTimeEntry(entry.date, { earlyLeaveUsed: !entry.earlyLeaveUsed });
      loadReports(); // Reload to reflect changes
    } catch (error) {
      console.error('Error toggling early leave used:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกสถานะได้');
    }
  };


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
      flexDirection: 'column',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderRadius: 8,
    },
    entryContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    entryLeft: {
      flex: 1,
    },
    entryRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    entryArrow: {
      marginLeft: 8,
      justifyContent: 'center',
    },
    entryDate: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
      fontWeight: '600',
    },
    entryTime: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
      marginTop: 2,
    },
    entryHours: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    entryDetails: {
      fontSize: 11,
      color: '#FF0000', // Red text color
      fontFamily: 'Sarabun_400Regular',
      marginTop: 2,
      textAlign: 'right',
      flexWrap: 'nowrap',
    },
    toggleRow: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 12,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: colors.backgroundAlt,
      gap: 4,
    },
    toggleButtonActive: {
      backgroundColor: colors.backgroundAlt,
    },
    toggleText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
    toggleTextActive: {
      color: colors.text,
      fontWeight: '600',
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 20,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    closeButton: {
      padding: 5,
    },
    modalBody: {
      paddingVertical: 10,
    },
    modalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
      flex: 1,
    },
    modalValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
      flex: 2,
      textAlign: 'right',
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

  const handleEntryPress = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEntry(null);
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
            <Text style={styles.summaryValue}>
              {formatHours(totalOvertimeHours)}
              {totalOvertimeUsed > 0 && <Text style={{fontSize: 14, opacity: 0.8}}> (ใช้แล้ว: {formatHours(totalOvertimeUsed)})</Text>}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ชั่วโมงมาสาย:</Text>
            <Text style={styles.summaryValue}>
              {formatHours(totalLateHours)}
              {totalLateUsed > 0 && <Text style={{fontSize: 14, opacity: 0.8}}> (ใช้แล้ว: {formatHours(totalLateUsed)})</Text>}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>กลับก่อนเวลา:</Text>
            <Text style={styles.summaryValue}>
              {formatHours(totalEarlyLeaveHours)}
              {totalEarlyLeaveUsed > 0 && <Text style={{fontSize: 14, opacity: 0.8}}> (ชดเชยแล้ว: {formatHours(totalEarlyLeaveUsed)})</Text>}
            </Text>
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
                  <Text style={styles.statValue}>{formatHours(report.totalLateHours || 0)}</Text>
                  <Text style={styles.statLabel}>ชั่วโมงมาสาย</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{report.entries.length}</Text>
                  <Text style={styles.statLabel}>วันทำงาน</Text>
                </View>
              </View>

              {/* Entry Details */}
              {report.entries.map((entry, entryIndex) => (
                <View key={entryIndex} style={styles.entryItem}>
                  <TouchableOpacity 
                    style={styles.entryContent}
                    onPress={() => handleEntryPress(entry)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.entryLeft}>
                      <Text style={styles.entryDate}>{formatDateThai(entry.date)}</Text>
                      <Text style={styles.entryTime}>
                        {entry.clockIn || '-'} - {entry.clockOut || '-'}
                      </Text>
                    </View>
                    <View style={styles.entryRight}>
                      <Text style={styles.entryHours}>
                        รวม: {formatHours((entry.regularHours || 0) + (entry.overtimeHours || 0))}
                      </Text>
                      <Text style={styles.entryDetails} numberOfLines={1}>
                        <Text style={{color: '#0563e8'}}>ปกติ: {formatHours(entry.regularHours || 0)}</Text>
                        <Text style={{color: entry.overtimeUsed ? '#666666' : '#28a745'}}> OT: {formatHours(entry.overtimeHours || 0)}{entry.overtimeUsed ? ' ✓' : ''}</Text>
                        <Text style={{color: entry.lateArrivalUsed ? '#666666' : '#dc3545'}}> สาย: {formatHours(entry.lateArrivalHours || 0)}{entry.lateArrivalUsed ? ' ✓' : ''}</Text>
                        {(entry.earlyLeaveHours || 0) > 0 && <Text style={{color: entry.earlyLeaveUsed ? '#666666' : '#ff9800'}}> กลับก่อน: {formatHours(entry.earlyLeaveHours || 0)}{entry.earlyLeaveUsed ? ' ✓' : ''}</Text>}
                      </Text>
                    </View>
                    <View style={styles.entryArrow}>
                      <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                  
                  {/* Toggle Buttons for OT/Late Used */}
                  <View style={styles.toggleRow}>
                    {(entry.overtimeHours || 0) > 0 && (
                      <TouchableOpacity 
                        style={[styles.toggleButton, entry.overtimeUsed && styles.toggleButtonActive]}
                        onPress={() => handleToggleOvertimeUsed(entry)}
                      >
                        <Icon name={entry.overtimeUsed ? "checkbox" : "square-outline"} size={18} color={entry.overtimeUsed ? '#28a745' : colors.textSecondary} />
                        <Text style={[styles.toggleText, entry.overtimeUsed && styles.toggleTextActive]}>ใช้ OT แล้ว</Text>
                      </TouchableOpacity>
                    )}
                    {(entry.lateArrivalHours || 0) > 0 && (
                      <TouchableOpacity 
                        style={[styles.toggleButton, entry.lateArrivalUsed && styles.toggleButtonActive]}
                        onPress={() => handleToggleLateUsed(entry)}
                      >
                        <Icon name={entry.lateArrivalUsed ? "checkbox" : "square-outline"} size={18} color={entry.lateArrivalUsed ? '#dc3545' : colors.textSecondary} />
                        <Text style={[styles.toggleText, entry.lateArrivalUsed && styles.toggleTextActive]}>ใช้สายแล้ว</Text>
                      </TouchableOpacity>
                    )}
                    {(entry.earlyLeaveHours || 0) > 0 && (
                      <TouchableOpacity 
                        style={[styles.toggleButton, entry.earlyLeaveUsed && styles.toggleButtonActive]}
                        onPress={() => handleToggleEarlyLeaveUsed(entry)}
                      >
                        <Icon name={entry.earlyLeaveUsed ? "checkbox" : "square-outline"} size={18} color={entry.earlyLeaveUsed ? '#ff9800' : colors.textSecondary} />
                        <Text style={[styles.toggleText, entry.earlyLeaveUsed && styles.toggleTextActive]}>ชดเชยแล้ว</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Entry Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดการทำงาน</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedEntry && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>วันที่:</Text>
                  <Text style={styles.modalValue}>{formatDateThai(selectedEntry.date)}</Text>
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
                  <Text style={styles.modalValue}>{formatHours(selectedEntry.regularHours || 0)}</Text>
                </View>
                
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>ชั่วโมง OT:</Text>
                  <Text style={styles.modalValue}>{formatHours(selectedEntry.overtimeHours || 0)}</Text>
                </View>
                
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>ชั่วโมงมาสาย:</Text>
                  <Text style={styles.modalValue}>{formatHours(selectedEntry.lateArrivalHours || 0)}</Text>
                </View>
                
                {(selectedEntry.earlyLeaveHours || 0) > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>กลับก่อนเวลา:</Text>
                    <Text style={styles.modalValue}>{formatHours(selectedEntry.earlyLeaveHours || 0)}</Text>
                  </View>
                )}
                
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>เหตุผล:</Text>
                  <Text style={styles.modalValue}>
                    {selectedEntry.reason || 'ไม่มีเหตุผลเพิ่มเติม'}
                  </Text>
                </View>
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
