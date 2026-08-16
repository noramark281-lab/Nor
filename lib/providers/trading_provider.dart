import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../models/trading_pair.dart';
import '../services/mexc_api_service.dart';
import '../services/api_manager.dart';

/// Trading Provider for REAL MEXC Spot trading.
/// Futures leverage/positions are intentionally not used.
class TradingProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();

  bool _isLoading = false;
  String? _lastError;
  String? _lastSuccess;
  Timer? _orderSyncTimer;
  Timer? _botTimer;
  final List<TradingPair> _pairs = [];
  String? _selectedSymbol = 'BTC_USDT';
  double _leverage = 1.0; // retained only for UI compatibility; Spot has no leverage
  double _availableBalance = 0.0;

  bool _isTrading = false;
  String _selectedStrategy = 'Hybrid';
  String? _lastSignal;
  int _consecutiveLosses = 0;
  double _balance = 0.0;

  final List<String> _availableStrategies = ['Hybrid', 'Momentum', 'Breakout', 'SMA Crossover', 'MeanReversion', 'Heikin Ashi', 'Sentiment'];
  final List<Map<String, dynamic>> _openOrders = [];
  final List<TradeRecord> _tradeHistory = [];
  final List<TradeRecord> _openTrades = [];
  final List<TradeRecord> _closedTrades = [];

  bool get isLoading => _isLoading;
  String? get lastError => _lastError;
  String? get lastSuccess => _lastSuccess;
  bool get loading => _isLoading;
  String? get error => _lastError;
  List<TradingPair> get pairs => List.unmodifiable(_pairs);
  String? get selectedSymbol => _selectedSymbol;
  TradingPair? get selectedPair => _pairs.isEmpty ? null : _pairs.firstWhere((p) => p.symbol == _selectedSymbol, orElse: () => _pairs.first);
  double get leverage => 1.0;
  double get availableBalance => _availableBalance;
  bool get isTrading => _isTrading;
  String get selectedStrategy => _selectedStrategy;
  String? get lastSignal => _lastSignal;
  int get consecutiveLosses => _consecutiveLosses;
  double get balance => _balance;
  List<String> get availableStrategies => _availableStrategies;
  List<TradeRecord> get tradeHistory => List.unmodifiable(_tradeHistory);
  List<TradeRecord> get openTrades => List.unmodifiable(_openTrades);
  List<TradeRecord> get closedTrades => List.unmodifiable(_closedTrades);
  List<Map<String, dynamic>> get openOrders => List.unmodifiable(_openOrders);

  double get totalProfit => _closedTrades.fold(0.0, (sum, t) => sum + (t.profit ?? 0));

  void startOrderSync() {
    _orderSyncTimer?.cancel();
    _orderSyncTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (MexcApiManager().isInitialized) syncOrders();
    });
  }

  void stopOrderSync() {
    _orderSyncTimer?.cancel();
    _orderSyncTimer = null;
  }

  Future<void> loadPairs() async {
    try {
      final tickers = await _api.getAllTickers24hr();
      _pairs.clear();
      for (final t in tickers) {
        final sym = t['symbol']?.toString() ?? '';
        if (sym.isEmpty) continue;
        final parts = sym.split('_');
        _pairs.add(TradingPair(
          symbol: sym,
          base: parts.first,
          quote: parts.length > 1 ? parts[1] : 'USDT',
          lastPrice: _parseDouble(t['lastPrice']),
          priceChangePercent: _parseDouble(t['priceChangePercent'] ?? t['riseFallRate']),
          volume24h: _parseDouble(t['volume24h']),
          category: 'Spot',
        ));
      }
      if (_pairs.isNotEmpty && !_pairs.any((p) => p.symbol == _selectedSymbol)) _selectedSymbol = _pairs.first.symbol;
      notifyListeners();
    } catch (e) {
      debugPrint('[TradingProvider] Spot loadPairs error: $e');
    }
  }

  void selectPair(String symbol) {
    _selectedSymbol = symbol;
    notifyListeners();
  }

  void setLeverage(double l) {
    _leverage = 1.0;
    notifyListeners();
  }

  Future<bool> placeOrder({required String type, required String side, required double price, required double quantity, required double leverage}) async {
    _leverage = 1.0;
    final symbol = _selectedSymbol ?? 'BTC_USDT';
    if (type.toLowerCase() == 'limit') {
      return placeLimitOrder(symbol: symbol, side: side, price: price, volume: 1.0);
    }
    final pair = selectedPair;
    final currentPrice = pair?.lastPrice ?? price;
    final contract = EventContract(symbol: symbol, name: symbol, category: 'Spot', strikePrice: currentPrice, currentPrice: currentPrice, priceChangePercent: pair?.priceChangePercent ?? 0, volume24h: pair?.volume24h ?? 0, expiryDate: DateTime.now());
    return side.toUpperCase() == 'BUY' ? executeBuy(contract, amount: 1.0) : executeSell(contract, amount: 1.0);
  }

  @override
  void dispose() {
    stopOrderSync();
    stopAutoTrading();
    super.dispose();
  }

  void selectStrategy(String strategy) {
    _selectedStrategy = strategy;
    notifyListeners();
  }

  void startAutoTrading() {
    _isTrading = true;
    notifyListeners();
    _botTimer?.cancel();
    _botTimer = Timer.periodic(const Duration(minutes: 2), (_) async {
      if (_isTrading) await runBotAutoTrade(_selectedStrategy);
    });
    runBotAutoTrade(_selectedStrategy);
  }

  void stopAutoTrading() {
    _isTrading = false;
    _botTimer?.cancel();
    _botTimer = null;
    notifyListeners();
  }

  Future<void> syncBalance() async {
    if (!MexcApiManager().isInitialized) return;
    try {
      final balances = await _api.getRealBalances();
      _availableBalance = balances['USDT']?['free'] ?? 0.0;
      _balance = _availableBalance + (balances['USDT']?['locked'] ?? 0.0);
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> executeBuy(EventContract contract, {required double amount, double? leverage}) async {
    _setLoading(true);
    _clearMessages();
    try {
      final result = await _api.placeOrder(symbol: contract.symbol, side: 'BUY', type: 'MARKET', volume: 1.0);
      _lastSuccess = '✅ تم تنفيذ شراء Spot حقيقي بقيمة 1 USDT: ${contract.symbol}';
      _lastSignal = 'BUY';
      _openTrades.add(TradeRecord(id: result?['orderId']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(), symbol: contract.symbol, side: 'BUY', amount: 1.0, entryPrice: contract.currentPrice, entryTime: DateTime.now(), status: 'OPEN', strategy: _selectedStrategy));
      await syncOrders();
      await syncBalance();
      return true;
    } catch (e) {
      _lastError = '❌ فشل شراء Spot ${contract.symbol}: $e';
      _consecutiveLosses++;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> executeSell(EventContract contract, {required double amount, double? leverage}) async {
    _setLoading(true);
    _clearMessages();
    try {
      final result = await _api.placeOrder(symbol: contract.symbol, side: 'SELL', type: 'MARKET', volume: 1.0);
      _lastSuccess = '✅ تم تنفيذ بيع Spot حقيقي بقيمة 1 USDT: ${contract.symbol}';
      _lastSignal = 'SELL';
      _openTrades.add(TradeRecord(id: result?['orderId']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(), symbol: contract.symbol, side: 'SELL', amount: 1.0, entryPrice: contract.currentPrice, entryTime: DateTime.now(), status: 'OPEN', strategy: _selectedStrategy));
      await syncOrders();
      await syncBalance();
      return true;
    } catch (e) {
      _lastError = '❌ فشل بيع Spot ${contract.symbol}: $e';
      _consecutiveLosses++;
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> closePosition(EventContract contract, {required double amount, required String currentSide}) async {
    final side = currentSide.toUpperCase().contains('BUY') ? 'SELL' : 'BUY';
    final ok = side == 'BUY' ? await executeBuy(contract, amount: 1.0) : await executeSell(contract, amount: 1.0);
    if (ok) {
      final idx = _openTrades.indexWhere((t) => t.symbol == contract.symbol && t.isOpen);
      if (idx >= 0) {
        final trade = _openTrades.removeAt(idx);
        _closedTrades.add(TradeRecord(id: trade.id, symbol: trade.symbol, side: trade.side, amount: trade.amount, entryPrice: trade.entryPrice, exitPrice: contract.currentPrice, entryTime: trade.entryTime, exitTime: DateTime.now(), status: 'CLOSED', profit: (contract.currentPrice - trade.entryPrice) * (trade.side == 'BUY' ? 1 : -1) * trade.amount, strategy: trade.strategy));
      }
      notifyListeners();
    }
    return ok;
  }

  Future<bool> placeLimitOrder({required String symbol, required String side, required double price, required double volume, double? leverage}) async {
    _setLoading(true);
    _clearMessages();
    try {
      await _api.placeOrder(symbol: symbol, side: side, type: 'LIMIT', volume: 1.0, price: price);
      _lastSuccess = '✅ تم وضع أمر Spot حقيقي بقيمة 1 USDT: $side $symbol @ $price';
      await syncOrders();
      return true;
    } catch (e) {
      _lastError = '❌ فشل أمر Spot $side $symbol: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> cancelOrder(String symbol, String orderId) async {
    _setLoading(true);
    _clearMessages();
    try {
      final ok = await _api.cancelOrder(symbol, orderId);
      if (ok) {
        _lastSuccess = '✅ تم إلغاء أمر Spot $orderId';
        await syncOrders();
      }
      return ok;
    } catch (e) {
      _lastError = '❌ فشل إلغاء الأمر: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> cancelAllOrders(String symbol) async {
    _setLoading(true);
    _clearMessages();
    try {
      final ok = await _api.cancelAllOrders(symbol);
      if (ok) await syncOrders();
      return ok;
    } catch (e) {
      _lastError = '❌ فشل إلغاء أوامر Spot: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> syncOrders() async {
    if (!MexcApiManager().isInitialized) return;
    try {
      _openOrders
        ..clear()
        ..addAll(await _api.getOpenOrders());
      final symbol = _selectedSymbol;
      if (symbol != null) {
        final trades = await _api.getAllMyTrades(pageSize: 20, symbol: symbol);
        _tradeHistory
          ..clear()
          ..addAll(trades.map((t) => TradeRecord(id: t['id']?.toString() ?? t['orderId']?.toString() ?? Random().nextInt(999999).toString(), symbol: t['symbol']?.toString() ?? symbol, side: t['side']?.toString() ?? 'BUY', amount: _parseDouble(t['volume'] ?? t['qty']), entryPrice: _parseDouble(t['price']), entryTime: DateTime.fromMillisecondsSinceEpoch((t['createTime'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch), status: 'CLOSED', strategy: 'Manual')));
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> placeTrade({required String symbol, required String side, required double amount, required double price, bool isLimit = false, double? limitPrice}) async {
    if (isLimit && limitPrice != null && limitPrice > 0) return placeLimitOrder(symbol: symbol, side: side, price: limitPrice, volume: 1.0);
    selectPair(symbol);
    final contract = EventContract(symbol: symbol, name: symbol, category: 'Spot', strikePrice: price, currentPrice: price, priceChangePercent: 0, volume24h: 0, expiryDate: DateTime.now());
    return side.toUpperCase() == 'BUY' ? executeBuy(contract, amount: 1.0) : executeSell(contract, amount: 1.0);
  }

  Future<void> runBotAutoTrade(String strategyName) async {
    _setLoading(true);
    _clearMessages();
    try {
      final tickers = await _api.getAllTickers24hr();
      if (tickers.isEmpty) throw Exception('لا توجد بيانات سوق Spot متاحة');
      tickers.sort((a, b) => _parseDouble(b['priceChangePercent']).compareTo(_parseDouble(a['priceChangePercent'])));
      final top = tickers.first;
      final symbol = top['symbol']?.toString() ?? '';
      final price = _parseDouble(top['lastPrice']);
      final change = _parseDouble(top['priceChangePercent']);
      if (symbol.isEmpty || price <= 0) throw Exception('لا يوجد زوج Spot صالح');

      // Spot cannot short. Positive signals buy $1; negative signals may sell
      // $1 only when the wallet actually holds the base asset.
      var side = change >= 0 ? 'BUY' : 'SELL';
      if (side == 'SELL') {
        final balances = await _api.getRealBalances();
        final base = symbol.split('_').first;
        final free = balances[base]?['free'] ?? 0.0;
        if (free <= 0) side = 'BUY';
      }

      final contract = EventContract(symbol: symbol, name: symbol, category: 'Spot', strikePrice: price, currentPrice: price, priceChangePercent: change, volume24h: _parseDouble(top['volume24h']), expiryDate: DateTime.now());
      final ok = side == 'BUY' ? await executeBuy(contract, amount: 1.0) : await executeSell(contract, amount: 1.0);
      if (ok) _lastSuccess = '✅ البوت Spot: تنفيذ $side بقيمة 1 USDT — $symbol — $strategyName';
    } catch (e) {
      _lastError = '❌ فشل بوت Spot: $e';
      _consecutiveLosses++;
    } finally {
      _setLoading(false);
      notifyListeners();
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _clearMessages() {
    _lastError = null;
    _lastSuccess = null;
  }

  double _parseDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }
}
