import 'dart:convert';
import 'dart:developer' show debugPrint;
import 'package:http/http.dart' as http;
import 'api_manager.dart';

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

  /// Cancel all orders for a symbol
  Future<bool> cancelAllOrders(String symbol) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    final body = <String, dynamic>{
      'symbol': symbol,
    };

    final bodyString = jsonEncode(body);
    final headers = manager.getAuthHeadersForPost(bodyString);
    final url = Uri.parse('$_baseUrl/api/v1/private/order/cancel_all');

    debugPrint('[MexcApiService] POST $url body=$bodyString');

    final response = await _client.post(url, headers: headers, body: bodyString);
    debugPrint('[MexcApiService] order/cancel_all status=${response.statusCode}');

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

  /// Get position info
  Future<List<Map<String, dynamic>>> getPositions({String? symbol}) async {
    final manager = MexcApiManager();
    if (!manager.isInitialized) {
      throw Exception('مفاتيح API غير مفعلة');
    }

    var queryString = '';
    if (symbol != null && symbol.isNotEmpty) {
      queryString = 'symbol=$symbol';
    }

    final headers = manager.getAuthHeadersForGet(queryString);
    final url = Uri.parse('$_baseUrl/api/v1/private/position/list${queryString.isNotEmpty ? '?$queryString' : ''}');

    debugPrint('[MexcApiService] GET $url');

    final response = await _client.get(url, headers: headers);
    debugPrint('[MexcApiService] position/list status=${response.statusCode}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('data') && data['data'] is List) {
        return (data['data'] as List).map((e) => e as Map<String, dynamic>).toList();
      }
      return [];
    } else {
      throw Exception('فشل في جلب المراكز: ${response.statusCode} ${response.body}');
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
