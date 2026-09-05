import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showConfirmAlert, showErrorAlert, showNativeAlert } from '@/components/ui/alert';
import { ColorPicker } from '@/components/ui/color-picker';
import { Icon } from '@/components/ui/icon';
import { useThemeContext } from '@/components/ThemeProvider';
import { triggerHaptic } from '@/hooks/useHaptics';
import { TaskNote, TaskNoteColor, TaskNoteItem, TaskNoteType } from '@/types';
import {
  ArrowLeft,
  Check,
  CheckSquare,
  FileText,
  Pin,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  ListTodo,
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

export const COLOR_OPTIONS: { key: TaskNoteColor; label: string; lightBg: string; darkBg: string }[] = [
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
  const insets = useSafeAreaInsets();
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

  const noteInputRef = useRef<TextInput>(null);

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

      const hasItems = items.length > 0;
      const allDone = hasItems && items.every((i) => i.isDone);
      const trimmedContent = content.trim();

      // Determine the primary type:
      let resolvedType = type;
      if (hasItems && !trimmedContent) {
        resolvedType = 'checklist';
      } else if (!hasItems && trimmedContent) {
        resolvedType = 'note';
      }

      await onSave({
        title: title.trim(),
        content: trimmedContent ? trimmedContent : undefined,
        type: resolvedType,
        items: items,
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

  // Dynamic canvas background according to selected color
  const canvasBgColor = useMemo(() => {
    if (color === 'default') {
      return isDark ? '#0f172a' : '#ffffff';
    }
    switch (color) {
      case 'blue':
        return isDark ? '#0b192c' : '#f0f7ff';
      case 'green':
        return isDark ? '#052e16' : '#f0fdf4';
      case 'yellow':
        return isDark ? '#261a03' : '#fefce8';
      case 'rose':
        return isDark ? '#2b0b14' : '#fff1f2';
      case 'purple':
        return isDark ? '#1e0e33' : '#faf5ff';
      default:
        return isDark ? '#0f172a' : '#ffffff';
    }
  }, [color, isDark]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: canvasBgColor,
          paddingTop: Math.max(insets.top, 14),
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Top Navigation & Action Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Back Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={ArrowLeft} size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Title / Status */}
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.text,
                  fontFamily: 'Sarabun_700Bold',
                }}
              >
                {initialData ? 'แก้ไขโน้ต & งาน' : 'สร้างโน้ต & งานใหม่'}
              </Text>
            </View>

            {/* Action Buttons: Delete, Pin, Save */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {initialData?.id && onDelete && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDelete}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={Trash2} size={18} color="#ef4444" />
                </TouchableOpacity>
              )}

              {/* Pin Toggle Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('selection');
                  setIsPinned((prev) => !prev);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: isPinned
                    ? colors.primary
                    : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={Pin}
                  size={18}
                  color={isPinned ? '#ffffff' : colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 999,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Icon name={Save} size={16} color="#ffffff" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#ffffff',
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  {isSaving ? 'บันทึก...' : 'บันทึก'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sub-Header Toolbar: Mode Tabs & Color Swatches */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              gap: 10,
            }}
          >
            {/* Mode Switcher Tabs */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
                borderRadius: 14,
                padding: 3,
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
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: type === 'checklist' ? colors.primary : 'transparent',
                }}
              >
                <Icon
                  name={CheckSquare}
                  size={15}
                  color={type === 'checklist' ? '#ffffff' : colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: type === 'checklist' ? '#ffffff' : colors.textSecondary,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  สิ่งที่ต้องทำ (To-Do){items.length > 0 ? ` (${items.length})` : ''}
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
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: type === 'note' ? colors.primary : 'transparent',
                }}
              >
                <Icon
                  name={FileText}
                  size={15}
                  color={type === 'note' ? '#ffffff' : colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: type === 'note' ? '#ffffff' : colors.textSecondary,
                    fontFamily: 'Sarabun_700Bold',
                  }}
                >
                  บันทึกข้อความ (Note){content.trim().length > 0 ? ` (${content.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Color Swatches & Pin Status in One Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              {/* Color Swatches */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
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
                        width: 28,
                        height: 28,
                        borderRadius: 14,
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
                          size={13}
                          color={opt.key === 'default' && !isDark ? colors.primary : '#ffffff'}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Custom ColorPicker (7th swatch circle) */}
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
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
                    swatchSize={24}
                    title="เลือกสีโน้ต"
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

              {/* Pin Status Label */}
              {isPinned && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
                  }}
                >
                  <Icon name={Pin} size={11} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.primary,
                      fontFamily: 'Sarabun_700Bold',
                    }}
                  >
                    ปักหมุดบนสุด
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Title Area (Big, Bold, Clean) */}
          <View
            style={{
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 6,
            }}
          >
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={type === 'checklist' ? 'หัวข้องานสิ่งที่ต้องทำ...' : 'หัวข้อบันทึกข้อความ...'}
              placeholderTextColor={colors.textSecondary}
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
                fontFamily: 'Sarabun_700Bold',
                paddingVertical: 6,
              }}
            />
          </View>

          {/* Full Screen Body Content */}
          {type === 'note' ? (
            /* NOTE FULL SCREEN CANVAS: Takes 100% of remaining screen height */
            <View style={{ flex: 1, paddingHorizontal: 18 }}>
              <TextInput
                ref={noteInputRef}
                value={content}
                onChangeText={setContent}
                placeholder="เริ่มพิมพ์เนื้อหาบันทึกข้อความของคุณที่นี่... สามารถพิมพ์ข้อความยาวได้เต็มที่ หน้าจอจะขยายตามต้องการ"
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                scrollEnabled={true}
                textAlignVertical="top"
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 15,
                  lineHeight: 24,
                  fontFamily: 'Sarabun_400Regular',
                  paddingTop: 8,
                  paddingBottom: 24,
                }}
              />

              {/* Bottom Note Toolbar: URLs and Character counter */}
              <View
                style={{
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  gap: 8,
                }}
              >
                {/* Detected Clickable URLs */}
                {detectedUrls.length > 0 && (
                  <View style={{ gap: 6 }}>
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
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
                              maxWidth: 220,
                            }}
                            numberOfLines={1}
                          >
                            {url}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      fontFamily: 'Sarabun_500Medium',
                    }}
                  >
                    {content.length} ตัวอักษร
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* CHECKLIST FULL SCREEN CANVAS */
            <View style={{ flex: 1, paddingHorizontal: 18 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16, gap: 8 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {items.length === 0 ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 }}>
                    <Icon name={ListTodo} size={36} color={colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        fontFamily: 'Sarabun_500Medium',
                      }}
                    >
                      ยังไม่มีรายการสิ่งที่ต้องทำ
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontFamily: 'Sarabun_400Regular',
                      }}
                    >
                      พิมพ์รายการด้านล่างแล้วกดเครื่องหมายบวกเพื่อเพิ่ม
                    </Text>
                  </View>
                ) : (
                  items.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
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
                  ))
                )}
              </ScrollView>

              {/* Add Checklist Item Input Bar */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                }}
              >
                <TextInput
                  value={newItemText}
                  onChangeText={setNewItemText}
                  placeholder="เพิ่มรายการสิ่งที่ต้องทำ..."
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={handleAddItem}
                  returnKeyType="done"
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
                    color: colors.text,
                    fontSize: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    fontFamily: 'Sarabun_400Regular',
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleAddItem}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 18,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={Plus} size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
