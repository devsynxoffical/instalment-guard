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

  @override
  void initState() {
    super.initState();
    DeviceManagementService.restrictionNotifier.addListener(_onRestrictionChanged);
    _determineInitialRoute();
    _startHeartbeatTimer();
  }

  @override
  void dispose() {
    DeviceManagementService.restrictionNotifier.removeListener(_onRestrictionChanged);
    _heartbeatTimer?.cancel();
    super.dispose();
  }

  void _onRestrictionChanged() {
    final isRestricted = DeviceManagementService.restrictionNotifier.value;
    if (mounted) {
      // Only switch screen automatically if not logged in to Retailer App
      _retailerApiService.getStoredSession().then((session) {
        if (session == null && mounted) {
          setState(() {
            if (isRestricted) {
              _homeScreen = const DeviceRestrictedScreen();
            } else {
              _homeScreen = const DeviceReadyScreen();
            }
          });
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
    // 1. Check if retailer is currently logged in on this phone
    final retailerSession = await _retailerApiService.getStoredSession();
    if (retailerSession != null && retailerSession.token.isNotEmpty) {
      if (mounted) {
        setState(() {
          _homeScreen = RetailerMainShell(initialSession: retailerSession);
        });
      }
      return;
    }

    // 2. Sync live device status
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
      // Default entry point: Retailer Login Screen!
      targetWidget = const RetailerLoginScreen();
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
      title: 'Installment Guard',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: _homeScreen,
    );
  }
}
