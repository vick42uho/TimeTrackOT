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
  BookOpen,
  X,
  BarChart3,
  Home,
  Palmtree,
  Bell,
  FileText,
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
    title: '1. กำหนดเวลาเข้า-เลิกงาน แล้วบันทึก',
    description: 'เริ่มต้นใช้งานต้องตั้งเวลาทำงานปกติก่อน:\n• ตรวจสอบหรือเลือก "เวลาเข้างาน" และ "เวลาเลิกงาน"\n• แตะปุ่ม "บันทึกเวลาทำงาน" เพื่อให้ระบบนำไปคำนวณขาด/ลา/มาสาย และ OT ได้อย่างแม่นยำ',
    icon: Clock,
    iconColor: '#2563eb',
  },
  {
    stepIndex: 1,
    stepNumber: 2,
    stepParam: '2',
    route: '/leaves',
    badge: 'ปฏิทินวันหยุด',
    title: '2. ปฏิทินวันหยุด & กำหนดวันหยุด',
    description: 'กำหนดวันหยุดและกิจกรรมได้ง่ายๆ:\n• ในการใช้งานจริง แตะ "วันที่" บนปฏิทิน (เช่น วันที่ 1) จะมีเมนูขึ้นมาให้เลือกกำหนด เช่น วันหยุดปกติ, นักขัตฤกษ์ หรือ WFH\n• แตะปุ่ม "ถัดไป" หรือแตะที่ปฏิทินเพื่อไปขั้นตอนต่อไป',
    icon: Calendar,
    iconColor: '#f59e0b',
  },
  {
    stepIndex: 2,
    stepNumber: 3,
    stepParam: '3',
    route: '/leaves',
    badge: 'นาฬิกาปลุกกะงาน',
    title: '3. นาฬิกาปลุกวันทำงานอัจฉริยะ',
    description: 'ช่วยปลุกคุณให้ทันเวลากะทำงาน:\n• แตะสวิตช์เพื่อ "เปิดหรือปิด" การใช้งานนาฬิกาปลุกได้ตามต้องการ\n• ระบบจะงดปลุกในวันหยุดและวันลาที่อนุมัติแล้วให้อัตโนมัติ',
    icon: Bell,
    iconColor: '#6366f1',
  },
  {
    stepIndex: 3,
    stepNumber: 4,
    stepParam: '4',
    route: '/leaves',
    badge: 'โควตาวันลา',
    title: '4. แท็บโควตา: แก้ไขโควตาแล้วบันทึก',
    description: 'ตรวจสอบและปรับเปลี่ยนสิทธิ์วันลา:\n• ดูโควตาวันลาคงเหลือประจำปี (พักร้อน 6 วัน, ลาป่วย 30 วัน, ลากิจ 3 วัน, อื่นๆ 5 วัน)\n• แตะปุ่ม "แก้ไขโควตา" เพื่อปรับจำนวนวันตามสิทธิ์ของคุณ แล้วกดบันทึก',
    icon: Calendar,
    iconColor: '#ec4899',
  },
  {
    stepIndex: 4,
    stepNumber: 5,
    stepParam: '5',
    route: '/leaves',
    badge: 'การลาหยุด',
    title: '5. แท็บการลา: ปุ่มยื่นขอลาหยุด',
    description: 'บันทึกการลาได้อย่างสะดวกรวดเร็ว:\n• แตะปุ่ม "ยื่นขอลา" เพื่อเลือกประเภทการลาและวันที่ต้องการขอลา\n• ตรวจสอบประวัติการลาและสถานะการอนุมัติทั้งหมดได้ในแท็บนี้',
    icon: FileText,
    iconColor: '#10b981',
  },
  {
    stepIndex: 5,
    stepNumber: 6,
    stepParam: '6',
    route: '/time-entry',
    badge: 'บันทึกเวลาทำงาน',
    title: '6. บันทึกเวลาเข้า-ออกงาน',
    description: 'ลงเวลาทำงานง่ายๆ ในไม่กี่วินาที:\n• แตะเลือก "เวลาเข้างาน" และ "เวลาเลิกงาน" หรือกดปุ่มด่วน "ตอนนี้" / เวลาตามกะ\n• ใส่เหตุผลหรือบันทึกย่อ (ถ้ามี) ระบบจะคำนวณชั่วโมงทำงานและ OT ให้อัตโนมัติ',
    icon: Clock,
    iconColor: '#10b981',
  },
  {
    stepIndex: 6,
    stepNumber: 7,
    stepParam: '7',
    route: '/reports',
    badge: 'รายงานเวลาทำงาน',
    title: '7. สรุปรายงานเวลาทำงาน & แชร์',
    description: 'ดูรายงานสถิติเวลาทำงานและชั่วโมง OT สะสมประจำเดือนได้อย่างละเอียด และสามารถกดแชร์สรุปเวลาทำงานได้ทันที',
    icon: BarChart3,
    iconColor: '#0284c7',
  },
  {
    stepIndex: 7,
    stepNumber: 8,
    stepParam: '8',
    route: '/',
    badge: 'แดชบอร์ดสถิติ',
    title: '8. แดชบอร์ดสรุปสถิติ OT & การทำงาน',
    description: 'สรุปภาพรวมเวลาทำงานและสถิติสำคัญของคุณ:\n• OT คงเหลือทั้งปี และ OT รวมประจำเดือน\n• ชั่วโมงทำงานจริงสะสม และสถิติการมาสาย',
    icon: TrendingUp,
    iconColor: '#8b5cf6',
  },
  {
    stepIndex: 8,
    stepNumber: 9,
    stepParam: '9',
    route: '/',
    badge: 'การทำงานวันนี้',
    title: '9. การทำงานวันนี้ & ลงเวลาด่วน',
    description: 'เช็คสถานะการทำงานประจำวันได้อย่างรวดเร็ว:\n• ดูเวลากะทำงาน และความคืบหน้าของวันนี้\n• กดปุ่มบันทึกเวลาเข้างาน / เลิกงาน ได้ทันทีในหน้าเดียว',
    icon: Clock,
    iconColor: '#2563eb',
  },
  {
    stepIndex: 9,
    stepNumber: 10,
    stepParam: '10',
    route: '/',
    badge: 'โน้ต & กิจกรรม',
    title: '10. กิจกรรม & โน้ต/งาน (To-Do List)',
    description: 'จัดการตารางงานและนัดหมายประจำวัน:\n• กิจกรรม & นัดหมาย: เพิ่มและติดตามนัดหมายสำคัญ\n• โน้ต & งาน: สร้างสิ่งที่ต้องทำ (To-Do List) พร้อมติ๊กเมื่อทำเสร็จ',
    icon: CheckSquare,
    iconColor: '#10b981',
  },
  {
    stepIndex: 10,
    stepNumber: 11,
    stepParam: '11',
    route: '/',
    badge: 'โควตาวันลา',
    title: '11. โควตาวันลาคงเหลือประจำปี',
    description: 'ตรวจสอบสิทธิ์วันลาคงเหลือประจำปีได้ทันที:\n• เช็ควันลาพักร้อน ลาป่วย ลากิจ และอื่นๆ\n• แตะเพื่อดูรายละเอียดหรือยื่นขอลาหยุด... พร้อมเริ่มใช้งานจริงได้เลย!',
    icon: Palmtree,
    iconColor: '#f59e0b',
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
  totalSteps?: number;
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
  totalSteps = APP_TOUR_STEPS.length,
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

  // Safe margins for notch and navigation bars
  const SAFE_TOP = Platform.OS === 'android' ? 36 : 50;
  const SAFE_BOTTOM = Platform.OS === 'android' ? 24 : 36;
  const ESTIMATED_CARD_HEIGHT = 190;

  // Space available above and below the hole
  const spaceAbove = holeY - SAFE_TOP;
  const spaceBelow = SCREEN_HEIGHT - (holeY + holeH) - SAFE_BOTTOM;

  let isTooltipAbove = false;
  let tooltipPositionStyle: any = {};
  let showArrow = true;

  if (spaceBelow >= ESTIMATED_CARD_HEIGHT) {
    // Fits comfortably below hole
    isTooltipAbove = false;
    showArrow = true;
    tooltipPositionStyle = {
      top: Math.min(holeY + holeH + 10, SCREEN_HEIGHT - SAFE_BOTTOM - ESTIMATED_CARD_HEIGHT),
    };
  } else if (spaceAbove >= ESTIMATED_CARD_HEIGHT) {
    // Fits comfortably above hole
    isTooltipAbove = true;
    showArrow = true;
    tooltipPositionStyle = {
      bottom: Math.max(SAFE_BOTTOM, SCREEN_HEIGHT - holeY + 10),
    };
  } else {
    // Large target: place where there is more room, pinned safely to edge
    showArrow = false;
    if (spaceAbove >= spaceBelow) {
      isTooltipAbove = true;
      tooltipPositionStyle = {
        top: SAFE_TOP,
      };
    } else {
      isTooltipAbove = false;
      tooltipPositionStyle = {
        bottom: SAFE_BOTTOM,
      };
    }
  }

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
              {/* Tapping anywhere on the highlighted target advances to next step */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleNextPress}
                style={StyleSheet.absoluteFill}
              />
              {/* Corner Tag for Game-like UI */}
              <View style={styles.spotlightPill} pointerEvents="none">
                <View style={styles.liveDot} />
                <Text style={styles.spotlightPillText}>{stepData.badge || 'จุดนี้เลย'}</Text>
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
              ...tooltipPositionStyle,
            },
          ]}
        >
          {/* Arrow Pointer Pointing to the Hole */}
          {showArrow && (
            isTooltipAbove ? (
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
            )
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
                <BookOpen size={13} color="#2563eb" />
                <Text style={styles.gameBadgeText}>
                  คู่มือ ({currentStepIndex + 1}/{totalSteps})
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
    left: 14,
    right: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 13,
    maxHeight: 280,
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
    marginBottom: 8,
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
    gap: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: 'Sarabun_700Bold',
    marginBottom: 2,
    lineHeight: 20,
  },
  stepDescription: {
    fontSize: 12.5,
    fontFamily: 'Sarabun_400Regular',
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
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
