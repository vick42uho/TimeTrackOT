import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Settings } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import type { SmartAlarmConfig } from '../../types';

export interface SmartAlarmSummaryShape {
  isTomorrowWorkday: boolean;
  tomorrowText: string;
}

interface SmartAlarmCardProps {
  config: SmartAlarmConfig;
  summary: SmartAlarmSummaryShape;
  colors: any;
  isDark: boolean;
  onToggle: (newVal: boolean) => void;
  onOpenSettings: () => void;
  alarmCardRef?: React.RefObject<View | null>;
}

export const SmartAlarmCard = React.memo(function SmartAlarmCard({
  config,
  summary,
  colors,
  isDark,
  onToggle,
  onOpenSettings,
  alarmCardRef,
}: SmartAlarmCardProps) {
  return (
    <View ref={alarmCardRef as any} collapsable={false}>
      <Card style={{ ...styles.card, backgroundColor: colors.card, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border }}>
        <View style={styles.rowBetween}>
          <View style={styles.leftGroup}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: config.enabled
                    ? isDark
                      ? 'rgba(37, 99, 235, 0.2)'
                      : '#eff6ff'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : '#f1f5f9',
                },
              ]}
            >
              <Icon
                name={Bell}
                size={18}
                color={config.enabled ? '#2563eb' : colors.textSecondary}
              />
            </View>
            <View style={styles.titleCol}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]}>
                  นาฬิกาปลุกวันทำงาน
                </Text>
                {config.enabled ? (
                  <Badge variant="default" style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>
                      {config.alarmTime} น.
                    </Text>
                  </Badge>
                ) : (
                  <Badge variant="secondary" style={styles.offBadge}>
                    <Text style={[styles.offBadgeText, { color: colors.textSecondary }]}>
                      ปิดอยู่
                    </Text>
                  </Badge>
                )}
              </View>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: config.enabled
                      ? summary.isTomorrowWorkday
                        ? colors.primary
                        : '#d97706'
                      : colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {config.enabled
                  ? summary.tomorrowText
                  : 'ปลุกเฉพาะวันทำงาน และเว้นวันหยุด/วันลาให้อัตโนมัติ'}
              </Text>
            </View>
          </View>

          <View style={styles.rightGroup}>
            <Switch
              value={config.enabled}
              onValueChange={onToggle}
            />
            <TouchableOpacity
              onPress={onOpenSettings}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.settingsBtn,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' },
              ]}
            >
              <Icon name={Settings} size={15} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  timeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#2563eb',
  },
  timeBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontFamily: 'Sarabun_700Bold',
  },
  offBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  offBadgeText: {
    fontSize: 10,
    fontFamily: 'Sarabun_600SemiBold',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Sarabun_500Medium',
    marginTop: 2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
