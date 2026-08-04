import 'dart:async';

import 'package:flutter/material.dart';
import '../services/mexc_api_service.dart';
import '../services/auto_trading_strategies.dart';
import '../services/api_manager.dart';
import '../models/event_contract.dart';

class TradingProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  final AutoTradingStrategies _strategies = AutoTradingStrategies();

  final List<TradeRecord> _trades = [];
  bool _isTrading = false;
  String _selectedStrategy = 'Hybrid';
  double _balance = 0.0;
  String? _lastSignal;
  String? _error;
  bool _loading = false;

  // Bot state
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

  /// تحديث الرصيد من السيرفر
  Future<void> syncBalance() async {
    try {
      _balance = await _api.getUsdtBalance();
      notifyListeners();
    } catch (e) {
      _error = 'فشل تحديث الرصيد: $e';
      notifyListeners();
    }
  }

  /// تحليل السوق باستخدام بيانات Kline الحقيقية
  Future<Map<String, dynamic>?> analyzeReal(String symbol) async {
    try {
      // جلب Klines حقيقية
      final klines = await _api.getKlines(symbol, interval: '1h', limit: 50);
      if (klines.length < 20) return null;

      final prices = klines.map((k) => k['close'] as double).toList();
      final volumes = klines.map((k) => k['volume'] as double).toList();

      // حساب RSI حقيقي
      final rsi = await _api.calculateRSI(symbol, period: 14, interval: '1h');
      // حساب SMAs حقيقية
      final smas = await _api.calculateSMAs(symbol, periods: [5, 20], interval: '1h');

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
          result = _strategies.sentimentStrategy(prices, volumes);
          break;
        case 'SMA Crossover':
          result = _strategies.smaCrossover(prices);
          break;
        case 'Heikin Ashi':
          result = _strategies.heikinAshiSignal(prices);
          break;
        case 'Hybrid':
        default:
          result = _strategies.hybridStrategy(prices, volumes);
          break;
      }

      // دمج المؤشرات الحقيقية
      result['rsi'] = rsi;
      result['sma5'] = smas['SMA5'];
      result['sma20'] = smas['SMA20'];
      result['prices'] = prices;

      _lastSignal = result['signal'];
      notifyListeners();
      return result;
    } catch (e) {
      _error = 'خطأ في التحليل: $e';
      notifyListeners();
      return null;
    }
  }

  /// Legacy analyze for backward compatibility
  Future<Map<String, dynamic>?> analyze(String symbol, List<double> prices, {List<double>? volumes}) async {
    return analyzeReal(symbol);
  }

  /// تنفيذ صفقة حقيقية (Market Order)
  Future<bool> placeTrade({
    required String symbol,
    required String side,
    required double amount,
    required double price,
    String strategy = 'Manual',
    bool isLimit = false,
    double? limitPrice,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      // تحديث الرصيد قبل التنفيذ
      await syncBalance();

      if (_balance <= 0) {
        _error = 'الرصيد غير كافٍ للتداول';
        _loading = false;
        notifyListeners();
        return false;
      }

      Map<String, dynamic> order;
      if (isLimit && limitPrice != null) {
        final quantity = amount / price;
        order = await _api.placeLimitOrder(
          symbol: symbol,
          side: side,
          quantity: quantity,
          price: limitPrice,
        );
      } else {
        // Market Order
        if (side.toUpperCase() == 'BUY') {
          // للشراء: نستخدم quoteOrderQty لتحديد مبلغ USDT المطلوب إنفاقه
          order = await _api.placeMarketOrder(
            symbol: symbol,
            side: side,
            quoteOrderQty: amount,
          );
        } else {
          // للبيع: نستخدم quantity (كمية العملة الأساسية)
          final quantity = amount / price;
          order = await _api.placeMarketOrder(
            symbol: symbol,
            side: side,
            quantity: quantity,
          );
        }
      }

      final orderId = order['orderId']?.toString() ?? '';
      final status = order['status']?.toString() ?? 'NEW';
      final executedPrice = double.tryParse(order['price']?.toString() ?? '0') ?? price;

      final trade = TradeRecord(
        id: orderId.isNotEmpty ? orderId : DateTime.now().millisecondsSinceEpoch.toString(),
        symbol: symbol,
        side: side,
        amount: amount,
        entryPrice: executedPrice > 0 ? executedPrice : price,
        entryTime: DateTime.now(),
        status: status == 'FILLED' ? 'CLOSED' : 'OPEN',
        strategy: strategy,
      );

      _trades.insert(0, trade);

      // إذا تم التنفيذ فوراً، نحسب الربح/الخسارة
      if (status == 'FILLED') {
        await syncBalance();
      }

      _loading = false;
      notifyListeners();
      return true;
    } on MexcRateLimitException catch (e) {
      _error = 'تم تجاوز حد الطلبات. الرجاء الانتظار: $e';
      _loading = false;
      notifyListeners();
      return false;
    } on MexcApiException catch (e) {
      _error = 'خطأ من MEXC: ${e.message}';
      _loading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'خطأ غير متوقع: $e';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  /// إغلاق صفقة (تنفيذ أمر معاكس)
  Future<bool> closeTrade(TradeRecord trade, double exitPrice) async {
    _loading = true;
    notifyListeners();

    try {
      final closeSide = trade.side == 'BUY' ? 'SELL' : 'BUY';
      final quantity = trade.amount / trade.entryPrice;

      if (closeSide.toUpperCase() == 'BUY') {
        // لإغلاق صفقة بيع (شراء العملة الأساسية): نستخدم quoteOrderQty
        await _api.placeMarketOrder(
          symbol: trade.symbol,
          side: closeSide,
          quoteOrderQty: trade.amount,
        );
      } else {
        // لإغلاق صفقة شراء (بيع العملة الأساسية): نستخدم quantity
        await _api.placeMarketOrder(
          symbol: trade.symbol,
          side: closeSide,
          quantity: quantity,
        );
      }

      final profit = trade.side == 'BUY'
          ? (exitPrice - trade.entryPrice) * trade.amount
          : (trade.entryPrice - exitPrice) * trade.amount;

      final index = _trades.indexWhere((t) => t.id == trade.id);
      if (index != -1) {
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

        if (profit < 0) {
          _consecutiveLosses++;
        } else {
          _consecutiveLosses = 0;
        }
      }

      await syncBalance();
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'فشل إغلاق الصفقة: $e';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  /// تشغيل البوت التلقائي
  void startAutoTrading() {
    if (_isTrading) return;
    _isTrading = true;
    _consecutiveLosses = 0;
    notifyListeners();

    // تنفيذ دورة التداول فوراً ثم كل 30 ثانية
    _botCycle();
    _botTimer = Timer.periodic(const Duration(seconds: 30), (_) => _botCycle());
  }

  /// إيقاف البوت
  void stopAutoTrading() {
    _isTrading = false;
    _botTimer?.cancel();
    _botTimer = null;
    notifyListeners();
  }

  /// دورة البوت التلقائي
  Future<void> _botCycle() async {
    if (!_isTrading) return;

    // إيقاف مؤقت إذا تجاوزنا الخسائر المتتالية
    if (_consecutiveLosses >= 3) {
      _error = '⚠️ توقف البوت تلقائياً بعد 3 خسائر متتالية';
      stopAutoTrading();
      return;
    }

    try {
      for (final pair in MexcApiService.eventPairs) {
        if (!_isTrading) break;

        final symbol = pair['symbol']!;

        // تحقق سريع من صلاحية الرمز لتجنب أخطاء غير ضرورية
        final isValid = await _api.isValidSymbol(symbol);
        if (!isValid) continue;

        final analysis = await analyzeReal(symbol);
        if (analysis == null) continue;

        final signal = analysis['signal']?.toString();
        if (signal == null || signal == 'HOLD') continue;

        // جلب السعر الحالي
        final currentPrice = await _api.getCurrentPrice(symbol);
        if (currentPrice <= 0) continue;

        await syncBalance();

        // حساب مبلغ التداول (2% من الرصيد كحد أقصى)
        final tradeAmount = _balance * 0.02;
        if (tradeAmount < 5) continue; // الحد الأدنى 5 USDT

        await placeTrade(
          symbol: symbol,
          side: signal,
          amount: tradeAmount,
          price: currentPrice,
          strategy: _selectedStrategy,
        );
      }
    } catch (e) {
      _error = 'خطأ في دورة البوت: $e';
      notifyListeners();
    }
  }

  List<TradeRecord> get openTrades =>
      _trades.where((t) => t.status == 'OPEN').toList();

  List<TradeRecord> get closedTrades =>
      _trades.where((t) => t.status == 'CLOSED').toList();

  double get totalProfit => closedTrades.fold(0.0, (sum, t) => sum + (t.profit ?? 0));

  @override
  void dispose() {
    _botTimer?.cancel();
    super.dispose();
  }
}
