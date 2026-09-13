import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, Zap, Briefcase, AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export interface HomeMonthlyStats {
  totalOT: number;
  totalOTUsed: number;
  lateCount: number;
  lateUsedCount: number;
  monthWorkHours: number;
  monthWorkDays: number;
  monthOTHours: number;
  monthOTUsed: number;
}

interface StatsGridProps {
  monthlyStats: HomeMonthlyStats;
  formatHours: (h: number) => string;
  isDark: boolean;
  colors: any;
  metricsGridRef?: React.RefObject<View | null>;
}

export const StatsGrid = React.memo(function StatsGrid({
  monthlyStats,
  formatHours,
  isDark,
  colors,
  metricsGridRef,
}: StatsGridProps) {
  return (
    <View ref={metricsGridRef as any} collapsable={false} style={styles.dashboardGrid}>
      {/* Card 1: OT Balance (Yearly) */}
      <View style={styles.statCardWrapper}>
        <View style={[styles.statCard, styles.otCard, isDark && styles.otCardDark]}>
          <View style={styles.statHeaderRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>OT คงเหลือทั้งปี</Text>
            <TrendingUp size={16} color={isDark ? '#34d399' : '#059669'} />
          </View>
          <View>
            <Text style={[styles.statValue, isDark ? styles.otValDark : styles.otVal]}>
              {formatHours(monthlyStats.totalOT - monthlyStats.totalOTUsed)}{' '}
              <Text style={{ fontSize: 13 }}>ชม.</Text>
            </Text>
            {monthlyStats.totalOTUsed > 0 ? (
              <Text style={[styles.statSubLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                (ใช้แล้ว {formatHours(monthlyStats.totalOTUsed)} ชม.)
              </Text>
            ) : monthlyStats.totalOT > 0 ? (
              <Text style={[styles.statSubLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                (สะสม {formatHours(monthlyStats.totalOT)} ชม.)
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Card 2: Monthly OT */}
      <View style={styles.statCardWrapper}>
        <View style={[styles.statCard, styles.overtimeCard, isDark && styles.overtimeCardDark]}>
          <View style={styles.statHeaderRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>OT รวมเดือนนี้</Text>
            <Zap size={16} color={isDark ? '#fbbf24' : '#d97706'} />
          </View>
          <View>
            <Text style={[styles.statValue, isDark ? styles.overtimeValDark : styles.overtimeVal]}>
              {formatHours(monthlyStats.monthOTHours - monthlyStats.monthOTUsed)}{' '}
              <Text style={{ fontSize: 13 }}>ชม.</Text>
            </Text>
            {monthlyStats.monthOTUsed > 0 ? (
              <Text style={[styles.statSubLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                (ใช้แล้ว {formatHours(monthlyStats.monthOTUsed)} ชม.)
              </Text>
            ) : (
              <Text style={[styles.statSubLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                (สะสม {formatHours(monthlyStats.monthOTHours)} ชม.)
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Card 3: Monthly Work Hours */}
      <View style={styles.statCardWrapper}>
        <View style={[styles.statCard, styles.regularCard, isDark && styles.regularCardDark]}>
          <View style={styles.statHeaderRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ทำงานรวมเดือนนี้</Text>
            <Briefcase size={16} color={isDark ? '#60a5fa' : '#2563eb'} />
          </View>
          <View>
            <Text style={[styles.statValue, isDark ? styles.regularValDark : styles.regularVal]}>
              {formatHours(monthlyStats.monthWorkHours)}{' '}
              <Text style={{ fontSize: 13 }}>ชม.</Text>
            </Text>
            <Text style={[styles.statSubLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              (ทำงาน {monthlyStats.monthWorkDays} วัน)
            </Text>
          </View>
        </View>
      </View>

      {/* Card 4: Late Count (Monthly) */}
      <View style={styles.statCardWrapper}>
        <View style={[styles.statCard, styles.lateCard, isDark && styles.lateCardDark]}>
          <View style={styles.statHeaderRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>มาสายเดือนนี้</Text>
            <AlertCircle size={16} color={isDark ? '#f87171' : '#dc2626'} />
          </View>
          <View>
            <Text style={[styles.statValue, isDark ? styles.lateValDark : styles.lateVal]}>
              {monthlyStats.lateCount - monthlyStats.lateUsedCount}{' '}
              <Text style={{ fontSize: 13 }}>ครั้ง</Text>
            </Text>
            {monthlyStats.lateUsedCount > 0 ? (
              <Text style={[styles.statSubLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                (ใช้แล้ว {monthlyStats.lateUsedCount} ครั้ง)
              </Text>
            ) : (
              <Text style={[styles.statSubLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                (รวม {monthlyStats.lateCount} ครั้ง)
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  statCardWrapper: {
    width: (width - 36) / 2,
  },
  statCard: {
    borderRadius: 24,
    padding: 12,
    minHeight: 78,
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  otCard: { backgroundColor: '#dcfce7' },
  otCardDark: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  lateCard: { backgroundColor: '#ffe4e6' },
  lateCardDark: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  regularCard: { backgroundColor: '#dbeafe' },
  regularCardDark: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  overtimeCard: { backgroundColor: '#fef3c7' },
  overtimeCardDark: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
    marginTop: 2,
  },
  otVal: { color: '#059669' },
  otValDark: { color: '#34d399' },
  lateVal: { color: '#dc2626' },
  lateValDark: { color: '#f87171' },
  regularVal: { color: '#2563eb' },
  regularValDark: { color: '#60a5fa' },
  overtimeVal: { color: '#d97706' },
  overtimeValDark: { color: '#fbbf24' },
  statSubLabel: {
    fontSize: 10,
    fontFamily: 'Sarabun_400Regular',
  },
});
