import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Clock, Zap, AlertTriangle, LogOut, CheckSquare, Square, Camera } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import type { TimeEntry } from '../../types';

interface StatusBadgeProps {
  entry: TimeEntry;
  colors: any;
  isDark: boolean;
  formatHours: (h: number) => string;
}

const StatusBadge = React.memo(function StatusBadge({
  kind,
  entry,
  colors,
  isDark,
  formatHours,
}: StatusBadgeProps & { kind: 'ot' | 'late' | 'early' }) {
  const hours = kind === 'ot' ? entry.overtimeHours : kind === 'late' ? entry.lateArrivalHours : entry.earlyLeaveHours;
  const used = kind === 'ot' ? entry.overtimeUsed : kind === 'late' ? entry.lateArrivalUsed : entry.earlyLeaveUsed;
  if (!hours || hours <= 0) return null;

  const cfg = {
    ot: { icon: Zap, label: 'OT', usedSuffix: ' (ใช้แล้ว)', active: '#16a34a', activeDark: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', bgLight: 'rgba(34, 197, 94, 0.1)' },
    late: { icon: AlertTriangle, label: 'สาย', usedSuffix: ' (ชดเชยแล้ว)', active: '#dc2626', activeDark: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', bgLight: 'rgba(239, 68, 68, 0.1)' },
    early: { icon: LogOut, label: 'ก่อน', usedSuffix: ' (ชดเชยแล้ว)', active: '#ea580c', activeDark: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)', bgLight: 'rgba(249, 115, 22, 0.1)' },
  }[kind];
  const StatusIcon = cfg.icon;
  const activeColor = isDark ? cfg.activeDark : cfg.active;

  return (
    <View
      style={[
        styles.miniBadge,
        {
          backgroundColor: used ? (isDark ? '#27272a' : '#f1f5f9') : isDark ? cfg.bg : cfg.bgLight,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
        },
      ]}
    >
      <StatusIcon size={10} color={used ? colors.textSecondary : activeColor} />
      <Text style={[styles.miniBadgeText, { color: used ? colors.textSecondary : activeColor }]}>
        {cfg.label}: {formatHours(hours || 0)}
        {used ? cfg.usedSuffix : ''}
      </Text>
    </View>
  );
});

interface CheckButtonProps {
  visible: boolean;
  used?: boolean;
  label: string;
  activeColor: string;
  colors: any;
  onPress: () => void;
}

const CheckButton = React.memo(function CheckButton({
  visible,
  used,
  label,
  activeColor,
  colors,
  onPress,
}: CheckButtonProps) {
  if (!visible) return null;
  return (
    <TouchableOpacity
      style={[styles.checkButton, used ? styles.checkButtonActive : null]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon
        name={used ? CheckSquare : Square}
        size={16}
        color={used ? activeColor : colors.textSecondary}
      />
      <Text style={[styles.checkButtonText, used ? styles.checkButtonTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

interface EntryRowProps {
  entry: TimeEntry;
  dayOfWeek: string;
  colors: any;
  isDark: boolean;
  formatHours: (h: number) => string;
  formatDateThai: (date: string) => string;
  onPress: (entry: TimeEntry) => void;
  onToggleOvertime: (entry: TimeEntry) => void;
  onToggleLate: (entry: TimeEntry) => void;
  onToggleEarly: (entry: TimeEntry) => void;
}

export const EntryRow = React.memo(function EntryRow({
  entry,
  dayOfWeek,
  colors,
  isDark,
  formatHours,
  formatDateThai,
  onPress,
  onToggleOvertime,
  onToggleLate,
  onToggleEarly,
}: EntryRowProps) {
  const totalDayHours = (entry.regularHours || 0) + (entry.overtimeHours || 0);
  const hasActions =
    (entry.overtimeHours || 0) > 0 ||
    (entry.lateArrivalHours || 0) > 0 ||
    (entry.earlyLeaveHours || 0) > 0;

  return (
    <Card style={styles.dailyCard}>
      <TouchableOpacity style={styles.dailyHeader} onPress={() => onPress(entry)} activeOpacity={0.7}>
        <View style={styles.rowGap6}>
          <Text style={[styles.dailyDateText, { color: colors.text }]}>
            {formatDateThai(entry.date)} ({dayOfWeek})
          </Text>
        </View>
        <View style={styles.rowGap6}>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>รวม {formatHours(totalDayHours)}</Text>
          </View>
          <Icon name={ChevronRight} size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.timeRow} onPress={() => onPress(entry)} activeOpacity={0.7}>
        <View style={styles.rowGap5}>
          <Icon name={Clock} size={14} color={colors.textSecondary} />
          <Text style={[styles.clockText, { color: colors.text }]}>
            {entry.clockIn || '--:--'} - {entry.clockOut || '--:--'}
          </Text>
        </View>
        {entry.attachmentUri ? (
          <View
            style={[
              styles.proofBadge,
              {
                backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe',
              },
            ]}
          >
            <Icon name={Camera} size={11} color="#2563EB" />
            <Text style={styles.proofBadgeText}>มีรูปหลักฐาน</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.badgesRow}>
        <View
          style={[
            styles.miniBadge,
            { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)' },
          ]}
        >
          <Text style={[styles.miniBadgeText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>
            ปกติ: {formatHours(entry.regularHours || 0)}
          </Text>
        </View>

        <StatusBadge kind="ot" entry={entry} colors={colors} isDark={isDark} formatHours={formatHours} />
        <StatusBadge kind="late" entry={entry} colors={colors} isDark={isDark} formatHours={formatHours} />
        <StatusBadge kind="early" entry={entry} colors={colors} isDark={isDark} formatHours={formatHours} />
      </View>

      {hasActions && (
        <View style={styles.actionRow}>
          <CheckButton
            visible={(entry.overtimeHours || 0) > 0}
            used={entry.overtimeUsed}
            label="ใช้ OT แล้ว"
            activeColor="#16a34a"
            colors={colors}
            onPress={() => onToggleOvertime(entry)}
          />
          <CheckButton
            visible={(entry.lateArrivalHours || 0) > 0}
            used={entry.lateArrivalUsed}
            label="ชดเชยสายแล้ว"
            activeColor="#dc2626"
            colors={colors}
            onPress={() => onToggleLate(entry)}
          />
          <CheckButton
            visible={(entry.earlyLeaveHours || 0) > 0}
            used={entry.earlyLeaveUsed}
            label="ชดเชยกลับก่อนแล้ว"
            activeColor="#ea580c"
            colors={colors}
            onPress={() => onToggleEarly(entry)}
          />
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  dailyCard: {
    borderRadius: 28,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowGap6: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowGap5: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dailyDateText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  totalBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Sarabun_700Bold',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  proofBadgeText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  clockText: {
    fontSize: 13,
    fontFamily: 'Sarabun_400Regular',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkButtonActive: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  checkButtonText: {
    fontSize: 11,
    fontFamily: 'Sarabun_600SemiBold',
  },
  checkButtonTextActive: {
    fontWeight: '700',
  },
});
