import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Save } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { DatePicker, DateRange } from '@/components/ui/date-picker';
import { LEAVE_TYPE_OPTIONS } from './leavesConstants';
import type { LeaveDurationType, LeaveRequest, LeaveType } from '../../types';

interface LeaveSheetProps {
  isVisible: boolean;
  onClose: () => void;
  editingLeave?: LeaveRequest | null;
  leaveType: LeaveType;
  onChangeLeaveType: (t: LeaveType) => void;
  leaveDurationType: LeaveDurationType;
  onChangeDurationType: (t: LeaveDurationType) => void;
  leaveRange: DateRange | undefined;
  onChangeLeaveRange: (r: DateRange) => void;
  leaveReason: string;
  onChangeLeaveReason: (v: string) => void;
  colors: any;
  onSave: () => void;
}

const DURATION_OPTIONS: { type: LeaveDurationType; label: string }[] = [
  { type: 'full_day', label: 'เต็มวัน' },
  { type: 'half_day_morning', label: 'ครึ่งวันเช้า' },
  { type: 'half_day_afternoon', label: 'ครึ่งวันบ่าย' },
];

export const LeaveSheet = React.memo(function LeaveSheet({
  isVisible,
  onClose,
  editingLeave,
  leaveType,
  onChangeLeaveType,
  leaveDurationType,
  onChangeDurationType,
  leaveRange,
  onChangeLeaveRange,
  leaveReason,
  onChangeLeaveReason,
  colors,
  onSave,
}: LeaveSheetProps) {
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.96]}
      title={editingLeave ? 'แก้ไขการลา' : 'บันทึกการลา / ยื่นขอลา'}
      footer={
        <View style={styles.footerRow}>
          <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={onClose}>
            ยกเลิก
          </Button>
          <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={onSave}>
            {editingLeave ? 'บันทึกการแก้ไข' : 'บันทึกการลา'}
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <View>
          <Text variant="caption" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ประเภทการลา:
          </Text>
          <View style={styles.pillWrap}>
            {LEAVE_TYPE_OPTIONS.map((opt) => {
              const isSel = leaveType === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => onChangeLeaveType(opt.type)}
                  style={[
                    styles.leaveTypePill,
                    {
                      backgroundColor: isSel ? opt.color : colors.card,
                      borderColor: isSel ? opt.color : colors.border,
                    },
                  ]}
                >
                  <opt.icon size={16} color={isSel ? '#fff' : colors.text} />
                  <Text
                    variant="caption"
                    style={{
                      color: isSel ? '#fff' : colors.text,
                      fontWeight: isSel ? '700' : '500',
                      marginLeft: 6,
                    }}
                  >
                    {opt.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <Text variant="caption" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ระยะเวลาการลา:
          </Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.type}
                onPress={() => onChangeDurationType(d.type)}
                style={[
                  styles.durationPill,
                  {
                    flex: 1,
                    backgroundColor: leaveDurationType === d.type ? colors.primary : colors.card,
                    borderColor: leaveDurationType === d.type ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: leaveDurationType === d.type ? '#fff' : colors.text,
                    fontWeight: leaveDurationType === d.type ? '700' : '400',
                    textAlign: 'center',
                  }}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <DatePicker
          label="ช่วงวันที่ลา"
          mode="range"
          value={leaveRange}
          onChange={(r) => r && onChangeLeaveRange(r)}
        />

        <Input
          label="เหตุผลการลา (ไม่บังคับ)"
          placeholder="เช่น พักผ่อนประจำปี, ลาไปหาหมอ"
          value={leaveReason}
          onChangeText={onChangeLeaveReason}
        />
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
    gap: 16,
    paddingBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leaveTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
});
