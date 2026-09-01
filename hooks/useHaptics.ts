import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HAPTICS_STORAGE_KEY = '@timetrack_haptics_enabled';
let globalHapticsEnabled = false; // Default to false: eliminates unwanted constant vibration on taps

// Initialize preference from storage
AsyncStorage.getItem(HAPTICS_STORAGE_KEY)
  .then((val) => {
    if (val !== null) {
      globalHapticsEnabled = val === 'true';
    }
  })
  .catch(() => {});

export function getGlobalHapticsEnabled(): boolean {
  return globalHapticsEnabled;
}

export async function setGlobalHapticsEnabled(enabled: boolean): Promise<void> {
  globalHapticsEnabled = enabled;
  try {
    await AsyncStorage.setItem(HAPTICS_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (e) {}
}

export type HapticIntent =
  | 'selection'
  | 'tick'
  | 'toggle-on'
  | 'toggle-off'
  | 'impact-light'
  | 'impact-medium'
  | 'success'
  | 'warning'
  | 'error';

const ANDROID_HAPTICS: Record<HapticIntent, Haptics.AndroidHaptics> = {
  selection: Haptics.AndroidHaptics.Segment_Tick,
  tick: Haptics.AndroidHaptics.Clock_Tick,
  'toggle-on': Haptics.AndroidHaptics.Toggle_On,
  'toggle-off': Haptics.AndroidHaptics.Toggle_Off,
  'impact-light': Haptics.AndroidHaptics.Virtual_Key,
  'impact-medium': Haptics.AndroidHaptics.Long_Press,
  success: Haptics.AndroidHaptics.Confirm,
  warning: Haptics.AndroidHaptics.Reject,
  error: Haptics.AndroidHaptics.Reject,
};

function perform(intent: HapticIntent): Promise<void> {
  if (!globalHapticsEnabled) {
    return Promise.resolve();
  }

  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(ANDROID_HAPTICS[intent]);
  }

  switch (intent) {
    case 'selection':
    case 'tick':
      return Haptics.selectionAsync();
    case 'impact-medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'success':
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    case 'warning':
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
    case 'error':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    default:
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * Fire and forget. Only fires if global haptics is enabled.
 */
export function triggerHaptic(intent: HapticIntent = 'impact-light'): void {
  if (!globalHapticsEnabled) return;
  try {
    perform(intent).catch(() => {});
  } catch {}
}

export function useHaptics(enabled: boolean = true) {
  return useCallback(
    (intent: HapticIntent = 'impact-light') => {
      if (!enabled || !globalHapticsEnabled) return;
      triggerHaptic(intent);
    },
    [enabled]
  );
}
