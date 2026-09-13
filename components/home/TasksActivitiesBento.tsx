import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, CheckSquare, Plus, Check, MapPin, Palmtree } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { Activity, TaskNote } from '../../types';
import type { HapticIntent } from '../../hooks/useHaptics';

interface TasksActivitiesBentoProps {
  activities: Activity[];
  tasksNotes: TaskNote[];
  pendingTasksCount: number;
  nextHoliday: { name: string; date: string; daysLeft: number } | null;
  colors: any;
  isDark: boolean;
  getCategoryMeta: (category: string) => { icon: any; label: string; bg: string; color: string };
  formatDateThai: (date: string) => string;
  triggerHaptic: (kind?: HapticIntent) => void;
  onAddActivity: () => void;
  onOpenActivity: (item: Activity) => void;
  onOpenLeaves: () => void;
  onOpenTaskManager: () => void;
  onAddNote: () => void;
  onOpenNote: (item: TaskNote) => void;
  onToggleTask: (id: number, isCompleted: boolean) => void;
  tasksNotesRef?: React.RefObject<View | null>;
}

function formatActivityTime(item: Activity): string {
  if (item.isAllDay || (!item.startTime && !item.endTime)) return 'ตลอดวัน';
  if (item.startTime && item.endTime) return `${item.startTime} - ${item.endTime} น.`;
  if (item.startTime) return `${item.startTime} น.`;
  return `ถึง ${item.endTime} น.`;
}

export const TasksActivitiesBento = React.memo(function TasksActivitiesBento({
  activities,
  tasksNotes,
  pendingTasksCount,
  nextHoliday,
  colors,
  isDark,
  getCategoryMeta,
  formatDateThai,
  triggerHaptic,
  onAddActivity,
  onOpenActivity,
  onOpenLeaves,
  onOpenTaskManager,
  onAddNote,
  onOpenNote,
  onToggleTask,
  tasksNotesRef,
}: TasksActivitiesBentoProps) {
  return (
    <>
      <View ref={tasksNotesRef as any} collapsable={false} style={styles.bentoRow}>
        <Card style={{ ...styles.bnaCard, ...styles.bentoCard }}>
          <View style={styles.bentoHeader}>
            <View style={styles.bentoTitleWrap}>
              <Icon name={Calendar} size={15} color={colors.primary} />
              <Text style={[styles.bentoTitle, { color: colors.text }]} numberOfLines={1}>
                กิจกรรม
              </Text>
              {activities.length > 0 && (
                <Badge variant="secondary" style={styles.countBadge}>
                  {activities.length}
                </Badge>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                onAddActivity();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.addPill, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}
            >
              <Icon name={Plus} size={11} color={colors.primary} />
              <Text style={[styles.addPillText, { color: colors.primary }]}>เพิ่ม</Text>
            </TouchableOpacity>
          </View>

          {activities.length > 0 ? (
            <View style={styles.listGap}>
              {activities.slice(0, 2).map((item, idx) => {
                const meta = getCategoryMeta(item.category);
                const CatIcon = meta.icon;
                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerHaptic('impact-light');
                      onOpenActivity(item);
                    }}
                    style={styles.activityRow}
                  >
                    <View style={[styles.agendaIconBadge, { backgroundColor: meta.bg }]}>
                      <Icon name={CatIcon} size={14} color={meta.color} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={styles.activityMetaRow}>
                        <Text style={[styles.activityTime, { color: colors.primary }]} numberOfLines={1}>
                          {formatActivityTime(item)}
                        </Text>
                        {item.location ? (
                          <View style={styles.locationRow}>
                            <Icon name={MapPin} size={10} color={colors.textSecondary} />
                            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                              {item.location}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {activities.length > 2 && (
                <TouchableOpacity onPress={onOpenLeaves}>
                  <Text style={[styles.moreLink, { color: colors.primary }]}>
                    + ดูอีก {activities.length - 2} รายการ
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity onPress={onOpenLeaves} activeOpacity={0.7} style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>ไม่มีนัดหมายวันนี้</Text>
              <Text style={[styles.emptyCta, { color: colors.primary }]}>แตะเพื่อเพิ่มนัด</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card style={{ ...styles.bnaCard, ...styles.bentoCard }}>
          <View style={styles.bentoHeader}>
            <TouchableOpacity activeOpacity={0.7} onPress={onOpenTaskManager} style={styles.bentoTitleWrap}>
              <Icon name={CheckSquare} size={15} color="#16a34a" />
              <Text style={[styles.bentoTitle, { color: colors.text }]} numberOfLines={1}>
                โน้ต & งาน
              </Text>
              {pendingTasksCount > 0 && (
                <Badge variant="secondary" style={styles.countBadge}>
                  {pendingTasksCount}
                </Badge>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                onAddNote();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.addPill, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7' }]}
            >
              <Icon name={Plus} size={11} color="#16a34a" />
              <Text style={[styles.addPillText, { color: '#16a34a' }]}>เพิ่ม</Text>
            </TouchableOpacity>
          </View>

          {tasksNotes.length > 0 ? (
            <View style={styles.listGap}>
              {tasksNotes.slice(0, 2).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => onOpenNote(item)}
                  style={styles.taskRow}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onToggleTask(item.id!, !item.isCompleted)}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.border,
                        backgroundColor: item.isCompleted ? '#16a34a' : 'transparent',
                        borderWidth: item.isCompleted ? 0 : 1.5,
                      },
                    ]}
                  >
                    {item.isCompleted && <Icon name={Check} size={12} color="#ffffff" />}
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: item.isCompleted ? colors.textSecondary : colors.text },
                      item.isCompleted ? styles.strike : null,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
              {tasksNotes.length > 2 && (
                <TouchableOpacity onPress={onOpenTaskManager}>
                  <Text style={[styles.moreLink, { color: '#16a34a' }]}>
                    + ดูอีก {tasksNotes.length - 2} รายการ
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                onAddNote();
              }}
              activeOpacity={0.7}
              style={styles.emptyBox}
            >
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>ไม่มีงานค้างวันนี้</Text>
              <Text style={[styles.emptyCta, { color: '#16a34a' }]}>แตะเพื่อสร้างงาน/โน้ต</Text>
            </TouchableOpacity>
          )}
        </Card>
      </View>

      {nextHoliday && (
        <TouchableOpacity
          onPress={onOpenLeaves}
          activeOpacity={0.8}
          style={[
            styles.nextHolidayCard,
            {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
              borderColor: isDark ? '#1e3a8a' : '#bfdbfe',
            },
          ]}
        >
          <View style={styles.holidayRow}>
            <Palmtree size={18} color={colors.primary} />
            <View style={styles.flex1}>
              <Text style={[styles.holidayName, { color: colors.text }]} numberOfLines={1}>
                วันหยุดถัดไป: {nextHoliday.name}
              </Text>
              <Text style={[styles.holidayDate, { color: colors.textSecondary }]}>
                {formatDateThai(nextHoliday.date)}
              </Text>
            </View>
          </View>
          <View style={[styles.daysLeftPill, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' }]}>
            <Text style={[styles.daysLeftText, { color: colors.primary }]}>
              {nextHoliday.daysLeft === 0
                ? 'วันนี้'
                : nextHoliday.daysLeft === 1
                  ? 'พรุ่งนี้'
                  : `อีก ${nextHoliday.daysLeft} วัน`}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  bnaCard: {
    marginBottom: 12,
    borderRadius: 28,
    borderWidth: 0,
    padding: 18,
  },
  bentoCard: {
    flex: 1,
    marginBottom: 0,
    padding: 14,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bentoTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  bentoTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  addPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  listGap: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  agendaIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 10,
    fontFamily: 'Sarabun_600SemiBold',
    flexShrink: 0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  locationText: {
    fontSize: 10,
    fontFamily: 'Sarabun_400Regular',
    flex: 1,
  },
  moreLink: {
    fontSize: 11,
    fontFamily: 'Sarabun_600SemiBold',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 2,
  },
  emptyText: {
    fontSize: 11,
    fontFamily: 'Sarabun_400Regular',
  },
  emptyCta: {
    fontSize: 10,
    fontFamily: 'Sarabun_600SemiBold',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  nextHolidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  holidayName: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  holidayDate: {
    fontSize: 11,
    fontFamily: 'Sarabun_400Regular',
  },
  daysLeftPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
});
