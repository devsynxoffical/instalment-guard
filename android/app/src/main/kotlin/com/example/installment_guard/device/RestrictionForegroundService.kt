package com.example.installment_guard.device

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.installment_guard.MainActivity
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class RestrictionForegroundService : Service() {

    companion object {
        private const val TAG = "RestrictionLockSvc"
        private const val CHANNEL_ID = "installment_guard_foreground_lock"
        private const val NOTIF_ID = 9999
        @Volatile
        private var isSyncLoopRunning = false

        fun startService(context: Context) {
            try {
                val intent = Intent(context, RestrictionForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start RestrictionForegroundService: ${e.message}")
            }
        }

        fun stopService(context: Context) {
            try {
                val intent = Intent(context, RestrictionForegroundService::class.java)
                context.stopService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to stop RestrictionForegroundService: ${e.message}")
            }
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private val syncRunnable = object : Runnable {
        override fun run() {
            Thread {
                performBackgroundSync()
            }.start()
            handler.postDelayed(this, 5000) // Poll server every 5 seconds in background
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        try {
            startForeground(NOTIF_ID, createNotification())
        } catch (e: Throwable) {
            Log.e(TAG, "Failed startForeground in onCreate: ${e.message}")
        }
        startBackgroundSyncLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "RestrictionForegroundService started on background event")

        try {
            val notification = createNotification()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    startForeground(NOTIF_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
                } catch (e: Throwable) {
                    startForeground(NOTIF_ID, notification)
                }
            } else {
                startForeground(NOTIF_ID, notification)
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to invoke startForeground safely: ${e.message}")
        }

        startBackgroundSyncLoop()
        return START_STICKY
    }

    private fun startBackgroundSyncLoop() {
        if (!isSyncLoopRunning) {
            isSyncLoopRunning = true
            handler.post(syncRunnable)
        }
    }

    private fun performBackgroundSync() {
        try {
            val policyService = DevicePolicyService(this)
            val devInfo = policyService.getDeviceInformation()
            val deviceId = devInfo["deviceId"]?.toString() ?: return

            // Native HTTP call to live Node.js REST API
            val prefs = getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
            val custom = prefs.getString("custom_server_ip", null)
            val baseServer = when {
                !custom.isNullOrBlank() -> if (custom.endsWith("/api")) custom else "$custom/api"
                else -> "https://instalment-guard-production-8ff6.up.railway.app/api"
            }
            val serverUrl = "$baseServer/devices/$deviceId/telemetry"
            val url = URL(serverUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 3000
            conn.readTimeout = 3000

            val jsonBody = JSONObject(devInfo as Map<*, *>).toString()
            conn.outputStream.use { os ->
                os.write(jsonBody.toByteArray(Charsets.UTF_8))
            }

            if (conn.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val responseStr = reader.use { it.readText() }
                val responseJson = JSONObject(responseStr)

                // Record successful online heartbeat timestamp
                prefs.edit().putLong("last_successful_online_checkin", System.currentTimeMillis()).apply()

                val isRestrictedServer = responseJson.optBoolean("isRestricted", false)
                val currentlyRestricted = prefs.getBoolean("is_device_restricted", false)

                var shouldRestrict = isRestrictedServer

                if (responseJson.has("pendingCommands")) {
                    val cmds = responseJson.optJSONArray("pendingCommands")
                    if (cmds != null) {
                        for (i in 0 until cmds.length()) {
                            val c = cmds.getJSONObject(i)
                            val type = c.optString("commandType")
                            if (type == "RESTRICT_DEVICE" || type == "LOCK_DEVICE") {
                                shouldRestrict = true
                            } else if (type == "REMOVE_RESTRICTION" || type == "UNLOCK_DEVICE") {
                                shouldRestrict = false
                            } else if (type == "HIDE_APP") {
                                policyService.hideApplicationLauncher(true)
                            } else if (type == "UNHIDE_APP") {
                                policyService.hideApplicationLauncher(false)
                            }
                        }
                    }
                }

                if (shouldRestrict != currentlyRestricted) {
                    policyService.applyDeviceRestriction(shouldRestrict)
                    if (shouldRestrict) {
                        bringAppToFrontAndLock()
                    }
                } else if (shouldRestrict) {
                    bringAppToFrontAndLock()
                }
            } else {
                checkOfflineDeadmanSwitch(policyService, prefs)
            }
            conn.disconnect()
        } catch (e: Exception) {
            // Silently handle offline network conditions and evaluate Deadman Switch
            try {
                val policyService = DevicePolicyService(this)
                val prefs = getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
                checkOfflineDeadmanSwitch(policyService, prefs)
            } catch (_: Exception) {}
        }
    }

    private fun checkOfflineDeadmanSwitch(policyService: DevicePolicyService, prefs: android.content.SharedPreferences) {
        try {
            val lastOnline = prefs.getLong("last_successful_online_checkin", System.currentTimeMillis())
            val offlineHours = (System.currentTimeMillis() - lastOnline) / (1000L * 60 * 60)
            val maxOfflineGraceHours = prefs.getInt("max_offline_grace_hours", 72) // 72 hours max offline grace period

            if (offlineHours >= maxOfflineGraceHours && !policyService.isDeviceRestricted()) {
                Log.w(TAG, "Deadman Switch Triggered: Device has been offline for $offlineHours hours. Autonomously applying lock.")
                policyService.applyDeviceRestriction(true)
                bringAppToFrontAndLock()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in checkOfflineDeadmanSwitch: ${e.message}")
        }
    }

    private fun bringAppToFrontAndLock() {
        try {
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                )
            }
            startActivity(launchIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed launching MainActivity from Foreground Service: ${e.message}")
        }
    }

    override fun onDestroy() {
        isSyncLoopRunning = false
        handler.removeCallbacks(syncRunnable)
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Installment Protection Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Enforces installment guard device protection"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PRIVATE
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, pendingIntentFlags)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentTitle("Installment Guard Protection")
            .setContentText("Background security sync active.")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
