import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:http/http.dart' as http;
import 'api_manager.dart';
import '../models/trading_pair.dart';

/// ═══════════════════════════════════════════════════════════════════
/// MEXC Futures API v1 Service
/// ═══════════════════════════════════════════════════════════════════
///
/// Base URL: https://contract.mexc.com
///
/// Public Endpoints (no auth):
///   GET /api/v1/contract/detail       → contract details
///   GET /api/v1/contract/ticker       → ticker / 24h stats
///
/// Private Endpoints (auth required):
///   GET  /api/v1/private/account/assets           → wallet balances
///   GET  /api/v1/private/order/list/open_orders   → open orders
///   POST /api/v1/private/order/submit             → place order
///   POST /api/v1/private/order/cancel             → cancel order
///   GET  /api/v1/private/order/list/order_deals   → trade history
///
class MexcApiService {
  static const String _baseUrl = 'https://contract.mexc.com';

  // ── Supported Futures Pairs (MEXC format: BTC_USDT) ─────────────
  static const List<Map<String, String>> eventPairs = [
    {'symbol': 'BTC_USDT', 'name': 'Bitcoin', 'category': 'Crypto'},
    {'symbol': 'ETH_USDT', 'name': 'Ethereum', 'category': 'Crypto'},
    {'symbol': 'SOL_USDT', 'name': 'Solana', 'category': 'Crypto'},
    {'symbol': 'XRP_USDT', 'name': 'Ripple', 'category': 'Crypto'},
    {'symbol': 'DOGE_USDT', 'name': 'Dogecoin', 'category': 'Crypto'},
    {'symbol': 'ADA_USDT', 'name': 'Cardano', 'category': 'Crypto'},
    {'symbol': 'AVAX_USDT', 'name': 'Avalanche', 'category': 'Crypto'},
    {'symbol': 'LINK_USDT', 'name': 'Chainlink', 'category': 'Crypto'},
  ];

  // ── HTTP Client ─────────────────────────────────────────────────
  final http.Client _client = http.Client();

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═════════════════════════════════════════════════════════════════

  /// Get all contract details (public)
  Future<List<Map<String, dynamic>>> getContractDetails() async {
    final url = Uri.parse('$_baseUrl/api/v1/contract/detail');
    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    debugPrint('[MexcApiService] contract/detail status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data')) {
        final list = data['data'];
        if (list is List) {
          return list.map((e) => e as Map<String, dynamic>).toList();
        }
      }
      return [];
    } else {
      throw Exception('فشل في جلب تفاصيل العقود: ${response.statusCode} ${response.body}');
    }
  }

  /// Get 24h ticker data for all contracts (public)
  Future<List<Map<String, dynamic>>> getAllTickers24hr() async {
    final url = Uri.parse('$_baseUrl/api/v1/contract/ticker');
    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    debugPrint('[MexcApiService] contract/ticker status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data')) {
        final list = data['data'];
        if (list is List) {
          return list.map((e) => e as Map<String, dynamic>).toList();
        }
      }
      return [];
    } else {
      throw Exception('فشل في جلب بيانات السوق: ${response.statusCode} ${response.body}');
    }
  }

  /// Get market info as TradingPairs for UI (public)
  Future<List<TradingPair>> getMarketInfo() async {
    final tickers = await getAllTickers24hr();
    return tickers.map((t) {
      final symbol = t['symbol']?.toString() ?? '';
      final parts = symbol.split('_');
      final base = parts.isNotEmpty ? parts[0] : symbol;
      final quote = parts.length > 1 ? parts[1] : 'USDT';
      final lastPrice = _parseDouble(t['lastPrice'] ?? t['lastEp'] ?? t['price'] ?? 0);
      final priceChangePercent = _parseDouble(t['priceChangePercent'] ?? t['riseFallRate'] ?? t['changeRate'] ?? 0);
      final volume24h = _parseDouble(t['volume24h'] ?? t['amount24'] ?? t['vol24'] ?? 0);
      return TradingPair(
        symbol: symbol,
        base: base,
        quote: quote,
        lastPrice: lastPrice,
        priceChangePercent: priceChangePercent,
        volume24h: volume24h,
        category: 'Futures',
      );
    }).toList();
  }

  /// Get ticker for a single symbol (public)
  Future<Map<String, dynamic>?> getTicker(String symbol) async {
    final url = Uri.parse('$_baseUrl/api/v1/contract/ticker?symbol=$symbol');
    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data')) {
        final tickerData = data['data'];
        if (tickerData is Map) {
          return tickerData as Map<String, dynamic>;
        }
      }
      return null;
    }
    return null;
  }

  // ═════════════════════════════════════════════════════════════════
  // PRIVATE ENDPOINTS (Auth Required)
  // ═════════════════════════════════════════════════════════════════

  /// Get account assets / wallet balances
  Future<Map<String, Map<String, double>>> getRealBalances() async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    const queryString = '';
    final headers = manager.getAuthHeadersForGet(queryString);
    final url = Uri.parse('$_baseUrl/api/v1/private/account/assets');

    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: headers);
    debugPrint('[MexcApiService] account/assets status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final balances = <String, Map<String, double>>{};

      if (data is Map && data.containsKey('data') && data['data'] is Map) {
        final assetsData = data['data'] as Map<String, dynamic>;

        // MEXC Futures returns assets keyed by currency
        assetsData.forEach((currency, assetInfo) {
          if (assetInfo is Map) {
            final free = _parseDouble(assetInfo['availableBalance'] ?? assetInfo['available'] ?? 0);
            final locked = _parseDouble(assetInfo['frozenBalance'] ?? assetInfo['frozen'] ?? 0);
            balances[currency.toUpperCase()] = {
              'free': free,
              'locked': locked,
            };
          }
        });
      }

      // Ensure USDT is present
      if (!balances.containsKey('USDT')) {
        balances['USDT'] = {'free': 0.0, 'locked': 0.0};
      }

      return balances;
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      throw Exception('خطأ في المصادقة: ${response.statusCode}. تحقق من مفاتيح API.');
    } else {
      throw Exception('فشل في جلب الأرصدة: ${response.statusCode} ${response.body}');
    }
  }

  /// Get open orders
  Future<List<Map<String, dynamic>>> getOpenOrders({String? symbol}) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    var queryString = '';
    if (symbol != null && symbol.isNotEmpty) {
      queryString = 'symbol=$symbol';
    }

    final headers = manager.getAuthHeadersForGet(queryString);
    final url = Uri.parse('$_baseUrl/api/v1/private/order/list/open_orders${queryString.isNotEmpty ? '?$queryString' : ''}');

    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: headers);
    debugPrint('[MexcApiService] open_orders status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data') && data['data'] is List) {
        return (data['data'] as List).map((e) => e as Map<String, dynamic>).toList();
      }
      return [];
    } else {
      throw Exception('فشل في جلب الأوامر المفتوحة: ${response.statusCode} ${response.body}');
    }
  }

  /// Place a new futures order
  Future<Map<String, dynamic>?> placeOrder({
    required String symbol,
    required String side,        // "BUY_OPEN" / "SELL_OPEN" / "BUY_CLOSE" / "SELL_CLOSE"
    required String type,        // "LIMIT" / "MARKET"
    required double volume,      // position size
    double? price,               // required for LIMIT
    double? leverage,
    String? openType,            // "ISOLATED" / "CROSSED"
  }) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    final body = <String, dynamic>{
      'symbol': symbol,
      'side': side,
      'type': type,
      'vol': volume,
      if (price != null) 'price': price,
      if (leverage != null) 'leverage': leverage,
      if (openType != null) 'openType': openType,
    };

    final bodyString = jsonEncode(body);
    final headers = manager.getAuthHeadersForPost(bodyString);
    final url = Uri.parse('$_baseUrl/api/v1/private/order/submit');

    debugPrint('[MexcApiService] POST $url body=$bodyString');

    final response = await _client.post(url, headers: headers, body: bodyString);
    debugPrint('[MexcApiService] order/submit status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data')) {
        return data['data'] as Map<String, dynamic>;
      }
      return data as Map<String, dynamic>?;
    } else {
      throw Exception('فشل في إرسال الأمر: ${response.statusCode} ${response.body}');
    }
  }

  /// Cancel an order
  Future<bool> cancelOrder(String symbol, String orderId) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    final body = <String, dynamic>{
      'symbol': symbol,
      'orderId': orderId,
    };

    final bodyString = jsonEncode(body);
    final headers = manager.getAuthHeadersForPost(bodyString);
    final url = Uri.parse('$_baseUrl/api/v1/private/order/cancel');

    debugPrint('[MexcApiService] POST $url body=$bodyString');

    final response = await _client.post(url, headers: headers, body: bodyString);
    debugPrint('[MexcApiService] order/cancel status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map) {
        final success = data['success'] ?? true;
        return success == true || success == 1;
      }
      return true;
    }
    return false;
  }

  /// Cancel all orders for a symbol (cancel each individually as cancel_all is not a v1 endpoint)
  Future<bool> cancelAllOrders(String symbol) async {
    try {
      final orders = await getOpenOrders(symbol: symbol);
      for (final order in orders) {
        final orderId = order['orderId']?.toString() ?? order['id']?.toString();
        if (orderId != null) {
          await cancelOrder(symbol, orderId);
        }
      }
      return true;
    } catch (e) {
      debugPrint('[MexcApiService] cancelAllOrders error: $e');
      return false;
    }
  }

  /// Get order deals / trade history
  Future<List<Map<String, dynamic>>> getAllMyTrades({String? symbol, int pageSize = 50}) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    var queryString = 'pageSize=$pageSize';
    if (symbol != null && symbol.isNotEmpty) {
      queryString += '&symbol=$symbol';
    }

    final headers = manager.getAuthHeadersForGet(queryString);
    final url = Uri.parse('$_baseUrl/api/v1/private/order/list/order_deals?$queryString');

    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: headers);
    debugPrint('[MexcApiService] order_deals status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data') && data['data'] is List) {
        return (data['data'] as List).map((e) => e as Map<String, dynamic>).toList();
      }
      return [];
    } else {
      throw Exception('فشل في جلب سجل الصفقات: ${response.statusCode} ${response.body}');
    }
  }

  /// Get position info (derived from open orders)
  Future<List<Map<String, dynamic>>> getPositions({String? symbol}) async {
    try {
      final orders = await getOpenOrders(symbol: symbol);
      // Derive positions from open orders for v1 compatibility
      return orders.where((o) => o['type']?.toString().toUpperCase().contains('OPEN') ?? false).toList();
    } catch (e) {
      debugPrint('[MexcApiService] getPositions error: $e');
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // KLINE / CANDLESTICK DATA (Public)
  // ═════════════════════════════════════════════════════════════════

  /// Fetch kline/candlestick data for a symbol
  /// interval: Min1, Min5, Min15, Min30, Hour1, Hour4, Day1
  Future<List<CandleData>> getKlines(String symbol, {String interval = 'Min1', int limit = 100}) async {
    final url = Uri.parse('$_baseUrl/api/v1/contract/kline?symbol=$symbol&interval=$interval');
    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    debugPrint('[MexcApiService] kline status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data')) {
        final klineData = data['data'];
        if (klineData is Map) {
          final times = (klineData['time'] as List?)?.map((e) => e is int ? e : int.tryParse(e.toString()) ?? 0).toList() ?? [];
          final opens = (klineData['open'] as List?)?.map((e) => _parseDouble(e)).toList() ?? [];
          final closes = (klineData['close'] as List?)?.map((e) => _parseDouble(e)).toList() ?? [];
          final highs = (klineData['high'] as List?)?.map((e) => _parseDouble(e)).toList() ?? [];
          final lows = (klineData['low'] as List?)?.map((e) => _parseDouble(e)).toList() ?? [];
          final vols = (klineData['vol'] as List?)?.map((e) => _parseDouble(e)).toList() ?? [];

          final candles = <CandleData>[];
          final count = [times.length, opens.length, closes.length, highs.length, lows.length].reduce((a, b) => a < b ? a : b);
          for (int i = 0; i < count; i++) {
            candles.add(CandleData(
              timestamp: DateTime.fromMillisecondsSinceEpoch(times[i] * 1000),
              open: opens[i],
              high: highs[i],
              low: lows[i],
              close: closes[i],
              volume: vols.isNotEmpty && i < vols.length ? vols[i] : 0.0,
            ));
          }
          return candles;
        }
      }
      return [];
    } else {
      debugPrint('[MexcApiService] kline error: ${response.statusCode} ${response.body}');
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════════════════════════════════

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}

/// OHLC Candle data point
class CandleData {
  final DateTime timestamp;
  final double open;
  final double high;
  final double low;
  final double close;
  final double volume;

  CandleData({
    required this.timestamp,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });

  bool get isBullish => close >= open;
  bool get isBearish => close < open;
  double get bodyTop => close > open ? close : open;
  double get bodyBottom => close > open ? open : close;
  double get bodyHeight => (close - open).abs();
  double get wickHigh => high;
  double get wickLow => low;
}
