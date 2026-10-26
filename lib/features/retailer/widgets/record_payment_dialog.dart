import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../services/retailer_api_service.dart';

class RecordPaymentDialog extends StatefulWidget {
  final Map<String, dynamic> contract;
  final String performerName;
  final VoidCallback onPaymentRecorded;

  const RecordPaymentDialog({
    super.key,
    required this.contract,
    required this.performerName,
    required this.onPaymentRecorded,
  });

  @override
  State<RecordPaymentDialog> createState() => _RecordPaymentDialogState();
}

class _RecordPaymentDialogState extends State<RecordPaymentDialog> {
  final _apiService = RetailerApiService();
  final _amountController = TextEditingController();
  final _refController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedMethod = 'Cash';
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final monthly = (widget.contract['monthlyInstallment'] as num?)?.toDouble() ?? 0.0;
    final remaining = (widget.contract['remainingBalance'] as num?)?.toDouble() ?? 0.0;
    final defaultAmount = remaining < monthly && remaining > 0 ? remaining : monthly;
    _amountController.text = defaultAmount > 0 ? defaultAmount.toStringAsFixed(0) : '';
  }

  @override
  void dispose() {
    _amountController.dispose();
    _refController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  double get _currentRemaining => (widget.contract['remainingBalance'] as num?)?.toDouble() ?? 0.0;
  double get _enteredAmount => double.tryParse(_amountController.text.trim()) ?? 0.0;
  double get _newBalance => (_currentRemaining - _enteredAmount).clamp(0.0, double.infinity);

  Future<void> _submitPayment() async {
    final amount = _enteredAmount;
    if (amount <= 0) {
      setState(() => _errorMessage = 'Please enter a valid payment amount.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final contractId = widget.contract['contractId'] ?? widget.contract['id'] ?? '';
      await _apiService.recordPayment(
        contractId: contractId.toString(),
        amount: amount,
        method: _selectedMethod,
        reference: _refController.text.trim().isNotEmpty ? _refController.text.trim() : null,
        notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
        performerName: widget.performerName,
      );

      if (mounted) {
        Navigator.of(context).pop();
        widget.onPaymentRecorded();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.successGreen,
            content: Text('Payment of Rs. ${amount.toStringAsFixed(0)} recorded successfully!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final customerName = widget.contract['customerName']?.toString() ?? 'Customer';
    final deviceModel = widget.contract['deviceModel']?.toString() ?? 'Device';
    final contractId = widget.contract['contractId']?.toString() ?? '';

    return Dialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(22.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.tealLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.receipt_long_rounded, color: AppTheme.tealPrimary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Record Payment',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                        ),
                        Text(
                          '$customerName • $deviceModel',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Ledger Balance Info Box
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Contract ID:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        Text(contractId, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Current Balance:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        Text(
                          'Rs. ${_currentRemaining.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.dangerRed),
                        ),
                      ],
                    ),
                    const Divider(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Remaining After Payment:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        Text(
                          'Rs. ${_newBalance.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _newBalance == 0 ? AppTheme.successGreen : AppTheme.tealPrimary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red.shade800, fontSize: 11),
                  ),
                ),

              // Payment Amount Input
              const Text('Amount Received (PKR) *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
              const SizedBox(height: 6),
              TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  prefixText: 'Rs. ',
                  prefixStyle: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textMain),
                  hintText: 'e.g. 5000',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.tealPrimary, width: 1.5)),
                ),
              ),
              const SizedBox(height: 12),

              // Payment Method Dropdown
              const Text('Payment Channel *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _selectedMethod,
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.tealPrimary, width: 1.5)),
                ),
                items: const [
                  DropdownMenuItem(value: 'Cash', child: Text('Cash at Counter', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'EasyPaisa', child: Text('EasyPaisa Transfer', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'JazzCash', child: Text('JazzCash Transfer', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'Bank Transfer', child: Text('Bank Wire / Raast', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'POS Card', child: Text('Debit / Credit Card POS', style: TextStyle(fontSize: 13))),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _selectedMethod = val);
                },
              ),
              const SizedBox(height: 12),

              // Transaction / Receipt Reference
              const Text('Receipt / Reference No. (Optional)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
              const SizedBox(height: 6),
              TextField(
                controller: _refController,
                decoration: InputDecoration(
                  hintText: 'e.g. EP-998822 or Receipt #104',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.tealPrimary, width: 1.5)),
                ),
              ),
              const SizedBox(height: 20),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submitPayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.tealPrimary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: _isLoading
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Confirm Payment', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
