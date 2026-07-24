import 'dart:async';
import 'package:flutter/material.dart';
import '../services/mexc_api_service.dart';
import '../services/api_manager.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final MexcApiService _api = MexcApiService();
  List<Map<String, dynamic>> _balances = [];
  Map<String, dynamic>? _accountInfo;
  bool _isLoading = true;
  String? _error;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      await MexcApiManager().initialize();
      if (MexcApiManager().isInitialized) {
        _accountInfo = await _api.getAccountInfo();
        _balances = await _api.getAllBalances();
      } else {
        _error = 'لم يتم إعداد مفاتيح API. اذهب إلى الإعدادات.';
      }
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) {
      setState(() => _isLoading = false);
    }
    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (_) => _refreshBalances());
  }

  Future<void> _refreshBalances() async {
    if (!MexcApiManager().isInitialized) return;
    try {
      final balances = await _api.getAllBalances();
      if (mounted) setState(() => _balances = balances);
    } catch (e) {
      // Silent refresh error
    }
  }

  double get _totalUSDT {
    double total = 0;
    for (var b in _balances) {
      if (b['asset'] == 'USDT') {
        total += (b['total'] as double);
      }
    }
    return total;
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('المحفظة'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildErrorState()
                : _buildWalletContent(),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadData,
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  Widget _buildWalletContent() {
    final usdtBalance = _balances.firstWhere(
      (b) => b['asset'] == 'USDT',
      orElse: () => {'asset': 'USDT', 'free': 0.0, 'locked': 0.0, 'total': 0.0},
    );

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // USDT Total Card
        _buildTotalCard(usdtBalance),
        const SizedBox(height: 16),

        // Account Info
        if (_accountInfo != null) _buildAccountInfoCard(),
        const SizedBox(height: 16),

        // Balances List
        _buildBalancesList(),
      ],
    );
  }

  Widget _buildTotalCard(Map<String, dynamic> usdt) {
    return Card(
      elevation: 4,
      color: const Color(0xFF00C087).withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'إجمالي الرصيد',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              '\$${(usdt['total'] as double).toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00C087),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'متاح: \$${(usdt['free'] as double).toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(width: 16),
                Text(
                  'محجوز: \$${(usdt['locked'] as double).toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 14, color: Colors.orange),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountInfoCard() {
    final canTrade = _accountInfo?['canTrade'] ?? false;
    final canWithdraw = _accountInfo?['canWithdraw'] ?? false;
    final accountType = _accountInfo?['accountType'] ?? 'unknown';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('معلومات الحساب', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildInfoRow('نوع الحساب', accountType.toString()),
            _buildInfoRow('التداول مسموح', canTrade ? 'نعم' : 'لا', color: canTrade ? Colors.green : Colors.red),
            _buildInfoRow('السحب مسموح', canWithdraw ? 'نعم' : 'لا', color: canWithdraw ? Colors.green : Colors.red),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildBalancesList() {
    // Sort: USDT first, then by total value descending
    final sorted = List<Map<String, dynamic>>.from(_balances)
      ..sort((a, b) {
        if (a['asset'] == 'USDT') return -1;
        if (b['asset'] == 'USDT') return 1;
        return (b['total'] as double).compareTo(a['total'] as double);
      });

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('الأصول', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          ...sorted.map((b) => ListTile(
            leading: CircleAvatar(
              radius: 18,
              backgroundColor: b['asset'] == 'USDT'
                  ? const Color(0xFF00C087).withOpacity(0.2)
                  : Colors.grey.withOpacity(0.2),
              child: Text(
                b['asset'].toString().substring(0, 1),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: b['asset'] == 'USDT' ? const Color(0xFF00C087) : Colors.grey,
                ),
              ),
            ),
            title: Text(b['asset'].toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(
              'متاح: ${(b['free'] as double).toStringAsFixed(6)}  |  محجوز: ${(b['locked'] as double).toStringAsFixed(6)}',
              style: const TextStyle(fontSize: 12),
            ),
            trailing: Text(
              (b['total'] as double).toStringAsFixed(b['asset'] == 'USDT' ? 2 : 6),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          )),
        ],
      ),
    );
  }
}
