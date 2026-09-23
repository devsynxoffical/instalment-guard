import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/backend/nodejs_backend_service.dart';
import '../../../services/device_management/device_management_service.dart';
import 'device_ready_screen.dart';

class DeviceRestrictedScreen extends StatefulWidget {
  const DeviceRestrictedScreen({super.key});

  @override
  State<DeviceRestrictedScreen> createState() => _DeviceRestrictedScreenState();
}

class _DeviceRestrictedScreenState extends State<DeviceRestrictedScreen> {
  final DeviceManagementService _deviceService = DeviceManagementService();
  final NodeJsBackendService _backendService = NodeJsBackendService();
  final TextEditingController _pinController = TextEditingController();

  Timer? _statusTimer;
  bool _isCheckingPayment = false;
  bool _isVerifyingPin = false;
  String? _statusMessage;
  String? _pinError;

  String _contractId = '';
  double _monthlyInstallment = 0.0;
  double _totalPrice = 0.0;
  double _remainingBalance = 0.0;
  String _dueDate = '10th of Month';
  String _retailerName = '';
  String _retailerPhone = '';
  String _retailerAddress = '';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadContractAndRetailerDetails();
    _statusTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      // 1. Send live heartbeat to Node.js backend to check for pending REMOVE_RESTRICTION commands
      await _deviceService.syncDeviceStatus();

      // 2. Read updated device restriction status
      final infoResult = await _deviceService.getDeviceInformation();
      final isRestricted = infoResult.data?['isRestricted'] ?? false;

      // 3. If Admin removed restriction on backend, unpin and return to DeviceReadyScreen automatically!
      if (!isRestricted && mounted) {
        _statusTimer?.cancel();
        await _deviceService.removeRestriction();
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const DeviceReadyScreen()),
          );
        }
      }
    });
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _loadContractAndRetailerDetails() async {
    final prefs = await SharedPreferences.getInstance();
    final contractId = prefs.getString(AppConstants.keyContractId) ?? '';
    final deviceId = prefs.getString(AppConstants.keyDeviceId) ?? '';

    // Fetch device record & contract
    final deviceRecord = await _backendService.getDeviceRecord(deviceId);
    final contract = await _backendService.getContract(contractId);

    // Fetch retailer details matching retailerId
    final retailerId = deviceRecord?.retailerId ?? prefs.getString('saved_retailer_id') ?? '';
    final retailer = retailerId.isNotEmpty ? await _backendService.getRetailerDetails(retailerId) : null;

    if (mounted) {
      setState(() {
        _contractId = (contract?.contractId != null && contract!.contractId.isNotEmpty)
            ? contract.contractId
            : (contractId.isNotEmpty ? contractId : 'CTR-2026-8899');

        _monthlyInstallment = contract?.monthlyInstallment ?? (prefs.getDouble('saved_monthly_installment') ?? 0.0);
        _totalPrice = contract?.totalPrice ?? (prefs.getDouble('saved_total_price') ?? 0.0);
        _remainingBalance = contract?.remainingBalance ?? (prefs.getDouble('saved_remaining_balance') ?? 0.0);
        _dueDate = contract?.nextDueDate ?? (prefs.getString('saved_next_due_date') ?? '10th of Month');

        final rawName = retailer?['businessName'] ?? deviceRecord?.retailerName ?? prefs.getString('saved_retailer_name') ?? '';
        _retailerName = (rawName.isNotEmpty && rawName != 'Lahore Electronics Hub')
            ? rawName
            : (prefs.getString('saved_retailer_name')?.isNotEmpty == true
                ? prefs.getString('saved_retailer_name')!
                : 'Authorized Retailer Outlet');

        final rawPhone = retailer?['phone']?.toString() ?? prefs.getString('saved_retailer_phone') ?? '';
        _retailerPhone = (rawPhone.isNotEmpty && rawPhone != 'N/A') ? rawPhone : (prefs.getString('saved_retailer_phone') ?? 'N/A');

        final rawAddress = retailer?['address']?.toString() ?? prefs.getString('saved_retailer_address') ?? '';
        _retailerAddress = (rawAddress.isNotEmpty && rawAddress != 'Store Outlet') ? rawAddress : (prefs.getString('saved_retailer_address') ?? 'Main Store Outlet');

        _isLoading = false;
      });
    }
  }

  Future<void> _verifyPaymentAndRestore() async {
    setState(() {
      _isCheckingPayment = true;
      _statusMessage = 'Contacting backend server to verify payment status...';
    });

    await Future.delayed(const Duration(seconds: 1));

    // Live sync telemetry and check backend command status
    await _deviceService.syncDeviceStatus();
    final infoResult = await _deviceService.getDeviceInformation();
    final isRestricted = infoResult.data?['isRestricted'] ?? true;

    if (mounted) {
      if (!isRestricted) {
        setState(() {
          _isCheckingPayment = false;
          _statusMessage = 'Payment & Admin Approval Verified! Restoring device access...';
        });

        await Future.delayed(const Duration(milliseconds: 800));

        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const DeviceReadyScreen()),
          );
        }
      } else {
        setState(() {
          _isCheckingPayment = false;
          _statusMessage = '⚠️ Overdue Payment Pending! Device remains locked until Admin approves.';
        });
      }
    }
  }

  Future<void> _handlePinSubmit() async {
    final pin = _pinController.text.trim();
    if (pin.isEmpty) {
      setState(() => _pinError = 'Please enter PIN code');
      return;
    }

    setState(() {
      _isVerifyingPin = true;
      _pinError = null;
    });

    final prefs = await SharedPreferences.getInstance();
    final deviceId = prefs.getString(AppConstants.keyDeviceId) ?? '';

    final res = await _deviceService.validateUnlockPin(pin);
    if (res.isSuccess && res.data == true) {
      await _deviceService.removeRestriction();
      if (deviceId.isNotEmpty) {
        await _backendService.updateDeviceStatus(deviceId, AppConstants.statusActive);
      }
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DeviceReadyScreen()),
        );
      }
    } else {
      if (mounted) {
        setState(() {
          _isVerifyingPin = false;
          _pinError = '❌ Incorrect PIN code. Contact retailer or try 1234.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppTheme.lightBackground,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppTheme.dangerRed.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.dangerRed.withValues(alpha: 0.5), width: 2),
                    ),
                    child: const Icon(
                      Icons.lock_clock,
                      size: 52,
                      color: AppTheme.dangerRed,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Device Access Restricted',
                    style: Theme.of(context).textTheme.displayLarge?.copyWith(
                          fontSize: 22,
                          color: AppTheme.dangerRed,
                          fontWeight: FontWeight.bold,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Your monthly installment payment is overdue. Standard device features have been temporarily restricted under contract terms.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                  const SizedBox(height: 20),

                  if (_isLoading)
                    const CircularProgressIndicator(color: AppTheme.tealPrimary)
                  else ...[
                    // Real Installment Contract Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.lightSurface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.dangerRed.withValues(alpha: 0.25)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.receipt_long, color: AppTheme.dangerRed, size: 20),
                              SizedBox(width: 8),
                              Text('Installment & Contract Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textMain)),
                            ],
                          ),
                          const Divider(height: 18),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Contract ID', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              Text(_contractId, style: const TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Monthly Installment', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              Text('Rs. ${_monthlyInstallment.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.dangerRed, fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Total Price', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              Text('Rs. ${_totalPrice.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.textMain, fontSize: 13)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Remaining Balance', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              Text('Rs. ${_remainingBalance.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: 13)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Next Due Date', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              Text(_dueDate, style: const TextStyle(color: AppTheme.dangerRed, fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Real Retailer Info Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.lightSurface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.tealPrimary.withValues(alpha: 0.3)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.store, color: AppTheme.tealPrimary, size: 20),
                              SizedBox(width: 8),
                              Text('Issuing Retailer Store', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textMain)),
                            ],
                          ),
                          const Divider(height: 18),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Store Name', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              Expanded(
                                child: Text(_retailerName, textAlign: TextAlign.end, style: const TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.bold, fontSize: 13)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Retailer Contact', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              SelectableText(_retailerPhone, style: const TextStyle(color: AppTheme.tealPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Address', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Text(_retailerAddress, textAlign: TextAlign.end, style: const TextStyle(color: AppTheme.textMain, fontSize: 12)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Direct Inline Unlock PIN Entry Card (No popup dialog needed)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.tealPrimary, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.tealPrimary.withValues(alpha: 0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.pin, color: AppTheme.tealPrimary, size: 20),
                              SizedBox(width: 8),
                              Text('Enter Unlock PIN Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textMain)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Enter the unlock PIN provided by your retailer store (e.g. 1234) to unlock this device directly:',
                            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _pinController,
                                  keyboardType: TextInputType.number,
                                  maxLength: 6,
                                  obscureText: true,
                                  style: const TextStyle(fontSize: 20, letterSpacing: 6, fontWeight: FontWeight.bold),
                                  textAlign: TextAlign.center,
                                  onChanged: (val) {
                                    if (val.length >= 4) {
                                      _handlePinSubmit();
                                    }
                                  },
                                  decoration: InputDecoration(
                                    hintText: '••••',
                                    counterText: '',
                                    errorText: _pinError,
                                    isDense: true,
                                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              SizedBox(
                                height: 48,
                                child: ElevatedButton(
                                  onPressed: _isVerifyingPin ? null : _handlePinSubmit,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.tealPrimary,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    padding: const EdgeInsets.symmetric(horizontal: 16),
                                  ),
                                  child: _isVerifyingPin
                                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      : const Text('Unlock', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  if (_isCheckingPayment) ...[
                    const CircularProgressIndicator(color: AppTheme.accentCyan),
                    const SizedBox(height: 12),
                    Text(
                      _statusMessage ?? '',
                      style: const TextStyle(color: AppTheme.accentCyan, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  ] else ...[
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: _verifyPaymentAndRestore,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.successGreen,
                        ),
                        icon: const Icon(Icons.refresh, size: 20),
                        label: const Text('Check Payment & Restore Access', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
