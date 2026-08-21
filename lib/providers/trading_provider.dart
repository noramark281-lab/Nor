import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../models/trading_pair.dart';
import '../services/mexc_api_service.dart';
import '../services/api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// Trading Provider - تنفيذ الصفقات الحقيقية + البوت التلقائي
/// ═══════════════════════════════════════════════════════════════════
class TradingProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();

  // ── State ───────────────────────────────────────────────────────
  bool _isLoading = false;
  String? _lastError;
  String? _lastSuccess;
  Timer? _orderSyncTimer;
  Timer? _botTimer;
  final List<TradingPair> _pairs = [];
  String? _selectedSymbol = 'BTC_USDT';
  double _leverage = 1.0;
  double _availableBalance = 0.0;

  // ── Bot State ───────────────────────────────────────────────────
  bool _isTrading = false;
  String _selectedStrategy = 'Hybrid';
  String? _lastSignal;
  int _consecutiveLosses = 0;
  double _balance = 0.0;

  final List<String> _availableStrategies = [
    'Hybrid',
    'Momentum',
    'Breakout',
    'SMA Crossover',
    'MeanReversion',
    'Heikin Ashi',
    'Sentiment',
  ];

  // ── Orders & Trades ─────────────────────────────────────────────
  final List<Map<String, dynamic>> _openOrders = [];
  final List<TradeRecord> _tradeHistory = [];
  final List<TradeRecord> _openTrades = [];
  final List<TradeRecord> _closedTrades = [];

  // ── Getters ─────────────────────────────────────────────────────
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;
  String? get lastSuccess => _lastSuccess;
  bool get loading => _isLoading;
  String? get error => _lastError;

  // Market getters
  List<TradingPair> get pairs => List.unmodifiable(_pairs);
  String? get selectedSymbol => _selectedSymbol;
  TradingPair? get selectedPair => _pairs.isEmpty
      ? null
      : _pairs.firstWhere((p) => p.symbol == _selectedSymbol, orElse: () => _pairs.first);
  double get leverage => _leverage;
  double get availableBalance => _availableBalance;

  // Bot getters
  bool get isTrading => _isTrading;
  String get selectedStrategy => _selectedStrategy;
  String? get lastSignal => _lastSignal;
  int get consecutiveLosses => _consecutiveLosses;
  double get balance => _balance;
  List<String> get availableStrategies => _availableStrategies;
  List<TradeRecord> get openTrades => List.unmodifiable(_openTrades);
  List<TradeRecord> get closedTrades => List.unmodifiable(_closedTrades);
  List<Map<String, dynamic>> get openOrders => List.unmodifiable(_openOrders);

  double get totalProfit {
    double total = 0;
    for (final t in _closedTrades) {
      total += t.profit ?? 0;
    }
    return total;
  }

  // ── Lifecycle ───────────────────────────────────────────────────
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

  // ── Market Data ─────────────────────────────────────────────────
  Future<void> loadPairs() async {
    try {
      final tickers = await _api.getAllTickers24hr();
      _pairs.clear();
      for (final t in tickers) {
        final sym = t['symbol']?.toString() ?? '';
        if (sym.isNotEmpty) {
          _pairs.add(TradingPair(
            symbol: sym,
            base: sym.split('_').firstOrNull ?? sym,
            quote: sym.split('_').length > 1 ? sym.split('_')[1] : 'USDT',
            lastPrice: _parseDouble(t['lastPrice'] ?? t['lastFairPrice'] ?? 0),
            priceChangePercent: _parseDouble(t['riseFallRate'] ?? t['priceChangePercent'] ?? 0),
            volume24h: _parseDouble(t['volume24h'] ?? t['vol24h'] ?? 0),
          ));
        }
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[TradingProvider] loadPairs error: $e');
    }
  }

  void selectPair(String symbol) {
    _selectedSymbol = symbol;
    notifyListeners();
  }

  void setLeverage(double l) {
    _leverage = l;
    notifyListeners();
  }

  /// Unified placeOrder used by TradingScreen
  Future<bool> placeOrder({
    required String type,
    required String side,
    required double price,
    required double quantity,
    required double leverage,
  }) async {
    _leverage = leverage;
    final symbol = _selectedSymbol ?? 'BTC_USDT';
    if (type.toLowerCase() == 'limit') {
      return placeLimitOrder(
        symbol: symbol,
        side: side,
        price: price,
        volume: quantity,
        leverage: leverage,
      );
    } else {
      final contract = EventContract(
        symbol: symbol,
        name: symbol,
        category: 'Futures',
        strikePrice: price,
        currentPrice: price,
        priceChangePercent: 0,
        volume24h: 0,
        expiryDate: DateTime.now().add(const Duration(days: 1)),
      );
      if (side.toUpperCase() == 'BUY' || side.toUpperCase() == 'BUY_OPEN') {
        return executeBuy(contract, amount: quantity, leverage: leverage);
      } else {
        return executeSell(contract, amount: quantity, leverage: leverage);
      }
    }
  }

  @override
  void dispose() {
    stopOrderSync();
    stopAutoTrading();
    super.dispose();
  }

  // ═════════════════════════════════════════════════════════════════
  // BOT CONTROLS
  // ═════════════════════════════════════════════════════════════════

  void selectStrategy(String strategy) {
    _selectedStrategy = strategy;
    notifyListeners();
  }

  void startAutoTrading() {
    _isTrading = true;
    notifyListeners();

    _botTimer?.cancel();
    _botTimer = Timer.periodic(const Duration(minutes: 2), (_) async {
      if (!_isTrading) return;
      await runBotAutoTrade(_selectedStrategy);
    });

    // Run immediately
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
      final usdt = balances['USDT'];
      _balance = (usdt?['free'] ?? 0.0) + (usdt?['locked'] ?? 0.0);
      notifyListeners();
    } catch (e) {
      // silent
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // REAL TRADING via MEXC Futures API
  // ═════════════════════════════════════════════════════════════════

  /// Execute a buy (long) order on MEXC Futures
  Future<bool> executeBuy(EventContract contract, {required double amount, double? leverage}) async {
    _setLoading(true);
    _clearMessages();

    try {
      final result = await _api.placeOrder(
        symbol: contract.symbol,
        side: 'BUY_OPEN',
        type: 'MARKET',
        volume: amount,
        price: contract.currentPrice,
        leverage: leverage ?? 1,
        openType: 'ISOLATED',
      );

      _lastSuccess = '✅ تم فتح صفقة شراء ${contract.symbol} بنجاح';
      _lastSignal = 'BUY';
      _openTrades.add(TradeRecord(
        id: _confirmedOrderId(result),
        symbol: contract.symbol,
        side: 'BUY',
        amount: amount,
        entryPrice: contract.currentPrice,
        entryTime: DateTime.now(),
        status: 'OPEN',
        strategy: _selectedStrategy,
      ));

      await syncOrders();
      await syncBalance();
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = '❌ فشل شراء ${contract.symbol}: $e';
      _consecutiveLosses++;
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  /// Execute a sell (short) order on MEXC Futures
  Future<bool> executeSell(EventContract contract, {required double amount, double? leverage}) async {
    _setLoading(true);
    _clearMessages();

    try {
      final result = await _api.placeOrder(
        symbol: contract.symbol,
        side: 'SELL_OPEN',
        type: 'MARKET',
        volume: amount,
        price: contract.currentPrice,
        leverage: leverage ?? 1,
        openType: 'ISOLATED',
      );

      _lastSuccess = '✅ تم فتح صفقة بيع ${contract.symbol} بنجاح';
      _lastSignal = 'SELL';
      _openTrades.add(TradeRecord(
        id: _confirmedOrderId(result),
        symbol: contract.symbol,
        side: 'SELL',
        amount: amount,
        entryPrice: contract.currentPrice,
        entryTime: DateTime.now(),
        status: 'OPEN',
        strategy: _selectedStrategy,
      ));

      await syncOrders();
      await syncBalance();
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = '❌ فشل بيع ${contract.symbol}: $e';
      _consecutiveLosses++;
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  /// Close a position (opposite side)
  Future<bool> closePosition(EventContract contract, {required double amount, required String currentSide}) async {
    _setLoading(true);
    _clearMessages();

    try {
      final closeSide = currentSide.toUpperCase() == 'BUY' || currentSide.toUpperCase() == 'BUY_OPEN'
          ? 'SELL_CLOSE'
          : 'BUY_CLOSE';

      final result = await _api.placeOrder(
        symbol: contract.symbol,
        side: closeSide,
        type: 'MARKET',
        volume: amount,
        price: contract.currentPrice,
        openType: 'ISOLATED',
      );
      _confirmedOrderId(result);

      _lastSuccess = '✅ تم إغلاق مركز ${contract.symbol} بنجاح';

      // Move from open to closed
      final tradeIndex = _openTrades.indexWhere((t) => t.symbol == contract.symbol && t.isOpen);
      if (tradeIndex >= 0) {
        final trade = _openTrades.removeAt(tradeIndex);
        final profit = (contract.currentPrice - trade.entryPrice) *
            (trade.side == 'BUY' ? 1 : -1) * amount;
        _closedTrades.add(TradeRecord(
          id: trade.id,
          symbol: trade.symbol,
          side: trade.side,
          amount: trade.amount,
          entryPrice: trade.entryPrice,
          exitPrice: contract.currentPrice,
          entryTime: trade.entryTime,
          exitTime: DateTime.now(),
          status: 'CLOSED',
          profit: profit,
          strategy: trade.strategy,
        ));
        if (profit > 0) _consecutiveLosses = 0;
      }

      await syncOrders();
      await syncBalance();
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = '❌ فشل إغلاق ${contract.symbol}: $e';
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  /// Place a limit order
  Future<bool> placeLimitOrder({
    required String symbol,
    required String side,
    required double price,
    required double volume,
    double? leverage,
  }) async {
    _setLoading(true);
    _clearMessages();

    try {
      final apiSide = side.toUpperCase() == 'BUY' ? 'BUY_OPEN' : 'SELL_OPEN';

      final result = await _api.placeOrder(
        symbol: symbol,
        side: apiSide,
        type: 'LIMIT',
        price: price,
        volume: volume,
        leverage: leverage ?? 1,
        openType: 'ISOLATED',
      );
      _confirmedOrderId(result);

      _lastSuccess = '✅ تم وضع أمر محدد $side لـ $symbol @ $price';
      await syncOrders();
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = '❌ فشل أمر $side $symbol: $e';
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  /// Cancel an order by ID
  Future<bool> cancelOrder(String symbol, String orderId) async {
    _setLoading(true);
    _clearMessages();

    try {
      final success = await _api.cancelOrder(symbol, orderId);
      if (success) {
        _lastSuccess = '✅ تم إلغاء الأمر $orderId';
        await syncOrders();
      } else {
        _lastError = '❌ فشل إلغاء الأمر $orderId';
      }
      _setLoading(false);
      notifyListeners();
      return success;
    } catch (e) {
      _lastError = '❌ فشل إلغاء الأمر: $e';
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  /// Cancel all orders for a symbol
  Future<bool> cancelAllOrders(String symbol) async {
    _setLoading(true);
    _clearMessages();

    try {
      final success = await _api.cancelAllOrders(symbol);
      if (success) {
        _lastSuccess = '✅ تم إلغاء جميع أوامر $symbol';
        await syncOrders();
      } else {
        _lastError = '❌ فشل إلغاء أوامر $symbol';
      }
      _setLoading(false);
      notifyListeners();
      return success;
    } catch (e) {
      _lastError = '❌ فشل إلغاء الأوامر: $e';
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  // ── Sync ────────────────────────────────────────────────────────
  Future<void> syncOrders() async {
    if (!MexcApiManager().isInitialized) return;

    try {
      _openOrders.clear();
      final orders = await _api.getOpenOrders();
      _openOrders.addAll(orders);

      final trades = await _api.getAllMyTrades(pageSize: 20);
      _tradeHistory.clear();
      for (final t in trades) {
        _tradeHistory.add(TradeRecord(
          id: t['id']?.toString() ?? t['orderId']?.toString() ?? Random().nextInt(999999).toString(),
          symbol: t['symbol']?.toString() ?? '',
          side: t['side']?.toString() ?? 'BUY',
          amount: _parseDouble(t['vol'] ?? t['volume'] ?? 0),
          entryPrice: _parseDouble(t['price'] ?? 0),
          entryTime: DateTime.tryParse(t['createTime']?.toString() ?? '') ?? DateTime.now(),
          status: 'CLOSED',
          strategy: 'Manual',
        ));
      }

      notifyListeners();
    } catch (e) {
      // Silent fail on background sync
    }
  }

  /// Unified trade entry point used by TradingScreen
  Future<bool> placeTrade({
    required String symbol,
    required String side,
    required double amount,
    required double price,
    bool isLimit = false,
    double? limitPrice,
  }) async {
    if (isLimit && limitPrice != null && limitPrice > 0) {
      return placeLimitOrder(
        symbol: symbol,
        side: side,
        price: limitPrice,
        volume: amount,
      );
    }
    // Create a dummy contract for the execute methods
    final contract = EventContract(
      symbol: symbol,
      name: symbol,
      category: 'Futures',
      strikePrice: price,
      currentPrice: price,
      priceChangePercent: 0,
      volume24h: 0,
      expiryDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (side.toUpperCase() == 'BUY') {
      return executeBuy(contract, amount: amount);
    } else {
      return executeSell(contract, amount: amount);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // BOT AUTO-TRADING
  // ═════════════════════════════════════════════════════════════════

  Future<void> runBotAutoTrade(String strategyName) async {
    _setLoading(true);
    _clearMessages();

    try {
      // Fetch market data
      final tickers = await _api.getAllTickers24hr();
      if (tickers.isEmpty) {
        throw Exception('لا توجد بيانات سوق متاحة');
      }

      // Simple strategy: pick top gainer for BUY
      tickers.sort((a, b) {
        final changeA = _parseDouble(a['riseFallRate'] ?? a['priceChangePercent'] ?? 0);
        final changeB = _parseDouble(b['riseFallRate'] ?? b['priceChangePercent'] ?? 0);
        return changeB.compareTo(changeA);
      });

      final topGainer = tickers.first;
      final symbol = topGainer['symbol']?.toString() ?? '';
      final price = _parseDouble(topGainer['lastPrice'] ?? topGainer['lastFairPrice'] ?? 0);

      if (symbol.isEmpty) {
        throw Exception('لا يوجد زوج تداول متاح');
      }

      // Determine side based on strategy
      String side = 'BUY_OPEN';
      double change = _parseDouble(topGainer['riseFallRate'] ?? 0);

      switch (strategyName) {
        case 'Momentum':
        case 'Breakout':
          side = change > 0 ? 'BUY_OPEN' : 'SELL_OPEN';
          break;
        case 'MeanReversion':
          side = change < 0 ? 'BUY_OPEN' : 'SELL_OPEN';
          break;
        case 'Sentiment':
        case 'Heikin Ashi':
        case 'SMA Crossover':
        default:
          side = change >= 0 ? 'BUY_OPEN' : 'SELL_OPEN';
      }

      // Place a market order only after an explicit bot start action.
      final result = await _api.placeOrder(
        symbol: symbol,
        side: side,
        type: 'MARKET',
        volume: 1,
        price: price,
        leverage: 1,
        openType: 'ISOLATED',
      );
      final orderId = _confirmedOrderId(result);

      _lastSignal = side.contains('BUY') ? 'BUY' : 'SELL';
      _lastSuccess = '✅ البوت: تم ${side.contains('BUY') ? 'شراء' : 'بيع'} $symbol تلقائياً (الاستراتيجية: $strategyName)';

      _openTrades.add(TradeRecord(
        id: orderId,
        symbol: symbol,
        side: side.contains('BUY') ? 'BUY' : 'SELL',
        amount: 1,
        entryPrice: price,
        entryTime: DateTime.now(),
        status: 'OPEN',
        strategy: strategyName,
      ));

      await syncOrders();
      await syncBalance();
    } catch (e) {
      _lastError = '❌ فشل البوت: $e';
      _consecutiveLosses++;
    } finally {
      _setLoading(false);
      notifyListeners();
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════════════════════════════════

  void _setLoading(bool v) {
    _isLoading = v;
    notifyListeners();
  }

  void _clearMessages() {
    _lastError = null;
    _lastSuccess = null;
  }

  String _confirmedOrderId(Map<String, dynamic> result) {
    final orderId = result['orderId']?.toString();
    if (orderId == null || orderId.isEmpty) {
      throw StateError('لم تتلقَ MEXC رقم طلب صالحاً.');
    }
    return orderId;
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}
