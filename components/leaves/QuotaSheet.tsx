import React from 'react';
import { View, StyleSheet } from 'react-native';
import { X, Save } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import type { LeaveType } from '../../types';

interface QuotaSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedYear: number;
  colors: any;
  editingQuotas: Record<LeaveType, string>;
  onChangeQuota: (type: LeaveType, value: string) => void;
  onSave: () => void;
}

export const QuotaSheet = React.memo(function QuotaSheet({
  isVisible,
  onClose,
  selectedYear,
  colors,
  editingQuotas,
  onChangeQuota,
  onSave,
}: QuotaSheetProps) {
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.92]}
      title={`แก้ไขโควตาวันลาประจำปี ${selectedYear + 543}`}
      footer={
        <View style={styles.footerRow}>
          <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={onClose}>
            ยกเลิก
          </Button>
          <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={onSave}>
            บันทึกโควตา
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <Text variant="caption" style={{ color: colors.textSecondary }}>
          กำหนดจำนวนวันลาที่ได้รับสิทธิ์ในแต่ละประเภทประจำปี:
        </Text>

        <Input
          label="โควตาลาพักร้อน (วัน)"
          keyboardType="numeric"
          value={editingQuotas.vacation}
          onChangeText={(v) => onChangeQuota('vacation', v)}
        />
        <Input
          label="โควตาลาป่วย (วัน)"
          keyboardType="numeric"
          value={editingQuotas.sick}
          onChangeText={(v) => onChangeQuota('sick', v)}
        />
        <Input
          label="โควตาลากิจ (วัน)"
          keyboardType="numeric"
          value={editingQuotas.personal}
          onChangeText={(v) => onChangeQuota('personal', v)}
        />
        <Input
          label="โควตาลาอื่นๆ (วัน)"
          keyboardType="numeric"
          value={editingQuotas.other}
          onChangeText={(v) => onChangeQuota('other', v)}
        />
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  body: {
    gap: 14,
    paddingBottom: 16,
  },
});
