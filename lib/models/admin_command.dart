class AdminCommand {
  final String commandId;
  final String deviceId;
  final String adminId;
  final String commandType; // SYNC_DEVICE, RESTRICT_DEVICE, REMOVE_RESTRICTION, CHECK_STATUS, UPDATE_POLICY
  final Map<String, dynamic>? payload;
  final String status; // PENDING, EXECUTED, FAILED
  final String? failureReason;
  final DateTime createdAt;
  final DateTime? executedAt;

  AdminCommand({
    required this.commandId,
    required this.deviceId,
    required this.adminId,
    required this.commandType,
    this.payload,
    required this.status,
    this.failureReason,
    required this.createdAt,
    this.executedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'commandId': commandId,
      'deviceId': deviceId,
      'adminId': adminId,
      'commandType': commandType,
      'payload': payload,
      'status': status,
      'failureReason': failureReason,
      'createdAt': createdAt.toIso8601String(),
      'executedAt': executedAt?.toIso8601String(),
    };
  }

  factory AdminCommand.fromJson(Map<String, dynamic> json) {
    return AdminCommand(
      commandId: json['commandId'] ?? '',
      deviceId: json['deviceId'] ?? '',
      adminId: json['adminId'] ?? '',
      commandType: json['commandType'] ?? '',
      payload: json['payload'],
      status: json['status'] ?? 'PENDING',
      failureReason: json['failureReason'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      executedAt: json['executedAt'] != null ? DateTime.parse(json['executedAt']) : null,
    );
  }
}
