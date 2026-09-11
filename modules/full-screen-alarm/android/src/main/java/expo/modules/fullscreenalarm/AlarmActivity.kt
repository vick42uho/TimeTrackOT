package expo.modules.fullscreenalarm

import android.app.Activity
import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationManagerCompat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Native Full-Screen Alarm Activity
 *
 * แสดงหน้าต่างปลุกเต็มจอบนหน้าจอล็อกได้ทันที (0 วินาที) โดยไม่ต้องรอ React Native โหลด
 * พร้อมปลดล็อกหน้าจอและเปิดไฟหน้าจออัตโนมัติ (Show when locked + Turn screen on)
 */
class AlarmActivity : Activity() {

    private val timeHandler = Handler(Looper.getMainLooper())
    private var timeRunnable: Runnable? = null

    private lateinit var clockTextView: TextView
    private lateinit var dateTextView: TextView
    private lateinit var reasonTextView: TextView

    private var alarmId: String = "default_alarm"
    private var alarmTime: String = ""
    private var reason: String = "วันทำงานปกติ"

    companion object {
        private val THAI_DAYS = arrayOf("วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์")
        private val THAI_MONTHS = arrayOf(
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. ปลดล็อกและเปิดหน้าจอทันทีที่มีการเรียกใช้งาน
        setupLockscreenFlags()

        alarmId = intent.getStringExtra("alarmId") ?: "default_alarm"
        alarmTime = intent.getStringExtra("alarmTime") ?: ""
        reason = intent.getStringExtra("reason") ?: "วันทำงานปกติ"

        // 2. สร้าง UI หน้าต่างปลุกเต็มจอแบบ Programmatic View Tree
        val rootView = buildAlarmView()
        setContentView(rootView)

        // 3. เริ่มนับเวลานาฬิกาดิจิทัลแบบเรียลไทม์ (อัปเดตทุก 1 วินาที)
        startClockTimer()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        alarmId = intent?.getStringExtra("alarmId") ?: alarmId
        alarmTime = intent?.getStringExtra("alarmTime") ?: alarmTime
        reason = intent?.getStringExtra("reason") ?: reason
        reasonTextView.text = reason
    }

    private fun setupLockscreenFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
            keyguardManager?.requestDismissKeyguard(this, null)
        }
        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        // ซ่อน Status Bar และ Navigation Bar ชั่วคราวเพื่อให้แสดงผลเต็มจอแบบสมบูรณ์
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
    }

    private fun buildAlarmView(): View {
        val density = resources.displayMetrics.density

        fun dp(value: Int): Int = (value * density).toInt()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#090D16"))
            setPadding(dp(24), dp(48), dp(24), dp(32))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            gravity = Gravity.CENTER_HORIZONTAL
        }

        // Top Badge
        val topBadge = TextView(this).apply {
            text = "นาฬิกาปลุก TimeTrack OT"
            setTextColor(Color.parseColor("#93C5FD"))
            textSize = 13f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dp(16), dp(8), dp(16), dp(8))
            val badgeBg = GradientDrawable().apply {
                setColor(Color.parseColor("#1E293B"))
                cornerRadius = dp(20).toFloat()
                setStroke(dp(1), Color.parseColor("#3B82F6"))
            }
            background = badgeBg
        }
        root.addView(topBadge)

        // Center Content Area (Weights 1 to push buttons to bottom)
        val centerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
        }

        // Digital Clock (HH:mm:ss)
        clockTextView = TextView(this).apply {
            text = "00:00:00"
            setTextColor(Color.WHITE)
            textSize = 54f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setShadowLayer(dp(8).toFloat(), 0f, 0f, Color.parseColor("#3B82F6"))
        }
        centerLayout.addView(clockTextView)

        // Thai Date
        dateTextView = TextView(this).apply {
            text = ""
            setTextColor(Color.parseColor("#CBD5E1"))
            textSize = 16f
            typeface = Typeface.DEFAULT
            gravity = Gravity.CENTER
            setPadding(0, dp(8), 0, dp(16))
        }
        centerLayout.addView(dateTextView)

        // Reason Badge
        reasonTextView = TextView(this).apply {
            text = reason
            setTextColor(Color.parseColor("#60A5FA"))
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dp(16), dp(8), dp(16), dp(8))
            val reasonBg = GradientDrawable().apply {
                setColor(Color.parseColor("#172554"))
                cornerRadius = dp(12).toFloat()
                setStroke(dp(1), Color.parseColor("#2563EB"))
            }
            background = reasonBg
        }
        centerLayout.addView(reasonTextView)

        root.addView(centerLayout)

        // Bottom Action Buttons Area
        val bottomLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        // Snooze Button (10 Minutes)
        val snoozeButton = Button(this).apply {
            text = "เลื่อนปลุก 10 นาที"
            setTextColor(Color.parseColor("#E2E8F0"))
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#1E293B"))
                cornerRadius = dp(14).toFloat()
                setStroke(dp(1), Color.parseColor("#475569"))
            }
            background = btnBg
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(50)
            ).apply {
                bottomMargin = dp(14)
            }
            setOnClickListener {
                handleSnooze()
            }
        }
        bottomLayout.addView(snoozeButton)

        // Slide to Stop Container (Remimo & iOS Style)
        val sliderHeight = dp(58)
        val sliderContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                sliderHeight
            ).apply {
                bottomMargin = dp(14)
            }
            val trackBg = GradientDrawable().apply {
                setColor(Color.parseColor("#172033"))
                cornerRadius = dp(29).toFloat()
                setStroke(dp(1), Color.parseColor("#334155"))
            }
            background = trackBg
        }

        val sliderHintText = TextView(this).apply {
            text = "slide to stop  >>>"
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        sliderContainer.addView(sliderHintText)

        val thumbSize = dp(50)
        val thumbMargin = dp(4)
        val thumbView = View(this).apply {
            layoutParams = FrameLayout.LayoutParams(thumbSize, thumbSize).apply {
                gravity = Gravity.START or Gravity.CENTER_VERTICAL
                leftMargin = thumbMargin
            }
            val thumbBg = GradientDrawable().apply {
                setColor(Color.parseColor("#EF4444")) // Vibrant Red
                cornerRadius = dp(25).toFloat()
            }
            background = thumbBg
        }
        sliderContainer.addView(thumbView)

        var dX = 0f
        var isDismissTriggered = false

        thumbView.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    dX = v.x - event.rawX
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    if (isDismissTriggered) return@setOnTouchListener true
                    val maxTravel = (sliderContainer.width - thumbSize - thumbMargin).toFloat()
                    val minTravel = thumbMargin.toFloat()
                    var newX = event.rawX + dX
                    if (newX < minTravel) newX = minTravel
                    if (newX > maxTravel) newX = maxTravel
                    v.x = newX

                    val progress = if (maxTravel > minTravel) {
                        ((newX - minTravel) / (maxTravel - minTravel)).coerceIn(0f, 1f)
                    } else 0f
                    sliderHintText.alpha = (1f - progress * 1.5f).coerceAtLeast(0f)

                    if (progress >= 0.82f) {
                        isDismissTriggered = true
                        handleDismiss()
                    }
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (!isDismissTriggered) {
                        v.animate()
                            .x(thumbMargin.toFloat())
                            .setDuration(200)
                            .start()
                        sliderHintText.animate()
                            .alpha(1f)
                            .setDuration(200)
                            .start()
                    }
                    true
                }
                else -> false
            }
        }
        bottomLayout.addView(sliderContainer)

        // Open App Link Button
        val openAppButton = TextView(this).apply {
            text = "เปิดแอพ TimeTrack OT →"
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 13f
            gravity = Gravity.CENTER
            setPadding(0, dp(8), 0, dp(4))
            setOnClickListener {
                handleOpenApp()
            }
        }
        bottomLayout.addView(openAppButton)

        root.addView(bottomLayout)

        return root
    }

    private fun startClockTimer() {
        timeRunnable = object : Runnable {
            override fun run() {
                val now = Calendar.getInstance()
                val hour = now.get(Calendar.HOUR_OF_DAY)
                val minute = now.get(Calendar.MINUTE)
                val second = now.get(Calendar.SECOND)
                clockTextView.text = String.format("%02d:%02d:%02d", hour, minute, second)

                val dayOfWeek = now.get(Calendar.DAY_OF_WEEK) - 1
                val dayOfMonth = now.get(Calendar.DAY_OF_MONTH)
                val month = now.get(Calendar.MONTH)
                val thaiYear = now.get(Calendar.YEAR) + 543

                val dayName = if (dayOfWeek in 0..6) THAI_DAYS[dayOfWeek] else ""
                val monthName = if (month in 0..11) THAI_MONTHS[month] else ""

                dateTextView.text = "$dayNameที่ $dayOfMonth $monthName $thaiYear"

                timeHandler.postDelayed(this, 1000)
            }
        }
        timeHandler.post(timeRunnable!!)
    }

    private fun handleDismiss() {
        stopAlarmServices()
        finishAndRemoveTask()
    }

    private fun handleSnooze() {
        stopAlarmServices()

        // Trigger Snooze Action via AlarmActionReceiver
        val snoozeIntent = Intent(this, AlarmActionReceiver::class.java).apply {
            action = "ACTION_SNOOZE"
            putExtra("alarmId", alarmId)
            putExtra("alarmTime", alarmTime)
            putExtra("reason", reason)
        }
        sendBroadcast(snoozeIntent)

        finishAndRemoveTask()
    }

    private fun handleOpenApp() {
        stopAlarmServices()
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            startActivity(launchIntent)
        }
        finishAndRemoveTask()
    }

    private fun stopAlarmServices() {
        try {
            val stopService = Intent(this, AlarmRingtoneService::class.java).apply {
                action = AlarmRingtoneService.ACTION_STOP_RINGTONE
            }
            stopService(stopService)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        val notificationManager = NotificationManagerCompat.from(this)
        notificationManager.cancel(alarmId.hashCode())
        notificationManager.cancel(0xA1A5)
    }

    override fun onDestroy() {
        timeRunnable?.let { timeHandler.removeCallbacks(it) }
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // กดปุ่ม Back ให้ทำงานเหมือนปิดนาฬิกาปลุก
        handleDismiss()
    }
}
