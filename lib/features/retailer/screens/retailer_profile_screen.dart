import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';
import '../../setup/screens/device_ready_screen.dart';
import '../../setup/screens/device_restricted_screen.dart';
import '../../../services/device_management/device_management_service.dart';
import '../models/retailer_session.dart';
import '../services/retailer_api_service.dart';
import 'retailer_login_screen.dart';

class RetailerProfileScreen extends StatefulWidget {
  final RetailerSession session;
  final VoidCallback onProfileUpdated;

  const RetailerProfileScreen({
    super.key,
    required this.session,
    required this.onProfileUpdated,
  });

  @override
  State<RetailerProfileScreen> createState() => _RetailerProfileScreenState();
}

class _RetailerProfileScreenState extends State<RetailerProfileScreen> {
  final _apiService = RetailerApiService();
  final _customIpController = TextEditingController();
  bool _isSavingIp = false;

  @override
  void initState() {
    super.initState();
    _loadCustomIp();
  }

  @override
  void dispose() {
    _customIpController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomIp() async {
    final prefs = await SharedPreferences.getInstance();
    final custom = prefs.getString('custom_server_ip');
    if (custom != null && mounted) {
      _customIpController.text = custom;
    }
  }

  Future<void> _saveCustomIp() async {
    setState(() => _isSavingIp = true);
    final prefs = await SharedPreferences.getInstance();
    final val = _customIpController.text.trim();
    if (val.isEmpty) {
      await prefs.remove('custom_server_ip');
    } else {
      await prefs.setString('custom_server_ip', val);
      _apiService.setBaseUrl(val);
    }
    setState(() => _isSavingIp = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppTheme.tealPrimary,
          content: Text('Server connection endpoint updated.'),
        ),
      );
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out?', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to sign out of this partner store account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.dangerRed,
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _apiService.logout();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const RetailerLoginScreen()),
          (route) => false,
        );
      }
    }
  }

  void _switchToCustomerMode() {
    final isRestricted = DeviceManagementService.restrictionNotifier.value;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => isRestricted ? const DeviceRestrictedScreen() : const DeviceReadyScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.session;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Store Profile & Settings',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Store Profile Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: AppTheme.tealPrimary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.store_rounded, color: Colors.white, size: 36),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    s.businessName,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  Text(
                    'Partner Store ID: ${s.retailerId}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFFF1F5F9)),
                  _buildProfileRow(Icons.person_outline_rounded, 'Owner Name', s.ownerName.isNotEmpty ? s.ownerName : s.name),
                  _buildProfileRow(Icons.email_outlined, 'Store Email', s.email),
                  _buildProfileRow(Icons.phone_outlined, 'Contact Phone', s.phone.isNotEmpty ? s.phone : 'Not set'),
                  _buildProfileRow(Icons.location_city_rounded, 'City', s.city),
                  _buildProfileRow(Icons.place_outlined, 'Outlet Address', s.address.isNotEmpty ? s.address : 'Main Store Outlet'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // License Credits Info Card
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
                  Row(
                    children: [
                      const Icon(Icons.monetization_on_rounded, size: 20, color: Colors.amber),
                      const SizedBox(width: 8),
                      const Text('License Credits Balance', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Text(
                          '${s.credits} Credits',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.amber.shade900),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Each mobile phone enrollment consumes 1 credit. Additional credits are allocated directly by Super Admin HQ.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF64748B), height: 1.3),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Server Connection Settings
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
                      Icon(Icons.dns_rounded, size: 18, color: AppTheme.tealPrimary),
                      SizedBox(width: 8),
                      Text('Backend API Endpoint', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Default: Railway Production Cloud. To test locally with your laptop, enter your IP address (e.g. http://192.168.1.10:5000):',
                    style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _customIpController,
                          decoration: InputDecoration(
                            hintText: 'https://instalment-guard-production-8ff6.up.railway.app/api',
                            hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.tealPrimary, width: 1.5)),
                          ),
                          style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _isSavingIp ? null : _saveCustomIp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.tealPrimary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                        child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Switch to Customer Guard Mode
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.phone_android_rounded, color: Color(0xFF475569)),
                ),
                title: const Text('Customer Phone Guard Mode', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                subtitle: const Text('View the client lock overlay & status screen', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                onTap: _switchToCustomerMode,
              ),
            ),
            const SizedBox(height: 20),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _handleLogout,
                icon: const Icon(Icons.logout_rounded, color: AppTheme.dangerRed, size: 18),
                label: const Text('Sign Out of Retailer App', style: TextStyle(color: AppTheme.dangerRed, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFFECDD3)),
                  backgroundColor: const Color(0xFFFFF1F2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF64748B)),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}
