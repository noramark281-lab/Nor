import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:http/http.dart' as http;
import 'api_manager.dart';
import '../models/trading_pair.dart';

enum FuturesTradingStatus {
  notConfigured,
  ready,
  contractUnavailable,
  accountUnavailable,
  apiUnavailable,
  unknownError,
}

class FuturesTradingReadiness {
  final FuturesTradingStatus status;
  final String message;
  final String? symbol;

  const FuturesTradingReadiness({
    required this.status,
    required this.message,
    this.symbol,
  });

  bool get canPlaceOrders => status == FuturesTradingStatus.ready;
}

class MexcApiException implements Exception {
  final String message;
  final int? code;

  const MexcApiException(this.message, {this.code});

  bool get isContractUnavailable =>
      code == 1002 || message.toLowerCase().contains('contract not activated');

  bool get isApiPermissionUnavailable =>
      code == 511 || code == 701 || code == 702 || code == 703 || code == 704;

  @override
  String toString() => message;
}

/// ═══════════════════════════════════════════════════════════════════
/// MEXC Futures API v1 Service
/// ═══════════════════════════════════════════════════════════════════
///
/// Base URL: https://api.mexc.com
///
/// Public Endpoints (no auth):
///   GET /api/v1/contract/detail       → contract details
///   GET /api/v1/contract/ticker       → ticker / 24h stats
///
/// Private Endpoints (auth required):
///   GET  /api/v1/private/account/assets           → wallet balances
///   GET  /api/v1/private/order/list/open_orders   → open orders
///   POST /api/v1/private/order/create             → place order
///   POST /api/v1/private/order/cancel             → cancel order
///   GET  /api/v1/private/order/list/order_deals   → trade history
///
class MexcApiService {
  static const String _baseUrl = 'https://api.mexc.com';

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

  /// Get all contract details (public).
  ///
  /// MEXC exposes country-aware contract metadata at this endpoint, including
  /// `state` and `apiAllowed`, both of which must permit trading before an
  /// automated strategy may submit an order.
  Future<List<Map<String, dynamic>>> getContractDetails() async {
    final url = Uri.parse('$_baseUrl/api/v1/contract/detail/country');
    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    debugPrint('[MexcApiService] contract/detail/country status=${response.statusCode}');
    if (response.statusCode != 200) {
      throw MexcApiException('تعذر جلب حالة عقود MEXC (${response.statusCode}).');
    }

    final payload = jsonDecode(response.body);
    if (payload is Map && payload['success'] == true) {
      final rawData = payload['data'];
      if (rawData is List) {
        return rawData.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList();
      }
      if (rawData is Map) return [Map<String, dynamic>.from(rawData)];
    }
    return [];
  }

  /// Returns status information for exactly one requested Futures contract.
  Future<Map<String, dynamic>?> getContractInfo(String symbol) async {
    final url = Uri.parse('$_baseUrl/api/v1/contract/detail/country?symbol=$symbol');
    final response = await _client.get(url, headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }).timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      throw MexcApiException('تعذر التحقق من العقد $symbol (${response.statusCode}).');
    }

    final payload = jsonDecode(response.body);
    if (payload is Map && payload['success'] == true) {
      final rawData = payload['data'];
      if (rawData is Map) return Map<String, dynamic>.from(rawData);
      if (rawData is List) {
        for (final item in rawData) {
          if (item is Map && item['symbol']?.toString() == symbol) {
            return Map<String, dynamic>.from(item);
          }
        }
      }
    }
    return null;
  }

  /// Verifies account access and public contract availability without placing
  /// an order. This deliberately does not test write permission by submitting
  /// a real trade.
  Future<FuturesTradingReadiness> verifyFuturesReadiness({
    String symbol = 'BTC_USDT',
  }) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      return const FuturesTradingReadiness(
        status: FuturesTradingStatus.notConfigured,
        message: 'أدخل مفاتيح MEXC أولاً قبل استخدام العقود.',
      );
    }

    try {
      final contract = await getContractInfo(symbol);
      final state = int.tryParse(contract?['state']?.toString() ?? '');
      final apiAllowed = contract?['apiAllowed'] == true ||
          contract?['apiAllowed']?.toString().toLowerCase() == 'true';
      if (contract == null || state != 0 || !apiAllowed) {
        return FuturesTradingReadiness(
          status: FuturesTradingStatus.contractUnavailable,
          symbol: symbol,
          message: 'العقد $symbol غير متاح حالياً لتداول API. اختر عقداً مفعّلاً أو راجع حالة العقود في MEXC.',
        );
      }

      final response = await _client
          .get(
            Uri.parse('$_baseUrl/api/v1/private/account/assets'),
            headers: manager.getAuthHeadersForGet(''),
          )
          .timeout(const Duration(seconds: 10));
      final payload = jsonDecode(response.body);
      if (response.statusCode == 200 && payload is Map && payload['success'] == true) {
        return FuturesTradingReadiness(
          status: FuturesTradingStatus.ready,
          symbol: symbol,
          message: 'حساب Futures والعقد $symbol متاحان. تأكد أيضاً من صلاحية وضع الأوامر لمفتاح API قبل التداول.',
        );
      }

      final code = payload is Map ? int.tryParse(payload['code']?.toString() ?? '') : null;
      final message = payload is Map ? payload['message']?.toString() : null;
      if (code == 1002 || (message?.toLowerCase().contains('contract not activated') ?? false)) {
        return FuturesTradingReadiness(
          status: FuturesTradingStatus.contractUnavailable,
          symbol: symbol,
          message: 'رفضت MEXC العقد $symbol لأنه غير مفعّل أو غير متاح لتداول API.',
        );
      }
      if (code == 511 || code == 701 || code == 702 || code == 703 || code == 704) {
        return FuturesTradingReadiness(
          status: FuturesTradingStatus.apiUnavailable,
          symbol: symbol,
          message: 'صلاحيات مفتاح MEXC لا تسمح بالوصول إلى Futures. فعّل Read وTrade/Futures للمفتاح ثم أعد التحقق.',
        );
      }
      return FuturesTradingReadiness(
        status: FuturesTradingStatus.accountUnavailable,
        symbol: symbol,
        message: 'تعذر التحقق من حساب Futures${message == null || message.isEmpty ? '' : ': $message'}',
      );
    } on MexcApiException catch (e) {
      return FuturesTradingReadiness(
        status: e.isContractUnavailable ? FuturesTradingStatus.contractUnavailable : FuturesTradingStatus.unknownError,
        symbol: symbol,
        message: e.isContractUnavailable
            ? 'العقد $symbol غير مفعّل أو غير متاح لتداول API في MEXC.'
            : e.message,
      );
    } catch (_) {
      return FuturesTradingReadiness(
        status: FuturesTradingStatus.unknownError,
        symbol: symbol,
        message: 'تعذر التحقق من جاهزية Futures. تحقق من الاتصال ومفاتيح API ثم أعد المحاولة.',
      );
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

  /// Get balances only from authenticated MEXC Futures and Spot endpoints.
  Future<Map<String, Map<String, double>>> getRealBalances() async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    final balances = <String, Map<String, double>>{};
    String lastError = '';

    // 1. Try MEXC Futures Assets
    try {
      final headers = manager.getAuthHeadersForGet('');
      final url = Uri.parse('$_baseUrl/api/v1/private/account/assets');
      debugPrint('[MexcApiService] Fetching Futures balances: $url');

      final response = await _client.get(url, headers: headers).timeout(const Duration(seconds: 8));
      debugPrint('[MexcApiService] Futures response code: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data.containsKey('data')) {
          final rawData = data['data'];

          // Handle if data is a List of assets: [{"currency": "USDT", "availableBalance": 10.5, ...}]
          if (rawData is List) {
            for (final item in rawData) {
              if (item is Map) {
                final curr = (item['currency'] ?? item['asset'] ?? '').toString().toUpperCase();
                if (curr.isNotEmpty) {
                  final free = _parseDouble(item['availableBalance'] ?? item['available'] ?? item['cashBalance'] ?? item['equity'] ?? 0);
                  final locked = _parseDouble(item['frozenBalance'] ?? item['frozen'] ?? 0);
                  balances[curr] = {
                    'free': free,
                    'locked': locked,
                  };
                }
              }
            }
          }
          // Handle if data is a Map of assets: {"USDT": {"availableBalance": 10.5, ...}}
          else if (rawData is Map) {
            rawData.forEach((key, assetInfo) {
              if (assetInfo is Map) {
                final curr = key.toString().toUpperCase();
                final free = _parseDouble(assetInfo['availableBalance'] ?? assetInfo['available'] ?? assetInfo['cashBalance'] ?? assetInfo['equity'] ?? 0);
                final locked = _parseDouble(assetInfo['frozenBalance'] ?? assetInfo['frozen'] ?? 0);
                balances[curr] = {
                  'free': free,
                  'locked': locked,
                };
              }
            });
          }
        }
      }
    } catch (e) {
      debugPrint('[MexcApiService] Futures balances error: $e');
      lastError = e.toString();
    }

    // 2. Try MEXC Spot Account (api.mexc.com)
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final queryString = 'timestamp=$timestamp';
      final signature = manager.signSpotQuery(queryString);
      final spotUrl = Uri.parse('https://api.mexc.com/api/v3/account?$queryString&signature=$signature');
      debugPrint('[MexcApiService] Fetching Spot account: $spotUrl');

      final spotResponse = await _client.get(spotUrl, headers: manager.getSpotHeaders()).timeout(const Duration(seconds: 8));
      debugPrint('[MexcApiService] Spot response code: ${spotResponse.statusCode}');

      if (spotResponse.statusCode == 200) {
        final spotData = jsonDecode(spotResponse.body);
        if (spotData is Map && spotData.containsKey('balances') && spotData['balances'] is List) {
          for (final item in spotData['balances']) {
            if (item is Map) {
              final asset = (item['asset'] ?? '').toString().toUpperCase();
              final free = _parseDouble(item['free'] ?? 0);
              final locked = _parseDouble(item['locked'] ?? 0);
              if (asset.isNotEmpty && (free > 0 || locked > 0 || asset == 'USDT')) {
                final existing = balances[asset];
                if (existing != null) {
                  balances[asset] = {
                    'free': (existing['free'] ?? 0) + free,
                    'locked': (existing['locked'] ?? 0) + locked,
                  };
                } else {
                  balances[asset] = {
                    'free': free,
                    'locked': locked,
                  };
                }
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('[MexcApiService] Spot balances error: $e');
      if (lastError.isEmpty) lastError = e.toString();
    }

    // Always guarantee USDT entry
    if (!balances.containsKey('USDT')) {
      balances['USDT'] = {'free': 0.0, 'locked': 0.0};
    }

    return balances;
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

  /// Places a Futures order and returns only a MEXC-confirmed order result.
  ///
  /// The application does not create a local success record if the exchange
  /// rejects the request or omits `data.orderId`.
  Future<Map<String, dynamic>> placeOrder({
    required String symbol,
    required String side,
    required String type,
    required double volume,
    required double price,
    double? leverage,
    String openType = 'ISOLATED',
  }) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw StateError('مفاتيح API غير مفعلة.');
    }
    if (volume <= 0 || price <= 0) {
      throw ArgumentError('الكمية والسعر يجب أن يكونا أكبر من صفر.');
    }

    final normalizedSide = side.toUpperCase();
    final normalizedType = type.toUpperCase();
    final sideCode = <String, int>{
      'BUY_OPEN': 1,
      'SELL_CLOSE': 2,
      'SELL_OPEN': 3,
      'BUY_CLOSE': 4,
    }[normalizedSide];
    final typeCode = <String, int>{
      'LIMIT': 1,
      'MARKET': 5,
    }[normalizedType];
    final openTypeCode = <String, int>{
      'ISOLATED': 1,
      'CROSSED': 2,
    }[openType.toUpperCase()];

    if (sideCode == null || typeCode == null || openTypeCode == null) {
      throw ArgumentError('معلمات أمر MEXC غير صالحة.');
    }

    final body = <String, dynamic>{
      'symbol': symbol,
      'price': price,
      'vol': volume,
      'side': sideCode,
      'type': typeCode,
      'openType': openTypeCode,
      if (leverage != null && (normalizedSide == 'BUY_OPEN' || normalizedSide == 'SELL_OPEN'))
        'leverage': leverage.round(),
    };
    final bodyString = jsonEncode(body);
    final url = Uri.parse('$_baseUrl/api/v1/private/order/create');
    final response = await _client
        .post(url, headers: manager.getAuthHeadersForPost(bodyString), body: bodyString)
        .timeout(const Duration(seconds: 15));

    debugPrint('[MexcApiService] order/create status=${response.statusCode}');
    dynamic payload;
    try {
      payload = jsonDecode(response.body);
    } catch (_) {
      payload = null;
    }

    if (response.statusCode != 200) {
      throw _orderException(
        payload,
        symbol: symbol,
        fallback: 'رفضت MEXC الأمر (${response.statusCode}).',
      );
    }

    if (payload is Map && payload['success'] == true && payload['data'] is Map) {
      final order = Map<String, dynamic>.from(payload['data'] as Map);
      final orderId = order['orderId']?.toString();
      if (orderId != null && orderId.isNotEmpty) return order;
    }

    throw _orderException(
      payload,
      symbol: symbol,
      fallback: 'لم تؤكد MEXC إنشاء الأمر.',
    );
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
        return data['success'] == true;
      }
      return false;
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

  MexcApiException _orderException(
    dynamic payload, {
    required String symbol,
    required String fallback,
  }) {
    final code = payload is Map ? int.tryParse(payload['code']?.toString() ?? '') : null;
    final serverMessage = payload is Map ? payload['message']?.toString().trim() : null;
    final normalizedMessage = serverMessage?.toLowerCase() ?? '';

    if (code == 1002 || normalizedMessage.contains('contract not activated')) {
      return MexcApiException(
        'لم يُنشأ أي أمر: العقد $symbol غير مفعّل أو لا يسمح بتداول API حالياً. افتح/فعّل Futures في MEXC، وتأكد أن العقد متاح، ثم أعد التحقق.',
        code: 1002,
      );
    }
    if (code == 511 || code == 701 || code == 702 || code == 703 || code == 704) {
      return MexcApiException(
        'لم يُنشأ أي أمر: مفتاح MEXC لا يملك الصلاحية المطلوبة لقراءة أو وضع أوامر Futures. فعّل Read وTrade/Futures للمفتاح ثم أعد التحقق.',
        code: code,
      );
    }
    return MexcApiException(
      '$fallback${serverMessage == null || serverMessage.isEmpty ? '' : ' $serverMessage'}',
      code: code,
    );
  }

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
