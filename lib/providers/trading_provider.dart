import 'package:flutter/foundation.dart';

import '../models/trade_record.dart';
import '../services/mexc_api_service.dart';

class TradingProvider extends ChangeNotifier {
  final MexcApiService _mexcApiService = MexcApiService();

  double balance = 10000.0;
  bool loading = false;
  String? error;
  List<TradeRecord> openTrades = [];
  List<TradeRecord> closedTrades = [];
  List<String> availableStrategies = [
    'Hybrid',
    'Momentum',
    'Breakout',
    'SMA Crossover',
    'MeanReversion',
    'Heikin Ashi',
    'Sentiment',
  ];
  String selectedStrategy = 'Hybrid';
  String? lastSignal;
  double totalProfit = 0.0;
  bool isTrading = false;
  int consecutiveLosses = 0;

  Future<void> placeTrade({
    required String symbol,
    required String side,
    required double quantity,
    required double price,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final amount = quantity * price;
      final trade = TradeRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        symbol: symbol,
        side: side.toUpperCase(),
        amount: amount,
        entryPrice: price,
        enteredAt: DateTime.now(),
        status: 'open',
      );

      openTrades.add(trade);
      balance -= amount;
      lastSignal = side.toUpperCase();
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> analyzeReal({
    required String symbol,
    required String strategy,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      await Future<void>.delayed(const Duration(milliseconds: 250));
      lastSignal =
          strategy == 'Momentum' || strategy == 'Breakout' ? 'BUY' : 'SELL';
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> closeTrade(
    String tradeId, {
    double? closePrice,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final index = openTrades.indexWhere((trade) => trade.id == tradeId);
      if (index == -1) {
        throw Exception('Trade not found');
      }

      final trade = openTrades[index];
      final resolvedPrice = closePrice ?? trade.entryPrice;
      final realizedProfit = trade.side.toUpperCase() == 'BUY'
          ? resolvedPrice - trade.entryPrice
          : trade.entryPrice - resolvedPrice;

      final closedTrade = trade.copyWith(
        status: 'closed',
        closedAt: DateTime.now(),
        profit: realizedProfit,
      );

      openTrades.removeAt(index);
      closedTrades.add(closedTrade);

      balance += trade.amount;
      totalProfit += realizedProfit;

      if (realizedProfit < 0) {
        consecutiveLosses += 1;
      } else {
        consecutiveLosses = 0;
      }

      lastSignal = realizedProfit >= 0 ? 'BUY' : 'SELL';
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void selectStrategy(String strategy) {
    selectedStrategy = strategy;
    notifyListeners();
  }

  Future<void> syncBalance() async {
    loading = true;
    notifyListeners();

    try {
      await Future<void>.delayed(const Duration(milliseconds: 100));
    } catch (e) {
      error = e.toString();
      notifyListeners();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void startAutoTrading() {
    isTrading = true;
    error = null;
    notifyListeners();
  }

  void stopAutoTrading() {
    isTrading = false;
    notifyListeners();
  }
}
