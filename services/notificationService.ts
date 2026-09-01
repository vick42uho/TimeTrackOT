import { Platform } from 'react-native';
import scheduleNotificationAsync from 'expo-notifications/build/scheduleNotificationAsync';
import cancelScheduledNotificationAsync from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';
import { Activity } from '../types';

// Set default foreground notification behavior
if (Platform.OS !== 'web') {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions from user (iOS & Android 13+)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const settings = await getPermissionsAsync();
    if (settings.granted || settings.ios?.status === IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const requested = await requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return !!(requested.granted || requested.ios?.status === IosAuthorizationStatus.PROVISIONAL);
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a local reminder notification for an Activity
 */
export async function scheduleActivityReminder(activity: Activity): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  if (!activity.reminderMinutes && activity.reminderMinutes !== 0) return undefined;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permission denied, skipping schedule');
      return undefined;
    }

    // Cancel old reminder if any
    if (activity.notificationId) {
      await cancelActivityReminder(activity.notificationId);
    }

    // Calculate appointment trigger Date
    const timeStr = activity.isAllDay || !activity.startTime ? '09:00:00' : `${activity.startTime}:00`;
    const appointmentDate = new Date(`${activity.date}T${timeStr}`);

    if (isNaN(appointmentDate.getTime())) {
      console.warn('Invalid appointment date:', activity.date, timeStr);
      return undefined;
    }

    // Subtract reminder minutes
    const triggerTimestamp = appointmentDate.getTime() - (activity.reminderMinutes || 0) * 60 * 1000;
    const now = Date.now();

    // Do not schedule if time is in the past
    if (triggerTimestamp <= now) {
      console.log('Reminder timestamp is in the past, skipping schedule');
      return undefined;
    }

    // Format human-friendly Thai text for body
    let bodyText = '';
    if (activity.isAllDay) {
      bodyText = 'กิจกรรมตลอดวัน';
    } else if (activity.startTime) {
      bodyText = `เวลา ${activity.startTime} น.${activity.endTime ? ` - ${activity.endTime} น.` : ''}`;
    }

    if (activity.location) {
      bodyText += ` ที่ ${activity.location}`;
    }

    const reminderLeadText =
      activity.reminderMinutes === 0
        ? 'เริ่มแล้วตอนนี้'
        : activity.reminderMinutes === 15
        ? 'อีก 15 นาที'
        : activity.reminderMinutes === 30
        ? 'อีก 30 นาที'
        : activity.reminderMinutes === 60
        ? 'อีก 1 ชั่วโมง'
        : activity.reminderMinutes === 1440
        ? 'วันพรุ่งนี้'
        : `อีก ${activity.reminderMinutes} นาที`;

    const notificationId = await scheduleNotificationAsync({
      content: {
        title: `⏰ แจ้งเตือน (${reminderLeadText}): ${activity.title}`,
        body: bodyText,
        sound: true,
        data: { activityId: activity.id, date: activity.date },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTimestamp),
      },
    });

    console.log(`Scheduled notification ${notificationId} for activity "${activity.title}" at ${new Date(triggerTimestamp).toISOString()}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling activity reminder:', error);
    return undefined;
  }
}

/**
 * Cancel an existing scheduled notification
 */
export async function cancelActivityReminder(notificationId?: string): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) return;

  try {
    await cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification ${notificationId}`);
  } catch (error) {
    console.warn(`Failed to cancel notification ${notificationId}:`, error);
  }
}
