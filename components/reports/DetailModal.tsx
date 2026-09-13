import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X, Edit3 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { TimeEntry } from '../../types';

interface DetailModalProps {
  visible: boolean;
  entry: TimeEntry | null;
  colors: any;
  formatHoursWithDecimal: (h: number) => string;
  formatDateThai: (date: string) => string;
  getDayOfWeekThai: (date: string) => string;
  onClose: () => void;
  onEdit: (entry: TimeEntry) => void;
}

const DetailRow = React.memo(function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{children}</Text>
    </View>
  );
});

export const DetailModal = React.memo(function DetailModal({
  visible,
  entry,
  colors,
  formatHoursWithDecimal,
  formatDateThai,
  getDayOfWeekThai,
  onClose,
  onEdit,
}: DetailModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>รายละเอียดการทำงาน</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name={X} size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {entry && (
            <View style={styles.body}>
              <DetailRow label="วันที่">
                {formatDateThai(entry.date)} ({getDayOfWeekThai(entry.date)})
              </DetailRow>
              <DetailRow label="เวลาเข้างาน">{entry.clockIn || 'ไม่ได้บันทึก'}</DetailRow>
              <DetailRow label="เวลาเลิกงาน">{entry.clockOut || 'ไม่ได้บันทึก'}</DetailRow>
              <DetailRow label="ชั่วโมงปกติ">
                {formatHoursWithDecimal(entry.regularHours || 0)}
              </DetailRow>
              <View style={styles.row}>
                <Text style={styles.label}>ชั่วโมง OT:</Text>
                <Text style={[styles.value, { color: '#16a34a' }]}>
                  {formatHoursWithDecimal(entry.overtimeHours || 0)}
                </Text>
              </View>
              {(entry.lateArrivalHours || 0) > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>ชั่วโมงมาสาย:</Text>
                  <Text style={[styles.value, { color: '#dc2626' }]}>
                    {formatHoursWithDecimal(entry.lateArrivalHours || 0)}
                  </Text>
                </View>
              )}
              {(entry.earlyLeaveHours || 0) > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>กลับก่อนเวลา:</Text>
                  <Text style={[styles.value, { color: '#ea580c' }]}>
                    {formatHoursWithDecimal(entry.earlyLeaveHours || 0)}
                  </Text>
                </View>
              )}
              {entry.reason ? (
                <DetailRow label="หมายเหตุ / เหตุผล">{entry.reason}</DetailRow>
              ) : null}

              <Button
                variant="default"
                size="sm"
                icon={Edit3}
                style={styles.editBtn}
                onPress={() => onEdit(entry)}
              >
                แก้ไขรายการนี้
              </Button>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Sarabun_400Regular',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  editBtn: {
    marginTop: 14,
  },
});
