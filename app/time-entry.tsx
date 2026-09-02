
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAlertDialog, AlertDialog } from '@/components/ui/alert-dialog';
import {
  Save,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
} from 'lucide-react-native';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { TimeInput } from '../components/TimeInput';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';

const TimeEntryContent: React.FC = () => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  const router = useRouter();
  const { isReady, getWorkSchedule, getTimeEntry, saveTimeEntry, deleteTimeEntry, updateTimeEntry } = useDatabase();
  const {
    calculateWorkHours,
    calculateLateArrival,
    calculateEarlyLeave,
    formatDate,
    formatDateThai,
    getThaiDayName,
  } = useTimeCalculation();
  const { success, error, warning } = useToast();
  const deleteDialog = useAlertDialog();

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [workSchedule, setWorkSchedule] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getDateFromString = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString);
  };

  const isToday = (dateStr: string) => dateStr === formatDate(new Date());

  const handlePrevDay = () => {
    const d = getDateFromString(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNextDay = () => {
    const d = getDateFromString(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDate(d));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleGoToday = () => {
    setSelectedDate(formatDate(new Date()));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  };

  const loadTimeEntry = async () => {
    if (!isReady) return;
    
    const date = new Date(selectedDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const [entry, schedule] = await Promise.all([
      getTimeEntry(selectedDate),
      getWorkSchedule(month, year),
    ]);

    setWorkSchedule(schedule);

    if (entry) {
      setCurrentEntry(entry);
      setClockIn(entry.clockIn || '');
      setClockOut(entry.clockOut || '');
      setReason(entry.reason || '');
    } else {
      setCurrentEntry(null);
      setClockIn('');
      setClockOut('');
      setReason('');
    }
  };

  const getCurrentTimeStr = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSetClockInNow = () => {
    setClockIn(getCurrentTimeStr());
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSetClockInSchedule = () => {
    if (workSchedule?.startTime) {
      setClockIn(workSchedule.startTime);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleSetClockOutNow = () => {
    setClockOut(getCurrentTimeStr());
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSetClockOutSchedule = () => {
    if (workSchedule?.endTime) {
      setClockOut(workSchedule.endTime);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  useEffect(() => {
    if (isReady) {
      loadTimeEntry();
    }
  }, [selectedDate, isReady]);

  // Refresh data when screen comes into focus (only if data is stale)
  useFocusEffect(
    React.useCallback(() => {
      if (isReady && !currentEntry) {
        loadTimeEntry();
      }
    }, [isReady, selectedDate, currentEntry])
  );

  const handleSave = async () => {
    if (!clockIn && !clockOut) {
      warning('กรุณาระบุเวลา', 'กรุณากรอกเวลาเข้างานหรือเวลาเลิกงาน');
      return;
    }

    if (!isReady) {
      warning('ระบบยังไม่พร้อม', 'ระบบฐานข้อมูลกำลังเริ่มต้น กรุณารอสักครู่');
      return;
    }

    setIsLoading(true);

    try {
      const date = new Date(selectedDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const workSchedule = await getWorkSchedule(month, year);
      
      let regularHours = 0;
      let overtimeHours = 0;
      let lateArrivalHours = 0;
      let earlyLeaveHours = 0;

      if (clockIn && clockOut && workSchedule) {
        const calculated = calculateWorkHours(clockIn, clockOut, workSchedule);
        regularHours = calculated.regularHours;
        overtimeHours = calculated.overtimeHours;
        lateArrivalHours = calculateLateArrival(clockIn, workSchedule);
        earlyLeaveHours = calculateEarlyLeave(clockOut, workSchedule);
      }

      await saveTimeEntry({
        date: selectedDate,
        clockIn: clockIn || undefined,
        clockOut: clockOut || undefined,
        reason: reason || undefined,
        regularHours,
        overtimeHours,
        lateArrivalHours,
        earlyLeaveHours,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      success('บันทึกสำเร็จ', 'บันทึกเวลาทำงานเรียบร้อยแล้ว');
      loadTimeEntry();
    } catch (err) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Error saving time entry:', err);
      error('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!currentEntry) {
      warning('ไม่มีข้อมูล', 'ไม่มีข้อมูลเวลาทำงานให้ลบ');
      return;
    }
    deleteDialog.open();
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const ok = await deleteTimeEntry(selectedDate);
      if (ok) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        success('ลบสำเร็จ', 'ลบข้อมูลเวลาทำงานเรียบร้อยแล้ว');
        deleteDialog.close();
        loadTimeEntry();
      } else {
        error('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (err) {
      console.error('Error deleting time entry:', err);
      error('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentEntry) {
      warning('ไม่มีข้อมูล', 'ไม่มีข้อมูลให้แก้ไข');
      return;
    }

    if (!clockIn && !clockOut) {
      warning('กรุณาระบุเวลา', 'กรุณากรอกเวลาเข้างานหรือเวลาเลิกงาน');
      return;
    }

    setIsLoading(true);

    try {
      const date = new Date(selectedDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const workSchedule = await getWorkSchedule(month, year);
      
      let regularHours = 0;
      let overtimeHours = 0;
      let lateArrivalHours = 0;
      let earlyLeaveHours = 0;

      if (clockIn && clockOut && workSchedule) {
        const calculated = calculateWorkHours(clockIn, clockOut, workSchedule);
        regularHours = calculated.regularHours;
        overtimeHours = calculated.overtimeHours;
        lateArrivalHours = calculateLateArrival(clockIn, workSchedule);
        earlyLeaveHours = calculateEarlyLeave(clockOut, workSchedule);
      }

      await updateTimeEntry(selectedDate, {
        clockIn: clockIn || undefined,
        clockOut: clockOut || undefined,
        reason: reason || undefined,
        regularHours,
        overtimeHours,
        lateArrivalHours,
        earlyLeaveHours,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      success('แก้ไขสำเร็จ', 'แก้ไขเวลาทำงานเรียบร้อยแล้ว');
      loadTimeEntry();
    } catch (err) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Error updating time entry:', err);
      error('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDetailedPreview = () => {
    if (!clockIn || !clockOut) return null;

    try {
      const parseHour = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h + m / 60;
      };

      const clockInHours = parseHour(clockIn);
      let clockOutHours = parseHour(clockOut);
      let totalHours = clockOutHours - clockInHours;
      if (totalHours < 0) totalHours += 24;

      let regularHours = totalHours;
      let overtimeHours = 0;
      let morningOT = 0;
      let eveningOT = 0;
      let lateArrivalHours = 0;
      let earlyLeaveHours = 0;

      if (workSchedule) {
        const scheduledStart = parseHour(workSchedule.startTime);
        let scheduledEnd = parseHour(workSchedule.endTime);
        if (scheduledEnd < scheduledStart) scheduledEnd += 24;

        morningOT = Math.max(0, Math.min(clockOutHours, scheduledStart) - clockInHours);
        const effectiveStart = Math.max(clockInHours, scheduledStart);
        const effectiveEnd = Math.min(clockOutHours, scheduledEnd);
        regularHours = Math.max(0, effectiveEnd - effectiveStart);
        eveningOT = Math.max(0, clockOutHours - Math.max(clockInHours, scheduledEnd));
        overtimeHours = morningOT + eveningOT;

        lateArrivalHours = calculateLateArrival(clockIn, workSchedule);
        earlyLeaveHours = calculateEarlyLeave(clockOut, workSchedule);
      }

      return {
        totalHours: Number(totalHours.toFixed(2)),
        regularHours: Number(regularHours.toFixed(2)),
        overtimeHours: Number(overtimeHours.toFixed(2)),
        morningOT: Number(morningOT.toFixed(2)),
        eveningOT: Number(eveningOT.toFixed(2)),
        lateArrivalHours: Number(lateArrivalHours.toFixed(2)),
        earlyLeaveHours: Number(earlyLeaveHours.toFixed(2)),
      };
    } catch (err) {
      console.warn('Error calculating preview:', err);
      return null;
    }
  };

  const detailedPreview = calculateDetailedPreview();

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
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 2,
    },
    backButton: {
      marginRight: 10,
      padding: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    todayChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
    },
    dateNavigatorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 18,
      borderWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 6,
      marginBottom: 8,
    },
    dateNavArrow: {
      padding: 8,
      borderRadius: 12,
    },
    dateCenterBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 2,
    },
    dateNavTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    bnaCard: {
      borderRadius: 18,
      padding: 14,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    schedulePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    columnLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
    },
    quickPresetBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    quickPresetText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: 'Sarabun_600SemiBold',
    },
    metricBox: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    metricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
      marginBottom: 2,
    },
    metricVal: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
    },
    metricSub: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>บันทึกเวลาทำงาน</Text>
          </View>
          {!isToday(selectedDate) && (
            <TouchableOpacity
              onPress={handleGoToday}
              style={[
                styles.todayChip,
                {
                  borderColor: colors.primary,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                },
              ]}
            >
              <RotateCcw size={12} color={colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                วันนี้
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Compact Interactive Date Navigator Bar (Replaces 2 duplicate cards) */}
        <View
          style={[
            styles.dateNavigatorCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={styles.dateNavArrow}
            onPress={handlePrevDay}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateCenterBtn}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CalendarIcon size={16} color={colors.primary} />
              <Text style={styles.dateNavTitle}>
                {getThaiDayName(selectedDate)}, {formatDateThai(selectedDate)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              {isToday(selectedDate) && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' },
                  ]}
                >
                  <Text style={[styles.statusBadgeText, { color: colors.primary }]}>วันนี้</Text>
                </View>
              )}
              {currentEntry ? (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' },
                  ]}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#16a34a',
                      marginRight: 4,
                    }}
                  />
                  <Text style={[styles.statusBadgeText, { color: '#16a34a' }]}>
                    บันทึกแล้ว ({currentEntry.clockIn || '-'} - {currentEntry.clockOut || '-'})
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9' },
                  ]}
                >
                  <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                    ยังไม่ได้บันทึก
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateNavArrow}
            onPress={handleNextDay}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronRight size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={getDateFromString(selectedDate)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Working Hours Card (High Density 2-Column Side-by-Side) */}
        <Card style={styles.bnaCard}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>เวลาทำงาน</Text>
            </View>
            {workSchedule && (
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
                  กะงาน {workSchedule.startTime} - {workSchedule.endTime} น.
                </Text>
              </View>
            )}
          </View>

          {/* 2-Column Time Pickers */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Left Column: Clock In */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a' }}
                />
                <Text style={styles.columnLabel}>เวลาเข้างาน</Text>
              </View>
              <TimeInput
                label=""
                value={clockIn}
                onChange={setClockIn}
                placeholder="เลือกเวลา"
              />
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={handleSetClockInNow}
                  style={[
                    styles.quickPresetBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundAlt,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    },
                  ]}
                >
                  <Clock size={10} color={colors.primary} />
                  <Text style={styles.quickPresetText}>ตอนนี้</Text>
                </TouchableOpacity>
                {workSchedule?.startTime && (
                  <TouchableOpacity
                    onPress={handleSetClockInSchedule}
                    style={[
                      styles.quickPresetBtn,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundAlt,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                      },
                    ]}
                  >
                    <LogIn size={10} color={colors.text} />
                    <Text style={[styles.quickPresetText, { color: colors.text }]}>
                      {workSchedule.startTime}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Right Column: Clock Out */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' }}
                />
                <Text style={styles.columnLabel}>เวลาเลิกงาน</Text>
              </View>
              <TimeInput
                label=""
                value={clockOut}
                onChange={setClockOut}
                placeholder="เลือกเวลา"
              />
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={handleSetClockOutNow}
                  style={[
                    styles.quickPresetBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundAlt,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    },
                  ]}
                >
                  <Clock size={10} color={colors.primary} />
                  <Text style={styles.quickPresetText}>ตอนนี้</Text>
                </TouchableOpacity>
                {workSchedule?.endTime && (
                  <TouchableOpacity
                    onPress={handleSetClockOutSchedule}
                    style={[
                      styles.quickPresetBtn,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundAlt,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                      },
                    ]}
                  >
                    <LogOut size={10} color={colors.text} />
                    <Text style={[styles.quickPresetText, { color: colors.text }]}>
                      {workSchedule.endTime}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Reason Input (Compact) */}
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.columnLabel, { marginBottom: 4 }]}>
              เหตุผลในการแก้ไข / บันทึกย่อ (ถ้ามี)
            </Text>
            <Input
              placeholder="ระบุเหตุผลในการแก้ไขเวลา (ถ้ามี)"
              value={reason}
              onChangeText={setReason}
              icon={FileText}
            />
          </View>
        </Card>

        {/* Live Calculation Preview Card */}
        {detailedPreview && (
          <Card
            style={StyleSheet.flatten([
              styles.bnaCard,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                borderColor: isDark ? '#1e3a8a' : '#bfdbfe',
                marginTop: 2,
              },
            ])}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={14} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.primary,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  สรุปการคำนวณสด
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                รวมเวลาจริง:{' '}
                <Text style={{ fontWeight: '700', color: colors.text }}>
                  {detailedPreview.totalHours.toFixed(2)} ชม.
                </Text>
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* 1. Regular Hours */}
              <View
                style={[
                  styles.metricBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={styles.metricLabel}>ชั่วโมงปกติ</Text>
                <Text style={[styles.metricVal, { color: '#3b82f6' }]}>
                  {detailedPreview.regularHours.toFixed(2)}
                </Text>
                <Text style={styles.metricSub}>ชม.</Text>
              </View>

              {/* 2. Overtime Hours */}
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: detailedPreview.overtimeHours > 0 ? '#16a34a' : colors.border,
                  },
                ]}
              >
                <Text style={styles.metricLabel}>OT รวม</Text>
                <Text
                  style={[
                    styles.metricVal,
                    {
                      color: detailedPreview.overtimeHours > 0 ? '#16a34a' : colors.textSecondary,
                    },
                  ]}
                >
                  {detailedPreview.overtimeHours > 0
                    ? `+${detailedPreview.overtimeHours.toFixed(2)}`
                    : '0.00'}
                </Text>
                <Text style={styles.metricSub}>
                  {detailedPreview.overtimeHours > 0
                    ? `เช้า ${detailedPreview.morningOT || 0} / เย็น ${detailedPreview.eveningOT || 0}`
                    : 'ชม.'}
                </Text>
              </View>

              {/* 3. Late Arrival */}
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: detailedPreview.lateArrivalHours > 0 ? '#f59e0b' : colors.border,
                  },
                ]}
              >
                <Text style={styles.metricLabel}>มาสาย</Text>
                <Text
                  style={[
                    styles.metricVal,
                    {
                      color: detailedPreview.lateArrivalHours > 0 ? '#dc2626' : colors.textSecondary,
                    },
                  ]}
                >
                  {detailedPreview.lateArrivalHours.toFixed(2)}
                </Text>
                <Text style={styles.metricSub}>ชม.</Text>
              </View>

              {/* 4. Early Leave */}
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: detailedPreview.earlyLeaveHours > 0 ? '#f59e0b' : colors.border,
                  },
                ]}
              >
                <Text style={styles.metricLabel}>กลับก่อน</Text>
                <Text
                  style={[
                    styles.metricVal,
                    {
                      color: detailedPreview.earlyLeaveHours > 0 ? '#dc2626' : colors.textSecondary,
                    },
                  ]}
                >
                  {detailedPreview.earlyLeaveHours.toFixed(2)}
                </Text>
                <Text style={styles.metricSub}>ชม.</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Primary Action Buttons (Thumb Zone) */}
        {currentEntry ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 28 }}>
            <Button
              variant="default"
              icon={Save}
              disabled={isLoading}
              loading={isLoading}
              style={{ flex: 1 }}
              onPress={handleUpdate}
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </Button>

            <Button
              variant="destructive"
              icon={Trash2}
              disabled={isLoading}
              style={{ flex: 0.45 }}
              onPress={handleDelete}
            >
              {isLoading ? 'กำลังลบ...' : 'ลบข้อมูล'}
            </Button>
          </View>
        ) : (
          <Button
            variant="default"
            size="lg"
            icon={Save}
            disabled={isLoading}
            loading={isLoading}
            style={{ marginTop: 10, marginBottom: 28 }}
            onPress={handleSave}
          >
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกเวลาทำงาน'}
          </Button>
        )}
      </ScrollView>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        isVisible={deleteDialog.isVisible}
        onClose={deleteDialog.close}
        title="ยืนยันการลบข้อมูล"
        description={`คุณต้องการลบข้อมูลเวลาทำงานของวันที่ ${formatDateThai(selectedDate)} ใช่หรือไม่?`}
        confirmText="ลบข้อมูล"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={confirmDelete}
      />

      <BottomNavigation />
    </View>
  );
};

function TimeEntryScreenContent() {
  const { colors } = useThemeContext();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TimeEntryContent />
    </SafeAreaView>
  );
}

export default function TimeEntryScreen() {
  return (
    <ThemeProvider>
      <TimeEntryScreenContent />
    </ThemeProvider>
  );
}
