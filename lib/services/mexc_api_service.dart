import 'dart:async';
import 'dart:math' as math;
import 'api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// MEXC API Service - التداول الحقيقي عبر MEXC API v3
/// ═══════════════════════════════════════════════════════════════════
class MexcApiService {
  static final MexcApiService _instance = MexcApiService._internal();
  factory MexcApiService() => _instance;
  MexcApiService._internal();

  final _api = MexcApiManager();

  // Cache exchange info to avoid repeated calls
  List<Map<String, dynamic>>? _exchangeInfoCache;
  DateTime? _exchangeInfoCacheTime;

  // ═══════════════════════════════════════════════════════════════
  // 1) بيانات الحساب والرصيد (حقيقية)
  // ═══════════════════════════════════════════════════════════════

  Future<Map<String, Map<String, double>>> getRealBalances() async {
    final data = await _api.signedGet('/api/v3/account');
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
    ApiLogger.i('getRealBalances', 'Found ${balances.length} non-zero balances');
    return balances;
  }

  Future<double> getUsdtBalance() async {
    final balances = await getRealBalances();
    final usdt = balances['USDT'];
    return usdt?['free'] ?? 0.0;
  }

  Future<bool> testConnectivity() async {
    try {
      await _api.publicGet('/api/v3/time');
      return true;
    } catch (e) {
      ApiLogger.e('testConnectivity', 'Failed: $e');
      return false;
    }
  }

  Future<bool> testApiKeys() async {
    try {
      await _api.signedGet('/api/v3/account');
      return true;
    } catch (e) {
      ApiLogger.e('testApiKeys', 'Failed: $e');
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2) بيانات السوق الحية (حقيقية)
  // ═══════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>?> getTicker24hr(String symbol) async {
    try {
      return await _api.publicGet('/api/v3/ticker/24hr', params: {'symbol': symbol});
    } catch (e) {
      ApiLogger.e('getTicker24hr', '$symbol => $e');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getAllTickers24hr() async {
    try {
      final data = await _api.publicGet('/api/v3/ticker/24hr');
      final list = data['data'] as List? ?? [];
      ApiLogger.i('getAllTickers24hr', 'Loaded ${list.length} tickers');
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      ApiLogger.e('getAllTickers24hr', 'Failed: $e');
      throw Exception('فشل تحميل بيانات السوق: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getExchangeInfo({String? symbol}) async {
    // Return cached info if less than 5 minutes old
    if (_exchangeInfoCache != null && _exchangeInfoCacheTime != null) {
      if (DateTime.now().difference(_exchangeInfoCacheTime!) < const Duration(minutes: 5)) {
        if (symbol == null) return _exchangeInfoCache!;
        return _exchangeInfoCache!.where((s) => s['symbol'] == symbol).toList();
      }
    }

    try {
      final params = symbol != null ? {'symbol': symbol} : null;
      final data = await _api.publicGet('/api/v3/exchangeInfo', params: params);
      final symbols = data['symbols'] as List? ?? [];
      final result = symbols.map((e) => e as Map<String, dynamic>).toList();
      _exchangeInfoCache = result;
      _exchangeInfoCacheTime = DateTime.now();
      return result;
    } catch (e) {
      ApiLogger.e('getExchangeInfo', 'Failed: $e');
      throw Exception('فشل تحميل معلومات البورصة: $e');
    }
  }

  /// Get symbol filters (stepSize, minQty, tickSize, etc.)
  Future<Map<String, dynamic>?> getSymbolFilters(String symbol) async {
    try {
      final info = await getExchangeInfo(symbol: symbol);
      if (info.isEmpty) return null;
      final sym = info.first;
      final filters = sym['filters'] as List? ?? [];
      final result = <String, dynamic>{};
      for (final f in filters) {
        final filterType = f['filterType']?.toString() ?? '';
        if (filterType == 'LOT_SIZE') {
          result['stepSize'] = double.tryParse(f['stepSize'].toString()) ?? 0.00001;
          result['minQty'] = double.tryParse(f['minQty'].toString()) ?? 0.0;
          result['maxQty'] = double.tryParse(f['maxQty'].toString()) ?? double.infinity;
        } else if (filterType == 'MIN_NOTIONAL') {
          result['minNotional'] = double.tryParse(f['minNotional'].toString()) ?? 0.0;
        } else if (filterType == 'PRICE_FILTER') {
          result['tickSize'] = double.tryParse(f['tickSize'].toString()) ?? 0.01;
        }
      }
      return result;
    } catch (e) {
      ApiLogger.e('getSymbolFilters', '$symbol => $e');
      return null;
    }
  }

  /// Round quantity according to stepSize
  double _roundQuantity(double qty, double stepSize) {
    if (stepSize <= 0) return qty;
    final decimals = stepSize.toString().split('.').last.length;
    final multiplier = math.pow(10, decimals);
    return (qty / stepSize).floorToDouble() * stepSize;
  }

  Future<List<Map<String, dynamic>>> getKlines(
    String symbol, {
    String interval = '1h',
    int limit = 100,
  }) async {
    try {
      final data = await _api.publicGet('/api/v3/klines', params: {
        'symbol': symbol,
        'interval': interval,
        'limit': limit.toString(),
      });
      final list = data['data'] as List? ?? [];
      return list.map((e) {
        final arr = e as List;
        return {
          'openTime': arr[0],
          'open': double.tryParse(arr[1].toString()) ?? 0,
          'high': double.tryParse(arr[2].toString()) ?? 0,
          'low': double.tryParse(arr[3].toString()) ?? 0,
          'close': double.tryParse(arr[4].toString()) ?? 0,
          'volume': double.tryParse(arr[5].toString()) ?? 0,
          'closeTime': arr[6],
        };
      }).toList();
    } catch (e) {
      ApiLogger.e('getKlines', '$symbol => $e');
      throw Exception('فشل تحميل الشموع: $e');
    }
  }

  Future<double?> getCurrentPrice(String symbol) async {
    try {
      final data = await _api.publicGet('/api/v3/ticker/price', params: {'symbol': symbol});
      return double.tryParse(data['price'].toString());
    } catch (e) {
      ApiLogger.e('getCurrentPrice', '$symbol => $e');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3) تنفيذ الأوامر الحقيقية (Market & Limit)
  // ═══════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> placeMarketOrder({
    required String symbol,
    required String side,
    required double quantity,
  }) async {
    // Fetch filters and round quantity
    final filters = await getSymbolFilters(symbol);
    double qty = quantity;
    if (filters != null && filters['stepSize'] != null) {
      qty = _roundQuantity(quantity, filters['stepSize'] as double);
    }

    return await _api.signedPost('/api/v3/order', body: {
      'symbol': symbol,
      'side': side.toUpperCase(),
      'type': 'MARKET',
      'quantity': qty.toStringAsFixed(8),
    });
  }

  Future<Map<String, dynamic>> placeLimitOrder({
    required String symbol,
    required String side,
    required double quantity,
    required double price,
    String timeInForce = 'GTC',
  }) async {
    // Fetch filters and round quantity + price
    final filters = await getSymbolFilters(symbol);
    double qty = quantity;
    double prc = price;
    if (filters != null) {
      if (filters['stepSize'] != null) {
        qty = _roundQuantity(quantity, filters['stepSize'] as double);
      }
      if (filters['tickSize'] != null) {
        final tickSize = filters['tickSize'] as double;
        final decimals = tickSize.toString().split('.').last.length;
        final multiplier = math.pow(10, decimals);
        prc = (price / tickSize).floorToDouble() * tickSize;
      }
    }

    return await _api.signedPost('/api/v3/order', body: {
      'symbol': symbol,
      'side': side.toUpperCase(),
      'type': 'LIMIT',
      'quantity': qty.toStringAsFixed(8),
      'price': prc.toStringAsFixed(8),
      'timeInForce': timeInForce,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 4) إدارة الأوامر (استعلام / إلغاء)
  // ═══════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>?> queryOrder(String symbol, String orderId) async {
    try {
      return await _api.signedGet('/api/v3/order', params: {
        'symbol': symbol,
        'orderId': orderId,
      });
    } catch (e) {
      ApiLogger.e('queryOrder', '$symbol/$orderId => $e');
      return null;
    }
  }

  Future<bool> cancelOrder(String symbol, String orderId) async {
    try {
      await _api.signedDelete('/api/v3/order', params: {
        'symbol': symbol,
        'orderId': orderId,
      });
      return true;
    } catch (e) {
      ApiLogger.e('cancelOrder', '$symbol/$orderId => $e');
      return false;
    }
  }

  /// MEXC v3 openOrders requires a symbol param; without it returns error.
  /// We iterate all event pairs and aggregate results.
  Future<List<Map<String, dynamic>>> getOpenOrders({String? symbol}) async {
    if (symbol != null) {
      try {
        final data = await _api.signedGet('/api/v3/openOrders', params: {'symbol': symbol});
        final list = data['data'] as List? ?? [];
        ApiLogger.i('getOpenOrders', '$symbol => ${list.length} orders');
        return list.map((e) => e as Map<String, dynamic>).toList();
      } catch (e) {
        ApiLogger.e('getOpenOrders', '$symbol => $e');
        throw Exception('فشل تحميل الأوامر المفتوحة: $e');
      }
    }

    // No symbol provided — query all event pairs
    final allOrders = <Map<String, dynamic>>[];
    for (final pair in eventPairs) {
      final sym = pair['symbol']!;
      try {
        final data = await _api.signedGet('/api/v3/openOrders', params: {'symbol': sym});
        final list = data['data'] as List? ?? [];
        allOrders.addAll(list.map((e) => {
          ...e as Map<String, dynamic>,
          'symbol': sym,
        }));
        await Future.delayed(const Duration(milliseconds: 50));
      } catch (e) {
        ApiLogger.w('getOpenOrders', '$sym => $e (skipped)');
      }
    }
    ApiLogger.i('getOpenOrders', 'Total aggregated orders: ${allOrders.length}');
    return allOrders;
  }

  Future<List<Map<String, dynamic>>> getAllOrders(
    String symbol, {
    int limit = 500,
  }) async {
    try {
      final data = await _api.signedGet('/api/v3/allOrders', params: {
        'symbol': symbol,
        'limit': limit.toString(),
      });
      final list = data['data'] as List? ?? [];
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      ApiLogger.e('getAllOrders', '$symbol => $e');
      throw Exception('فشل تحميل الأوامر: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5) البيانات التاريخية والمحفظة
  // ═══════════════════════════════════════════════════════════════

  Future<List<Map<String, dynamic>>> getMyTrades(
    String symbol, {
    int limit = 500,
  }) async {
    try {
      final data = await _api.signedGet('/api/v3/myTrades', params: {
        'symbol': symbol,
        'limit': limit.toString(),
      });
      final list = data['data'] as List? ?? [];
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      ApiLogger.e('getMyTrades', '$symbol => $e');
      throw Exception('فشل تحميل صفقات $symbol: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getAllMyTrades() async {
    final trades = <Map<String, dynamic>>[];
    for (final pair in eventPairs) {
      final sym = pair['symbol']!;
      try {
        final symTrades = await getMyTrades(sym, limit: 20);
        trades.addAll(symTrades);
        await Future.delayed(const Duration(milliseconds: 50));
      } catch (e) {
        ApiLogger.w('getAllMyTrades', '$sym => $e (skipped)');
      }
    }
    ApiLogger.i('getAllMyTrades', 'Total trades loaded: ${trades.length}');
    return trades;
  }

  // ═══════════════════════════════════════════════════════════════
  // 6) مؤشرات التحليل الفني
  // ═══════════════════════════════════════════════════════════════

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
    final stdDev = math.sqrt(variance / period);

    return {
      'middle': sma,
      'upper': sma + (multiplier * stdDev),
      'lower': sma - (multiplier * stdDev),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 7) أزواج مخصصة لعقود الحدث
  // ═══════════════════════════════════════════════════════════════

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
