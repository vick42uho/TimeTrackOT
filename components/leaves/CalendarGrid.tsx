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

function getMiniTagColors(type: string, isDark: boolean): { bg: string; text: string } {
  switch (type) {
    case 'wfh':
      return {
        bg: isDark ? 'rgba(22, 163, 74, 0.25)' : '#dcfce7',
        text: isDark ? '#86efac' : '#16a34a',
      };
    case 'regular_off':
      return {
        bg: isDark ? 'rgba(100, 116, 139, 0.25)' : '#f1f5f9',
        text: isDark ? '#cbd5e1' : '#64748b',
      };
    case 'sick':
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.22)' : '#fee2e2',
        text: isDark ? '#fca5a5' : '#ef4444',
      };
    case 'vacation':
    case 'public':
      return {
        bg: isDark ? 'rgba(37, 99, 235, 0.22)' : '#dbeafe',
        text: isDark ? '#93c5fd' : '#2563eb',
      };
    case 'personal':
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.22)' : '#fef3c7',
        text: isDark ? '#fcd34d' : '#d97706',
      };
    case 'company':
    case 'other':
      return {
        bg: isDark ? 'rgba(124, 58, 237, 0.22)' : '#f3e8ff',
        text: isDark ? '#c4b5fd' : '#7c3aed',
      };
    default:
      return {
        bg: isDark ? 'rgba(100, 116, 139, 0.25)' : '#f1f5f9',
        text: isDark ? '#cbd5e1' : '#64748b',
      };
  }
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
  const textColor = isSelected
    ? primaryColor
    : item.isWeekend
      ? (isDark ? '#94a3b8' : '#64748b')
      : (colors?.text || (isDark ? '#f8fafc' : '#1e293b'));

  const holidayColors = item.holiday ? getMiniTagColors(item.holiday.type, isDark) : null;
  const leaveColors = item.leave ? getMiniTagColors(item.leave.leaveType, isDark) : null;

  return (
    <TouchableOpacity
      key={item.dateStr}
      onPress={() => onDayPress(item.dateStr)}
      onLongPress={() => onDayLongPress?.(item.dateStr)}
      activeOpacity={0.7}
      style={[
        styles.dayCell,
        item.isWeekend && !isSelected && {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
        },
        isSelected && {
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
        },
      ]}
    >
      {/* Day Number */}
      <RNText
        style={[
          styles.dayNumberText,
          {
            color: textColor,
            fontFamily: isSelected ? 'Sarabun_700Bold' : 'Sarabun_600SemiBold',
          },
        ]}
      >
        {String(item.dayNumber)}
      </RNText>

      {/* Status Badges / Tags on Calendar Day */}
      {hasHoliday && holidayColors && (
        <View
          style={[
            styles.calendarMiniTag,
            { backgroundColor: holidayColors.bg },
          ]}
        >
          <RNText
            numberOfLines={1}
            style={[
              styles.calendarMiniTagText,
              { color: holidayColors.text },
            ]}
          >
            {HOLIDAY_TYPE_CONFIG[item.holiday!.type]?.shortLabel || 'หยุด'}
          </RNText>
        </View>
      )}

      {hasLeave && leaveColors && (
        <View
          style={[
            styles.calendarMiniTag,
            { backgroundColor: leaveColors.bg },
          ]}
        >
          <RNText
            numberOfLines={1}
            style={[
              styles.calendarMiniTagText,
              { color: leaveColors.text },
            ]}
          >
            {LEAVE_TYPE_OPTIONS.find((o) => o.type === item.leave!.leaveType)?.shortLabel || 'ลา'}
          </RNText>
        </View>
      )}

      {/* Activity Dot / Second Indicator */}
      {hasActivities && (
        <View style={styles.activityDotContainer}>
          <View
            style={[
              styles.activityDot,
              {
                backgroundColor: hasHoliday || hasLeave ? '#64748b' : '#8b5cf6',
                marginTop: hasHoliday || hasLeave ? 2 : 4,
              },
            ]}
          />
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

        <Text variant="subtitle" style={{ fontWeight: '700', fontSize: 18, fontFamily: 'Sarabun_700Bold' }}>
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
              style={{
                fontSize: 13,
                fontFamily: 'Sarabun_700Bold',
                color:
                  idx === 0
                    ? '#ef4444'
                    : idx === 6
                      ? '#8b5cf6'
                      : isDark
                        ? '#94a3b8'
                        : '#64748b',
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
          <Text variant="caption" style={{ fontSize: 12, color: colors.textSecondary }}>นักขัตฯ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
          <Text variant="caption" style={{ fontSize: 12, color: colors.textSecondary }}>WFH</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#64748b' }]} />
          <Text variant="caption" style={{ fontSize: 12, color: colors.textSecondary }}>หยุดปกติ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text variant="caption" style={{ fontSize: 12, color: colors.textSecondary }}>วันลา</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
          <Text variant="caption" style={{ fontSize: 12, color: colors.textSecondary }}>กิจกรรม</Text>
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
    marginBottom: 10,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    marginBottom: 6,
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
    height: 58,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 12,
    marginVertical: 2,
  },
  dayNumberText: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  calendarMiniTag: {
    marginTop: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    maxWidth: '92%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMiniTagText: {
    fontSize: 10,
    fontFamily: 'Sarabun_700Bold',
    includeFontPadding: false,
    textAlign: 'center',
  },
  activityDotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  calendarLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
