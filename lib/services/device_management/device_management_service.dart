import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_constants.dart';
import '../backend/nodejs_backend_service.dart';
import '../security/environment_config.dart';

class DeviceManagementResult<T> {
  final bool isSuccess;
  final T? data;
  final String? errorMessage;
  final String? errorCode;

  DeviceManagementResult.success(this.data)
      : isSuccess = true,
        errorMessage = null,
        errorCode = null;

  DeviceManagementResult.failure(this.errorMessage, {this.errorCode})
      : isSuccess = false,
        data = null;
}

class DeviceManagementService {
  static const MethodChannel _channel = MethodChannel(AppConstants.methodChannelName);

  Future<DeviceManagementResult<String>> getEnrollmentStatus() async {
    try {
      final String? status = await _channel.invokeMethod<String>('getEnrollmentStatus');
      return DeviceManagementResult.success(status ?? AppConstants.enrollmentNotEnrolled);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Platform error: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Failed to fetch enrollment status: $e');
    }
  }

  Future<DeviceManagementResult<bool>> isManagedDevice() async {
    try {
      final bool? isManaged = await _channel.invokeMethod<bool>('isManagedDevice');
      return DeviceManagementResult.success(isManaged ?? false);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Platform error: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Failed to check managed device status: $e');
    }
  }

  Future<DeviceManagementResult<bool>> isDeviceOwner() async {
    try {
      final bool? isOwner = await _channel.invokeMethod<bool>('isDeviceOwner');
      return DeviceManagementResult.success(isOwner ?? false);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Platform error: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Failed to check device owner status: $e');
    }
  }

  Future<DeviceManagementResult<String>> getDeviceStatus() async {
    try {
      final String? status = await _channel.invokeMethod<String>('getDeviceStatus');
      return DeviceManagementResult.success(status ?? AppConstants.statusActive);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Platform error: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Failed to fetch device status: $e');
    }
  }

  Future<DeviceManagementResult<Map<String, dynamic>>> getDeviceInformation() async {
    try {
      final Map<dynamic, dynamic>? info = await _channel.invokeMethod<Map<dynamic, dynamic>>('getDeviceInformation');
      final Map<String, dynamic> converted = info != null ? Map<String, dynamic>.from(info) : {};
      return DeviceManagementResult.success(converted);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Platform error: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Failed to fetch device information: $e');
    }
  }

  Future<DeviceManagementResult<Map<String, dynamic>>> requestEnrollment(String contractId) async {
    try {
      final Map<dynamic, dynamic>? result = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'requestEnrollment',
        {'contractId': contractId},
      );
      final Map<String, dynamic> converted = result != null ? Map<String, dynamic>.from(result) : {};
      return DeviceManagementResult.success(converted);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Enrollment failed: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Unexpected enrollment failure: $e');
    }
  }

  static final ValueNotifier<bool> restrictionNotifier = ValueNotifier<bool>(false);

  Future<DeviceManagementResult<bool>> applyRestriction() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('applyRestriction');
      restrictionNotifier.value = true;
      return DeviceManagementResult.success(success ?? false);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Failed to apply restriction: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Unexpected restriction failure: $e');
    }
  }

  Future<DeviceManagementResult<bool>> removeRestriction() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('removeRestriction');
      restrictionNotifier.value = false;
      return DeviceManagementResult.success(success ?? false);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Failed to remove restriction: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Unexpected restriction removal failure: $e');
    }
  }

  Future<DeviceManagementResult<bool>> hideApplicationLauncher({bool hide = true}) async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('hideApplicationLauncher', {'hide': hide});
      return DeviceManagementResult.success(success ?? false);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Failed to toggle launcher visibility: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Unexpected launcher toggle failure: $e');
    }
  }

  Future<DeviceManagementResult<Map<String, dynamic>>> syncDeviceStatus() async {
    try {
      final Map<dynamic, dynamic>? syncResult = await _channel.invokeMethod<Map<dynamic, dynamic>>('syncDeviceStatus');
      final Map<String, dynamic> converted = syncResult != null ? Map<String, dynamic>.from(syncResult) : {};
      
      // Transmit live hardware telemetry to Node.js backend
      final Map<String, dynamic> info = Map<String, dynamic>.from(converted['deviceInfo'] ?? {});
      final String deviceId = info['deviceId']?.toString() ?? 'UNKNOWN_DEVICE';
      if (info.isNotEmpty) {
        await NodeJsBackendService().recordHeartbeat(deviceId, info);
      }
      
      return DeviceManagementResult.success(converted);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Sync failed: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Sync failed: $e');
    }
  }

  Future<void> syncEnvironmentMode() async {
    try {
      await _channel.invokeMethod('setEnvironmentMode', {
        'mode': EnvironmentConfig.environmentName,
      });
    } catch (_) {}
  }

  Future<DeviceManagementResult<bool>> validateUnlockPin(String pin) async {
    try {
      final bool? isValid = await _channel.invokeMethod<bool>('validateUnlockPin', {'pin': pin});
      return DeviceManagementResult.success(isValid ?? false);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Failed to validate PIN: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Unexpected PIN validation failure: $e');
    }
  }

  Future<DeviceManagementResult<bool>> wipeDevice({bool wipeData = false}) async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('wipeDevice', {'wipeData': wipeData});
      return DeviceManagementResult.success(success ?? false);
    } on PlatformException catch (e) {
      return DeviceManagementResult.failure('Wipe failed: ${e.message}', errorCode: e.code);
    } catch (e) {
      return DeviceManagementResult.failure('Unexpected wipe failure: $e');
    }
  }
}

