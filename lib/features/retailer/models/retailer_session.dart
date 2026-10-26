class RetailerSession {
  final String token;
  final String uid;
  final String email;
  final String name;
  final String role;
  final String retailerId;
  final String businessName;
  final String ownerName;
  final String phone;
  final String city;
  final String address;
  final int credits;
  final String status;

  RetailerSession({
    required this.token,
    required this.uid,
    required this.email,
    required this.name,
    required this.role,
    required this.retailerId,
    required this.businessName,
    required this.ownerName,
    required this.phone,
    required this.city,
    required this.address,
    required this.credits,
    required this.status,
  });

  factory RetailerSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    final ret = json['retailer'] as Map<String, dynamic>? ?? {};

    return RetailerSession(
      token: json['token']?.toString() ?? '',
      uid: user['uid']?.toString() ?? user['id']?.toString() ?? '',
      email: user['email']?.toString() ?? ret['email']?.toString() ?? '',
      name: user['name']?.toString() ?? ret['ownerName']?.toString() ?? 'Retailer',
      role: user['role']?.toString() ?? 'RETAILER',
      retailerId: user['retailerId']?.toString() ?? ret['id']?.toString() ?? '',
      businessName: ret['businessName']?.toString() ?? user['name']?.toString() ?? 'Partner Store',
      ownerName: ret['ownerName']?.toString() ?? user['name']?.toString() ?? '',
      phone: ret['phone']?.toString() ?? user['phone']?.toString() ?? '',
      city: ret['city']?.toString() ?? 'Lahore',
      address: ret['address']?.toString() ?? '',
      credits: (ret['credits'] as num?)?.toInt() ?? 0,
      status: ret['status']?.toString() ?? user['status']?.toString() ?? 'ACTIVE',
    );
  }

  factory RetailerSession.fromStorage(Map<String, dynamic> json) {
    return RetailerSession(
      token: json['token']?.toString() ?? '',
      uid: json['uid']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      role: json['role']?.toString() ?? 'RETAILER',
      retailerId: json['retailerId']?.toString() ?? '',
      businessName: json['businessName']?.toString() ?? 'Partner Store',
      ownerName: json['ownerName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      city: json['city']?.toString() ?? 'Lahore',
      address: json['address']?.toString() ?? '',
      credits: (json['credits'] as num?)?.toInt() ?? 0,
      status: json['status']?.toString() ?? 'ACTIVE',
    );
  }

  Map<String, dynamic> toStorage() {
    return {
      'token': token,
      'uid': uid,
      'email': email,
      'name': name,
      'role': role,
      'retailerId': retailerId,
      'businessName': businessName,
      'ownerName': ownerName,
      'phone': phone,
      'city': city,
      'address': address,
      'credits': credits,
      'status': status,
    };
  }

  RetailerSession copyWith({
    String? token,
    String? uid,
    String? email,
    String? name,
    String? role,
    String? retailerId,
    String? businessName,
    String? ownerName,
    String? phone,
    String? city,
    String? address,
    int? credits,
    String? status,
  }) {
    return RetailerSession(
      token: token ?? this.token,
      uid: uid ?? this.uid,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      retailerId: retailerId ?? this.retailerId,
      businessName: businessName ?? this.businessName,
      ownerName: ownerName ?? this.ownerName,
      phone: phone ?? this.phone,
      city: city ?? this.city,
      address: address ?? this.address,
      credits: credits ?? this.credits,
      status: status ?? this.status,
    );
  }
}
