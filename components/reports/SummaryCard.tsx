import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface SummaryTotals {
  regular: number;
  ot: number;
  otUsed: number;
  late: number;
  lateUsed: number;
  early: number;
  earlyUsed: number;
}

interface SummaryCardProps {
  monthName: string;
  totals: SummaryTotals;
  colors: any;
  isDark: boolean;
  formatHoursWithDecimal: (h: number) => string;
}

function NetRemainder({
  label,
  total,
  used,
  colors,
  isDark,
  formatHoursWithDecimal,
}: {
  label: string;
  total: number;
  used: number;
  colors: any;
  isDark: boolean;
  formatHoursWithDecimal: (h: number) => string;
}) {
  const remain = Math.max(0, total - used);
  const hasRemain = remain > 0;
  const tone = hasRemain ? (isDark ? '#f87171' : '#dc2626') : isDark ? '#4ade80' : '#16a34a';
  return (
    <View style={styles.subRow}>
      <Text style={[styles.subLabel, { color: colors.textSecondary, fontWeight: '600' as const }]}>
        {label}:
      </Text>
      <Text style={[styles.subValue, { color: tone, fontWeight: '700' as const }]}>
        {formatHoursWithDecimal(remain)}
      </Text>
    </View>
  );
}

export const SummaryCard = React.memo(function SummaryCard({
  monthName,
  totals,
  colors,
  isDark,
  formatHoursWithDecimal,
}: SummaryCardProps) {
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.75)' : '#475569';
  const valueColor = isDark ? '#ffffff' : '#0f172a';
  const subColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';
  const green = isDark ? '#4ade80' : '#16a34a';

  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(30, 58, 138, 0.45)', 'rgba(23, 37, 84, 0.25)']
          : ['rgba(219, 234, 254, 0.75)', 'rgba(239, 246, 255, 0.5)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>สรุปรายเดือน</Text>
        <Badge
          variant="secondary"
          style={{
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.12)',
            borderWidth: 0,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: isDark ? '#bfdbfe' : '#2563eb',
              fontFamily: 'Sarabun_700Bold',
            }}
          >
            {monthName}
          </Text>
        </Badge>
      </View>

      {/* Regular Hours */}
      <View style={styles.row}>
        <Text style={[styles.label, { color: labelColor }]}>ชั่วโมงปกติ:</Text>
        <Text style={[styles.value, { color: valueColor }]}>
          {formatHoursWithDecimal(totals.regular)}
        </Text>
      </View>

      {/* Overtime Section */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: labelColor }]}>ชั่วโมง OT สะสม:</Text>
          <Text style={[styles.value, { color: valueColor }]}>
            {formatHoursWithDecimal(totals.ot)}
          </Text>
        </View>
        {totals.otUsed > 0 ? (
          <>
            <View style={styles.subRow}>
              <Text style={[styles.subLabel, { color: subColor }]}>  └ ใช้แล้ว:</Text>
              <Text style={[styles.subValue, { color: valueColor }]}>
                {formatHoursWithDecimal(totals.otUsed)}
              </Text>
            </View>
            <View style={styles.subRow}>
              <Text style={[styles.subLabel, { color: green, fontWeight: '600' as const }]}>
                └ คงเหลือสุทธิ:
              </Text>
              <Text style={[styles.subValue, { color: green, fontWeight: '700' as const }]}>
                {formatHoursWithDecimal(Math.max(0, totals.ot - totals.otUsed))}
              </Text>
            </View>
          </>
        ) : totals.ot > 0 ? (
          <View style={styles.subRow}>
            <Text style={[styles.subLabel, { color: green, fontWeight: '600' as const }]}>
              └ คงเหลือสุทธิ:
            </Text>
            <Text style={[styles.subValue, { color: green, fontWeight: '700' as const }]}>
              {formatHoursWithDecimal(totals.ot)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Late Arrival Section */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: labelColor }]}>ชั่วโมงมาสาย:</Text>
          <Text style={[styles.value, { color: valueColor }]}>
            {formatHoursWithDecimal(totals.late)}
          </Text>
        </View>
        {totals.late > 0 && (
          <>
            {totals.lateUsed > 0 && (
              <View style={styles.subRow}>
                <Text style={[styles.subLabel, { color: subColor }]}>  └ ชดเชย/ใช้แล้ว:</Text>
                <Text style={[styles.subValue, { color: valueColor }]}>
                  {formatHoursWithDecimal(totals.lateUsed)}
                </Text>
              </View>
            )}
            <NetRemainder
              label="└ สายคงค้าง"
              total={totals.late}
              used={totals.lateUsed}
              colors={colors}
              isDark={isDark}
              formatHoursWithDecimal={formatHoursWithDecimal}
            />
          </>
        )}
      </View>

      {/* Early Leave Section */}
      {totals.early > 0 && (
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>กลับก่อนเวลา:</Text>
            <Text style={[styles.value, { color: valueColor }]}>
              {formatHoursWithDecimal(totals.early)}
            </Text>
          </View>
          {totals.earlyUsed > 0 && (
            <View style={styles.subRow}>
              <Text style={[styles.subLabel, { color: subColor }]}>  └ ชดเชยแล้ว:</Text>
              <Text style={[styles.subValue, { color: valueColor }]}>
                {formatHoursWithDecimal(totals.earlyUsed)}
              </Text>
            </View>
          )}
          <NetRemainder
            label="└ คงค้าง"
            total={totals.early}
            used={totals.earlyUsed}
            colors={colors}
            isDark={isDark}
            formatHoursWithDecimal={formatHoursWithDecimal}
          />
        </View>
      )}

      <Separator
        style={{
          marginVertical: 10,
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.15)',
        }}
      />

      <View style={styles.row}>
        <Text style={[styles.totalLabel, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>
          รวมเวลาทำงานจริง:
        </Text>
        <Text style={[styles.totalValue, { color: isDark ? '#60a5fa' : '#2563eb' }]}>
          {formatHoursWithDecimal(totals.regular + totals.ot)}
        </Text>
      </View>

      {/* Watermark Footer on Shared Image */}
      <View
        style={[
          styles.watermark,
          { borderTopColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.15)' },
        ]}
      >
        <Text
          style={{
            fontSize: 11,
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
            fontFamily: 'Sarabun_400Regular',
          }}
        >
          รายงานสรุปเวลาทำงาน & OT
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: isDark ? '#93c5fd' : '#2563eb',
            fontWeight: '700',
            fontFamily: 'Sarabun_700Bold',
          }}
        >
          TimeTrack OT
        </Text>
      </View>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 0,
    borderWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Sarabun_500Medium',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  section: {
    marginVertical: 2,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: 'Sarabun_400Regular',
  },
  subValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Sarabun_800ExtraBold',
  },
  watermark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
