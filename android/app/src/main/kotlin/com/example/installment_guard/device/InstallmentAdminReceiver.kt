package com.example.installment_guard.device

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class InstallmentAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "InstallmentAdminRx"

        fun getComponentName(context: Context): android.content.ComponentName {
            return android.content.ComponentName(context.applicationContext, InstallmentAdminReceiver::class.java)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        try {
            val policyService = DevicePolicyService(context)
            if (policyService.isManagedDevice() && !policyService.isAppHidden()) {
                val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
                val adminComponent = getComponentName(context)
                dpm.setApplicationHidden(adminComponent, context.packageName, false)
                val pm = context.packageManager
                val launcherComponent = android.content.ComponentName(context, com.example.installment_guard.MainActivity::class.java)
                pm.setComponentEnabledSetting(launcherComponent, android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED, android.content.pm.PackageManager.DONT_KILL_APP)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed unhiding app in onReceive: ${e.message}")
        }
        super.onReceive(context, intent)
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device Admin Enabled for Installment Guard")
        saveAdminState(context, true)
        val policyService = DevicePolicyService(context)
        if (policyService.isManagedDevice()) {
            policyService.applyPolicyRestrictions()
        }
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.w(TAG, "Device Admin Disabled for Installment Guard")
        saveAdminState(context, false)
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i(TAG, "Profile / Device Provisioning Complete")
        saveAdminState(context, true)
        
        // Enforce standard security policies immediately after provisioning
        val policyService = DevicePolicyService(context)
        policyService.applyPolicyRestrictions()
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.i(TAG, "Lock Task Mode Entered for package: $pkg")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.i(TAG, "Lock Task Mode Exited")
    }

    private fun saveAdminState(context: Context, isEnabled: Boolean) {
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("is_admin_active", isEnabled).apply()
    }
}
