import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Activity } from '../types';

export const ACTIVITY_CHANNEL_ID = 'activity-reminders';

// Set default foreground notification behavior
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
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
 * Initialize Notification Channel for Android (API 26+)
 * and default notification behavior
 */
export async function initNotificationService(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // 1. Configure Android Notification Channel with High/Max Importance
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ACTIVITY_CHANNEL_ID, {
        name: 'แจ้งเตือนกิจกรรมและนัดหมาย',
        description: 'การแจ้งเตือนกิจกรรมและนัดหมายตามเวลาที่กำหนดไว้',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
      console.log('Android notification channel initialized:', ACTIVITY_CHANNEL_ID);
    }

    // 2. Request / check permissions
    await requestNotificationPermissions();
  } catch (error) {
    console.warn('Failed to initialize notification channel:', error);
  }
}

/**
 * Request notification permissions from user (iOS & Android 13+)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const settings = await Notifications.getPermissionsAsync();
    if (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
      android: {},
    });

    return !!(
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
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
    // Ensure channel is ready
    await initNotificationService();

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

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ แจ้งเตือน (${reminderLeadText}): ${activity.title}`,
        body: bodyText,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#2563EB',
        data: { activityId: activity.id, date: activity.date },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTimestamp),
        channelId: ACTIVITY_CHANNEL_ID,
      },
    });

    console.log(
      `Scheduled notification ${notificationId} for activity "${activity.title}" at ${new Date(
        triggerTimestamp
      ).toISOString()}`
    );
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
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification ${notificationId}`);
  } catch (error) {
    console.warn(`Failed to cancel notification ${notificationId}:`, error);
  }
}
