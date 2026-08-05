import 'dart:async';
import 'package:flutter/material.dart';
import '../services/mexc_api_service.dart';
import '../services/api_logger.dart';

class WalletProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();

  Map<String, Map<String, double>> _balances = {};
  List<Map<String, dynamic>> _openOrders = [];
  List<Map<String, dynamic>> _recentTrades = [];
  List<Map<String, dynamic>> _positions = [];
  bool _loading = false;
  String? _error;
  String _selectedCurrency = 'USDT';
  Map<String, dynamic>? _depositAddress;

  Map<String, Map<String, double>> get balances => _balances;
  List<Map<String, dynamic>> get openOrders => _openOrders;
  List<Map<String, dynamic>> get recentTrades => _recentTrades;
  List<Map<String, dynamic>> get positions => _positions;
  bool get loading => _loading;
  String? get error => _error;
  String get selectedCurrency => _selectedCurrency;
  Map<String, dynamic>? get depositAddress => _depositAddress;

  double get totalBalance {
    return _balances.values.fold(0.0, (sum, b) => sum + (b['free'] ?? 0) + (b['locked'] ?? 0));
  }

  double get usdtBalance => _balances['USDT']?['free'] ?? 0.0;

  // ── getters for UI screens ──
  double get totalUsdtValue => _balances['USDT']?['free'] ?? 0.0;
  double get availableUsdt => _balances['USDT']?['free'] ?? 0.0;
  double get lockedUsdt => _balances['USDT']?['locked'] ?? 0.0;

  List<Map<String, dynamic>> get assetList {
    return _balances.entries.map((e) {
      final free = e.value['free'] ?? 0.0;
      final locked = e.value['locked'] ?? 0.0;
      return {
        'asset': e.key,
        'free': free,
        'locked': locked,
        'total': free + locked,
      };
    }).toList();
  }

  String formatAssetValue(double value) {
    if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(2)}M';
    if (value >= 1000) return '${(value / 1000).toStringAsFixed(2)}K';
    return value.toStringAsFixed(4);
  }

  Future<void> initialize() async {
    await refreshAll();
  }

  Future<void> syncAll() async => refreshAll();

  Future<void> refreshAll() async {
    _loading = true;
    _error = null;
    notifyListeners();
    await Future.wait([_syncBalances(), _syncOpenOrders(), _syncRecentTrades(), _syncPositions()]);
    _loading = false;
    notifyListeners();
  }

  Future<void> _syncBalances() async {
    try {
      _balances = await _api.getRealBalances();
      ApiLogger.i('WalletProvider', 'Balances synced: ${_balances.length} assets');
    } catch (e) {
      ApiLogger.e('WalletProvider', 'Balance sync failed: $e');
      _error = 'فشل تحديث الرصيد: $e';
    }
  }

  Future<void> _syncOpenOrders() async {
    try {
      _openOrders = await _api.getOpenOrders();
      ApiLogger.i('WalletProvider', 'Open orders synced: ${_openOrders.length}');
    } catch (e) {
      ApiLogger.e('WalletProvider', 'Open orders sync failed: $e');
    }
  }

  Future<void> _syncRecentTrades() async {
    try {
      _recentTrades = await _api.getAllMyTrades();
      ApiLogger.i('WalletProvider', 'Trades synced: ${_recentTrades.length}');
    } catch (e) {
      ApiLogger.e('WalletProvider', 'Trades sync failed: $e');
    }
  }

  Future<void> _syncPositions() async {
    try {
      _positions = await _api.getPositions('BTC_USDT');
      ApiLogger.i('WalletProvider', 'Positions synced: ${_positions.length}');
    } catch (e) {
      ApiLogger.e('WalletProvider', 'Positions sync failed: $e');
    }
  }

  Future<bool> cancelOrder(String symbol, String orderId) async {
    try {
      final success = await _api.cancelOrder(symbol, orderId);
      if (success) {
        await _syncOpenOrders();
        notifyListeners();
      }
      return success;
    } catch (e) {
      _error = 'فشل إلغاء الأمر: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchDepositAddress(String currency) async {
    _selectedCurrency = currency;
    try {
      _depositAddress = await _api.getDepositAddress(currency);
      notifyListeners();
    } catch (e) {
      _error = 'فشل جلب عنوان الإيداع: $e';
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
