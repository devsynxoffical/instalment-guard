import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../models/retailer_session.dart';
import '../services/retailer_api_service.dart';
import '../widgets/enrollment_qr_dialog.dart';
import 'defaulter_check_screen.dart';
import 'retailer_device_detail_screen.dart';

class RetailerDashboardScreen extends StatefulWidget {
  final RetailerSession session;
  final VoidCallback onNavigateToEnroll;
  final VoidCallback onNavigateToDevices;
  final VoidCallback onNavigateToContracts;
  final VoidCallback onRefreshRequested;

  const RetailerDashboardScreen({
    super.key,
    required this.session,
    required this.onNavigateToEnroll,
    required this.onNavigateToDevices,
    required this.onNavigateToContracts,
    required this.onRefreshRequested,
  });

  @override
  State<RetailerDashboardScreen> createState() => _RetailerDashboardScreenState();
}

class _RetailerDashboardScreenState extends State<RetailerDashboardScreen> {
  final _apiService = RetailerApiService();
  List<Map<String, dynamic>> _devices = [];
  List<Map<String, dynamic>> _payments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final devices = await _apiService.getRetailerDevices(
        widget.session.retailerId,
        token: widget.session.token,
      );
      final payments = await _apiService.getRetailerPayments(
        widget.session.retailerId,
        token: widget.session.token,
      );

      if (mounted) {
        setState(() {
          _devices = devices;
          _payments = payments;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showZeroTouchQr() {
    final qrPayload = _apiService.buildProvisioningQrPayload(
      retailerId: widget.session.retailerId,
    );

    showDialog(
      context: context,
      builder: (_) => EnrollmentQrDialog(
        qrData: qrPayload,
        customerName: widget.session.businessName,
        deviceModel: 'Android Enterprise Device Owner',
        deviceId: 'PROVISIONING-QR',
        contractId: widget.session.retailerId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.session;
    final totalEnrolled = _devices.length;
    final activeCount = _devices.where((d) => d['isRestricted'] != true).length;
    final lockedCount = _devices.where((d) => d['isRestricted'] == true).length;
    final totalCollected = _payments.fold<double>(
      0.0,
      (sum, p) => sum + ((p['amount'] as num?)?.toDouble() ?? 0.0),
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.tealPrimary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.storefront_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.businessName,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${s.city} • ID: ${s.retailerId}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF475569)),
            onPressed: () {
              widget.onRefreshRequested();
              _loadDashboardData();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          widget.onRefreshRequested();
          await _loadDashboardData();
        },
        color: AppTheme.tealPrimary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // License Credits Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF115E59)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F766E).withValues(alpha: 0.25),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'LICENSE CREDITS',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFCCFBF1),
                                letterSpacing: 0.8,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Enrollment Balance',
                              style: TextStyle(fontSize: 13, color: Colors.white70),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.monetization_on_rounded, color: Colors.amber, size: 20),
                              const SizedBox(width: 6),
                              Text(
                                '${s.credits}',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Divider(color: Colors.white24, height: 1),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFCCFBF1)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Each mobile enrollment consumes 1 credit. ${s.credits > 0 ? "You can enroll ${s.credits} more customer phones." : "Credits exhausted. Contact Super Admin."}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFFE2E8F0)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // KPI Statistics Grid
              Row(
                children: [
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Total Enrolled',
                      value: '$totalEnrolled',
                      subtitle: 'Customer Mobiles',
                      icon: Icons.smartphone_rounded,
                      color: const Color(0xFF0284C7),
                      onTap: widget.onNavigateToDevices,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Protected Active',
                      value: '$activeCount',
                      subtitle: 'Compliant phones',
                      icon: Icons.check_circle_rounded,
                      color: AppTheme.successGreen,
                      onTap: widget.onNavigateToDevices,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Locked / Overdue',
                      value: '$lockedCount',
                      subtitle: 'Restriction active',
                      icon: Icons.lock_clock_rounded,
                      color: AppTheme.dangerRed,
                      onTap: widget.onNavigateToDevices,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Revenue Collected',
                      value: 'Rs. ${(totalCollected / 1000).toStringAsFixed(1)}k',
                      subtitle: '${_payments.length} Payments',
                      icon: Icons.account_balance_wallet_rounded,
                      color: const Color(0xFF0D9488),
                      onTap: widget.onNavigateToContracts,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Quick Actions Bar
              const Text(
                'Quick Actions',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      icon: Icons.add_rounded,
                      label: 'Add Mobile',
                      isPrimary: true,
                      onTap: widget.onNavigateToEnroll,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildActionButton(
                      icon: Icons.qr_code_2_rounded,
                      label: 'Setup QR',
                      onTap: _showZeroTouchQr,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildActionButton(
                      icon: Icons.security_rounded,
                      label: 'Fraud Check',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const DefaulterCheckScreen()),
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Recent Mobiles Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recently Enrolled Mobiles',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  TextButton(
                    onPressed: widget.onNavigateToDevices,
                    child: const Text('View All', style: TextStyle(fontSize: 12, color: AppTheme.tealPrimary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 4),

              if (_isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppTheme.tealPrimary)))
              else if (_devices.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.phone_android_rounded, size: 36, color: Colors.grey.shade400),
                      const SizedBox(height: 8),
                      const Text(
                        'No enrolled mobiles yet',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Tap "Add Mobile" above to enroll your first customer device.',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _devices.take(4).length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final dev = _devices[index];
                    final isRestricted = dev['isRestricted'] == true;
                    final model = dev['model']?.toString() ?? 'Mobile Device';
                    final customer = dev['customerName']?.toString() ?? 'Customer';
                    final remaining = (dev['remainingBalance'] as num?)?.toDouble() ?? 0.0;

                    return InkWell(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => RetailerDeviceDetailScreen(
                              initialDevice: dev,
                              session: widget.session,
                              onDataChanged: _loadDashboardData,
                            ),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isRestricted ? Colors.red.shade50 : Colors.teal.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                isRestricted ? Icons.lock_rounded : Icons.phone_android_rounded,
                                color: isRestricted ? AppTheme.dangerRed : AppTheme.tealPrimary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    model,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                  ),
                                  Text(
                                    customer,
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isRestricted ? const Color(0xFFFEE2E8) : const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    isRestricted ? 'LOCKED' : 'ACTIVE',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: isRestricted ? AppTheme.dangerRed : AppTheme.successGreen,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Rs. ${remaining.toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
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
                Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                Icon(icon, size: 16, color: color),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    bool isPrimary = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isPrimary ? AppTheme.tealPrimary : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isPrimary ? AppTheme.tealPrimary : const Color(0xFFE2E8F0)),
          boxShadow: isPrimary
              ? [
                  BoxShadow(
                    color: AppTheme.tealPrimary.withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: isPrimary ? Colors.white : const Color(0xFF334155)),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isPrimary ? Colors.white : const Color(0xFF334155),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
