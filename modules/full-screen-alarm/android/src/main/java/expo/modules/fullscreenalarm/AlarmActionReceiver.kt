package expo.modules.fullscreenalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationManagerCompat

class AlarmActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    val alarmId = intent.getStringExtra("alarmId") ?: return
    val notificationManager = NotificationManagerCompat.from(context)

    // Always stop the AlarmRingtoneService immediately to silence vibration + audio
    try {
      val stopService = Intent(context, AlarmRingtoneService::class.java).apply {
        this.action = AlarmRingtoneService.ACTION_STOP_RINGTONE
      }
      context.stopService(stopService)
    } catch (e: Exception) {
      e.printStackTrace()
    }

    // Dismiss the visible alarm notification
    notificationManager.cancel(alarmId.hashCode())
    // Also cancel the foreground-service notification (ID 0xA1A5)
    notificationManager.cancel(0xA1A5)

    when (action) {
      "ACTION_SNOOZE" -> {
        val alarmTime = intent.getStringExtra("alarmTime") ?: ""
        val reason = intent.getStringExtra("reason") ?: "วันทำงาน"
        val snoozeMinutes = 10
        val triggerTimeMs = System.currentTimeMillis() + (snoozeMinutes * 60 * 1000)

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
          action = "expo.modules.fullscreenalarm.ALARM_WAKEUP"
          putExtra("alarmId", "${alarmId}_snooze")
          putExtra("title", "ถึงเวลาตื่นแล้ว! ($reason - เลื่อนปลุก $snoozeMinutes นาที)")
          putExtra("message", "ถึงเวลาที่เลื่อนปลุกไว้แล้ว เริ่มต้นวันใหม่อย่างสดชื่นครับ")
          putExtra("alarmTime", alarmTime)
          putExtra("reason", "$reason (เลื่อนปลุก)")
        }

        val pendingIntent = PendingIntent.getBroadcast(
          context,
          "${alarmId}_snooze".hashCode(),
          alarmIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
              AlarmManager.RTC_WAKEUP,
              triggerTimeMs,
              pendingIntent
            )
          } else {
            alarmManager.setExact(
              AlarmManager.RTC_WAKEUP,
              triggerTimeMs,
              pendingIntent
            )
          }
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }

      "ACTION_DISMISS" -> {
        // Ringtone service already stopped above, notification already cancelled — done.
      }
    }
  }
}
