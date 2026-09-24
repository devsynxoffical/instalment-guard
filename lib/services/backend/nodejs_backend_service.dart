import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../../models/device_record.dart';
import '../../models/contract.dart';
import '../../models/admin_command.dart';
import '../device_management/device_management_service.dart';
import 'backend_service.dart';
export 'backend_service.dart';

class NodeJsBackendService implements BackendService {
  static final NodeJsBackendService _instance = NodeJsBackendService._internal();
  factory NodeJsBackendService() => _instance;
  NodeJsBackendService._internal();

  // Production Railway Backend URL as primary default
  String _baseUrl = 'https://instalment-guard-production-8ff6.up.railway.app/api';
  final DeviceManagementService _deviceService = DeviceManagementService();

  void setBaseUrl(String url) {
    _baseUrl = url.endsWith('/api') ? url : '$url/api';
  }

  Future<List<String>> _getBaseUrlsToTry() async {
    final prefs = await SharedPreferences.getInstance();
    final custom = prefs.getString('custom_server_ip');
    final urls = <String>[];
    if (custom != null && custom.isNotEmpty) {
      urls.add(custom.endsWith('/api') ? custom : '$custom/api');
    }
    urls.add(_baseUrl);
    urls.add('https://instalment-guard-production-8ff6.up.railway.app/api');
    urls.add('http://10.10.20.33:5000/api');
    urls.add('http://10.0.2.2:5000/api');
    urls.add('http://127.0.0.1:5000/api');
    urls.add('http://localhost:5000/api');
    return urls.toSet().toList();
  }

  Future<dynamic> _httpGet(String path) async {
    final urls = await _getBaseUrlsToTry();
    for (var activeUrl in urls) {
      try {
        final client = HttpClient();
        client.connectionTimeout = const Duration(seconds: 3);
        final request = await client.getUrl(Uri.parse('$activeUrl$path'));
        final response = await request.close();
        if (response.statusCode == 200) {
          final contents = await response.transform(utf8.decoder).join();
          return jsonDecode(contents);
        }
      } catch (_) {}
    }
    return null;
  }

  Future<dynamic> _httpPost(String path, Map<String, dynamic> body) async {
    final urls = await _getBaseUrlsToTry();
    for (var activeUrl in urls) {
      try {
        final client = HttpClient();
        client.connectionTimeout = const Duration(seconds: 3);
        final request = await client.postUrl(Uri.parse('$activeUrl$path'));
        request.headers.set('content-type', 'application/json');
        request.add(utf8.encode(jsonEncode(body)));
        final response = await request.close();
        if (response.statusCode == 200 || response.statusCode == 201) {
          final contents = await response.transform(utf8.decoder).join();
          return jsonDecode(contents);
        }
      } catch (_) {}
    }
    return null;
  }

  @override
  Future<bool> registerDevice(DeviceRecord device) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyDeviceId, device.deviceId);
    await prefs.setString(AppConstants.keyContractId, device.contractId);
    await prefs.setString(AppConstants.keyDeviceStatus, device.deviceStatus);

    final savedRetailerId = prefs.getString('saved_retailer_id') ?? (device.retailerId.isNotEmpty ? device.retailerId : null);

    final payload = {
      'deviceId': device.deviceId,
      if (savedRetailerId != null && savedRetailerId.isNotEmpty) 'retailerId': savedRetailerId,
      'enrollmentData': {
        'customerName': device.customerId.isNotEmpty ? device.customerId : 'Customer',
        'customerPhone': '',
        'manufacturer': device.manufacturer,
        'model': device.model,
        'imei': device.imei,
        'totalPrice': 0,
        'downPayment': 0,
        'monthlyInstallment': 0,
      }
    };

    final result = await _httpPost('/devices/enroll', payload);
    return result != null && result['success'] == true;
  }

  @override
  Future<DeviceRecord?> getDeviceRecord(String deviceId) async {
    final prefs = await SharedPreferences.getInstance();
    String searchId = deviceId;
    if (searchId.isEmpty) {
      searchId = prefs.getString(AppConstants.keyDeviceId) ?? '';
    }
    if (searchId.isEmpty) {
      final infoResult = await _deviceService.getDeviceInformation();
      searchId = infoResult.data?['deviceId']?.toString() ?? '';
    }

    if (searchId.isNotEmpty) {
      final json = await _httpGet('/devices/$searchId');
      if (json != null && json['success'] == true && json['data'] != null) {
        return DeviceRecord.fromJson(json['data']);
      }
    }

    final listJson = await _httpGet('/devices');
    if (listJson != null && listJson['success'] == true && listJson['data'] is List) {
      final list = listJson['data'] as List;
      if (list.isNotEmpty) {
        return DeviceRecord.fromJson(list.first);
      }
    }

    // Generate live record directly from native Android device hardware info
    final infoResult = await _deviceService.getDeviceInformation();
    final info = infoResult.data ?? {};
    final liveDeviceId = info['deviceId']?.toString() ?? (searchId.isNotEmpty ? searchId : 'DEV-${info['model']?.toString().toUpperCase() ?? 'ANDROID'}');
    final String liveImei = info['imei']?.toString() ?? prefs.getString('saved_imei') ?? '';

    return DeviceRecord(
      deviceId: liveDeviceId,
      contractId: prefs.getString(AppConstants.keyContractId) ?? 'CTR-PENDING',
      customerId: prefs.getString('saved_customer_name') ?? 'ENROLLED_CUSTOMER',
      imei: liveImei,
      latitude: (info['latitude'] as num?)?.toDouble(),
      longitude: (info['longitude'] as num?)?.toDouble(),
      manufacturer: info['manufacturer']?.toString() ?? 'Android',
      model: info['model']?.toString() ?? 'Mobile Device',
      androidVersion: info['androidVersion']?.toString() ?? '14.0',
      sdkVersion: (info['sdkVersion'] as num?)?.toInt() ?? 34,
      appVersion: info['appVersion']?.toString() ?? '1.0.0',
      enrollmentStatus: info['isManagedDevice'] == true ? AppConstants.enrollmentCompleted : AppConstants.enrollmentNotEnrolled,
      managementStatus: info['isManagedDevice'] == true ? 'MANAGED' : 'UNMANAGED',
      deviceStatus: info['isRestricted'] == true ? AppConstants.statusRestricted : AppConstants.statusActive,
      lastCheckIn: DateTime.now(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  @override
  Future<InstallmentContract?> getContract(String contractId) async {
    final json = await _httpGet('/contracts');
    if (json != null && json['success'] == true && json['data'] is List) {
      final list = json['data'] as List;
      for (var item in list) {
        if (item['contractId'] == contractId) {
          return InstallmentContract.fromJson(item);
        }
      }
    }

    final prefs = await SharedPreferences.getInstance();
    final String targetContractId = contractId.isNotEmpty ? contractId : (prefs.getString(AppConstants.keyContractId) ?? 'CTR-LIVE');

    return InstallmentContract(
      contractId: targetContractId,
      customerId: prefs.getString('saved_customer_name') ?? 'CUSTOMER',
      deviceId: prefs.getString(AppConstants.keyDeviceId) ?? '',
      totalPrice: (prefs.getDouble('saved_total_price') ?? 0.0),
      downPayment: (prefs.getDouble('saved_down_payment') ?? 0.0),
      remainingBalance: (prefs.getDouble('saved_remaining_balance') ?? 0.0),
      monthlyInstallment: (prefs.getDouble('saved_monthly_installment') ?? 0.0),
      nextDueDate: prefs.getString('saved_next_due_date') ?? '10th of Month',
      dueDateDay: 10,
      gracePeriodDays: 5,
      status: AppConstants.statusActive,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<bool> updateDeviceStatus(String deviceId, String newStatus) async {
    final isRestricted = newStatus == AppConstants.statusRestricted;
    final res = await _httpPost('/commands/dispatch', {
      'deviceId': deviceId,
      'commandType': isRestricted ? 'RESTRICT_DEVICE' : 'REMOVE_RESTRICTION',
      'performerName': 'Mobile Device Client',
      'role': 'DEVICE',
    });
    return res != null && res['success'] == true;
  }

  @override
  Future<List<AdminCommand>> fetchPendingCommands(String deviceId) async {
    final json = await _httpGet('/commands/pending/$deviceId');
    if (json != null && json['success'] == true && json['data'] is List) {
      final list = json['data'] as List;
      return list.map((item) => AdminCommand.fromJson(item)).toList();
    }
    return [];
  }

  @override
  Future<bool> acknowledgeCommand(String commandId, bool success, {String? failureReason}) async {
    final res = await _httpPost('/commands/ack', {
      'commandId': commandId,
      'success': success,
      'failureReason': failureReason,
    });
    return res != null && res['success'] == true;
  }

  @override
  Future<bool> recordHeartbeat(String deviceId, Map<String, dynamic> heartbeatInfo) async {
    final res = await _httpPost('/devices/$deviceId/telemetry', heartbeatInfo);
    if (res != null && res['success'] == true) {
      final bool serverRestricted = res['isRestricted'] ?? false;
      final String? serverPin = res['unlockPin']?.toString();
      final bool? isAppHidden = res['isAppHidden'] as bool?;

      final prefs = await SharedPreferences.getInstance();
      if (res['deviceId'] != null && res['deviceId'].toString().isNotEmpty) {
        await prefs.setString(AppConstants.keyDeviceId, res['deviceId'].toString());
      }
      if (res['contractId'] != null && res['contractId'].toString().isNotEmpty) {
        await prefs.setString(AppConstants.keyContractId, res['contractId'].toString());
      }
      if (res['customerName'] != null && res['customerName'].toString().isNotEmpty) {
        await prefs.setString('saved_customer_name', res['customerName'].toString());
      }
      if (res['retailerName'] != null && res['retailerName'].toString().isNotEmpty) {
        await prefs.setString('saved_retailer_name', res['retailerName'].toString());
      }
      if (res['retailerPhone'] != null && res['retailerPhone'].toString().isNotEmpty) {
        await prefs.setString('saved_retailer_phone', res['retailerPhone'].toString());
      }
      if (res['retailerAddress'] != null && res['retailerAddress'].toString().isNotEmpty) {
        await prefs.setString('saved_retailer_address', res['retailerAddress'].toString());
      }
      if (res['totalPrice'] != null) {
        await prefs.setDouble('saved_total_price', (res['totalPrice'] as num).toDouble());
      }
      if (res['downPayment'] != null) {
        await prefs.setDouble('saved_down_payment', (res['downPayment'] as num).toDouble());
      }
      if (res['remainingBalance'] != null) {
        await prefs.setDouble('saved_remaining_balance', (res['remainingBalance'] as num).toDouble());
      }
      if (res['monthlyInstallment'] != null) {
        await prefs.setDouble('saved_monthly_installment', (res['monthlyInstallment'] as num).toDouble());
      }
      if (res['nextDueDate'] != null && res['nextDueDate'].toString().isNotEmpty) {
        await prefs.setString('saved_next_due_date', res['nextDueDate'].toString());
      }
      if (res['retailerId'] != null && res['retailerId'].toString().isNotEmpty) {
        final rId = res['retailerId'].toString();
        await prefs.setString('saved_retailer_id', rId);
        final rDetails = await getRetailerDetails(rId);
        if (rDetails != null) {
          if (rDetails['phone'] != null) await prefs.setString('saved_retailer_phone', rDetails['phone'].toString());
          if (rDetails['address'] != null) await prefs.setString('saved_retailer_address', rDetails['address'].toString());
        }
      }

      if (serverPin != null && serverPin.isNotEmpty) {
        try {
          MethodChannel(AppConstants.methodChannelName).invokeMethod('setUnlockPin', {'pin': serverPin});
        } catch (_) {}
      }

      if (isAppHidden != null) {
        await _deviceService.hideApplicationLauncher(hide: isAppHidden);
      }

      final currentInfo = await _deviceService.getDeviceInformation();
      final bool currentRestricted = currentInfo.data?['isRestricted'] ?? false;

      if (serverRestricted != currentRestricted) {
        if (serverRestricted) {
          await _deviceService.applyRestriction();
        } else {
          await _deviceService.removeRestriction();
        }
      } else {
        DeviceManagementService.restrictionNotifier.value = serverRestricted;
      }

      // Process pending commands from Node.js backend
      if (res['pendingCommands'] is List) {
        final List cmds = res['pendingCommands'];
        for (var c in cmds) {
          final String commandId = c['commandId']?.toString() ?? '';
          final String commandType = c['commandType']?.toString() ?? '';

          if (commandType == 'HIDE_APP') {
            await _deviceService.hideApplicationLauncher(hide: true);
          } else if (commandType == 'UNHIDE_APP') {
            await _deviceService.hideApplicationLauncher(hide: false);
          } else if (commandType == 'RESTRICT_DEVICE' || commandType == 'LOCK_DEVICE') {
            await _deviceService.applyRestriction();
          } else if (commandType == 'REMOVE_RESTRICTION' || commandType == 'UNLOCK_DEVICE') {
            await _deviceService.removeRestriction();
          } else if (commandType == 'WIPE_DEVICE' || commandType == 'UNINSTALL_MDM') {
            await _deviceService.wipeDevice(wipeData: false);
          }

          if (commandId.isNotEmpty) {
            await acknowledgeCommand(commandId, true);
          }
        }
      }
      return true;
    }
    return false;
  }

  @override
  Future<Map<String, dynamic>?> getRetailerDetails(String retailerId) async {
    final json = await _httpGet('/retailers');
    if (json != null && json['success'] == true && json['data'] is List) {
      final list = json['data'] as List;
      for (var item in list) {
        if (item['id'] == retailerId) {
          return Map<String, dynamic>.from(item);
        }
      }
    }
    final prefs = await SharedPreferences.getInstance();
    return {
      'id': retailerId,
      'businessName': prefs.getString('saved_retailer_name') ?? 'Authorized Retailer Store',
      'ownerName': 'Store Manager',
      'phone': prefs.getString('saved_retailer_phone') ?? '',
      'city': 'Pakistan',
      'address': prefs.getString('saved_retailer_address') ?? '',
    };
  }
}
