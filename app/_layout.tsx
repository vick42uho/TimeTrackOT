
import { Stack, useGlobalSearchParams } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { setupErrorLogging } from '../utils/errorLogger';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../components/ThemeProvider';
import { ToastProvider } from '@/components/ui/toast';
import * as Font from 'expo-font';
import {
  Sarabun_400Regular,
  Sarabun_600SemiBold,
  Sarabun_700Bold,
} from '@expo-google-fonts/sarabun';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../components/ThemeProvider';
import { initNotificationService } from '../services/notificationService';
import { initSmartAlarmChannels } from '../services/smartAlarmService';
import { AlarmRingingModal } from '../components/AlarmRingingModal';
import {
  addNotificationResponseReceivedListener,
  addNotificationReceivedListener,
  getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
import dismissNotificationAsync from 'expo-notifications/build/dismissNotificationAsync';

const STORAGE_KEY = 'emulated_device';

function RootLayoutContent() {
  const actualInsets = useSafeAreaInsets();
  const { themeMode, colors } = useThemeContext();
  const isDark = themeMode === 'dark';
  const { emulate } = useGlobalSearchParams<{ emulate?: string }>();
  const [storedEmulate, setStoredEmulate] = useState<string | null>(null);

  const [alarmRingingData, setAlarmRingingData] = useState<{
    visible: boolean;
    alarmTime?: string;
    alarmDate?: string;
    reason?: string;
  }>({
    visible: false,
  });

  useEffect(() => {
    // Set up global error logging
    setupErrorLogging();

    if (Platform.OS === 'web') {
      // If there's a new emulate parameter, store it
      if (emulate) {
        localStorage.setItem(STORAGE_KEY, emulate);
        setStoredEmulate(emulate);
      } else {
        // If no emulate parameter, try to get from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setStoredEmulate(stored);
        }
      }
    } else {
      // 1. Check if launched from cold start via smart alarm notification tap
      getLastNotificationResponseAsync().then((response) => {
        if (response?.notification?.request?.content?.data?.type === 'smart-alarm') {
          const data = response.notification.request.content.data;
          setAlarmRingingData({
            visible: true,
            alarmTime: (data.alarmTime as string) || '06:30',
            alarmDate: (data.date as string) || undefined,
            reason: (data.reason as string) || 'วันทำงานปกติ',
          });
          dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
        }
      });

      // 2. Listen for notification taps when app is in background / foreground
      const responseSub = addNotificationResponseReceivedListener((response) => {
        if (response?.notification?.request?.content?.data?.type === 'smart-alarm') {
          const data = response.notification.request.content.data;
          setAlarmRingingData({
            visible: true,
            alarmTime: (data.alarmTime as string) || '06:30',
            alarmDate: (data.date as string) || undefined,
            reason: (data.reason as string) || 'วันทำงานปกติ',
          });
          dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
        }
      });

      // 3. Listen for notification triggers while app is actively foregrounded
      const receivedSub = addNotificationReceivedListener((notification) => {
        if (notification?.request?.content?.data?.type === 'smart-alarm') {
          const data = notification.request.content.data;
          setAlarmRingingData({
            visible: true,
            alarmTime: (data.alarmTime as string) || '06:30',
            alarmDate: (data.date as string) || undefined,
            reason: (data.reason as string) || 'วันทำงานปกติ',
          });
          dismissNotificationAsync(notification.request.identifier).catch(() => {});
        }
      });

      return () => {
        responseSub.remove();
        receivedSub.remove();
      };
    }
  }, [emulate]);

  let insetsToUse = actualInsets;

  if (Platform.OS === 'web') {
    const simulatedInsets = {
      ios: { top: 47, bottom: 20, left: 0, right: 0 },
      android: { top: 40, bottom: 0, left: 0, right: 0 },
    };

    // Use stored emulate value if available, otherwise use the current emulate parameter
    const deviceToEmulate = storedEmulate || emulate;
    insetsToUse = deviceToEmulate ? simulatedInsets[deviceToEmulate as keyof typeof simulatedInsets] || actualInsets : actualInsets;
  }

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        translucent
        backgroundColor="transparent"
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <AlarmRingingModal
        visible={alarmRingingData.visible}
        alarmTime={alarmRingingData.alarmTime}
        alarmDate={alarmRingingData.alarmDate}
        reason={alarmRingingData.reason}
        onDismiss={() =>
          setAlarmRingingData((prev) => ({ ...prev, visible: false }))
        }
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Sarabun_400Regular,
          Sarabun_600SemiBold,
          Sarabun_700Bold,
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }

      // Initialize background notification channels for Android (API 26+)
      initNotificationService().catch((e) => console.warn('Failed to init notifications:', e));
      initSmartAlarmChannels().catch((e) => console.warn('Failed to init smart alarm channels:', e));
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ToastProvider>
            <RootLayoutContent />
          </ToastProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
