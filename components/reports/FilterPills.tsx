import React from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, AlertTriangle, LogOut } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

export type FilterType = 'all' | 'ot' | 'late' | 'early';

interface FilterPillsProps {
  activeFilter: FilterType;
  totalCount: number;
  otCount: number;
  lateCount: number;
  earlyCount: number;
  colors: any;
  isDark: boolean;
  onChange: (f: FilterType) => void;
}

interface PillProps {
  active: boolean;
  colors: any;
  onPress: () => void;
  icon?: any;
  iconColor?: string;
  label: string;
}

const Pill = React.memo(function Pill({ active, colors, onPress, icon, iconColor, label }: PillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, active ? { backgroundColor: colors.primary } : { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon ? (
        <Icon name={icon} size={13} color={active ? '#ffffff' : iconColor} />
      ) : null}
      <Text style={[styles.pillText, { color: colors.textSecondary }, active ? styles.pillTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

export const FilterPills = React.memo(function FilterPills({
  activeFilter,
  totalCount,
  otCount,
  lateCount,
  earlyCount,
  colors,
  isDark,
  onChange,
}: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Pill
        active={activeFilter === 'all'}
        colors={colors}
        onPress={() => onChange('all')}
        label={`ทั้งหมด (${totalCount})`}
      />
      <Pill
        active={activeFilter === 'ot'}
        colors={colors}
        onPress={() => onChange('ot')}
        icon={Zap}
        iconColor={isDark ? '#4ade80' : '#16a34a'}
        label={`มี OT (${otCount})`}
      />
      <Pill
        active={activeFilter === 'late'}
        colors={colors}
        onPress={() => onChange('late')}
        icon={AlertTriangle}
        iconColor={isDark ? '#f87171' : '#dc2626'}
        label={`มาสาย (${lateCount})`}
      />
      {earlyCount > 0 && (
        <Pill
          active={activeFilter === 'early'}
          colors={colors}
          onPress={() => onChange('early')}
          icon={LogOut}
          iconColor={isDark ? '#fb923c' : '#ea580c'}
          label={`กลับก่อน (${earlyCount})`}
        />
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  pillTextActive: {
    color: '#ffffff',
  },
});
