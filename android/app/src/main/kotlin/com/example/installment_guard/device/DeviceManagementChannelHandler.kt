package com.example.installment_guard.device

import android.app.Activity
import android.content.Context
import android.util.Log
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class DeviceManagementChannelHandler(private val activity: Activity) : MethodChannel.MethodCallHandler {

    companion object {
        const val CHANNEL_NAME = "installment_guard/device_management"
        private const val TAG = "DeviceMgmtChannel"
    }

    private val context: Context = activity.applicationContext
    private val policyService = DevicePolicyService(context, activity)

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        Log.d(TAG, "MethodChannel call received: ${call.method}")

        try {
            when (call.method) {
                "getEnrollmentStatus" -> {
                    val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
                    val status = prefs.getString("enrollment_status", "NOT_ENROLLED") ?: "NOT_ENROLLED"
                    result.success(status)
                }
                "isManagedDevice" -> {
                    result.success(policyService.isManagedDevice())
                }
                "isDeviceOwner" -> {
                    result.success(policyService.isDeviceOwner())
                }
                "getDeviceStatus" -> {
                    val status = if (policyService.isDeviceRestricted()) "RESTRICTED" else "ACTIVE"
                    result.success(status)
                }
                "getDeviceInformation" -> {
                    val info = policyService.getDeviceInformation()
                    result.success(info)
                }
                "requestEnrollment" -> {
                    val contractId = call.argument<String>("contractId")
                    val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
                    
                    if (policyService.isManagedDevice()) {
                        policyService.applyPolicyRestrictions()
                        prefs.edit()
                            .putString("enrollment_status", "COMPLETED")
                            .putString("contract_id", contractId ?: "")
                            .apply()
                        result.success(mapOf("success" to true, "status" to "COMPLETED"))
                    } else {
                        prefs.edit()
                            .putString("enrollment_status", "ENROLLING")
                            .putString("contract_id", contractId ?: "")
                            .apply()
                        result.success(mapOf("success" to true, "status" to "ENROLLING", "isManaged" to false))
                    }
                }
                "getManagementStatus" -> {
                    val statusMap = mapOf(
                        "isManaged" to policyService.isManagedDevice(),
                        "isDeviceOwner" to policyService.isDeviceOwner(),
                        "isRestricted" to policyService.isDeviceRestricted(),
                        "adminComponent" to InstallmentAdminReceiver.getComponentName(context).flattenToString()
                    )
                    result.success(statusMap)
                }
                "hideApplicationLauncher" -> {
                    val hide = call.argument<Boolean>("hide") ?: true
                    val success = policyService.hideApplicationLauncher(hide)
                    result.success(success)
                }
                "applyRestriction" -> {
                    val success = policyService.applyDeviceRestriction(true)
                    result.success(success)
                }
                "removeRestriction" -> {
                    val success = policyService.applyDeviceRestriction(false)
                    result.success(success)
                }
                "moveTaskToBack" -> {
                    activity.moveTaskToBack(true)
                    result.success(true)
                }
                "syncDeviceStatus" -> {
                    val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
                    val lastCheckIn = prefs.getLong("last_check_in_timestamp", 0L)
                    val response = mapOf(
                        "success" to true,
                        "lastCheckIn" to lastCheckIn,
                        "deviceInfo" to policyService.getDeviceInformation()
                    )
                    result.success(response)
                }
                "setEnvironmentMode" -> {
                    val mode = call.argument<String>("mode") ?: "PRODUCTION"
                    val prefs = context.getSharedPreferences("installment_guard_admin_prefs", Context.MODE_PRIVATE)
                    prefs.edit().putString("environment_mode", mode).apply()
                    result.success(true)
                }
                "setUnlockPin" -> {
                    val pin = call.argument<String>("pin") ?: "0000"
                    policyService.saveUnlockPin(pin)
                    result.success(true)
                }
                "validateUnlockPin" -> {
                    val inputPin = call.argument<String>("pin") ?: ""
                    val isValid = policyService.validateUnlockPin(inputPin)
                    if (isValid) {
                        policyService.applyDeviceRestriction(false)
                    }
                    result.success(isValid)
                }
                "wipeDevice", "uninstallMDM" -> {
                    val wipeData = call.argument<Boolean>("wipeData") ?: false
                    val success = policyService.wipeOrUninstallDevice(wipeData)
                    result.success(success)
                }
                else -> {
                    result.notImplemented()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in MethodChannel handler: ${e.message}", e)
            result.error("DEVICE_MANAGEMENT_ERROR", e.message, null)
        }
    }
}
