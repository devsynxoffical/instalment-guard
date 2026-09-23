import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/device_record.dart';
import '../../../services/backend/nodejs_backend_service.dart';
import '../../../services/device_management/device_management_service.dart';
import 'device_ready_screen.dart';

class EnrollmentStatusScreen extends StatefulWidget {
  final String contractId;

  const EnrollmentStatusScreen({super.key, required this.contractId});

  @override
  State<EnrollmentStatusScreen> createState() => _EnrollmentStatusScreenState();
}

class _EnrollmentStatusScreenState extends State<EnrollmentStatusScreen> {
  final DeviceManagementService _deviceService = DeviceManagementService();
  final BackendService _backendService = NodeJsBackendService();

  String _currentStep = AppConstants.enrollmentInitializing;
  String _statusMessage = 'Initializing device security policies...';
  double _progress = 0.1;
  bool _isFailed = false;
  String _failureDetails = '';

  @override
  void initState() {
    super.initState();
    _executeEnrollmentSequence();
  }

  Future<void> _executeEnrollmentSequence() async {
    try {
      setState(() {
        _currentStep = AppConstants.enrollmentInitializing;
        _statusMessage = 'Preparing device management workspace...';
        _progress = 0.2;
      });
      await Future.delayed(const Duration(milliseconds: 900));

      if (!mounted) return;
      setState(() {
        _currentStep = AppConstants.enrollmentPreparing;
        _statusMessage = 'Connecting to management service...';
        _progress = 0.4;
      });
      final infoResult = await _deviceService.getDeviceInformation();
      final deviceInfo = infoResult.data ?? {};
      await Future.delayed(const Duration(milliseconds: 900));

      if (!mounted) return;
      setState(() {
        _currentStep = AppConstants.enrollmentEnrolling;
        _statusMessage = 'Registering device with backend contract...';
        _progress = 0.6;
      });

      final enrollmentResult = await _deviceService.requestEnrollment(widget.contractId);
      if (!enrollmentResult.isSuccess) {
        throw Exception(enrollmentResult.errorMessage ?? 'Native enrollment failed.');
      }
      await Future.delayed(const Duration(milliseconds: 900));

      if (!mounted) return;
      setState(() {
        _currentStep = AppConstants.enrollmentVerifying;
        _statusMessage = 'Verifying device management status & policies...';
        _progress = 0.85;
      });

      final deviceId = deviceInfo['deviceId']?.toString() ?? 'DEV-${DateTime.now().millisecondsSinceEpoch}';
      final dynamicCustId = 'CUST-${widget.contractId.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toUpperCase()}';
      
      final record = DeviceRecord(
        deviceId: deviceId,
        contractId: widget.contractId,
        customerId: dynamicCustId,
        imei: deviceInfo['imei']?.toString(),
        latitude: (deviceInfo['latitude'] as num?)?.toDouble(),
        longitude: (deviceInfo['longitude'] as num?)?.toDouble(),
        manufacturer: deviceInfo['manufacturer']?.toString() ?? 'Android',
        model: deviceInfo['model']?.toString() ?? 'Device',
        androidVersion: deviceInfo['androidVersion']?.toString() ?? 'Unknown',
        sdkVersion: (deviceInfo['sdkVersion'] as num?)?.toInt() ?? 0,
        appVersion: deviceInfo['appVersion']?.toString() ?? '1.0.0',
        enrollmentStatus: AppConstants.enrollmentCompleted,
        managementStatus: (deviceInfo['isManagedDevice'] ?? false) ? 'MANAGED' : 'UNMANAGED',
        deviceStatus: AppConstants.statusActive,
        lastCheckIn: DateTime.now(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _backendService.registerDevice(record);
      await Future.delayed(const Duration(milliseconds: 900));

      if (!mounted) return;
      setState(() {
        _currentStep = AppConstants.enrollmentCompleted;
        _statusMessage = 'Setup completed successfully!';
        _progress = 1.0;
      });
      await Future.delayed(const Duration(milliseconds: 800));

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DeviceReadyScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isFailed = true;
          _currentStep = AppConstants.enrollmentFailed;
          _statusMessage = 'Enrollment encountered an error.';
          _failureDetails = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: (_isFailed ? AppTheme.dangerRed : AppTheme.primaryBlue).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isFailed ? Icons.error_outline : Icons.sync,
                  size: 64,
                  color: _isFailed ? AppTheme.dangerRed : AppTheme.primaryBlue,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Device Enrollment Status',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              Text(
                _statusMessage,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 32),

              if (!_isFailed) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: _progress,
                    minHeight: 8,
                    backgroundColor: const Color(0xFFE2E8F0),
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              _buildStepItem('Initializing', _currentStep == AppConstants.enrollmentInitializing, _progress > 0.2),
              _buildStepItem('Preparing Device', _currentStep == AppConstants.enrollmentPreparing, _progress > 0.4),
              _buildStepItem('Enrolling Management', _currentStep == AppConstants.enrollmentEnrolling, _progress > 0.6),
              _buildStepItem('Verifying Backend Link', _currentStep == AppConstants.enrollmentVerifying, _progress > 0.85),
              _buildStepItem('Setup Completed', _currentStep == AppConstants.enrollmentCompleted, _progress >= 1.0),

              if (_isFailed) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.dangerRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.dangerRed.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    _failureDetails,
                    style: const TextStyle(color: AppTheme.dangerRed, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () {
                    setState(() {
                      _isFailed = false;
                    });
                    _executeEnrollmentSequence();
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry Enrollment'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepItem(String title, bool isCurrent, bool isDone) {
    Color color = AppTheme.textMuted;
    IconData icon = Icons.radio_button_unchecked;

    if (isDone) {
      color = AppTheme.successGreen;
      icon = Icons.check_circle_rounded;
    } else if (isCurrent) {
      color = AppTheme.accentCyan;
      icon = Icons.hourglass_top_rounded;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
              color: isCurrent ? AppTheme.textMain : color,
            ),
          ),
        ],
      ),
    );
  }
}
