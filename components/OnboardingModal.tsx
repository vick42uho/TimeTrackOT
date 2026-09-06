import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  Briefcase,
  Bell,
  Sparkles,
  Calendar,
  CalendarCheck,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react-native';
import { useThemeContext } from './ThemeProvider';
import { triggerHaptic } from '@/hooks/useHaptics';
import { requestNotificationPermissions } from '@/services/notificationService';

export const HAS_SEEN_ONBOARDING_KEY = '@timetrack_has_seen_onboarding';

interface OnboardingSlide {
  id: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: { title: string; desc: string }[];
  actionButton?: {
    label: string;
    action: () => Promise<void> | void;
  };
}

export interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleRequestPermission = async () => {
    triggerHaptic('impact-medium');
    const granted = await requestNotificationPermissions();
    if (granted) {
      setPermissionGranted(true);
      triggerHaptic('success');
    }
  };

  const slides: OnboardingSlide[] = [
    {
      id: 'step_time_tracking',
      badge: 'ฟังก์ชันหลัก',
      badgeColor: '#2563eb',
      badgeBg: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
      icon: Clock,
      iconColor: '#2563eb',
      iconBg: isDark ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe',
      title: 'บันทึกเวลาทำงาน & คำนวณ OT อัตโนมัติ',
      subtitle: 'ลงเวลาเข้า-ออกงานง่ายดายในคลิกเดียว',
      description:
        'แตะบันทึกเวลาเข้า-ออกงาน ระบบจะแยกชั่วโมงทำงานปกติและคำนวณเงิน OT ช่วงเช้า/เย็นให้ทันที',
      bullets: [
        {
          title: 'คำนวณเงิน OT อัจฉริยะ',
          desc: 'คิดอัตรา 1.5 เท่า หรือ 3 เท่า ตามวันทำงานและวันหยุด',
        },
        {
          title: 'รองรับกะข้ามคืน',
          desc: 'บันทึกเวลาเข้างานช่วงค่ำและเลิกงานเช้าวันถัดไปได้อย่างแม่นยำ',
        },
        {
          title: 'บันทึกงาน & กิจกรรม',
          desc: 'เพิ่มโน้ตช่วยจำและประเภทกิจกรรมระหว่างวันได้สะดวก',
        },
      ],
    },
    {
      id: 'step_smart_alarm',
      badge: 'ฟีเจอร์เด่น',
      badgeColor: '#f59e0b',
      badgeBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
      icon: Bell,
      iconColor: '#f59e0b',
      iconBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
      title: 'นาฬิกาปลุกวันทำงานอัจฉริยะ (Smart Alarm)',
      subtitle: 'ปลุกเฉพาะวันทำงานจริง ไม่กวนใจในวันหยุด',
      description:
        'ไม่ต้องคอยเปิด-ปิดนาฬิกาปลุกเองทุกวัน ระบบตรวจปฏิทินและงดปลุกในวันหยุดราชการ วันหยุดสัปดาห์ และวันลาที่ได้รับอนุมัติให้อัตโนมัติ',
      bullets: [
        {
          title: 'ปลุกเต็มจอแม้ปิดแอพ',
          desc: 'ใช้ Native Full-Screen Intent จุดหน้าจอให้สว่างและเด้งขึ้นมาเอง',
        },
        {
          title: 'ทะลุโหมดเงียบ',
          desc: 'ส่งเสียงเตือนระดับนาฬิกาปลุกจริง แม้เปิดโหมดเงียบหรือสั่น',
        },
        {
          title: 'ปรับตามวัน WFH',
          desc: 'ตั้งเวลาปลุกสายขึ้นในวันที่ทำงานที่บ้าน (WFH) ได้อย่างอิสระ',
        },
      ],
      actionButton: {
        label: permissionGranted ? 'เปิดสิทธิ์การแจ้งเตือนแล้ว' : 'เปิดสิทธิ์การแจ้งเตือนล่วงหน้า',
        action: handleRequestPermission,
      },
    },
    {
      id: 'step_calendar_leaves',
      badge: 'วางแผนวันหยุด',
      badgeColor: '#10b981',
      badgeBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      icon: Calendar,
      iconColor: '#10b981',
      iconBg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
      title: 'ปฏิทินวันหยุดไทย & บันทึกวันลา',
      subtitle: 'เชื่อมโยงวันหยุดราชการไทย พ.ศ. และโควตาวันลา',
      description:
        'ดูปฏิทินประจำปีพุทธศักราช พร้อมวันหยุดนักขัตฤกษ์ไทยที่อัปเดตล่วงหน้า และบันทึกวันลาพักร้อน ลาป่วย ลากิจ ได้อย่างเป็นระบบ',
      bullets: [
        {
          title: 'ปฏิทินไทยแท้ (พ.ศ.)',
          desc: 'แสดงชื่อวัน เดือน และปี พ.ศ. พร้อมแท็กวันหยุดชัดเจน',
        },
        {
          title: 'ติดตามโควตาวันลา',
          desc: 'สรุปจำนวนวันลาที่ใช้ไปและคงเหลือในแต่ละหมวดหมู่',
        },
        {
          title: 'ผูกกับนาฬิกาปลุก',
          desc: 'เมื่อบันทึกวันลา ระบบจะงดส่งเสียงปลุกในวันนั้นให้อัตโนมัติ',
        },
      ],
    },
    {
      id: 'step_reports_privacy',
      badge: 'ข้อมูลปลอดภัย',
      badgeColor: '#6366f1',
      badgeBg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
      icon: ShieldCheck,
      iconColor: '#6366f1',
      iconBg: isDark ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
      title: 'สรุปรายงาน & จัดเก็บในเครื่อง 100%',
      subtitle: 'ส่งออกรายงาน HR ได้ทันที ปลอดภัยไร้คลาวด์',
      description:
        'ดูภาพรวมกราฟสถิติรายเดือน ยอดเงิน OT สะสม และส่งออกรายงานไฟล์ Excel หรือ PDF เพื่อยื่นฝ่ายบุคคลได้ทันทีในคลิกเดียว',
      bullets: [
        {
          title: 'ออฟไลน์ 100% (Local SQLite)',
          desc: 'ข้อมูลทั้งหมดจัดเก็บในเครื่องของคุณเท่านั้น ไม่มีการส่งออกภายนอก',
        },
        {
          title: 'ส่งออกรายงาน HR',
          desc: 'สร้างรายงานสรุปเวลาและค่าล่วงเวลาพร้อมพิมพ์หรือแชร์ไฟล์',
        },
        {
          title: 'สำรองและกู้คืนข้อมูล',
          desc: 'บันทึกไฟล์ Backup ข้อมูลเก็บไว้และนำกลับมาใช้ใหม่ได้ทุกเมื่อ',
        },
      ],
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    triggerHaptic('impact-light');
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    triggerHaptic('impact-light');
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleComplete = () => {
    triggerHaptic('success');
    onClose();
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleComplete}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
        ]}
      >
        {/* Top Header: Step Indicator & Skip Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.stepCounterBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : '#e2e8f0',
                },
              ]}
            >
              <Text
                style={[
                  styles.stepCounterText,
                  { color: isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                หน้า {currentIndex + 1} จาก {slides.length}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleComplete}
            style={styles.skipButton}
          >
            <Text
              style={[
                styles.skipButtonText,
                { color: isDark ? '#94a3b8' : '#64748b' },
              ]}
            >
              ข้าม
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {slides.map((slide) => {
            const IconComponent = slide.icon;
            return (
              <View
                key={slide.id}
                style={[styles.slideContainer, { width: SCREEN_WIDTH }]}
              >
                <ScrollView
                  contentContainerStyle={styles.slideScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Top Badge */}
                  <View
                    style={[
                      styles.badgeContainer,
                      { backgroundColor: slide.badgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: slide.badgeColor },
                      ]}
                    >
                      {slide.badge}
                    </Text>
                  </View>

                  {/* Icon Hero Display */}
                  <View
                    style={[
                      styles.iconHeroCircle,
                      {
                        backgroundColor: slide.iconBg,
                        borderColor: slide.iconColor,
                      },
                    ]}
                  >
                    <IconComponent size={44} color={slide.iconColor} />
                  </View>

                  {/* Title & Subtitle */}
                  <Text
                    style={[
                      styles.title,
                      { color: isDark ? '#f8fafc' : '#0f172a' },
                    ]}
                  >
                    {slide.title}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: slide.badgeColor },
                    ]}
                  >
                    {slide.subtitle}
                  </Text>

                  {/* Description */}
                  <Text
                    style={[
                      styles.description,
                      { color: isDark ? '#94a3b8' : '#475569' },
                    ]}
                  >
                    {slide.description}
                  </Text>

                  {/* Action Button for Permission (if any) */}
                  {slide.actionButton && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={slide.actionButton.action}
                      style={[
                        styles.permissionActionBtn,
                        {
                          backgroundColor: permissionGranted
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.15)'
                              : '#ecfdf5'
                            : isDark
                            ? 'rgba(245, 158, 11, 0.18)'
                            : '#fef3c7',
                          borderColor: permissionGranted
                            ? '#10b981'
                            : '#f59e0b',
                        },
                      ]}
                    >
                      {permissionGranted ? (
                        <CheckCircle2 size={16} color="#10b981" />
                      ) : (
                        <Zap size={16} color="#f59e0b" />
                      )}
                      <Text
                        style={[
                          styles.permissionActionText,
                          {
                            color: permissionGranted
                              ? '#10b981'
                              : isDark
                              ? '#fbbf24'
                              : '#d97706',
                          },
                        ]}
                      >
                        {slide.actionButton.label}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Feature Highlights Cards */}
                  <View style={styles.bulletsList}>
                    {slide.bullets.map((bullet, bIdx) => (
                      <View
                        key={bIdx}
                        style={[
                          styles.bulletCard,
                          {
                            backgroundColor: isDark
                              ? 'rgba(30, 41, 59, 0.75)'
                              : '#ffffff',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.bulletIconWrap,
                            { backgroundColor: slide.badgeBg },
                          ]}
                        >
                          <CheckCircle2
                            size={16}
                            color={slide.badgeColor}
                          />
                        </View>
                        <View style={styles.bulletTextWrap}>
                          <Text
                            style={[
                              styles.bulletTitle,
                              { color: isDark ? '#f1f5f9' : '#1e293b' },
                            ]}
                          >
                            {bullet.title}
                          </Text>
                          <Text
                            style={[
                              styles.bulletDesc,
                              { color: isDark ? '#94a3b8' : '#64748b' },
                            ]}
                          >
                            {bullet.desc}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Navigation & Dots */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            },
          ]}
        >
          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {slides.map((_, dotIdx) => {
              const isActive = dotIdx === currentIndex;
              return (
                <View
                  key={dotIdx}
                  style={[
                    styles.dot,
                    {
                      width: isActive ? 22 : 7,
                      backgroundColor: isActive
                        ? '#2563eb'
                        : isDark
                        ? '#334155'
                        : '#cbd5e1',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.bottomButtonsRow}>
            {currentIndex > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleBack}
                style={[
                  styles.navBtnSecondary,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
              >
                <ChevronLeft
                  size={18}
                  color={isDark ? '#e2e8f0' : '#334155'}
                />
                <Text
                  style={[
                    styles.navBtnSecondaryText,
                    { color: isDark ? '#e2e8f0' : '#334155' },
                  ]}
                >
                  ย้อนกลับ
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              style={[
                styles.navBtnPrimary,
                { backgroundColor: '#2563eb' },
                isLast && styles.navBtnPrimaryFull,
              ]}
            >
              <Text style={styles.navBtnPrimaryText}>
                {isLast ? 'เริ่มต้นใช้งาน TimeTrack OT' : 'ถัดไป'}
              </Text>
              {!isLast && <ChevronRight size={18} color="#ffffff" />}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCounterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepCounterText: {
    fontSize: 12,
    fontFamily: 'Sarabun_600SemiBold',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Sarabun_500Medium',
  },
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
  },
  slideScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  badgeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Sarabun_700Bold',
  },
  iconHeroCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontFamily: 'Sarabun_700Bold',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Sarabun_600SemiBold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Sarabun_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  permissionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  permissionActionText: {
    fontSize: 13,
    fontFamily: 'Sarabun_600SemiBold',
  },
  bulletsList: {
    width: '100%',
    gap: 10,
  },
  bulletCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  bulletIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletTextWrap: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 13,
    fontFamily: 'Sarabun_600SemiBold',
    marginBottom: 2,
  },
  bulletDesc: {
    fontSize: 12,
    fontFamily: 'Sarabun_400Regular',
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    borderTopWidth: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  navBtnSecondaryText: {
    fontSize: 14,
    fontFamily: 'Sarabun_600SemiBold',
  },
  navBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  navBtnPrimaryFull: {
    flex: 1,
  },
  navBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Sarabun_600SemiBold',
  },
});
