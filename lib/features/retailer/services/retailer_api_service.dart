import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/retailer_session.dart';

class RetailerApiService {
  static final RetailerApiService _instance = RetailerApiService._internal();
  factory RetailerApiService() => _instance;
  RetailerApiService._internal();

  String _baseUrl = 'https://instalment-guard-production-8ff6.up.railway.app/api';

  void setBaseUrl(String url) {
    _baseUrl = url.endsWith('/api') ? url : '$url/api';
  }

  String get currentBaseUrl => _baseUrl;

  Future<List<String>> _getBaseUrlsToTry() async {
    final prefs = await SharedPreferences.getInstance();
    final custom = prefs.getString('custom_server_ip');
    final urls = <String>[];
    if (custom != null && custom.isNotEmpty) {
      urls.add(custom.endsWith('/api') ? custom : '$custom/api');
    }
    urls.add(_baseUrl);
    urls.add('https://instalment-guard-production-8ff6.up.railway.app/api');
    urls.add('http://10.0.2.2:5000/api');
    urls.add('http://10.10.20.33:5000/api');
    urls.add('http://127.0.0.1:5000/api');
    urls.add('http://localhost:5000/api');
    return urls.toSet().toList();
  }

  Future<dynamic> _httpGet(String path, {String? token}) async {
    final urls = await _getBaseUrlsToTry();
    for (var activeUrl in urls) {
      try {
        final client = HttpClient();
        client.connectionTimeout = const Duration(seconds: 4);
        final request = await client.getUrl(Uri.parse('$activeUrl$path'));
        if (token != null && token.isNotEmpty) {
          request.headers.set('authorization', 'Bearer $token');
        }
        final response = await request.close();
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final contents = await response.transform(utf8.decoder).join();
          return jsonDecode(contents);
        }
      } catch (e) {
        debugPrint('[RetailerApiService] GET $path error on $activeUrl: $e');
      }
    }
    return null;
  }

  Future<dynamic> _httpPost(String path, Map<String, dynamic> body, {String? token}) async {
    final urls = await _getBaseUrlsToTry();
    for (var activeUrl in urls) {
      try {
        final client = HttpClient();
        client.connectionTimeout = const Duration(seconds: 4);
        final request = await client.postUrl(Uri.parse('$activeUrl$path'));
        request.headers.set('content-type', 'application/json');
        if (token != null && token.isNotEmpty) {
          request.headers.set('authorization', 'Bearer $token');
        }
        request.add(utf8.encode(jsonEncode(body)));
        final response = await request.close();
        final contents = await response.transform(utf8.decoder).join();
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return jsonDecode(contents);
        } else {
          try {
            final parsed = jsonDecode(contents);
            return parsed;
          } catch (_) {
            return {'success': false, 'message': 'HTTP ${response.statusCode}'};
          }
        }
      } catch (e) {
        debugPrint('[RetailerApiService] POST $path error on $activeUrl: $e');
      }
    }
    return {'success': false, 'message': 'Connection to server failed. Please check your internet connection.'};
  }

  // --- AUTHENTICATION ---

  Future<RetailerSession?> login(String email, String password) async {
    final res = await _httpPost('/auth/login', {
      'email': email.trim().toLowerCase(),
      'password': password.trim(),
    });

    if (res != null && res['success'] == true && res['user'] != null) {
      final session = RetailerSession.fromJson(res);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('retailer_session', jsonEncode(session.toStorage()));
      await prefs.setString('retailer_token', session.token);
      await prefs.setString('saved_retailer_id', session.retailerId);
      await prefs.setString('saved_retailer_name', session.businessName);
      await prefs.setString('saved_retailer_phone', session.phone);
      await prefs.setString('saved_retailer_address', session.address);
      return session;
    }
    throw Exception(res?['message'] ?? 'Login failed. Please verify your credentials.');
  }

  Future<RetailerSession?> getStoredSession() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('retailer_session');
    if (raw != null && raw.isNotEmpty) {
      try {
        final map = jsonDecode(raw);
        return RetailerSession.fromStorage(map);
      } catch (_) {}
    }
    return null;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('retailer_session');
    await prefs.remove('retailer_token');
    await prefs.remove('saved_retailer_id');
  }

  Future<RetailerSession?> refreshSession(RetailerSession current) async {
    try {
      final res = await _httpGet('/retailers', token: current.token);
      if (res != null && res['success'] == true && res['data'] is List) {
        final list = res['data'] as List;
        final match = list.firstWhere(
          (r) => r['id'] == current.retailerId || r['email'] == current.email,
          orElse: () => null,
        );
        if (match != null) {
          final updated = current.copyWith(
            businessName: match['businessName']?.toString(),
            ownerName: match['ownerName']?.toString(),
            credits: (match['credits'] as num?)?.toInt(),
            phone: match['phone']?.toString(),
            city: match['city']?.toString(),
            address: match['address']?.toString(),
            status: match['status']?.toString(),
          );
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('retailer_session', jsonEncode(updated.toStorage()));
          return updated;
        }
      }
    } catch (_) {}
    return current;
  }

  // --- DEVICES MANAGEMENT ---

  Future<List<Map<String, dynamic>>> getRetailerDevices(String retailerId, {String? token}) async {
    final res = await _httpGet('/devices?retailerId=$retailerId', token: token);
    if (res != null && res['success'] == true && res['data'] is List) {
      return (res['data'] as List).cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<Map<String, dynamic>?> getDeviceDetail(String deviceId, {String? token}) async {
    final res = await _httpGet('/devices/$deviceId', token: token);
    if (res != null && res['success'] == true && res['data'] != null) {
      return res['data'] as Map<String, dynamic>;
    }
    return null;
  }

  Future<Map<String, dynamic>> sendCommand({
    required String deviceId,
    required String commandType,
    required String retailerId,
    String? token,
    Map<String, dynamic>? payload,
  }) async {
    final res = await _httpPost('/commands/dispatch', {
      'deviceId': deviceId,
      'commandType': commandType,
      'adminId': retailerId,
      'payload': payload ?? {},
    }, token: token);

    return res is Map<String, dynamic> ? res : {'success': false, 'message': 'Command dispatch failed'};
  }

  // --- MOBILE ENROLLMENT ---

  Future<Map<String, dynamic>> enrollMobile({
    required String retailerId,
    required String performerName,
    required String customerName,
    required String customerPhone,
    required String customerCnic,
    String? customerAddress,
    required String brand,
    required String model,
    required String imei,
    String? imei2,
    required double totalPrice,
    required double downPayment,
    required double monthlyInstallment,
    required int durationMonths,
    required int dueDateDay,
    String? unlockPin,
    String? token,
  }) async {
    final payload = {
      'retailerId': retailerId,
      'performerName': performerName,
      'role': 'RETAILER',
      'enrollmentData': {
        'customerName': customerName.trim(),
        'customerPhone': customerPhone.trim(),
        'customerCnic': customerCnic.trim(),
        'customerAddress': customerAddress ?? '',
        'brand': brand.trim(),
        'model': model.trim(),
        'imei': imei.trim(),
        'imei2': imei2?.trim() ?? '',
        'totalPrice': totalPrice,
        'downPayment': downPayment,
        'monthlyInstallment': monthlyInstallment,
        'durationMonths': durationMonths,
        'totalMonths': durationMonths,
        'dueDateDay': dueDateDay,
        'unlockPin': (unlockPin != null && unlockPin.isNotEmpty) ? unlockPin : '1234',
        'assetCategory': 'MOBILE_PHONE',
      }
    };

    final res = await _httpPost('/devices/enroll', payload, token: token);
    if (res != null && res['success'] == true) {
      return res as Map<String, dynamic>;
    }
    throw Exception(res?['message'] ?? 'Failed to enroll mobile. Check license credit balance.');
  }

  // --- CONTRACTS & PAYMENTS ---

  Future<List<Map<String, dynamic>>> getRetailerContracts(String retailerId, {String? token}) async {
    final res = await _httpGet('/contracts', token: token);
    if (res != null && res['success'] == true && res['data'] is List) {
      final list = (res['data'] as List).cast<Map<String, dynamic>>();
      if (retailerId.isNotEmpty && retailerId != 'SUPER_ADMIN') {
        return list.where((c) => c['retailerId'] == retailerId).toList();
      }
      return list;
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getRetailerPayments(String retailerId, {String? token}) async {
    final res = await _httpGet('/payments?retailerId=$retailerId', token: token);
    if (res != null && res['success'] == true && res['data'] is List) {
      return (res['data'] as List).cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<Map<String, dynamic>> recordPayment({
    required String contractId,
    required double amount,
    String method = 'Cash',
    String? reference,
    String? notes,
    required String performerName,
    String? token,
  }) async {
    final res = await _httpPost('/payments', {
      'contractId': contractId,
      'amount': amount,
      'method': method,
      'reference': reference ?? 'REF-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}',
      'notes': notes ?? '',
      'performerName': performerName,
      'role': 'RETAILER',
    }, token: token);

    if (res != null && res['success'] == true) {
      return res as Map<String, dynamic>;
    }
    throw Exception(res?['message'] ?? 'Failed to record installment payment.');
  }

  // --- FRAUD / DEFAULTER CHECK ---

  Future<Map<String, dynamic>> checkDefaulter(String query) async {
    final clean = query.trim().replaceAll('-', '');
    final res = await _httpGet('/defaulter-check?query=$clean');
    if (res != null) return res as Map<String, dynamic>;
    return {'isDefaulter': false, 'message': 'No negative records found'};
  }

  // --- ANDROID ENTERPRISE ZERO-TOUCH PROVISIONING QR PAYLOAD ---

  String buildProvisioningQrPayload({
    required String retailerId,
    String? customServerUrl,
  }) {
    final serverBase = customServerUrl ?? _baseUrl;
    final cleanBase = serverBase.replaceAll(RegExp(r'/api/?$'), '');
    final apkUrl = '$cleanBase/download/installment_guard.apk?retailerId=$retailerId';

    final payloadMap = {
      'android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME':
          'com.example.installment_guard/com.example.installment_guard.device.InstallmentAdminReceiver',
      'android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION': apkUrl,
      'android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM':
          'PtPdqGxf8LVeElfVwNVi4SIMZ2thmrCwPOBFgQBqmeY',
      'android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED': true,
      'android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE': {
        'retailerId': retailerId,
        'serverUrl': serverBase,
      }
    };

    return jsonEncode(payloadMap);
  }
}
