class AppConstants {
  static const String appName = 'Installment Guard';
  static const String methodChannelName = 'installment_guard/device_management';

  // Device Status Constants
  static const String statusEnrolling = 'ENROLLING';
  static const String statusActive = 'ACTIVE';
  static const String statusDue = 'DUE';
  static const String statusOverdue = 'OVERDUE';
  static const String statusRestricted = 'RESTRICTED';
  static const String statusCompleted = 'COMPLETED';
  static const String statusFailed = 'FAILED';

  // Enrollment Status Constants
  static const String enrollmentNotEnrolled = 'NOT_ENROLLED';
  static const String enrollmentInitializing = 'INITIALIZING';
  static const String enrollmentPreparing = 'PREPARING';
  static const String enrollmentEnrolling = 'ENROLLING';
  static const String enrollmentVerifying = 'VERIFYING';
  static const String enrollmentCompleted = 'COMPLETED';
  static const String enrollmentFailed = 'FAILED';

  // Local Storage Keys
  static const String keyEnrollmentStatus = 'enrollment_status';
  static const String keyContractId = 'contract_id';
  static const String keyDeviceId = 'device_id';
  static const String keyEnvironmentMode = 'environment_mode';
  static const String keyDeviceStatus = 'device_status';
  static const String keyLastCheckIn = 'last_check_in';
}
