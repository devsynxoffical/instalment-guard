import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../models/retailer_session.dart';
import '../services/retailer_api_service.dart';
import '../widgets/enrollment_qr_dialog.dart';

class EnrollMobileScreen extends StatefulWidget {
  final RetailerSession session;
  final VoidCallback onEnrolled;

  const EnrollMobileScreen({
    super.key,
    required this.session,
    required this.onEnrolled,
  });

  @override
  State<EnrollMobileScreen> createState() => _EnrollMobileScreenState();
}

class _EnrollMobileScreenState extends State<EnrollMobileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = RetailerApiService();

  // Customer Controllers
  final _customerNameCtrl = TextEditingController();
  final _customerPhoneCtrl = TextEditingController();
  final _customerCnicCtrl = TextEditingController();
  final _customerAddressCtrl = TextEditingController();

  // Mobile Hardware Controllers
  String _selectedBrand = 'Samsung';
  final _modelCtrl = TextEditingController();
  final _imeiCtrl = TextEditingController();
  final _imei2Ctrl = TextEditingController();
  final _variantCtrl = TextEditingController(text: '128GB / 8GB');

  // Installment Controllers
  final _totalPriceCtrl = TextEditingController(text: '65000');
  final _downPaymentCtrl = TextEditingController(text: '15000');
  final _monthlyDueCtrl = TextEditingController();
  final _pinCtrl = TextEditingController(text: '1234');

  int _selectedDurationMonths = 6;
  int _selectedDueDay = 10;
  bool _isLoading = false;
  String? _errorMessage;

  final List<String> _brands = [
    'Samsung',
    'Xiaomi',
    'Vivo',
    'Oppo',
    'Realme',
    'Infinix',
    'Tecno',
    'Apple',
    'OnePlus',
    'Google Pixel',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _recalculateMonthly();
    _totalPriceCtrl.addListener(_recalculateMonthly);
    _downPaymentCtrl.addListener(_recalculateMonthly);
  }

  @override
  void dispose() {
    _customerNameCtrl.dispose();
    _customerPhoneCtrl.dispose();
    _customerCnicCtrl.dispose();
    _customerAddressCtrl.dispose();
    _modelCtrl.dispose();
    _imeiCtrl.dispose();
    _imei2Ctrl.dispose();
    _variantCtrl.dispose();
    _totalPriceCtrl.dispose();
    _downPaymentCtrl.dispose();
    _monthlyDueCtrl.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  void _recalculateMonthly() {
    final total = double.tryParse(_totalPriceCtrl.text.trim()) ?? 0.0;
    final down = double.tryParse(_downPaymentCtrl.text.trim()) ?? 0.0;
    final balance = (total - down).clamp(0.0, double.infinity);
    if (_selectedDurationMonths > 0) {
      final monthly = (balance / _selectedDurationMonths).round();
      _monthlyDueCtrl.text = monthly.toString();
    }
  }

  Future<void> _handleEnrollment() async {
    if (!_formKey.currentState!.validate()) return;

    if (widget.session.credits < 1) {
      setState(() {
        _errorMessage = 'Insufficient License Credits! You have 0 credits. Please contact Super Admin HQ to allocate credits.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final total = double.parse(_totalPriceCtrl.text.trim());
      final down = double.parse(_downPaymentCtrl.text.trim());
      final monthly = double.parse(_monthlyDueCtrl.text.trim());

      final res = await _apiService.enrollMobile(
        retailerId: widget.session.retailerId,
        performerName: widget.session.ownerName.isNotEmpty ? widget.session.ownerName : widget.session.name,
        customerName: _customerNameCtrl.text.trim(),
        customerPhone: _customerPhoneCtrl.text.trim(),
        customerCnic: _customerCnicCtrl.text.trim(),
        customerAddress: _customerAddressCtrl.text.trim(),
        brand: _selectedBrand,
        model: _modelCtrl.text.trim(),
        imei: _imeiCtrl.text.trim(),
        imei2: _imei2Ctrl.text.trim(),
        totalPrice: total,
        downPayment: down,
        monthlyInstallment: monthly,
        durationMonths: _selectedDurationMonths,
        dueDateDay: _selectedDueDay,
        unlockPin: _pinCtrl.text.trim(),
        token: widget.session.token,
      );

      final deviceData = res['data']?['newDevice'] ?? {};
      final contractData = res['data']?['newContract'] ?? {};
      final deviceId = deviceData['deviceId'] ?? 'DEV-MOBILE';
      final contractId = contractData['contractId'] ?? 'CTR-2026';

      // Build Android Enterprise Provisioning QR Code
      final qrPayload = _apiService.buildProvisioningQrPayload(
        retailerId: widget.session.retailerId,
      );

      widget.onEnrolled();

      if (mounted) {
        setState(() {
          _isLoading = false;
          // Clear inputs
          _customerNameCtrl.clear();
          _customerPhoneCtrl.clear();
          _customerCnicCtrl.clear();
          _customerAddressCtrl.clear();
          _modelCtrl.clear();
          _imeiCtrl.clear();
          _imei2Ctrl.clear();
        });

        // Show Full Provisioning QR Code Dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => EnrollmentQrDialog(
            qrData: qrPayload,
            customerName: deviceData['customerName'] ?? 'Customer',
            deviceModel: '$_selectedBrand ${deviceData['model'] ?? ''}',
            deviceId: deviceId,
            contractId: contractId,
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
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Add & Enroll Mobile',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Credits Banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.tealPrimary.withValues(alpha: 0.1),
                      Colors.teal.shade50,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.tealPrimary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.tealPrimary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.monetization_on_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text('Available Credits: ', style: TextStyle(fontSize: 12, color: Color(0xFF334155))),
                              Text(
                                '${widget.session.credits}',
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.tealPrimary),
                              ),
                            ],
                          ),
                          const Text(
                            'Enrolling this mobile consumes 1 License Credit.',
                            style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppTheme.dangerRed, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Color(0xFFBE123C), fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),

              // Section 1: Customer Details
              _buildSectionCard(
                title: '1. Customer Information',
                icon: Icons.person_rounded,
                children: [
                  _buildTextField(
                    label: 'Customer Full Name *',
                    controller: _customerNameCtrl,
                    hint: 'e.g. Muhammad Bilal',
                    validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          label: 'Mobile Phone *',
                          controller: _customerPhoneCtrl,
                          hint: '03001234567',
                          keyboardType: TextInputType.phone,
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          label: 'CNIC / National ID *',
                          controller: _customerCnicCtrl,
                          hint: '42101-1234567-1',
                          keyboardType: TextInputType.number,
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildTextField(
                    label: 'Customer Residential Address',
                    controller: _customerAddressCtrl,
                    hint: 'e.g. House #12, Street 4, Saddar, Karachi',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Section 2: Mobile Hardware Details
              _buildSectionCard(
                title: '2. Mobile Device Hardware',
                icon: Icons.phone_android_rounded,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Mobile Brand *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                            const SizedBox(height: 4),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedBrand,
                              decoration: _inputDecoration(hint: 'Select brand'),
                              items: _brands.map((b) => DropdownMenuItem(value: b, child: Text(b, style: const TextStyle(fontSize: 13)))).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedBrand = val);
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          label: 'Mobile Model *',
                          controller: _modelCtrl,
                          hint: 'e.g. Galaxy A54 5G',
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          label: 'IMEI 1 (15 digits) *',
                          controller: _imeiCtrl,
                          hint: '864293048571029',
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return 'Required';
                            final clean = v.trim().replaceAll(RegExp(r'[^0-9]'), '');
                            if (clean.length < 14) return 'At least 14 digits';
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          label: 'IMEI 2 (Optional)',
                          controller: _imei2Ctrl,
                          hint: 'Secondary IMEI',
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildTextField(
                    label: 'Storage & Color Variant',
                    controller: _variantCtrl,
                    hint: 'e.g. 128GB / 8GB RAM Awesome Lime',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Section 3: Financial Installment Terms
              _buildSectionCard(
                title: '3. Installment Financial Plan',
                icon: Icons.payments_rounded,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          label: 'Total Mobile Price (PKR) *',
                          controller: _totalPriceCtrl,
                          hint: '65000',
                          keyboardType: TextInputType.number,
                          prefixText: 'Rs. ',
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          label: 'Down Payment (PKR) *',
                          controller: _downPaymentCtrl,
                          hint: '15000',
                          keyboardType: TextInputType.number,
                          prefixText: 'Rs. ',
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Tenure (Months) *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                            const SizedBox(height: 4),
                            DropdownButtonFormField<int>(
                              initialValue: _selectedDurationMonths,
                              decoration: _inputDecoration(hint: 'Months'),
                              items: [3, 6, 9, 12, 18, 24].map((m) => DropdownMenuItem(value: m, child: Text('$m Months', style: const TextStyle(fontSize: 13)))).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedDurationMonths = val;
                                    _recalculateMonthly();
                                  });
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          label: 'Monthly Installment (PKR) *',
                          controller: _monthlyDueCtrl,
                          hint: 'Auto calculated',
                          keyboardType: TextInputType.number,
                          prefixText: 'Rs. ',
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Due Day of Month', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                            const SizedBox(height: 4),
                            DropdownButtonFormField<int>(
                              initialValue: _selectedDueDay,
                              decoration: _inputDecoration(hint: 'Day'),
                              items: [1, 5, 10, 15, 20, 25].map((d) => DropdownMenuItem(value: d, child: Text('${d}th of month', style: const TextStyle(fontSize: 13)))).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedDueDay = val);
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          label: 'Emergency Unlock PIN',
                          controller: _pinCtrl,
                          hint: '1234',
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleEnrollment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.tealPrimary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 3,
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.qr_code_rounded, size: 22),
                            SizedBox(width: 10),
                            Text(
                              'Enroll Mobile & Generate QR',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppTheme.tealPrimary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
            ],
          ),
          const Divider(height: 20, color: Color(0xFFF1F5F9)),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    String? hint,
    String? prefixText,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: validator,
          style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
          decoration: _inputDecoration(hint: hint, prefixText: prefixText),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration({String? hint, String? prefixText}) {
    return InputDecoration(
      prefixText: prefixText,
      prefixStyle: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A), fontSize: 13),
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.tealPrimary, width: 1.5)),
    );
  }
}
