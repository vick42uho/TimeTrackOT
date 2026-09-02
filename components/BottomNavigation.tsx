
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { triggerHaptic } from '@/hooks/useHaptics';
import { useThemeContext } from './ThemeProvider';
import { Icon } from '@/components/ui/icon';
import { Home, Clock, Calendar, BarChart3, Settings } from 'lucide-react-native';

const NAV_TABS = [
  { name: 'home', label: 'หน้าหลัก', icon: Home, route: '/' },
  { name: 'time-entry', label: 'บันทึกเวลา', icon: Clock, route: '/time-entry' },
  { name: 'leaves', label: 'วันหยุด/ลา', icon: Calendar, route: '/leaves' },
  { name: 'reports', label: 'รายงาน', icon: BarChart3, route: '/reports' },
  { name: 'settings', label: 'ตั้งค่า', icon: Settings, route: '/settings' },
];

export const BottomNavigation: React.FC = React.memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';

  const handleTabPress = (route: string) => {
    if (pathname === route) return;
    triggerHaptic('selection');
    router.replace(route as any);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingHorizontal: 8,
          shadowColor: '#64748b',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        tab: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
        },
        activePill: {
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : '#eff6ff',
          borderRadius: 20,
          paddingVertical: 4,
          paddingHorizontal: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabLabel: {
          fontSize: 11,
          color: colors.textSecondary,
          fontFamily: 'Sarabun_400Regular',
          marginTop: 3,
        },
        activeTabLabel: {
          color: colors.primary,
          fontWeight: '700',
          fontFamily: 'Sarabun_700Bold',
        },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.container}>
      {NAV_TABS.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(tab.route)}
            activeOpacity={0.7}
          >
            <View style={isActive ? styles.activePill : undefined}>
              <Icon
                name={tab.icon}
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
                color={isActive ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});
