
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useThemeContext } from './ThemeProvider';
import Icon from './Icon';

export const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useThemeContext();

  const tabs = [
    { name: 'home', icon: 'home-outline', activeIcon: 'home', route: '/' },
    { name: 'time-entry', icon: 'time-outline', activeIcon: 'time', route: '/time-entry' },
    { name: 'reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', route: '/reports' },
    { name: 'settings', icon: 'settings-outline', activeIcon: 'settings', route: '/settings' },
  ];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
  });

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
          >
            <Icon
              name={isActive ? tab.activeIcon as any : tab.icon as any}
              size={24}
              color={isActive ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
