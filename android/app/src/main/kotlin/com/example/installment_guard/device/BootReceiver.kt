package com.example.installment_guard.device

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        try {
            val action = intent.action
            Log.i(TAG, "Device boot event received: $action")

            if (Intent.ACTION_MY_PACKAGE_REPLACED == action || action == "com.example.installment_guard.UNHIDE") {
                Log.i(TAG, "Package replaced or UNHIDE broadcast received. Restoring launcher visibility...")
                try {
                    val policyService = DevicePolicyService(context)
                    policyService.hideApplicationLauncher(false)
                } catch (e: Throwable) {
                    Log.e(TAG, "Failed restoring launcher visibility on package replaced: ${e.message}")
                }
                return
            }

            if (Intent.ACTION_BOOT_COMPLETED == action ||
                Intent.ACTION_LOCKED_BOOT_COMPLETED == action ||
                "android.intent.action.QUICKBOOT_POWERON" == action ||
                "com.htc.intent.action.QUICKBOOT_POWERON" == action) {

                val policyService = DevicePolicyService(context)
                
                if (policyService.isManagedDevice()) {
                    try {
                        policyService.applyPolicyRestrictions()
                    } catch (e: Throwable) {
                        Log.e(TAG, "Failed applying policy restrictions on boot: ${e.message}")
                    }
                }

                if (policyService.isDeviceRestricted()) {
                    Log.i(TAG, "Device is restricted. Starting RestrictionForegroundService on boot.")
                    try {
                        RestrictionForegroundService.startService(context)
                        policyService.applyDeviceRestriction(true)
                    } catch (e: Throwable) {
                        Log.e(TAG, "Failed starting restriction service on boot: ${e.message}")
                    }
                }

                scheduleHeartbeat(context)
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Fatal uncaught exception trapped in BootReceiver: ${e.message}", e)
        }
    }

    private fun scheduleHeartbeat(context: Context) {
        try {
            val immediateWork = androidx.work.OneTimeWorkRequestBuilder<DeviceHeartbeatWorker>().build()
            WorkManager.getInstance(context).enqueue(immediateWork)

            val heartbeatRequest = PeriodicWorkRequestBuilder<DeviceHeartbeatWorker>(
                15, TimeUnit.MINUTES
            ).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                DeviceHeartbeatWorker.WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                heartbeatRequest
            )
            Log.i(TAG, "Successfully scheduled immediate & periodic background heartbeat worker.")
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to schedule background heartbeat worker: ${e.message}")
        }
    }
}
