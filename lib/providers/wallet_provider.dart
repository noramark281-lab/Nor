import 'dart:async';
import 'package:flutter/material.dart';
import '../services/mexc_api_service.dart';
import '../services/api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// Wallet Provider - إدارة المحفظة الحقيقية في MEXC
/// ═══════════════════════════════════════════════════════════════════
class WalletProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();

  // ── Balances ────────────────────────────────────────────────────
  Map<String, Map<String, double>> _balances = {};
  double _totalUsdtValue = 0.0;
  double _availableUsdt = 0.0;
  double _lockedUsdt = 0.0;

  // ── Orders ──────────────────────────────────────────────────────
  List<Map<String, dynamic>> _openOrders = [];

  // ── Trades ──────────────────────────────────────────────────────
  List<Map<String, dynamic>> _recentTrades = [];

  // ── State ───────────────────────────────────────────────────────
  bool _loading = false;
  String? _error;
  bool _isInitialized = false;
  Timer? _syncTimer;

  // Per-operation error tracking
  String? _balanceError;
  String? _ordersError;
  String? _tradesError;

  // ── Getters ─────────────────────────────────────────────────────
  Map<String, Map<String, double>> get balances => _balances;
  double get totalUsdtValue => _totalUsdtValue;
  double get availableUsdt => _availableUsdt;
  double get lockedUsdt => _lockedUsdt;
  List<Map<String, dynamic>> get openOrders => _openOrders;
  List<Map<String, dynamic>> get recentTrades => _recentTrades;
  bool get loading => _loading;
  String? get error => _error;
  String? get balanceError => _balanceError;
  String? get ordersError => _ordersError;
  String? get tradesError => _tradesError;
  bool get isInitialized => _isInitialized;

  /// قائمة الأصول مع قيمها (للعرض)
  List<Map<String, dynamic>> get assetList {
    final list = <Map<String, dynamic>>[];
    _balances.forEach((asset, data) {
      final free = data['free'] ?? 0.0;
      final locked = data['locked'] ?? 0.0;
      final total = free + locked;
      if (total > 0) {
        list.add({
          'asset': asset,
          'free': free,
          'locked': locked,
          'total': total,
          'usdtValue': asset == 'USDT' ? total : 0.0,
        });
      }
    });
    list.sort((a, b) => (b['total'] as double).compareTo(a['total'] as double));
    return list;
  }

  // ── Initialization ──────────────────────────────────────────────
  Future<void> initialize() async {
    final apiReady = MexcApiManager().isInitialized;
    if (apiReady) {
      _isInitialized = true;
      await syncAll();
      _startAutoSync();
    } else {
      _isInitialized = false;
      _syncTimer?.cancel();
    }
  }

  void _startAutoSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (_isInitialized) syncAll();
    });
  }

  void stopAutoSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  @override
  void dispose() {
    stopAutoSync();
    super.dispose();
  }

  // ── Sync Methods ────────────────────────────────────────────────
  /// مزامنة كاملة للمحفظة — كل operation تُنفذ بشكل مستقل
  Future<void> syncAll() async {
    if (!MexcApiManager().isInitialized) {
      _error = 'مفاتيح API غير مفعلة';
      notifyListeners();
      return;
    }

    _loading = true;
    _error = null;
    _balanceError = null;
    _ordersError = null;
    _tradesError = null;
    notifyListeners();

    // Run each sync independently so failure in one doesn't block others
    final balanceFuture = _syncBalances().catchError((e) {
      _balanceError = 'خطأ في الأرصدة: $e';
      ApiLogger.e('WalletProvider', 'Balance sync failed: $e');
    });

    final ordersFuture = _syncOpenOrders().catchError((e) {
      _ordersError = 'خطأ في الأوامر: $e';
      ApiLogger.e('WalletProvider', 'Orders sync failed: $e');
    });

    final tradesFuture = _syncRecentTrades().catchError((e) {
      _tradesError = 'خطأ في الصفقات: $e';
      ApiLogger.e('WalletProvider', 'Trades sync failed: $e');
    });

    await Future.wait([balanceFuture, ordersFuture, tradesFuture]);

    // Build combined error if any
    final errors = <String>[];
    if (_balanceError != null) errors.add(_balanceError!);
    if (_ordersError != null) errors.add(_ordersError!);
    if (_tradesError != null) errors.add(_tradesError!);
    if (errors.isNotEmpty) {
      _error = errors.join(' | ');
    }

    _isInitialized = true;
    _loading = false;
    notifyListeners();
  }

  /// مزامنة الأرصدة
  Future<void> _syncBalances() async {
    _balances = await _api.getRealBalances();
    _calculateTotals();
  }

  void _calculateTotals() {
    _availableUsdt = _balances['USDT']?['free'] ?? 0.0;
    _lockedUsdt = _balances['USDT']?['locked'] ?? 0.0;
    _totalUsdtValue = _availableUsdt + _lockedUsdt;
    _balances.forEach((asset, data) {
      if (asset != 'USDT') {
        final total = (data['free'] ?? 0.0) + (data['locked'] ?? 0.0);
        _totalUsdtValue += total;
      }
    });
  }

  /// مزامنة الأوامر المفتوحة
  Future<void> _syncOpenOrders() async {
    _openOrders = await _api.getOpenOrders();
  }

  /// مزامنة الصفقات الأخيرة
  Future<void> _syncRecentTrades() async {
    _recentTrades = await _api.getAllMyTrades();
  }

  // ── Order Management ────────────────────────────────────────────
  Future<bool> cancelOrder(String symbol, String orderId) async {
    _loading = true;
    notifyListeners();

    try {
      final success = await _api.cancelOrder(symbol, orderId);
      if (success) {
        await _syncOpenOrders();
        await _syncBalances();
      }
      return success;
    } catch (e) {
      _error = 'فشل إلغاء الأمر: $e';
      notifyListeners();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// إلغاء جميع الأوامر المفتوحة
  Future<int> cancelAllOpenOrders() async {
    int cancelled = 0;
    for (final order in List<Map<String, dynamic>>.from(_openOrders)) {
      final symbol = order['symbol']?.toString() ?? '';
      final orderId = order['orderId']?.toString() ?? '';
      if (symbol.isNotEmpty && orderId.isNotEmpty) {
        final ok = await _api.cancelOrder(symbol, orderId);
        if (ok) cancelled++;
        await Future.delayed(const Duration(milliseconds: 200));
      }
    }
    await syncAll();
    return cancelled;
  }

  // ── Helpers ─────────────────────────────────────────────────────
  String formatAssetValue(double value) {
    if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(2)}M';
    if (value >= 1000) return '${(value / 1000).toStringAsFixed(2)}K';
    return value.toStringAsFixed(value < 1 ? 6 : 2);
  }

  String getOrderSideColor(String side) {
    return side.toUpperCase() == 'BUY' ? '0xFF00C087' : '0xFFFF3B30';
  }
}
