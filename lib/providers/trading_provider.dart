import 'dart:async';
import 'package:flutter/material.dart';
import '../services/auto_trading_strategies.dart';
import '../services/api_manager.dart';


class TradingProvider with ChangeNotifier {
  final MexcApiManager _apiManager = MexcApiManager();
  final AutoTradingStrategies _strategies = AutoTradingStrategies();

  final List<TradeRecord> _trades = [];
  bool _isTrading = false;
  String _selectedStrategy = 'Hybrid';
  double _balance = 0.0;
  String? _lastSignal;
  String? _error;
  bool _loading = false;

  final int _defaultLeverage = 10;
  final String _targetSymbol = "BTC_USDT";

  Timer? _botTimer;
  int _consecutiveLosses = 0;

  List<TradeRecord> get trades => _trades;
  bool get isTrading => _isTrading;
  String get selectedStrategy => _selectedStrategy;
  double get balance => _balance;
  String? get lastSignal => _lastSignal;
  String? get error => _error;
  bool get loading => _loading;
  int get consecutiveLosses => _consecutiveLosses;

  List<TradeRecord> get openTrades => _trades.where((t) => t.isOpen).toList();
  List<TradeRecord> get closedTrades => _trades.where((t) => !t.isOpen).toList();

  double get totalProfit {
    return closedTrades.fold(0.0, (sum, t) => sum + (t.profit ?? 0.0));
  }

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

  Future<void> syncBalance() async {
    try {
      final response = await _apiManager.signedGet('/api/v1/private/account/assets');
      if (response != null && response['code'] == 200) {
        final List<dynamic> assets = response['data'] ?? [];
        final usdtAsset = assets.firstWhere(
          (element) => element['currency'] == 'USDT',
          orElse: () => null,
        );
        if (usdtAsset != null) {
          _balance = double.tryParse(usdtAsset['availableBalance'].toString()) ?? 0.0;
        }
      }
      notifyListeners();
    } catch (e) {
      _error = 'فشل تحديث رصيد العقود الآجلة: $e';
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> analyzeReal(String symbol) async {
    try {
      final klines = await _apiManager.publicGet('/api/v1/contract/kline/$symbol', params: {
        'interval': '60',
        'limit': '50',
      });
      if (klines == null || klines['code'] != 200) return null;

      final List<dynamic> list = klines['data'] ?? [];
      if (list.length < 20) return null;

      final closes = list.map((e) => double.tryParse(e['close'].toString()) ?? 0.0).toList();
      final volumes = list.map((e) => double.tryParse(e['vol'].toString()) ?? 0.0).toList();

      final short = _strategies.calculateSMA(closes, 5);
      final long = _strategies.calculateSMA(closes, 20);
      final rsi = _strategies.calculateRSI(closes, 14);
      final boll = _strategies.calculateBollinger(closes, 20, 2);
      final lastPrice = closes.last;
      final prevPrice = closes[closes.length - 2];
      final volAvg = _strategies.calculateSMA(volumes, 20);
      final volSpike = volumes.last > volAvg * 1.5;

      return {
        'price': lastPrice,
        'trend': short > long ? 'Bullish' : 'Bearish',
        'rsi': rsi,
        'bollinger': boll,
        'momentum': ((lastPrice - prevPrice) / prevPrice) * 100,
        'volSpike': volSpike,
        'shortSMA': short,
        'longSMA': long,
      };
    } catch (e) {
      _error = 'فشل تحليل السوق الحقيقي: $e';
      notifyListeners();
      return null;
    }
  }

  Future<bool> placeTrade({
    required String symbol,
    required String side,
    required double amount,
    required double price,
    bool isLimit = false,
    double? limitPrice,
    String strategy = 'Manual',
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      await syncBalance();
      if (_balance <= 0) {
        _error = 'رصيد محفظة العقود الآجلة غير كافٍ للتداول';
        _loading = false;
        notifyListeners();
        return false;
      }

      // Set leverage before trading
      await _apiManager.signedPost('/api/v1/private/position/leverage', body: {
        "symbol": symbol,
        "leverage": _defaultLeverage,
        "openType": 1
      });

      final int orderSide = (side.toUpperCase() == 'BUY') ? 1 : 3;
      final int orderType = isLimit ? 1 : 5;
      final double orderPrice = (isLimit && limitPrice != null && limitPrice > 0) ? limitPrice : 0;

      final Map<String, dynamic> orderPayload = {
        "symbol": symbol,
        "price": orderPrice,
        "vol": amount.toInt(),
        "leverage": _defaultLeverage,
        "side": orderSide,
        "type": orderType,
        "openType": 1
      };

      final response = await _apiManager.signedPost('/api/v1/private/order/create', body: orderPayload);

      if (response != null && response['code'] == 200) {
        final String orderId = response['data']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString();

        final trade = TradeRecord(
          id: orderId,
          symbol: symbol,
          side: side,
          amount: amount,
          entryPrice: isLimit ? (limitPrice ?? 0) : price,
          entryTime: DateTime.now(),
          status: 'OPEN',
          strategy: strategy,
        );

        _trades.insert(0, trade);
        await syncBalance();
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'رفضت المنصة تنفيذ العقد: ${response?['message'] ?? 'خطأ غير معروف'}';
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'خطأ اتصال فادح أثناء التداول الحقيقي: $e';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> closeTrade(TradeRecord trade) async {
    try {
      final int closeSide = (trade.side == 'BUY') ? 2 : 4;
      final response = await _apiManager.signedPost('/api/v1/private/order/create', body: {
        "symbol": trade.symbol,
        "price": 0,
        "vol": trade.amount.toInt(),
        "leverage": _defaultLeverage,
        "side": closeSide,
        "type": 5,
        "openType": 1
      });

      if (response != null && response['code'] == 200) {
        final exitPrice = trade.amount > 0 ? trade.amount * trade.entryPrice : 0.0;
        final profit = exitPrice - (trade.amount * trade.entryPrice);
        final tradeIndex = _trades.indexOf(trade);
        if (tradeIndex != -1) {
          _trades[tradeIndex] = trade.copyWith(
            exitPrice: exitPrice,
            profit: profit,
            exitTime: DateTime.now(),
            status: 'CLOSED',
          );
        }
        if (profit < 0) {
          _consecutiveLosses++;
        } else {
          _consecutiveLosses = 0;
        }
        await syncBalance();
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'فشل إغلاق الصفقة: $e';
      notifyListeners();
      return false;
    }
  }

  void startAutoTrading() {
    if (_isTrading) return;
    _isTrading = true;
    _error = null;
    notifyListeners();
    _botTimer = Timer.periodic(const Duration(minutes: 2), (_) => _botCycle());
  }

  void stopAutoTrading() {
    _isTrading = false;
    _botTimer?.cancel();
    _botTimer = null;
    notifyListeners();
  }

  Future<void> _botCycle() async {
    if (!_isTrading) return;

    try {
      await syncBalance();
      if (_balance < 5) {
        _error = 'رصيد غير كافٍ للبوت (الحد الأدنى 5 USDT)';
        _isTrading = false;
        notifyListeners();
        return;
      }
      if (_consecutiveLosses >= 3) {
        _error = 'تم إيقاف البوت بعد 3 خسائر متتالية';
        _isTrading = false;
        notifyListeners();
        return;
      }

      final analysis = await analyzeReal(_targetSymbol);
      if (analysis == null) return;

      final signal = _strategies.generateSignal(
        analysis,
        strategy: _selectedStrategy,
      );

      _lastSignal = signal;
      notifyListeners();

      if (signal == 'BUY' || signal == 'SELL') {
        final tradeAmount = _balance * 0.05;
        if (tradeAmount < 1) return;

        await placeTrade(
          symbol: _targetSymbol,
          side: signal,
          amount: tradeAmount,
          price: analysis['price'] as double,
          strategy: 'Auto_$_selectedStrategy',
        );
      }
    } catch (e) {
      _error = 'خطأ دورة البوت: $e';
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

class TradeRecord {
  final String id;
  final String symbol;
  final String side;
  final double amount;
  final double entryPrice;
  final DateTime entryTime;
  final String status;
  final String strategy;
  final double? exitPrice;
  final double? profit;
  final DateTime? exitTime;

  bool get isOpen => status == 'OPEN';

  TradeRecord({
    required this.id,
    required this.symbol,
    required this.side,
    required this.amount,
    required this.entryPrice,
    required this.entryTime,
    this.status = 'OPEN',
    this.strategy = 'Manual',
    this.exitPrice,
    this.profit,
    this.exitTime,
  });

  TradeRecord copyWith({
    double? exitPrice,
    double? profit,
    DateTime? exitTime,
    String? status,
  }) {
    return TradeRecord(
      id: id,
      symbol: symbol,
      side: side,
      amount: amount,
      entryPrice: entryPrice,
      entryTime: entryTime,
      status: status ?? this.status,
      strategy: strategy,
      exitPrice: exitPrice ?? this.exitPrice,
      profit: profit ?? this.profit,
      exitTime: exitTime ?? this.exitTime,
    );
  }
}
