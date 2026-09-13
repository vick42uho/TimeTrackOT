import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LeaveSummary, LeaveType } from '../../types';

interface QuotaOverviewTabProps {
  selectedYear: number;
  summaries: LeaveSummary[];
  colors: any;
  getLeaveTypeBadge: (type: LeaveType) => React.ReactNode;
  onOpenEditQuota: () => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  quotasCardRef?: React.RefObject<View | null>;
}

export const QuotaOverviewTab = React.memo(function QuotaOverviewTab({
  selectedYear,
  summaries,
  colors,
  getLeaveTypeBadge,
  onOpenEditQuota,
  scrollViewRef,
  quotasCardRef,
}: QuotaOverviewTabProps) {
  return (
    <ScrollView
      ref={scrollViewRef as any}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View
        ref={quotasCardRef as any}
        collapsable={false}
        style={styles.headerRow}
      >
        <Text variant="subtitle" style={styles.headerTitle}>
          โควตาวันลาประจำปี {selectedYear + 543}
        </Text>
        <Button variant="outline" size="sm" icon={RefreshCw} onPress={onOpenEditQuota}>
          แก้ไขโควตา
        </Button>
      </View>

      <View style={styles.cardList}>
        {summaries.map((s) => {
          const percent =
            s.quotaDays > 0 ? Math.min(100, Math.round((s.usedDays / s.quotaDays) * 100)) : 0;
          return (
            <Card key={s.leaveType}>
              <CardHeader style={styles.cardHeader}>
                <View style={styles.headerInner}>
                  <View style={styles.badgeLabelRow}>
                    {getLeaveTypeBadge(s.leaveType)}
                    <Text variant="subtitle" style={styles.leaveTypeTitle}>
                      {s.label.split(' ')[0]}
                    </Text>
                  </View>
                  <Badge variant={s.remainingDays > 0 ? 'success' : 'destructive'}>
                    เหลือ {s.remainingDays} วัน
                  </Badge>
                </View>
              </CardHeader>
              <CardContent>
                <View style={styles.quotaBarBg}>
                  <View
                    style={[
                      styles.quotaBarFill,
                      {
                        width: `${percent}%`,
                        backgroundColor:
                          percent > 90 ? '#ef4444' : percent > 60 ? '#f59e0b' : colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.footerRow}>
                  <Text variant="caption" style={{ color: colors.textSecondary }}>
                    ใช้ไป {s.usedDays} วัน ({percent}%)
                  </Text>
                  <Text variant="caption" style={{ color: colors.textSecondary }}>
                    โควตาทั้งหมด {s.quotaDays} วัน
                  </Text>
                </View>
              </CardContent>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontWeight: '700',
  },
  cardList: {
    gap: 12,
  },
  cardHeader: {
    marginBottom: 6,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveTypeTitle: {
    fontWeight: '600',
  },
  quotaBarBg: {
    height: 8,
    backgroundColor: '#e2e8f030',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
