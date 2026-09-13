import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, LogIn, LogOut, FileText } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TimeInput } from '../../components/TimeInput';

interface QuickPresetProps {
  colors: any;
  onPress: () => void;
  icon: any;
  iconColor: string;
  label: string;
  labelColor?: string;
}

const QuickPreset = React.memo(function QuickPreset({
  colors,
  onPress,
  icon: PresetIcon,
  iconColor,
  label,
  labelColor,
}: QuickPresetProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.presetBtn, { borderColor: colors.border, backgroundColor: colors.backgroundAlt }]}
    >
      <PresetIcon size={10} color={iconColor} />
      <Text style={[styles.presetText, { color: labelColor ?? colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

interface TimeColumnProps {
  dotColor: string;
  label: string;
  value: string;
  colors: any;
  scheduleTime?: string;
  scheduleIcon?: any;
  onChange: (v: string) => void;
  onNow: () => void;
  onSchedule?: () => void;
}

const TimeColumn = React.memo(function TimeColumn({
  dotColor,
  label,
  value,
  colors,
  scheduleTime,
  scheduleIcon: ScheduleIcon,
  onChange,
  onNow,
  onSchedule,
}: TimeColumnProps) {
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.columnLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <TimeInput label="" value={value} onChange={onChange} placeholder="เลือกเวลา" />
      <View style={styles.presetRow}>
        <QuickPreset colors={colors} onPress={onNow} icon={Clock} iconColor={colors.primary} label="ตอนนี้" />
        {scheduleTime && onSchedule && ScheduleIcon && (
          <QuickPreset
            colors={colors}
            onPress={onSchedule}
            icon={ScheduleIcon}
            iconColor={colors.text}
            label={scheduleTime}
            labelColor={colors.text}
          />
        )}
      </View>
    </View>
  );
});

interface TimePickersCardProps {
  workSchedule: any;
  clockIn: string;
  clockOut: string;
  reason: string;
  colors: any;
  isDark: boolean;
  onClockInChange: (v: string) => void;
  onClockOutChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onSetClockInNow: () => void;
  onSetClockInSchedule: () => void;
  onSetClockOutNow: () => void;
  onSetClockOutSchedule: () => void;
  timeCardRef?: React.RefObject<View | null>;
}

export const TimePickersCard = React.memo(function TimePickersCard({
  workSchedule,
  clockIn,
  clockOut,
  reason,
  colors,
  isDark,
  onClockInChange,
  onClockOutChange,
  onReasonChange,
  onSetClockInNow,
  onSetClockInSchedule,
  onSetClockOutNow,
  onSetClockOutSchedule,
  timeCardRef,
}: TimePickersCardProps) {
  return (
    <View ref={timeCardRef as any} collapsable={false}>
      <Card style={styles.bnaCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>เวลาทำงาน</Text>
          </View>
          {workSchedule && (
            <View style={[styles.schedulePill, { backgroundColor: colors.backgroundAlt }]}>
              <Clock size={11} color={colors.textSecondary} />
              <Text style={[styles.scheduleText, { color: colors.textSecondary }]}>
                กะงาน {workSchedule.startTime} - {workSchedule.endTime} น.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.twoCol}>
          <TimeColumn
            dotColor="#16a34a"
            label="เวลาเข้างาน"
            value={clockIn}
            colors={colors}
            scheduleTime={workSchedule?.startTime}
            scheduleIcon={LogIn}
            onChange={onClockInChange}
            onNow={onSetClockInNow}
            onSchedule={workSchedule?.startTime ? onSetClockInSchedule : undefined}
          />
          <TimeColumn
            dotColor="#dc2626"
            label="เวลาเลิกงาน"
            value={clockOut}
            colors={colors}
            scheduleTime={workSchedule?.endTime}
            scheduleIcon={LogOut}
            onChange={onClockOutChange}
            onNow={onSetClockOutNow}
            onSchedule={workSchedule?.endTime ? onSetClockOutSchedule : undefined}
          />
        </View>

        <View style={styles.reasonWrap}>
          <Text style={[styles.columnLabel, { color: colors.text, marginBottom: 4 }]}>
            เหตุผลในการแก้ไข / บันทึกย่อ (ถ้ามี)
          </Text>
          <Input
            placeholder="ระบุเหตุผลในการแก้ไขเวลา (ถ้ามี)"
            value={reason}
            onChangeText={onReasonChange}
            icon={FileText}
          />
        </View>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  bnaCard: {
    marginBottom: 12,
    borderRadius: 28,
    borderWidth: 0,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  schedulePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleText: {
    fontSize: 11,
    fontFamily: 'Sarabun_600SemiBold',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  reasonWrap: {
    marginTop: 10,
  },
});
