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
  triggerTestSmartAlarm,
  saveCustomAlarmSound,
  resetCustomAlarmSound,
} from '@/services/smartAlarmService';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer } from 'expo-audio';
import {
  openAppBatterySettings,
} from '@/services/systemAlarmService';
import { AlarmRingingModal } from './AlarmRingingModal';
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
  Coffee,
  Briefcase,
  BellOff,
  Car,
  Smartphone,
  ExternalLink,
  BatteryCharging,
  ChevronDown,
  ChevronUp,
  Volume2,
  ShieldCheck,
  Music,
  Play,
  Square,
  RotateCcw,
  Upload,
} from 'lucide-react-native';
import FullScreenAlarm, { isFullScreenAlarmAvailable } from '@/modules/full-screen-alarm';

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
  const { success, warning, error } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBatteryGuide, setShowBatteryGuide] = useState(false);
  const [showLockScreenGuide, setShowLockScreenGuide] = useState(false);
  const [isTestingAlarmModal, setIsTestingAlarmModal] = useState(false);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState('06:30');
  const [useWeekendWorkAlarm, setUseWeekendWorkAlarm] = useState(true);
  const [weekendWorkAlarmTime, setWeekendWorkAlarmTime] = useState('07:00');
  const [skipRegularOff, setSkipRegularOff] = useState(true);
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [skipPublicHolidays, setSkipPublicHolidays] = useState(true);
  const [skipApprovedLeaves, setSkipApprovedLeaves] = useState(true);
  const [wfhMode, setWfhMode] = useState<SmartAlarmWfhMode>('custom');
  const [wfhAlarmTime, setWfhAlarmTime] = useState('07:30');
  const [preHolidayReminder, setPreHolidayReminder] = useState(true);
  const [customSoundUri, setCustomSoundUri] = useState<string | undefined>(undefined);
  const [customSoundName, setCustomSoundName] = useState<string | undefined>(undefined);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Audio Preview Player
  const previewSource = customSoundUri
    ? { uri: customSoundUri }
    : require('../assets/sounds/alarm.wav');
  const previewPlayer = useAudioPlayer(previewSource);

  const togglePlayPreview = () => {
    try {
      if (isPlayingPreview) {
        previewPlayer.pause();
        previewPlayer.seekTo(0);
        setIsPlayingPreview(false);
      } else {
        previewPlayer.seekTo(0);
        previewPlayer.play();
        setIsPlayingPreview(true);
      }
    } catch (e) {
      console.warn('Error toggling preview player:', e);
    }
  };

  useEffect(() => {
    if (!visible && isPlayingPreview) {
      try {
        previewPlayer.pause();
        previewPlayer.seekTo(0);
      } catch (e) {}
      setIsPlayingPreview(false);
    }
  }, [visible, isPlayingPreview, previewPlayer]);

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
      setUseWeekendWorkAlarm(cfg.useWeekendWorkAlarm !== undefined ? cfg.useWeekendWorkAlarm : true);
      setWeekendWorkAlarmTime(cfg.weekendWorkAlarmTime || '07:00');
      setSkipRegularOff(cfg.skipRegularOff !== undefined ? cfg.skipRegularOff : true);
      setSkipWeekends(cfg.skipWeekends ?? false);
      setSkipPublicHolidays(cfg.skipPublicHolidays);
      setSkipApprovedLeaves(cfg.skipApprovedLeaves);
      setWfhMode(cfg.wfhMode || 'custom');
      setWfhAlarmTime(cfg.wfhAlarmTime || '07:30');
      setPreHolidayReminder(cfg.preHolidayReminder);
      setCustomSoundUri(cfg.customSoundUri);
      setCustomSoundName(cfg.customSoundName);
    } catch (err) {
      console.error('Error loading smart alarm config in modal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickCustomSound = async () => {
    try {
      triggerHaptic('impact-light');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const saved = await saveCustomAlarmSound(asset.uri, asset.name);
        setCustomSoundUri(saved.uri);
        setCustomSoundName(saved.name);
        triggerHaptic('success');
        success('เลือกไฟล์เสียงสำเร็จ', `ใช้เสียง: ${saved.name}`);
      }
    } catch (err) {
      console.error('Error picking custom sound:', err);
      error('ไม่สามารถเลือกไฟล์เสียงได้', 'โปรดตรวจสอบไฟล์และลองใหม่อีกครั้ง');
    }
  };

  const handleResetToDefaultSound = async () => {
    try {
      triggerHaptic('impact-light');
      if (isPlayingPreview) {
        try {
          previewPlayer.pause();
          previewPlayer.seekTo(0);
        } catch (e) {}
        setIsPlayingPreview(false);
      }
      await resetCustomAlarmSound();
      setCustomSoundUri(undefined);
      setCustomSoundName(undefined);
      success('คืนค่าสำเร็จ', 'กลับไปใช้เสียงเริ่มต้น (alarm.wav)');
    } catch (err) {
      console.error('Error resetting custom sound:', err);
    }
  };

  // Construct draft config in real time for dynamic preview
  const draftConfig: SmartAlarmConfig = useMemo(() => {
    return {
      enabled,
      alarmTime,
      useWeekendWorkAlarm,
      weekendWorkAlarmTime,
      skipRegularOff,
      skipWeekends,
      skipPublicHolidays,
      skipApprovedLeaves,
      wfhMode,
      wfhAlarmTime,
      preHolidayReminder,
      snoozeMinutes: 10,
      vibrate: true,
      soundEnabled: true,
      customSoundUri,
      customSoundName,
    };
  }, [
    enabled,
    alarmTime,
    useWeekendWorkAlarm,
    weekendWorkAlarmTime,
    skipRegularOff,
    skipWeekends,
    skipPublicHolidays,
    skipApprovedLeaves,
    wfhMode,
    wfhAlarmTime,
    preHolidayReminder,
    customSoundUri,
    customSoundName,
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

        {/* Section 1: Workday Alarm Time (Normal) */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={Briefcase} size={15} color="#2563eb" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.text,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              เวลาปลุกวันทำงานปกติ
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: colors.textSecondary,
              fontFamily: 'Sarabun_400Regular',
            }}
          >
            เวลาตื่นสำหรับการเดินทางไปทำงานตามปกติ
          </Text>
          <TimeInput
            label="เวลาปลุกวันทำงานปกติ"
            value={alarmTime}
            onChange={setAlarmTime}
            placeholder="06:30"
          />
        </View>

        {/* Section 1.5: Weekend Workday Alarm Time (Car / Light Traffic) */}
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
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={Car} size={15} color="#6366f1" />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.text,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  วันทำงาน เสาร์ - อาทิตย์ (รถไม่ติด)
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                  marginTop: 2,
                }}
              >
                ตื่นสายกว่าวันธรรมดาได้ เพราะการจราจรคล่องตัว รถไม่ติด
              </Text>
            </View>
            <Switch
              value={useWeekendWorkAlarm}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setUseWeekendWorkAlarm(val);
              }}
            />
          </View>

          {useWeekendWorkAlarm ? (
            <View style={{ marginTop: 2 }}>
              <TimeInput
                label="เวลาปลุกวันทำงาน เสาร์-อาทิตย์"
                value={weekendWorkAlarmTime}
                onChange={setWeekendWorkAlarmTime}
                placeholder="07:00"
              />
              <Text
                style={{
                  fontSize: 11,
                  color: '#6366f1',
                  fontFamily: 'Sarabun_500Medium',
                  marginTop: 4,
                }}
              >
                มีผลเฉพาะวันเสาร์หรืออาทิตย์ที่ต้องเดินทางไปทำงาน (ไม่ใช่ WFH)
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                fontFamily: 'Sarabun_400Regular',
              }}
            >
              (ใช้เวลาเดียวกับวันทำงานปกติ: {alarmTime} น.)
            </Text>
          )}
        </View>

        {/* Section 2: WFH Alarm Time */}
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
              เวลาปลุกวันทำงานที่บ้าน (Work From Home - WFH)
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: colors.textSecondary,
              fontFamily: 'Sarabun_400Regular',
            }}
          >
            ไม่ต้องเดินทาง สามารถตั้งเวลาตื่นสบายๆ แยกอิสระ หรือเลือกงดปลุกได้
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { key: 'custom' as SmartAlarmWfhMode, label: 'ปลุกเวลา WFH' },
              { key: 'normal' as SmartAlarmWfhMode, label: 'เวลาเดียวกับวันปกติ' },
              { key: 'skip' as SmartAlarmWfhMode, label: 'งดปลุกวัน WFH' },
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
                      fontSize: 11,
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
            <View style={{ marginTop: 2 }}>
              <TimeInput
                label="เวลาปลุกเฉพาะวัน WFH"
                value={wfhAlarmTime}
                onChange={setWfhAlarmTime}
                placeholder="07:30"
              />
              <Text
                style={{
                  fontSize: 11,
                  color: '#10b981',
                  fontFamily: 'Sarabun_500Medium',
                  marginTop: 4,
                }}
              >
                มีผลในทุกวันที่ระบุเป็น WFH ในปฏิทิน (รวมถึงเสาร์-อาทิตย์)
              </Text>
            </View>
          )}
        </View>

        {/* Section 3: Smart Skip Rules */}
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
              กฎการงดปลุกอัตโนมัติ (Smart Skip Rules):
            </Text>
          </View>

          {/* Rule 1: Calendar Regular Day Off */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 2,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={Coffee} size={14} color="#64748b" />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text,
                    fontFamily: 'Sarabun_600SemiBold',
                  }}
                >
                  งดปลุกวันหยุดปกติ (ตามปฏิทิน)
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                  marginTop: 2,
                }}
              >
                วันที่กดตั้งเป็น "หยุดปกติ" ในปฏิทิน (สำหรับวันหยุดตามรอบกะ/เวร)
              </Text>
            </View>
            <Switch
              value={skipRegularOff}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setSkipRegularOff(val);
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={Calendar} size={14} color="#2563eb" />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text,
                    fontFamily: 'Sarabun_600SemiBold',
                  }}
                >
                  งดปลุกวันเสาร์ - อาทิตย์ (อัตโนมัติ)
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                  marginTop: 2,
                }}
              >
                ปิดไว้เป็นค่าเริ่มต้น เพื่อให้อิงวันทำงานและวันหยุดตามปฏิทินของคุณ 100% (วันอาทิตย์หรือเสาร์ที่ไม่ได้กำหนดเป็นวันหยุดในปฏิทินจะปลุกตามปกติ)
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

          {/* Rule 3: Public Holidays */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 2,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={Sparkles} size={14} color="#f59e0b" />
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
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                  marginTop: 2,
                }}
              >
                อิงตามวันหยุดราชการและประเพณีในระบบ
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

          {/* Rule 4: Approved Leaves */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 2,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={Palmtree} size={14} color="#db2777" />
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
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                  marginTop: 2,
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



        {/* Section 5: Battery Optimization Guide (Android) */}
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setShowBatteryGuide((prev) => !prev);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Icon name={BatteryCharging} size={16} color="#f59e0b" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: colors.text,
                      fontFamily: 'Sarabun_700Bold',
                    }}
                  >
                    การตั้งค่าแบตเตอรี่ (ให้เตือนตรงเวลาแม้ปิดแอพ)
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      fontFamily: 'Sarabun_400Regular',
                    }}
                  >
                    ตั้งค่าให้ Android ไม่บล็อกการทำงานเมื่อปิดแอพ
                  </Text>
                </View>
              </View>
              <Icon
                name={showBatteryGuide ? ChevronUp : ChevronDown}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showBatteryGuide && (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingBottom: 14,
                  gap: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 11.5,
                    lineHeight: 18,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_400Regular',
                  }}
                >
                  บน Android หากต้องการให้ระบบแจ้งเตือนและส่งเสียงเตือนได้ตรงเวลา 100% แม้ปัดปิดแอพไปแล้ว แนะนำให้ตั้งค่าการใช้แบตเตอรี่ของแอพเป็น <Text style={{ fontWeight: '700', color: colors.text }}>"ไม่จำกัด (Unrestricted)"</Text>:
                </Text>

                <View style={{ gap: 4, paddingLeft: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sarabun_500Medium' }}>
                    1. กดปุ่ม "เปิดหน้าตั้งค่าแอพ" ด้านล่าง
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sarabun_500Medium' }}>
                    2. เลือกเมนู "แบตเตอรี่ (Battery)" หรือ "การประหยัดพลังงาน"
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sarabun_500Medium' }}>
                    3. เลือกตัวเลือก "ไม่จำกัด (Unrestricted / No restrictions)"
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('impact-light');
                    openAppBatterySettings();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a',
                    marginTop: 4,
                  }}
                >
                  <Icon name={ExternalLink} size={14} color="#d97706" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#d97706',
                      fontFamily: 'Sarabun_700Bold',
                    }}
                  >
                    เปิดหน้าตั้งค่าแอพใน Android
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Section 5.5: Lock Screen & Pop-up Permission Guide (Xiaomi / Oppo / Vivo / Android 14) */}
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setShowLockScreenGuide((prev) => !prev);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Icon name={ShieldCheck} size={16} color="#3b82f6" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: colors.text,
                      fontFamily: 'Sarabun_700Bold',
                    }}
                  >
                    การตั้งค่าให้เด้งเต็มจอ (Xiaomi / Vivo / Oppo)
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      fontFamily: 'Sarabun_400Regular',
                    }}
                  >
                    เปิดสิทธิ์แสดงหน้าต่างปลุกบนหน้าจอล็อกทันที
                  </Text>
                </View>
              </View>
              <Icon
                name={showLockScreenGuide ? ChevronUp : ChevronDown}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showLockScreenGuide && (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingBottom: 14,
                  gap: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 11.5,
                    lineHeight: 18,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_400Regular',
                  }}
                >
                  บนมือถือเช่น <Text style={{ fontWeight: '700', color: colors.text }}>Xiaomi (HyperOS / MIUI), Vivo, Oppo</Text> ระบบจะบล็อกไม่ให้แอพเปิดหน้าต่างเด้งขึ้นมาเองขณะล็อกหน้าจอเป็นค่าเริ่มต้น (ทำให้เห็นเป็นแค่แถบการแจ้งเตือน) หากต้องการให้เด้งเต็มจออัตโนมัติ:
                </Text>

                <View style={{ gap: 5, paddingLeft: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sarabun_500Medium' }}>
                    1. กดปุ่ม <Text style={{ fontWeight: '700' }}>"เปิดหน้าตั้งค่าสิทธิ์บนหน้าจอล็อก"</Text> ด้านล่าง
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sarabun_500Medium' }}>
                    2. ไปที่เมนู <Text style={{ fontWeight: '700', color: '#2563eb' }}>"สิทธิ์อื่นๆ (Other permissions)"</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sarabun_500Medium' }}>
                    3. ติ๊กเปิด <Text style={{ fontWeight: '700', color: '#16a34a' }}>"แสดงบนหน้าจอล็อก (Show on Lock screen)"</Text> ให้เป็นสีเขียว
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sarabun_500Medium' }}>
                    4. ติ๊กเปิด <Text style={{ fontWeight: '700', color: '#16a34a' }}>"แสดงหน้าต่างป๊อปอัปขณะทำงานในเบื้องหลัง"</Text> ให้เป็นสีเขียว
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={async () => {
                    triggerHaptic('impact-light');
                    if (isFullScreenAlarmAvailable) {
                      await FullScreenAlarm.openLockScreenPermissionSettings();
                    } else {
                      openAppBatterySettings();
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe',
                    marginTop: 4,
                  }}
                >
                  <Icon name={ExternalLink} size={14} color="#2563eb" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#2563eb',
                      fontFamily: 'Sarabun_700Bold',
                    }}
                  >
                    เปิดหน้าตั้งค่าสิทธิ์บนหน้าจอล็อก
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Section 5.6: เสียงนาฬิกาปลุก & อัปโหลดเสียงเอง (Alarm Sound Selection) */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Icon name={Music} size={16} color="#8b5cf6" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.text,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  เสียงนาฬิกาปลุก (Alarm Sound)
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_400Regular',
                  }}
                >
                  ดังแม้เปิดโหมดเงียบ / สั่น (Bypass Silent Mode)
                </Text>
              </View>
            </View>

            {/* Current Sound Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: customSoundName
                  ? (isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff')
                  : (isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff'),
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: customSoundName
                  ? (isDark ? 'rgba(139, 92, 246, 0.4)' : '#d8b4fe')
                  : (isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'),
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: customSoundName ? '#8b5cf6' : '#2563eb',
                  fontFamily: 'Sarabun_700Bold',
                  maxWidth: 130,
                }}
              >
                {customSoundName || 'เสียงเริ่มต้น (alarm.wav)'}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Pick Audio File & Preview Audio */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handlePickCustomSound}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icon name={Upload} size={14} color={colors.text} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.text,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                เลือกไฟล์เสียง (.mp3 / .wav)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPreview}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                backgroundColor: isPlayingPreview ? '#ef4444' : '#8b5cf6',
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: 9,
              }}
            >
              <Icon name={isPlayingPreview ? Square : Play} size={13} color="#ffffff" />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#ffffff',
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                {isPlayingPreview ? 'หยุดฟัง' : 'ทดลองฟัง'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reset to default sound if custom sound is active */}
          {!!customSoundName && (
            <TouchableOpacity
              onPress={handleResetToDefaultSound}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 6,
              }}
            >
              <Icon name={RotateCcw} size={12} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 11.5,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_500Medium',
                  textDecorationLine: 'underline',
                }}
              >
                เปลี่ยนกลับเป็นเสียงเริ่มต้น (alarm.wav)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Test Alarm Sound & Full-Screen Ringing Card */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#f0f7ff',
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={Volume2} size={16} color="#2563eb" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.text,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              ทดสอบเสียงปลุกและหน้าต่างเต็มจอ:
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11.5,
              lineHeight: 18,
              color: colors.textSecondary,
              fontFamily: 'Sarabun_400Regular',
            }}
          >
            ทดสอบฟังเสียง Alarm Tone (ความยาว ~34 วินาที) ที่คมชัด สั่นต่อเนื่อง และทดสอบปุ่มปิด/เลื่อนปลุก 10 นาที บนหน้าจอจริงได้ทันที
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('impact-medium');
                setIsTestingAlarmModal(true);
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: '#2563eb',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
              }}
            >
              <Icon name={Volume2} size={15} color="#ffffff" />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '700',
                  color: '#ffffff',
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                เปิดหน้าต่างปลุกทันที
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                triggerHaptic('impact-light');
                await triggerTestSmartAlarm();
                success('ส่งการแจ้งเตือนแล้ว', 'ระบบจะส่งแถบเตือนมาที่หน้าจอใน 3 วินาที');
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icon name={Bell} size={14} color={colors.text} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                ยิงแถบเตือน (3 วิ)
              </Text>
            </TouchableOpacity>
          </View>
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

              let badgeBg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff';
              let badgeColor = '#2563eb';
              let statusIcon = Clock;
              let statusText = `ปลุก ${item.alarmTime} น.`;

              if (item.status === 'weekend_alarm') {
                badgeBg = isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff';
                badgeColor = '#6366f1';
                statusIcon = Car;
                statusText = `ปลุก ${item.alarmTime} น. (ส.-อา. รถไม่ติด)`;
              } else if (item.status === 'wfh_alarm') {
                badgeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';
                badgeColor = '#10b981';
                statusIcon = Home;
                statusText = `ปลุก ${item.alarmTime} น. (WFH)`;
              } else if (item.status === 'skip_regular_off') {
                badgeBg = isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9';
                badgeColor = '#64748b';
                statusIcon = Coffee;
                statusText = `งดปลุก (${item.reason || 'วันหยุดปกติ'})`;
              } else if (item.status === 'skip_holiday') {
                badgeBg = isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7';
                badgeColor = '#d97706';
                statusIcon = Sparkles;
                statusText = `งดปลุก (${item.reason})`;
              } else if (item.status === 'skip_leave') {
                badgeBg = isDark ? 'rgba(236, 72, 153, 0.15)' : '#fdf2f8';
                badgeColor = '#db2777';
                statusIcon = Palmtree;
                statusText = `งดปลุก (${item.reason})`;
              } else if (item.status === 'skip_weekend') {
                badgeBg = isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9';
                badgeColor = '#64748b';
                statusIcon = Moon;
                statusText = `งดปลุก (วันหยุดสัปดาห์)`;
              } else if (item.status === 'skip_wfh') {
                badgeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';
                badgeColor = '#10b981';
                statusIcon = Home;
                statusText = `งดปลุก (วัน WFH)`;
              }

              if (!enabled) {
                badgeBg = isDark ? 'rgba(100, 116, 139, 0.1)' : '#f8fafc';
                badgeColor = colors.textSecondary;
                statusIcon = BellOff;
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
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: badgeBg,
                    }}
                  >
                    <Icon name={statusIcon} size={11} color={badgeColor} />
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

      <AlarmRingingModal
        visible={isTestingAlarmModal}
        alarmTime={alarmTime}
        reason="ทดสอบระบบนาฬิกาปลุก"
        customSoundUri={customSoundUri}
        onDismiss={() => setIsTestingAlarmModal(false)}
      />
    </BottomSheet>
  );
};
