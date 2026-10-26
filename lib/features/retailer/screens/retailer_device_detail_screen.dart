import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../models/retailer_session.dart';
import '../services/retailer_api_service.dart';
import '../widgets/record_payment_dialog.dart';

class RetailerDeviceDetailScreen extends StatefulWidget {
  final Map<String, dynamic> initialDevice;
  final RetailerSession session;
  final VoidCallback onDataChanged;

  const RetailerDeviceDetailScreen({
    super.key,
    required this.initialDevice,
    required this.session,
    required this.onDataChanged,
  });

  @override
  State<RetailerDeviceDetailScreen> createState() => _RetailerDeviceDetailScreenState();
}

class _RetailerDeviceDetailScreenState extends State<RetailerDeviceDetailScreen> {
  final _apiService = RetailerApiService();
  late Map<String, dynamic> _device;
  bool _isActionLoading = false;

  @override
  void initState() {
    super.initState();
    _device = Map<String, dynamic>.from(widget.initialDevice);
    _refreshDevice();
  }

  Future<void> _refreshDevice() async {
    final devId = _device['deviceId']?.toString() ?? '';
    if (devId.isEmpty) return;
    try {
      final updated = await _apiService.getDeviceDetail(devId, token: widget.session.token);
      if (updated != null && mounted) {
        setState(() => _device = updated);
      }
    } catch (_) {}
  }

  Future<void> _dispatchCommand(String commandType, {String? reason}) async {
    final devId = _device['deviceId']?.toString() ?? '';
    setState(() {
      _isActionLoading = true;
    });

    try {
      await _apiService.sendCommand(
        deviceId: devId,
        commandType: commandType,
        retailerId: widget.session.retailerId,
        token: widget.session.token,
        payload: {
          if (reason != null && reason.isNotEmpty) 'reason': reason,
        },
      );

      if (mounted) {
        setState(() {
          _isActionLoading = false;
          if (commandType == 'RESTRICT_DEVICE') {
            _device['isRestricted'] = true;
          } else if (commandType == 'REMOVE_RESTRICTION') {
            _device['isRestricted'] = false;
          }
        });

        widget.onDataChanged();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.tealPrimary,
            content: Text('Command $commandType dispatched successfully!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isActionLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppTheme.dangerRed, content: Text('Command failed: $e')),
        );
      }
    }
  }

  void _confirmLock() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Lock Customer Phone?', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text(
          'This will trigger native lock task mode, preventing customer access until payment is confirmed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _dispatchCommand('RESTRICT_DEVICE', reason: 'Overdue installment payment');
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.dangerRed, foregroundColor: Colors.white),
            child: const Text('Lock Phone'),
          ),
        ],
      ),
    );
  }

  void _confirmUnlock() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Unlock Customer Phone?', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text(
          'This will clear restrictions and restore normal phone functionality.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _dispatchCommand('REMOVE_RESTRICTION');
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.successGreen, foregroundColor: Colors.white),
            child: const Text('Unlock Phone'),
          ),
        ],
      ),
    );
  }

  void _openPaymentDialog() {
    final contract = {
      'contractId': _device['contractId'] ?? 'CTR-2026',
      'customerName': _device['customerName'] ?? 'Customer',
      'deviceModel': _device['model'] ?? 'Device',
      'remainingBalance': _device['remainingBalance'] ?? 0,
      'monthlyInstallment': _device['monthlyInstallment'] ?? 0,
    };

    showDialog(
      context: context,
      builder: (_) => RecordPaymentDialog(
        contract: contract,
        performerName: widget.session.ownerName.isNotEmpty ? widget.session.ownerName : widget.session.name,
        onPaymentRecorded: () {
          _refreshDevice();
          widget.onDataChanged();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isRestricted = _device['isRestricted'] == true;
    final model = _device['model']?.toString() ?? 'Mobile Device';
    final brand = _device['brand']?.toString() ?? _device['manufacturer']?.toString() ?? 'Android';
    final imei = _device['imei']?.toString() ?? 'N/A';
    final customerName = _device['customerName']?.toString() ?? 'Customer';
    final customerPhone = _device['customerPhone']?.toString() ?? 'N/A';
    final battery = _device['batteryLevel'] != null ? '${_device['batteryLevel']}%' : 'N/A';
    final isCharging = _device['isCharging'] == true;
    final lastCheckIn = _device['lastCheckIn']?.toString() ?? 'Just now';
    final remaining = (_device['remainingBalance'] as num?)?.toDouble() ?? 0.0;
    final monthly = (_device['monthlyInstallment'] as num?)?.toDouble() ?? 0.0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          model,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.tealPrimary),
            onPressed: () {
              _refreshDevice();
              _dispatchCommand('SYNC_DEVICE');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status & Device Header Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
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
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isRestricted ? Colors.red.shade50 : Colors.teal.shade50,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(
                          isRestricted ? Icons.lock_rounded : Icons.smartphone_rounded,
                          color: isRestricted ? AppTheme.dangerRed : AppTheme.tealPrimary,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              model,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                            Text(
                              '$brand • IMEI: $imei',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: isRestricted ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isRestricted ? 'RESTRICTED / LOCKED' : 'PROTECTED / ACTIVE',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isRestricted ? AppTheme.dangerRed : AppTheme.successGreen,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  isCharging ? Icons.battery_charging_full_rounded : Icons.battery_std_rounded,
                                  size: 15,
                                  color: Colors.grey.shade700,
                                ),
                                Text(
                                  battery,
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),

                  // Remote Control Buttons
                  if (_isActionLoading)
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: CircularProgressIndicator(color: AppTheme.tealPrimary, strokeWidth: 2),
                    )
                  else
                    Row(
                      children: [
                        if (isRestricted)
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _confirmUnlock,
                              icon: const Icon(Icons.lock_open_rounded, size: 18),
                              label: const Text('Unlock Phone'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.successGreen,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          )
                        else
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _confirmLock,
                              icon: const Icon(Icons.lock_rounded, size: 18),
                              label: const Text('Lock Phone'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.dangerRed,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () => _dispatchCommand('SYNC_DEVICE'),
                          icon: const Icon(Icons.sync_rounded),
                          tooltip: 'Sync Hardware Telemetry',
                          style: IconButton.styleFrom(
                            backgroundColor: const Color(0xFFF1F5F9),
                            foregroundColor: const Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Customer & Contract Overview Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.person_outline_rounded, size: 18, color: AppTheme.tealPrimary),
                      SizedBox(width: 8),
                      Text('Customer & Installment Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildDetailRow('Customer Name', customerName),
                  _buildDetailRow('Customer Phone', customerPhone),
                  _buildDetailRow('Customer CNIC', _device['customerCnic']?.toString() ?? 'N/A'),
                  _buildDetailRow('Remaining Balance', 'Rs. ${remaining.toStringAsFixed(0)}', isBold: true, color: remaining > 0 ? AppTheme.dangerRed : AppTheme.successGreen),
                  _buildDetailRow('Monthly Installment', 'Rs. ${monthly.toStringAsFixed(0)}'),
                  _buildDetailRow('Contract ID', _device['contractId']?.toString() ?? 'N/A'),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _openPaymentDialog,
                      icon: const Icon(Icons.payments_rounded, size: 18),
                      label: const Text('Record Installment Payment'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.tealPrimary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Hardware Telemetry Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.memory_rounded, size: 18, color: AppTheme.tealPrimary),
                      SizedBox(width: 8),
                      Text('Live Mobile Telemetry', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildDetailRow('Battery Level', battery),
                  _buildDetailRow('Charging State', isCharging ? 'Connected (AC/USB)' : 'Discharging'),
                  _buildDetailRow('Android OS', _device['androidVersion']?.toString() ?? 'Android 14'),
                  _buildDetailRow('RAM Total / Free', '${_device['totalRamMb'] ?? 'N/A'} MB / ${_device['availRamMb'] ?? 'N/A'} MB'),
                  _buildDetailRow('Internal Storage', '${_device['totalStorageGb'] ?? 'N/A'} GB'),
                  _buildDetailRow('Screen Resolution', _device['resolution']?.toString() ?? '1080x2400'),
                  _buildDetailRow('IP Address', _device['ipAddress']?.toString() ?? 'Cellular / Wi-Fi'),
                  _buildDetailRow('Last Telemetry Ping', lastCheckIn),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
                color: color ?? const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
