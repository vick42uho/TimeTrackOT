
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { TimeInput } from '../components/TimeInput';
import { useDatabase } from '../hooks/useDatabase';
import Icon from '../components/Icon';

const SettingsContent: React.FC = () => {
  const { colors, themeMode, toggleTheme } = useThemeContext();
  const router = useRouter();
  const { getWorkSchedule, saveWorkSchedule, isReady } = useDatabase();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWorkSchedule();
  }, [selectedMonth, selectedYear]);

  // Refresh data when screen comes into focus (only if data is stale)
  useFocusEffect(
    React.useCallback(() => {
      if (isReady && (startTime === '08:00' && endTime === '17:00')) {
        loadWorkSchedule();
      }
    }, [isReady, selectedMonth, selectedYear, startTime, endTime])
  );

  const loadWorkSchedule = async () => {
    if (!isReady) return;
    
    const schedule = await getWorkSchedule(selectedMonth, selectedYear);
    if (schedule) {
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
    } else {
      setStartTime('08:00');
      setEndTime('17:00');
    }
  };

  const handleSaveSchedule = async () => {
    if (!isReady) {
      Alert.alert('ข้อผิดพลาด', 'ระบบยังไม่พร้อม กรุณารอสักครู่');
      return;
    }

    if (!startTime || !endTime) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกเวลาเข้างานและเลิกงาน');
      return;
    }

    setIsLoading(true);

    try {
      await saveWorkSchedule({
        month: selectedMonth,
        year: selectedYear,
        startTime,
        endTime,
      });

      Alert.alert('สำเร็จ', 'บันทึกเวลาทำงานมาตรฐานเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving work schedule:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

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
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.backgroundAlt,
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
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
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
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Sarabun_400Regular',
    },
    themeButton: {
      backgroundColor: colors.backgroundAlt,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeButtonText: {
      fontSize: 14,
      color: colors.text,
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
          <Text style={styles.title}>ตั้งค่า</Text>
        </View>

        {/* Work Schedule Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ตั้งค่าเวลาทำงานมาตรฐาน</Text>
          
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

          <TimeInput
            label="เวลาเข้างาน"
            value={startTime}
            onChange={setStartTime}
            placeholder="เลือกเวลาเข้างาน"
          />

          <TimeInput
            label="เวลาเลิกงาน"
            value={endTime}
            onChange={setEndTime}
            placeholder="เลือกเวลาเลิกงาน"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSaveSchedule}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกเวลาทำงาน'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>การตั้งค่าแอป</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>ธีม</Text>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={toggleTheme}
            >
              <Text style={styles.themeButtonText}>
                {themeMode === 'light' ? 'โหมดสว่าง' : 'โหมดมืด'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>เกี่ยวกับแอป</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>เวอร์ชัน</Text>
            <Text style={styles.settingLabel}>1.0.0</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>ระบบบันทึกเวลาทำงาน</Text>
            <Text style={styles.settingLabel}>OT Management</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>ผู้พัฒนา</Text>
            <Text style={styles.settingLabel}>John Wick</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

export default function SettingsScreen() {
  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsContent />
      </SafeAreaView>
    </ThemeProvider>
  );
}
