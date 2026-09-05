import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export interface SystemAlarmResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Sets an alarm in the Android system's native Clock app (Google Clock, Samsung Clock, etc.)
 * This creates a true, continuous-ringing alarm with full-screen lock screen dismissal.
 * 
 * @param timeStr Time in "HH:mm" format, e.g. "05:10" or "07:00"
 * @param label Description/label for the alarm in the clock app
 * @param skipUi If false, opens the Clock app so the user can see and confirm the alarm
 */
export async function setSystemAlarm(
  timeStr: string,
  label: string = 'TimeTrack OT: วันทำงาน',
  skipUi: boolean = false
): Promise<SystemAlarmResult> {
  if (Platform.OS !== 'android') {
    return {
      success: false,
      error: 'การตั้งนาฬิกาปลุกของระบบรองรับเฉพาะบนระบบ Android เท่านั้น',
    };
  }

  try {
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) {
      return { success: false, error: 'รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:mm)' };
    }

    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return { success: false, error: 'ค่าชั่วโมงหรือนาทีไม่ถูกต้อง' };
    }

    // Android Intent: android.intent.action.SET_ALARM
    await IntentLauncher.startActivityAsync('android.intent.action.SET_ALARM', {
      extra: {
        'android.intent.extra.alarm.HOUR': hour,
        'android.intent.extra.alarm.MINUTES': minute,
        'android.intent.extra.alarm.MESSAGE': label,
        'android.intent.extra.alarm.SKIP_UI': skipUi,
      },
    });

    return {
      success: true,
      message: `ส่งเวลา ${timeStr} น. ไปยังแอพนาฬิกาปลุกของเครื่องเรียบร้อยแล้ว`,
    };
  } catch (err: any) {
    console.warn('Failed to set system alarm via IntentLauncher:', err);
    return {
      success: false,
      error: err?.message || 'ไม่สามารถเปิดแอพนาฬิกาปลุกของเครื่องได้',
    };
  }
}

/**
 * Opens the Android system's native Clock app to view all alarms
 */
export async function openSystemAlarmApp(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    // Android Intent: android.intent.action.SHOW_ALARMS
    await IntentLauncher.startActivityAsync('android.intent.action.SHOW_ALARMS');
    return true;
  } catch (err) {
    console.warn('Failed to open system alarms:', err);
    return false;
  }
}

/**
 * Opens the App Details Settings for TimeTrack OT in Android
 * Allows the user to set Battery usage to "Unrestricted" so alarms and notifications are never blocked or delayed
 */
export async function openAppBatterySettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      {
        data: 'package:com.anonymous.timetrackot',
      }
    );
    return true;
  } catch (err) {
    console.warn('Failed to open application details settings:', err);
    return false;
  }
}
