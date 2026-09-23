import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/device_management/device_management_service.dart';
import '../widgets/status_card.dart';
import 'enrollment_status_screen.dart';

class DeviceSetupScreen extends StatefulWidget {
  const DeviceSetupScreen({super.key});

  @override
  State<DeviceSetupScreen> createState() => _DeviceSetupScreenState();
}

class _DeviceSetupScreenState extends State<DeviceSetupScreen> {
  late final TextEditingController _contractController;
  final DeviceManagementService _deviceService = DeviceManagementService();

  Map<String, dynamic> _deviceInfo = {};
  bool _isLoading = true;
  bool _isManaged = false;

  @override
  void initState() {
    super.initState();
    _contractController = TextEditingController();
    _loadDeviceInfo();
  }

  Future<void> _loadDeviceInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final savedContract = prefs.getString(AppConstants.keyContractId);
    if (savedContract != null && savedContract.isNotEmpty) {
      _contractController.text = savedContract;
    } else {
      _contractController.text = 'CTR-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
    }

    final result = await _deviceService.getDeviceInformation();
    if (mounted) {
      setState(() {
        _deviceInfo = result.data ?? {};
        _isManaged = _deviceInfo['isManagedDevice'] ?? false;
        _isLoading = false;
      });
    }
  }

  void _startSetup() {
    final contractId = _contractController.text.trim();
    if (contractId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid Contract ID')),
      );
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => EnrollmentStatusScreen(contractId: contractId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.security_outlined,
                    size: 56,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Center(
                child: Text(
                  'Installment Guard',
                  style: Theme.of(context).textTheme.displayLarge,
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Device Protection Setup',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppTheme.accentCyan,
                      ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'This device needs to be enrolled before it can be assigned to an installment contract.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 40),

              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else ...[
                StatusCard(
                  title: '${_deviceInfo['manufacturer'] ?? 'Android'} ${_deviceInfo['model'] ?? 'Device'}',
                  subtitle: 'Device ID: ${_deviceInfo['deviceId'] ?? 'Unknown'}',
                  icon: Icons.phone_android,
                  iconColor: AppTheme.accentCyan,
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (_isManaged ? AppTheme.successGreen : AppTheme.warningOrange).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _isManaged ? 'MANAGED' : 'UNPROVISIONED',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: _isManaged ? AppTheme.successGreen : AppTheme.warningOrange,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Installment Contract Reference',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _contractController,
                        style: const TextStyle(color: Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          hintText: 'Enter Contract ID (e.g. CTR-100234)',
                          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          prefixIcon: const Icon(Icons.assignment_outlined, color: AppTheme.primaryBlue),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppTheme.primaryBlue),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _startSetup,
                  icon: const Icon(Icons.play_arrow_rounded, size: 24),
                  label: const Text('Start Setup', style: TextStyle(fontSize: 18)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

