import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../models/retailer_session.dart';
import '../services/retailer_api_service.dart';
import 'retailer_dashboard_screen.dart';
import 'retailer_devices_screen.dart';
import 'enroll_mobile_screen.dart';
import 'retailer_contracts_screen.dart';
import 'retailer_profile_screen.dart';

class RetailerMainShell extends StatefulWidget {
  final RetailerSession initialSession;

  const RetailerMainShell({
    super.key,
    required this.initialSession,
  });

  @override
  State<RetailerMainShell> createState() => _RetailerMainShellState();
}

class _RetailerMainShellState extends State<RetailerMainShell> {
  final _apiService = RetailerApiService();
  late RetailerSession _session;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _session = widget.initialSession;
    _refreshSession();
  }

  Future<void> _refreshSession() async {
    try {
      final updated = await _apiService.refreshSession(_session);
      if (updated != null && mounted) {
        setState(() => _session = updated);
      }
    } catch (_) {}
  }

  void _onTabSelected(int index) {
    setState(() => _currentIndex = index);
    if (index == 0 || index == 4) {
      _refreshSession();
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      RetailerDashboardScreen(
        session: _session,
        onNavigateToEnroll: () => _onTabSelected(2),
        onNavigateToDevices: () => _onTabSelected(1),
        onNavigateToContracts: () => _onTabSelected(3),
        onRefreshRequested: _refreshSession,
      ),
      RetailerDevicesScreen(
        session: _session,
        onAddMobileRequested: () => _onTabSelected(2),
      ),
      EnrollMobileScreen(
        session: _session,
        onEnrolled: () {
          _refreshSession();
          _onTabSelected(1); // Navigate to devices list to see the newly enrolled mobile
        },
      ),
      RetailerContractsScreen(
        session: _session,
      ),
      RetailerProfileScreen(
        session: _session,
        onProfileUpdated: _refreshSession,
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200, width: 1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabSelected,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppTheme.tealPrimary,
          unselectedItemColor: const Color(0xFF94A3B8),
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_rounded),
              activeIcon: Icon(Icons.dashboard_rounded, color: AppTheme.tealPrimary),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.smartphone_rounded),
              activeIcon: Icon(Icons.smartphone_rounded, color: AppTheme.tealPrimary),
              label: 'Mobiles',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_circle_rounded, size: 28),
              activeIcon: Icon(Icons.add_circle_rounded, size: 28, color: AppTheme.tealPrimary),
              label: 'Add Mobile',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_rounded),
              activeIcon: Icon(Icons.receipt_long_rounded, color: AppTheme.tealPrimary),
              label: 'Ledger',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.store_rounded),
              activeIcon: Icon(Icons.store_rounded, color: AppTheme.tealPrimary),
              label: 'Store',
            ),
          ],
        ),
      ),
    );
  }
}
