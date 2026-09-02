import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useThemeContext } from '@/components/ThemeProvider';
import { triggerHaptic } from '@/hooks/useHaptics';
import { TaskNote, TaskNoteColor } from '@/types';
import { getTaskNoteBgColor } from './TaskNoteModal';
import {
  Search,
  CheckSquare,
  FileText,
  Pin,
  Plus,
  Check,
  Trash2,
  Edit2,
  X,
  Clock,
  Sparkles,
  ExternalLink,
  LayoutGrid,
  List,
} from 'lucide-react-native';
import { extractUrls, handleOpenURL } from '@/utils/urlHelper';

interface TaskNoteManagerSheetProps {
  isVisible: boolean;
  onClose: () => void;
  tasksNotes: TaskNote[];
  onAddNew: () => void;
  onEdit: (item: TaskNote) => void;
  onToggleItem: (noteId: number, itemId: string) => void;
  onToggleNote: (noteId: number, isCompleted: boolean) => void;
  onDelete: (id: number) => void;
}

type FilterTab = 'all' | 'pending' | 'completed' | 'pinned';

export const TaskNoteManagerSheet: React.FC<TaskNoteManagerSheetProps> = ({
  isVisible,
  onClose,
  tasksNotes,
  onAddNew,
  onEdit,
  onToggleItem,
  onToggleNote,
  onDelete,
}) => {
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredItems = useMemo(() => {
    return tasksNotes.filter((item) => {
      // Filter by tab
      if (activeTab === 'pending' && item.isCompleted) return false;
      if (activeTab === 'completed' && !item.isCompleted) return false;
      if (activeTab === 'pinned' && !item.isPinned) return false;

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchContent = item.content?.toLowerCase().includes(query);
        const matchSubItems = item.items?.some((it) => it.text.toLowerCase().includes(query));
        if (!matchTitle && !matchContent && !matchSubItems) return false;
      }

      return true;
    });
  }, [tasksNotes, activeTab, searchQuery]);

  const pendingCount = useMemo(
    () => tasksNotes.filter((i) => !i.isCompleted).length,
    [tasksNotes]
  );
  const completedCount = useMemo(
    () => tasksNotes.filter((i) => i.isCompleted).length,
    [tasksNotes]
  );
  const pinnedCount = useMemo(
    () => tasksNotes.filter((i) => i.isPinned).length,
    [tasksNotes]
  );

  const renderCard = (item: TaskNote, isGrid: boolean) => {
    const cardBg = getTaskNoteBgColor(item.color, isDark, colors.card);
    const urls = item.content ? extractUrls(item.content) : [];

    return (
      <View
        key={item.id}
        style={{
          backgroundColor: cardBg,
          borderRadius: isGrid ? 20 : 22,
          padding: isGrid ? 12 : 16,
          gap: isGrid ? 8 : 10,
          shadowColor: '#64748b',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 12,
          elevation: Platform.OS === 'android' ? 0 : 2,
        }}
      >
        {/* Card Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              flex: 1,
            }}
          >
            {item.type === 'checklist' ? (
              <Icon name={CheckSquare} size={isGrid ? 14 : 16} color={colors.primary} />
            ) : (
              <Icon name={FileText} size={isGrid ? 14 : 16} color={colors.primary} />
            )}
            <Text
              style={{
                fontSize: isGrid ? 14 : 15,
                fontWeight: '700',
                color: colors.text,
                fontFamily: 'Sarabun_700Bold',
                flex: 1,
                textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                opacity: item.isCompleted ? 0.6 : 1,
              }}
              numberOfLines={isGrid ? 2 : 1}
            >
              {item.title}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: isGrid ? 4 : 6 }}>
            {item.isPinned && (
              <View
                style={{
                  paddingHorizontal: isGrid ? 5 : 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#dbeafe',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Icon name={Pin} size={10} color={colors.primary} />
                {!isGrid && (
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: colors.primary,
                      fontFamily: 'Sarabun_700Bold',
                    }}
                  >
                    ปักหมุด
                  </Text>
                )}
              </View>
            )}

            {/* Edit Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('selection');
                onEdit(item);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name={Edit2} size={isGrid ? 13 : 15} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('warning');
                onDelete(item.id!);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name={Trash2} size={isGrid ? 13 : 15} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body Content */}
        {item.type === 'checklist' ? (
          <View style={{ gap: isGrid ? 4 : 6, marginTop: 2 }}>
            {(isGrid ? item.items.slice(0, 4) : item.items).map((subItem) => {
              const subUrls = extractUrls(subItem.text);
              return (
                <TouchableOpacity
                  key={subItem.id}
                  activeOpacity={0.7}
                  onPress={() => onToggleItem(item.id!, subItem.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: isGrid ? 6 : 8,
                    paddingVertical: isGrid ? 2 : 3,
                  }}
                >
                  <View
                    style={{
                      width: isGrid ? 18 : 20,
                      height: isGrid ? 18 : 20,
                      borderRadius: 5,
                      borderWidth: subItem.isDone ? 0 : 1.5,
                      borderColor: colors.border,
                      backgroundColor: subItem.isDone ? '#16a34a' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {subItem.isDone && <Icon name={Check} size={isGrid ? 11 : 13} color="#ffffff" />}
                  </View>
                  <Text
                    style={{
                      fontSize: isGrid ? 12 : 13,
                      color: subItem.isDone ? colors.textSecondary : colors.text,
                      textDecorationLine: subItem.isDone ? 'line-through' : 'none',
                      fontFamily: 'Sarabun_400Regular',
                      flex: 1,
                    }}
                    numberOfLines={isGrid ? 1 : 2}
                  >
                    {subItem.text}
                  </Text>
                  {subUrls.length > 0 && (
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={(e) => {
                        e.stopPropagation();
                        triggerHaptic('selection');
                        handleOpenURL(subUrls[0]);
                      }}
                      style={{ padding: 2 }}
                    >
                      <Icon name={ExternalLink} size={isGrid ? 11 : 13} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
            {isGrid && item.items.length > 4 && (
              <Text
                style={{
                  fontSize: 10,
                  color: colors.primary,
                  fontFamily: 'Sarabun_600SemiBold',
                  marginTop: 2,
                }}
              >
                + อีก {item.items.length - 4} ข้อ
              </Text>
            )}
          </View>
        ) : item.content ? (
          <View>
            <Text
              style={{
                fontSize: isGrid ? 12 : 13,
                color: colors.textSecondary,
                fontFamily: 'Sarabun_400Regular',
                lineHeight: isGrid ? 18 : 20,
              }}
              numberOfLines={isGrid ? 5 : 4}
            >
              {item.content}
            </Text>
            {urls.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  handleOpenURL(url);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  alignSelf: 'flex-start',
                  marginTop: 6,
                  paddingHorizontal: isGrid ? 8 : 10,
                  paddingVertical: isGrid ? 3 : 5,
                  borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(37, 99, 235, 0.4)' : '#bfdbfe',
                }}
              >
                <Icon name={ExternalLink} size={isGrid ? 10 : 12} color={colors.primary} />
                <Text
                  style={{
                    fontSize: isGrid ? 10 : 11,
                    fontWeight: '600',
                    color: colors.primary,
                    fontFamily: 'Sarabun_600SemiBold',
                    textDecorationLine: 'underline',
                    maxWidth: isGrid ? 110 : 240,
                  }}
                  numberOfLines={1}
                >
                  เปิดลิงก์: {url}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Card Footer Status & 1-Tap Toggle Completed */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: isGrid ? 2 : 4,
            paddingTop: isGrid ? 6 : 8,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <Text
            style={{
              fontSize: isGrid ? 10 : 11,
              color: colors.textSecondary,
              fontFamily: 'Sarabun_400Regular',
            }}
          >
            {item.date ? item.date.slice(5) : 'ไม่มีวัน'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              onToggleNote(item.id!, !item.isCompleted);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: isGrid ? 7 : 10,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: item.isCompleted
                ? isDark
                  ? 'rgba(22, 163, 74, 0.25)'
                  : '#dcfce7'
                : isDark
                ? 'rgba(51, 65, 85, 0.4)'
                : '#f1f5f9',
            }}
          >
            <Icon
              name={Check}
              size={isGrid ? 10 : 12}
              color={item.isCompleted ? '#16a34a' : colors.textSecondary}
            />
            <Text
              style={{
                fontSize: isGrid ? 10 : 11,
                fontWeight: '700',
                color: item.isCompleted ? '#16a34a' : colors.textSecondary,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              {item.isCompleted ? 'เสร็จ' : 'ทำเสร็จ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.96]}
      title="โน้ต & สิ่งที่ต้องทำ (Notes & Tasks)"
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button variant="outline" icon={X} style={{ flex: 1 }} onPress={onClose}>
            ปิด
          </Button>
          <Button
            variant="default"
            icon={Plus}
            style={{ flex: 2 }}
            onPress={() => {
              triggerHaptic('selection');
              onAddNew();
            }}
          >
            สร้างโน้ต & งานใหม่
          </Button>
        </View>
      }
    >
      <View style={{ gap: 14, paddingBottom: 24 }}>
        {/* Search Bar & View Mode Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f1f5f9',
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 8,
            }}
          >
            <Icon name={Search} size={16} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ค้นหาโน้ต, สิ่งที่ต้องทำ..."
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 14,
                fontFamily: 'Sarabun_400Regular',
                paddingVertical: 2,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name={X} size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* List / Grid Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f1f5f9',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <Icon
              name={viewMode === 'list' ? LayoutGrid : List}
              size={15}
              color={colors.primary}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.primary,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              {viewMode === 'list' ? 'ตาราง' : 'รายการ'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            { key: 'all', label: `ทั้งหมด (${tasksNotes.length})` },
            { key: 'pending', label: `ค้างอยู่ (${pendingCount})` },
            { key: 'completed', label: `เสร็จแล้ว (${completedCount})` },
            { key: 'pinned', label: `ปักหมุด (${pinnedCount})`, icon: Pin },
          ].map((tab) => {
            const isSel = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveTab(tab.key as FilterTab);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: isSel
                    ? colors.primary
                    : isDark
                    ? 'rgba(51, 65, 85, 0.4)'
                    : '#f1f5f9',
                }}
              >
                {tab.icon && (
                  <Icon
                    name={tab.icon}
                    size={11}
                    color={isSel ? '#ffffff' : colors.textSecondary}
                  />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSel ? '700' : '500',
                    color: isSel ? '#ffffff' : colors.textSecondary,
                    fontFamily: isSel ? 'Sarabun_700Bold' : 'Sarabun_500Medium',
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes & Tasks Cards List */}
        {filteredItems.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 48,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={Sparkles} size={24} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.text,
                fontFamily: 'Sarabun_700Bold',
              }}
            >
              {searchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีโน้ตหรือสิ่งที่ต้องทำ'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                fontFamily: 'Sarabun_400Regular',
                textAlign: 'center',
              }}
            >
              {searchQuery
                ? 'ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง'
                : 'เริ่มจดบันทึก หรือสร้างเช็กลิสต์งานที่ต้องทำได้เลย'}
            </Text>
            <Button
              variant="default"
              icon={Plus}
              size="sm"
              onPress={() => {
                triggerHaptic('selection');
                onAddNew();
              }}
              style={{ marginTop: 8 }}
            >
              สร้างรายการแรก
            </Button>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            {/* Column 1 (Left) */}
            <View style={{ flex: 1, gap: 10 }}>
              {filteredItems
                .filter((_, idx) => idx % 2 === 0)
                .map((item) => renderCard(item, true))}
            </View>
            {/* Column 2 (Right) */}
            <View style={{ flex: 1, gap: 10 }}>
              {filteredItems
                .filter((_, idx) => idx % 2 === 1)
                .map((item) => renderCard(item, true))}
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredItems.map((item) => renderCard(item, false))}
          </View>
        )}
      </View>
    </BottomSheet>
  );
};
