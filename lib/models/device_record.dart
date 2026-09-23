class DeviceRecord {
  final String deviceId;
  final String retailerId;
  final String retailerName;
  final String contractId;
  final String customerId;
  final String? imei;
  final double? latitude;
  final double? longitude;
  final String manufacturer;
  final String model;
  final String androidVersion;
  final int sdkVersion;
  final String appVersion;
  final String enrollmentStatus;
  final String managementStatus;
  final String deviceStatus;
  final DateTime lastCheckIn;
  final DateTime createdAt;
  final DateTime updatedAt;

  DeviceRecord({
    required this.deviceId,
    this.retailerId = '',
    this.retailerName = '',
    required this.contractId,
    required this.customerId,
    this.imei,
    this.latitude,
    this.longitude,
    required this.manufacturer,
    required this.model,
    required this.androidVersion,
    required this.sdkVersion,
    required this.appVersion,
    required this.enrollmentStatus,
    required this.managementStatus,
    required this.deviceStatus,
    required this.lastCheckIn,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'deviceId': deviceId,
      'retailerId': retailerId,
      'retailerName': retailerName,
      'contractId': contractId,
      'customerId': customerId,
      'imei': imei,
      'latitude': latitude,
      'longitude': longitude,
      'manufacturer': manufacturer,
      'model': model,
      'androidVersion': androidVersion,
      'sdkVersion': sdkVersion,
      'appVersion': appVersion,
      'enrollmentStatus': enrollmentStatus,
      'managementStatus': managementStatus,
      'deviceStatus': deviceStatus,
      'lastCheckIn': lastCheckIn.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory DeviceRecord.fromJson(Map<String, dynamic> json) {
    return DeviceRecord(
      deviceId: json['deviceId'] ?? '',
      retailerId: json['retailerId'] ?? '',
      retailerName: (json['retailerName'] != null && json['retailerName'] != 'Lahore Electronics Hub') ? json['retailerName'] : 'Authorized Retailer Store',
      contractId: json['contractId'] ?? '',
      customerId: json['customerId'] ?? '',
      imei: json['imei'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      manufacturer: json['manufacturer'] ?? 'Unknown',
      model: json['model'] ?? 'Unknown',
      androidVersion: json['androidVersion'] ?? 'Unknown',
      sdkVersion: json['sdkVersion'] ?? 0,
      appVersion: json['appVersion'] ?? '1.0.0',
      enrollmentStatus: json['enrollmentStatus'] ?? 'NOT_ENROLLED',
      managementStatus: json['managementStatus'] ?? 'UNMANAGED',
      deviceStatus: json['deviceStatus'] ?? 'ACTIVE',
      lastCheckIn: json['lastCheckIn'] != null ? DateTime.parse(json['lastCheckIn']) : DateTime.now(),
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
    );
  }
}
