import 'dart:async';
import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/retailer/screens/retailer_login_screen.dart';
import 'features/retailer/screens/retailer_main_shell.dart';
import 'features/retailer/services/retailer_api_service.dart';
import 'features/setup/screens/device_ready_screen.dart';
import 'features/setup/screens/device_restricted_screen.dart';
import 'services/device_management/device_management_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const InstallmentGuardApp());
}

class InstallmentGuardApp extends StatefulWidget {
  const InstallmentGuardApp({super.key});

  @override
  State<InstallmentGuardApp> createState() => _InstallmentGuardAppState();
}

class _InstallmentGuardAppState extends State<InstallmentGuardApp> {
  final DeviceManagementService _deviceService = DeviceManagementService();
  final RetailerApiService _retailerApiService = RetailerApiService();
  Timer? _heartbeatTimer;

  Widget _homeScreen = const Scaffold(
    backgroundColor: AppTheme.lightBackground,
    body: Center(
      child: CircularProgressIndicator(color: AppTheme.tealPrimary),
    ),
  );

  bool _isRetailerApp = false;

  @override
  void initState() {
    super.initState();
    _determineInitialRoute();
  }

  @override
  void dispose() {
    DeviceManagementService.restrictionNotifier.removeListener(_onRestrictionChanged);
    _heartbeatTimer?.cancel();
    super.dispose();
  }

  void _onRestrictionChanged() {
    if (_isRetailerApp) return;
    final isRestricted = DeviceManagementService.restrictionNotifier.value;
    if (mounted) {
      setState(() {
        if (isRestricted) {
          _homeScreen = const DeviceRestrictedScreen();
        } else {
          _homeScreen = const DeviceReadyScreen();
        }
      });
    }
  }

  void _startHeartbeatTimer() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _deviceService.syncDeviceStatus();
    });
  }

  Future<void> _determineInitialRoute() async {
    // 1. Check application identity (package name)
    final pkgName = await _deviceService.getPackageName();
    final isRetailer = pkgName.contains('retailer');

    if (isRetailer) {
      _isRetailerApp = true;
      final retailerSession = await _retailerApiService.getStoredSession();
      if (mounted) {
        setState(() {
          if (retailerSession != null && retailerSession.token.isNotEmpty) {
            _homeScreen = RetailerMainShell(initialSession: retailerSession);
          } else {
            _homeScreen = const RetailerLoginScreen();
          }
        });
      }
      return;
    }

    // 2. Customer Guard Device logic
    DeviceManagementService.restrictionNotifier.addListener(_onRestrictionChanged);
    _startHeartbeatTimer();
    await _deviceService.syncDeviceStatus();

    final statusResult = await _deviceService.getEnrollmentStatus();
    final infoResult = await _deviceService.getDeviceInformation();

    final status = statusResult.data ?? 'NOT_ENROLLED';
    final info = infoResult.data ?? {};
    final isRestricted = info['isRestricted'] ?? false;
    final isManaged = info['isDeviceOwner'] == true || info['isManagedDevice'] == true;

    DeviceManagementService.restrictionNotifier.value = isRestricted;

    Widget targetWidget;
    if (isRestricted) {
      targetWidget = const DeviceRestrictedScreen();
    } else if (isManaged || status == 'COMPLETED') {
      targetWidget = const DeviceReadyScreen();
    } else {
      // Unmanaged customer device setup screen
      targetWidget = const DeviceReadyScreen();
    }

    if (mounted) {
      setState(() {
        _homeScreen = targetWidget;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: _isRetailerApp ? 'Retailer Hub - Installment Guard' : 'Installment Guard',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: _homeScreen,
    );
  }
}
