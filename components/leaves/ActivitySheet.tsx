import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Save, Bell, BellOff } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TimeInput } from '../TimeInput';
import { ACTIVITY_CATEGORY_CONFIG, REMINDER_OPTIONS } from './leavesConstants';
import type { Activity, ActivityCategory } from '../../types';

interface ActivitySheetProps {
  isVisible: boolean;
  onClose: () => void;
  editingActivity: Activity | null;
  selectedCalendarDate: string;
  formatDateThai: (d: string) => string;
  actTitle: string;
  onChangeActTitle: (v: string) => void;
  actCategory: ActivityCategory;
  onChangeActCategory: (c: ActivityCategory) => void;
  actIsAllDay: boolean;
  onChangeActIsAllDay: (v: boolean) => void;
  actStartTime: string;
  onChangeActStartTime: (v: string) => void;
  actEndTime: string;
  onChangeActEndTime: (v: string) => void;
  actReminder: number | null;
  onChangeActReminder: (v: number | null) => void;
  actLocation: string;
  onChangeActLocation: (v: string) => void;
  actNote: string;
  onChangeActNote: (v: string) => void;
  colors: any;
  isDark: boolean;
  onSave: () => void;
}

export const ActivitySheet = React.memo(function ActivitySheet({
  isVisible,
  onClose,
  editingActivity,
  selectedCalendarDate,
  formatDateThai,
  actTitle,
  onChangeActTitle,
  actCategory,
  onChangeActCategory,
  actIsAllDay,
  onChangeActIsAllDay,
  actStartTime,
  onChangeActStartTime,
  actEndTime,
  onChangeActEndTime,
  actReminder,
  onChangeActReminder,
  actLocation,
  onChangeActLocation,
  actNote,
  onChangeActNote,
  colors,
  isDark,
  onSave,
}: ActivitySheetProps) {
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.96]}
      title={editingActivity ? 'แก้ไขกิจกรรม / นัดหมาย' : `เพิ่มกิจกรรม (${formatDateThai(selectedCalendarDate)})`}
      footer={
        <View style={styles.footerRow}>
          <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={onClose}>
            ยกเลิก
          </Button>
          <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={onSave}>
            {editingActivity ? 'บันทึกการแก้ไข' : 'บันทึกนัดหมาย'}
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <View>
          <Text variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
            ชื่อกิจกรรม / นัดหมาย *
          </Text>
          <Input
            placeholder="เช่น นัดวิ่งกับเพื่อน, ประชุมทีม, กินข้าวกับแฟน"
            value={actTitle}
            onChangeText={onChangeActTitle}
          />
        </View>

        <View>
          <Text variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
            หมวดหมู่กิจกรรม:
          </Text>
          <View style={styles.chipWrap}>
            {(Object.keys(ACTIVITY_CATEGORY_CONFIG) as ActivityCategory[]).map((cat) => {
              const isSel = actCategory === cat;
              const cfg = ACTIVITY_CATEGORY_CONFIG[cat];
              const IconComponent = cfg.icon;

              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => onChangeActCategory(cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSel
                        ? isDark
                          ? `${cfg.color}30`
                          : cfg.bgColor
                        : colors.backgroundAlt,
                    },
                  ]}
                >
                  <IconComponent size={14} color={isSel ? cfg.color : colors.textSecondary} />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        fontWeight: isSel ? '700' : '500',
                        color: isSel ? cfg.color : colors.text,
                      },
                    ]}
                  >
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.allDayRow}>
          <View>
            <Text style={[styles.allDayTitle, { color: colors.text }]}>
              กิจกรรมตลอดวัน
            </Text>
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              ไม่ระบุเวลาเริ่มและสิ้นสุด
            </Text>
          </View>
          <Switch value={actIsAllDay} onValueChange={onChangeActIsAllDay} />
        </View>

        {!actIsAllDay && (
          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <TimeInput
                label="เวลาเริ่มต้น"
                value={actStartTime}
                onChange={onChangeActStartTime}
                placeholder="เลือกเวลาเริ่ม"
              />
            </View>
            <View style={styles.timeCol}>
              <TimeInput
                label="เวลาสิ้นสุด"
                value={actEndTime}
                onChange={onChangeActEndTime}
                placeholder="เลือกเวลาสิ้นสุด"
              />
            </View>
          </View>
        )}

        <View>
          <View style={styles.reminderHeader}>
            <Bell size={13} color={colors.textSecondary} />
            <Text variant="caption" style={[styles.reminderTitle, { color: colors.textSecondary }]}>
              การแจ้งเตือน (Alert Reminder):
            </Text>
          </View>
          <View style={styles.chipWrap}>
            {REMINDER_OPTIONS.map((opt) => {
              const isSel = actReminder === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  onPress={() => onChangeActReminder(opt.value)}
                  style={[
                    styles.reminderChip,
                    {
                      backgroundColor: isSel
                        ? isDark
                          ? 'rgba(245, 158, 11, 0.25)'
                          : '#fef3c7'
                        : colors.backgroundAlt,
                    },
                  ]}
                >
                  {opt.value === null ? (
                    <BellOff size={12} color={isSel ? '#d97706' : colors.textSecondary} />
                  ) : (
                    <Bell size={12} color={isSel ? '#d97706' : colors.textSecondary} />
                  )}
                  <Text
                    style={[
                      styles.reminderText,
                      {
                        fontWeight: isSel ? '700' : '500',
                        color: isSel ? '#d97706' : colors.text,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <Text variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
            สถานที่ (ไม่บังคับ)
          </Text>
          <Input
            placeholder="เช่น สวนรถไฟ, ห้องประชุม 2, ร้านอาหาร"
            value={actLocation}
            onChangeText={onChangeActLocation}
          />
        </View>

        <View>
          <Text variant="caption" style={[styles.label, { color: colors.textSecondary }]}>
            บันทึกช่วยจำ (ไม่บังคับ)
          </Text>
          <Input
            placeholder="ข้อความหรือรายละเอียดเพิ่มเติม..."
            value={actNote}
            onChangeText={onChangeActNote}
            type="textarea"
            rows={2}
          />
        </View>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  body: {
    gap: 14,
    paddingBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 0,
  },
  chipText: {
    fontSize: 13,
  },
  allDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  allDayTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCol: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  reminderTitle: {
    fontWeight: '600',
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0,
  },
  reminderText: {
    fontSize: 12,
  },
});
