import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { LeaveRequest, LeaveSummary, LeaveType } from '../../types';

interface LeavesHistoryTabProps {
  summaries: LeaveSummary[];
  leaves: LeaveRequest[];
  colors: any;
  formatDateThai: (d: string) => string;
  getLeaveTypeBadge: (type: LeaveType) => React.ReactNode;
  onOpenLeaveSheet: () => void;
  onDeleteLeave: (leave: LeaveRequest) => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  requestLeaveBtnRef?: React.RefObject<View | null>;
}

const LeaveRow = React.memo(function LeaveRow({
  leave,
  colors,
  formatDateThai,
  getLeaveTypeBadge,
  onDeleteLeave,
}: {
  leave: LeaveRequest;
  colors: any;
  formatDateThai: (d: string) => string;
  getLeaveTypeBadge: (type: LeaveType) => React.ReactNode;
  onDeleteLeave: (leave: LeaveRequest) => void;
}) {
  return (
    <Card style={styles.holidayCard}>
      <View style={styles.rowBetween}>
        <View style={styles.rowContent}>
          <View style={styles.badgeRow}>
            {getLeaveTypeBadge(leave.leaveType)}
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              {leave.durationDays} วัน
            </Text>
          </View>
          <Text variant="subtitle" style={styles.reasonText}>
            {leave.reason || 'ไม่ได้ระบุเหตุผล'}
          </Text>
          <Text variant="caption" style={{ color: colors.primary, fontWeight: '500' }}>
            {formatDateThai(leave.startDate)}
            {leave.startDate !== leave.endDate && ` - ${formatDateThai(leave.endDate)}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDeleteLeave(leave)}
          style={[styles.iconDeleteBtn, { backgroundColor: colors.errorLight || '#fee2e2' }]}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Card>
  );
});

const LEAVE_SHORT_LABEL: Record<string, string> = {
  vacation: 'พักร้อน',
  sick: 'ลาป่วย',
  personal: 'ลากิจ',
};

export const LeavesHistoryTab = React.memo(function LeavesHistoryTab({
  summaries,
  leaves,
  colors,
  formatDateThai,
  getLeaveTypeBadge,
  onOpenLeaveSheet,
  onDeleteLeave,
  scrollViewRef,
  requestLeaveBtnRef,
}: LeavesHistoryTabProps) {
  return (
    <ScrollView
      ref={scrollViewRef as any}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.leaveStatsRow}>
        {summaries.map((s) => (
          <View
            key={s.leaveType}
            style={[
              styles.leaveStatBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text variant="caption" style={{ color: colors.textSecondary, fontSize: 11 }}>
              {LEAVE_SHORT_LABEL[s.leaveType] || 'อื่นๆ'}
            </Text>
            <Text variant="title" style={styles.statValue}>
              {s.usedDays}{' '}
              <Text variant="caption" style={{ fontSize: 11 }}>
                / {s.quotaDays} วัน
              </Text>
            </Text>
          </View>
        ))}
      </View>

      <View ref={requestLeaveBtnRef as any} collapsable={false} style={styles.actionWrap}>
        <Button
          variant="default"
          size="lg"
          icon={Plus}
          onPress={onOpenLeaveSheet}
        >
          ยื่นขอลา / บันทึกการลา
        </Button>
      </View>

      <View style={styles.listGap}>
        {leaves.map((l) => (
          <LeaveRow
            key={l.id}
            leave={l}
            colors={colors}
            formatDateThai={formatDateThai}
            getLeaveTypeBadge={getLeaveTypeBadge}
            onDeleteLeave={onDeleteLeave}
          />
        ))}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 90,
  },
  leaveStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  leaveStatBox: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    marginVertical: 2,
    fontSize: 14,
  },
  actionWrap: {
    marginVertical: 12,
  },
  listGap: {
    gap: 8,
  },
  holidayCard: {
    padding: 12,
    borderRadius: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reasonText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  iconDeleteBtn: {
    padding: 8,
    borderRadius: 999,
  },
});
