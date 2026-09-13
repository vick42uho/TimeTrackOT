import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palmtree, Home, FileText } from 'lucide-react-native';

interface StatusNoticesProps {
  todayStatus: {
    isHoliday?: boolean;
    holidayName?: string;
    isWFH?: boolean;
    isLeave?: boolean;
    leaveType?: string;
    leaveReason?: string;
  };
  colors: any;
  isDark: boolean;
}

export const StatusNotices = React.memo(function StatusNotices({
  todayStatus,
  colors,
  isDark,
}: StatusNoticesProps) {
  return (
    <>
      {todayStatus.isHoliday && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? '#1e3a8a25' : '#eff6ff',
              borderColor: isDark ? '#3b82f640' : '#bfdbfe',
            },
          ]}
        >
          <Palmtree size={20} color={colors.primary} />
          <View style={styles.flex1}>
            <Text style={[styles.bannerTitle, { color: colors.primary }]}>
              วันนี้เป็นวันหยุด: {todayStatus.holidayName}
            </Text>
            <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
              วันหยุดนักขัตฤกษ์ / ประจำปี ไม่นับเป็นวันทำงาน
            </Text>
          </View>
        </View>
      )}

      {todayStatus.isWFH && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? '#14532d25' : '#f0fdf4',
              borderColor: isDark ? '#16a34a40' : '#bbf7d0',
            },
          ]}
        >
          <Home size={20} color="#16a34a" />
          <View style={styles.flex1}>
            <Text style={[styles.bannerTitle, { color: '#16a34a' }]}>
              วันนี้ทำงานที่บ้าน (Work From Home)
            </Text>
            <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
              บันทึกเวลาทำงานและคำนวณ OT ได้ตามปกติ
            </Text>
          </View>
        </View>
      )}

      {todayStatus.isLeave && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? '#312e8125' : '#f5f3ff',
              borderColor: isDark ? '#8b5cf640' : '#ddd6fe',
            },
          ]}
        >
          <FileText size={20} color="#8b5cf6" />
          <View style={styles.flex1}>
            <Text style={[styles.bannerTitle, { color: '#8b5cf6' }]}>
              วันนี้อยู่ในช่วงลา:{' '}
              {todayStatus.leaveType === 'vacation'
                ? 'ลาพักร้อน'
                : todayStatus.leaveType === 'sick'
                  ? 'ลาป่วย'
                  : todayStatus.leaveType === 'personal'
                    ? 'ลากิจ'
                    : 'การลา'}
            </Text>
            {todayStatus.leaveReason && (
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                เหตุผล: {todayStatus.leaveReason}
              </Text>
            )}
          </View>
        </View>
      )}
    </>
  );
});

interface HeaderStatus {
  isHoliday?: boolean;
  isLeave?: boolean;
  isWFH?: boolean;
}

interface HeaderStatusChipProps {
  todayStatus: HeaderStatus;
  todayEntry: any;
  colors: any;
  isDark: boolean;
}

export const HeaderStatusChip = React.memo(function HeaderStatusChip({
  todayStatus,
  todayEntry,
  colors,
  isDark,
}: HeaderStatusChipProps) {
  const key = todayStatus.isHoliday
    ? 'holiday'
    : todayStatus.isLeave
      ? 'leave'
      : todayStatus.isWFH
        ? 'wfh'
        : todayEntry?.clockOut
          ? 'done'
          : todayEntry?.clockIn
            ? 'working'
            : 'idle';

  const cfg: Record<string, { bg: string; border: string; dot: string; text: string; label: string }> = {
    holiday: {
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
      border: '#3b82f6',
      dot: '#3b82f6',
      text: '#3b82f6',
      label: 'วันหยุด',
    },
    leave: {
      bg: isDark ? 'rgba(168, 85, 247, 0.15)' : '#f5f3ff',
      border: '#8b5cf6',
      dot: '#8b5cf6',
      text: '#8b5cf6',
      label: 'ลางาน',
    },
    wfh: {
      bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
      border: '#22c55e',
      dot: '#22c55e',
      text: '#16a34a',
      label: 'WFH',
    },
    done: {
      bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
      border: '#16a34a',
      dot: '#16a34a',
      text: '#16a34a',
      label: 'เสร็จสิ้น',
    },
    working: {
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
      border: '#2563eb',
      dot: '#2563eb',
      text: '#2563eb',
      label: 'กำลังทำงาน',
    },
    idle: {
      bg: colors.backgroundAlt,
      border: colors.border,
      dot: colors.textSecondary,
      text: colors.textSecondary,
      label: 'ยังไม่ลงเวลา',
    },
  };

  const c = cfg[key];

  return (
    <View style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.chipText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: 'Sarabun_400Regular',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
});
