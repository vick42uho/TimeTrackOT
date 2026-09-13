import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Calendar as CalendarIcon,
  Plus,
  Home,
  Coffee,
  Briefcase,
  Building2,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ACTIVITY_CATEGORY_CONFIG } from './leavesConstants';
import type { Activity, Holiday, HolidayType, LeaveRequest, LeaveType } from '../../types';

interface DayActionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedCalendarDate: string;
  formatDateThai: (d: string) => string;
  getThaiDayName: (d: string) => string;
  currentDayHoliday?: Holiday;
  currentDayLeave?: LeaveRequest;
  selectedDayActivities: Activity[];
  colors: any;
  isDark: boolean;
  getHolidayBadge: (t: any) => React.ReactNode;
  getLeaveTypeBadge: (t: LeaveType) => React.ReactNode;
  onAddActivity: () => void;
  onEditActivity: (act: Activity) => void;
  onDeleteActivity: (act: Activity) => void;
  onQuickSetStatus: (type: HolidayType, name?: string) => void;
  onRequestLeaveForDay: () => void;
  onEditHoliday: () => void;
  onClearStatus: () => void;
}

const DayActivityRow = React.memo(function DayActivityRow({
  act,
  colors,
  onEdit,
  onDelete,
}: {
  act: Activity;
  colors: any;
  onEdit: (act: Activity) => void;
  onDelete: (act: Activity) => void;
}) {
  const catCfg = ACTIVITY_CATEGORY_CONFIG[act.category] || ACTIVITY_CATEGORY_CONFIG.general;
  const CatIcon = catCfg.icon;
  return (
    <View style={[styles.activityRow, { backgroundColor: colors.card, borderLeftColor: catCfg.color }]}>
      <View style={styles.activityContent}>
        <View style={styles.activityTitleRow}>
          <CatIcon size={12} color={catCfg.color} />
          <Text style={[styles.activityTitle, { color: colors.text }]}>
            {act.title}
          </Text>
        </View>
        <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
          {act.isAllDay ? 'ตลอดวัน' : `${act.startTime || ''}${act.endTime ? ` - ${act.endTime}` : ''} น.`}
          {act.location ? ` • ${act.location}` : ''}
        </Text>
      </View>
      <View style={styles.activityActions}>
        <TouchableOpacity onPress={() => onEdit(act)} style={styles.iconBtn}>
          <Edit3 size={15} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(act)} style={styles.iconBtn}>
          <Trash2 size={15} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const DayActionSheet = React.memo(function DayActionSheet({
  isVisible,
  onClose,
  selectedCalendarDate,
  formatDateThai,
  getThaiDayName,
  currentDayHoliday,
  currentDayLeave,
  selectedDayActivities,
  colors,
  isDark,
  getHolidayBadge,
  getLeaveTypeBadge,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onQuickSetStatus,
  onRequestLeaveForDay,
  onEditHoliday,
  onClearStatus,
}: DayActionSheetProps) {
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.95]}
      title="จัดการวันที่ & กิจกรรม"
    >
      <View style={styles.body}>
        <View style={[styles.dayActionHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <CalendarIcon size={18} color={colors.primary} />
          <Text variant="subtitle" style={styles.dateTitle}>
            {formatDateThai(selectedCalendarDate)} ({getThaiDayName(selectedCalendarDate)})
          </Text>
        </View>

        {(currentDayHoliday || currentDayLeave) && (
          <View style={[styles.currentStatusBox, { borderColor: colors.border }]}>
            <Text variant="caption" style={[styles.mutedSmall, { color: colors.textSecondary }]}>
              สถานะปัจจุบัน:
            </Text>
            {currentDayHoliday && (
              <View style={styles.statusRow}>
                {getHolidayBadge(currentDayHoliday.type)}
                <Text variant="subtitle" style={styles.statusName}>{currentDayHoliday.name}</Text>
              </View>
            )}
            {currentDayLeave && (
              <View style={styles.statusRow}>
                {getLeaveTypeBadge(currentDayLeave.leaveType)}
                <Text variant="subtitle" style={styles.statusName}>
                  ลางาน ({currentDayLeave.durationDays} วัน) {currentDayLeave.reason ? `- ${currentDayLeave.reason}` : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedDayActivities.length > 0 && (
          <View style={[styles.currentStatusBox, styles.activitiesBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#f5f3ff' }]}>
            <View style={styles.activitiesHeader}>
              <Text variant="caption" style={styles.activitiesTitle}>
                กิจกรรมในวันนี้ ({selectedDayActivities.length}):
              </Text>
              <TouchableOpacity onPress={onAddActivity} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.addMore, { color: colors.primary }]}>+ เพิ่มอีก</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activitiesList}>
              {selectedDayActivities.map((act) => (
                <DayActivityRow
                  key={act.id}
                  act={act}
                  colors={colors}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                />
              ))}
            </View>
          </View>
        )}

        <Text variant="caption" style={[styles.actionLabel, { color: colors.textSecondary }]}>
          เลือกการดำเนินการ:
        </Text>

        <View style={styles.actionList}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: '#8b5cf6', backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff' }]}
            onPress={onAddActivity}
          >
            <Plus size={20} color="#8b5cf6" />
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitlePurple}>เพิ่มกิจกรรม / นัดหมาย</Text>
              <Text variant="caption" style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>
                บันทึกกิจกรรม พร้อมตั้งเวลาแจ้งเตือน
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: '#16a34a', backgroundColor: isDark ? '#14532d30' : '#f0fdf4' }]}
            onPress={() => onQuickSetStatus('wfh', 'ทำงานที่บ้าน (WFH)')}
          >
            <Home size={20} color="#16a34a" />
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitleGreen}>Work From Home (WFH)</Text>
              <Text variant="caption" style={{ color: isDark ? '#86efac' : '#15803d' }}>
                กำหนดให้วันนี้เป็นการทำงานที่บ้าน
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: '#64748b', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
            onPress={() => onQuickSetStatus('regular_off', 'วันหยุดปกติ')}
          >
            <Coffee size={20} color="#64748b" />
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>วันหยุดปกติ (Day Off)</Text>
              <Text variant="caption" style={{ color: colors.textSecondary }}>
                กำหนดให้วันนี้เป็นวันหยุดประจำสัปดาห์
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: '#3b82f6', backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}
            onPress={onRequestLeaveForDay}
          >
            <Briefcase size={20} color="#3b82f6" />
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitleBlue}>ยื่นขอลาสำหรับวันนี้</Text>
              <Text variant="caption" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                ขอลาพักร้อน, ลาป่วย หรือลากิจ
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={onEditHoliday}
          >
            <Building2 size={20} color={colors.primary} />
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {currentDayHoliday ? 'แก้ไขวันหยุด / สถานะ' : 'เพิ่มวันหยุดนักขัตฤกษ์ / บริษัท'}
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary }}>
                {currentDayHoliday ? 'แก้ไขชื่อ, วันที่ หรือประเภทสถานะ' : 'กรอกชื่อวันหยุดเฉพาะสำหรับวันนี้'}
              </Text>
            </View>
          </TouchableOpacity>

          {(currentDayHoliday || currentDayLeave) && (
            <Button
              variant="destructive"
              icon={Trash2}
              style={styles.clearBtn}
              onPress={onClearStatus}
            >
              ลบ / ยกเลิกสถานะของวันนี้
            </Button>
          )}
        </View>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  body: {
    paddingBottom: 20,
  },
  dayActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  dateTitle: {
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
  currentStatusBox: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
    marginBottom: 8,
  },
  mutedSmall: {
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusName: {
    fontWeight: '600',
    fontSize: 14,
  },
  activitiesBox: {
    borderColor: '#8b5cf6',
    marginBottom: 12,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activitiesTitle: {
    color: '#8b5cf6',
    fontWeight: '700',
    fontSize: 12,
  },
  addMore: {
    fontSize: 12,
    fontWeight: '700',
  },
  activitiesList: {
    gap: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  activityContent: {
    flex: 1,
    marginRight: 6,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  activityMeta: {
    fontSize: 11,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  actionLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  actionList: {
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
  },
  actionTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontWeight: '700',
  },
  actionTitlePurple: {
    fontWeight: '700',
    color: '#8b5cf6',
    fontSize: 15,
  },
  actionTitleGreen: {
    fontWeight: '700',
    color: '#16a34a',
  },
  actionTitleBlue: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  clearBtn: {
    marginTop: 8,
  },
});
