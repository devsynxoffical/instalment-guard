import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../services/retailer_api_service.dart';

class DefaulterCheckScreen extends StatefulWidget {
  const DefaulterCheckScreen({super.key});

  @override
  State<DefaulterCheckScreen> createState() => _DefaulterCheckScreenState();
}

class _DefaulterCheckScreenState extends State<DefaulterCheckScreen> {
  final _searchController = TextEditingController();
  final _apiService = RetailerApiService();

  bool _isLoading = false;
  Map<String, dynamic>? _result;
  String? _searchedQuery;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performCheck() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isLoading = true;
      _result = null;
      _searchedQuery = query;
    });

    try {
      final res = await _apiService.checkDefaulter(query);
      if (mounted) {
        setState(() {
          _result = res;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Customer Fraud & Credit Check',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Input Card
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
                  const Text(
                    'Verify Customer CNIC or Phone',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Check our national network blacklist to see if this customer defaulted on other installment plans before issuing a new mobile.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.badge_outlined, size: 20, color: Color(0xFF94A3B8)),
                            hintText: 'e.g. 42101-1234567-1 or 03001234567',
                            hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.tealPrimary, width: 1.5)),
                          ),
                          onSubmitted: (_) => _performCheck(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _performCheck,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.tealPrimary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        ),
                        child: _isLoading
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Verify', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Result Display
            if (_result != null) ...[
              Builder(builder: (context) {
                final isDefaulter = _result!['isDefaulter'] == true;
                final riskScore = _result!['riskScore']?.toString() ?? (isDefaulter ? 'HIGH RISK' : 'LOW RISK (CLEAR)');
                final message = _result!['message']?.toString() ?? (isDefaulter ? 'Customer has defaulted installments.' : 'Customer has a clean track record.');

                return Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: isDefaulter ? Colors.red.shade200 : Colors.green.shade200),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDefaulter ? Colors.red.shade50 : Colors.green.shade50,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              isDefaulter ? Icons.warning_amber_rounded : Icons.verified_user_rounded,
                              color: isDefaulter ? AppTheme.dangerRed : AppTheme.successGreen,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isDefaulter ? 'DEFALUTER RECORD FOUND' : 'CLEAR TO PROCEED',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: isDefaulter ? AppTheme.dangerRed : AppTheme.successGreen,
                                  ),
                                ),
                                Text(
                                  'Query: $_searchedQuery • Status: $riskScore',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20, color: Color(0xFFF1F5F9)),
                      Text(
                        message,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.4),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }
}
