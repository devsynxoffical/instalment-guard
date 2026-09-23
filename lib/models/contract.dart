class InstallmentContract {
  final String contractId;
  final String customerId;
  final String deviceId;
  final double totalPrice;
  final double downPayment;
  final double remainingBalance;
  final double monthlyInstallment;
  final int dueDateDay;
  final int gracePeriodDays;
  final String? nextDueDate;
  final String status; // ACTIVE, COMPLETED, DEFAULTED
  final DateTime createdAt;

  InstallmentContract({
    required this.contractId,
    required this.customerId,
    required this.deviceId,
    required this.totalPrice,
    required this.downPayment,
    required this.remainingBalance,
    required this.monthlyInstallment,
    required this.dueDateDay,
    required this.gracePeriodDays,
    this.nextDueDate,
    required this.status,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'contractId': contractId,
      'customerId': customerId,
      'deviceId': deviceId,
      'totalPrice': totalPrice,
      'downPayment': downPayment,
      'remainingBalance': remainingBalance,
      'monthlyInstallment': monthlyInstallment,
      'dueDateDay': dueDateDay,
      'gracePeriodDays': gracePeriodDays,
      'nextDueDate': nextDueDate,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory InstallmentContract.fromJson(Map<String, dynamic> json) {
    return InstallmentContract(
      contractId: json['contractId'] ?? '',
      customerId: json['customerId'] ?? '',
      deviceId: json['deviceId'] ?? '',
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0.0,
      downPayment: (json['downPayment'] as num?)?.toDouble() ?? 0.0,
      remainingBalance: (json['remainingBalance'] as num?)?.toDouble() ?? 0.0,
      monthlyInstallment: (json['monthlyInstallment'] as num?)?.toDouble() ?? 0.0,
      dueDateDay: json['dueDateDay'] ?? 10,
      gracePeriodDays: json['gracePeriodDays'] ?? 5,
      nextDueDate: json['nextDueDate'] ?? json['next_due_date'],
      status: json['status'] ?? 'ACTIVE',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
