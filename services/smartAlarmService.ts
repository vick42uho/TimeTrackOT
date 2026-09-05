import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import scheduleNotificationAsync from 'expo-notifications/build/scheduleNotificationAsync';
import cancelScheduledNotificationAsync from 'expo-notifications/build/cancelScheduledNotificationAsync';
import setNotificationChannelAsync from 'expo-notifications/build/setNotificationChannelAsync';
import {
  AndroidImportance,
  AndroidNotificationVisibility,
  AndroidAudioUsage,
  AndroidAudioContentType,
} from 'expo-notifications/build/NotificationChannelManager.types';
import {
  SchedulableTriggerInputTypes,
  AndroidNotificationPriority,
} from 'expo-notifications/build/Notifications.types';
import {
  Holiday,
  LeaveRequest,
  SmartAlarmConfig,
  SmartAlarmScheduleItem,
} from '../types';
import { requestNotificationPermissions } from './notificationService';

export const SMART_ALARM_CONFIG_KEY = '@timetrack_smart_alarm_config';
export const SMART_ALARM_SCHEDULED_IDS_KEY = '@timetrack_smart_alarm_scheduled_ids';

export const SMART_ALARM_CHANNEL_ID = 'smart-workday-alarm';
export const SMART_ALARM_PRE_REMINDER_CHANNEL_ID = 'smart-alarm-goodnight';

export const DEFAULT_SMART_ALARM_CONFIG: SmartAlarmConfig = {
  enabled: false,
  alarmTime: '06:30',
  useWeekendWorkAlarm: true,
  weekendWorkAlarmTime: '07:00',
  skipPublicHolidays: true,
  skipRegularOff: true,
  skipWeekends: false, // Default to false: calendar defines all workdays & off-days
  skipApprovedLeaves: true,
  wfhMode: 'custom',
  wfhAlarmTime: '07:30',
  preHolidayReminder: true,
  snoozeMinutes: 10,
  vibrate: true,
  soundEnabled: true,
  configVersion: 2,
};

const THAI_DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: 'ลาพักร้อน',
  sick: 'ลาป่วย',
  personal: 'ลากิจ',
  other: 'ลาอื่นๆ',
};

/**
 * Initialize Notification Channels for Smart Alarm (Android)
 */
export async function initSmartAlarmChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // 1. High Priority Alarm Channel with ALARM audio stream
    await setNotificationChannelAsync(SMART_ALARM_CHANNEL_ID, {
      name: 'นาฬิกาปลุกวันทำงาน (Smart Workday Alarm)',
      description: 'เสียงปลุกเฉพาะวันทำงานจริง และงดปลุกวันหยุด/วันลาอัตโนมัติ',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 600, 300, 600, 300, 1000],
      lightColor: '#2563EB',
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      sound: 'default',
      audioAttributes: {
        usage: AndroidAudioUsage.ALARM,
        contentType: AndroidAudioContentType.SONIFICATION,
        flags: {
          enforceAudibility: true,
          requestHardwareAudioVideoSynchronization: false,
        },
      },
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 2. Pre-holiday evening Goodnight Alert Channel
    await setNotificationChannelAsync(SMART_ALARM_PRE_REMINDER_CHANNEL_ID, {
      name: 'แจ้งเตือนคืนก่อนวันหยุด (Goodnight Alert)',
      description: 'แจ้งเตือนเวลา 20:00 น. ก่อนถึงวันหยุดว่าปิดนาฬิกาปลุกให้แล้ว',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  } catch (error) {
    console.warn('Failed to initialize smart alarm channels:', error);
  }
}

/**
 * Load Smart Alarm configuration from AsyncStorage
 */
export async function getSmartAlarmConfig(): Promise<SmartAlarmConfig> {
  try {
    const raw = await AsyncStorage.getItem(SMART_ALARM_CONFIG_KEY);
    if (!raw) return DEFAULT_SMART_ALARM_CONFIG;
    const parsed = JSON.parse(raw);
    const isMigratedV2 = (parsed.configVersion || 0) >= 2;
    return {
      ...DEFAULT_SMART_ALARM_CONFIG,
      ...parsed,
      // Migrate legacy skipWeekends default (true) to false so calendar strictly controls off-days
      skipWeekends: isMigratedV2 ? !!parsed.skipWeekends : false,
      configVersion: 2,
      useWeekendWorkAlarm: parsed.useWeekendWorkAlarm !== undefined ? parsed.useWeekendWorkAlarm : true,
      weekendWorkAlarmTime: parsed.weekendWorkAlarmTime || '07:00',
      skipRegularOff: parsed.skipRegularOff !== undefined ? parsed.skipRegularOff : true,
      wfhAlarmTime: parsed.wfhAlarmTime || '07:30',
    };
  } catch (error) {
    console.error('Error loading smart alarm config:', error);
    return DEFAULT_SMART_ALARM_CONFIG;
  }
}

/**
 * Save Smart Alarm configuration to AsyncStorage
 */
export async function saveSmartAlarmConfig(config: SmartAlarmConfig): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SMART_ALARM_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving smart alarm config:', error);
    return false;
  }
}

/**
 * Pure calculation function: computes workday alarm status for next N days
 */
export function calculateSmartAlarmSchedule(
  config: SmartAlarmConfig,
  holidays: Holiday[],
  leaves: LeaveRequest[],
  daysCount: number = 21,
  startDate: Date = new Date()
): SmartAlarmScheduleItem[] {
  // Pre-index holidays by date string
  const holidayMap: Record<string, Holiday> = {};
  holidays.forEach((h) => {
    holidayMap[h.date] = h;
  });

  // Pre-index leaves by date string
  const leaveMap: Record<string, LeaveRequest> = {};
  leaves.forEach((l) => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      leaveMap[dStr] = l;
    }
  });

  const schedule: SmartAlarmScheduleItem[] = [];

  for (let i = 0; i < daysCount; i++) {
    const target = new Date(startDate);
    target.setDate(target.getDate() + i);

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = target.getDay();
    const dayName = THAI_DAY_NAMES[dayOfWeek];

    const holiday = holidayMap[dateStr];
    const leave = leaveMap[dateStr];

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWfh = holiday?.type === 'wfh';
    const isRegularOff = holiday?.type === 'regular_off';
    const isPublicHoliday = !!holiday && !isWfh && !isRegularOff;

    // 1. Leave Request (Top priority: user took approved leave)
    if (leave && config.skipApprovedLeaves) {
      schedule.push({
        date: dateStr,
        dayOfWeek,
        dayName,
        status: 'skip_leave',
        reason: LEAVE_TYPE_LABELS[leave.leaveType] || 'วันลา',
      });
      continue;
    }

    // 2. Calendar Tag: Work From Home (WFH)
    // CRITICAL: WFH is a WORK DAY, taking top precedence over weekend/weekday!
    if (isWfh) {
      if (config.wfhMode === 'skip') {
        schedule.push({
          date: dateStr,
          dayOfWeek,
          dayName,
          status: 'skip_wfh',
          reason: 'Work From Home (งดปลุก)',
        });
      } else if (config.wfhMode === 'custom') {
        schedule.push({
          date: dateStr,
          dayOfWeek,
          dayName,
          status: 'wfh_alarm',
          alarmTime: config.wfhAlarmTime || '07:30',
          reason: 'Work From Home',
        });
      } else {
        schedule.push({
          date: dateStr,
          dayOfWeek,
          dayName,
          status: 'wfh_alarm',
          alarmTime: config.alarmTime,
          reason: 'Work From Home',
        });
      }
      continue;
    }

    // 3. Calendar Tag: Regular Day Off ('regular_off' / วันหยุดปกติ)
    // User explicitly assigned this day as their day off on the calendar (shift/schedule off)
    if (isRegularOff) {
      if (config.skipRegularOff !== false) {
        schedule.push({
          date: dateStr,
          dayOfWeek,
          dayName,
          status: 'skip_regular_off',
          reason: holiday?.name || 'วันหยุดปกติ (ตามปฏิทิน)',
        });
        continue;
      }
    }

    // 4. Calendar Tag: Public / Special / Company Holiday
    if (isPublicHoliday && config.skipPublicHolidays) {
      schedule.push({
        date: dateStr,
        dayOfWeek,
        dayName,
        status: 'skip_holiday',
        reason: holiday.name || 'วันหยุดนักขัตฤกษ์',
      });
      continue;
    }

    // 5. Weekend (Sat / Sun): ONLY applies if no explicit calendar tag exists!
    if (isWeekend && config.skipWeekends) {
      schedule.push({
        date: dateStr,
        dayOfWeek,
        dayName,
        status: 'skip_weekend',
        reason: 'วันหยุดเสาร์-อาทิตย์',
      });
      continue;
    }

    // 6. Workday Alarm:
    // If it falls on Saturday or Sunday and user enabled weekendWorkAlarmTime (traffic is light, can wake up later)
    if (isWeekend && config.useWeekendWorkAlarm) {
      schedule.push({
        date: dateStr,
        dayOfWeek,
        dayName,
        status: 'weekend_alarm',
        alarmTime: config.weekendWorkAlarmTime || config.alarmTime,
        reason: 'วันทำงาน เสาร์-อาทิตย์ (รถไม่ติด)',
      });
    } else {
      schedule.push({
        date: dateStr,
        dayOfWeek,
        dayName,
        status: 'alarm',
        alarmTime: config.alarmTime,
        reason: 'วันทำงานปกติ',
      });
    }
  }

  return schedule;
}

/**
 * Cancel previously scheduled smart alarm notifications
 */
export async function cancelAllSmartAlarms(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const rawIds = await AsyncStorage.getItem(SMART_ALARM_SCHEDULED_IDS_KEY);
    if (rawIds) {
      const ids: string[] = JSON.parse(rawIds);
      await Promise.all(
        ids.map((id) =>
          cancelScheduledNotificationAsync(id).catch((e) =>
            console.warn('Error cancelling notification ID:', id, e)
          )
        )
      );
    }
    await AsyncStorage.removeItem(SMART_ALARM_SCHEDULED_IDS_KEY);
  } catch (error) {
    console.error('Error cancelling smart alarms:', error);
  }
}

/**
 * High-performance Sync: computes workdays and schedules local notifications
 */
export async function syncSmartAlarmSchedule(
  holidays: Holiday[],
  leaves: LeaveRequest[],
  overrideConfig?: SmartAlarmConfig
): Promise<{
  scheduledCount: number;
  goodnightCount: number;
  schedule: SmartAlarmScheduleItem[];
}> {
  const config = overrideConfig || (await getSmartAlarmConfig());

  // 1. Cancel previous smart alarm notifications
  await cancelAllSmartAlarms();

  if (!config.enabled || Platform.OS === 'web') {
    const preview = calculateSmartAlarmSchedule(config, holidays, leaves, 7);
    return { scheduledCount: 0, goodnightCount: 0, schedule: preview };
  }

  // 2. Ensure channels and permissions
  await initSmartAlarmChannels();
  const hasPerm = await requestNotificationPermissions();
  if (!hasPerm) {
    console.log('Notification permission not granted, cannot schedule alarms');
    const preview = calculateSmartAlarmSchedule(config, holidays, leaves, 7);
    return { scheduledCount: 0, goodnightCount: 0, schedule: preview };
  }

  // 3. Calculate schedule for next 21 days
  const fullSchedule = calculateSmartAlarmSchedule(config, holidays, leaves, 21);
  const scheduledIds: string[] = [];
  let scheduledCount = 0;
  let goodnightCount = 0;
  const now = Date.now();

  for (let idx = 0; idx < fullSchedule.length; idx++) {
    const item = fullSchedule[idx];

    // --- A. Schedule Alarm (if workday, weekend workday, or WFH alarm) ---
    if (item.status === 'alarm' || item.status === 'wfh_alarm' || item.status === 'weekend_alarm') {
      const targetTime = item.alarmTime || config.alarmTime;
      const alarmDate = new Date(`${item.date}T${targetTime}:00`);

      if (!isNaN(alarmDate.getTime()) && alarmDate.getTime() > now) {
        try {
          const isWfhAlarm = item.status === 'wfh_alarm';
          const isWeekendAlarm = item.status === 'weekend_alarm';
          const notifTitle = `ถึงเวลาตื่นแล้ว! (${item.reason})`;
          let notifBody = `วันนี้เป็นวันทำงาน (${targetTime} น.) ลุกขึ้นมาเริ่มต้นวันใหม่อย่างสดชื่นครับ`;
          if (isWfhAlarm) {
            notifBody = `วันนี้ทำงานที่บ้าน WFH (${targetTime} น.) เริ่มต้นวันใหม่อย่างสดชื่นครับ`;
          } else if (isWeekendAlarm) {
            notifBody = `วันนี้ทำงานเสาร์-อาทิตย์ (${targetTime} น.) รถไม่ติด เดินทางสบายๆ เริ่มต้นวันอย่างสดชื่นครับ`;
          }

          const notifId = await scheduleNotificationAsync({
            content: {
              title: notifTitle,
              body: notifBody,
              sound: 'default',
              priority: AndroidNotificationPriority.MAX,
              color: '#2563EB',
              data: {
                type: 'smart-alarm',
                date: item.date,
                alarmTime: targetTime,
              },
            },
            trigger: {
              type: SchedulableTriggerInputTypes.DATE,
              date: alarmDate,
              channelId: SMART_ALARM_CHANNEL_ID,
            },
          });

          if (notifId) {
            scheduledIds.push(notifId);
            item.notificationId = notifId;
            scheduledCount++;
          }
        } catch (err) {
          console.warn('Error scheduling smart alarm for', item.date, err);
        }
      }
    }

    // --- B. Schedule Pre-holiday Goodnight Alert (Night before at 20:00) ---
    if (
      config.preHolidayReminder &&
      (item.status === 'skip_holiday' || item.status === 'skip_leave' || item.status === 'skip_regular_off')
    ) {
      // Calculate night before at 20:00
      const holidayDate = new Date(`${item.date}T00:00:00`);
      const nightBefore = new Date(holidayDate);
      nightBefore.setDate(nightBefore.getDate() - 1);
      nightBefore.setHours(20, 0, 0, 0);

      if (nightBefore.getTime() > now) {
        try {
          let goodnightTitle = `แจ้งเตือน: พรุ่งนี้วันหยุด (${item.reason})`;
          if (item.status === 'skip_leave') {
            goodnightTitle = `แจ้งเตือน: พรุ่งนี้วันลา (${item.reason})`;
          } else if (item.status === 'skip_regular_off') {
            goodnightTitle = `แจ้งเตือน: พรุ่งนี้วันหยุดปกติ (${item.reason})`;
          }
          const goodnightBody = `ระบบปิดนาฬิกาปลุกให้แล้ว พักผ่อนให้เต็มที่นะครับ`;

          const gId = await scheduleNotificationAsync({
            content: {
              title: goodnightTitle,
              body: goodnightBody,
              sound: 'default',
              priority: AndroidNotificationPriority.HIGH,
              color: '#8B5CF6',
              data: {
                type: 'goodnight-alert',
                date: item.date,
              },
            },
            trigger: {
              type: SchedulableTriggerInputTypes.DATE,
              date: nightBefore,
              channelId: SMART_ALARM_PRE_REMINDER_CHANNEL_ID,
            },
          });

          if (gId) {
            scheduledIds.push(gId);
            goodnightCount++;
          }
        } catch (err) {
          console.warn('Error scheduling goodnight alert for', item.date, err);
        }
      }
    }
  }

  // 4. Save newly scheduled notification IDs
  try {
    await AsyncStorage.setItem(
      SMART_ALARM_SCHEDULED_IDS_KEY,
      JSON.stringify(scheduledIds)
    );
  } catch (err) {
    console.error('Error saving scheduled smart alarm IDs:', err);
  }

  return {
    scheduledCount,
    goodnightCount,
    schedule: fullSchedule.slice(0, 7),
  };
}

/**
 * Get quick summary for UI widgets
 */
export function getSmartAlarmSummary(schedule: SmartAlarmScheduleItem[]) {
  if (!schedule || schedule.length === 0) {
    return {
      tomorrowStatus: 'unknown',
      tomorrowText: 'ยังไม่มีข้อมูล',
      nextAlarmText: '-',
      isTomorrowWorkday: false,
    };
  }

  // Tomorrow is index 1 if index 0 is today
  const tomorrow = schedule.length > 1 ? schedule[1] : schedule[0];

  let tomorrowText = '';
  let isTomorrowWorkday = false;

  switch (tomorrow.status) {
    case 'alarm':
      tomorrowText = `พรุ่งนี้วันทำงาน (ปลุก ${tomorrow.alarmTime} น.)`;
      isTomorrowWorkday = true;
      break;
    case 'weekend_alarm':
      tomorrowText = `พรุ่งนี้ทำงาน เสาร์-อาทิตย์ (ปลุก ${tomorrow.alarmTime} น.)`;
      isTomorrowWorkday = true;
      break;
    case 'wfh_alarm':
      tomorrowText = `พรุ่งนี้ WFH (ปลุก ${tomorrow.alarmTime} น.)`;
      isTomorrowWorkday = true;
      break;
    case 'skip_regular_off':
      tomorrowText = `พรุ่งนี้วันหยุดปกติ (งดปลุก)`;
      break;
    case 'skip_holiday':
      tomorrowText = `พรุ่งนี้วันหยุด: ${tomorrow.reason} (งดปลุก)`;
      break;
    case 'skip_leave':
      tomorrowText = `พรุ่งนี้วันลา: ${tomorrow.reason} (งดปลุก)`;
      break;
    case 'skip_weekend':
      tomorrowText = `พรุ่งนี้วันหยุดสัปดาห์ (งดปลุก)`;
      break;
    case 'skip_wfh':
      tomorrowText = `พรุ่งนี้ WFH (งดปลุกตามที่ตั้งไว้)`;
      break;
    default:
      tomorrowText = tomorrow.reason || '-';
  }

  // Find next ringing alarm
  const nextRinging = schedule.find(
    (s) => s.status === 'alarm' || s.status === 'wfh_alarm' || s.status === 'weekend_alarm'
  );
  const nextAlarmText = nextRinging
    ? `วัน${nextRinging.dayName} ${nextRinging.alarmTime} น.`
    : 'ไม่มีรอบปลุก';

  return {
    tomorrowStatus: tomorrow.status,
    tomorrowText,
    nextAlarmText,
    isTomorrowWorkday,
  };
}
