import 'dart:async';
import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/setup/screens/device_ready_screen.dart';
import 'features/setup/screens/device_restricted_screen.dart';
import 'features/setup/screens/device_setup_screen.dart';
import 'features/setup/screens/enrollment_status_screen.dart';
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
  Timer? _heartbeatTimer;

  Widget _homeScreen = const Scaffold(
    backgroundColor: AppTheme.darkBackground,
    body: Center(
      child: CircularProgressIndicator(color: AppTheme.primaryBlue),
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
    // Send live telemetry to Node.js backend immediately on app startup!
    await _deviceService.syncDeviceStatus();

    final statusResult = await _deviceService.getEnrollmentStatus();
    final infoResult = await _deviceService.getDeviceInformation();

    final status = statusResult.data ?? 'NOT_ENROLLED';
    final info = infoResult.data ?? {};
    final isRestricted = info['isRestricted'] ?? false;

    DeviceManagementService.restrictionNotifier.value = isRestricted;

    Widget targetWidget;
    if (isRestricted) {
      targetWidget = const DeviceRestrictedScreen();
    } else if (status == 'COMPLETED') {
      targetWidget = const DeviceReadyScreen();
    } else {
      // Zero-Touch Auto Enrollment on First Launch
      final String autoContractId = 'CTR-${info['deviceId']?.toString().substring(0, 6) ?? DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
      targetWidget = EnrollmentStatusScreen(contractId: autoContractId);
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
      theme: AppTheme.darkTheme,
      home: _homeScreen,
    );
  }
}
