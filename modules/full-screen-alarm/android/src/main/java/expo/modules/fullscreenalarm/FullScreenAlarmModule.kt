package expo.modules.fullscreenalarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FullScreenAlarmModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("FullScreenAlarm")

    Events("onAlarmTriggered")

    OnActivityEntersForeground {
      val activity = appContext.currentActivity
      if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        activity.setShowWhenLocked(true)
        activity.setTurnScreenOn(true)
      }
    }

    OnNewIntent { intent ->
      val isAlarmTriggered = intent.getBooleanExtra("isAlarmTriggered", false)
      if (isAlarmTriggered) {
        val activity = appContext.currentActivity
        if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
          activity.setShowWhenLocked(true)
          activity.setTurnScreenOn(true)
        }

        val alarmId = intent.getStringExtra("alarmId") ?: ""
        val alarmTime = intent.getStringExtra("alarmTime") ?: ""
        val reason = intent.getStringExtra("reason") ?: ""

        sendEvent("onAlarmTriggered", mapOf(
          "isAlarmTriggered" to true,
          "alarmId" to alarmId,
          "alarmTime" to alarmTime,
          "reason" to reason
        ))
      }
    }

    AsyncFunction("scheduleAlarm") { id: String, timestampMs: Double, title: String, message: String, alarmTime: String, reason: String ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return@AsyncFunction false

      val intent = Intent(context, AlarmReceiver::class.java).apply {
        action = "expo.modules.fullscreenalarm.ALARM_WAKEUP"
        putExtra("alarmId", id)
        putExtra("title", title)
        putExtra("message", message)
        putExtra("alarmTime", alarmTime)
        putExtra("reason", reason)
      }

      val pendingIntent = PendingIntent.getBroadcast(
        context,
        id.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      val triggerTime = timestampMs.toLong()

      try {
        val showIntent = Intent(context, AlarmActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val showPendingIntent = PendingIntent.getActivity(
          context,
          id.hashCode() + 99,
          showIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerTime, showPendingIntent)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
        true
      } catch (e: Exception) {
        // Fallback to setExactAndAllowWhileIdle if setAlarmClock encounters a SecurityException
        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
              AlarmManager.RTC_WAKEUP,
              triggerTime,
              pendingIntent
            )
          } else {
            alarmManager.setExact(
              AlarmManager.RTC_WAKEUP,
              triggerTime,
              pendingIntent
            )
          }
          true
        } catch (e2: Exception) {
          e2.printStackTrace()
          false
        }
      }
    }

    AsyncFunction("cancelAlarm") { id: String ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return@AsyncFunction false

      val intent = Intent(context, AlarmReceiver::class.java).apply {
        action = "expo.modules.fullscreenalarm.ALARM_WAKEUP"
      }
      val pendingIntent = PendingIntent.getBroadcast(
        context,
        id.hashCode(),
        intent,
        PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
      )

      if (pendingIntent != null) {
        alarmManager.cancel(pendingIntent)
        pendingIntent.cancel()
      }

      // Also dismiss any existing notification
      val notificationManager = NotificationManagerCompat.from(context)
      notificationManager.cancel(id.hashCode())
      true
    }

    AsyncFunction("dismissAlarm") { id: String ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val notificationManager = NotificationManagerCompat.from(context)
      notificationManager.cancel(id.hashCode())
      true
    }

    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val context = appContext.reactContext ?: return@Function true
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        alarmManager?.canScheduleExactAlarms() ?: true
      } else {
        true
      }
    }

    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT >= 34) { // Android 14+
        val context = appContext.reactContext ?: return@Function true
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        notificationManager?.canUseFullScreenIntent() ?: true
      } else {
        true
      }
    }

    AsyncFunction("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val context = appContext.reactContext ?: return@AsyncFunction false
        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
          data = Uri.parse("package:${context.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        true
      } else {
        true
      }
    }

    AsyncFunction("openFullScreenIntentSettings") {
      if (Build.VERSION.SDK_INT >= 34) {
        val context = appContext.reactContext ?: return@AsyncFunction false
        val intent = Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT").apply {
          data = Uri.parse("package:${context.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        true
      } else {
        true
      }
    }

    AsyncFunction("openLockScreenPermissionSettings") {
      val context = appContext.reactContext ?: return@AsyncFunction false

      // 1. Try Xiaomi / MIUI / HyperOS specific permission editor
      try {
        val miuiIntent = Intent("miui.intent.action.APP_PERM_EDITOR").apply {
          setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity")
          putExtra("extra_pkgname", context.packageName)
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(miuiIntent)
        return@AsyncFunction true
      } catch (e: Exception) {}

      // 2. Try Android 14+ MANAGE_APP_USE_FULL_SCREEN_INTENT
      if (Build.VERSION.SDK_INT >= 34) {
        try {
          val intent = Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT").apply {
            data = Uri.parse("package:${context.packageName}")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
          }
          context.startActivity(intent)
          return@AsyncFunction true
        } catch (e: Exception) {}
      }

      // 3. Fallback to App Details Settings
      try {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:${context.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return@AsyncFunction true
      } catch (e: Exception) {}

      false
    }

    AsyncFunction("setCustomAlarmSound") { soundPath: String? ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val prefs = context.getSharedPreferences("TimeTrackAlarmPrefs", Context.MODE_PRIVATE)
      prefs.edit().apply {
        if (soundPath.isNullOrEmpty()) {
          remove("custom_alarm_sound_path")
        } else {
          putString("custom_alarm_sound_path", soundPath)
        }
        apply()
      }
      true
    }

    Function("getCustomAlarmSound") {
      val context = appContext.reactContext ?: return@Function null
      val prefs = context.getSharedPreferences("TimeTrackAlarmPrefs", Context.MODE_PRIVATE)
      prefs.getString("custom_alarm_sound_path", null)
    }

    Function("getInitialAlarm") {
      val activity = appContext.currentActivity ?: return@Function null
      val intent = activity.intent ?: return@Function null

      val isAlarmTriggered = intent.getBooleanExtra("isAlarmTriggered", false)
      if (!isAlarmTriggered) {
        return@Function null
      }

      val alarmId = intent.getStringExtra("alarmId") ?: ""
      val alarmTime = intent.getStringExtra("alarmTime") ?: ""
      val reason = intent.getStringExtra("reason") ?: ""

      // Clear the extra so it doesn't re-trigger on orientation change
      intent.removeExtra("isAlarmTriggered")

      mapOf(
        "isAlarmTriggered" to true,
        "alarmId" to alarmId,
        "alarmTime" to alarmTime,
        "reason" to reason
      )
    }
  }
}
