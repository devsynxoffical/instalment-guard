import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../models/retailer_session.dart';
import '../services/retailer_api_service.dart';
import 'retailer_device_detail_screen.dart';

class RetailerDevicesScreen extends StatefulWidget {
  final RetailerSession session;
  final VoidCallback onAddMobileRequested;

  const RetailerDevicesScreen({
    super.key,
    required this.session,
    required this.onAddMobileRequested,
  });

  @override
  State<RetailerDevicesScreen> createState() => _RetailerDevicesScreenState();
}

class _RetailerDevicesScreenState extends State<RetailerDevicesScreen> {
  final _apiService = RetailerApiService();
  final _searchController = TextEditingController();

  List<Map<String, dynamic>> _devices = [];
  bool _isLoading = true;
  String _filterStatus = 'ALL'; // ALL | ACTIVE | RESTRICTED | COMPLETED

  @override
  void initState() {
    super.initState();
    _fetchDevices();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDevices() async {
    setState(() => _isLoading = true);
    try {
      final list = await _apiService.getRetailerDevices(
        widget.session.retailerId,
        token: widget.session.token,
      );
      if (mounted) {
        setState(() {
          _devices = list;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredDevices {
    final query = _searchController.text.trim().toLowerCase();
    return _devices.where((d) {
      // Filter status
      final isRestricted = d['isRestricted'] == true;
      final devStatus = d['deviceStatus']?.toString().toUpperCase() ?? 'ACTIVE';

      if (_filterStatus == 'ACTIVE' && isRestricted) return false;
      if (_filterStatus == 'RESTRICTED' && !isRestricted) return false;
      if (_filterStatus == 'COMPLETED' && devStatus != 'COMPLETED') return false;

      // Filter query
      if (query.isNotEmpty) {
        final model = d['model']?.toString().toLowerCase() ?? '';
        final brand = d['brand']?.toString().toLowerCase() ?? '';
        final cust = d['customerName']?.toString().toLowerCase() ?? '';
        final phone = d['customerPhone']?.toString().toLowerCase() ?? '';
        final imei = d['imei']?.toString().toLowerCase() ?? '';
        return model.contains(query) ||
            brand.contains(query) ||
            cust.contains(query) ||
            phone.contains(query) ||
            imei.contains(query);
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredDevices;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Enrolled Mobiles',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppTheme.tealPrimary),
            tooltip: 'Add Mobile',
            onPressed: widget.onAddMobileRequested,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF475569)),
            onPressed: _fetchDevices,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Column(
              children: [
                // Search Input
                TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () => setState(() => _searchController.clear()),
                          )
                        : null,
                    hintText: 'Search by model, customer, IMEI or phone...',
                    hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.tealPrimary, width: 1.5),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Status Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('ALL', 'All Mobiles (${_devices.length})'),
                      const SizedBox(width: 6),
                      _buildFilterChip('ACTIVE', 'Active (${_devices.where((d) => d['isRestricted'] != true).length})'),
                      const SizedBox(width: 6),
                      _buildFilterChip('RESTRICTED', 'Locked / Overdue (${_devices.where((d) => d['isRestricted'] == true).length})'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Devices List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.tealPrimary))
                : list.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.phone_android_rounded, size: 54, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              const Text(
                                'No enrolled mobiles found',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _searchController.text.isNotEmpty
                                    ? 'No mobiles match your search filter.'
                                    : 'Start by adding and enrolling customer mobile devices.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                              ),
                              const SizedBox(height: 18),
                              ElevatedButton.icon(
                                onPressed: widget.onAddMobileRequested,
                                icon: const Icon(Icons.add_rounded, size: 18),
                                label: const Text('Add New Mobile'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.tealPrimary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchDevices,
                        color: AppTheme.tealPrimary,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: list.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final device = list[index];
                            final isRestricted = device['isRestricted'] == true;
                            final model = device['model']?.toString() ?? 'Mobile Device';
                            final brand = device['brand']?.toString() ?? device['manufacturer']?.toString() ?? 'Android';
                            final customerName = device['customerName']?.toString() ?? 'Customer';
                            final customerPhone = device['customerPhone']?.toString() ?? '';
                            final imei = device['imei']?.toString() ?? '';
                            final remaining = (device['remainingBalance'] as num?)?.toDouble() ?? 0.0;
                            final battery = device['batteryLevel'] != null ? '${device['batteryLevel']}%' : null;

                            return InkWell(
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => RetailerDeviceDetailScreen(
                                      initialDevice: device,
                                      session: widget.session,
                                      onDataChanged: _fetchDevices,
                                    ),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isRestricted ? Colors.red.shade200 : const Color(0xFFE2E8F0),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Mobile Icon
                                        Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: isRestricted ? Colors.red.shade50 : Colors.teal.shade50,
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Icon(
                                            isRestricted ? Icons.lock_rounded : Icons.smartphone_rounded,
                                            color: isRestricted ? AppTheme.dangerRed : AppTheme.tealPrimary,
                                            size: 24,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Flexible(
                                                    child: Text(
                                                      model,
                                                      style: const TextStyle(
                                                        fontSize: 14,
                                                        fontWeight: FontWeight.bold,
                                                        color: Color(0xFF0F172A),
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: isRestricted ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                                                      borderRadius: BorderRadius.circular(6),
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
                                                ],
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                '$brand • IMEI: $imei',
                                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                'Customer: $customerName ${customerPhone.isNotEmpty ? '($customerPhone)' : ''}',
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const Divider(height: 18, color: Color(0xFFF1F5F9)),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Balance: Rs. ${remaining.toStringAsFixed(0)}',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: remaining > 0 ? const Color(0xFF0F172A) : AppTheme.successGreen,
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            if (battery != null) ...[
                                              const Icon(Icons.battery_std_rounded, size: 14, color: Color(0xFF64748B)),
                                              Text(battery, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                              const SizedBox(width: 8),
                                            ],
                                            const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF94A3B8)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _filterStatus == key;
    return InkWell(
      onTap: () => setState(() => _filterStatus = key),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.tealPrimary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }
}
