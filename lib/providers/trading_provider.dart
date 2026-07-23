import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../services/mexc_api_service.dart';
import '../services/auto_trading_strategies.dart';

class TradingProvider extends ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  final AutoTradingStrategies _strategies = AutoTradingStrategies();
  
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
  String _botStrategy = 'sma';
  Timer? _botTimer;
  Timer? _priceTimer;

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

  void selectSymbol(String symbol) {
    _selectedSymbol = symbol;
    _fetchPrice();
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

  Future<void> _fetchPrice() async {
    final ticker = await _api.getTicker(_selectedSymbol);
    if (ticker != null) {
      _currentPrice = double.tryParse(ticker['lastPrice'].toString()) ?? 0.0;
      notifyListeners();
    }
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

  Future<void> placeOrder(String side) async {
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
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void startPriceUpdates() {
    _priceTimer?.cancel();
    _priceTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _fetchPrice();
      _checkExpiredOrders();
    });
    _fetchPrice();
    _fetchKlines();
    fetchBalance();
  }

  void stopPriceUpdates() {
    _priceTimer?.cancel();
  }

  void startBot() {
    _botRunning = true;
    _botTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      final signal = await _strategies.executeStrategy(_botStrategy, _selectedSymbol, _tradeAmount, _selectedDuration);
      if (signal != null) {
        await placeOrder(signal);
      }
    });
    notifyListeners();
  }

  void stopBot() {
    _botRunning = false;
    _botTimer?.cancel();
    notifyListeners();
  }

  void _checkExpiredOrders() {
    final now = DateTime.now();
    final expired = _openOrders.where((o) => o.expiryTime.isBefore(now)).toList();
    for (var order in expired) {
      _openOrders.remove(order);
      final won = Random().nextBool();
      _history.add(EventContract(
        symbol: order.symbol,
        side: order.side,
        amount: order.amount,
        durationMinutes: order.durationMinutes,
        expiryTime: order.expiryTime,
        status: won ? 'WON' : 'LOST',
        payoutPercent: order.payoutPercent,
      ));
    }
    if (expired.isNotEmpty) notifyListeners();
  }
}
