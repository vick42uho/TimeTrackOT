import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import {
  Bell,
  BellOff,
  Clock,
  Briefcase,
  Home,
  Calendar,
} from 'lucide-react-native';
import { snoozeSmartAlarm } from '@/services/smartAlarmService';

export interface AlarmRingingModalProps {
  visible: boolean;
  alarmTime?: string;
  alarmDate?: string;
  reason?: string;
  onDismiss: () => void;
  onSnooze?: (minutes: number) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_DAYS = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์',
];

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  visible,
  alarmTime,
  alarmDate,
  reason = 'วันทำงานปกติ',
  onDismiss,
  onSnooze,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const player = useAudioPlayer(require('../assets/sounds/alarm.wav'));

  // Concentric radar ring animations
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;

  // 1. Clock timer: update every second
  useEffect(() => {
    if (!visible) return;
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  // 2. Continuous radar pulse loop animation
  useEffect(() => {
    if (!visible) {
      pulseAnim1.setValue(0);
      pulseAnim2.setValue(0);
      return;
    }

    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim1, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(pulseAnim2, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [visible, pulseAnim1, pulseAnim2]);

  // 3. Audio & Vibration playback
  useEffect(() => {
    if (!visible) {
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
      try {
        player.pause();
      } catch (e) {}
      return;
    }

    try {
      player.loop = true;
      player.volume = 1.0;
      player.seekTo(0);
      player.play();
    } catch (err) {
      console.warn('Alarm audio playback error:', err);
    }

    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
    }

    return () => {
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
      try {
        player.pause();
        player.seekTo(0);
      } catch (e) {}
    };
  }, [visible, player]);

  const stopAudioAndVibration = () => {
    try {
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
      player.pause();
      player.seekTo(0);
    } catch (err) {
      console.warn('Error stopping alarm audio/vibration:', err);
    }
  };

  const handleDismiss = () => {
    stopAudioAndVibration();
    onDismiss();
  };

  const handleSnooze = async () => {
    stopAudioAndVibration();
    try {
      await snoozeSmartAlarm(10, reason);
    } catch (e) {
      console.warn('Failed to schedule snooze notification:', e);
    }
    if (onSnooze) {
      onSnooze(10);
    }
    onDismiss();
  };

  if (!visible) return null;

  // Real-time time formatting
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  const dayName = THAI_DAYS[currentTime.getDay()];
  const dateNum = currentTime.getDate();
  const monthName = THAI_MONTHS[currentTime.getMonth()];
  const thaiYear = currentTime.getFullYear() + 543;
  const fullDateText = `${dayName}ที่ ${dateNum} ${monthName} ${thaiYear}`;

  const isWfh = reason.toLowerCase().includes('wfh') || reason.includes('บ้าน');
  const isWeekendWork = reason.includes('เสาร์') || reason.includes('อาทิตย์');

  const scale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });
  const opacity1 = pulseAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 0.25, 0],
  });

  const scale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });
  const opacity2 = pulseAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 0.25, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Top Status Header */}
          <View style={styles.topBar}>
            <View style={styles.alarmBadge}>
              <Bell size={16} color="#93C5FD" />
              <Text style={styles.alarmBadgeText}>นาฬิกาปลุก TimeTrack OT</Text>
            </View>
          </View>

          {/* Center Pulsating Glow & Digital Clock */}
          <View style={styles.centerContainer}>
            <View style={styles.animCenterWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: scale1 }],
                    opacity: opacity1,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: scale2 }],
                    opacity: opacity2,
                  },
                ]}
              />
              <View style={styles.iconCircle}>
                <Bell size={42} color="#FFFFFF" />
              </View>
            </View>

            {/* Huge Digital Clock */}
            <View style={styles.clockRow}>
              <Text style={styles.clockHourMinute}>{hours}:{minutes}</Text>
              <Text style={styles.clockSeconds}>:{seconds}</Text>
            </View>

            {/* Thai Date */}
            <Text style={styles.dateText}>{fullDateText}</Text>

            {/* Reason Pill Badge */}
            <View style={styles.reasonCard}>
              {isWfh ? (
                <Home size={18} color="#38BDF8" />
              ) : isWeekendWork ? (
                <Calendar size={18} color="#F59E0B" />
              ) : (
                <Briefcase size={18} color="#60A5FA" />
              )}
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          </View>

          {/* Bottom Controls: Ergonomic Thumb Action Buttons */}
          <View style={styles.bottomZone}>
            {/* Snooze 10 Minutes */}
            <TouchableOpacity
              style={styles.snoozeButton}
              activeOpacity={0.8}
              onPress={handleSnooze}
            >
              <Clock size={24} color="#E2E8F0" />
              <View style={styles.buttonTextCol}>
                <Text style={styles.snoozeButtonText}>เลื่อนปลุก 10 นาที</Text>
                <Text style={styles.snoozeButtonSubText}>เตือนซ้ำอีกครั้งใน 10 นาทีข้างหน้า</Text>
              </View>
            </TouchableOpacity>

            {/* Dismiss Alarm */}
            <TouchableOpacity
              style={styles.dismissButton}
              activeOpacity={0.8}
              onPress={handleDismiss}
            >
              <BellOff size={26} color="#FFFFFF" />
              <View style={styles.buttonTextCol}>
                <Text style={styles.dismissButtonText}>ปิดนาฬิกาปลุก</Text>
                <Text style={styles.dismissButtonSubText}>ตื่นแล้ว เริ่มต้นวันใหม่อย่างสดชื่น</Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 12,
  },
  alarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  alarmBadgeText: {
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 14,
    color: '#93C5FD',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  animCenterWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.6)',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  clockHourMinute: {
    fontFamily: 'Sarabun_700Bold',
    fontSize: 72,
    color: '#FFFFFF',
    letterSpacing: 2,
    includeFontPadding: false,
  },
  clockSeconds: {
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 28,
    color: '#94A3B8',
    marginLeft: 4,
    includeFontPadding: false,
  },
  dateText: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 18,
    color: '#CBD5E1',
    marginTop: 4,
    marginBottom: 20,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.6)',
  },
  reasonText: {
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 16,
    color: '#F8FAFC',
  },
  bottomZone: {
    gap: 14,
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
  },
  snoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonTextCol: {
    marginLeft: 16,
    flex: 1,
  },
  snoozeButtonText: {
    fontFamily: 'Sarabun_700Bold',
    fontSize: 18,
    color: '#F1F5F9',
  },
  snoozeButtonSubText: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 13,
    color: '#94A3B8',
  },
  dismissButtonText: {
    fontFamily: 'Sarabun_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  dismissButtonSubText: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
