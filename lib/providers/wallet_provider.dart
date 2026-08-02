import 'dart:async';
import 'package:flutter/material.dart';
import '../services/mexc_api_service.dart';
import '../services/api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// Wallet Provider - إدارة المحفظة الحقيقية في MEXC
///
/// يوفر:
/// • رصد لحظي لأرصدة Spot
/// • الأوامر المفتوحة
/// • سجل الصفقات
/// • الربح/الخسارة الإجمالي
/// • مزامنة تلقائية دورية
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

  // ── Getters ─────────────────────────────────────────────────────
  Map<String, Map<String, double>> get balances => _balances;
  double get totalUsdtValue => _totalUsdtValue;
  double get availableUsdt => _availableUsdt;
  double get lockedUsdt => _lockedUsdt;
  List<Map<String, dynamic>> get openOrders => _openOrders;
  List<Map<String, dynamic>> get recentTrades => _recentTrades;
  bool get loading => _loading;
  String? get error => _error;
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
          'usdtValue': asset == 'USDT' ? total : 0.0, // ستُحسب لاحقاً
        });
      }
    });
    // ترتيب حسب القيمة
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
  /// مزامنة كاملة للمحفظة
  Future<void> syncAll() async {
    if (!MexcApiManager().isInitialized) {
      _error = 'مفاتيح API غير مفعلة';
      notifyListeners();
      return;
    }

    _loading = true;
    _error = null;
    notifyListeners();

    try {
      await Future.wait([
        _syncBalances(),
        _syncOpenOrders(),
        _syncRecentTrades(),
      ]);
      _isInitialized = true;
    } on MexcRateLimitException catch (e) {
      _error = 'تم تجاوز حد الطلبات: $e';
    } on MexcApiException catch (e) {
      _error = 'خطأ من MEXC: ${e.message}';
    } catch (e) {
      _error = 'خطأ في المزامنة: $e';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// مزامنة الأرصدة
  Future<void> _syncBalances() async {
    _balances = await _api.getRealBalances();
    _calculateTotals();
  }

  void _calculateTotals() {
    _availableUsdt = _balances['USDT']?['free'] ?? 0.0;
    _lockedUsdt = _balances['USDT']?['locked'] ?? 0.0;
    // تقدير إجمالي القيمة (USDT + قيمة الأصول الأخرى)
    _totalUsdtValue = _availableUsdt + _lockedUsdt;
    _balances.forEach((asset, data) {
      if (asset != 'USDT') {
        final total = (data['free'] ?? 0.0) + (data['locked'] ?? 0.0);
        // نفترض 1:1 للأصول غير المعروفة (في الإنتاج يجب ضربها بالسعر)
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
