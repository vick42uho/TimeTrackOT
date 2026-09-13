import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, LogIn, LogOut, ChevronRight, Briefcase, Zap, AlertCircle } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ShiftCardProps {
  currentSchedule: any;
  todayEntry: any;
  colors: any;
  isDark: boolean;
  shiftProgress: number;
  formatHours: (h: number) => string;
  onOpenTimeEntry: () => void;
  shiftCardRef?: React.RefObject<View | null>;
}

export const ShiftCard = React.memo(function ShiftCard({
  currentSchedule,
  todayEntry,
  colors,
  isDark,
  shiftProgress,
  formatHours,
  onOpenTimeEntry,
  shiftCardRef,
}: ShiftCardProps) {
  return (
    <View ref={shiftCardRef as any} collapsable={false}>
      <Card style={styles.bnaCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>การทำงานวันนี้</Text>
          </View>
          {currentSchedule && (
            <View style={[styles.schedulePill, { backgroundColor: colors.backgroundAlt }]}>
              <Clock size={11} color={colors.textSecondary} />
              <Text style={[styles.scheduleText, { color: colors.textSecondary }]}>
                กะ {currentSchedule.startTime} - {currentSchedule.endTime} น.
              </Text>
            </View>
          )}
        </View>

        {todayEntry ? (
          <>
            <View style={styles.clockRow}>
              <View style={[styles.timeBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : '#f0fdf4' }]}>
                <View style={styles.timeLabelRow}>
                  <LogIn size={12} color="#16a34a" />
                  <Text style={styles.timeLabel}>เวลาเข้างาน</Text>
                </View>
                <Text style={[styles.timeVal, { color: '#16a34a' }]}>
                  {todayEntry.clockIn ? `${todayEntry.clockIn} น.` : '-'}
                </Text>
              </View>

              <View
                style={[
                  styles.timeBox,
                  {
                    backgroundColor: todayEntry.clockOut
                      ? isDark
                        ? 'rgba(239, 68, 68, 0.08)'
                        : '#fef2f2'
                      : colors.backgroundAlt,
                  },
                ]}
              >
                <View style={styles.timeLabelRow}>
                  <LogOut size={12} color="#dc2626" />
                  <Text style={styles.timeLabel}>เวลาเลิกงาน</Text>
                </View>
                <Text style={[styles.timeVal, { color: todayEntry.clockOut ? '#dc2626' : colors.textSecondary }]}>
                  {todayEntry.clockOut ? `${todayEntry.clockOut} น.` : 'ยังไม่เลิกงาน'}
                </Text>
              </View>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: colors.backgroundAlt }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${shiftProgress}%`,
                    backgroundColor: todayEntry.clockOut ? '#16a34a' : colors.primary,
                  },
                ]}
              />
            </View>

            <View style={styles.metricMiniRow}>
              <View style={[styles.metricMiniChip, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff' }]}>
                <Briefcase size={12} color={colors.primary} />
                <Text style={[styles.metricMiniText, { color: colors.primary }]}>
                  ทำงาน {todayEntry.regularHours ? formatHours(todayEntry.regularHours) : '0'} ชม.
                </Text>
              </View>

              {todayEntry.overtimeHours > 0 && (
                <View style={[styles.metricMiniChip, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#ecfdf5' }]}>
                  <Zap size={12} color="#10b981" />
                  <Text style={[styles.metricMiniText, { color: '#059669' }]}>
                    OT +{formatHours(todayEntry.overtimeHours)} ชม.
                  </Text>
                </View>
              )}

              {todayEntry.lateArrivalHours > 0 && (
                <View style={[styles.metricMiniChip, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2' }]}>
                  <AlertCircle size={12} color="#dc2626" />
                  <Text style={[styles.metricMiniText, { color: '#dc2626' }]}>
                    สาย {formatHours(todayEntry.lateArrivalHours)} ชม.
                  </Text>
                </View>
              )}
            </View>

            {todayEntry.clockIn && !todayEntry.clockOut ? (
              <View style={styles.actionTop}>
                <Button
                  variant="outline"
                  size="lg"
                  icon={LogOut}
                  style={[styles.fullBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#ffe4e6' }]}
                  textStyle={{ color: isDark ? '#f87171' : '#dc2626', fontWeight: '700' }}
                  onPress={onOpenTimeEntry}
                >
                  บันทึกเวลาเลิกงาน
                </Button>
              </View>
            ) : (
              <TouchableOpacity
                onPress={onOpenTimeEntry}
                activeOpacity={0.7}
                style={[styles.linkPill, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' }]}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  ดูหรือแก้ไขเวลาทำงานวันนี้
                </Text>
                <ChevronRight size={13} color={colors.primary} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyAgendaBox, { backgroundColor: colors.backgroundAlt }]}>
              <View style={styles.emptyRow}>
                <Clock size={15} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  ยังไม่ได้ลงเวลาทำงานวันนี้
                </Text>
              </View>
              <Badge variant="outline" style={{ ...styles.startBadge, backgroundColor: colors.card }}>
                <Text style={[styles.startBadgeText, { color: colors.text }]}>
                  เริ่ม {currentSchedule?.startTime || '09:00'} น.
                </Text>
              </Badge>
            </View>

            <Button
              variant="default"
              size="lg"
              icon={LogIn}
              style={styles.fullBtn}
              onPress={onOpenTimeEntry}
            >
              บันทึกเวลาเข้างาน
            </Button>
          </View>
        )}
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
    marginBottom: 8,
  },
  cardTitleContainer: {
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
  clockRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: 'Sarabun_600SemiBold',
  },
  timeVal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  metricMiniRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  metricMiniChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  metricMiniText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionTop: {
    marginTop: 10,
  },
  fullBtn: {
    width: '100%',
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 12,
    fontFamily: 'Sarabun_700Bold',
    fontWeight: '700',
  },
  emptyWrap: {
    gap: 8,
    marginTop: 4,
  },
  emptyAgendaBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  startBadge: {
    borderWidth: 0,
  },
  startBadgeText: {
    fontSize: 11,
    fontFamily: 'Sarabun_600SemiBold',
  },
});
