import '../../models/device_record.dart';
import '../../models/contract.dart';
import '../../models/admin_command.dart';

abstract class BackendService {
  Future<bool> registerDevice(DeviceRecord device);
  Future<DeviceRecord?> getDeviceRecord(String deviceId);
  Future<InstallmentContract?> getContract(String contractId);
  Future<bool> updateDeviceStatus(String deviceId, String newStatus);
  Future<List<AdminCommand>> fetchPendingCommands(String deviceId);
  Future<bool> acknowledgeCommand(String commandId, bool success, {String? failureReason});
  Future<bool> recordHeartbeat(String deviceId, Map<String, dynamic> heartbeatInfo);
  Future<Map<String, dynamic>?> getRetailerDetails(String retailerId);
}
