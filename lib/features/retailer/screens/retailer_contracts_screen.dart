import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../models/retailer_session.dart';
import '../services/retailer_api_service.dart';
import '../widgets/record_payment_dialog.dart';

class RetailerContractsScreen extends StatefulWidget {
  final RetailerSession session;

  const RetailerContractsScreen({
    super.key,
    required this.session,
  });

  @override
  State<RetailerContractsScreen> createState() => _RetailerContractsScreenState();
}

class _RetailerContractsScreenState extends State<RetailerContractsScreen> with SingleTickerProviderStateMixin {
  final _apiService = RetailerApiService();
  late TabController _tabController;

  List<Map<String, dynamic>> _contracts = [];
  List<Map<String, dynamic>> _payments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final contracts = await _apiService.getRetailerContracts(
        widget.session.retailerId,
        token: widget.session.token,
      );
      final payments = await _apiService.getRetailerPayments(
        widget.session.retailerId,
        token: widget.session.token,
      );
      if (mounted) {
        setState(() {
          _contracts = contracts;
          _payments = payments;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openPaymentDialog(Map<String, dynamic> contract) {
    showDialog(
      context: context,
      builder: (_) => RecordPaymentDialog(
        contract: contract,
        performerName: widget.session.ownerName.isNotEmpty ? widget.session.ownerName : widget.session.name,
        onPaymentRecorded: _fetchData,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Contracts & Payments',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF475569)),
            onPressed: _fetchData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.tealPrimary,
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: AppTheme.tealPrimary,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: [
            Tab(text: 'Contracts (${_contracts.length})'),
            Tab(text: 'Payment Receipts (${_payments.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.tealPrimary))
          : TabBarView(
              controller: _tabController,
              children: [
                // Contracts Tab
                _buildContractsTab(),

                // Payments Tab
                _buildPaymentsTab(),
              ],
            ),
    );
  }

  Widget _buildContractsTab() {
    if (_contracts.isEmpty) {
      return const Center(
        child: Text('No active contracts found.', style: TextStyle(color: Color(0xFF64748B))),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      color: AppTheme.tealPrimary,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _contracts.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final c = _contracts[index];
          final customerName = c['customerName']?.toString() ?? 'Customer';
          final deviceModel = c['deviceModel']?.toString() ?? 'Device';
          final contractId = c['contractId']?.toString() ?? c['id']?.toString() ?? '';
          final total = (c['totalPrice'] as num?)?.toDouble() ?? 0.0;
          final remaining = (c['remainingBalance'] as num?)?.toDouble() ?? 0.0;
          final monthly = (c['monthlyInstallment'] as num?)?.toDouble() ?? 0.0;
          final status = c['status']?.toString().toUpperCase() ?? 'ACTIVE';
          final isCompleted = status == 'COMPLETED' || remaining <= 0;

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      customerName,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isCompleted ? const Color(0xFFDCFCE7) : const Color(0xFFF0FDFA),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isCompleted ? 'PAID IN FULL' : 'ACTIVE PLAN',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: isCompleted ? AppTheme.successGreen : AppTheme.tealPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                Text('$deviceModel • Contract: $contractId', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                const Divider(height: 18, color: Color(0xFFF1F5F9)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Plan', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                        Text('Rs. ${total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Monthly Installment', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                        Text('Rs. ${monthly.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('Remaining Due', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                        Text(
                          'Rs. ${remaining.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: remaining > 0 ? AppTheme.dangerRed : AppTheme.successGreen,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                if (!isCompleted) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _openPaymentDialog(c),
                      icon: const Icon(Icons.add_card_rounded, size: 16),
                      label: const Text('Record Payment'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.tealPrimary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPaymentsTab() {
    if (_payments.isEmpty) {
      return const Center(
        child: Text('No recorded payments yet.', style: TextStyle(color: Color(0xFF64748B))),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      color: AppTheme.tealPrimary,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _payments.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final p = _payments[index];
          final customerName = p['customerName']?.toString() ?? 'Customer';
          final amount = (p['amount'] as num?)?.toDouble() ?? 0.0;
          final method = p['method']?.toString() ?? 'Cash';
          final ref = p['reference']?.toString() ?? '';
          final date = p['paymentDate']?.toString().split('T').first ?? '';

          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.check_circle_rounded, color: AppTheme.successGreen, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(customerName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      Text('$method • Ref: $ref • $date', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                    ],
                  ),
                ),
                Text(
                  '+ Rs. ${amount.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.successGreen),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
