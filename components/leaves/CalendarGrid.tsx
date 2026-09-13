import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text as RNText } from 'react-native';
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
  onDayLongPress?: (dateStr: string) => void;
}

const DayCell = React.memo(function DayCell({
  item,
  isSelected,
  isDark,
  colors,
  onDayPress,
  onDayLongPress,
}: {
  item: CalendarDayItem;
  isSelected: boolean;
  isDark: boolean;
  colors: any;
  onDayPress: (dateStr: string) => void;
  onDayLongPress?: (dateStr: string) => void;
}) {
  const hasHoliday = !!item.holiday;
  const hasLeave = !!item.leave;
  const hasActivities = (item.activities?.length || 0) > 0;

  const primaryColor = colors?.primary || '#2563eb';
  const textColor = item.isToday
    ? primaryColor
    : item.isWeekend
      ? (colors?.textSecondary || '#64748b')
      : (colors?.text || (isDark ? '#f8fafc' : '#0f172a'));

  return (
    <TouchableOpacity
      key={item.dateStr}
      onPress={() => onDayPress(item.dateStr)}
      onLongPress={() => onDayLongPress?.(item.dateStr)}
      activeOpacity={0.7}
      style={[
        styles.dayCell,
        item.isWeekend && !isSelected && {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
        },
        isSelected && {
          borderColor: primaryColor,
          borderWidth: 1.5,
          backgroundColor: isDark ? `${primaryColor}25` : '#eff6ff',
        },
        item.isToday && !isSelected && {
          borderWidth: 1,
          borderColor: primaryColor,
        },
      ]}
    >
      {/* Day Number */}
      <RNText
        style={[
          styles.dayNumberText,
          {
            color: textColor,
            fontFamily: isSelected || item.isToday ? 'Sarabun_700Bold' : 'Sarabun_600SemiBold',
          },
        ]}
      >
        {String(item.dayNumber)}
      </RNText>

      {/* Status Badges / Tags on Calendar Day */}
      {hasHoliday && (
        <View
          style={[
            styles.calendarMiniTag,
            {
              backgroundColor: isDark
                ? `${HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.color || '#3b82f6'}35`
                : `${HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.color || '#3b82f6'}18`,
            },
          ]}
        >
          <RNText
            numberOfLines={1}
            style={[
              styles.calendarMiniTagText,
              { color: HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.color || primaryColor },
            ]}
          >
            {HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.shortLabel || 'หยุด'}
          </RNText>
        </View>
      )}

      {hasLeave && (
        <View
          style={[
            styles.calendarMiniTag,
            {
              backgroundColor: isDark
                ? `${LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.color || '#f59e0b'}35`
                : `${LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.color || '#f59e0b'}18`,
            },
          ]}
        >
          <RNText
            numberOfLines={1}
            style={[
              styles.calendarMiniTagText,
              {
                color:
                  LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.color ||
                  '#f59e0b',
              },
            ]}
          >
            {LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.shortLabel || 'ลา'}
          </RNText>
        </View>
      )}

      {/* Activity Dot */}
      {hasActivities && (
        <View style={styles.activityDotContainer}>
          <View style={styles.activityDot} />
        </View>
      )}
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
  onDayLongPress,
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
              onDayLongPress={onDayLongPress}
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
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
    borderRadius: 8,
    marginVertical: 1,
  },
  dayNumberText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    includeFontPadding: false,
  },
  calendarMiniTag: {
    marginTop: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
    maxWidth: '92%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMiniTagText: {
    fontSize: 9,
    fontFamily: 'Sarabun_700Bold',
    includeFontPadding: false,
    textAlign: 'center',
  },
  activityDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
  },
  activityDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#8b5cf6',
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
