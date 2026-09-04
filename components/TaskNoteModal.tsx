import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { showConfirmAlert, showErrorAlert, showNativeAlert } from '@/components/ui/alert';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Icon } from '@/components/ui/icon';
import { useThemeContext } from '@/components/ThemeProvider';
import { triggerHaptic } from '@/hooks/useHaptics';
import { TaskNote, TaskNoteColor, TaskNoteItem, TaskNoteType } from '@/types';
import {
  CheckSquare,
  FileText,
  Pin,
  Plus,
  Trash2,
  X,
  Save,
  Check,
  ExternalLink,
} from 'lucide-react-native';
import { extractUrls, handleOpenURL } from '@/utils/urlHelper';

interface TaskNoteModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: Omit<TaskNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: TaskNote | null;
  onDelete?: (id: number) => Promise<void>;
  defaultDate?: string;
}

const COLOR_OPTIONS: { key: TaskNoteColor; label: string; lightBg: string; darkBg: string }[] = [
  { key: 'default', label: 'มาตรฐาน', lightBg: '#ffffff', darkBg: '#1e293b' },
  { key: 'blue', label: 'ฟ้าอ่อน', lightBg: '#dbeafe', darkBg: '#1e3a8a' },
  { key: 'green', label: 'เขียวมิ้นต์', lightBg: '#dcfce7', darkBg: '#14532d' },
  { key: 'yellow', label: 'เหลืองครีม', lightBg: '#fef3c7', darkBg: '#713f12' },
  { key: 'rose', label: 'ชมพูพีช', lightBg: '#ffe4e6', darkBg: '#881337' },
  { key: 'purple', label: 'ม่วงลาเวนเดอร์', lightBg: '#f3e8ff', darkBg: '#581c87' },
];

export const getTaskNoteBgColor = (
  color: TaskNoteColor,
  isDark: boolean,
  cardFallback: string
): string => {
  switch (color) {
    case 'blue':
      return isDark ? 'rgba(30, 58, 138, 0.45)' : '#eff6ff';
    case 'green':
      return isDark ? 'rgba(20, 83, 45, 0.45)' : '#f0fdf4';
    case 'yellow':
      return isDark ? 'rgba(113, 63, 18, 0.45)' : '#fefce8';
    case 'rose':
      return isDark ? 'rgba(136, 19, 55, 0.45)' : '#fff1f2';
    case 'purple':
      return isDark ? 'rgba(88, 28, 135, 0.45)' : '#faf5ff';
    case 'default':
      return cardFallback;
    default:
      if (color && (color.startsWith('#') || color.startsWith('rgb'))) {
        return color;
      }
      return cardFallback;
  }
};

export const TaskNoteModal: React.FC<TaskNoteModalProps> = ({
  isVisible,
  onClose,
  onSave,
  initialData,
  onDelete,
  defaultDate,
}) => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<TaskNoteType>('checklist');
  const [items, setItems] = useState<TaskNoteItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [color, setColor] = useState<TaskNoteColor>('default');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setType(initialData.type || 'checklist');
        setItems(initialData.items ? [...initialData.items] : []);
        setColor(initialData.color || 'default');
        setIsPinned(!!initialData.isPinned);
      } else {
        setTitle('');
        setContent('');
        setType('checklist');
        setItems([]);
        setNewItemText('');
        setColor('default');
        setIsPinned(false);
      }
    }
  }, [isVisible, initialData]);

  const detectedUrls = useMemo(() => {
    return extractUrls(content);
  }, [content]);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    triggerHaptic('selection');
    const newItem: TaskNoteItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      text: newItemText.trim(),
      isDone: false,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText('');
  };

  const handleToggleItem = (itemId: string) => {
    triggerHaptic('selection');
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, isDone: !it.isDone } : it))
    );
  };

  const handleDeleteItem = (itemId: string) => {
    triggerHaptic('selection');
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showNativeAlert({ title: 'กรุณาระบุหัวข้อ', message: 'โปรดใส่หัวข้องานหรือบันทึก' });
      return;
    }

    try {
      setIsSaving(true);
      triggerHaptic('success');
      const allDone = type === 'checklist' && items.length > 0 && items.every((i) => i.isDone);
      await onSave({
        title: title.trim(),
        content: type === 'note' ? content.trim() : undefined,
        type,
        items: type === 'checklist' ? items : [],
        isCompleted: allDone,
        color,
        isPinned,
        date: defaultDate || new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch (e) {
      showErrorAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้ โปรดลองอีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!initialData?.id || !onDelete) return;
    showConfirmAlert(
      'ลบรายการนี้?',
      `ต้องการลบ "${initialData.title}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      async () => {
        triggerHaptic('warning');
        await onDelete(initialData.id!);
        onClose();
      }
    );
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.92]}
      title={initialData ? 'แก้ไขโน้ต & งาน' : 'สร้างโน้ต & งานใหม่'}
      footer={
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {initialData?.id && onDelete && (
            <Button
              variant="destructive"
              icon={Trash2}
              size="icon"
              onPress={handleDelete}
              style={{ width: 48, height: 48 }}
            />
          )}
          <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={onClose}>
            ยกเลิก
          </Button>
          <Button
            variant="default"
            icon={Save}
            style={{ flex: 1 }}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </View>
      }
    >
      <View style={{ gap: 16, paddingBottom: 24 }}>
        {/* Type Selector (Checklist vs Note) */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDark ? 'rgba(51, 65, 85, 0.4)' : '#f1f5f9',
            borderRadius: 999,
            padding: 4,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setType('checklist');
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: type === 'checklist' ? colors.primary : 'transparent',
            }}
          >
            <Icon name={CheckSquare} size={16} color={type === 'checklist' ? '#ffffff' : colors.textSecondary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: type === 'checklist' ? '#ffffff' : colors.textSecondary,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              สิ่งที่ต้องทำ (To-Do)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setType('note');
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: type === 'note' ? colors.primary : 'transparent',
            }}
          >
            <Icon name={FileText} size={16} color={type === 'note' ? '#ffffff' : colors.textSecondary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: type === 'note' ? '#ffffff' : colors.textSecondary,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              บันทึกข้อความ (Note)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.textSecondary,
              fontFamily: 'Sarabun_700Bold',
              marginBottom: 6,
            }}
          >
            หัวข้อ:
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'checklist' ? 'เช่น ตรวจรับงานส่งของ, จัดทำเอกสาร OT' : 'เช่น สรุปการประชุม, บันทึกช่วยจำ'}
            placeholderTextColor={colors.textSecondary}
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
              color: colors.text,
              fontSize: 15,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 18,
              fontFamily: 'Sarabun_500Medium',
            }}
          />
        </View>

        {/* Content depending on Type */}
        {type === 'checklist' ? (
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              รายการย่อย ({items.length}):
            </Text>

            {items.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 16,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleToggleItem(item.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    borderWidth: item.isDone ? 0 : 2,
                    borderColor: colors.border,
                    backgroundColor: item.isDone ? '#16a34a' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.isDone && <Icon name={Check} size={16} color="#ffffff" />}
                </TouchableOpacity>

                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: item.isDone ? colors.textSecondary : colors.text,
                    textDecorationLine: item.isDone ? 'line-through' : 'none',
                    fontFamily: 'Sarabun_500Medium',
                  }}
                >
                  {item.text}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleDeleteItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name={Trash2} size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Sub-Item Input */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TextInput
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="เพิ่มรายการย่อย..."
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
                style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
                  color: colors.text,
                  fontSize: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 16,
                  fontFamily: 'Sarabun_400Regular',
                }}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddItem}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={Plus} size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                fontFamily: 'Sarabun_700Bold',
                marginBottom: 6,
              }}
            >
              เนื้อหาบันทึก:
            </Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="เขียนบันทึกรายละเอียด..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
                color: colors.text,
                fontSize: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 18,
                minHeight: 110,
                fontFamily: 'Sarabun_400Regular',
              }}
            />

            {/* Detected Clickable URLs */}
            {detectedUrls.length > 0 && (
              <View style={{ gap: 6, marginTop: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: colors.textSecondary,
                    fontFamily: 'Sarabun_600SemiBold',
                  }}
                >
                  ลิงก์ที่ตรวจพบ (แตะเพื่อเปิด):
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {detectedUrls.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={() => {
                        triggerHaptic('selection');
                        handleOpenURL(url);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(37, 99, 235, 0.4)' : '#bfdbfe',
                      }}
                    >
                      <Icon name={ExternalLink} size={13} color={colors.primary} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: colors.primary,
                          fontFamily: 'Sarabun_600SemiBold',
                          textDecorationLine: 'underline',
                          maxWidth: 240,
                        }}
                        numberOfLines={1}
                      >
                        {url}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Color Palette Selection */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              สีการ์ด:
            </Text>
            {color.startsWith('#') && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.primary,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  {color.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {COLOR_OPTIONS.map((opt) => {
              const isSelected = color === opt.key;
              const bg = isDark ? opt.darkBg : opt.lightBg;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic('selection');
                    setColor(opt.key);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: bg,
                    borderWidth: isSelected ? 2.5 : 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <Icon
                      name={Check}
                      size={16}
                      color={opt.key === 'default' && !isDark ? colors.primary : '#ffffff'}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Custom ColorPicker (7th swatch circle) */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: color.startsWith('#') ? 2.5 : 1,
                borderColor: color.startsWith('#') ? colors.primary : colors.border,
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
              }}
            >
              <ColorPicker
                value={
                  color.startsWith('#')
                    ? color
                    : color === 'blue'
                    ? '#3b82f6'
                    : color === 'green'
                    ? '#22c55e'
                    : color === 'yellow'
                    ? '#eab308'
                    : color === 'rose'
                    ? '#f43f5e'
                    : color === 'purple'
                    ? '#a855f7'
                    : '#3b82f6'
                }
                swatchSize={32}
                title="เลือกสีการ์ด"
                cancelText="ยกเลิก"
                confirmText="เลือกสีนี้"
                onColorChange={(newColor) => {
                  setColor(newColor);
                }}
                onColorSelect={(selectedHex) => {
                  triggerHaptic('selection');
                  setColor(selectedHex);
                }}
              />
            </View>
          </View>
        </View>

        {/* Pin to Top Option */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic('selection');
            setIsPinned((prev) => !prev);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isPinned
              ? isDark
                ? 'rgba(59, 130, 246, 0.2)'
                : '#eff6ff'
              : isDark
              ? 'rgba(30, 41, 59, 0.4)'
              : '#f8fafc',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name={Pin} size={18} color={isPinned ? colors.primary : colors.textSecondary} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: isPinned ? '700' : '500',
                color: isPinned ? colors.primary : colors.text,
                fontFamily: isPinned ? 'Sarabun_700Bold' : 'Sarabun_500Medium',
              }}
            >
              ปักหมุดไว้บนสุด (Pin to Top)
            </Text>
          </View>

          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: isPinned ? colors.primary : 'transparent',
              borderWidth: isPinned ? 0 : 2,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPinned && <Icon name={Check} size={14} color="#ffffff" />}
          </View>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};
