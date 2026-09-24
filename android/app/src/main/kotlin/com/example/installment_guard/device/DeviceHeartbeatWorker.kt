package com.example.installment_guard.device

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class DeviceHeartbeatWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "DeviceHeartbeatWorker"
        const val WORK_NAME = "InstallmentGuardHeartbeatWorker"
        private const val DEFAULT_SERVER_URL = "https://instalment-guard-production-8ff6.up.railway.app/api"
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.i(TAG, "Executing scheduled device heartbeat check-in...")
            val policyService = DevicePolicyService(applicationContext)
            
            if (policyService.isManagedDevice()) {
                policyService.applyPolicyRestrictions()
            }

            val deviceData = policyService.getDeviceInformation()
            val deviceId = deviceData["deviceId"]?.toString() ?: "UNKNOWN_DEVICE"

            val prefs = applicationContext.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
            prefs.edit().putLong("last_check_in_timestamp", System.currentTimeMillis()).apply()

            // Perform Native HTTP Sync with Node.js Server
            syncNativeHeartbeat(policyService, deviceId, deviceData)

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error executing background heartbeat: ${e.message}", e)
            Result.retry()
        }
    }

    private fun syncNativeHeartbeat(policyService: DevicePolicyService, deviceId: String, deviceData: Map<String, Any>) {
        try {
            val prefs = applicationContext.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
            val custom = prefs.getString("custom_server_ip", null)
            val baseServer = when {
                !custom.isNullOrBlank() -> if (custom.endsWith("/api")) custom else "$custom/api"
                else -> DEFAULT_SERVER_URL
            }
            val serverUrlStr = "$baseServer/devices/$deviceId/telemetry"
            val url = URL(serverUrlStr)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.connectTimeout = 5000
            conn.readTimeout = 5000
            conn.doOutput = true

            val jsonBody = JSONObject()
            for ((key, value) in deviceData) {
                jsonBody.put(key, value)
            }

            val writer = OutputStreamWriter(conn.outputStream)
            writer.write(jsonBody.toString())
            writer.flush()
            writer.close()

            val responseCode = conn.responseCode
            if (responseCode == 200 || responseCode == 201) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val sb = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    sb.append(line)
                }
                reader.close()

                val resJson = JSONObject(sb.toString())
                val isServerRestricted = resJson.optBoolean("isRestricted", false)
                val currentLocalRestricted = policyService.isDeviceRestricted()

                Log.i(TAG, "Native Sync Result: isServerRestricted=$isServerRestricted, currentLocalRestricted=$currentLocalRestricted")

                if (!isServerRestricted && currentLocalRestricted) {
                    Log.i(TAG, "Server removed restriction! Unlocking device natively...")
                    policyService.applyDeviceRestriction(false)
                } else if (isServerRestricted && !currentLocalRestricted) {
                    Log.i(TAG, "Server applied restriction! Locking device natively...")
                    policyService.applyDeviceRestriction(true)
                }

                // Process pending commands if any
                val pendingCmds = resJson.optJSONArray("pendingCommands")
                if (pendingCmds != null) {
                    for (i in 0 until pendingCmds.length()) {
                        val cmdObj = pendingCmds.getJSONObject(i)
                        val cmdType = cmdObj.optString("commandType", "")
                        if (cmdType == "REMOVE_RESTRICTION") {
                            Log.i(TAG, "Processing pending REMOVE_RESTRICTION command natively.")
                            policyService.applyDeviceRestriction(false)
                        } else if (cmdType == "RESTRICT_DEVICE") {
                            Log.i(TAG, "Processing pending RESTRICT_DEVICE command natively.")
                            policyService.applyDeviceRestriction(true)
                        } else if (cmdType == "HIDE_APP") {
                            policyService.hideApplicationLauncher(true)
                        } else if (cmdType == "UNHIDE_APP") {
                            policyService.hideApplicationLauncher(false)
                        }
                    }
                }
            } else {
                Log.w(TAG, "Native heartbeat server returned HTTP $responseCode")
            }
            conn.disconnect()
        } catch (e: Exception) {
            Log.w(TAG, "Native HTTP heartbeat sync failed: ${e.message}")
        }
    }
}
