import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, ImageIcon, FileImage, Eye, Trash2, CheckCircle2 } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/hooks/useHaptics';
import {
  takePhotoWithCamera,
  pickImageFromGallery,
  deleteAttachmentFile,
} from '@/utils/leaveAttachmentHelper';

interface TimeEntryAttachmentCardProps {
  attachmentUri?: string;
  colors: any;
  isDark: boolean;
  onChangeAttachmentUri: (uri: string) => void;
  onPreview: (uri: string) => void;
}

export const TimeEntryAttachmentCard: React.FC<TimeEntryAttachmentCardProps> = React.memo(
  function TimeEntryAttachmentCard({
    attachmentUri,
    colors,
    isDark,
    onChangeAttachmentUri,
    onPreview,
  }) {
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleTakePhoto = async () => {
      triggerHaptic('impact-light');
      setIsProcessing(true);
      try {
        const res = await takePhotoWithCamera({
          prefix: 'time_entry_proof',
          permissionMessage:
            'กรุณาอนุญาตให้แอปเข้าถึงกล้องถ่ายรูปในการตั้งค่า เพื่อถ่ายภาพหน้าเครื่องสแกนนิ้วหรือบัตรตอกไว้เป็นหลักฐาน',
        });
        if (res.success && res.uri) {
          triggerHaptic('selection');
          onChangeAttachmentUri(res.uri);
        }
      } finally {
        setIsProcessing(false);
      }
    };

    const handlePickGallery = async () => {
      triggerHaptic('impact-light');
      setIsProcessing(true);
      try {
        const res = await pickImageFromGallery({
          prefix: 'time_entry_proof',
          permissionMessage:
            'กรุณาอนุญาตให้แอปเข้าถึงคลังรูปภาพในการตั้งค่า เพื่อเลือกภาพถ่ายหลักฐานการลงเวลา',
        });
        if (res.success && res.uri) {
          triggerHaptic('selection');
          onChangeAttachmentUri(res.uri);
        }
      } finally {
        setIsProcessing(false);
      }
    };

    const handleDeletePhoto = async () => {
      triggerHaptic('impact-light');
      if (attachmentUri) {
        await deleteAttachmentFile(attachmentUri);
      }
      onChangeAttachmentUri('');
    };

    return (
      <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.18)' : '#eff6ff' }]}>
            <Camera size={18} color="#2563EB" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>หลักฐานการลงเวลา (ภาพถ่าย)</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              ถ่ายภาพหน้าเครื่องสแกนนิ้ว / บัตรตอก / หน้าจอ เป็นหลักฐาน
            </Text>
          </View>
        </View>

        {/* Content */}
        {isProcessing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>กำลังประมวลผลรูปภาพ...</Text>
          </View>
        ) : attachmentUri ? (
          <View
            style={[
              styles.previewContainer,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                borderColor: colors.border,
              },
            ]}
          >
            {/* Thumbnail */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onPreview(attachmentUri)}
              style={styles.thumbTouch}
            >
              <Image source={{ uri: attachmentUri }} style={styles.thumbnail} resizeMode="cover" />
              <View style={styles.zoomOverlay}>
                <Eye size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>

            {/* Info & Actions */}
            <View style={styles.infoCol}>
              <View style={styles.statusRow}>
                <CheckCircle2 size={15} color="#10b981" />
                <Text style={[styles.statusText, { color: colors.text }]}>แนบหลักฐานแล้ว</Text>
              </View>

              <View style={styles.actionBtnRow}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  onPress={() => {
                    triggerHaptic('impact-light');
                    onPreview(attachmentUri);
                  }}
                  style={styles.viewBtn}
                >
                  ดูรูป
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Camera}
                  onPress={handleTakePhoto}
                  style={styles.retakeBtn}
                >
                  ถ่ายใหม่
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onPress={handleDeletePhoto}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>ลบ</Text>
                </Button>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleTakePhoto}
              style={[
                styles.actionPill,
                {
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff',
                  borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe',
                },
              ]}
            >
              <Camera size={16} color="#2563EB" />
              <Text style={styles.actionPillTextPrimary}>ถ่ายรูปหลักฐาน</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePickGallery}
              style={[
                styles.actionPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                  borderColor: colors.border,
                },
              ]}
            >
              <ImageIcon size={16} color={colors.textSecondary} />
              <Text style={[styles.actionPillTextSecondary, { color: colors.text }]}>เลือกจากอัลบั้ม</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
    fontFamily: 'Sarabun_400Regular',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'Sarabun_500Medium',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  thumbTouch: {
    position: 'relative',
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#00000020',
  },
  zoomOverlay: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    padding: 3,
  },
  infoCol: {
    flex: 1,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 4,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 4,
  },
  deleteBtn: {
    paddingVertical: 4,
    borderColor: '#ef4444',
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  emptyButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionPillTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Sarabun_600SemiBold',
  },
  actionPillTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
});
