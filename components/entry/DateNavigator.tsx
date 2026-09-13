import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';

interface DateNavigatorProps {
  selectedDate: string;
  isTodayDate: boolean;
  currentEntry: any;
  colors: any;
  isDark: boolean;
  getThaiDayName: (date: string) => string;
  formatDateThai: (date: string) => string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenPicker: () => void;
}

export const DateNavigator = React.memo(function DateNavigator({
  selectedDate,
  isTodayDate,
  currentEntry,
  colors,
  isDark,
  getThaiDayName,
  formatDateThai,
  onPrevDay,
  onNextDay,
  onOpenPicker,
}: DateNavigatorProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={styles.arrow}
        onPress={onPrevDay}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ChevronLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerBtn}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpenPicker();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.titleRow}>
          <CalendarIcon size={16} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {getThaiDayName(selectedDate)}, {formatDateThai(selectedDate)}
          </Text>
        </View>
        <View style={styles.badgesRow}>
          {isTodayDate && (
            <View
              style={[
                styles.badge,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>วันนี้</Text>
            </View>
          )}
          {currentEntry ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' },
              ]}
            >
              <View style={styles.dot} />
              <Text style={[styles.badgeText, { color: '#16a34a' }]}>
                บันทึกแล้ว ({currentEntry.clockIn || '-'} - {currentEntry.clockOut || '-'})
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.badge,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9' },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                ยังไม่ได้บันทึก
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.arrow}
        onPress={onNextDay}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ChevronRight size={22} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 0,
  },
  arrow: {
    padding: 8,
    borderRadius: 999,
  },
  centerBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 4,
  },
});
