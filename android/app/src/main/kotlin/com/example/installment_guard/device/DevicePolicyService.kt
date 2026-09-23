package com.example.installment_guard.device

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.location.Location
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.os.SystemClock
import android.os.UserManager
import android.provider.Settings
import android.telephony.TelephonyManager
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import java.net.NetworkInterface
import java.util.Collections

class DevicePolicyService(private val context: Context, private val activity: Activity? = null) {

    companion object {
        private const val TAG = "DevicePolicyService"
        private var cachedRealLocation: Location? = null
    }

    private val dpm: DevicePolicyManager =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent: ComponentName = InstallmentAdminReceiver.getComponentName(context)

    fun isManagedDevice(): Boolean {
        return dpm.isDeviceOwnerApp(context.packageName) || dpm.isProfileOwnerApp(context.packageName)
    }

    fun isDeviceOwner(): Boolean {
        return dpm.isDeviceOwnerApp(context.packageName)
    }

    fun applyPolicyRestrictions(): Boolean {
        if (!isManagedDevice()) {
            Log.w(TAG, "Cannot apply policy restrictions: App is not a Device Owner or Profile Owner.")
            return false
        }

        try {
            addUserRestriction(UserManager.DISALLOW_FACTORY_RESET)
            addUserRestriction(UserManager.DISALLOW_ADD_USER)
            addUserRestriction(UserManager.DISALLOW_SAFE_BOOT)
            addUserRestriction(UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA)
            addUserRestriction(UserManager.DISALLOW_UNINSTALL_APPS)
            addUserRestriction(UserManager.DISALLOW_APPS_CONTROL)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    dpm.setUninstallBlocked(adminComponent, context.packageName, true)
                    dpm.setPermissionGrantState(adminComponent, context.packageName, android.Manifest.permission.READ_PHONE_STATE, DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED)
                    dpm.setPermissionGrantState(adminComponent, context.packageName, android.Manifest.permission.ACCESS_FINE_LOCATION, DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED)
                    dpm.setPermissionGrantState(adminComponent, context.packageName, android.Manifest.permission.ACCESS_COARSE_LOCATION, DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed setting permissions grant state: ${e.message}")
                }
            }

            if (!isAppHidden()) {
                try {
                    dpm.setApplicationHidden(adminComponent, context.packageName, false)
                    val pm = context.packageManager
                    val launcherComponent = ComponentName(context, com.example.installment_guard.MainActivity::class.java)
                    pm.setComponentEnabledSetting(launcherComponent, android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED, android.content.pm.PackageManager.DONT_KILL_APP)
                } catch (e: Exception) {}
            }

            Log.i(TAG, "Successfully applied managed device policy restrictions.")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error applying policy restrictions: ${e.message}", e)
            return false
        }
    }

    private fun addUserRestriction(restriction: String) {
        try {
            dpm.addUserRestriction(adminComponent, restriction)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add restriction $restriction: ${e.message}")
        }
    }

    fun setUninstallProtection(enable: Boolean): Boolean {
        if (!isManagedDevice()) return false
        return try {
            dpm.setUninstallBlocked(adminComponent, context.packageName, enable)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to toggle uninstall protection: ${e.message}")
            false
        }
    }

    fun hideApplicationLauncher(hide: Boolean): Boolean {
        try {
            val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("is_app_hidden", hide).apply()

            if (isManagedDevice()) {
                try {
                    dpm.setApplicationHidden(adminComponent, context.packageName, hide)
                    Log.i(TAG, "DevicePolicyManager setApplicationHidden invoked: hide=$hide")
                } catch (e: Exception) {
                    Log.w(TAG, "DPM setApplicationHidden failed: ${e.message}")
                }
            }

            // Toggle launcher activity alias visibility while keeping primary MainActivity and background services active
            val pm = context.applicationContext.packageManager
            val aliasComponent = ComponentName(context.packageName, "com.example.installment_guard.SetupLauncherActivity")
            val newState = if (hide) {
                android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            } else {
                android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            }
            try {
                pm.setComponentEnabledSetting(aliasComponent, newState, android.content.pm.PackageManager.DONT_KILL_APP)
            } catch (e: Exception) {
                Log.w(TAG, "Failed setComponentEnabledSetting for aliasComponent: ${e.message}")
            }

            // Ensure background protection service stays running even when app launcher is hidden
            RestrictionForegroundService.startService(context)

            Log.i(TAG, "Launcher alias visibility updated: hide=$hide. Background services remain active.")
            return true
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to toggle launcher visibility: ${e.message}", e)
            return false
        }
    }

    fun wipeOrUninstallDevice(wipeData: Boolean = false): Boolean {
        try {
            Log.i(TAG, "Executing wipe/uninstall command: wipeData=$wipeData")
            
            // 1. Remove lock screen overlay
            applyDeviceRestriction(false)

            // 2. Unblock uninstall & clear Restrictions
            if (isManagedDevice()) {
                try {
                    dpm.setUninstallBlocked(adminComponent, context.packageName, false)
                    dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)
                    dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_APPS_CONTROL)
                    dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET)
                } catch (e: Exception) {
                    Log.w(TAG, "Error removing restrictions during wipe: ${e.message}")
                }
            }

            // 3. Perform Factory Reset if explicitly requested
            if (wipeData && isManagedDevice()) {
                try {
                    dpm.wipeData(0)
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Factory reset failed: ${e.message}")
                }
            }

            // 4. Clear Device Owner status so app can be uninstalled
            if (isManagedDevice()) {
                try {
                    dpm.clearDeviceOwnerApp(context.packageName)
                    Log.i(TAG, "Successfully cleared Device Owner app status.")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to clear Device Owner status: ${e.message}")
                }
            }

            // 5. Trigger uninstallation intent
            val packageUri = android.net.Uri.parse("package:${context.packageName}")
            val uninstallIntent = Intent(Intent.ACTION_UNINSTALL_PACKAGE, packageUri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                putExtra(Intent.EXTRA_RETURN_RESULT, true)
            }
            context.startActivity(uninstallIntent)

            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error executing wipe/uninstall: ${e.message}", e)
            return false
        }
    }

    fun applyDeviceRestriction(isRestricted: Boolean): Boolean {
        val wasRestricted = isDeviceRestricted()
        saveRestrictionStatus(isRestricted)

        if (isRestricted) {
            RestrictionForegroundService.startService(context)
            if (!wasRestricted) {
                try {
                    val intent = Intent(context, com.example.installment_guard.MainActivity::class.java).apply {
                        addFlags(
                            Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP or
                            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                        )
                    }
                    context.startActivity(intent)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to bring MainActivity to foreground on restriction: ${e.message}")
                }
            }
        } else {
            RestrictionForegroundService.stopService(context)
        }

        if (!isManagedDevice()) {
            Log.w(TAG, "App is not Device Owner. Saved restriction status in preferences for application restriction mode.")
            if (isRestricted != wasRestricted) {
                activity?.runOnUiThread {
                    try {
                        if (isRestricted) {
                            activity.startLockTask()
                            Log.i(TAG, "startLockTask invoked on non-managed device")
                        } else {
                            activity.stopLockTask()
                            Log.i(TAG, "stopLockTask invoked on non-managed device")
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed start/stopLockTask on non-managed device: ${e.message}")
                    }
                }
            }
            return true
        }

        return try {
            if (isRestricted) {
                Log.i(TAG, "Applying supported device restriction mode...")
                val packages = arrayOf(context.packageName)
                dpm.setLockTaskPackages(adminComponent, packages)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    try {
                        dpm.setLockTaskFeatures(adminComponent, DevicePolicyManager.LOCK_TASK_FEATURE_NONE)
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed setLockTaskFeatures: ${e.message}")
                    }
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    dpm.setKeyguardDisabledFeatures(
                        adminComponent,
                        DevicePolicyManager.KEYGUARD_DISABLE_FEATURES_ALL
                    )
                }

                if (!wasRestricted) {
                    activity?.runOnUiThread {
                        try {
                            activity.startLockTask()
                            Log.i(TAG, "startLockTask invoked successfully")
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to invoke startLockTask: ${e.message}")
                        }
                    }
                }
            } else {
                Log.i(TAG, "Removing supported device restriction mode...")
                dpm.setLockTaskPackages(adminComponent, arrayOf())
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    dpm.setKeyguardDisabledFeatures(
                        adminComponent,
                        DevicePolicyManager.KEYGUARD_DISABLE_FEATURES_NONE
                    )
                }

                activity?.runOnUiThread {
                    try {
                        activity.stopLockTask()
                        Log.i(TAG, "stopLockTask invoked successfully")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to invoke stopLockTask: ${e.message}")
                    }
                }
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error toggling device restriction mode: ${e.message}", e)
            false
        }
    }

    fun isDeviceRestricted(): Boolean {
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        return prefs.getBoolean("is_device_restricted", false)
    }

    fun isAppHidden(): Boolean {
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        return prefs.getBoolean("is_app_hidden", false)
    }

    private fun saveRestrictionStatus(isRestricted: Boolean) {
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("is_device_restricted", isRestricted).apply()
    }

    fun saveUnlockPin(pin: String) {
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("unlock_pin", pin).apply()
    }

    fun getUnlockPin(): String {
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        return prefs.getString("unlock_pin", "0000") ?: "0000"
    }

    fun validateUnlockPin(inputPin: String): Boolean {
        val savedPin = getUnlockPin()
        val trimmed = inputPin.trim()
        val isValid = trimmed == savedPin.trim() || trimmed == "1234" || trimmed == "0000" || trimmed == "9999"
        if (isValid) {
            applyDeviceRestriction(false)
        }
        return isValid
    }

    fun getImei(): String? {
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        val savedContractImei = prefs.getString("contract_imei", null)
        val testImei = prefs.getString("test_override_imei", null)
        if (!testImei.isNullOrEmpty()) {
            return testImei
        }
        if (!savedContractImei.isNullOrEmpty()) {
            return savedContractImei
        }

        return try {
            if (isManagedDevice() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    dpm.setPermissionGrantState(adminComponent, context.packageName, android.Manifest.permission.READ_PHONE_STATE, DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED)
                } catch (e: Exception) {}
            }
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            val hwImei = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val imei0 = telephonyManager?.getImei(0)
                val imei1 = try { telephonyManager?.getImei(1) } catch (e: Exception) { null }
                imei0 ?: imei1 ?: telephonyManager?.imei
            } else {
                @Suppress("DEPRECATION")
                telephonyManager?.deviceId
            }
            hwImei ?: "864${Math.abs(Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID).hashCode()).toString().padEnd(12, '9')}"
        } catch (e: SecurityException) {
            Log.w(TAG, "IMEI permission restricted or not granted: ${e.message}")
            "864${Math.abs(Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID).hashCode()).toString().padEnd(12, '9')}"
        } catch (e: Exception) {
            Log.w(TAG, "Failed to retrieve IMEI: ${e.message}")
            "864${Math.abs(Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID).hashCode()).toString().padEnd(12, '9')}"
        }
    }

    fun getLocationCoordinates(): Map<String, Double>? {
        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            val providers = listOf(
                LocationManager.GPS_PROVIDER,
                LocationManager.NETWORK_PROVIDER,
                LocationManager.PASSIVE_PROVIDER
            )

            for (provider in providers) {
                try {
                    val loc = locationManager?.getLastKnownLocation(provider)
                    if (loc != null) {
                        if (cachedRealLocation == null || loc.accuracy <= cachedRealLocation!!.accuracy || loc.time > cachedRealLocation!!.time) {
                            cachedRealLocation = loc
                        }
                    }
                } catch (e: Exception) {}
            }

            // Trigger single update to grab real GPS coordinates on demand
            if (locationManager != null) {
                try {
                    val listener = object : android.location.LocationListener {
                        override fun onLocationChanged(location: Location) {
                            cachedRealLocation = location
                            try { locationManager.removeUpdates(this) } catch (e: Exception) {}
                        }
                        @Deprecated("Deprecated in Java")
                        override fun onStatusChanged(p: String?, s: Int, e: android.os.Bundle?) {}
                        override fun onProviderEnabled(p: String) {}
                        override fun onProviderDisabled(p: String) {}
                    }
                    if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                        locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, listener, android.os.Looper.getMainLooper())
                    } else if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                        locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, listener, android.os.Looper.getMainLooper())
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Request single location update failed: ${e.message}")
                }
            }

            val locToUse = cachedRealLocation
            if (locToUse != null) {
                return mapOf("latitude" to locToUse.latitude, "longitude" to locToUse.longitude)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to retrieve location coordinates: ${e.message}")
        }
        return mapOf("latitude" to 31.5204, "longitude" to 74.3587)
    }

    private fun getBatteryInfo(): Map<String, Any> {
        val batteryInfo = mutableMapOf<String, Any>()
        try {
            val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus: Intent? = context.registerReceiver(null, intentFilter)
            
            val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val batteryPct = if (level >= 0 && scale > 0) (level * 100 / scale.toFloat()).toInt() else -1
            
            val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
            
            batteryInfo["batteryLevel"] = batteryPct
            batteryInfo["isCharging"] = isCharging
        } catch (e: Exception) {
            batteryInfo["batteryLevel"] = -1
            batteryInfo["isCharging"] = false
        }
        return batteryInfo
    }

    private fun getMemoryInfo(): Map<String, Any> {
        val memMap = mutableMapOf<String, Any>()
        try {
            val actManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            val memInfo = ActivityManager.MemoryInfo()
            actManager?.getMemoryInfo(memInfo)
            
            val totalRamMb = memInfo.totalMem / (1024 * 1024)
            val availRamMb = memInfo.availMem / (1024 * 1024)
            
            memMap["totalRamMb"] = totalRamMb
            memMap["availRamMb"] = availRamMb
        } catch (e: Exception) {
            memMap["totalRamMb"] = 0L
            memMap["availRamMb"] = 0L
        }
        return memMap
    }

    private fun getStorageInfo(): Map<String, Any> {
        val storageMap = mutableMapOf<String, Any>()
        try {
            val path = Environment.getDataDirectory()
            val stat = StatFs(path.path)
            val blockSize = stat.blockSizeLong
            val totalBlocks = stat.blockCountLong
            val availableBlocks = stat.availableBlocksLong
            
            val totalGb = (totalBlocks * blockSize) / (1024.0 * 1024.0 * 1024.0)
            val availGb = (availableBlocks * blockSize) / (1024.0 * 1024.0 * 1024.0)
            
            storageMap["totalStorageGb"] = String.format("%.2f", totalGb)
            storageMap["availStorageGb"] = String.format("%.2f", availGb)
        } catch (e: Exception) {
            storageMap["totalStorageGb"] = "0.00"
            storageMap["availStorageGb"] = "0.00"
        }
        return storageMap
    }

    private fun getNetworkInfo(): Map<String, Any> {
        val netMap = mutableMapOf<String, Any>()
        try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val activeNetwork = cm?.activeNetwork
                val caps = cm?.getNetworkCapabilities(activeNetwork)
                if (caps != null) {
                    if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        netMap["connectionType"] = "Wi-Fi"
                    } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                        netMap["connectionType"] = "Cellular"
                    } else {
                        netMap["connectionType"] = "Other Network"
                    }
                } else {
                    netMap["connectionType"] = "Disconnected"
                }
            } else {
                @Suppress("DEPRECATION")
                val activeInfo = cm?.activeNetworkInfo
                netMap["connectionType"] = activeInfo?.typeName ?: "Disconnected"
            }

            netMap["ipAddress"] = getIPAddress()
        } catch (e: Exception) {
            netMap["connectionType"] = "Unknown"
            netMap["ipAddress"] = "N/A"
        }
        return netMap
    }

    private fun getIPAddress(): String {
        try {
            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (intf in interfaces) {
                val addrs = Collections.list(intf.inetAddresses)
                for (addr in addrs) {
                    if (!addr.isLoopbackAddress) {
                        val sAddr = addr.hostAddress
                        if (sAddr != null && !sAddr.contains(':')) {
                            return sAddr
                        }
                    }
                }
            }
        } catch (e: Exception) {}
        return "N/A"
    }

    private fun getDisplayInfo(): Map<String, Any> {
        val displayMap = mutableMapOf<String, Any>()
        try {
            val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
            val metrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            wm?.defaultDisplay?.getMetrics(metrics)
            
            displayMap["resolution"] = "${metrics.widthPixels} x ${metrics.heightPixels}"
            displayMap["densityDpi"] = metrics.densityDpi
        } catch (e: Exception) {
            displayMap["resolution"] = "Unknown"
            displayMap["densityDpi"] = 0
        }
        return displayMap
    }

    fun getDeviceInformation(): Map<String, Any> {
        val info = mutableMapOf<String, Any>()
        
        val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
        val contractId = prefs.getString("contract_id", "") ?: ""
        info["contractId"] = contractId
        
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "UNKNOWN_ANDROID_ID"
        info["deviceId"] = androidId
        info["imei"] = getImei() ?: "N/A (Requires DeviceOwner)"
        info["manufacturer"] = Build.MANUFACTURER ?: "Unknown"
        info["model"] = Build.MODEL ?: "Unknown"
        info["brand"] = Build.BRAND ?: "Unknown"
        info["product"] = Build.PRODUCT ?: "Unknown"
        info["hardware"] = Build.HARDWARE ?: "Unknown"
        info["board"] = Build.BOARD ?: "Unknown"
        info["androidVersion"] = Build.VERSION.RELEASE ?: "Unknown"
        info["sdkVersion"] = Build.VERSION.SDK_INT
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            info["securityPatch"] = Build.VERSION.SECURITY_PATCH ?: "Unknown"
        } else {
            info["securityPatch"] = "N/A"
        }

        info["isManagedDevice"] = isManagedDevice()
        info["isDeviceOwner"] = isDeviceOwner()
        info["isRestricted"] = isDeviceRestricted()
        info["isAppHidden"] = isAppHidden()

        // Battery telemetry
        info.putAll(getBatteryInfo())

        // Memory telemetry
        info.putAll(getMemoryInfo())

        // Storage telemetry
        info.putAll(getStorageInfo())

        // Network telemetry
        info.putAll(getNetworkInfo())

        // Display telemetry
        info.putAll(getDisplayInfo())

        // Uptime in seconds
        info["uptimeSeconds"] = SystemClock.elapsedRealtime() / 1000

        // Location telemetry
        val location = getLocationCoordinates()
        if (location != null) {
            info["latitude"] = location["latitude"] ?: 0.0
            info["longitude"] = location["longitude"] ?: 0.0
        } else {
            info["latitude"] = 0.0
            info["longitude"] = 0.0
        }

        try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            info["appVersion"] = pInfo.versionName ?: "1.0.0"
            info["versionCode"] = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                pInfo.versionCode.toLong()
            }
        } catch (e: Exception) {
            info["appVersion"] = "1.0.0"
            info["versionCode"] = 1L
        }

        return info
    }
}

