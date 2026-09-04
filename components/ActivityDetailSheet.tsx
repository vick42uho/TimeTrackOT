import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { NativeAlert } from '@/components/ui/alert';
import { TimeInput } from '@/components/TimeInput';
import { useThemeContext } from '@/components/ThemeProvider';
import { triggerHaptic } from '@/hooks/useHaptics';
import { useDatabase } from '@/hooks/useDatabase';
import { useTimeCalculation } from '@/hooks/useTimeCalculation';
import {
  scheduleActivityReminder,
  cancelActivityReminder,
} from '@/services/notificationService';
import { extractUrls, handleOpenURL } from '@/utils/urlHelper';
import { Activity, ActivityCategory } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Bell,
  BellOff,
  FileText,
  Trash2,
  Edit3,
  Save,
  X,
  ExternalLink,
  Briefcase,
  Dumbbell,
  Home,
  Utensils,
  Compass,
  Tag,
} from 'lucide-react-native';

export const ACTIVITY_CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; shortLabel: string; icon: any; color: string; bgColor: string }
> = {
  work: { label: 'งาน / ประชุม', shortLabel: 'งาน', icon: Briefcase, color: '#3b82f6', bgColor: '#eff6ff' },
  exercise: { label: 'ออกกำลังกาย', shortLabel: 'ออกกำลัง', icon: Dumbbell, color: '#10b981', bgColor: '#ecfdf5' },
  personal: { label: 'ธุระส่วนตัว / ครอบครัว', shortLabel: 'ธุระ', icon: Home, color: '#ec4899', bgColor: '#fdf2f8' },
  dining: { label: 'กินข้าว / สังสรรค์', shortLabel: 'กินข้าว', icon: Utensils, color: '#f59e0b', bgColor: '#fffbeb' },
  travel: { label: 'เที่ยว / ทำบุญ', shortLabel: 'เที่ยว/วัด', icon: Compass, color: '#8b5cf6', bgColor: '#f5f3ff' },
  general: { label: 'ทั่วไป', shortLabel: 'ทั่วไป', icon: Tag, color: '#64748b', bgColor: '#f8fafc' },
};

export const getActivityCategoryMeta = (cat?: string) => {
  if (!cat) return ACTIVITY_CATEGORY_CONFIG.general;
  if (cat in ACTIVITY_CATEGORY_CONFIG) {
    return ACTIVITY_CATEGORY_CONFIG[cat as ActivityCategory];
  }
  if (cat === 'meeting') return ACTIVITY_CATEGORY_CONFIG.work;
  if (cat === 'leisure') return ACTIVITY_CATEGORY_CONFIG.dining;
  if (cat === 'errand') return ACTIVITY_CATEGORY_CONFIG.personal;
  return ACTIVITY_CATEGORY_CONFIG.general;
};

const REMINDER_OPTIONS = [
  { label: 'ไม่เตือน', value: null },
  { label: 'ตรงเวลา', value: 0 },
  { label: 'ก่อน 15 นาที', value: 15 },
  { label: 'ก่อน 30 นาที', value: 30 },
  { label: 'ก่อน 1 ชม.', value: 60 },
  { label: 'ก่อน 1 วัน', value: 1440 },
];

interface ActivityDetailSheetProps {
  visible: boolean;
  activity: Activity | null;
  defaultDate?: string;
  isCreateMode?: boolean;
  onClose: () => void;
  onActivityUpdated?: () => void;
  onNavigateToCalendar?: (dateStr: string) => void;
}

export const ActivityDetailSheet: React.FC<ActivityDetailSheetProps> = ({
  visible,
  activity,
  defaultDate,
  isCreateMode = false,
  onClose,
  onActivityUpdated,
  onNavigateToCalendar,
}) => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  const { formatDateThai, getThaiDayName } = useTimeCalculation();
  const { saveActivity, updateActivity, deleteActivity } = useDatabase();

  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('general');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(15);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  // Sync state when activity or mode changes
  useEffect(() => {
    if (visible) {
      if (activity && !isCreateMode) {
        setIsEditing(false);
        setTitle(activity.title || '');
        const rawCat = (activity.category as string) || '';
        const mappedCat: ActivityCategory =
          rawCat in ACTIVITY_CATEGORY_CONFIG
            ? (rawCat as ActivityCategory)
            : rawCat === 'meeting'
            ? 'work'
            : rawCat === 'leisure'
            ? 'dining'
            : rawCat === 'errand'
            ? 'personal'
            : 'general';
        setCategory(mappedCat);
        setIsAllDay(!!activity.isAllDay);
        setStartTime(activity.startTime || '09:00');
        setEndTime(activity.endTime || '10:00');
        setReminderMinutes(
          activity.reminderMinutes !== undefined ? activity.reminderMinutes : null
        );
        setLocation(activity.location || '');
        setNote(activity.note || '');
      } else {
        // Create mode
        setIsEditing(true);
        setTitle('');
        setCategory('general');
        setIsAllDay(false);
        setStartTime('09:00');
        setEndTime('10:00');
        setReminderMinutes(15);
        setLocation('');
        setNote('');
      }
    }
  }, [visible, activity, isCreateMode]);

  const categoryMeta = useMemo(() => {
    return getActivityCategoryMeta(isEditing ? category : activity?.category);
  }, [category, activity?.category, isEditing]);

  const CategoryIcon = categoryMeta.icon;

  const handleOpenMap = (locText: string) => {
    if (!locText) return;
    const urls = extractUrls(locText);
    if (urls.length > 0) {
      handleOpenURL(urls[0]);
    } else {
      // Open Google Maps search query
      const query = encodeURI(locText.trim());
      const mapUrl = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`,
      });
      Linking.openURL(mapUrl).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
    }
  };

  const handleDelete = () => {
    if (!activity?.id) return;

    NativeAlert.alert(
      'ยืนยันการลบกิจกรรม',
      `คุณต้องการลบนัดหมาย "${activity.title}" ออกจากระบบหรือไม่? การแจ้งเตือนจะถูกยกเลิกด้วย`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบกิจกรรม',
          style: 'destructive',
          onPress: async () => {
            triggerHaptic('success');
            if (activity.notificationId) {
              await cancelActivityReminder(activity.notificationId);
            }
            await deleteActivity(activity.id!);
            onClose();
            onActivityUpdated?.();
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      NativeAlert.alert('กรุณากรอกข้อมูล', 'กรุณาระบุชื่อกิจกรรมหรือนัดหมาย');
      return;
    }

    setIsSaving(true);
    try {
      triggerHaptic('impact-light');

      const targetDate = activity?.date || defaultDate || new Date().toISOString().split('T')[0];

      if (activity?.id && !isCreateMode) {
        // Edit existing
        const updatedFields: Partial<Activity> = {
          title: title.trim(),
          category,
          isAllDay,
          startTime: isAllDay ? undefined : startTime,
          endTime: isAllDay ? undefined : endTime,
          reminderMinutes,
          location: location.trim() || undefined,
          note: note.trim() || undefined,
        };

        if (activity.notificationId) {
          await cancelActivityReminder(activity.notificationId);
        }

        let newNotificationId: string | undefined;
        if (reminderMinutes !== null) {
          newNotificationId = await scheduleActivityReminder({
            ...activity,
            ...updatedFields,
          });
        }

        await updateActivity(activity.id, {
          ...updatedFields,
          notificationId: newNotificationId,
        });
      } else {
        // Create new
        const newActData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> = {
          title: title.trim(),
          date: targetDate,
          category,
          isAllDay,
          startTime: isAllDay ? undefined : startTime,
          endTime: isAllDay ? undefined : endTime,
          reminderMinutes,
          location: location.trim() || undefined,
          note: note.trim() || undefined,
        };

        const newId = await saveActivity(newActData);

        if (reminderMinutes !== null) {
          const notificationId = await scheduleActivityReminder({
            ...newActData,
            id: newId,
          });
          if (notificationId) {
            await updateActivity(newId, { notificationId });
          }
        }
      }

      setIsSaving(false);
      onClose();
      onActivityUpdated?.();
    } catch (err) {
      console.error('Error saving activity:', err);
      setIsSaving(false);
      NativeAlert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกกิจกรรมได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Detected URLs in note
  const noteUrls = useMemo(() => {
    const noteText = isEditing ? note : activity?.note;
    return extractUrls(noteText);
  }, [isEditing, note, activity?.note]);

  // Reminder label
  const reminderText = useMemo(() => {
    const mins = isEditing ? reminderMinutes : activity?.reminderMinutes;
    if (mins === null || mins === undefined) return 'ไม่แจ้งเตือน';
    if (mins === 0) return 'เตือนตรงเวลา';
    if (mins === 15) return 'เตือนล่วงหน้า 15 นาที';
    if (mins === 30) return 'เตือนล่วงหน้า 30 นาที';
    if (mins === 60) return 'เตือนล่วงหน้า 1 ชั่วโมง';
    if (mins === 1440) return 'เตือนล่วงหน้า 1 วัน';
    return `เตือนล่วงหน้า ${mins} นาที`;
  }, [isEditing, reminderMinutes, activity?.reminderMinutes]);

  const targetDateStr = activity?.date || defaultDate || new Date().toISOString().split('T')[0];
  const thaiDayName = getThaiDayName(targetDateStr);
  const formattedDate = formatDateThai(targetDateStr);

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      title={
        isCreateMode || !activity
          ? 'เพิ่มกิจกรรม & นัดหมาย'
          : isEditing
          ? 'แก้ไขกิจกรรม & นัดหมาย'
          : 'รายละเอียดกิจกรรม'
      }
      footer={
        isEditing ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Button
              variant="outline"
              icon={X}
              style={{ flex: 1 }}
              onPress={() => {
                triggerHaptic('impact-light');
                if (isCreateMode || !activity) {
                  onClose();
                } else {
                  setIsEditing(false);
                }
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
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {activity?.id && (
              <Button
                variant="destructive"
                icon={Trash2}
                size="icon"
                onPress={handleDelete}
                style={{ width: 44, height: 44 }}
              />
            )}
            {onNavigateToCalendar && (
              <Button
                variant="outline"
                icon={Calendar}
                style={{ flex: 1 }}
                onPress={() => {
                  triggerHaptic('impact-light');
                  onClose();
                  onNavigateToCalendar(targetDateStr);
                }}
              >
                ดูในปฏิทิน
              </Button>
            )}
            <Button
              variant="default"
              icon={Edit3}
              style={{ flex: 1 }}
              onPress={() => {
                triggerHaptic('impact-light');
                setIsEditing(true);
              }}
            >
              แก้ไข
            </Button>
          </View>
        )
      }
    >
      {isEditing ? (
        /* ================= EDIT / CREATE MODE ================= */
        <View style={{ gap: 14, paddingBottom: 24 }}>
          {/* Title */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                marginBottom: 6,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              ชื่อกิจกรรม / นัดหมาย *
            </Text>
            <Input
              placeholder="เช่น ประชุมทีม, ไปหาหมอ, กินข้าวกับลูกค้า"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Chips */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                marginBottom: 8,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              หมวดหมู่กิจกรรม:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(ACTIVITY_CATEGORY_CONFIG) as ActivityCategory[]).map((cat) => {
                const isSel = category === cat;
                const cfg = ACTIVITY_CATEGORY_CONFIG[cat];
                const IconComp = cfg.icon;

                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      triggerHaptic('selection');
                      setCategory(cat);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 999,
                      borderWidth: isSel ? 1.5 : 1,
                      borderColor: isSel ? cfg.color : colors.border,
                      backgroundColor: isSel
                        ? isDark
                          ? `${cfg.color}30`
                          : cfg.bgColor
                        : colors.card,
                    }}
                  >
                    <IconComp size={14} color={isSel ? cfg.color : colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSel ? '700' : '500',
                        color: isSel ? cfg.color : colors.text,
                        fontFamily: isSel ? 'Sarabun_700Bold' : 'Sarabun_500Medium',
                      }}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* All Day Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 4,
            }}
          >
            <View>
              <Text
                style={{
                  fontWeight: '600',
                  color: colors.text,
                  fontSize: 14,
                  fontFamily: 'Sarabun_600SemiBold',
                }}
              >
                กิจกรรมตลอดวัน
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_400Regular',
                }}
              >
                ไม่ระบุเวลาเริ่มต้นและสิ้นสุด
              </Text>
            </View>
            <Switch value={isAllDay} onValueChange={setIsAllDay} />
          </View>

          {/* Time Picker Range (if not all day) */}
          {!isAllDay && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TimeInput
                  label="เวลาเริ่มต้น"
                  value={startTime}
                  onChange={setStartTime}
                  placeholder="09:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TimeInput
                  label="เวลาสิ้นสุด"
                  value={endTime}
                  onChange={setEndTime}
                  placeholder="10:00"
                />
              </View>
            </View>
          )}

          {/* Reminder Selector */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Icon name={Bell} size={13} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.textSecondary,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                การแจ้งเตือน (Alert Reminder):
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REMINDER_OPTIONS.map((opt) => {
                const isSel = reminderMinutes === opt.value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    onPress={() => {
                      triggerHaptic('selection');
                      setReminderMinutes(opt.value);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: isSel ? 1.5 : 1,
                      borderColor: isSel ? '#f59e0b' : colors.border,
                      backgroundColor: isSel
                        ? isDark
                          ? 'rgba(245, 158, 11, 0.25)'
                          : '#fef3c7'
                        : colors.card,
                    }}
                  >
                    <Icon
                      name={opt.value === null ? BellOff : Bell}
                      size={12}
                      color={isSel ? '#d97706' : colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSel ? '700' : '500',
                        color: isSel ? '#d97706' : colors.text,
                        fontFamily: isSel ? 'Sarabun_700Bold' : 'Sarabun_500Medium',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Location */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                marginBottom: 6,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              สถานที่ / พิกัด (ไม่บังคับ)
            </Text>
            <Input
              placeholder="เช่น ห้องประชุมชั้น 4, สวนลุมพินี, ร้านกาแฟ"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Note */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                marginBottom: 6,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              บันทึกช่วยจำ (ไม่บังคับ)
            </Text>
            <Input
              placeholder="รายละเอียดเพิ่มเติม หรือลิงก์..."
              value={note}
              onChangeText={setNote}
              type="textarea"
              rows={2}
            />
          </View>
        </View>
      ) : (
        /* ================= VIEW DETAILS MODE ================= */
        <View style={{ gap: 16, paddingBottom: 24 }}>
          {/* Header Card: Category Badge & Title */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Category Tag */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: isDark ? `${categoryMeta.color}25` : categoryMeta.bgColor,
                  borderWidth: 1,
                  borderColor: isDark ? `${categoryMeta.color}40` : `${categoryMeta.color}30`,
                }}
              >
                <Icon name={CategoryIcon} size={13} color={categoryMeta.color} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: categoryMeta.color,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  {categoryMeta.label}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.text,
                fontFamily: 'Sarabun_700Bold',
                lineHeight: 24,
              }}
            >
              {activity?.title}
            </Text>
          </View>

          {/* Details Rows */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            {/* Row 1: Date */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={Calendar} size={16} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_500Medium',
                  }}
                >
                  วันที่
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.text,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  {thaiDayName ? `วัน${thaiDayName}ที่ ` : ''}{formattedDate}
                </Text>
              </View>
            </View>

            {/* Row 2: Time */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={Clock} size={16} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_500Medium',
                  }}
                >
                  เวลา
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.text,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  {activity?.isAllDay || (!activity?.startTime && !activity?.endTime)
                    ? 'ตลอดทั้งวัน'
                    : activity?.startTime && activity?.endTime
                    ? `${activity.startTime} - ${activity.endTime} น.`
                    : activity?.startTime
                    ? `${activity.startTime} น.`
                    : `ถึง ${activity?.endTime} น.`}
                </Text>
              </View>
            </View>

            {/* Row 3: Location (if exists) */}
            {activity?.location ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenMap(activity.location!)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={MapPin} size={16} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      fontFamily: 'Sarabun_500Medium',
                    }}
                  >
                    สถานที่ / พิกัด (แตะเพื่อเปิดแผนที่)
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#2563eb',
                      fontFamily: 'Sarabun_700Bold',
                    }}
                  >
                    {activity.location}
                  </Text>
                </View>
                <Icon name={ExternalLink} size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}

            {/* Row 4: Reminder */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: activity?.note ? 1 : 0,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={activity?.reminderMinutes !== null && activity?.reminderMinutes !== undefined ? Bell : BellOff}
                  size={16}
                  color="#f59e0b"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_500Medium',
                  }}
                >
                  การแจ้งเตือน
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text,
                    fontFamily: 'Sarabun_600SemiBold',
                  }}
                >
                  {reminderText}
                </Text>
              </View>
            </View>

            {/* Row 5: Note (if exists) */}
            {activity?.note ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Icon name={FileText} size={16} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      fontFamily: 'Sarabun_500Medium',
                      marginBottom: 2,
                    }}
                  >
                    บันทึกช่วยจำ
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.text,
                      fontFamily: 'Sarabun_400Regular',
                      lineHeight: 20,
                    }}
                  >
                    {activity.note}
                  </Text>

                  {/* Clickable links if any */}
                  {noteUrls.length > 0 && (
                    <View style={{ marginTop: 8, gap: 6 }}>
                      {noteUrls.map((url, uIdx) => (
                        <TouchableOpacity
                          key={uIdx}
                          activeOpacity={0.7}
                          onPress={() => handleOpenURL(url)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Icon name={ExternalLink} size={12} color="#3b82f6" />
                          <Text
                            style={{
                              fontSize: 11,
                              color: '#3b82f6',
                              fontFamily: 'Sarabun_600SemiBold',
                            }}
                            numberOfLines={1}
                          >
                            {url}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </BottomSheet>
  );
};
