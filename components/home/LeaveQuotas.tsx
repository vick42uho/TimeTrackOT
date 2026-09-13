import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, ChevronRight, Palmtree, HeartPulse, UserCheck, FileText } from 'lucide-react-native';
import type { LeaveSummary, LeaveType } from '../../types';

interface LeaveTypeMeta {
  icon: any;
  label: string;
  color: string;
  lightBg: string;
  darkBg: string;
}

function getLeaveTypeMetaStatic(leaveType: string): LeaveTypeMeta {
  switch (leaveType) {
    case 'vacation':
      return { icon: Palmtree, label: 'พักร้อน', color: '#10b981', lightBg: '#dcfce7', darkBg: 'rgba(34, 197, 94, 0.15)' };
    case 'sick':
      return { icon: HeartPulse, label: 'ลาป่วย', color: '#ef4444', lightBg: '#ffe4e6', darkBg: 'rgba(239, 68, 68, 0.15)' };
    case 'personal':
      return { icon: UserCheck, label: 'ลากิจ', color: '#f59e0b', lightBg: '#fef3c7', darkBg: 'rgba(245, 158, 11, 0.15)' };
    case 'other':
    default:
      return { icon: FileText, label: 'อื่นๆ', color: '#8b5cf6', lightBg: '#f3e8ff', darkBg: 'rgba(168, 85, 247, 0.15)' };
  }
}

const QUOTA_FALLBACK_TYPES: LeaveType[] = ['vacation', 'sick', 'personal', 'other'];

interface LeaveQuotasProps {
  leaveSummaries: LeaveSummary[];
  colors: any;
  isDark: boolean;
  onOpenLeaves: () => void;
  leaveQuotaRef?: React.RefObject<View | null>;
}

export const LeaveQuotas = React.memo(function LeaveQuotas({
  leaveSummaries,
  colors,
  isDark,
  onOpenLeaves,
  leaveQuotaRef,
}: LeaveQuotasProps) {
  const year = new Date().getFullYear() + 543;
  const types = leaveSummaries.length > 0
    ? leaveSummaries.map((s) => s.leaveType)
    : QUOTA_FALLBACK_TYPES;
  const summaryByType = new Map(leaveSummaries.map((s) => [s.leaveType, s]));

  return (
    <View ref={leaveQuotaRef as any} collapsable={false} style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Calendar size={15} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            โควต้าวันลาคงเหลือ ({year})
          </Text>
        </View>
        <TouchableOpacity
          onPress={onOpenLeaves}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            ดูทั้งหมด
          </Text>
          <ChevronRight size={12} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        {types.map((type) => {
          const meta = getLeaveTypeMetaStatic(type);
          const LeaveIcon = meta.icon;
          const s = summaryByType.get(type);
          return (
            <TouchableOpacity
              key={type}
              onPress={onOpenLeaves}
              activeOpacity={0.7}
              style={[
                styles.quotaCard,
                {
                  backgroundColor: isDark ? meta.darkBg : meta.lightBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <LeaveIcon size={14} color={meta.color} />
                <Text style={styles.quotaLabel} numberOfLines={1}>
                  {meta.label}
                </Text>
              </View>
              <Text style={[styles.quotaVal, { color: meta.color }]}>
                {s ? s.remainingDays : '-'}
                <Text style={[styles.quotaUnit, { color: colors.textSecondary }]}>
                  {' '}วัน
                </Text>
              </Text>
              <Text style={styles.quotaSub} numberOfLines={1}>
                {s ? `ใช้ ${s.usedDays}/${s.quotaDays}` : 'แตะเพื่อดู'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 26,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quotaCard: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    borderWidth: 0,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  quotaLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  quotaVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  quotaUnit: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  quotaSub: {
    fontSize: 10,
  },
});
