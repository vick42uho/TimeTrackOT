import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Save, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { HOLIDAY_TYPE_CONFIG } from './leavesConstants';
import type { Holiday, HolidayType } from '../../types';

interface HolidaySheetProps {
  isVisible: boolean;
  onClose: () => void;
  editingHoliday: Holiday | null;
  holidayName: string;
  onChangeHolidayName: (v: string) => void;
  holidayDate: Date;
  onChangeHolidayDate: (d: Date) => void;
  holidayType: HolidayType;
  onChangeHolidayType: (t: HolidayType) => void;
  colors: any;
  isDark: boolean;
  getHolidayBadge: (t: HolidayType) => React.ReactNode;
  onSave: () => void;
}

export const HolidaySheet = React.memo(function HolidaySheet({
  isVisible,
  onClose,
  editingHoliday,
  holidayName,
  onChangeHolidayName,
  holidayDate,
  onChangeHolidayDate,
  holidayType,
  onChangeHolidayType,
  colors,
  isDark,
  getHolidayBadge,
  onSave,
}: HolidaySheetProps) {
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.96]}
      title={editingHoliday ? 'แก้ไขวันหยุด / สถานะ' : 'เพิ่มวันหยุด / WFH'}
      footer={
        <View style={styles.footerRow}>
          <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={onClose}>
            ยกเลิก
          </Button>
          <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={onSave}>
            {editingHoliday ? 'บันทึกการแก้ไข' : 'บันทึกวันหยุด'}
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <Input
          label="ชื่อวันหยุด / หมายเหตุ"
          placeholder="เช่น วันหยุดประจำปีบริษัท, WFH ประจำสัปดาห์"
          value={holidayName}
          onChangeText={onChangeHolidayName}
        />

        <DatePicker
          label="วันที่"
          mode="date"
          value={holidayDate}
          onChange={(d) => d && onChangeHolidayDate(d)}
        />

        <View>
          <Text variant="caption" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ประเภทวันหยุด / สถานะ:
          </Text>
          <View style={styles.typeList}>
            {(Object.keys(HOLIDAY_TYPE_CONFIG) as HolidayType[]).map((t) => {
              const isSel = holidayType === t;
              const cfg = HOLIDAY_TYPE_CONFIG[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => onChangeHolidayType(t)}
                  style={[
                    styles.typeSelectorRow,
                    {
                      backgroundColor: isSel
                        ? isDark
                          ? `${cfg.color}30`
                          : `${cfg.color}15`
                        : colors.card,
                      borderColor: isSel ? cfg.color : colors.border,
                    },
                  ]}
                >
                  <View style={styles.typeLabelRow}>
                    {getHolidayBadge(t)}
                    <Text variant="subtitle" style={{ fontWeight: isSel ? '700' : '400' }}>
                      {cfg.label}
                    </Text>
                  </View>
                  {isSel && <Check size={18} color={cfg.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
    gap: 16,
    paddingBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  typeList: {
    gap: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
  },
  typeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
});
