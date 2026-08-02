import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../services/mexc_api_service.dart';
import '../services/auto_trading_strategies.dart';

class TradingProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  final AutoTradingStrategies _strategies = AutoTradingStrategies();

  List<TradeRecord> _trades = [];
  bool _isTrading = false;
  String _selectedStrategy = 'Hybrid';
  double _balance = 1000.0;
  String? _lastSignal;

  List<TradeRecord> get trades => _trades;
  bool get isTrading => _isTrading;
  String get selectedStrategy => _selectedStrategy;
  double get balance => _balance;
  String? get lastSignal => _lastSignal;

  List<String> get availableStrategies => [
    'Hybrid',
    'Momentum',
    'MeanReversion',
    'Breakout',
    'Sentiment',
    'SMA Crossover',
    'Heikin Ashi',
  ];

  void selectStrategy(String name) {
    _selectedStrategy = name;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> analyze(String symbol, List<double> prices, {List<double>? volumes}) async {
    Map<String, dynamic> result;
    switch (_selectedStrategy) {
      case 'Momentum':
        result = _strategies.momentumStrategy(prices);
        break;
      case 'MeanReversion':
        result = _strategies.meanReversion(prices);
        break;
      case 'Breakout':
        result = _strategies.breakoutStrategy(prices);
        break;
      case 'Sentiment':
        result = _strategies.sentimentStrategy(prices, volumes ?? []);
        break;
      case 'SMA Crossover':
        result = _strategies.smaCrossover(prices);
        break;
      case 'Heikin Ashi':
        result = _strategies.heikinAshiSignal(prices);
        break;
      case 'Hybrid':
      default:
        result = _strategies.hybridStrategy(prices, volumes ?? []);
        break;
    }
    _lastSignal = result['signal'];
    notifyListeners();
    return result;
  }

  Future<void> placeTrade({
    required String symbol,
    required String side,
    required double amount,
    required double price,
    String strategy = 'Manual',
  }) async {
    final order = await _api.placeOrder(
      symbol: symbol,
      side: side,
      quantity: amount,
      type: 'MARKET',
    );

    final trade = TradeRecord(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      symbol: symbol,
      side: side,
      amount: amount,
      entryPrice: price,
      entryTime: DateTime.now(),
      status: order != null && order['orderId'] != null ? 'OPEN' : 'ERROR',
      strategy: strategy,
    );

    _trades.insert(0, trade);
    notifyListeners();
  }

  Future<void> closeTrade(TradeRecord trade, double exitPrice) async {
    final index = _trades.indexWhere((t) => t.id == trade.id);
    if (index == -1) return;

    final profit = trade.side == 'BUY'
        ? (exitPrice - trade.entryPrice) * trade.amount
        : (trade.entryPrice - exitPrice) * trade.amount;

    _trades[index] = TradeRecord(
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      amount: trade.amount,
      entryPrice: trade.entryPrice,
      exitPrice: exitPrice,
      entryTime: trade.entryTime,
      exitTime: DateTime.now(),
      status: 'CLOSED',
      profit: profit,
      strategy: trade.strategy,
    );

    _balance += profit;
    notifyListeners();
  }

  void startAutoTrading() {
    _isTrading = true;
    notifyListeners();
  }

  void stopAutoTrading() {
    _isTrading = false;
    notifyListeners();
  }

  List<TradeRecord> get openTrades =>
      _trades.where((t) => t.status == 'OPEN').toList();

  List<TradeRecord> get closedTrades =>
      _trades.where((t) => t.status == 'CLOSED').toList();

  double get totalProfit => closedTrades.fold(0.0, (sum, t) => sum + (t.profit ?? 0));
}
