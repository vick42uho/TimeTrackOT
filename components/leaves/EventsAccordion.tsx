import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Calendar as CalendarIcon,
  Building2,
  Plus,
  Download,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { THAI_MONTH_NAMES } from './leavesConstants';
import type { Holiday, HolidayType } from '../../types';

export interface MonthlyItem {
  type: 'holiday' | 'leave';
  id: number;
  date: string;
  title: string;
  badge: React.ReactNode;
  subText?: string;
  rawHoliday?: Holiday;
  rawLeave?: any;
}

interface EventsAccordionProps {
  selectedYear: number;
  selectedMonth: number;
  monthlyItems: MonthlyItem[];
  yearlyPublicHolidays: Holiday[];
  isLoading: boolean;
  colors: any;
  isDark: boolean;
  getThaiDayName: (d: string) => string;
  formatDateThai: (d: string) => string;
  getHolidayBadge: (t: HolidayType) => React.ReactNode;
  onEditHoliday: (h: Holiday) => void;
  onDeleteItem: (item: { type: 'holiday' | 'leave'; id: number; name: string }) => void;
  onPreloadThaiHolidays: () => void;
  onAddHoliday: () => void;
}

const MonthlyRow = React.memo(function MonthlyRow({
  item,
  colors,
  isDark,
  getThaiDayName,
  onEditHoliday,
  onDeleteItem,
}: {
  item: MonthlyItem;
  colors: any;
  isDark: boolean;
  getThaiDayName: (d: string) => string;
  onEditHoliday: (h: Holiday) => void;
  onDeleteItem: (item: { type: 'holiday' | 'leave'; id: number; name: string }) => void;
}) {
  return (
    <View
      style={[
        styles.itemCard,
        { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.itemContent}
        activeOpacity={0.7}
        onPress={() => {
          if (item.type === 'holiday' && item.rawHoliday) {
            onEditHoliday(item.rawHoliday);
          }
        }}
      >
        <View style={styles.itemMetaRow}>
          {item.badge}
          <Text variant="caption" style={{ color: colors.textSecondary }}>
            {getThaiDayName(item.date)}
          </Text>
        </View>
        <Text variant="subtitle" style={styles.itemTitle}>
          {item.title}
        </Text>
        <Text variant="caption" style={[styles.itemSub, { color: colors.primary }]}>
          {item.subText}
        </Text>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        {item.type === 'holiday' && item.rawHoliday && (
          <TouchableOpacity
            onPress={() => onEditHoliday(item.rawHoliday!)}
            style={[styles.iconEditBtn, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}
          >
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => onDeleteItem({ type: item.type, id: item.id, name: item.title })}
          style={[styles.iconDeleteBtn, { backgroundColor: colors.errorLight || '#fee2e2' }]}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const YearlyRow = React.memo(function YearlyRow({
  h,
  colors,
  isDark,
  getThaiDayName,
  formatDateThai,
  getHolidayBadge,
  onEditHoliday,
  onDeleteItem,
}: {
  h: Holiday;
  colors: any;
  isDark: boolean;
  getThaiDayName: (d: string) => string;
  formatDateThai: (d: string) => string;
  getHolidayBadge: (t: HolidayType) => React.ReactNode;
  onEditHoliday: (h: Holiday) => void;
  onDeleteItem: (item: { type: 'holiday' | 'leave'; id: number; name: string }) => void;
}) {
  return (
    <View
      style={[
        styles.itemCard,
        { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.itemContent}
        activeOpacity={0.7}
        onPress={() => onEditHoliday(h)}
      >
        <View style={styles.itemMetaRow}>
          {getHolidayBadge(h.type)}
          <Text variant="caption" style={{ color: colors.textSecondary }}>
            {getThaiDayName(h.date)}
          </Text>
        </View>
        <Text variant="subtitle" style={styles.itemTitle}>
          {h.name}
        </Text>
        <Text variant="caption" style={[styles.itemSub, { color: colors.primary }]}>
          {formatDateThai(h.date)}
        </Text>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        <TouchableOpacity
          onPress={() => onEditHoliday(h)}
          style={[styles.iconEditBtn, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}
        >
          <Edit3 size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDeleteItem({ type: 'holiday', id: h.id!, name: h.name })}
          style={[styles.iconDeleteBtn, { backgroundColor: colors.errorLight || '#fee2e2' }]}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const EventsAccordion = React.memo(function EventsAccordion({
  selectedYear,
  selectedMonth,
  monthlyItems,
  yearlyPublicHolidays,
  isLoading,
  colors,
  isDark,
  getThaiDayName,
  formatDateThai,
  getHolidayBadge,
  onEditHoliday,
  onDeleteItem,
  onPreloadThaiHolidays,
  onAddHoliday,
}: EventsAccordionProps) {
  return (
    <View style={styles.wrap}>
      <Accordion type="multiple" defaultValue={['item-month']}>
        <AccordionItem value="item-month">
          <Card style={styles.cardGap}>
            <AccordionTrigger>
              <View style={styles.triggerRow}>
                <CalendarIcon size={18} color={colors.primary} />
                <Text variant="subtitle" style={styles.triggerTitle}>
                  รายการในเดือน{THAI_MONTH_NAMES[selectedMonth - 1]} ({monthlyItems.length})
                </Text>
              </View>
            </AccordionTrigger>
            <AccordionContent style={styles.accordionBody}>
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : monthlyItems.length > 0 ? (
                <View style={styles.listGap}>
                  {monthlyItems.map((item) => (
                    <MonthlyRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      colors={colors}
                      isDark={isDark}
                      getThaiDayName={getThaiDayName}
                      onEditHoliday={onEditHoliday}
                      onDeleteItem={onDeleteItem}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text variant="caption" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                    ไม่มีรายการในเดือนนี้ แตะวันที่บนปฏิทินเพื่อกำหนด WFH, วันหยุด หรือการลา
                  </Text>
                </View>
              )}
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-year">
          <Card style={styles.cardGap}>
            <AccordionTrigger>
              <View style={styles.triggerRow}>
                <Building2 size={18} color="#2563eb" />
                <Text variant="subtitle" style={styles.triggerTitle}>
                  วันหยุดประจำปี พ.ศ. {selectedYear + 543} ({yearlyPublicHolidays.length} วัน)
                </Text>
              </View>
            </AccordionTrigger>
            <AccordionContent style={styles.accordionBody}>
              <View style={styles.actionBar}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  style={{ flex: 1 }}
                  onPress={onPreloadThaiHolidays}
                >
                  โหลดวันหยุดไทย
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  icon={Plus}
                  style={{ flex: 1 }}
                  onPress={onAddHoliday}
                >
                  เพิ่มวันหยุด
                </Button>
              </View>

              {yearlyPublicHolidays.length > 0 ? (
                <View style={styles.listGap}>
                  {yearlyPublicHolidays.map((h) => (
                    <YearlyRow
                      key={h.id || h.date}
                      h={h}
                      colors={colors}
                      isDark={isDark}
                      getThaiDayName={getThaiDayName}
                      formatDateThai={formatDateThai}
                      getHolidayBadge={getHolidayBadge}
                      onEditHoliday={onEditHoliday}
                      onDeleteItem={onDeleteItem}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text
                    variant="caption"
                    style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 8 }}
                  >
                    ยังไม่ได้ตั้งค่าวัดหยุดประจำปี {selectedYear + 543}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Download}
                    onPress={onPreloadThaiHolidays}
                  >
                    โหลดวันหยุดไทยอัตโนมัติ ({selectedYear + 543})
                  </Button>
                </View>
              )}
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  cardGap: {
    marginBottom: 12,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerTitle: {
    fontWeight: '700',
  },
  accordionBody: {
    marginTop: 10,
    paddingBottom: 4,
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listGap: {
    gap: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 0,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSub: {
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconEditBtn: {
    padding: 8,
    borderRadius: 999,
  },
  iconDeleteBtn: {
    padding: 8,
    borderRadius: 999,
  },
});
