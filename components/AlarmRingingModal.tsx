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
  PanResponder,
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
  ChevronRight,
  Square,
  X,
} from 'lucide-react-native';
import { snoozeSmartAlarm, getSmartAlarmConfig } from '@/services/smartAlarmService';
import { triggerHaptic } from '@/hooks/useHaptics';

export interface AlarmRingingModalProps {
  visible: boolean;
  alarmTime?: string;
  alarmDate?: string;
  reason?: string;
  customSoundUri?: string;
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

const SLIDER_HEIGHT = 60;
const THUMB_SIZE = 50;
const THUMB_MARGIN = 5;

const SlideToStopButton: React.FC<{ onStop: () => void }> = ({ onStop }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const panX = useRef(new Animated.Value(0)).current;
  const isTriggered = useRef(false);

  const maxSlide = Math.max(0, trackWidth - THUMB_SIZE - THUMB_MARGIN * 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Touch started
      },
      onPanResponderMove: (_, gestureState) => {
        if (isTriggered.current) return;
        const newX = Math.max(0, Math.min(gestureState.dx, maxSlide));
        panX.setValue(newX);

        // Relaxed threshold: 45% slide triggers stop
        if (maxSlide > 0 && newX >= maxSlide * 0.45) {
          isTriggered.current = true;
          triggerHaptic('success');
          onStop();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isTriggered.current) return;

        // If tap (movement < 20px) OR slid >= 45%: STOP IMMEDIATELY
        if (
          (Math.abs(gestureState.dx) < 20 && Math.abs(gestureState.dy) < 20) ||
          (maxSlide > 0 && gestureState.dx >= maxSlide * 0.45)
        ) {
          isTriggered.current = true;
          triggerHaptic('success');
          onStop();
        } else {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (!isTriggered.current) {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const hintOpacity = panX.interpolate({
    inputRange: [0, Math.max(1, maxSlide * 0.4)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={sliderStyles.track}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <Animated.View
        pointerEvents="none"
        style={[sliderStyles.hintContainer, { opacity: hintOpacity }]}
      >
        <Text style={sliderStyles.hintText}>เลื่อนหรือแตะเพื่อปิดปลุก</Text>
        <View style={sliderStyles.chevronsRow}>
          <ChevronRight size={18} color="#94A3B8" />
          <ChevronRight size={18} color="#94A3B8" style={{ marginLeft: -10 }} />
          <ChevronRight size={18} color="#94A3B8" style={{ marginLeft: -10 }} />
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          sliderStyles.thumb,
          {
            transform: [{ translateX: panX }],
          },
        ]}
      >
        <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
      </Animated.View>
    </View>
  );
};

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  visible,
  alarmTime,
  alarmDate,
  reason = 'วันทำงานปกติ',
  customSoundUri,
  onDismiss,
  onSnooze,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeSoundUri, setActiveSoundUri] = useState<string | undefined>(customSoundUri);

  useEffect(() => {
    if (visible) {
      if (customSoundUri) {
        setActiveSoundUri(customSoundUri);
      } else {
        getSmartAlarmConfig()
          .then((cfg) => {
            if (cfg.customSoundUri) {
              setActiveSoundUri(cfg.customSoundUri);
            }
          })
          .catch(() => {});
      }
    }
  }, [visible, customSoundUri]);

  const soundSource = activeSoundUri
    ? { uri: activeSoundUri }
    : require('../assets/sounds/alarm.wav');
  const player = useAudioPlayer(soundSource);

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
          {/* Top Dynamic Island Header (Remimo Style) */}
          <View style={styles.topIslandBar}>
            <View style={styles.islandLeft}>
              <View style={styles.bellIconBox}>
                <Bell size={18} color="#38BDF8" />
              </View>
              <View style={styles.islandTitleCol}>
                <Text style={styles.islandTitleText}>TimeTrack OT</Text>
                <Text style={styles.islandSubText} numberOfLines={1}>
                  {reason}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButtonCircle}
              activeOpacity={0.7}
              onPress={handleDismiss}
              accessibilityLabel="ปิดการปลุก"
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
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

            {/* Slide to Stop (Remimo & iOS Style) */}
            <SlideToStopButton onStop={handleDismiss} />

            {/* Direct Tap to Stop Button */}
            <TouchableOpacity
              style={styles.tapToStopButton}
              activeOpacity={0.7}
              onPress={handleDismiss}
            >
              <BellOff size={18} color="#EF4444" />
              <Text style={styles.tapToStopText}>แตะที่นี่เพื่อปิดนาฬิกาปลุกทันที</Text>
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
  topIslandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(23, 32, 51, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    marginTop: 8,
  },
  islandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  bellIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  islandTitleCol: {
    flex: 1,
  },
  islandTitleText: {
    fontFamily: 'Sarabun_700Bold',
    fontSize: 14,
    color: '#F1F5F9',
  },
  islandSubText: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
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
  tapToStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1917',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  tapToStopText: {
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 15,
    color: '#F87171',
  },
});

const sliderStyles = StyleSheet.create({
  track: {
    height: SLIDER_HEIGHT,
    backgroundColor: '#172033',
    borderRadius: SLIDER_HEIGHT / 2,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  hintContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hintText: {
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 16,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  chevronsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: THUMB_MARGIN,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
