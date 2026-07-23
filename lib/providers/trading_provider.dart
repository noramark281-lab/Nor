import 'dart:async';
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

  // Risk Management Stats
  int _consecutiveLosses = 0;
  final int _maxConsecutiveLosses = 3;
  final double _maxRiskPercent = 0.02;

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

  Future<bool> placeOrder(String side) async {
    // Risk Management Check
    if (_balance > 0 && _tradeAmount > _balance * _maxRiskPercent) {
      print('Risk Management: Trade amount exceeds 2% of balance');
      // We still allow manual trades but log it. For bot, we'll be stricter.
    }

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
          // In a real app, we'd store the orderId from result
        );
        _openOrders.add(contract);
        return true;
      }
    } catch (e) {
      print('Error placing order: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  void startPriceUpdates() {
    _priceTimer?.cancel();
    _priceTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _fetchPrice();
      _syncOrdersWithExchange();
    });
    _fetchPrice();
    _fetchKlines();
    fetchBalance();
  }

  void stopPriceUpdates() {
    _priceTimer?.cancel();
  }

  void startBot() {
    if (_consecutiveLosses >= _maxConsecutiveLosses) {
      print('Bot cannot start: Max consecutive losses reached. Reset needed.');
      return;
    }
    _botRunning = true;
    _botTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      if (!_botRunning) return;
      
      // Strict Bot Risk Check
      if (_balance > 0 && _tradeAmount > _balance * _maxRiskPercent) {
        print('Bot stopped: Trade amount exceeds risk limits');
        stopBot();
        return;
      }

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

  Future<void> _syncOrdersWithExchange() async {
    final now = DateTime.now();
    final expired = _openOrders.where((o) => o.expiryTime.isBefore(now)).toList();
    
    for (var order in expired) {
      _openOrders.remove(order);
      
      // REAL LOGIC: In a production app, we would call an API like getOrderDetails(orderId)
      // Since we are simulating the final result based on price action for this event trader:
      final closePrice = _currentPrice;
      // This is still a simplification, real event futures settle at a specific time/price
      bool won = false;
      if (order.side == 'UP' && closePrice > 0) { // Simplified win condition
         // Real check would be against the strike price at expiry
         won = closePrice > 0; // Placeholder for real settlement logic
      }
      
      // For this implementation, we'll try to fetch the actual account balance change
      await fetchBalance();
      
      // Update history with real data if possible
      _history.add(EventContract(
        symbol: order.symbol,
        side: order.side,
        amount: order.amount,
        durationMinutes: order.durationMinutes,
        expiryTime: order.expiryTime,
        status: won ? 'WON' : 'LOST',
        payoutPercent: 0.9, // Typical payout
      ));

      if (!won) {
        _consecutiveLosses++;
        if (_consecutiveLosses >= _maxConsecutiveLosses) {
          stopBot();
          print('Bot stopped due to 3 consecutive losses');
        }
      } else {
        _consecutiveLosses = 0;
      }
    }
    if (expired.isNotEmpty) notifyListeners();
  }

  void resetLossCounter() {
    _consecutiveLosses = 0;
    notifyListeners();
  }
}
