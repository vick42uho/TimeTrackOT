import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { Card } from '@/components/ui/card';

export interface DetailedPreview {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  morningOT?: number;
  eveningOT?: number;
  lateArrivalHours: number;
  earlyLeaveHours: number;
}

interface MetricBoxProps {
  label: string;
  value: string;
  sub: string;
  colors: any;
  highlight?: boolean;
  highlightBorder?: string;
  highlightColor?: string;
}

const MetricBox = React.memo(function MetricBox({
  label,
  value,
  sub,
  colors,
  highlight,
  highlightBorder,
  highlightColor,
}: MetricBoxProps) {
  return (
    <View
      style={[
        styles.metricBox,
        {
          backgroundColor: colors.card,
          borderColor: highlight ? highlightBorder! : colors.border,
        },
      ]}
    >
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricVal, { color: highlight ? highlightColor! : colors.textSecondary }]}>
        {value}
      </Text>
      <Text style={[styles.metricSub, { color: colors.textSecondary }]}>{sub}</Text>
    </View>
  );
});

interface PreviewCardProps {
  preview: DetailedPreview | null;
  colors: any;
  isDark: boolean;
}

export const PreviewCard = React.memo(function PreviewCard({
  preview,
  colors,
  isDark,
}: PreviewCardProps) {
  if (!preview) return null;
  const hasOT = preview.overtimeHours > 0;
  const hasLate = preview.lateArrivalHours > 0;
  const hasEarly = preview.earlyLeaveHours > 0;

  return (
    <Card
      style={{
        ...styles.bnaCard,
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
        borderColor: isDark ? '#1e3a8a' : '#bfdbfe',
        marginTop: 2,
      }}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <TrendingUp size={14} color={colors.primary} />
          <Text style={[styles.title, { color: colors.primary }]}>สรุปการคำนวณสด</Text>
        </View>
        <Text style={[styles.totalText, { color: colors.textSecondary }]}>
          รวมเวลาจริง:{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>
            {preview.totalHours.toFixed(2)} ชม.
          </Text>
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricBox
          label="ชั่วโมงปกติ"
          value={preview.regularHours.toFixed(2)}
          sub="ชม."
          colors={colors}
          highlight
          highlightBorder={colors.border}
          highlightColor="#3b82f6"
        />
        <MetricBox
          label="OT รวม"
          value={hasOT ? `+${preview.overtimeHours.toFixed(2)}` : '0.00'}
          sub={hasOT ? `เช้า ${preview.morningOT || 0} / เย็น ${preview.eveningOT || 0}` : 'ชม.'}
          colors={colors}
          highlight={hasOT}
          highlightBorder={hasOT ? '#16a34a' : colors.border}
          highlightColor={hasOT ? '#16a34a' : colors.textSecondary}
        />
        <MetricBox
          label="มาสาย"
          value={preview.lateArrivalHours.toFixed(2)}
          sub="ชม."
          colors={colors}
          highlight={hasLate}
          highlightBorder={hasLate ? '#f59e0b' : colors.border}
          highlightColor={hasLate ? '#dc2626' : colors.textSecondary}
        />
        <MetricBox
          label="กลับก่อน"
          value={preview.earlyLeaveHours.toFixed(2)}
          sub="ชม."
          colors={colors}
          highlight={hasEarly}
          highlightBorder={hasEarly ? '#f59e0b' : colors.border}
          highlightColor={hasEarly ? '#dc2626' : colors.textSecondary}
        />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  bnaCard: {
    marginBottom: 12,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  totalText: {
    fontSize: 12,
    fontFamily: 'Sarabun_600SemiBold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'Sarabun_600SemiBold',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    fontFamily: 'Sarabun_400Regular',
    marginTop: 1,
  },
});
