import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { TimeInput } from '@/components/TimeInput';
import { useThemeContext } from '@/components/ThemeProvider';
import { triggerHaptic } from '@/hooks/useHaptics';
import { useToast } from '@/components/ui/toast';
import {
  Holiday,
  LeaveRequest,
  SmartAlarmConfig,
  SmartAlarmWfhMode,
} from '@/types';
import {
  getSmartAlarmConfig,
  saveSmartAlarmConfig,
  syncSmartAlarmSchedule,
  calculateSmartAlarmSchedule,
  DEFAULT_SMART_ALARM_CONFIG,
} from '@/services/smartAlarmService';
import {
  Bell,
  Clock,
  Calendar,
  Sparkles,
  Save,
  X,
  Palmtree,
  Moon,
  Home,
  Check,
  AlertCircle,
} from 'lucide-react-native';

interface SmartAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  holidays: Holiday[];
  leaves: LeaveRequest[];
  onSaved?: () => void;
}

export const SmartAlarmModal: React.FC<SmartAlarmModalProps> = ({
  visible,
  onClose,
  holidays,
  leaves,
  onSaved,
}) => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  const { success, warning } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState('06:30');
  const [skipPublicHolidays, setSkipPublicHolidays] = useState(true);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [skipApprovedLeaves, setSkipApprovedLeaves] = useState(true);
  const [wfhMode, setWfhMode] = useState<SmartAlarmWfhMode>('normal');
  const [wfhAlarmTime, setWfhAlarmTime] = useState('07:30');
  const [preHolidayReminder, setPreHolidayReminder] = useState(true);

  // Load config on open
  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const cfg = await getSmartAlarmConfig();
      setEnabled(cfg.enabled);
      setAlarmTime(cfg.alarmTime || '06:30');
      setSkipPublicHolidays(cfg.skipPublicHolidays);
      setSkipWeekends(cfg.skipWeekends);
      setSkipApprovedLeaves(cfg.skipApprovedLeaves);
      setWfhMode(cfg.wfhMode || 'normal');
      setWfhAlarmTime(cfg.wfhAlarmTime || '07:30');
      setPreHolidayReminder(cfg.preHolidayReminder);
    } catch (err) {
      console.error('Error loading smart alarm config in modal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Construct draft config in real time for dynamic preview
  const draftConfig: SmartAlarmConfig = useMemo(() => {
    return {
      enabled,
      alarmTime,
      skipPublicHolidays,
      skipWeekends,
      skipApprovedLeaves,
      wfhMode,
      wfhAlarmTime,
      preHolidayReminder,
      snoozeMinutes: 10,
      vibrate: true,
      soundEnabled: true,
    };
  }, [
    enabled,
    alarmTime,
    skipPublicHolidays,
    skipWeekends,
    skipApprovedLeaves,
    wfhMode,
    wfhAlarmTime,
    preHolidayReminder,
  ]);

  // Compute 7-day preview in real-time
  const previewSchedule = useMemo(() => {
    return calculateSmartAlarmSchedule(draftConfig, holidays, leaves, 7);
  }, [draftConfig, holidays, leaves]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      triggerHaptic('impact-light');

      await saveSmartAlarmConfig(draftConfig);
      await syncSmartAlarmSchedule(holidays, leaves, draftConfig);

      triggerHaptic('success');
      if (enabled) {
        success('บันทึกสำเร็จ', `เปิดใช้งานนาฬิกาปลุกวันทำงาน (${alarmTime} น.) เรียบร้อยแล้ว`);
      } else {
        success('บันทึกสำเร็จ', 'ปิดระบบนาฬิกาปลุกวันทำงานเรียบร้อยแล้ว');
      }

      onClose();
      onSaved?.();
    } catch (err) {
      console.error('Error saving smart alarm config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      title="ตั้งค่านาฬิกาปลุกวันทำงาน (Smart Alarm)"
      footer={
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Button
            variant="outline"
            icon={X}
            style={{ flex: 1 }}
            onPress={() => {
              triggerHaptic('impact-light');
              onClose();
            }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="default"
            icon={Save}
            style={{ flex: 1 }}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </View>
      }
    >
      <View style={{ gap: 16, paddingBottom: 24 }}>
        {/* Master Switch Card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: enabled
              ? isDark
                ? 'rgba(37, 99, 235, 0.18)'
                : '#eff6ff'
              : isDark
              ? 'rgba(255, 255, 255, 0.04)'
              : '#f8fafc',
            padding: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: enabled
              ? isDark
                ? '#3b82f6'
                : '#bfdbfe'
              : colors.border,
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Icon name={Bell} size={16} color={enabled ? '#2563eb' : colors.textSecondary} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.text,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                เปิดนาฬิกาปลุกวันทำงาน
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontFamily: 'Sarabun_400Regular',
              }}
            >
              ปลุกเฉพาะวันทำงานจริง และเว้นวันหยุด/วันลาให้อัตโนมัติ
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(val) => {
              triggerHaptic('selection');
              setEnabled(val);
            }}
          />
        </View>

        {/* Alarm Time Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: colors.text,
              fontFamily: 'Sarabun_700Bold',
              marginBottom: 8,
            }}
          >
            เวลาปลุกวันทำงานปกติ:
          </Text>
          <TimeInput
            label="เวลาปลุก (วันปกติ)"
            value={alarmTime}
            onChange={setAlarmTime}
            placeholder="06:30"
          />
        </View>

        {/* Skip Rules Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Icon name={Sparkles} size={15} color="#f59e0b" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.text,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              กฎการงดปลุกอัตโนมัติ (Smart Skip):
            </Text>
          </View>

          {/* Rule 1: Public Holidays */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 2,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                งดปลุกวันหยุดนักขัตฤกษ์ & ชดเชย
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                }}
              >
                อิงตามปฏิทินวันหยุดไทยในระบบ
              </Text>
            </View>
            <Switch
              value={skipPublicHolidays}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setSkipPublicHolidays(val);
              }}
            />
          </View>

          {/* Rule 2: Weekends */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 2,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                งดปลุกวันหยุดประจำสัปดาห์ (เสาร์-อาทิตย์)
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                }}
              >
                และวันที่ระบุเป็น "วันหยุดปกติ"
              </Text>
            </View>
            <Switch
              value={skipWeekends}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setSkipWeekends(val);
              }}
            />
          </View>

          {/* Rule 3: Approved Leaves */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 2,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                งดปลุกในวันที่บันทึกการลา
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                }}
              >
                ลาพักร้อน, ลาป่วย, ลากิจ
              </Text>
            </View>
            <Switch
              value={skipApprovedLeaves}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setSkipApprovedLeaves(val);
              }}
            />
          </View>
        </View>

        {/* WFH Mode Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={Home} size={15} color="#10b981" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.text,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              โหมดวันทำงานที่บ้าน (WFH):
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { key: 'normal' as SmartAlarmWfhMode, label: 'ปลุกเวลาปกติ' },
              { key: 'custom' as SmartAlarmWfhMode, label: 'ปลุกช้าลง' },
              { key: 'skip' as SmartAlarmWfhMode, label: 'ไม่ต้องปลุก' },
            ].map((opt) => {
              const isSel = wfhMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    triggerHaptic('selection');
                    setWfhMode(opt.key);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 999,
                    alignItems: 'center',
                    borderWidth: isSel ? 1.5 : 1,
                    borderColor: isSel ? '#10b981' : colors.border,
                    backgroundColor: isSel
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.25)'
                        : '#ecfdf5'
                      : colors.backgroundAlt,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSel ? '700' : '500',
                      color: isSel ? '#10b981' : colors.text,
                      fontFamily: isSel ? 'Sarabun_700Bold' : 'Sarabun_500Medium',
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {wfhMode === 'custom' && (
            <View style={{ marginTop: 4 }}>
              <TimeInput
                label="เวลาปลุกเฉพาะวัน WFH"
                value={wfhAlarmTime}
                onChange={setWfhAlarmTime}
                placeholder="07:30"
              />
            </View>
          )}
        </View>

        {/* Pre-holiday Goodnight Reminder */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Icon name={Moon} size={15} color="#8b5cf6" />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.text,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                แจ้งเตือนคืนก่อนวันหยุด (20:00 น.)
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                fontFamily: 'Sarabun_400Regular',
              }}
            >
              ส่งแจ้งเตือนตอนค่ำว่าปิดนาฬิกาปลุกให้แล้ว พักผ่อนได้สบายใจ
            </Text>
          </View>
          <Switch
            value={preHolidayReminder}
            onValueChange={(val) => {
              triggerHaptic('selection');
              setPreHolidayReminder(val);
            }}
          />
        </View>

        {/* 7-Day Live Preview Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={Calendar} size={15} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.text,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                ตารางจำลอง 7 วันข้างหน้า:
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.primary,
                fontFamily: 'Sarabun_600SemiBold',
              }}
            >
              อัปเดตตามการตั้งค่าแบบเรียลไทม์
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            {previewSchedule.map((item, idx) => {
              const isToday = idx === 0;
              const isAlarm = item.status === 'alarm' || item.status === 'wfh_alarm';

              let badgeBg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff';
              let badgeColor = '#2563eb';
              let statusText = `⏰ ปลุก ${item.alarmTime} น.`;

              if (item.status === 'wfh_alarm') {
                badgeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';
                badgeColor = '#10b981';
                statusText = `🏠 ปลุก ${item.alarmTime} น. (WFH)`;
              } else if (item.status === 'skip_holiday') {
                badgeBg = isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7';
                badgeColor = '#d97706';
                statusText = `🏖️ งดปลุก (${item.reason})`;
              } else if (item.status === 'skip_leave') {
                badgeBg = isDark ? 'rgba(236, 72, 153, 0.15)' : '#fdf2f8';
                badgeColor = '#db2777';
                statusText = `🌴 งดปลุก (${item.reason})`;
              } else if (item.status === 'skip_weekend') {
                badgeBg = isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9';
                badgeColor = '#64748b';
                statusText = `💤 งดปลุก (วันหยุดสัปดาห์)`;
              } else if (item.status === 'skip_wfh') {
                badgeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';
                badgeColor = '#10b981';
                statusText = `🏠 งดปลุก (วัน WFH)`;
              }

              if (!enabled) {
                badgeBg = isDark ? 'rgba(100, 116, 139, 0.1)' : '#f8fafc';
                badgeColor = colors.textSecondary;
                statusText = 'ปิดระบบนาฬิกาปลุก';
              }

              return (
                <View
                  key={item.date}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#fbfcfd',
                    borderWidth: 1,
                    borderColor: isToday ? colors.primary : colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isToday ? '700' : '600',
                        color: isToday ? colors.primary : colors.text,
                        fontFamily: isToday ? 'Sarabun_700Bold' : 'Sarabun_600SemiBold',
                        width: 75,
                      }}
                    >
                      {item.dayName} {item.date.slice(8)} {isToday ? '(วันนี้)' : ''}
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: badgeBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: badgeColor,
                        fontFamily: 'Sarabun_700Bold',
                      }}
                      numberOfLines={1}
                    >
                      {statusText}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};
