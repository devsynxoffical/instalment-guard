package com.example.installment_guard

import android.content.Context
import android.util.Log
import androidx.annotation.NonNull
import com.example.installment_guard.device.DeviceManagementChannelHandler
import com.example.installment_guard.device.DevicePolicyService
import com.example.installment_guard.device.InstallmentAdminReceiver
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        requestLocationPermissionsIfNeeded()

        val channelHandler = DeviceManagementChannelHandler(this)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            DeviceManagementChannelHandler.CHANNEL_NAME
        ).setMethodCallHandler(channelHandler)
    }

    private fun requestLocationPermissionsIfNeeded() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                try {
                    requestPermissions(
                        arrayOf(
                            android.Manifest.permission.ACCESS_FINE_LOCATION,
                            android.Manifest.permission.ACCESS_COARSE_LOCATION
                        ),
                        1001
                    )
                } catch (e: Exception) {
                    Log.w("MainActivity", "Failed requesting location permissions: ${e.message}")
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        enforceLockStateIfNeeded()
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        enforceLockStateIfNeeded()
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        val policyService = DevicePolicyService(this, this)
        if (policyService.isDeviceRestricted() && !policyService.isManagedDevice()) {
            try {
                val intent = android.content.Intent(this, MainActivity::class.java).apply {
                    addFlags(
                        android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
                        android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    )
                }
                startActivity(intent)
            } catch (e: Exception) {
                Log.e("MainActivity", "Failed to re-bring to front on user leave: ${e.message}")
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val policyService = DevicePolicyService(this, this)
        if (policyService.isDeviceRestricted()) {
            // Block back button completely when restricted
            return
        }
        @Suppress("DEPRECATION")
        super.onBackPressed()
    }

    private fun isAlreadyLocked(): Boolean {
        return try {
            val am = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                am.lockTaskModeState != android.app.ActivityManager.LOCK_TASK_MODE_NONE
            } else {
                @Suppress("DEPRECATION")
                am.isInLockTaskMode
            }
        } catch (e: Exception) {
            false
        }
    }

    private fun enforceLockStateIfNeeded() {
        try {
            val policyService = DevicePolicyService(this, this)
            if (policyService.isDeviceRestricted()) {
                val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
                val adminComponent = InstallmentAdminReceiver.getComponentName(this)

                // Enforce fullscreen & keep screen on flags
                window.addFlags(
                    android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                    android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                    android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN
                )

                if (!isAlreadyLocked()) {
                    if (policyService.isManagedDevice()) {
                        try {
                            dpm.setLockTaskPackages(adminComponent, arrayOf(packageName))
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                                dpm.setLockTaskFeatures(adminComponent, android.app.admin.DevicePolicyManager.LOCK_TASK_FEATURE_NONE)
                            }
                            startLockTask()
                            Log.i("MainActivity", "Silent LockTask enforced via Device Owner.")
                        } catch (e: Exception) {
                            Log.w("MainActivity", "Failed setting DPM lock task packages/features: ${e.message}")
                        }
                    } else {
                        try {
                            startLockTask()
                            Log.i("MainActivity", "Standard LockTask requested for non-managed device.")
                        } catch (e: Exception) {
                            Log.w("MainActivity", "Failed to start standard lock task: ${e.message}")
                        }
                    }
                }
            } else {
                window.clearFlags(
                    android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                    android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                    android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN
                )
                if (isAlreadyLocked()) {
                    try {
                        stopLockTask()
                    } catch (e: Exception) {
                        Log.w("MainActivity", "stopLockTask ignored or not locked: ${e.message}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error in enforceLockStateIfNeeded: ${e.message}")
        }
    }
}
