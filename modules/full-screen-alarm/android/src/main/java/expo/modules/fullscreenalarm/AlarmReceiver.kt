package expo.modules.fullscreenalarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class AlarmReceiver : BroadcastReceiver() {

  companion object {
    const val CHANNEL_ID = "smart_workday_alarm_v4"
    const val CHANNEL_NAME = "นาฬิกาปลุกวันทำงาน (Smart Workday Alarm)"
    const val CHANNEL_DESC = "เสียงปลุกเฉพาะวันทำงานจริง และงดปลุกวันหยุด/วันลาอัตโนมัติ"
  }

  override fun onReceive(context: Context, intent: Intent) {
    val alarmId = intent.getStringExtra("alarmId") ?: "default_alarm"
    val title = intent.getStringExtra("title") ?: "ถึงเวลาตื่นแล้ว!"
    val message = intent.getStringExtra("message") ?: "เริ่มต้นวันใหม่อย่างสดชื่นครับ"
    val alarmTime = intent.getStringExtra("alarmTime") ?: ""
    val reason = intent.getStringExtra("reason") ?: "วันทำงานปกติ"

    // 1. Acquire WakeLock to wake up CPU + turn screen on
    //    Hold for 3.5 minutes to cover full ring duration
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
    val wakeLock = powerManager?.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
      "TimeTrackOT:AlarmReceiverWakeLock"
    )
    wakeLock?.acquire(210_000L) // 3.5 minutes — covers full ring + some buffer

    // 2. Start AlarmRingtoneService (ForegroundService) for continuous vibration + audio
    //    This works even if the app is killed or the screen is locked
    try {
      val ringtoneIntent = Intent(context, AlarmRingtoneService::class.java).apply {
        action = AlarmRingtoneService.ACTION_START_RINGTONE
        putExtra(AlarmRingtoneService.EXTRA_ALARM_ID, alarmId)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(ringtoneIntent)
      } else {
        context.startService(ringtoneIntent)
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }

    // 3. Prepare sound URI for notification (used as heads-up fallback on lockscreen)
    val soundUri = Uri.parse("android.resource://${context.packageName}/raw/alarm")
    // Minimal pattern here — actual continuous vibration is handled by AlarmRingtoneService
    val notifVibrationPattern = longArrayOf(0, 500, 300, 500)

    // 4. Ensure Notification Channel exists on API 26+
    val notificationManager = NotificationManagerCompat.from(context)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val audioAttributes = AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .setUsage(AudioAttributes.USAGE_ALARM)
        .build()

      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = CHANNEL_DESC
        setSound(soundUri, audioAttributes)
        vibrationPattern = notifVibrationPattern
        enableVibration(true)
        enableLights(true)
        lightColor = 0xFF2563EB.toInt()
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        setBypassDnd(true)
      }

      val systemNotifManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      systemNotifManager?.createNotificationChannel(channel)
    }

    // 5. Create Full-Screen Intent pointing to native AlarmActivity
    val launchIntent = Intent(context, AlarmActivity::class.java).apply {
      action = "expo.modules.fullscreenalarm.ALARM_TRIGGER"
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or
              Intent.FLAG_ACTIVITY_CLEAR_TOP or
              Intent.FLAG_ACTIVITY_SINGLE_TOP or
              Intent.FLAG_ACTIVITY_NO_USER_ACTION
      putExtra("isAlarmTriggered", true)
      putExtra("alarmId", alarmId)
      putExtra("alarmTime", alarmTime)
      putExtra("reason", reason)
    }

    // Directly attempt to pop up the full-screen AlarmActivity immediately
    try {
      context.startActivity(launchIntent)
    } catch (e: Exception) {
      e.printStackTrace()
    }

    val fullScreenPendingIntent = PendingIntent.getActivity(
      context,
      alarmId.hashCode(),
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    // 6. Action PendingIntents for Snooze & Dismiss buttons (shown on lockscreen notification)
    val snoozeIntent = Intent(context, AlarmActionReceiver::class.java).apply {
      action = "ACTION_SNOOZE"
      putExtra("alarmId", alarmId)
      putExtra("alarmTime", alarmTime)
      putExtra("reason", reason)
    }
    val snoozePendingIntent = PendingIntent.getBroadcast(
      context,
      (alarmId.hashCode() + 1),
      snoozeIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val dismissIntent = Intent(context, AlarmActionReceiver::class.java).apply {
      action = "ACTION_DISMISS"
      putExtra("alarmId", alarmId)
    }
    val dismissPendingIntent = PendingIntent.getBroadcast(
      context,
      (alarmId.hashCode() + 2),
      dismissIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    // 7. Build and post the alarm notification (Heads-up / Full-Screen)
    val iconRes = if (context.applicationInfo.icon != 0) {
      context.applicationInfo.icon
    } else {
      android.R.drawable.ic_lock_idle_alarm
    }

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(iconRes)
      .setContentTitle(title)
      .setContentText(message)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setSound(soundUri)
      .setVibrate(notifVibrationPattern)
      .setOngoing(true)
      .setAutoCancel(false)
      .setColor(0xFF2563EB.toInt())
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .setContentIntent(fullScreenPendingIntent)
      .addAction(0, "เลื่อนปลุก 10 นาที", snoozePendingIntent)
      .addAction(0, "ปิดนาฬิกาปลุก", dismissPendingIntent)

    notificationManager.notify(alarmId.hashCode(), builder.build())
  }
}
