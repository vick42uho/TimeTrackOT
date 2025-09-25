
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { DateInput } from '../components/DateInput';
import { TimeInput } from '../components/TimeInput';
import { useDatabase } from '../hooks/useDatabase';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import Icon from '../components/Icon';

const TimeEntryContent: React.FC = () => {
  const { colors } = useThemeContext();
  const router = useRouter();
  const { isReady, getWorkSchedule, getTimeEntry, saveTimeEntry, deleteTimeEntry, updateTimeEntry } = useDatabase();
  const { calculateWorkHours, formatDate, formatDateThai, getThaiDayName } = useTimeCalculation();

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<any>(null);

  const loadTimeEntry = async () => {
    if (!isReady) return;
    
    const entry = await getTimeEntry(selectedDate);
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

  useEffect(() => {
    if (isReady) {
      loadTimeEntry();
    }
  }, [selectedDate, isReady]);

  const handleSave = async () => {
    if (!clockIn && !clockOut) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกเวลาเข้างานหรือเวลาเลิกงาน');
      return;
    }

    if (!isReady) {
      Alert.alert('ข้อผิดพลาด', 'ระบบฐานข้อมูลยังไม่พร้อม');
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

      if (clockIn && clockOut && workSchedule) {
        const calculated = calculateWorkHours(clockIn, clockOut, workSchedule);
        regularHours = calculated.regularHours;
        overtimeHours = calculated.overtimeHours;
      }

      const success = await saveTimeEntry({
        date: selectedDate,
        clockIn: clockIn || undefined,
        clockOut: clockOut || undefined,
        reason: reason || undefined,
        regularHours,
        overtimeHours,
      });

      if (success) {
        Alert.alert('สำเร็จ', 'บันทึกเวลาทำงานเรียบร้อยแล้ว');
        loadTimeEntry();
      } else {
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentEntry) {
      Alert.alert('ข้อผิดพลาด', 'ไม่มีข้อมูลให้ลบ');
      return;
    }

    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบข้อมูลเวลาทำงานวันนี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const success = await deleteTimeEntry(selectedDate);
              if (success) {
                Alert.alert('สำเร็จ', 'ลบข้อมูลเรียบร้อยแล้ว');
                loadTimeEntry();
              } else {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้');
              }
            } catch (error) {
              console.error('Error deleting time entry:', error);
              Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบข้อมูล');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdate = async () => {
    if (!currentEntry) {
      Alert.alert('ข้อผิดพลาด', 'ไม่มีข้อมูลให้แก้ไข');
      return;
    }

    if (!clockIn && !clockOut) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกเวลาเข้างานหรือเวลาเลิกงาน');
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

      if (clockIn && clockOut && workSchedule) {
        const calculated = calculateWorkHours(clockIn, clockOut, workSchedule);
        regularHours = calculated.regularHours;
        overtimeHours = calculated.overtimeHours;
      }

      const success = await updateTimeEntry(selectedDate, {
        clockIn: clockIn || undefined,
        clockOut: clockOut || undefined,
        reason: reason || undefined,
        regularHours,
        overtimeHours,
      });

      if (success) {
        Alert.alert('สำเร็จ', 'แก้ไขข้อมูลเรียบร้อยแล้ว');
        loadTimeEntry();
      } else {
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถแก้ไขข้อมูลได้');
      }
    } catch (error) {
      console.error('Error updating time entry:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
      setIsLoading(false);
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
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      boxShadow: `0px 2px 8px ${colors.shadow}`,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      fontFamily: 'Sarabun_600SemiBold',
    },
    dateInfo: {
      backgroundColor: colors.backgroundAlt,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    dateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      fontFamily: 'Sarabun_600SemiBold',
    },
    dayText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      fontFamily: 'Sarabun_400Regular',
    },
    inputGroup: {
      marginVertical: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Sarabun_600SemiBold',
    },
    textInput: {
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Sarabun_400Regular',
      minHeight: 100,
      textAlignVertical: 'top',
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    buttonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginVertical: 20,
    },
    buttonSecondary: {
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSecondaryText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDangerText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    summaryCard: {
      backgroundColor: colors.backgroundAlt,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    summaryLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
    summaryValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
  });

  const calculatePreview = () => {
    if (!clockIn || !clockOut) return null;

    try {
      const clockInHours = parseFloat(clockIn.split(':')[0]) + parseFloat(clockIn.split(':')[1]) / 60;
      const clockOutHours = parseFloat(clockOut.split(':')[0]) + parseFloat(clockOut.split(':')[1]) / 60;
      let totalHours = clockOutHours - clockInHours;
      if (totalHours < 0) totalHours += 24;

      return totalHours;
    } catch (error) {
      console.warn('Error calculating preview:', error);
      return null;
    }
  };

  const previewHours = calculatePreview();

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
          <Text style={styles.title}>บันทึกเวลาทำงาน</Text>
        </View>

        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>{formatDateThai(selectedDate)}</Text>
          <Text style={styles.dayText}>{getThaiDayName(selectedDate)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>เลือกวันที่</Text>
          <DateInput
            label="วันที่"
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>เวลาทำงาน</Text>
          
          <TimeInput
            label="เวลาเข้างาน"
            value={clockIn}
            onChange={setClockIn}
            placeholder="เลือกเวลาเข้างาน"
          />

          <TimeInput
            label="เวลาเลิกงาน"
            value={clockOut}
            onChange={setClockOut}
            placeholder="เลือกเวลาเลิกงาน"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>เหตุผล (ถ้ามี)</Text>
            <TextInput
              style={styles.textInput}
              value={reason}
              onChangeText={setReason}
              placeholder="ระบุเหตุผลในการแก้ไขเวลา (ถ้ามี)"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>

          {previewHours && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>รวมชั่วโมงทำงาน:</Text>
                <Text style={styles.summaryValue}>{previewHours.toFixed(2)} ชั่วโมง</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกเวลาทำงาน'}
          </Text>
        </TouchableOpacity>

        {currentEntry && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.buttonSecondary, isLoading && styles.buttonDisabled]}
              onPress={handleUpdate}
              disabled={isLoading}
            >
              <Text style={styles.buttonSecondaryText}>
                {isLoading ? 'กำลังแก้ไข...' : 'แก้ไขข้อมูล'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonDanger, isLoading && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={isLoading}
            >
              <Text style={styles.buttonDangerText}>
                {isLoading ? 'กำลังลบ...' : 'ลบข้อมูล'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

export default function TimeEntryScreen() {
  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <TimeEntryContent />
      </SafeAreaView>
    </ThemeProvider>
  );
}
