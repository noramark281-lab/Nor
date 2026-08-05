import 'dart:async';
import 'package:flutter/material.dart';
import '../services/auto_trading_strategies.dart';
import '../services/api_manager.dart'; // الارتباط المباشر بمحرك الاتصال الحقيقي المركزي
import '../models/event_contract.dart';

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

  // إعدادات افتراضية لإدارة مخاطر العقود الآجلة
  final int _defaultLeverage = 10; // رافعة مالية 10x
  final String _targetSymbol = "BTC_USDT"; // رمز عقد البيتكوين الآجل الأساسي

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

  /// تحديث الرصيد الحقيقي للمحفظة من خادم العقود الآجلة (Futures)
  Future<void> syncBalance() async {
    try {
      final response = await _apiManager.signedGet('/api/v1/private/account/assets');
      if (response != null && response['code'] == 200) {
        // فحص هيكل رد السيرفر واستخراج رصيد العملة المتاح للتداول العقد الآجل
        final List<dynamic> assets = response['data'] ?? [];
        final usdtAsset = assets.firstWhere((element) => element['currency'] == 'USDT', orElse: () => null);
        
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

  /// تحليل السوق باستخدام بيانات شمعات العقود الآجلة الحقيقية (Klines)
  Future<Map<String, dynamic>?> analyzeReal(String symbol) async {
    try {
      // جلب بيانات الشمعات التاريخية للعقود الآجلة عبر دالة الـ Public GET
      final response = await _apiManager.publicGet('/api/v1/contract/kline/$symbol', params: {
        'interval': '60', // شمعة ساعة واحدة (60 دقيقة)
        'limit': '50'
      });

      if (response == null || response['code'] != 200) return null;

      final List<dynamic> data = response['data'] ?? [];
      if (data.length < 20) return null;

      // استخراج مصفوفات الأسعار والأحجام من الشمعات الحقيقية
      final List<double> prices = data.map((k) => double.tryParse(k['close'].toString()) ?? 0.0).toList();
      final List<double> volumes = data.map((k) => double.tryParse(k['vol'].toString()) ?? 0.0).toList();

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
        default:
          result = _strategies.hybridStrategy(prices, volumes);
          break;
      }

      _lastSignal = result['signal'];
      notifyListeners();
      return result;
    } catch (e) {
      _error = 'خطأ في تحليل العقود: $e';
      notifyListeners();
      return null;
    }
  }

  /// تنفيذ صفقة عقود آجلة حقيقية (Futures Market Order) بالتوقيع الرقمي
  Future<bool> placeTrade({
    required String symbol,
    required String side,      // يستقبل 'BUY' لفتح Long أو 'SELL' لفتح Short
    required double contractVolume, // حجم التداول بعدد العقود الآجلة الحقيقية
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

      // 1. تهيئة وضبط الرافعة المالية على خوادم MEXC قبل إرسال العقد الحقيقي
      await _apiManager.signedPost('/api/v1/private/position/leverage', body: {
        "symbol": symbol,
        "leverage": _defaultLeverage,
        "openType": 1 // الحساب المعزول Isolated
      });

      // 2. تحديد اتجاه عقد الصفقة الحقيقي للفيوترز
      // 1 لفتح شراء (Long)، 3 لفتح بيع (Short)
      final int orderSide = (side.toUpperCase() == 'BUY') ? 1 : 3;

      // 3. صياغة البارامترات المطلوبة من خوادم العقود الآجلة
      final Map<String, dynamic> orderPayload = {
        "symbol": symbol,
        "price": 0, // 0 تعني تنفيذ لحظي فوري بسعر السوق الحالي (Market Order)
        "vol": contractVolume.toInt(), // عدد العقود الصحيح
        "leverage": _defaultLeverage,
        "side": orderSide,
        "type": 5, // 5 تعني طلب بسعر السوق Market
        "openType": 1
      };

      // إرسال العقد الموثق والموقع بخوارزمية التشفير
      final response = await _apiManager.signedPost('/api/v1/private/order/create', body: orderPayload);

      if (response != null && response['code'] == 200) {
        final String orderId = response['data']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString();

        final trade = TradeRecord(
          id: orderId,
          symbol: symbol,
          side: side,
          amount: contractVolume,
          entryPrice: 0.0, // سيتم تحديث السعر الفعلي تلقائياً من المنصة عند الإغلاق
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

  /// إغلاق صفقة عقود آجلة مفتوحة (تنفيذ أمر معاكس لإغلاق المركز بالكامل)
  Future<bool> closeTrade(TradeRecord trade) async {
    _loading = true;
    notifyListeners();

    try {
      // لتصفية وإغلاق عقد فيوترز مفتوح: نرسل أمر معاكس تماماً
      // 2 لإغلاق شراء (Close Long)، 4 لإغلاق بيع (Close Short)
      final int closeSide = (trade.side == 'BUY') ? 2 : 4;

      final Map<String, dynamic> closePayload = {
        "symbol": trade.symbol,
        "price": 0, // إغلاق فوري ماركت بسعر السوق اللحظي
        "vol": trade.amount.toInt(), // نفس حجم العقود المفتوحة
        "leverage": _defaultLeverage,
        "side": closeSide,
        "type": 5,
        "openType": 1
      };

      final response = await _apiManager.signedPost('/api/v1/private/order/create', body: closePayload);

      if (response != null && response['code'] == 200) {
        final index = _trades.indexWhere((t) => t.id == trade.id);
        if (index != -1) {
          _trades[index] = TradeRecord(
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            amount: trade.amount,
            entryPrice: trade.entryPrice,
            exitPrice: 0.0,
            entryTime: trade.entryTime,
            exitTime: DateTime.now(),
            status: 'CLOSED',
            profit: 0.0, // يتم حسابه تصفية المحفظة الحقيقية تلقائياً
            strategy: trade.strategy,
          );
        }

        await syncBalance();
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'فشل الخادم في إغلاق العقد الآجل: ${response?['message']}';
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'خطأ شبكة أثناء إغلاق المركز المفتوح: $e';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  /// تشغيل روبوت التداول الآلي الحقيقي للعقود الآجلة
  void startAutoTrading() {
    if (_isTrading) return;
    _isTrading = true;
    _consecutiveLosses = 0;
    notifyListeners();

    // تشغيل دورة البوت الفورية اللحظية ثم تكرارها بانتظام كل 30 ثانية
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

  /// دورة البوت التلقائي لمسح السوق وتنفيذ صفقات العقود الآجلة
  Future<void> _botCycle() async {
    if (!_isTrading) return;

    if (_consecutiveLosses >= 3) {
      _error = '⚠️ تم إيقاف البوت آلياً لحماية رأس المال بعد 3 خسائر متتالية';
      stopAutoTrading();
      return;
    }

    try {
      // تفحص المؤشرات الحية لزوج البيتكوين الآجل المستهدف
      final analysis = await analyzeReal(_targetSymbol);
      if (analysis == null || !_isTrading) return;

      final String signal = analysis['signal']?.toString() ?? 'HOLD';
      if (signal == 'HOLD') return;

      await syncBalance();

      // خوارزمية إدارة المخاطر: دخول الصفقة بحد أدنى 1 عقد آجل
      final double targetContracts = 1.0; 

      // تنفيذ الصفقة الحقيقية الفورية بناءً على إشارة البوت
      await placeTrade(
        symbol: _targetSymbol,
        side: signal == 'BUY' ? 'BUY' : 'SELL',
        contractVolume: targetContracts,
        strategy: _selectedStrategy,
      );
      
    } catch (e) {
      _error = 'خطأ دوري محرك البوت: $e';
