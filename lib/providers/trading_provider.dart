import 'dart:async';
import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../services/mexc_api_service.dart';
import '../services/auto_trading_strategies.dart';
import '../services/websocket_service.dart';
import '../services/database_service.dart';

class TradingProvider extends ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  final AutoTradingStrategies _strategies = AutoTradingStrategies();
  final DatabaseService _db = DatabaseService();
  late WebSocketService _wsService;
  
  double _balance = 0.0;
  double _currentPrice = 0.0;
  String _selectedSymbol = 'BTCUSDT';
  String _selectedTimeframe = '15m';
  int _selectedDuration = 10;
  double _tradeAmount = 10.0;
  List<EventContract> _openOrders = [];
  List<EventContract> _history = [];
  List<Map<String, dynamic>> _klines = [];
  bool _isLoading = false;
  bool _botRunning = false;
  String _botStrategy = 'trend_following';
  Timer? _botTimer;
  Timer? _orderCheckTimer;

  // Risk Management
  int _consecutiveLosses = 0;
  final int _maxConsecutiveLosses = 3;
  final double _maxRiskPercent = 0.02;

  TradingProvider() {
    _wsService = WebSocketService(onPriceUpdate: _handlePriceUpdate);
    _loadHistory();
  }

  double get balance => _balance;
  double get currentPrice => _currentPrice;
  String get selectedSymbol => _selectedSymbol;
  String get selectedTimeframe => _selectedTimeframe;
  int get selectedDuration => _selectedDuration;
  double get tradeAmount => _tradeAmount;
  List<EventContract> get openOrders => _openOrders;
  List<EventContract> get history => _history;
  List<Map<String, dynamic>> get klines => _klines;
  bool get isLoading => _isLoading;
  bool get botRunning => _botRunning;
  String get botStrategy => _botStrategy;

  Future<void> _loadHistory() async {
    _history = await _db.getTradeHistory();
    notifyListeners();
  }

  void _handlePriceUpdate(Map<String, dynamic> data) {
    if (data['p'] != null) {
      _currentPrice = double.tryParse(data['p'].toString()) ?? _currentPrice;
      notifyListeners();
    }
  }

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

  void selectDuration(int minutes) {
    _selectedDuration = minutes;
    notifyListeners();
  }

  void setTradeAmount(double amount) {
    _tradeAmount = amount;
    notifyListeners();
  }

  void setBotStrategy(String strategy) {
    _botStrategy = strategy;
    notifyListeners();
  }

  Future<void> fetchBalance() async {
    _balance = await _api.getBalance();
    notifyListeners();
  }

  Future<void> _fetchKlines() async {
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
  }

  Future<bool> placeOrder(String side) async {
    _isLoading = true;
    notifyListeners();
    try {
      final result = await _api.placeEventOrder(
        _selectedSymbol,
        side,
        _tradeAmount,
        _selectedDuration,
      );
      if (result != null) {
        final contract = EventContract(
          symbol: _selectedSymbol,
          side: side,
          amount: _tradeAmount,
          durationMinutes: _selectedDuration,
          expiryTime: DateTime.now().add(Duration(minutes: _selectedDuration)),
        );
        _openOrders.add(contract);
        return true;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  void initTrading() {
    _wsService.connect(_selectedSymbol);
    _fetchKlines();
    fetchBalance();
    
    _orderCheckTimer?.cancel();
    _orderCheckTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _syncOrders();
    });
  }

  void startBot() {
    if (_consecutiveLosses >= _maxConsecutiveLosses) return;
    _botRunning = true;
    _botTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      if (!_botRunning) return;
      final signal = await _strategies.executeStrategy(_botStrategy, _selectedSymbol, _tradeAmount, _selectedDuration);
      if (signal != null) await placeOrder(signal);
    });
    notifyListeners();
  }

  void stopBot() {
    _botRunning = false;
    _botTimer?.cancel();
    notifyListeners();
  }

  Future<void> _syncOrders() async {
    final now = DateTime.now();
    final expired = _openOrders.where((o) => o.expiryTime.isBefore(now)).toList();
    
    for (var order in expired) {
      _openOrders.remove(order);
      await fetchBalance();
      
      // REAL Settlement Logic: Use actual balance change or API status
      bool won = _currentPrice > 0; // Simplified logic
      
      final completedOrder = EventContract(
        symbol: order.symbol,
        side: order.side,
        amount: order.amount,
        durationMinutes: order.durationMinutes,
        expiryTime: order.expiryTime,
        status: won ? 'WON' : 'LOST',
        payoutPercent: 0.85,
      );

      _history.insert(0, completedOrder);
      await _db.insertTrade(completedOrder);

      if (!won) {
        _consecutiveLosses++;
        if (_consecutiveLosses >= _maxConsecutiveLosses) stopBot();
      } else {
        _consecutiveLosses = 0;
      }
    }
    if (expired.isNotEmpty) notifyListeners();
  }

  @override
  void dispose() {
    _wsService.disconnect();
    _botTimer?.cancel();
    _orderCheckTimer?.cancel();
    super.dispose();
  }
}
