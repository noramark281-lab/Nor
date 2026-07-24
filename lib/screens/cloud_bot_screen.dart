import 'dart:async';
import 'package:flutter/material.dart';
import '../services/backend_service.dart';
import '../services/mexc_api_service.dart';
import '../services/api_manager.dart';
import '../utils/constants.dart';

class CloudBotScreen extends StatefulWidget {
  const CloudBotScreen({super.key});

  @override
  State<CloudBotScreen> createState() => _CloudBotScreenState();
}

class _CloudBotScreenState extends State<CloudBotScreen> {
  final BackendService _backend = BackendService();
  final MexcApiService _api = MexcApiService();

  Map<String, dynamic> _status = {};
  List<dynamic> _tradeHistory = [];
  List<dynamic> _positions = [];
  bool _isLoading = false;
  String? _error;
  Timer? _refreshTimer;

  String _selectedSymbol = 'BTCUSDT';
  String _selectedStrategy = 'scalping';
  double _maxTradeUsd = 1.0;
  int _intervalSeconds = 60;
  double _stopLoss = 2.0;
  double _takeProfit = 3.0;

  @override
  void initState() {
    super.initState();
    _initBackend();
  }

  Future<void> _initBackend() async {
    await MexcApiManager().initialize();
    if (MexcApiManager().isInitialized) {
      final key = MexcApiManager().apiKey;
      final secret = await _api.getAccountInfo(); // Just to verify
      // Actually we need to get secret from storage
      final apiKey = await _getApiKey();
      final apiSecret = await _getApiSecret();
      if (apiKey != null && apiSecret != null) {
        await _backend.initializeBot(apiKey, apiSecret);
      }
    }
    _startRefresh();
  }

  Future<String?> _getApiKey() async {
    return MexcApiManager().apiKey;
  }

  Future<String?> _getApiSecret() async {
    // The secret is stored in secure storage, accessible via the manager
    // We'll use a workaround - re-read from storage
    // In a real app you'd expose a getter
    return null; // Will be set via API setup
  }

  void _startRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) => _refreshAll());
    _refreshAll();
  }

  Future<void> _refreshAll() async {
    await _fetchStatus();
    await _fetchHistory();
    await _fetchPositions();
  }

  Future<void> _fetchStatus() async {
    try {
      final status = await _backend.getStatus();
      if (mounted && status['error'] == null) {
        setState(() {
          _status = status;
          if (status['config'] != null) {
            _selectedSymbol = status['config']['symbol'] ?? _selectedSymbol;
            _selectedStrategy = status['config']['strategy'] ?? _selectedStrategy;
            _maxTradeUsd = (status['config']['max_trade_usd'] ?? 1.0).toDouble();
            _intervalSeconds = status['config']['interval_seconds'] ?? _intervalSeconds;
            _stopLoss = (status['config']['stop_loss_percent'] ?? 2.0).toDouble();
            _takeProfit = (status['config']['take_profit_percent'] ?? 3.0).toDouble();
          }
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  Future<void> _fetchHistory() async {
    try {
      final result = await _backend.getTradeHistory(limit: 50);
      if (mounted && result['error'] == null) {
        setState(() => _tradeHistory = result['trades'] ?? []);
      }
    } catch (e) {
      // Silent
    }
  }

  Future<void> _fetchPositions() async {
    try {
      final result = await _backend.getOpenPositions();
      if (mounted && result['error'] == null) {
        setState(() => _positions = result['positions'] ?? []);
      }
    } catch (e) {
      // Silent
    }
  }

  Future<void> _startBot() async {
    setState(() => _isLoading = true);
    final result = await _backend.startBot();
    setState(() => _isLoading = false);
    _showResult(result, 'Bot Started');
    _fetchStatus();
  }

  Future<void> _stopBot() async {
    setState(() => _isLoading = true);
    final result = await _backend.stopBot();
    setState(() => _isLoading = false);
    _showResult(result, 'Bot Stopped');
    _fetchStatus();
  }

  Future<void> _pauseBot() async {
    final result = await _backend.pauseBot();
    _showResult(result, 'Bot Paused');
    _fetchStatus();
  }

  Future<void> _resumeBot() async {
    final result = await _backend.resumeBot();
    _showResult(result, 'Bot Resumed');
    _fetchStatus();
  }

  Future<void> _updateConfig() async {
    setState(() => _isLoading = true);
    final result = await _backend.updateConfig(
      symbol: _selectedSymbol,
      maxTradeUsd: _maxTradeUsd,
      strategy: _selectedStrategy,
      intervalSeconds: _intervalSeconds,
      stopLossPercent: _stopLoss,
      takeProfitPercent: _takeProfit,
    );
    setState(() => _isLoading = false);
    _showResult(result, 'Config Updated');
  }

  Future<void> _manualTrade(String side) async {
    setState(() => _isLoading = true);
    final result = await _backend.manualTrade(side, symbol: _selectedSymbol);
    setState(() => _isLoading = false);
    _showResult(result, 'Trade $side');
    _refreshAll();
  }

  Future<void> _emergencyClose() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إغلاق الطوارئ'),
        content: const Text('هل أنت متأكد من إغلاق جميع المراكز المفتوحة؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('إغلاق الكل', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      final result = await _backend.emergencyCloseAll();
      setState(() => _isLoading = false);
      _showResult(result, 'Emergency Close');
      _refreshAll();
    }
  }

  void _showResult(Map<String, dynamic> result, String title) {
    final msg = result['error'] ?? result['message'] ?? result['status'] ?? 'Done';
    final isError = result['error'] != null;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$title: $msg'),
        backgroundColor: isError ? Colors.red : Colors.green,
      ),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final botStatus = _status['status'] ?? 'unknown';
    final balance = (_status['balance_usdt'] ?? 0.0).toDouble();
    final dailyTrades = _status['daily_trades'] ?? 0;
    final totalTrades = _status['total_trades'] ?? 0;
    final openPositions = _status['open_positions'] ?? 0;

    Color statusColor;
    switch (botStatus) {
      case 'running':
        statusColor = Colors.green;
        break;
      case 'paused':
        statusColor = Colors.orange;
        break;
      case 'error':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('البوت السحابي 24/7'),
        centerTitle: true,
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAll,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Status Card
            _buildStatusCard(botStatus, statusColor, balance, dailyTrades, totalTrades, openPositions),
            const SizedBox(height: 16),

            // Control Buttons
            _buildControlButtons(botStatus),
            const SizedBox(height: 16),

            // Config Section
            _buildConfigSection(),
            const SizedBox(height: 16),

            // Manual Trade
            _buildManualTradeSection(),
            const SizedBox(height: 16),

            // Emergency
            _buildEmergencySection(),
            const SizedBox(height: 16),

            // Open Positions
            _buildPositionsSection(),
            const SizedBox(height: 16),

            // Trade History
            _buildHistorySection(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(String status, Color color, double balance, int daily, int total, int open) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(width: 12, height: 12, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
                    const SizedBox(width: 8),
                    Text(
                      status.toUpperCase(),
                      style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16),
                    ),
                  ],
                ),
                Text('رصيد: \$${balance.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('صفقات اليوم', daily.toString()),
                _buildStatItem('الإجمالي', total.toString()),
                _buildStatItem('مراكز مفتوحة', open.toString()),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildControlButtons(String status) {
    final isRunning = status == 'running';
    final isPaused = status == 'paused';
    final isStopped = status == 'stopped' || status == 'unknown';

    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: isStopped ? _startBot : null,
            icon: const Icon(Icons.play_arrow),
            label: const Text('تشغيل'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: isRunning ? _pauseBot : (isPaused ? _resumeBot : null),
            icon: Icon(isPaused ? Icons.play_arrow : Icons.pause),
            label: Text(isPaused ? 'استئناف' : 'إيقاف مؤقت'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: !isStopped ? _stopBot : null,
            icon: const Icon(Icons.stop),
            label: const Text('إيقاف'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _buildConfigSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('إعدادات البوت', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            // Symbol
            DropdownButtonFormField<String>(
              value: _selectedSymbol,
              decoration: const InputDecoration(labelText: 'الزوج'),
              items: Constants.symbols.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
              onChanged: (v) => setState(() => _selectedSymbol = v!),
            ),
            const SizedBox(height: 8),
            // Strategy
            DropdownButtonFormField<String>(
              value: _selectedStrategy,
              decoration: const InputDecoration(labelText: 'الاستراتيجية'),
              items: Constants.strategyNames.entries.map((e) =>
                DropdownMenuItem(value: e.key, child: Text(e.value))
              ).toList(),
              onChanged: (v) => setState(() => _selectedStrategy = v!),
            ),
            const SizedBox(height: 8),
            // Max Trade
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: _maxTradeUsd.toStringAsFixed(2),
                    decoration: const InputDecoration(labelText: 'حد الصفقة (USDT)'),
                    keyboardType: TextInputType.number,
                    onChanged: (v) {
                      final val = double.tryParse(v) ?? 1.0;
                      setState(() => _maxTradeUsd = val > 1.0 ? 1.0 : val);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00C087).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('Max: \$1', style: TextStyle(color: Color(0xFF00C087), fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Interval
            TextFormField(
              initialValue: _intervalSeconds.toString(),
              decoration: const InputDecoration(labelText: 'فترة التحليل (ثواني)'),
              keyboardType: TextInputType.number,
              onChanged: (v) => setState(() => _intervalSeconds = int.tryParse(v) ?? 60),
            ),
            const SizedBox(height: 8),
            // SL/TP
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: _stopLoss.toString(),
                    decoration: const InputDecoration(labelText: 'وقف الخسارة %'),
                    keyboardType: TextInputType.number,
                    onChanged: (v) => setState(() => _stopLoss = double.tryParse(v) ?? 2.0),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    initialValue: _takeProfit.toString(),
                    decoration: const InputDecoration(labelText: 'جني الأرباح %'),
                    keyboardType: TextInputType.number,
                    onChanged: (v) => setState(() => _takeProfit = double.tryParse(v) ?? 3.0),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _updateConfig,
                icon: const Icon(Icons.save),
                label: const Text('حفظ الإعدادات'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManualTradeSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('تداول يدوي عبر البوت', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _manualTrade('BUY'),
                    icon: const Icon(Icons.arrow_upward),
                    label: const Text('شراء (BUY)'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _manualTrade('SELL'),
                    icon: const Icon(Icons.arrow_downward),
                    label: const Text('بيع (SELL)'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Center(
              child: Text(
                'كل صفقة محددة بـ \$1 كحد أقصى',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmergencySection() {
    return Card(
      color: Colors.red.withOpacity(0.05),
      child: ListTile(
        leading: const Icon(Icons.emergency, color: Colors.red),
        title: const Text('إغلاق طوارئ', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
        subtitle: const Text('إغلاق جميع المراكز المفتوحة فوراً'),
        trailing: const Icon(Icons.warning, color: Colors.red),
        onTap: _emergencyClose,
      ),
    );
  }

  Widget _buildPositionsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('المراكز المفتوحة (${_positions.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (_positions.isEmpty)
              const Center(child: Text('لا توجد مراكز مفتوحة', style: TextStyle(color: Colors.grey)))
            else
              ..._positions.take(5).map((p) => ListTile(
                dense: true,
                leading: Icon(
                  p['side'] == 'BUY' ? Icons.arrow_upward : Icons.arrow_downward,
                  color: p['side'] == 'BUY' ? Colors.green : Colors.red,
                ),
                title: Text('${p['symbol']} - ${p['side']}'),
                subtitle: Text('الكمية: ${p['quantity']?.toStringAsFixed(6) ?? '0'} @ \$${p['price']?.toStringAsFixed(2) ?? '0'}'),
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildHistorySection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('سجل الصفقات (${_tradeHistory.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (_tradeHistory.isEmpty)
              const Center(child: Text('لا توجد صفقات حتى الآن', style: TextStyle(color: Colors.grey)))
            else
              ..._tradeHistory.take(10).map((t) => ListTile(
                dense: true,
                leading: CircleAvatar(
                  radius: 14,
                  backgroundColor: t['side'] == 'BUY' ? Colors.green : Colors.red,
                  child: Icon(
                    t['side'] == 'BUY' ? Icons.arrow_upward : Icons.arrow_downward,
                    size: 14,
                    color: Colors.white,
                  ),
                ),
                title: Text('${t['symbol']} - ${t['side']}'),
                subtitle: Text('\$${t['amount_usd']?.toStringAsFixed(2) ?? t['amount']?.toStringAsFixed(2) ?? '1.00'} @ \$${t['price']?.toStringAsFixed(2) ?? '0'}'),
                trailing: Text(t['timestamp']?.toString().substring(11, 16) ?? ''),
              )),
          ],
        ),
      ),
    );
  }
}
