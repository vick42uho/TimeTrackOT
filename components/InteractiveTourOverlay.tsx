import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Clock,
  TrendingUp,
  CheckSquare,
  Calendar,
  Settings,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Gamepad2,
  X,
  BarChart3,
  Home,
} from 'lucide-react-native';
import { useThemeContext } from './ThemeProvider';
import { triggerHaptic } from '@/hooks/useHaptics';

export const TOUR_STORAGE_KEY = '@timetrack_has_seen_interactive_tour';

export interface TargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

export interface TourStepItem {
  id?: string;
  stepNumber: number;
  badge: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  targetLayout: TargetLayout | null;
}

export interface TourStepConfig {
  stepIndex: number;
  stepNumber: number;
  stepParam: string;
  route: string;
  badge: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
}

export const APP_TOUR_STEPS: TourStepConfig[] = [
  {
    stepIndex: 0,
    stepNumber: 1,
    stepParam: '1',
    route: '/settings',
    badge: 'ตั้งเวลาทำงาน',
    title: '1. กำหนดเวลาทำงานปกติ',
    description: 'เริ่มต้นใช้งานต้องตั้งเวลาทำงานก่อน! กำหนดเวลาเข้างาน เลิกงาน และวันทำงานปกติ เพื่อให้ระบบนำไปคำนวณชั่วโมงทำงาน ขาด ลา มาสาย และเงิน OT ได้อย่างแม่นยำ',
    icon: Clock,
    iconColor: '#2563eb',
  },
  {
    stepIndex: 1,
    stepNumber: 2,
    stepParam: '2',
    route: '/leaves',
    badge: 'วันหยุด & วันลา',
    title: '2. สลับแท็บ: วันหยุด, การลา & โควตา',
    description: 'แถบสำหรับสลับดูข้อมูล 3 เมนูหลัก:\n• ปฏิทิน & วันหยุด: เช็ควันหยุดไทย, นัดหมาย และนาฬิกาปลุก\n• การลา: ดูประวัติการลา และลงบันทึกขอลาหยุด\n• โควตา: ตรวจสอบโควตาวันลาคงเหลือประจำปี',
    icon: Calendar,
    iconColor: '#f59e0b',
  },
  {
    stepIndex: 2,
    stepNumber: 3,
    stepParam: '3',
    route: '/time-entry',
    badge: 'บันทึกเวลาทำงาน',
    title: '3. บันทึกเวลาเข้า-ออกงาน',
    description: 'ลงเวลาทำงานง่ายๆ ในไม่กี่วินาที:\n• แตะเลือก "เวลาเข้างาน" และ "เวลาเลิกงาน" หรือกดปุ่ม "ตอนนี้" / เวลาตามกะ\n• ใส่เหตุผลหรือบันทึกย่อ (ถ้ามี)\n• ระบบจะคำนวณชั่วโมงทำงานและ OT ให้อัตโนมัติ',
    icon: Clock,
    iconColor: '#10b981',
  },
  {
    stepIndex: 3,
    stepNumber: 4,
    stepParam: '4',
    route: '/reports',
    badge: 'รายงานเวลาทำงาน',
    title: '4. สรุปรายงานเวลาทำงาน',
    description: 'ดูรายงานสถิติเวลาทำงานและชั่วโมง OT สะสมประจำเดือนได้อย่างละเอียด และสามารถกดแชร์สรุปเวลาทำงานได้ทันที',
    icon: BarChart3,
    iconColor: '#0284c7',
  },
  {
    stepIndex: 4,
    stepNumber: 5,
    stepParam: '5',
    route: '/',
    badge: 'หน้าหลัก & แดชบอร์ด',
    title: '5. แดชบอร์ดหน้าหลัก & โน้ต/งาน',
    description: 'ศูนย์รวมข้อมูลประจำวันของคุณ! ดูยอด OT และสถิติสะสมแบบเรียลไทม์ กดลงเวลางานกะวันนี้ พร้อมจดโน้ตและรายการสิ่งที่ต้องทำ (To-Do List)... พร้อมเริ่มต้นใช้งานเลย!',
    icon: Home,
    iconColor: '#8b5cf6',
  },
];

export const markTourCompleted = async () => {
  try {
    await AsyncStorage.setItem(TOUR_STORAGE_KEY, 'true');
  } catch (e) {
    console.error('Error saving tour status:', e);
  }
};

export const restartTour = (router: any) => {
  router.replace('/settings?tourStep=1');
};

export interface InteractiveTourOverlayProps {
  visible: boolean;
  currentStepIndex: number;
  totalSteps: number;
  stepData: TourStepItem;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const InteractiveTourOverlay: React.FC<InteractiveTourOverlayProps> = ({
  visible,
  currentStepIndex,
  totalSteps,
  stepData,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}) => {
  const { themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tooltipSlideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(tooltipSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous pulse on target spotlight
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
      };
    } else {
      fadeAnim.setValue(0);
      tooltipSlideAnim.setValue(10);
    }
  }, [visible, currentStepIndex, fadeAnim, pulseAnim, tooltipSlideAnim]);

  if (!visible) return null;

  const target = stepData.targetLayout;
  const padding = 6;
  const hasTarget = target && target.width > 0 && target.height > 0;

  // Hole coordinates
  const holeX = hasTarget ? Math.max(0, target.x - padding) : SCREEN_WIDTH * 0.1;
  const holeY = hasTarget ? Math.max(0, target.y - padding) : SCREEN_HEIGHT * 0.3;
  const holeW = hasTarget ? target.width + padding * 2 : SCREEN_WIDTH * 0.8;
  const holeH = hasTarget ? target.height + padding * 2 : 120;
  const holeRadius = hasTarget ? target.borderRadius || 18 : 18;

  // Decide if tooltip card should appear above or below the target hole
  const isTooltipAbove = holeY > SCREEN_HEIGHT * 0.46;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const IconComponent = stepData.icon || Sparkles;

  const handleNextPress = () => {
    triggerHaptic('impact-light');
    if (isLastStep) {
      triggerHaptic('success');
      onFinish();
    } else {
      onNext();
    }
  };

  const handlePrevPress = () => {
    triggerHaptic('impact-light');
    onPrev();
  };

  const handleSkipPress = () => {
    triggerHaptic('selection');
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onSkip}
    >
      <View style={styles.overlayContainer}>
        {/* 4 Surrounding Dark Panels Creating the Spotlight Hole */}
        {hasTarget ? (
          <>
            {/* Top Dark Panel */}
            <View
              style={[
                styles.darkPanel,
                { top: 0, left: 0, right: 0, height: holeY },
              ]}
            />
            {/* Bottom Dark Panel */}
            <View
              style={[
                styles.darkPanel,
                {
                  top: holeY + holeH,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
              ]}
            />
            {/* Left Dark Panel */}
            <View
              style={[
                styles.darkPanel,
                {
                  top: holeY,
                  left: 0,
                  width: holeX,
                  height: holeH,
                },
              ]}
            />
            {/* Right Dark Panel */}
            <View
              style={[
                styles.darkPanel,
                {
                  top: holeY,
                  left: holeX + holeW,
                  right: 0,
                  height: holeH,
                },
              ]}
            />

            {/* Glowing Spotlight Highlight Border */}
            <Animated.View
              style={[
                styles.spotlightHole,
                {
                  top: holeY,
                  left: holeX,
                  width: holeW,
                  height: holeH,
                  borderRadius: holeRadius,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {/* Corner Tag for Game-like UI */}
              <View style={styles.spotlightPill}>
                <View style={styles.liveDot} />
                <Text style={styles.spotlightPillText}>จุดนี้เลย</Text>
              </View>
            </Animated.View>
          </>
        ) : (
          <View style={[styles.darkPanel, StyleSheet.absoluteFill]} />
        )}

        {/* Floating Coach Tooltip Box */}
        <Animated.View
          style={[
            styles.tooltipCard,
            {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#3b82f6' : '#2563eb',
              opacity: fadeAnim,
              transform: [{ translateY: tooltipSlideAnim }],
              ...(isTooltipAbove
                ? { bottom: SCREEN_HEIGHT - holeY + 16 }
                : { top: holeY + holeH + 16 }),
            },
          ]}
        >
          {/* Arrow Pointer Pointing to the Hole */}
          {isTooltipAbove ? (
            <View
              style={[
                styles.arrowDown,
                {
                  borderTopColor: isDark ? '#1e293b' : '#ffffff',
                  left: Math.min(
                    SCREEN_WIDTH - 60,
                    Math.max(30, holeX + holeW / 2 - 20)
                  ),
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.arrowUp,
                {
                  borderBottomColor: isDark ? '#1e293b' : '#ffffff',
                  left: Math.min(
                    SCREEN_WIDTH - 60,
                    Math.max(30, holeX + holeW / 2 - 20)
                  ),
                },
              ]}
            />
          )}

          {/* Tooltip Header: Game Step Badge + Close button */}
          <View style={styles.tooltipHeader}>
            <View style={styles.headerBadgeWrap}>
              <View
                style={[
                  styles.gameBadge,
                  { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' },
                ]}
              >
                <Gamepad2 size={13} color="#2563eb" />
                <Text style={styles.gameBadgeText}>
                  คู่มือสอนเล่น ({currentStepIndex + 1}/{totalSteps})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSkipPress}
              style={styles.closeIconBtn}
            >
              <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>

          {/* Content: Icon + Title + Description */}
          <View style={styles.contentRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(59, 130, 246, 0.18)'
                    : '#eff6ff',
                },
              ]}
            >
              <IconComponent
                size={22}
                color={stepData.iconColor || '#2563eb'}
              />
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: isDark ? '#f8fafc' : '#0f172a' },
                ]}
              >
                {stepData.title}
              </Text>
              <Text
                style={[
                  styles.stepDescription,
                  { color: isDark ? '#cbd5e1' : '#475569' },
                ]}
              >
                {stepData.description}
              </Text>
            </View>
          </View>

          {/* Step Progress Dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const active = idx === currentStepIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      width: active ? 18 : 6,
                      backgroundColor: active
                        ? '#2563eb'
                        : isDark
                        ? '#475569'
                        : '#cbd5e1',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSkipPress}
              style={styles.skipBtn}
            >
              <Text
                style={[
                  styles.skipBtnText,
                  { color: isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                ข้ามไกด์
              </Text>
            </TouchableOpacity>

            <View style={styles.navButtonsGroup}>
              {currentStepIndex > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePrevPress}
                  style={[
                    styles.prevBtn,
                    {
                      backgroundColor: isDark ? '#334155' : '#f1f5f9',
                      borderColor: isDark ? '#475569' : '#e2e8f0',
                    },
                  ]}
                >
                  <ChevronLeft
                    size={16}
                    color={isDark ? '#e2e8f0' : '#334155'}
                  />
                  <Text
                    style={[
                      styles.prevBtnText,
                      { color: isDark ? '#e2e8f0' : '#334155' },
                    ]}
                  >
                    ก่อนหน้า
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleNextPress}
                style={[
                  styles.nextBtn,
                  isLastStep && styles.finishBtn,
                ]}
              >
                <Text style={styles.nextBtnText}>
                  {isLastStep ? 'เข้าใจแล้ว เริ่มลุยเลย!' : 'ถัดไป'}
                </Text>
                {!isLastStep && (
                  <ChevronRight size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  darkPanel: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  spotlightHole: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#3b82f6',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  spotlightPill: {
    position: 'absolute',
    top: -12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#67e8f9',
  },
  spotlightPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Sarabun_700Bold',
  },
  tooltipCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  arrowUp: {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowDown: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gameBadgeText: {
    fontSize: 11,
    fontFamily: 'Sarabun_700Bold',
    color: '#2563eb',
  },
  closeIconBtn: {
    padding: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Sarabun_700Bold',
    marginBottom: 4,
    lineHeight: 22,
  },
  stepDescription: {
    fontSize: 13,
    fontFamily: 'Sarabun_400Regular',
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  skipBtnText: {
    fontSize: 13,
    fontFamily: 'Sarabun_500Medium',
  },
  navButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  prevBtnText: {
    fontSize: 13,
    fontFamily: 'Sarabun_600SemiBold',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  finishBtn: {
    backgroundColor: '#16a34a',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sarabun_600SemiBold',
  },
});
