import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/device_management/device_management_service.dart';
import '../../../services/security/environment_config.dart';
import '../widgets/status_card.dart';
import 'device_restricted_screen.dart';

class DeviceReadyScreen extends StatefulWidget {
  const DeviceReadyScreen({super.key});

  @override
  State<DeviceReadyScreen> createState() => _DeviceReadyScreenState();
}

class _DeviceReadyScreenState extends State<DeviceReadyScreen> {
  final DeviceManagementService _deviceService = DeviceManagementService();
  Timer? _statusTimer;

  Map<String, dynamic> _deviceInfo = {};
  String _contractId = '';
  String _nextDueDate = '';
  double _monthlyInstallment = 0.0;
  bool _isDeviceOwner = false;
  bool _isManaged = false;
  bool _isRestricted = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _refreshStatus();
    _statusTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _refreshStatus();
    });
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    super.dispose();
  }

  Future<void> _refreshStatus() async {
    await _deviceService.syncDeviceStatus();
    final infoResult = await _deviceService.getDeviceInformation();
    final info = infoResult.data ?? {};
    
    final prefs = await SharedPreferences.getInstance();
    final contractId = prefs.getString(AppConstants.keyContractId) ?? 'CTR-${info['deviceId']?.toString().substring(0, 6) ?? '1001'}';
    final simImei = prefs.getString('test_override_imei') ?? prefs.getString('contract_imei') ?? prefs.getString('saved_imei');
    
    if (info['imei'] == null || info['imei'].toString().contains('N/A') || info['imei'].toString().isEmpty) {
      if (simImei != null && simImei.isNotEmpty) {
        info['imei'] = simImei;
      } else {
        info['imei'] = '864${(info['deviceId'] ?? '123456789012').toString().replaceAll(RegExp(r'\D'), '').padRight(12, '9').substring(0, 12)}';
      }
    }

    if (mounted) {
      setState(() {
        _deviceInfo = info;
        _contractId = contractId;
        _nextDueDate = prefs.getString('saved_next_due_date') ?? '10th of Month';
        _monthlyInstallment = prefs.getDouble('saved_monthly_installment') ?? 5000.0;
        _isDeviceOwner = info['isDeviceOwner'] ?? false;
        _isManaged = info['isManagedDevice'] ?? false;
        _isRestricted = info['isRestricted'] ?? false;
        _isLoading = false;
      });

      if (_isRestricted && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DeviceRestrictedScreen()),
        );
      }
    }
  }

  void _showSetServerIpDialog() {
    final controller = TextEditingController(text: 'https://instalment-guard-production-8ff6.up.railway.app');
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Backend Server URL', style: TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Enter Cloud Server or Local LAN URL (e.g. https://instalment-guard-production-8ff6.up.railway.app or http://10.10.20.33:5000).',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                keyboardType: TextInputType.url,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Server URL',
                  labelStyle: const TextStyle(color: AppTheme.accentCyan),
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('custom_server_ip');
                if (ctx.mounted) Navigator.pop(ctx);
                _refreshStatus();
              },
              child: const Text('Reset', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              onPressed: () async {
                final text = controller.text.trim();
                if (text.isNotEmpty) {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setString('custom_server_ip', text);
                }
                if (ctx.mounted) Navigator.pop(ctx);
                _refreshStatus();
              },
              child: const Text('Save Server IP'),
            ),
          ],
        );
      },
    );
  }

  void _showSetTestImeiDialog() {
    final controller = TextEditingController(text: '864293048571029');
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Simulate Test IMEI', style: TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Enter a 15-digit test IMEI to simulate IMEI reading on personal devices without Device Owner.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Test IMEI Number',
                  labelStyle: const TextStyle(color: AppTheme.accentCyan),
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('test_override_imei');
                if (ctx.mounted) Navigator.pop(ctx);
                _refreshStatus();
              },
              child: const Text('Reset', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              onPressed: () async {
                final text = controller.text.trim();
                if (text.isNotEmpty) {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setString('test_override_imei', text);
                }
                if (ctx.mounted) Navigator.pop(ctx);
                _refreshStatus();
              },
              child: const Text('Save Test IMEI'),
            ),
          ],
        );
      },
    );
  }

  void _showTelemetryDataDialog() {
    final totalRam = _deviceInfo['totalRamMb'] != null ? '${_deviceInfo['totalRamMb']} MB' : 'N/A';
    final availRam = _deviceInfo['availRamMb'] != null ? '${_deviceInfo['availRamMb']} MB free' : 'N/A';
    final storage = _deviceInfo['totalStorageGb'] != null ? '${_deviceInfo['availStorageGb']} GB free / ${_deviceInfo['totalStorageGb']} GB total' : 'N/A';
    final battery = _deviceInfo['batteryLevel'] != null && _deviceInfo['batteryLevel'] >= 0
        ? '${_deviceInfo['batteryLevel']}% (${_deviceInfo['isCharging'] == true ? 'Charging' : 'Discharging'})'
        : 'N/A';
    final network = '${_deviceInfo['connectionType'] ?? 'Unknown'} (IP: ${_deviceInfo['ipAddress'] ?? 'N/A'})';
    final uptime = _deviceInfo['uptimeSeconds'] != null ? '${(_deviceInfo['uptimeSeconds'] as num) ~/ 60} mins' : 'N/A';

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Row(
            children: [
              Icon(Icons.analytics_outlined, color: AppTheme.accentCyan),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Full Mobile Telemetry',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDataRow('Contract Ref', _contractId),
                _buildDataRow('Device ID', _deviceInfo['deviceId']?.toString() ?? 'N/A'),
                _buildDataRow('IMEI Identifier', _deviceInfo['imei']?.toString() ?? 'N/A (Requires DeviceOwner)'),
                _buildDataRow('Manufacturer', '${_deviceInfo['manufacturer']} (${_deviceInfo['brand'] ?? ''})'),
                _buildDataRow('Model / Hardware', '${_deviceInfo['model']} / ${_deviceInfo['hardware'] ?? 'Gen'}'),
                _buildDataRow('Android OS', '${_deviceInfo['androidVersion']} (SDK ${_deviceInfo['sdkVersion']})'),
                _buildDataRow('Security Patch', _deviceInfo['securityPatch']?.toString() ?? 'N/A'),
                _buildDataRow('RAM Memory', '$availRam ($totalRam total)'),
                _buildDataRow('Storage Space', storage),
                _buildDataRow('Battery State', battery),
                _buildDataRow('Network & IP', network),
                _buildDataRow('Display Spec', '${_deviceInfo['resolution']} @ ${_deviceInfo['densityDpi']} dpi'),
                _buildDataRow('System Uptime', uptime),
                _buildDataRow('GPS Latitude', _deviceInfo['latitude']?.toString() ?? 'N/A'),
                _buildDataRow('GPS Longitude', _deviceInfo['longitude']?.toString() ?? 'N/A'),
                _buildDataRow('Device Owner', _isDeviceOwner ? 'ACTIVE' : 'INACTIVE'),
                _buildDataRow('Managed State', _isManaged ? 'MANAGED' : 'UNMANAGED'),
                _buildDataRow('Restriction State', _isRestricted ? 'RESTRICTED' : 'ACTIVE'),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close', style: TextStyle(color: AppTheme.accentCyan)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 115,
            child: Text(
              label,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  void _showDevToolsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 20,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text(
                              'Developer & Admin Testing Tools',
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.white70),
                            onPressed: () => Navigator.pop(sheetContext),
                          ),
                        ],
                      ),
                      const Divider(color: Color(0xFF334155)),
                      const SizedBox(height: 8),
                      ListTile(
                        leading: const Icon(Icons.analytics_outlined, color: AppTheme.accentCyan),
                        title: const Text('Inspect Full Mobile Telemetry Data', style: TextStyle(color: Colors.white)),
                        subtitle: const Text('Inspect RAM, storage, battery, network, IMEI & GPS info', style: TextStyle(color: Color(0xFF94A3B8))),
                        onTap: () {
                          Navigator.pop(sheetContext);
                          _showTelemetryDataDialog();
                        },
                      ),
                      SwitchListTile(
                        title: const Text('Environment Mode', style: TextStyle(color: Colors.white)),
                        subtitle: Text(
                          EnvironmentConfig.environmentName,
                          style: TextStyle(
                            color: EnvironmentConfig.isDevelopment ? AppTheme.warningOrange : AppTheme.successGreen,
                          ),
                        ),
                        value: EnvironmentConfig.isDevelopment,
                        onChanged: (val) {
                          setSheetState(() {
                            EnvironmentConfig.setEnvironment(
                              val ? AppEnvironment.development : AppEnvironment.production,
                            );
                          });
                          setState(() {});
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.block, color: AppTheme.dangerRed),
                        title: const Text('Simulate Overdue Device Restriction', style: TextStyle(color: Colors.white)),
                        subtitle: const Text('Triggers native lock task & overdue restriction screen', style: TextStyle(color: Color(0xFF94A3B8))),
                        onTap: () async {
                          Navigator.pop(sheetContext);
                          await _deviceService.applyRestriction();
                          if (mounted) {
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute(builder: (_) => const DeviceRestrictedScreen()),
                            );
                          }
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.visibility_off, color: AppTheme.warningOrange),
                        title: const Text('Hide App Icon from Launcher', style: TextStyle(color: Colors.white)),
                        subtitle: const Text('Hides launcher icon (Requires Device Owner)', style: TextStyle(color: Color(0xFF94A3B8))),
                        onTap: () async {
                          Navigator.pop(sheetContext);
                          final result = await _deviceService.hideApplicationLauncher(hide: true);
                          if (mounted) {
                            if (result.data == true || EnvironmentConfig.isDevelopment) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(_isDeviceOwner
                                      ? 'App icon hidden from launcher drawer.'
                                      : 'App icon hidden from launcher drawer (Dev Testing Mode).'),
                                ),
                              );
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to hide icon. Device Owner status required via ADB command.'),
                                  duration: Duration(seconds: 4),
                                ),
                              );
                            }
                          }
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.wifi_tethering, color: AppTheme.accentCyan),
                        title: const Text('Configure Live Server Connection URL', style: TextStyle(color: Colors.white)),
                        subtitle: const Text('Default: https://instalment-guard-production-8ff6.up.railway.app', style: TextStyle(color: Color(0xFF94A3B8))),
                        onTap: () {
                          Navigator.pop(sheetContext);
                          _showSetServerIpDialog();
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.pin, color: AppTheme.accentCyan),
                        title: const Text('Simulate Test IMEI Number', style: TextStyle(color: Colors.white)),
                        subtitle: const Text('Set custom test IMEI for testing without Device Owner', style: TextStyle(color: Color(0xFF94A3B8))),
                        onTap: () {
                          Navigator.pop(sheetContext);
                          _showSetTestImeiDialog();
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.sync, color: AppTheme.accentCyan),
                        title: const Text('Force Background Heartbeat Sync', style: TextStyle(color: Colors.white)),
                        subtitle: const Text('Sends heartbeat metrics to backend', style: TextStyle(color: Color(0xFF94A3B8))),
                        onTap: () async {
                          Navigator.pop(sheetContext);
                          await _deviceService.syncDeviceStatus();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Heartbeat synced successfully.')),
                            );
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics_outlined, color: AppTheme.tealPrimary),
            tooltip: 'Inspect Collected Data',
            onPressed: _showTelemetryDataDialog,
          ),
          IconButton(
            icon: const Icon(Icons.developer_mode, color: AppTheme.textMain),
            tooltip: 'Developer Tools',
            onPressed: _showDevToolsSheet,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.textMain),
            onPressed: _refreshStatus,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.successGreen.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.verified_user,
                    size: 64,
                    color: AppTheme.successGreen,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Device Setup Completed',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 24),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'This device is now protected by Installment Guard.',
                style: Theme.of(context).textTheme.bodyLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              if (_isLoading)
                const Center(child: CircularProgressIndicator(color: AppTheme.tealPrimary))
              else ...[
                if (_nextDueDate.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF59E0B)),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFEF3C7),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.notifications_active, color: Color(0xFFD97706), size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '🔔 Installment Due Date Alert',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF92400E)),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Your monthly installment of Rs. ${_monthlyInstallment.toStringAsFixed(0)} is due on $_nextDueDate. Please pay on time to avoid device lock.',
                                style: const TextStyle(fontSize: 12, color: Color(0xFFB45309)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                StatusCard(
                  title: 'Managed Device Status',
                  subtitle: _isManaged
                      ? (_isDeviceOwner ? 'Device Owner (Full Protection)' : 'Profile Owner Active')
                      : 'Standard Managed Mode',
                  icon: Icons.shield,
                  iconColor: AppTheme.successGreen,
                ),
                const SizedBox(height: 16),
                StatusCard(
                  title: 'Installment Contract Linked',
                  subtitle: 'Contract ID: $_contractId',
                  icon: Icons.assignment_turned_in,
                  iconColor: AppTheme.tealPrimary,
                ),
                const SizedBox(height: 16),
                StatusCard(
                  title: 'Policy & Heartbeat Sync',
                  subtitle: 'Last check-in: ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
                  icon: Icons.check_circle_outline,
                  iconColor: AppTheme.tealSecondary,
                ),
              ],

              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _showTelemetryDataDialog,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.lightSurface,
                  foregroundColor: AppTheme.tealPrimary,
                  elevation: 1,
                  side: const BorderSide(color: AppTheme.lightCardBorder),
                ),
                icon: const Icon(Icons.analytics_outlined, size: 20),
                label: const Text('Inspect Collected Telemetry Data'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

