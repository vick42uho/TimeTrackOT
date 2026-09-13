import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Briefcase, Clock, MapPin, Bell, Edit3, Trash2, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ACTIVITY_CATEGORY_CONFIG } from './leavesConstants';
import type { Activity, Holiday, LeaveRequest } from '../../types';

function formatReminder(minutes: number): string {
  if (minutes === 0) return 'ตรงเวลา';
  if (minutes === 15) return 'ก่อน 15 นาที';
  if (minutes === 30) return 'ก่อน 30 นาที';
  if (minutes === 60) return 'ก่อน 1 ชม.';
  if (minutes === 1440) return 'ก่อน 1 วัน';
  return `ก่อน ${minutes} น.`;
}

function formatActivityTime(act: Activity): string {
  if (act.isAllDay) return 'ตลอดวัน';
  return `${act.startTime || ''}${act.endTime ? ` - ${act.endTime}` : ''} น.`;
}

const ActivityRow = React.memo(function ActivityRow({
  act,
  colors,
  isDark,
  onEdit,
  onDelete,
}: {
  act: Activity;
  colors: any;
  isDark: boolean;
  onEdit: (act: Activity) => void;
  onDelete: (act: Activity) => void;
}) {
  const catCfg = ACTIVITY_CATEGORY_CONFIG[act.category] || ACTIVITY_CATEGORY_CONFIG.general;
  const CatIcon = catCfg.icon;
  return (
    <View
      style={[
        styles.activityRow,
        {
          borderLeftColor: catCfg.color,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
        },
      ]}
    >
      <View style={styles.activityMain}>
        <View style={styles.titleRow}>
          <CatIcon size={14} color={catCfg.color} />
          <Text style={[styles.activityTitle, { color: colors.text }]}>{act.title}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatActivityTime(act)}
            </Text>
          </View>

          {act.location ? (
            <View style={styles.metaItem}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text
                style={[styles.metaText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {act.location}
              </Text>
            </View>
          ) : null}

          {act.reminderMinutes !== null && act.reminderMinutes !== undefined && (
            <View
              style={[
                styles.reminderPill,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7' },
              ]}
            >
              <Bell size={10} color="#f59e0b" />
              <Text style={styles.reminderText}>{formatReminder(act.reminderMinutes)}</Text>
            </View>
          )}
        </View>

        {act.note ? (
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>{act.note}</Text>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => onEdit(act)}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Edit3 size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(act)}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

interface SelectedDayCardProps {
  selectedCalendarDate: string;
  selectedDateHoliday: Holiday | null;
  selectedDateLeave: LeaveRequest | null;
  selectedDayActivities: Activity[];
  colors: any;
  isDark: boolean;
  getThaiDayName: (date: string) => string;
  formatDateThai: (date: string) => string;
  getLeaveTypeBadge: (type: any) => React.ReactNode;
  getHolidayBadge: (type: any) => React.ReactNode;
  onEditActivity: (act: Activity) => void;
  onDeleteActivity: (act: Activity) => void;
  onAddActivity: () => void;
}

export const SelectedDayCard = React.memo(function SelectedDayCard({
  selectedCalendarDate,
  selectedDateHoliday,
  selectedDateLeave,
  selectedDayActivities,
  colors,
  isDark,
  getThaiDayName,
  formatDateThai,
  getLeaveTypeBadge,
  getHolidayBadge,
  onEditActivity,
  onDeleteActivity,
  onAddActivity,
}: SelectedDayCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.dateWrap}>
          <Text style={[styles.dayName, { color: colors.textSecondary }]}>
            {getThaiDayName(selectedCalendarDate)}
          </Text>
          <Text style={[styles.dateTitle, { color: colors.text }]}>
            {formatDateThai(selectedCalendarDate)}
          </Text>
        </View>

        {selectedDateHoliday || selectedDateLeave ? (
          <View style={styles.badgeRow}>
            {selectedDateLeave && getLeaveTypeBadge(selectedDateLeave.leaveType)}
            {selectedDateHoliday && getHolidayBadge(selectedDateHoliday.type)}
          </View>
        ) : (
          <View
            style={[
              styles.workdayPill,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9' },
            ]}
          >
            <Briefcase size={12} color={colors.textSecondary} />
            <Text style={[styles.workdayText, { color: colors.textSecondary }]}>
              วันทำงานปกติ
            </Text>
          </View>
        )}
      </View>

      {selectedDayActivities.length > 0 ? (
        <View style={styles.listGap}>
          {selectedDayActivities.map((act) => (
            <ActivityRow
              key={act.id}
              act={act}
              colors={colors}
              isDark={isDark}
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            ยังไม่มีกิจกรรมหรือนัดหมายในวันนี้
          </Text>
        </View>
      )}

      <Button
        variant="outline"
        size="sm"
        icon={Plus}
        onPress={onAddActivity}
        style={{
          borderColor: colors.primary,
          backgroundColor: isDark ? `${colors.primary}15` : '#eff6ff',
          minHeight: 38,
        }}
        textStyle={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}
      >
        เพิ่มกิจกรรม / นัดหมายในวันนี้
      </Button>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateWrap: {
    flex: 1,
    marginRight: 8,
  },
  dayName: {
    fontWeight: '600',
    fontSize: 12,
  },
  dateTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  workdayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 0,
  },
  workdayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listGap: {
    gap: 8,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderWidth: 0,
  },
  activityMain: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  activityTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  reminderText: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
  },
  noteText: {
    fontSize: 11,
    marginTop: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  emptyBox: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
