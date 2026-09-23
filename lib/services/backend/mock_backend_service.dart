import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../../models/device_record.dart';
import '../../models/contract.dart';
import '../../models/admin_command.dart';
import '../device_management/device_management_service.dart';
import 'backend_service.dart';

class MockBackendService implements BackendService {
  static final MockBackendService _instance = MockBackendService._internal();
  factory MockBackendService() => _instance;
  MockBackendService._internal();

  final Map<String, DeviceRecord> _devicesMap = {};
  final Map<String, InstallmentContract> _contractsMap = {};
  final List<AdminCommand> _commandsList = [];
  final DeviceManagementService _deviceService = DeviceManagementService();

  @override
  Future<bool> registerDevice(DeviceRecord device) async {
    _devicesMap[device.deviceId] = device;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyDeviceId, device.deviceId);
    await prefs.setString(AppConstants.keyContractId, device.contractId);
    await prefs.setString(AppConstants.keyDeviceStatus, device.deviceStatus);
    await prefs.setString('record_${device.deviceId}', jsonEncode(device.toJson()));
    return true;
  }

  @override
  Future<DeviceRecord?> getDeviceRecord(String deviceId) async {
    if (_devicesMap.containsKey(deviceId)) {
      return _devicesMap[deviceId];
    }
    
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('record_$deviceId');
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        final Map<String, dynamic> data = jsonDecode(jsonStr);
        final record = DeviceRecord.fromJson(data);
        _devicesMap[deviceId] = record;
        return record;
      } catch (_) {}
    }

    // Generate real record dynamically from live native telemetry if not registered yet
    final infoResult = await _deviceService.getDeviceInformation();
    final info = infoResult.data ?? {};
    final liveDeviceId = info['deviceId']?.toString() ?? deviceId;

    final contractId = prefs.getString(AppConstants.keyContractId) ?? 'CTR-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    final dynamicRecord = DeviceRecord(
      deviceId: liveDeviceId,
      contractId: contractId,
      customerId: 'CUST-${liveDeviceId.substring(0, liveDeviceId.length > 8 ? 8 : liveDeviceId.length).toUpperCase()}',
      imei: info['imei']?.toString(),
      latitude: (info['latitude'] as num?)?.toDouble(),
      longitude: (info['longitude'] as num?)?.toDouble(),
      manufacturer: info['manufacturer']?.toString() ?? 'Android',
      model: info['model']?.toString() ?? 'Device',
      androidVersion: info['androidVersion']?.toString() ?? 'Unknown',
      sdkVersion: (info['sdkVersion'] as num?)?.toInt() ?? 0,
      appVersion: info['appVersion']?.toString() ?? '1.0.0',
      enrollmentStatus: info['isManagedDevice'] == true ? AppConstants.enrollmentCompleted : AppConstants.enrollmentNotEnrolled,
      managementStatus: info['isManagedDevice'] == true ? 'MANAGED' : 'UNMANAGED',
      deviceStatus: info['isRestricted'] == true ? AppConstants.statusRestricted : AppConstants.statusActive,
      lastCheckIn: DateTime.now(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    _devicesMap[deviceId] = dynamicRecord;
    return dynamicRecord;
  }

  @override
  Future<InstallmentContract?> getContract(String contractId) async {
    if (_contractsMap.containsKey(contractId)) {
      return _contractsMap[contractId];
    }

    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('contract_$contractId');
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        final Map<String, dynamic> data = jsonDecode(jsonStr);
        final contract = InstallmentContract.fromJson(data);
        _contractsMap[contractId] = contract;
        return contract;
      } catch (_) {}
    }

    final activeContractId = contractId.isEmpty
        ? (prefs.getString(AppConstants.keyContractId) ?? 'CTR-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}')
        : contractId;

    final dynamicContract = InstallmentContract(
      contractId: activeContractId,
      customerId: 'CUST-REF-${activeContractId.hashCode.abs() % 100000}',
      deviceId: prefs.getString(AppConstants.keyDeviceId) ?? 'DEV-LIVE',
      totalPrice: 120000.0,
      downPayment: 20000.0,
      remainingBalance: 100000.0,
      monthlyInstallment: 10000.0,
      dueDateDay: 10,
      gracePeriodDays: 5,
      status: AppConstants.statusActive,
      createdAt: DateTime.now(),
    );

    _contractsMap[activeContractId] = dynamicContract;
    await prefs.setString('contract_$activeContractId', jsonEncode(dynamicContract.toJson()));
    return dynamicContract;
  }

  @override
  Future<bool> updateDeviceStatus(String deviceId, String newStatus) async {
    if (_devicesMap.containsKey(deviceId)) {
      final old = _devicesMap[deviceId]!;
      final updated = DeviceRecord(
        deviceId: old.deviceId,
        contractId: old.contractId,
        customerId: old.customerId,
        imei: old.imei,
        latitude: old.latitude,
        longitude: old.longitude,
        manufacturer: old.manufacturer,
        model: old.model,
        androidVersion: old.androidVersion,
        sdkVersion: old.sdkVersion,
        appVersion: old.appVersion,
        enrollmentStatus: old.enrollmentStatus,
        managementStatus: old.managementStatus,
        deviceStatus: newStatus,
        lastCheckIn: DateTime.now(),
        createdAt: old.createdAt,
        updatedAt: DateTime.now(),
      );
      _devicesMap[deviceId] = updated;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('record_$deviceId', jsonEncode(updated.toJson()));
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyDeviceStatus, newStatus);
    return true;
  }

  @override
  Future<List<AdminCommand>> fetchPendingCommands(String deviceId) async {
    return _commandsList.where((cmd) => cmd.deviceId == deviceId && cmd.status == 'PENDING').toList();
  }

  @override
  Future<bool> acknowledgeCommand(String commandId, bool success, {String? failureReason}) async {
    final idx = _commandsList.indexWhere((cmd) => cmd.commandId == commandId);
    if (idx != -1) {
      final old = _commandsList[idx];
      _commandsList[idx] = AdminCommand(
        commandId: old.commandId,
        deviceId: old.deviceId,
        adminId: old.adminId,
        commandType: old.commandType,
        payload: old.payload,
        status: success ? 'EXECUTED' : 'FAILED',
        failureReason: failureReason,
        createdAt: old.createdAt,
        executedAt: DateTime.now(),
      );
    }
    return true;
  }

  @override
  Future<bool> recordHeartbeat(String deviceId, Map<String, dynamic> heartbeatInfo) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(AppConstants.keyLastCheckIn, DateTime.now().millisecondsSinceEpoch);
    return true;
  }

  void addMockAdminCommand(String deviceId, String commandType) {
    _commandsList.add(AdminCommand(
      commandId: 'CMD-${DateTime.now().millisecondsSinceEpoch}',
      deviceId: deviceId,
      adminId: 'ADMIN-OPERATOR-01',
      commandType: commandType,
      status: 'PENDING',
      createdAt: DateTime.now(),
    ));
  }

  @override
  Future<Map<String, dynamic>?> getRetailerDetails(String retailerId) async {
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

