import 'dart:async';
import 'package:flutter/material.dart';
import '../services/mexc_api_service.dart';
import '../services/auto_trading_strategies.dart';
import '../services/websocket_service.dart';
import '../services/database_service.dart';
import '../services/api_manager.dart';
import '../utils/constants.dart';

/// Trade record for local history
class TradeRecord {
  final String id;
  final String symbol;
  final String side;
  final double amount;
  final double price;
  final double quantity;
  final DateTime timestamp;
  final String status;
  final int? orderId;
  final String? error;

  TradeRecord({
    required this.id,
    required this.symbol,
    required this.side,
    required this.amount,
    required this.price,
    required this.quantity,
    required this.timestamp,
    this.status = 'pending',
    this.orderId,
    this.error,
  });
}

class TradingProvider extends ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  final AutoTradingStrategies _strategies = AutoTradingStrategies();
  final DatabaseService _db = DatabaseService();
  late WebSocketService _wsService;

  double _balance = 0.0;
  double _currentPrice = 0.0;
  String _selectedSymbol = 'BTCUSDT';
  String _selectedTimeframe = '15m';
  double _tradeAmount = 1.0; // Default $1 cap
  List<TradeRecord> _tradeHistory = [];
  List<dynamic> _klines = [];
  bool _isLoading = false;
  bool _botRunning = false;
  String _botStrategy = 'scalping';
  Timer? _botTimer;
  Timer? _priceTimer;
  Timer? _balanceTimer;

  String? _lastError;
  bool _apiInitialized = false;

  // Risk Management
  int _dailyTrades = 0;
  DateTime _lastTradeDate = DateTime.now();

  TradingProvider() {
    _wsService = WebSocketService(onPriceUpdate: _handlePriceUpdate);
    _init();
  }

  Future<void> _init() async {
    await MexcApiManager().initialize();
    _apiInitialized = MexcApiManager().isInitialized;
    if (_apiInitialized) {
      _startAutoRefresh();
      fetchBalance();
    }
    notifyListeners();
  }

  // ========== GETTERS ==========

  double get balance => _balance;
  double get currentPrice => _currentPrice;
  String get selectedSymbol => _selectedSymbol;
  String get selectedTimeframe => _selectedTimeframe;
  double get tradeAmount => _tradeAmount;
  List<TradeRecord> get tradeHistory => _tradeHistory;
  List<dynamic> get klines => _klines;
  bool get isLoading => _isLoading;
  bool get botRunning => _botRunning;
  String get botStrategy => _botStrategy;
  String? get lastError => _lastError;
  bool get apiInitialized => _apiInitialized;
  int get dailyTrades => _dailyTrades;

  // ========== SELECTION ==========

  void selectSymbol(String symbol) {
    _selectedSymbol = symbol;
    _wsService.connect(symbol);
    _fetchKlines();
    notifyListeners();
  }

  void selectTimeframe(String tf) {
    _selectedTimeframe = tf;
    _fetchKlines();
    notifyListeners();
  }

  /// Set trade amount - STRICTLY capped at $1
  void setTradeAmount(double amount) {
    // HARD CAP: never exceed $1 per trade
    if (amount > Constants.maxTradeAmount) {
      amount = Constants.maxTradeAmount;
      _lastError = 'تم تقييد المبلغ إلى \$1 (الحد الأقصى)';
    }
    if (amount < Constants.minTradeAmount) {
      amount = Constants.minTradeAmount;
    }
    _tradeAmount = amount;
    notifyListeners();
  }

  void setBotStrategy(String strategy) {
    _botStrategy = strategy;
    notifyListeners();
  }

  // ========== AUTO REFRESH ==========

  void _startAutoRefresh() {
    _priceTimer?.cancel();
    _balanceTimer?.cancel();

    // Refresh price every 3 seconds
    _priceTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _fetchCurrentPrice();
    });

    // Refresh balance every 10 seconds
    _balanceTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      fetchBalance();
    });
  }

  void _handlePriceUpdate(Map<String, dynamic> data) {
    if (data['p'] != null) {
      _currentPrice = double.tryParse(data['p'].toString()) ?? _currentPrice;
      notifyListeners();
    }
  }

  // ========== DATA FETCHING ==========

  Future<void> fetchBalance() async {
    try {
      _balance = await _api.getUSDTBalance();
      notifyListeners();
    } catch (e) {
      print('Balance fetch error: $e');
    }
  }

  Future<void> _fetchCurrentPrice() async {
    try {
      _currentPrice = await _api.getCurrentPrice(_selectedSymbol);
      notifyListeners();
    } catch (e) {
      print('Price fetch error: $e');
    }
  }

  Future<void> _fetchKlines() async {
    try {
      final data = await _api.getKlines(_selectedSymbol, _selectedTimeframe, limit: 50);
      _klines = data.map((k) => {
        'time': k[0],
        'open': double.parse(k[1].toString()),
        'high': double.parse(k[2].toString()),
        'low': double.parse(k[3].toString()),
        'close': double.parse(k[4].toString()),
        'volume': double.parse(k[5].toString()),
      }).toList();
      notifyListeners();
    } catch (e) {
      print('Klines error: $e');
    }
  }

  // ========== REAL TRADING ==========

  bool _canTrade() {
    _lastError = null;

    if (!_apiInitialized) {
      _lastError = 'لم يتم إعداد مفاتيح API';
      return false;
    }

    if (_balance < _tradeAmount) {
      _lastError = 'رصيد غير كافٍ: \$${_balance.toStringAsFixed(2)}';
      return false;
    }

    // Check daily limit
    final today = DateTime.now();
    if (today.day != _lastTradeDate.day || today.month != _lastTradeDate.month || today.year != _lastTradeDate.year) {
      _dailyTrades = 0;
      _lastTradeDate = today;
    }

    if (_dailyTrades >= Constants.maxDailyTrades) {
      _lastError = 'تم الوصول للحد اليومي للصفقات (${Constants.maxDailyTrades})';
      return false;
    }

    // HARD CAP: $1 max per trade
    if (_tradeAmount > Constants.maxTradeAmount) {
      _tradeAmount = Constants.maxTradeAmount;
      _lastError = 'تم تقييد المبلغ إلى \$1';
    }

    return true;
  }

  /// Place a REAL spot order on MEXC with $1 cap
  Future<bool> placeOrder(String side) async {
    if (!_canTrade()) {
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      // Double-check $1 cap
      final amount = _tradeAmount > Constants.maxTradeAmount
          ? Constants.maxTradeAmount
          : _tradeAmount;

      final result = await _api.placeSpotOrder(
        symbol: _selectedSymbol,
        side: side == 'UP' ? 'BUY' : 'SELL',
        amount: amount,
      );

      if (result != null && result['error'] == null && result['orderId'] != null) {
        final price = double.tryParse(result['fills']?[0]?['price']?.toString() ?? '0') ?? _currentPrice;
        final qty = double.tryParse(result['executedQty']?.toString() ?? '0') ?? 0;

        final record = TradeRecord(
          id: 'local_${DateTime.now().millisecondsSinceEpoch}',
          symbol: _selectedSymbol,
          side: side,
          amount: amount,
          price: price > 0 ? price : _currentPrice,
          quantity: qty,
          timestamp: DateTime.now(),
          status: 'filled',
          orderId: result['orderId'],
        );

        _tradeHistory.insert(0, record);
        _dailyTrades++;

        // Refresh balance after trade
        await fetchBalance();

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _lastError = result?['error'] ?? 'فشل تنفيذ الأمر';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _lastError = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ========== BOT (Local) ==========

  void startLocalBot() {
    if (_dailyTrades >= Constants.maxDailyTrades) {
      _lastError = 'تم الوصول للحد اليومي';
      notifyListeners();
      return;
    }

    _botRunning = true;
    _botTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      if (!_botRunning) return;

      final signal = await _strategies.executeStrategy(
        _botStrategy,
        _selectedSymbol,
        _tradeAmount,
        0,
      );

      if (signal != null) {
        final side = signal == 'BUY' ? 'UP' : 'DOWN';
        await placeOrder(side);
      }
    });

    notifyListeners();
  }

  void stopLocalBot() {
    _botRunning = false;
    _botTimer?.cancel();
    notifyListeners();
  }

  // ========== INIT ==========

  Future<void> initTrading() async {
    await _init();
    _wsService.connect(_selectedSymbol);
    _fetchKlines();
    _fetchCurrentPrice();
    fetchBalance();
  }

  Future<void> refreshApiStatus() async {
    await MexcApiManager().initialize();
    _apiInitialized = MexcApiManager().isInitialized;
    notifyListeners();
  }

  @override
  void dispose() {
    _wsService.disconnect();
    _botTimer?.cancel();
    _priceTimer?.cancel();
    _balanceTimer?.cancel();
    super.dispose();
  }
}
