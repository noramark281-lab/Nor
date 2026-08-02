import 'dart:async';
import 'dart:convert';
import 'dart:math' show Random;

import 'api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// MEXC API Service - التداول الحقيقي عبر MEXC API v3
///
/// يوفر:
/// • جلب رصيد الحساب الحقيقي
/// • تنفيذ أوامر السوق والحد الحقيقية
/// • جلب بيانات السوق الحية (الأسعار، الحجم، التغير)
/// • إدارة الأوامر (استعلام، إلغاء)
/// • دعم عقود الحدث من خلال أزواج التداول الحقيقية
/// ═══════════════════════════════════════════════════════════════════
class MexcApiService {
  static final MexcApiService _instance = MexcApiService._internal();
  factory MexcApiService() => _instance;
  MexcApiService._internal();

  final _api = MexcApiManager();
  final _random = Random();

  // ═══════════════════════════════════════════════════════════════
  // 1) بيانات الحساب والرصيد (حقيقية)
  // ═══════════════════════════════════════════════════════════════

  /// يجلب رصيد الحساب الحقيقي من MEXC
  /// يُرجع Map<symbol, {free: ..., locked: ...}>
  Future<Map<String, Map<String, double>>> getRealBalances() async {
    final response = await _api.signedGet('/api/v3/account');
    final data = jsonDecode(response.body);
    final balances = <String, Map<String, double>>{};

    if (data['balances'] != null) {
      for (final b in data['balances']) {
        final free = double.tryParse(b['free'].toString()) ?? 0.0;
        final locked = double.tryParse(b['locked'].toString()) ?? 0.0;
        if (free > 0 || locked > 0) {
          balances[b['asset']] = {'free': free, 'locked': locked};
        }
      }
    }
    return balances;
  }

  /// يجلب إجمالي رصيد USDT المتاح للتداول
  Future<double> getUsdtBalance() async {
    final balances = await getRealBalances();
    final usdt = balances['USDT'];
    return usdt?['free'] ?? 0.0;
  }

  /// يتحقق من حالة الاتصال والمفاتيح
  Future<bool> testConnectivity() async {
    try {
      final response = await _api.publicGet('/api/v3/time');
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// يتحقق من صلاحية مفاتيح API
  Future<bool> testApiKeys() async {
    try {
      await _api.signedGet('/api/v3/account');
      return true;
    } catch (_) {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2) بيانات السوق الحية (حقيقية)
  // ═══════════════════════════════════════════════════════════════

  /// يجلب بيانات السوق لزوج تداول محدد
  Future<Map<String, dynamic>?> getTicker24hr(String symbol) async {
    try {
      final response = await _api.publicGet('/api/v3/ticker/24hr', params: {'symbol': symbol});
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  /// يجلب بيانات السوق لعدة أزواج
  Future<List<Map<String, dynamic>>> getAllTickers24hr() async {
    try {
      final response = await _api.publicGet('/api/v3/ticker/24hr');
      if (response.statusCode == 200) {
        final list = jsonDecode(response.body) as List;
        return list.map((e) => e as Map<String, dynamic>).toList();
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  /// يجلب معلومات جميع أزواج التداول المتاحة
  Future<List<Map<String, dynamic>>> getExchangeInfo({String? symbol}) async {
    try {
      final params = symbol != null ? {'symbol': symbol} : null;
      final response = await _api.publicGet('/api/v3/exchangeInfo', params: params);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final symbols = data['symbols'] as List;
        return symbols.map((e) => e as Map<String, dynamic>).toList();
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  /// يجلب بيانات Kline (الشموع) لتحليل فني
  /// interval: 1m, 5m, 15m, 1h, 4h, 1d
  Future<List<Map<String, dynamic>>> getKlines(
    String symbol, {
    String interval = '1h',
    int limit = 100,
  }) async {
    try {
      final response = await _api.publicGet('/api/v3/klines', params: {
        'symbol': symbol,
        'interval': interval,
        'limit': limit.toString(),
      });
      if (response.statusCode == 200) {
        final list = jsonDecode(response.body) as List;
        return list.map((e) {
          final arr = e as List;
          return {
            'openTime': arr[0],
            'open': double.tryParse(arr[1]) ?? 0,
            'high': double.tryParse(arr[2]) ?? 0,
            'low': double.tryParse(arr[3]) ?? 0,
            'close': double.tryParse(arr[4]) ?? 0,
            'volume': double.tryParse(arr[5]) ?? 0,
            'closeTime': arr[6],
          };
        }).toList();
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  /// يجلب السعر اللحظي لزوج تداول
  Future<double?> getCurrentPrice(String symbol) async {
    try {
      final response = await _api.publicGet('/api/v3/ticker/price', params: {'symbol': symbol});
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return double.tryParse(data['price'].toString());
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // 3) تنفيذ الأوامر الحقيقية (Market & Limit)
  // ═══════════════════════════════════════════════════════════════

  /// ينفذ أمر سوق حقيقي (MARKET ORDER)
  ///
  /// [symbol]  : زوج التداول، مثال: BTCUSDT
  /// [side]    : BUY أو SELL
  /// [quantity]: الكمية بالعملة الأساسية (مثال: 0.001 BTC)
  ///
  /// يُرجع بيانات الأمر المنفَّذ أو يرمي استثناءً
  Future<Map<String, dynamic>> placeMarketOrder({
    required String symbol,
    required String side, // 'BUY' or 'SELL'
    required double quantity,
  }) async {
    final response = await _api.signedPost('/api/v3/order', body: {
      'symbol': symbol,
      'side': side.toUpperCase(),
      'type': 'MARKET',
      'quantity': quantity.toStringAsFixed(8),
    });

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data;
  }

  /// ينفذ أمر حد حقيقي (LIMIT ORDER)
  ///
  /// [symbol]     : زوج التداول
  /// [side]       : BUY أو SELL
  /// [quantity]   : الكمية
  /// [price]      : السعر المطلوب
  /// [timeInForce]: GTC (Good Till Cancel) افتراضياً
  ///
  Future<Map<String, dynamic>> placeLimitOrder({
    required String symbol,
    required String side,
    required double quantity,
    required double price,
    String timeInForce = 'GTC',
  }) async {
    final response = await _api.signedPost('/api/v3/order', body: {
      'symbol': symbol,
      'side': side.toUpperCase(),
      'type': 'LIMIT',
      'quantity': quantity.toStringAsFixed(8),
      'price': price.toStringAsFixed(8),
      'timeInForce': timeInForce,
    });

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data;
  }

  // ═══════════════════════════════════════════════════════════════
  // 4) إدارة الأوامر (استعلام / إلغاء)
  // ═══════════════════════════════════════════════════════════════

  /// يستعلم عن حالة أمر محدد
  Future<Map<String, dynamic>?> queryOrder(String symbol, String orderId) async {
    try {
      final response = await _api.signedGet('/api/v3/order', params: {
        'symbol': symbol,
        'orderId': orderId,
      });
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  /// يُلغي أمراً محدداً
  Future<bool> cancelOrder(String symbol, String orderId) async {
    try {
      await _api.signedDelete('/api/v3/order', params: {
        'symbol': symbol,
        'orderId': orderId,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /// يجلب جميع الأوامر المفتوحة (غير المنفذة) لزوج محدد
  Future<List<Map<String, dynamic>>> getOpenOrders({String? symbol}) async {
    try {
      final params = symbol != null ? {'symbol': symbol} : null;
      final response = await _api.signedGet('/api/v3/openOrders', params: params);
      final list = jsonDecode(response.body) as List;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      return [];
    }
  }

  /// يجلب جميع الأوامر (المفتوحة والمغلقة) لزوج محدد
  Future<List<Map<String, dynamic>>> getAllOrders(
    String symbol, {
    int limit = 500,
  }) async {
    try {
      final response = await _api.signedGet('/api/v3/allOrders', params: {
        'symbol': symbol,
        'limit': limit.toString(),
      });
      final list = jsonDecode(response.body) as List;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5) البيانات التاريخية والمحفظة
  // ═══════════════════════════════════════════════════════════════

  /// يجلب سجل الصفقات المنفذة (My Trades)
  Future<List<Map<String, dynamic>>> getMyTrades(
    String symbol, {
    int limit = 500,
  }) async {
    try {
      final response = await _api.signedGet('/api/v3/myTrades', params: {
        'symbol': symbol,
        'limit': limit.toString(),
      });
      final list = jsonDecode(response.body) as List;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      return [];
    }
  }

  /// يجلب جميع الصفقات عبر جميع الأزواج (يتطلب استدعاءً لكل زوج)
  Future<List<Map<String, dynamic>>> getAllMyTrades() async {
    final trades = <Map<String, dynamic>>[];
    try {
      // نحصل على الأزواج المتاحة أولاً
      final symbols = await getExchangeInfo();
      // نقتصر على الأزواج الشائعة لتجنب Rate Limit
      final popularSymbols = [
        'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT',
        'DOGEUSDT', 'ADAUSDT', 'MATICUSDT', 'LINKUSDT',
      ];

      for (final sym in popularSymbols) {
        try {
          final symTrades = await getMyTrades(sym, limit: 20);
          trades.addAll(symTrades);
          // تأخير بسيط لتجنب الضغط على API
          await Future.delayed(const Duration(milliseconds: 100));
        } catch (_) {
          // ignore errors for individual symbols
        }
      }
    } catch (e) {
      // ignore
    }
    return trades;
  }

  // ═══════════════════════════════════════════════════════════════
  // 6) مؤشرات التحليل الفني (محسوبة محلياً من بيانات Kline)
  // ═══════════════════════════════════════════════════════════════

  /// يحسب RSI من بيانات Kline
  Future<double?> calculateRSI(String symbol, {int period = 14, String interval = '1h'}) async {
    final klines = await getKlines(symbol, interval: interval, limit: period + 1);
    if (klines.length < period + 1) return null;

    var gains = 0.0;
    var losses = 0.0;

    for (int i = 1; i <= period; i++) {
      final change = (klines[i]['close'] as double) - (klines[i - 1]['close'] as double);
      if (change > 0) {
        gains += change;
      } else {
        losses += change.abs();
      }
    }

    final avgGain = gains / period;
    final avgLoss = losses / period;

    if (avgLoss == 0) return 100.0;
    final rs = avgGain / avgLoss;
    return 100.0 - (100.0 / (1.0 + rs));
  }

  /// يحسب المتوسطات المتحركة
  Future<Map<String, double?>> calculateSMAs(
    String symbol, {
    List<int> periods = const [5, 10, 20, 50],
    String interval = '1h',
  }) async {
    final maxPeriod = periods.reduce((a, b) => a > b ? a : b);
    final klines = await getKlines(symbol, interval: interval, limit: maxPeriod);
    final result = <String, double?>{};

    for (final p in periods) {
      if (klines.length >= p) {
        double sum = 0;
        for (int i = klines.length - p; i < klines.length; i++) {
          sum += klines[i]['close'] as double;
        }
        result['SMA$p'] = sum / p;
      } else {
        result['SMA$p'] = null;
      }
    }
    return result;
  }

  /// يحسب Bollinger Bands
  Future<Map<String, double?>?> calculateBollingerBands(
    String symbol, {
    int period = 20,
    double multiplier = 2.0,
    String interval = '1h',
  }) async {
    final klines = await getKlines(symbol, interval: interval, limit: period);
    if (klines.length < period) return null;

    double sum = 0;
    for (final k in klines) {
      sum += k['close'] as double;
    }
    final sma = sum / period;

    double variance = 0;
    for (final k in klines) {
      variance += ((k['close'] as double) - sma) * ((k['close'] as double) - sma);
    }
    final stdDev = (variance / period).abs().sqrt();

    return {
      'middle': sma,
      'upper': sma + (multiplier * stdDev),
      'lower': sma - (multiplier * stdDev),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 7) أزواج مخصصة لعقود الحدث (تستند إلى أزواج حقيقية)
  // ═══════════════════════════════════════════════════════════════

  /// قائمة الأزواج الشائعة التي يمكن استخدامها كـ "عقود حدث"
  static const List<Map<String, String>> eventPairs = [
    {'symbol': 'BTCUSDT', 'name': 'Bitcoin UP/Down', 'category': 'crypto'},
    {'symbol': 'ETHUSDT', 'name': 'Ethereum UP/Down', 'category': 'crypto'},
    {'symbol': 'SOLUSDT', 'name': 'Solana UP/Down', 'category': 'crypto'},
    {'symbol': 'XRPUSDT', 'name': 'XRP UP/Down', 'category': 'crypto'},
    {'symbol': 'DOGEUSDT', 'name': 'Doge UP/Down', 'category': 'crypto'},
    {'symbol': 'ADAUSDT', 'name': 'Cardano UP/Down', 'category': 'crypto'},
    {'symbol': 'LINKUSDT', 'name': 'Chainlink UP/Down', 'category': 'crypto'},
    {'symbol': 'MATICUSDT', 'name': 'Polygon UP/Down', 'category': 'crypto'},
  ];
}

extension on double {
  double sqrt() {
    if (this <= 0) return 0;
    double x = this;
    double prev;
    do {
      prev = x;
      x = (x + this / x) / 2;
    } while ((x - prev).abs() > 0.0001);
    return x;
  }
}
