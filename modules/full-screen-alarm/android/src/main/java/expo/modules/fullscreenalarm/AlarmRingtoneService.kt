package expo.modules.fullscreenalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat

/**
 * AlarmRingtoneService — ForegroundService ที่คุมเสียงปลุก + การสั่นต่อเนื่อง
 * ทำงานได้แม้แอพถูกปิดหรือหน้าจอล็อค โดยไม่ขึ้นกับ Activity lifecycle
 *
 * ลักษณะการทำงาน:
 * - เล่นเสียงปลุก (alarm.wav) วนลูปต่อเนื่อง
 * - สั่งมอเตอร์สั่น (Vibrator) เป็นจังหวะ วนลูปต่อเนื่อง
 * - ตัดอัตโนมัติเมื่อครบ MAX_RING_DURATION_MS (3 นาที)
 * - หยุดทันทีเมื่อได้รับ ACTION_STOP_RINGTONE จาก AlarmActionReceiver
 */
class AlarmRingtoneService : Service() {

    companion object {
        const val ACTION_START_RINGTONE = "expo.modules.fullscreenalarm.START_RINGTONE"
        const val ACTION_STOP_RINGTONE  = "expo.modules.fullscreenalarm.STOP_RINGTONE"
        const val EXTRA_ALARM_ID        = "alarmId"

        /** ระยะเวลาสูงสุดที่ปล่อยให้สั่น + เสียงดังก่อนตัดอัตโนมัติ (3 นาที) */
        private const val MAX_RING_DURATION_MS = 3 * 60 * 1000L

        /** Vibration pattern: [หน่วงก่อน, สั่น, หยุด, สั่น, หยุด, ...] */
        private val VIBRATE_PATTERN = longArrayOf(
            0L,
            800L, 400L, 800L, 400L, 800L, 400L, 800L, 400L, 800L,
            600L,
            800L, 400L, 800L, 400L, 800L, 400L, 800L, 400L, 800L,
            600L,
            800L, 400L, 800L, 400L,
        )

        private const val SERVICE_NOTIF_CHANNEL_ID = "alarm_ringtone_service_channel"
        private const val SERVICE_NOTIF_ID = 0xA1A5 // arbitrary unique ID for foreground notification
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private val autoStopHandler = Handler(Looper.getMainLooper())
    private val autoStopRunnable = Runnable { stopSelf() }

    // -------------------------------------------------------------------
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        ensureForegroundServiceChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_RINGTONE -> {
                stopRingtone()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START_RINGTONE -> {
                // Start as Foreground with a silent/minimal notification so Android
                // lets this service keep running while screen is locked / app is killed
                startForeground(SERVICE_NOTIF_ID, buildForegroundNotification())
                startRingtone()
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        autoStopHandler.removeCallbacks(autoStopRunnable)
        stopRingtone()
        super.onDestroy()
    }

    // -------------------------------------------------------------------
    /** เล่นเสียงปลุก + เปิดการสั่น + ตั้งตัวตัดอัตโนมัติ */
    private fun startRingtone() {
        startVibration()
        startAudio()
        // ตัดอัตโนมัติเมื่อครบ MAX_RING_DURATION_MS
        autoStopHandler.postDelayed(autoStopRunnable, MAX_RING_DURATION_MS)
    }

    /** หยุดเสียงและการสั่นทั้งหมด */
    private fun stopRingtone() {
        try {
            vibrator?.cancel()
            vibrator = null
        } catch (_: Exception) {}

        try {
            if (mediaPlayer?.isPlaying == true) mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (_: Exception) {}
    }

    // -------------------------------------------------------------------
    private fun startVibration() {
        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            vibrator?.let { v ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    // REPEAT = 0 หมายถึงวนตั้งแต่ index 0 ไปเรื่อยๆ
                    val effect = VibrationEffect.createWaveform(VIBRATE_PATTERN, 0)
                    val audioAttr = android.os.VibrationAttributes.Builder()
                        .setUsage(android.os.VibrationAttributes.USAGE_ALARM)
                        .build()
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        v.vibrate(effect, audioAttr)
                    } else {
                        v.vibrate(effect)
                    }
                } else {
                    @Suppress("DEPRECATION")
                    v.vibrate(VIBRATE_PATTERN, 0)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun startAudio() {
        try {
            // 1. ตรวจสอบระดับเสียงช่องสัญญาณ STREAM_ALARM
            //    ถ้าผู้ใช้หรี่เสียงไว้ต่ำกว่า 70% ให้ปรับขึ้นมาเป็น 85% ของระดับสูงสุด
            //    เพื่อให้มั่นใจว่าเสียงจะดังแน่นอน แม้เครื่องจะเปิดโหมดเงียบ (Silent) หรือหรี่เสียงไว้
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            audioManager?.let { am ->
                try {
                    val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
                    val currentVol = am.getStreamVolume(AudioManager.STREAM_ALARM)
                    if (currentVol < (maxVol * 0.7).toInt()) {
                        am.setStreamVolume(AudioManager.STREAM_ALARM, (maxVol * 0.85).toInt(), 0)
                    }
                } catch (volErr: Exception) {
                    volErr.printStackTrace()
                }
            }

            // 2. ตรวจสอบว่ามีการตั้งค่าไฟล์เสียงแบบกำหนดเอง (Custom Alarm Sound) ไว้หรือไม่
            val prefs = getSharedPreferences("TimeTrackAlarmPrefs", Context.MODE_PRIVATE)
            val customSoundPath = prefs.getString("custom_alarm_sound_path", null)

            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setLegacyStreamType(AudioManager.STREAM_ALARM)
                        .build()
                )
                isLooping = true
                setVolume(1.0f, 1.0f)
            }

            var loaded = false

            // A. ลองโหลด Custom sound ถ้ามีและไฟล์ยังมีอยู่จริงในเครื่อง
            if (!customSoundPath.isNullOrEmpty()) {
                try {
                    val customFile = java.io.File(customSoundPath)
                    if (customFile.exists() && customFile.canRead()) {
                        player.setDataSource(customFile.absolutePath)
                        player.prepare()
                        loaded = true
                    }
                } catch (eCustom: Exception) {
                    eCustom.printStackTrace()
                }
            }

            // B. ถ้าไม่มี Custom sound หรือโหลดไม่สำเร็จ ให้โหลด res/raw/alarm.wav ผ่าน openRawResourceFd
            if (!loaded) {
                try {
                    val resId = resources.getIdentifier("alarm", "raw", packageName)
                    if (resId != 0) {
                        val afd = resources.openRawResourceFd(resId)
                        if (afd != null) {
                            player.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                            afd.close()
                            player.prepare()
                            loaded = true
                        }
                    }
                } catch (eRaw: Exception) {
                    eRaw.printStackTrace()
                }
            }

            // C. Fallback สุดท้าย: ระบบเริ่มต้นของ Android (System Default Alarm Ringtone)
            if (!loaded) {
                try {
                    val defaultAlarmUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM)
                    player.setDataSource(applicationContext, defaultAlarmUri)
                    player.prepare()
                    loaded = true
                } catch (eDefault: Exception) {
                    eDefault.printStackTrace()
                }
            }

            if (loaded) {
                player.start()
                mediaPlayer = player
            } else {
                player.release()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // -------------------------------------------------------------------
    private fun ensureForegroundServiceChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            if (nm?.getNotificationChannel(SERVICE_NOTIF_CHANNEL_ID) == null) {
                val ch = NotificationChannel(
                    SERVICE_NOTIF_CHANNEL_ID,
                    "Alarm Ringtone Service",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    setSound(null, null)
                    enableVibration(false)
                    setShowBadge(false)
                }
                nm?.createNotificationChannel(ch)
            }
        }
    }

    /** Notification ที่ใช้เพื่อรัน ForegroundService เท่านั้น — ไม่มีเสียง ไม่ส่งสัญญาณรบกวน */
    private fun buildForegroundNotification(): Notification {
        val stopIntent = Intent(this, AlarmActionReceiver::class.java).apply {
            action = "ACTION_DISMISS"
            putExtra(EXTRA_ALARM_ID, "fg_service")
        }
        val stopPi = PendingIntent.getBroadcast(
            this, 0xBEEF, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, SERVICE_NOTIF_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("นาฬิกาปลุกกำลังทำงาน")
            .setContentText("แตะ \"ปิดนาฬิกาปลุก\" บนแถบแจ้งเตือนด้านบนเพื่อหยุด")
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSound(null)
            .addAction(0, "ปิดนาฬิกาปลุก", stopPi)
            .build()
    }
}
