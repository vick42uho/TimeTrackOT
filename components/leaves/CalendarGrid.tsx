import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import {
  THAI_MONTH_NAMES,
  WEEKDAY_NAMES,
  HOLIDAY_TYPE_CONFIG,
  LEAVE_TYPE_OPTIONS,
} from './leavesConstants';
import type { CalendarDayItem } from './leavesConstants';

interface CalendarGridProps {
  selectedYear: number;
  selectedMonth: number;
  calendarDays: (CalendarDayItem | null)[];
  selectedCalendarDate: string;
  isDark: boolean;
  colors: any;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayPress: (dateStr: string) => void;
}

const DayCell = React.memo(function DayCell({
  item,
  isSelected,
  isDark,
  colors,
  onDayPress,
}: {
  item: CalendarDayItem;
  isSelected: boolean;
  isDark: boolean;
  colors: any;
  onDayPress: (dateStr: string) => void;
}) {
  const hasHoliday = !!item.holiday;
  const hasLeave = !!item.leave;
  const hasActivities = (item.activities?.length || 0) > 0;

  return (
    <TouchableOpacity
      key={item.dateStr}
      onPress={() => onDayPress(item.dateStr)}
      activeOpacity={0.7}
      style={[
        styles.dayCell,
        item.isWeekend && !isSelected && {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
        },
      ]}
    >
      {/* Day Number Circle */}
      <View
        style={[
          styles.dateNumberCircle,
          isSelected && {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 3,
          },
          item.isToday && !isSelected && {
            borderColor: colors.primary,
            borderWidth: 1.5,
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
          },
        ]}
      >
        <Text
          style={[
            styles.dayNumberText,
            {
              color: isSelected
                ? '#ffffff'
                : item.isToday
                  ? colors.primary
                  : item.isWeekend
                    ? colors.textSecondary
                    : colors.text,
              fontWeight: isSelected || item.isToday ? '700' : '500',
            },
          ]}
        >
          {item.dayNumber}
        </Text>
      </View>

      {/* Status Dots Row (Remimo Style) */}
      <View style={styles.statusDotsRow}>
        {hasHoliday && (
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.color || '#3b82f6',
              },
            ]}
          />
        )}
        {hasLeave && (
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.color ||
                  '#f59e0b',
              },
            ]}
          />
        )}
        {hasActivities && (
          <View
            style={[
              styles.statusDot,
              { backgroundColor: '#8b5cf6' },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
});

export const CalendarGrid = React.memo(function CalendarGrid({
  selectedYear,
  selectedMonth,
  calendarDays,
  selectedCalendarDate,
  isDark,
  colors,
  onPrevMonth,
  onNextMonth,
  onDayPress,
}: CalendarGridProps) {
  return (
    <>
      <View style={styles.calendarMonthHeader}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.monthNavBtn}>
          <ChevronLeft size={20} color={colors.primary} />
        </TouchableOpacity>

        <Text variant="subtitle" style={{ fontWeight: '700', fontSize: 16 }}>
          {THAI_MONTH_NAMES[selectedMonth - 1]} {selectedYear + 543}
        </Text>

        <TouchableOpacity onPress={onNextMonth} style={styles.monthNavBtn}>
          <ChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_NAMES.map((w, idx) => (
          <View key={w} style={styles.weekdayCell}>
            <Text
              variant="caption"
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: idx === 0 ? '#ef4444' : idx === 6 ? '#8b5cf6' : colors.textSecondary,
              }}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((item, index) => {
          if (!item) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          const isSelected = item.dateStr === selectedCalendarDate;
          return (
            <DayCell
              key={item.dateStr}
              item={item}
              isSelected={isSelected}
              isDark={isDark}
              colors={colors}
              onDayPress={onDayPress}
            />
          );
        })}
      </View>

      <View style={styles.calendarLegendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
          <Text variant="caption" style={{ fontSize: 11 }}>นักขัตฯ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
          <Text variant="caption" style={{ fontSize: 11 }}>WFH</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#64748b' }]} />
          <Text variant="caption" style={{ fontSize: 11 }}>หยุดปกติ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text variant="caption" style={{ fontSize: 11 }}>วันลา</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
          <Text variant="caption" style={{ fontSize: 11 }}>กิจกรรม</Text>
        </View>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  calendarMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f030',
    paddingBottom: 6,
    marginBottom: 4,
  },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 10,
  },
  dateNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 13,
    fontFamily: 'Sarabun_600SemiBold',
  },
  statusDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  calendarLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f030',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
