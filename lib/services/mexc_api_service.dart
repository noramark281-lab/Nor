import 'dart:async';
import 'dart:math' as math;
import 'api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// MEXC API Service - التداول الحقيقي المباشر / العقود الآجلة وعقود الأحداث
/// ═══════════════════════════════════════════════════════════════
class MexcApiService {
  static final MexcApiService _instance = MexcApiService._internal();
  factory MexcApiService() => _instance;
  MexcApiService._internal();

  final _api = MexcApiManager();

  List<Map<String, dynamic>>? _exchangeInfoCache;
  DateTime? _exchangeInfoCacheTime;

  // 1) الرصيد والحساب الحقيقي
  Future<Map<String, Map<String, double>>> getRealBalances() async {
    final dynamic response = await _api.signedGet('/api/v3/account');
    final balances = <String, Map<String, double>>{};

    if (response is Map<String, dynamic> && response['balances'] is List) {
      for (final b in response['balances']) {
        final free = double.tryParse(b['free'].toString()) ?? 0.0;
        final locked = double.tryParse(b['locked'].toString()) ?? 0.0;
        if (free > 0 || locked > 0) {
          balances[b['asset'].toString()] = {'free': free, 'locked': locked};
        }
      }
    }
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
    } catch (_) {
      return false;
    }
  }

  Future<bool> testApiKeys() async {
    try {
      await _api.signedGet('/api/v3/account');
      return true;
    } catch (_) {
      return false;
    }
  }

  // 2) بيانات السوق الحية
  Future<Map<String, dynamic>?> getTicker24hr(String symbol) async {
    try {
      final res = await _api.publicGet('/api/v3/ticker/24hr', params: {'symbol': symbol});
      if (res is Map<String, dynamic>) return res;
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getAllTickers24hr() async {
    try {
      final dynamic res = await _api.publicGet('/api/v3/ticker/24hr');
      List list = [];
      if (res is List) {
        list = res;
      } else if (res is Map<String, dynamic> && res['data'] is List) {
        list = res['data'] as List;
      }
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (e) {
      throw Exception('فشل تحميل بيانات السوق: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getExchangeInfo({String? symbol}) async {
    if (_exchangeInfoCache != null && _exchangeInfoCacheTime != null) {
      if (DateTime.now().difference(_exchangeInfoCacheTime!) < const Duration(minutes: 5)) {
        if (symbol == null) return _exchangeInfoCache!;
        return _exchangeInfoCache!.where((s) => s['symbol'] == symbol).toList();
      }
    }

    try {
      final params = symbol != null ? {'symbol': symbol} : null;
      final dynamic data = await _api.publicGet('/api/v3/exchangeInfo', params: params);
      List symbols = [];
      if (data is Map<String, dynamic> && data['symbols'] is List) {
        symbols = data['symbols'] as List;
      }
      final result = symbols.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      _exchangeInfoCache = result;
      _exchangeInfoCacheTime = DateTime.now();
      return result;
    } catch (e) {
      throw Exception('فشل تحميل معلومات البورصة: $e');
    }
  }

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
        } else if (filterType == 'PRICE_FILTER') {
          result['tickSize'] = double.tryParse(f['tickSize'].toString()) ?? 0.01;
        }
      }
      return result;
    } catch (_) {
      return null;
    }
  }

  double _roundQuantity(double qty, double stepSize) {
    if (stepSize <= 0) return qty;
    return (qty / stepSize).floorToDouble() * stepSize;
  }

  Future<List<Map<String, dynamic>>> getKlines(
    String symbol, {
    String interval = '1h',
    int limit = 100,
  }) async {
    try {
      final dynamic res = await _api.publicGet('/api/v3/klines', params: {
        'symbol': symbol,
        'interval': interval,
        'limit': limit.toString(),
      });

      List list = [];
      if (res is List) {
        list = res;
      } else if (res is Map<String, dynamic> && res['data'] is List) {
        list = res['data'] as List;
      }

      return list.map((e) {
        final arr = e as List;
        return {
          'openTime': arr[0],
          'open': double.tryParse(arr[1].toString()) ?? 0.0,
          'high': double.tryParse(arr[2].toString()) ?? 0.0,
          'low': double.tryParse(arr[3].toString()) ?? 0.0,
          'close': double.tryParse(arr[4].toString()) ?? 0.0,
          'volume': double.tryParse(arr[5].toString()) ?? 0.0,
          'closeTime': arr[6],
        };
      }).toList();
    } catch (e) {
      throw Exception('فشل تحميل الشموع: $e');
    }
  }

  // 3) التنفيذ الحقيقي للأوامر
  Future<Map<String, dynamic>> placeMarketOrder({
    required String symbol,
    required String side,
    required double quantity,
  }) async {
    final filters = await getSymbolFilters(symbol);
    double qty = quantity;
    if (filters != null && filters['stepSize'] != null) {
      qty = _roundQuantity(quantity, filters['stepSize'] as double);
    }

    final dynamic res = await _api.signedPost('/api/v3/order', body: {
      'symbol': symbol,
      'side': side.toUpperCase(),
      'type': 'MARKET',
      'quantity': qty.toStringAsFixed(6),
    });
    return Map<String, dynamic>.from(res as Map);
  }

  Future<Map<String, dynamic>> placeLimitOrder({
    required String symbol,
    required String side,
    required double quantity,
    required double price,
    String timeInForce = 'GTC',
  }) async {
    final filters = await getSymbolFilters(symbol);
    double qty = quantity;
    double prc = price;
    if (filters != null) {
      if (filters['stepSize'] != null) {
        qty = _roundQuantity(quantity, filters['stepSize'] as double);
      }
      if (filters['tickSize'] != null) {
        final tickSize = filters['tickSize'] as double;
        prc = (price / tickSize).floorToDouble() * tickSize;
      }
    }

    final dynamic res = await _api.signedPost('/api/v3/order', body: {
      'symbol': symbol,
      'side': side.toUpperCase(),
      'type': 'LIMIT',
      'quantity': qty.toStringAsFixed(6),
      'price': prc.toStringAsFixed(4),
      'timeInForce': timeInForce,
    });
    return Map<String, dynamic>.from(res as Map);
  }

  // 4) الأوامر والصفقات
  Future<List<Map<String, dynamic>>> getOpenOrders({String? symbol}) async {
    if (symbol != null) {
      try {
        final dynamic data = await _api.signedGet('/api/v3/openOrders', params: {'symbol': symbol});
        List list = data is List ? data : ((data is Map && data['data'] is List) ? data['data'] : []);
        return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      } catch (_) {
        return [];
      }
    }

    final allOrders = <Map<String, dynamic>>[];
    for (final pair in eventPairs) {
      final sym = pair['symbol']!;
      try {
        final dynamic data = await _api.signedGet('/api/v3/openOrders', params: {'symbol': sym});
        List list = data is List ? data : ((data is Map && data['data'] is List) ? data['data'] : []);
        allOrders.addAll(list.map((e) => {
          ...Map<String, dynamic>.from(e as Map),
          'symbol': sym,
        }));
        await Future.delayed(const Duration(milliseconds: 30));
      } catch (_) {}
    }
    return allOrders;
  }

  Future<List<Map<String, dynamic>>> getMyTrades(String symbol, {int limit = 500}) async {
    try {
      final dynamic data = await _api.signedGet('/api/v3/myTrades', params: {
        'symbol': symbol,
        'limit': limit.toString(),
      });
      List list = data is List ? data : ((data is Map && data['data'] is List) ? data['data'] : []);
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // 5) Technical Indicators
  Future<double> calculateRSI(String symbol, {int period = 14, String interval = '1h'}) async {
    try {
      final klines = await getKlines(symbol, interval: interval, limit: period + 100);
      if (klines.length < period + 1) return 0.0;

      final prices = klines.map((k) => k['close'] as double).toList();
      double gain = 0;
      double loss = 0;

      for (int i = 1; i <= period; i++) {
        final diff = prices[i] - prices[i - 1];
        if (diff >= 0)
          gain += diff;
        else
          loss -= diff;
      }

      double avgGain = gain / period;
      double avgLoss = loss / period;

      for (int i = period + 1; i < prices.length; i++) {
        final diff = prices[i] - prices[i - 1];
        if (diff >= 0) {
          avgGain = (avgGain * (period - 1) + diff) / period;
          avgLoss = (avgLoss * (period - 1)) / period;
        } else {
          avgGain = (avgGain * (period - 1)) / period;
          avgLoss = (avgLoss * (period - 1) - diff) / period;
        }
      }

      if (avgLoss == 0) return 100.0;
      final rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    } catch (_) {
      return 0.0;
    }
  }

  Future<Map<String, double>> calculateSMAs(String symbol, {required List<int> periods, String interval = '1h'}) async {
    try {
      final maxPeriod = periods.reduce(math.max);
      final klines = await getKlines(symbol, interval: interval, limit: maxPeriod);
      final prices = klines.map((k) => k['close'] as double).toList();

      final result = <String, double>{};
      for (final p in periods) {
        if (prices.length >= p) {
          final sum = prices.sublist(prices.length - p).reduce((a, b) => a + b);
          result['SMA$p'] = sum / p;
        } else {
          result['SMA$p'] = 0.0;
        }
      }
      return result;
    } catch (_) {
      return {};
    }
  }

  Future<double> getCurrentPrice(String symbol) async {
    final ticker = await getTicker24hr(symbol);
    return double.tryParse(ticker?['lastPrice']?.toString() ?? '0') ?? 0.0;
  }

  Future<List<Map<String, dynamic>>> getAllMyTrades() async {
    final allTrades = <Map<String, dynamic>>[];
    for (final pair in eventPairs) {
      final sym = pair['symbol']!;
      final trades = await getMyTrades(sym);
      allTrades.addAll(trades.map((t) => {...t, 'symbol': sym}));
      await Future.delayed(const Duration(milliseconds: 50));
    }
    return allTrades;
  }

  Future<bool> cancelOrder(String symbol, String orderId) async {
    try {
      await _api.signedDelete('/api/v3/order', params: {
        'symbol': symbol,
        'orderId': orderId,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

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
