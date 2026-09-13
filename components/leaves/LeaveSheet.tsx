import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { X, Save, Camera, Image as ImageIcon, Trash2, Eye, FileImage } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { DatePicker, DateRange } from '@/components/ui/date-picker';
import { LEAVE_TYPE_OPTIONS } from './leavesConstants';
import { pickImageFromGallery, takePhotoWithCamera } from '@/utils/leaveAttachmentHelper';
import type { LeaveDurationType, LeaveRequest, LeaveType } from '../../types';

interface LeaveSheetProps {
  isVisible: boolean;
  onClose: () => void;
  editingLeave?: LeaveRequest | null;
  leaveType: LeaveType;
  onChangeLeaveType: (t: LeaveType) => void;
  leaveDurationType: LeaveDurationType;
  onChangeDurationType: (t: LeaveDurationType) => void;
  leaveRange: DateRange | undefined;
  onChangeLeaveRange: (r: DateRange) => void;
  leaveReason: string;
  onChangeLeaveReason: (v: string) => void;
  leaveAttachmentUri?: string;
  onChangeAttachmentUri?: (v: string) => void;
  onPreviewAttachment?: (uri: string) => void;
  colors: any;
  onSave: () => void;
}

const DURATION_OPTIONS: { type: LeaveDurationType; label: string }[] = [
  { type: 'full_day', label: 'เต็มวัน' },
  { type: 'half_day_morning', label: 'ครึ่งวันเช้า' },
  { type: 'half_day_afternoon', label: 'ครึ่งวันบ่าย' },
];

export const LeaveSheet = React.memo(function LeaveSheet({
  isVisible,
  onClose,
  editingLeave,
  leaveType,
  onChangeLeaveType,
  leaveDurationType,
  onChangeDurationType,
  leaveRange,
  onChangeLeaveRange,
  leaveReason,
  onChangeLeaveReason,
  leaveAttachmentUri = '',
  onChangeAttachmentUri,
  onPreviewAttachment,
  colors,
  onSave,
}: LeaveSheetProps) {
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.96]}
      title={editingLeave ? 'แก้ไขการลา' : 'บันทึกการลา / ยื่นขอลา'}
      footer={
        <View style={styles.footerRow}>
          <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={onClose}>
            ยกเลิก
          </Button>
          <Button variant="default" icon={Save} style={{ flex: 1 }} onPress={onSave}>
            {editingLeave ? 'บันทึกการแก้ไข' : 'บันทึกการลา'}
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <View>
          <Text variant="caption" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ประเภทการลา:
          </Text>
          <View style={styles.pillWrap}>
            {LEAVE_TYPE_OPTIONS.map((opt) => {
              const isSel = leaveType === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => onChangeLeaveType(opt.type)}
                  style={[
                    styles.leaveTypePill,
                    {
                      backgroundColor: isSel ? opt.color : colors.card,
                      borderColor: isSel ? opt.color : colors.border,
                    },
                  ]}
                >
                  <opt.icon size={16} color={isSel ? '#fff' : colors.text} />
                  <Text
                    variant="caption"
                    style={{
                      color: isSel ? '#fff' : colors.text,
                      fontWeight: isSel ? '700' : '500',
                      marginLeft: 6,
                    }}
                  >
                    {opt.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <Text variant="caption" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ระยะเวลาการลา:
          </Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.type}
                onPress={() => onChangeDurationType(d.type)}
                style={[
                  styles.durationPill,
                  {
                    flex: 1,
                    backgroundColor: leaveDurationType === d.type ? colors.primary : colors.card,
                    borderColor: leaveDurationType === d.type ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: leaveDurationType === d.type ? '#fff' : colors.text,
                    fontWeight: leaveDurationType === d.type ? '700' : '400',
                    textAlign: 'center',
                  }}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <DatePicker
          label="ช่วงวันที่ลา"
          mode="range"
          value={leaveRange}
          onChange={(r) => r && onChangeLeaveRange(r)}
        />

        <Input
          label="เหตุผลการลา (ไม่บังคับ)"
          placeholder="เช่น พักผ่อนประจำปี, ลาไปหาหมอ"
          value={leaveReason}
          onChangeText={onChangeLeaveReason}
        />

        {/* Attachment / Medical Certificate Section */}
        <View>
          <Text variant="caption" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {leaveType === 'sick' ? 'ใบรับรองแพทย์ / เอกสารแนบ (ไม่บังคับ):' : 'เอกสารหลักฐานแนบ (ไม่บังคับ):'}
          </Text>

          {leaveAttachmentUri ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onPreviewAttachment?.(leaveAttachmentUri)}
                style={{ position: 'relative' }}
              >
                <Image
                  source={{ uri: leaveAttachmentUri }}
                  style={{ width: 64, height: 64, borderRadius: 8 }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    right: 4,
                    bottom: 4,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    borderRadius: 10,
                    padding: 3,
                  }}
                >
                  <Eye size={12} color="#ffffff" />
                </View>
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <FileImage size={14} color="#10b981" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, fontFamily: 'Sarabun_700Bold' }}>
                    {leaveType === 'sick' ? 'แนบใบรับรองแพทย์แล้ว' : 'แนบเอกสารหลักฐานแล้ว'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onPress={() => onPreviewAttachment?.(leaveAttachmentUri)}
                    style={{ flex: 1, paddingVertical: 4 }}
                  >
                    ดูรูป
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    onPress={() => onChangeAttachmentUri?.('')}
                    style={{ paddingVertical: 4, borderColor: '#ef4444' }}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>ลบ</Text>
                  </Button>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={async () => {
                  const res = await takePhotoWithCamera();
                  if (res.success && res.uri) {
                    onChangeAttachmentUri?.(res.uri);
                  }
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Camera size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, fontFamily: 'Sarabun_600SemiBold' }}>
                  ถ่ายรูป
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  const res = await pickImageFromGallery();
                  if (res.success && res.uri) {
                    onChangeAttachmentUri?.(res.uri);
                  }
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <ImageIcon size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, fontFamily: 'Sarabun_600SemiBold' }}>
                  เลือกจากคลังภาพ
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leaveTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
});
