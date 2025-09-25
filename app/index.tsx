
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { useStorage } from '../hooks/useStorage';
import { useTimeCalculation } from '../hooks/useTimeCalculation';
import Icon from '../components/Icon';
import * as Font from 'expo-font';
import {
  Sarabun_400Regular,
  Sarabun_600SemiBold,
  Sarabun_700Bold,
} from '@expo-google-fonts/sarabun';

const HomeContent: React.FC = () => {
  const { colors } = useThemeContext();
  const router = useRouter();
  const { getWorkSchedule, getTimeEntry } = useStorage();
  const { formatDateThai, getThaiDayName, formatHours } = useTimeCalculation();
  
  const [currentSchedule, setCurrentSchedule] = useState<any>(null);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [currentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Then load today's data
      await loadTodayData();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodayData = async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const dateString = today.toISOString().split('T')[0];

    const schedule = await getWorkSchedule(month, year);
    const entry = await getTimeEntry(dateString);

    setCurrentSchedule(schedule);
    setTodayEntry(entry);
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
      paddingHorizontal: 20,
    },
    header: {
      paddingVertical: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Sarabun_700Bold',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
      fontFamily: 'Sarabun_400Regular',
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
      marginBottom: 12,
      fontFamily: 'Sarabun_600SemiBold',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    label: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
    },
    value: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    valueHighlight: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
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
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    actionIcon: {
      marginBottom: 8,
    },
    actionText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Sarabun_400Regular',
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
    statusBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    statusBadgeText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    warningBadge: {
      backgroundColor: colors.warning,
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
          <Text style={styles.title}>ระบบบันทึกเวลาทำงาน</Text>
          <Text style={styles.subtitle}>
            {getThaiDayName(currentDate.toISOString().split('T')[0])} ที่ {formatDateThai(currentDate.toISOString().split('T')[0])}
          </Text>
        </View>

        {/* Current Schedule Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>เวลาทำงานมาตรฐาน ({currentMonth} {currentYear})</Text>
          {currentSchedule ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>เวลาเข้างาน:</Text>
                <Text style={styles.value}>{currentSchedule.startTime} น.</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>เวลาเลิกงาน:</Text>
                <Text style={styles.value}>{currentSchedule.endTime} น.</Text>
              </View>
              <View style={[styles.statusBadge]}>
                <Text style={styles.statusBadgeText}>ตั้งค่าแล้ว</Text>
              </View>
            </>
          ) : (
            <Text style={styles.label}>ยังไม่ได้ตั้งค่าเวลาทำงานสำหรับเดือนนี้</Text>
          )}
        </View>

        {/* Today's Entry Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>บันทึกเวลาวันนี้</Text>
          {todayEntry ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>เวลาเข้างาน:</Text>
                <Text style={styles.valueHighlight}>{todayEntry.clockIn || '-'} น.</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>เวลาเลิกงาน:</Text>
                <Text style={styles.value}>{todayEntry.clockOut || 'ยังไม่ได้เลิกงาน'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>ชั่วโมงปกติ:</Text>
                <Text style={styles.value}>{formatHours(todayEntry.regularHours)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>ชั่วโมง OT:</Text>
                <Text style={styles.value}>{formatHours(todayEntry.overtimeHours)}</Text>
              </View>
              {todayEntry.reason && (
                <View style={styles.row}>
                  <Text style={styles.label}>เหตุผล:</Text>
                  <Text style={styles.value}>{todayEntry.reason}</Text>
                </View>
              )}
              <View style={[styles.statusBadge, !todayEntry.clockOut && styles.warningBadge]}>
                <Text style={styles.statusBadgeText}>
                  {todayEntry.clockOut ? 'เสร็จสิ้น' : 'กำลังทำงาน'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.label}>ยังไม่ได้บันทึกเวลาวันนี้</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/time-entry')}
          >
            <Icon name="time" size={24} color={colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>บันทึกเวลา</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/reports')}
          >
            <Icon name="bar-chart" size={24} color={colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>รายงาน</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/settings')}
          >
            <Icon name="settings" size={24} color={colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>ตั้งค่า</Text>
          </TouchableOpacity>
        </View>

        {!currentSchedule && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.buttonText}>ตั้งค่าเวลาทำงาน</Text>
          </TouchableOpacity>
        )}
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
