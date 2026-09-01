import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Linking, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { getGlobalHapticsEnabled, setGlobalHapticsEnabled, triggerHaptic } from '@/hooks/useHaptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';
import {
  Save,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  FileCheck,
  Calendar,
  Clock,
  Shield,
  HardDrive,
  Mail,
  CheckCircle,
  Code2,
  Lock,
} from 'lucide-react-native';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';
import { BottomNavigation } from '../components/BottomNavigation';
import { TimeInput } from '../components/TimeInput';
import { useDatabase } from '../hooks/useDatabase';
import { BackupPayload } from '../types';

const SettingsContent: React.FC = () => {
  const { colors, themeMode, toggleTheme } = useThemeContext();
  const isDark = themeMode === 'dark';
  const router = useRouter();
  const {
    getWorkSchedule,
    saveWorkSchedule,
    saveWorkScheduleForYear,
    exportBackupData,
    importBackupData,
    clearAllDatabaseData,
    isReady,
  } = useDatabase();
  const { success, error, warning } = useToast();

  const [scheduleScope, setScheduleScope] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isLoading, setIsLoading] = useState(false);
  const [yearlyConfirmVisible, setYearlyConfirmVisible] = useState(false);

  // Backup & Restore State
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupPayload | null>(null);
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [hapticsEnabled, setHapticsEnabledState] = useState(getGlobalHapticsEnabled());

  useEffect(() => {
    setHapticsEnabledState(getGlobalHapticsEnabled());
  }, []);

  const handleToggleHaptics = async (val: boolean) => {
    setHapticsEnabledState(val);
    await setGlobalHapticsEnabled(val);
    if (val) {
      triggerHaptic('impact-light');
    }
  };

  useEffect(() => {
    loadWorkSchedule();
  }, [selectedMonth, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      if (isReady && startTime === '08:00' && endTime === '17:00') {
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
      warning('ระบบยังไม่พร้อม', 'กรุณารอสักครู่ขณะระบบกำลังเริ่มต้น');
      return;
    }

    if (!startTime || !endTime) {
      warning('กรุณากรอกข้อมูล', 'กรุณากรอกเวลาเข้างานและเลิกงาน');
      return;
    }

    if (scheduleScope === 'yearly') {
      setYearlyConfirmVisible(true);
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

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      success('บันทึกสำเร็จ', `บันทึกเวลาทำงานมาตรฐานเดือน${thaiMonths[selectedMonth - 1]} ${selectedYear + 543} เรียบร้อยแล้ว`);
    } catch (err) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Error saving work schedule:', err);
      error('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSaveYearly = async () => {
    setYearlyConfirmVisible(false);
    if (!startTime || !endTime) {
      warning('กรุณากรอกข้อมูล', 'กรุณากรอกเวลาเข้างานและเลิกงาน');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await saveWorkScheduleForYear(selectedYear, startTime, endTime);
      if (ok) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        success(
          'บันทึกสำเร็จ',
          `กำหนดเวลาทำงาน ${startTime} - ${endTime} น. ให้กับทุกเดือนในปี ${selectedYear + 543} เรียบร้อยแล้ว`
        );
      } else {
        throw new Error('Save yearly failed');
      }
    } catch (err) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Error saving yearly schedule:', err);
      error('ข้อผิดพลาด', 'ไม่สามารถบันทึกเวลาทำงานตลอดทั้งปีได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTheme = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleTheme();
  };

  // ----------------------------------------------------
  // BACKUP & RESTORE HANDLERS
  // ----------------------------------------------------
  const handleExportBackup = async () => {
    if (!isReady) {
      warning('ระบบยังไม่พร้อม', 'กรุณารอสักครู่');
      return;
    }

    setIsExporting(true);
    try {
      const backupPayload = await exportBackupData();
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
      const fileName = `TimeTrackOT_Backup_${timestamp}.json`;

      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupPayload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'สำรองข้อมูล TimeTrack OT',
          UTI: 'public.json',
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        success(
          'ส่งออกข้อมูลสำเร็จ',
          `สร้างไฟล์สำรอง ${fileName} (${backupPayload.metadata.totalRecords.timeEntries} วันทำงาน) เรียบร้อยแล้ว`
        );
      } else {
        warning('ไม่สามารถแชร์ไฟล์ได้', 'อุปกรณ์นี้ไม่รองรับระบบแชร์ไฟล์');
      }
    } catch (err) {
      console.error('Export backup error:', err);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      error('ส่งออกข้อมูลล้มเหลว', 'เกิดข้อผิดพลาดในการสร้างไฟล์สำรอง');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePickRestoreFile = async () => {
    if (!isReady) {
      warning('ระบบยังไม่พร้อม', 'กรุณารอสักครู่');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let parsedPayload: BackupPayload;
      try {
        parsedPayload = JSON.parse(fileContent);
      } catch (parseErr) {
        error('ไฟล์ไม่ถูกต้อง', 'ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบไฟล์สำรอง');
        return;
      }

      if (!parsedPayload?.data || !parsedPayload?.metadata) {
        error('รูปแบบไฟล์ไม่ถูกต้อง', 'ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลของ TimeTrack OT');
        return;
      }

      setPendingRestore(parsedPayload);
      setRestoreDialogVisible(true);
    } catch (err) {
      console.error('Pick restore file error:', err);
      error('เกิดข้อผิดพลาด', 'ไม่สามารถเปิดไฟล์สำรองข้อมูลได้');
    }
  };

  const handleConfirmRestore = async (mode: 'replace' | 'merge') => {
    if (!pendingRestore) return;
    setIsRestoring(true);
    try {
      const result = await importBackupData(pendingRestore, mode);
      setRestoreDialogVisible(false);
      setPendingRestore(null);
      await loadWorkSchedule();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      success(
        'กู้คืนข้อมูลสำเร็จ!',
        `นำเข้าบันทึกเวลา ${result.timeEntriesCount} วัน, วันหยุด ${result.holidaysCount} วัน, วันลา ${result.leavesCount} รายการ${result.activitiesCount ? `, กิจกรรม ${result.activitiesCount} รายการ` : ''} เรียบร้อยแล้ว`
      );
    } catch (err) {
      console.error('Restore error:', err);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      error('กู้คืนข้อมูลล้มเหลว', 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsClearing(true);
    try {
      const ok = await clearAllDatabaseData();
      setClearDialogVisible(false);
      if (ok) {
        await loadWorkSchedule();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        success('ล้างข้อมูลสำเร็จ', 'ล้างข้อมูลบันทึกเวลา วันหยุด และวันลาทั้งหมดแล้ว');
      } else {
        error('ข้อผิดพลาด', 'ไม่สามารถล้างข้อมูลได้');
      }
    } catch (err) {
      console.error('Clear error:', err);
      error('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการล้างข้อมูล');
    } finally {
      setIsClearing(false);
    }
  };

  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

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
    bnaCard: {
      borderRadius: 20,
      padding: 18,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
      fontFamily: 'Sarabun_700Bold',
    },
    scopeSwitchContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundAlt,
      borderRadius: 12,
      padding: 3,
      marginBottom: 14,
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scopeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 9,
      gap: 6,
    },
    scopeTabActive: {
      backgroundColor: isDark ? '#2563eb' : '#1d4ed8',
    },
    scopeTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'Sarabun_600SemiBold',
    },
    scopeTabTextActive: {
      color: '#ffffff',
      fontWeight: '700',
      fontFamily: 'Sarabun_700Bold',
    },
    infoNoticeBox: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
      borderColor: isDark ? '#1e3a8a' : '#bfdbfe',
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
    },
    infoNoticeText: {
      fontSize: 12,
      color: isDark ? '#93c5fd' : '#1d4ed8',
      fontFamily: 'Sarabun_400Regular',
      lineHeight: 18,
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.backgroundAlt,
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
    },
    monthArrowButton: {
      padding: 6,
    },
    monthDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    monthText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    settingLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_500Medium',
    },
    settingValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Sarabun_600SemiBold',
    },
    themeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.backgroundAlt,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Sarabun_600SemiBold',
    },
    dangerCard: {
      borderRadius: 20,
      padding: 18,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: isDark ? '#ef444455' : '#fca5a5',
      backgroundColor: isDark ? '#171422' : '#fff5f5',
    },
    metaBox: {
      backgroundColor: colors.backgroundAlt,
      borderRadius: 12,
      padding: 12,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metaText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Sarabun_400Regular',
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Icon name={ArrowLeft} size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>ตั้งค่า</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Work Schedule Settings */}
        <Card style={styles.bnaCard}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
              เวลาทำงานมาตรฐาน
            </Text>
            <Badge
              variant="outline"
              style={{
                borderColor: isDark ? '#3b82f6' : '#2563eb',
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: isDark ? '#60a5fa' : '#2563eb',
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                พ.ศ. {selectedYear + 543}
              </Text>
            </Badge>
          </View>

          {/* Scope Segmented Switch */}
          <View style={styles.scopeSwitchContainer}>
            <TouchableOpacity
              style={[
                styles.scopeTab,
                scheduleScope === 'monthly' && styles.scopeTabActive,
              ]}
              onPress={() => {
                if (scheduleScope !== 'monthly') {
                  setScheduleScope('monthly');
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Clock
                size={14}
                color={scheduleScope === 'monthly' ? '#ffffff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.scopeTabText,
                  scheduleScope === 'monthly' && styles.scopeTabTextActive,
                ]}
              >
                รายเดือน
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scopeTab,
                scheduleScope === 'yearly' && styles.scopeTabActive,
              ]}
              onPress={() => {
                if (scheduleScope !== 'yearly') {
                  setScheduleScope('yearly');
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Calendar
                size={14}
                color={scheduleScope === 'yearly' ? '#ffffff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.scopeTabText,
                  scheduleScope === 'yearly' && styles.scopeTabTextActive,
                ]}
              >
                ตลอดทั้งปี (12 เดือน)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month / Year Selector */}
          {scheduleScope === 'monthly' ? (
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthArrowButton}
                onPress={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
                activeOpacity={0.7}
              >
                <Icon name={ChevronLeft} size={20} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.monthDisplay}>
                <Text style={styles.monthText}>
                  {thaiMonths[selectedMonth - 1]} {selectedYear + 543}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.monthArrowButton}
                onPress={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
                activeOpacity={0.7}
              >
                <Icon name={ChevronRight} size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthArrowButton}
                onPress={() => setSelectedYear((prev) => prev - 1)}
                activeOpacity={0.7}
              >
                <Icon name={ChevronLeft} size={20} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.monthDisplay}>
                <Text style={styles.monthText}>
                  ประจำปี พ.ศ. {selectedYear + 543}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.monthArrowButton}
                onPress={() => setSelectedYear((prev) => prev + 1)}
                activeOpacity={0.7}
              >
                <Icon name={ChevronRight} size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

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

          {scheduleScope === 'yearly' && (
            <View style={styles.infoNoticeBox}>
              <Text style={styles.infoNoticeText}>
                เวลานี้จะถูกนำไปใช้เป็นค่ามาตรฐานให้กับทั้ง 12 เดือนในปี {selectedYear + 543} (ม.ค. - ธ.ค.) หากต้องการเปลี่ยนบางเดือนเป็นพิเศษ คุณยังสามารถสลับมาปรับเฉพาะเดือนนั้นได้เสมอ
              </Text>
            </View>
          )}

          <View style={{ gap: 8, marginTop: 14 }}>
            <Button
              variant="default"
              size="default"
              icon={scheduleScope === 'yearly' ? Calendar : Save}
              disabled={isLoading}
              loading={isLoading}
              onPress={handleSaveSchedule}
            >
              {isLoading
                ? 'กำลังบันทึก...'
                : scheduleScope === 'yearly'
                ? `บันทึกเวลาทำงานตลอดทั้งปี ${selectedYear + 543}`
                : `บันทึกเฉพาะเดือน${thaiMonths[selectedMonth - 1]}`}
            </Button>

            {scheduleScope === 'monthly' && (
              <Button
                variant="outline"
                size="sm"
                icon={Calendar}
                disabled={isLoading}
                onPress={() => setYearlyConfirmVisible(true)}
              >
                นำเวลานี้ไปใช้กับทุกเดือนในปี {selectedYear + 543} (12 เดือน)
              </Button>
            )}
          </View>
        </Card>

        {/* Backup & Restore Card */}
        <Card style={styles.bnaCard}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <Text style={styles.cardTitle}>สำรองและกู้คืนข้อมูล (Backup & Restore)</Text>
            <Icon name={Database} size={18} color={isDark ? '#60a5fa' : '#2563eb'} />
          </View>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: 14,
              fontFamily: 'Sarabun_400Regular',
              lineHeight: 18,
            }}
          >
            ป้องกันข้อมูลสูญหาย หรือย้ายข้อมูลเวลาทำงานทั้งหมดไปยังโทรศัพท์เครื่องใหม่ผ่านไฟล์สำรอง JSON
          </Text>

          <View style={{ gap: 10 }}>
            {/* Export Button */}
            <Button
              variant="default"
              size="default"
              icon={Download}
              disabled={isExporting}
              loading={isExporting}
              onPress={handleExportBackup}
              style={{ backgroundColor: isDark ? '#2563eb' : '#1d4ed8' }}
            >
              {isExporting ? 'กำลังส่งออกข้อมูล...' : 'ส่งออกข้อมูลสำรอง (Export Backup)'}
            </Button>

            {/* Import Button */}
            <Button
              variant="outline"
              size="default"
              icon={Upload}
              disabled={isRestoring}
              loading={isRestoring}
              onPress={handlePickRestoreFile}
            >
              {isRestoring ? 'กำลังกู้คืนข้อมูล...' : 'กู้คืนข้อมูลจากไฟล์ (Import / Restore)'}
            </Button>
          </View>
        </Card>

        {/* App Settings */}
        <Card style={styles.bnaCard}>
          <Text style={styles.cardTitle}>การตั้งค่าแอปพลิเคชัน</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>ธีมสีหน้าจอ</Text>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={handleToggleTheme}
              activeOpacity={0.7}
            >
              <Icon
                name={themeMode === 'light' ? Sun : Moon}
                size={16}
                color={themeMode === 'light' ? '#f59e0b' : '#60a5fa'}
              />
              <Text style={styles.themeButtonText}>
                {themeMode === 'light' ? 'โหมดสว่าง (Light)' : 'โหมดมืด (Dark)'}
              </Text>
            </TouchableOpacity>
          </View>

          <Separator style={{ marginVertical: 8 }} />

          <View style={styles.settingItem}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>การสั่นตอบสนอง (Haptic)</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Sarabun_400Regular' }}>
                สั่นเบาๆ เมื่อแตะปุ่มหรือสลับแท็บ
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* Danger Zone */}
        <Card style={styles.dangerCard}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={AlertTriangle} size={18} color={isDark ? '#f87171' : '#dc2626'} />
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? '#f87171' : '#dc2626', marginBottom: 0 },
                ]}
              >
                จัดการฐานข้อมูล
              </Text>
            </View>
            <Badge
              variant="destructive"
              style={{
                backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
                borderWidth: 1,
                borderColor: isDark ? '#991b1b' : '#fca5a5',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: isDark ? '#fca5a5' : '#dc2626',
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                Danger Zone
              </Text>
            </Badge>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: 14,
              fontFamily: 'Sarabun_400Regular',
              lineHeight: 18,
            }}
          >
            ล้างข้อมูลทั้งหมดในเครื่อง (เวลาทำงาน วันหยุด วันลา) ข้อมูลจะไม่สามารถกู้คืนได้หากไม่มีไฟล์สำรอง
          </Text>

          <Button
            variant="destructive"
            size="default"
            icon={Trash2}
            disabled={isClearing}
            loading={isClearing}
            onPress={() => setClearDialogVisible(true)}
            style={{
              backgroundColor: isDark ? '#dc2626' : '#ef4444',
            }}
          >
            ล้างข้อมูลทั้งหมดในเครื่อง
          </Button>
        </Card>


        {/* App Info */}
        <Card style={styles.bnaCard}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name={Shield} size={18} color={isDark ? '#60a5fa' : '#2563eb'} />
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>เกี่ยวกับแอปพลิเคชัน</Text>
          </View>

          {/* เวอร์ชัน */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>เวอร์ชัน</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Badge variant="secondary">v1.1.0</Badge>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#dcfce7',
                borderRadius: 99,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : '#bbf7d0',
              }}>
                <Icon name={CheckCircle} size={10} color={isDark ? '#4ade80' : '#16a34a'} />
                <Text style={{ fontSize: 10, color: isDark ? '#4ade80' : '#16a34a', fontFamily: 'Sarabun_700Bold' }}>
                  ล่าสุดแล้ว
                </Text>
              </View>
            </View>
          </View>

          <Separator style={{ marginVertical: 4 }} />

          {/* ระบบบันทึกเวลา */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>ระบบบันทึกเวลา</Text>
            <Text style={styles.settingValue}>TimeTrackOT</Text>
          </View>

          <Separator style={{ marginVertical: 4 }} />

          {/* การจัดเก็บข้อมูล */}
          <View style={styles.settingItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={HardDrive} size={13} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.settingLabel}>การจัดเก็บข้อมูล</Text>
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe',
            }}>
              <Icon name={Lock} size={10} color={isDark ? '#60a5fa' : '#2563eb'} />
              <Text style={{ fontSize: 11, color: isDark ? '#60a5fa' : '#2563eb', fontFamily: 'Sarabun_600SemiBold' }}>
                ออฟไลน์ 100%
              </Text>
            </View>
          </View>

          <Separator style={{ marginVertical: 4 }} />

          {/* ความเป็นส่วนตัว */}
          <View style={[styles.settingItem, { alignItems: 'flex-start', flexDirection: 'column', gap: 4 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={Shield} size={13} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.settingLabel}>ความเป็นส่วนตัว</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'Sarabun_400Regular', lineHeight: 17, paddingLeft: 19 }}>
              ข้อมูลทั้งหมดถูกจัดเก็บในเครื่องของคุณเท่านั้น{'\n'}ไม่มีการเชื่อมต่อคลาวด์หรือส่งข้อมูลออกภายนอก
            </Text>
          </View>

          <Separator style={{ marginVertical: 4 }} />

          {/* ผู้พัฒนา */}
          <View style={styles.settingItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={Code2} size={13} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.settingLabel}>ผู้พัฒนา</Text>
            </View>
            <Text style={styles.settingValue}>Wick</Text>
          </View>

          <Separator style={{ marginVertical: 4 }} />

          {/* ลิขสิทธิ์ */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>ลิขสิทธิ์</Text>
            <Text style={[styles.settingValue, { fontSize: 11 }]}>© 2569 Wick. All rights reserved.</Text>
          </View>

          <Separator style={{ marginVertical: 8 }} />

          {/* แจ้งปัญหา / ข้อเสนอแนะ */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://forms.gle/BKx4Pz6VB65kdaka8')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name={Mail} size={16} color={isDark ? '#60a5fa' : '#2563eb'} />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontFamily: 'Sarabun_600SemiBold', color: isDark ? '#e2e8f0' : '#0f172a' }}>
                  แจ้งปัญหา / ข้อเสนอแนะ
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Sarabun_400Regular', marginTop: 1 }}>
                  เปิดแบบฟอร์มในเบราว์เซอร์
                </Text>
              </View>
            </View>
            <Icon name={ChevronRight} size={15} color={isDark ? '#60a5fa' : '#2563eb'} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Restore Confirmation AlertDialog (Column Layout with full options) */}
      <AlertDialog
        isVisible={restoreDialogVisible}
        onClose={() => {
          if (!isRestoring) {
            setRestoreDialogVisible(false);
            setPendingRestore(null);
          }
        }}
        title="ยืนยันการกู้คืนข้อมูล"
        description="กรุณาเลือกรูปแบบการกู้คืนข้อมูลที่คุณต้องการ:"
        showCancelButton={false}
        confirmText="ยกเลิก"
        confirmVariant="outline"
        onConfirm={() => {
          setRestoreDialogVisible(false);
          setPendingRestore(null);
        }}
      >
        <View style={styles.metaBox}>
          <Text style={[styles.metaText, { fontWeight: '700', color: colors.text, marginBottom: 4 }]}>
            วันที่สำรองข้อมูล:{' '}
            {pendingRestore?.metadata?.exportedAt
              ? new Date(pendingRestore.metadata.exportedAt).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'ไม่ระบุ'}
          </Text>
          <Text style={styles.metaText}>
            • บันทึกเวลาทำงาน: {pendingRestore?.metadata?.totalRecords?.timeEntries || 0} วัน
          </Text>
          <Text style={styles.metaText}>
            • วันหยุด: {pendingRestore?.metadata?.totalRecords?.holidays || 0} วัน
          </Text>
          <Text style={styles.metaText}>
            • วันลา: {pendingRestore?.metadata?.totalRecords?.leaves || 0} รายการ
          </Text>
          <Text style={styles.metaText}>
            • ตารางเวลากะ: {pendingRestore?.metadata?.totalRecords?.workSchedules || 0} เดือน
          </Text>
        </View>

        <View style={{ gap: 8, marginTop: 4 }}>
          <Button
            variant="default"
            size="sm"
            style={{ width: '100%', minHeight: 44, backgroundColor: isDark ? '#2563eb' : '#1d4ed8' }}
            textStyle={{ fontSize: 13, fontFamily: 'Sarabun_700Bold' }}
            disabled={isRestoring}
            onPress={() => handleConfirmRestore('replace')}
          >
            กู้คืนแบบแทนที่ทั้งหมด (Clean Restore)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            style={{ width: '100%', minHeight: 44 }}
            textStyle={{ fontSize: 13, fontFamily: 'Sarabun_700Bold' }}
            disabled={isRestoring}
            onPress={() => handleConfirmRestore('merge')}
          >
            กู้คืนแบบรวมกับข้อมูลเดิม (Merge)
          </Button>
        </View>
      </AlertDialog>

      {/* Yearly Work Schedule Confirmation AlertDialog */}
      <AlertDialog
        isVisible={yearlyConfirmVisible}
        onClose={() => {
          if (!isLoading) {
            setYearlyConfirmVisible(false);
          }
        }}
        title="ยืนยันตั้งเวลาทำงานตลอดทั้งปี"
        description={`คุณต้องการกำหนดเวลาทำงานมาตรฐาน ${startTime} - ${endTime} น. ให้กับทุกเดือนในรอบปี พ.ศ. ${selectedYear + 543} (12 เดือน) ใช่หรือไม่? ข้อมูลเวลาทำงานมาตรฐานเดิมของปีนี้จะถูกอัปเดตเป็นค่านี้ทั้งหมด`}
        confirmText="ยืนยันบันทึกทั้งปี"
        cancelText="ยกเลิก"
        confirmVariant="default"
        cancelVariant="outline"
        buttonLayout="row"
        onConfirm={handleConfirmSaveYearly}
      />

      {/* Clear Database AlertDialog */}
      <AlertDialog
        isVisible={clearDialogVisible}
        onClose={() => {
          if (!isClearing) {
            setClearDialogVisible(false);
          }
        }}
        title="ยืนยันการล้างข้อมูลทั้งหมด"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลบันทึกเวลาทำงาน วันหยุด วันลา และโควตาทั้งหมดในเครื่อง? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ล้างข้อมูล"
        cancelText="ยกเลิก"
        confirmVariant="destructive"
        cancelVariant="outline"
        buttonLayout="row"
        onConfirm={handleConfirmClearAll}
      />

      <BottomNavigation />
    </View>
  );
};

function SettingsScreenContent() {
  const { colors } = useThemeContext();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <SettingsContent />
    </SafeAreaView>
  );
}

export default function SettingsScreen() {
  return (
    <ThemeProvider>
      <SettingsScreenContent />
    </ThemeProvider>
  );
}
