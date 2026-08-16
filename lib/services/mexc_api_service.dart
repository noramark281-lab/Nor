import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:http/http.dart' as http;
import 'api_manager.dart';
import '../models/trading_pair.dart';

/// MEXC Spot API V3 service.
///
/// This service intentionally contains NO Futures endpoints. All private
/// account/order operations use MEXC Spot REST API V3 at api.mexc.com.
/// The order path is the real POST /api/v3/order endpoint; no test-order
/// endpoint is used.
class MexcApiService {
  static const String _baseUrl = 'https://api.mexc.com';
  static const double fixedTradeUsd = 1.0;

  final http.Client _client = http.Client();

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

  String _apiSymbol(String symbol) => symbol.replaceAll('_', '').replaceAll('/', '').toUpperCase();

  String _uiSymbol(String symbol) {
    final s = _apiSymbol(symbol);
    if (s.endsWith('USDT') && s.length > 4) {
      return '${s.substring(0, s.length - 4)}_USDT';
    }
    return symbol;
  }

  double _parseDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }

  String _trimDecimal(double value) => value.toStringAsFixed(12).replaceFirst(RegExp(r'\.?0+$'), '');

  String _sign(String query) {
    final manager = MexcApiManager();
    final secret = manager.secretKey;
    if (!manager.isInitialized || secret == null || secret.isEmpty) {
      throw Exception('مفاتيح MEXC API غير مفعلة. أدخل API Key و Secret Key بصلاحية Spot Trading.');
    }
    return Hmac(sha256, utf8.encode(secret)).convert(utf8.encode(query)).toString();
  }

  Map<String, String> _authHeaders() => MexcApiManager().getSpotHeaders();

  String _query(Map<String, dynamic> params) {
    return params.entries
        .where((e) => e.value != null)
        .map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value.toString())}')
        .join('&');
  }

  Future<dynamic> _privateGet(String path, Map<String, dynamic> params) async {
    final all = <String, dynamic>{...params, 'timestamp': DateTime.now().millisecondsSinceEpoch};
    final query = _query(all);
    final uri = Uri.parse('$_baseUrl$path?$query&signature=${_sign(query)}');
    final response = await _client.get(uri, headers: _authHeaders()).timeout(const Duration(seconds: 12));
    final data = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('MEXC Spot API ${response.statusCode}: ${response.body}');
    }
    return data;
  }

  Future<dynamic> _privateDelete(String path, Map<String, dynamic> params) async {
    final all = <String, dynamic>{...params, 'timestamp': DateTime.now().millisecondsSinceEpoch};
    final query = _query(all);
    final uri = Uri.parse('$_baseUrl$path?$query&signature=${_sign(query)}');
    final response = await _client.delete(uri, headers: _authHeaders()).timeout(const Duration(seconds: 12));
    final data = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('MEXC Spot API ${response.statusCode}: ${response.body}');
    }
    return data;
  }

  Future<dynamic> _privatePost(String path, Map<String, dynamic> params) async {
    final all = <String, dynamic>{...params, 'timestamp': DateTime.now().millisecondsSinceEpoch};
    final query = _query(all);
    final uri = Uri.parse('$_baseUrl$path?$query&signature=${_sign(query)}');
    final response = await _client.post(uri, headers: _authHeaders(), body: '{}').timeout(const Duration(seconds: 15));
    final data = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('MEXC Spot API ${response.statusCode}: ${response.body}');
    }
    return data;
  }

  Future<List<Map<String, dynamic>>> getAllTickers24hr() async {
    final response = await _client.get(Uri.parse('$_baseUrl/api/v3/ticker/24hr')).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200) throw Exception('فشل جلب سوق Spot: ${response.statusCode}');
    final data = jsonDecode(response.body);
    if (data is! List) return [];
    return data.whereType<Map>().map((raw) {
      final t = Map<String, dynamic>.from(raw);
      t['symbol'] = _uiSymbol(t['symbol']?.toString() ?? '');
      t['lastPrice'] = _parseDouble(t['lastPrice']);
      t['priceChangePercent'] = _parseDouble(t['priceChangePercent']);
      t['riseFallRate'] = _parseDouble(t['priceChangePercent']);
      t['volume24h'] = _parseDouble(t['quoteVolume'] ?? t['volume']);
      return t;
    }).where((t) => t['symbol'].toString().endsWith('_USDT')).toList();
  }

  Future<List<TradingPair>> getMarketInfo() async {
    final tickers = await getAllTickers24hr();
    return tickers.map((t) {
      final symbol = t['symbol'].toString();
      final parts = symbol.split('_');
      return TradingPair(
        symbol: symbol,
        base: parts.first,
        quote: parts.length > 1 ? parts[1] : 'USDT',
        lastPrice: _parseDouble(t['lastPrice']),
        priceChangePercent: _parseDouble(t['priceChangePercent']),
        volume24h: _parseDouble(t['volume24h']),
        category: 'Spot',
      );
    }).toList();
  }

  Future<Map<String, dynamic>?> getTicker(String symbol) async {
    final s = _apiSymbol(symbol);
    final response = await _client.get(Uri.parse('$_baseUrl/api/v3/ticker/24hr?symbol=$s')).timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) return null;
    final data = jsonDecode(response.body);
    return data is Map ? Map<String, dynamic>.from(data) : null;
  }

  Future<List<Map<String, dynamic>>> getContractDetails() async => [];

  /// Real Spot wallet balances only. Futures balances are deliberately not queried.
  Future<Map<String, Map<String, double>>> getRealBalances() async {
    final data = await _privateGet('/api/v3/account', {});
    final result = <String, Map<String, double>>{};
    final list = data is Map ? data['balances'] : null;
    if (list is List) {
      for (final raw in list) {
        if (raw is! Map) continue;
        final asset = raw['asset']?.toString().toUpperCase() ?? '';
        if (asset.isEmpty) continue;
        final free = _parseDouble(raw['free']);
        final locked = _parseDouble(raw['locked']);
        if (free > 0 || locked > 0 || asset == 'USDT') {
          result[asset] = {'free': free, 'locked': locked};
        }
      }
    }
    result.putIfAbsent('USDT', () => {'free': 0.0, 'locked': 0.0});
    return result;
  }

  Future<List<Map<String, dynamic>>> getOpenOrders({String? symbol}) async {
    final data = await _privateGet('/api/v3/openOrders', {
      if (symbol != null && symbol.isNotEmpty) 'symbol': _apiSymbol(symbol),
    });
    if (data is! List) return [];
    return data.whereType<Map>().map((raw) {
      final o = Map<String, dynamic>.from(raw);
      o['symbol'] = _uiSymbol(o['symbol']?.toString() ?? '');
      o['id'] = o['orderId']?.toString();
      o['status'] = o['status']?.toString().toLowerCase() == 'new' ? 'open' : o['status'];
      o['quantity'] = o['origQty'] ?? o['quantity'];
      o['createdAt'] = o['time'] ?? o['transactTime'];
      return o;
    }).toList();
  }

  /// Spot has no leveraged positions. Return current non-USDT holdings.
  Future<List<Map<String, dynamic>>> getPositions() async {
    final balances = await getRealBalances();
    final result = <Map<String, dynamic>>[];
    for (final entry in balances.entries) {
      if (entry.key == 'USDT') continue;
      final total = (entry.value['free'] ?? 0) + (entry.value['locked'] ?? 0);
      if (total > 0) {
        result.add({
          'symbol': '${entry.key}/USDT',
          'asset': entry.key,
          'quantity': total,
          'side': 'HOLDING',
          'status': 'open',
        });
      }
    }
    return result;
  }

  /// MEXC requires a symbol for myTrades. The caller can request a specific pair.
  Future<List<Map<String, dynamic>>> getAllMyTrades({int pageSize = 20, String? symbol}) async {
    if (symbol == null || symbol.isEmpty) return [];
    final data = await _privateGet('/api/v3/myTrades', {
      'symbol': _apiSymbol(symbol),
      'limit': pageSize.clamp(1, 1000),
    });
    if (data is! List) return [];
    return data.whereType<Map>().map((raw) {
      final t = Map<String, dynamic>.from(raw);
      t['symbol'] = _uiSymbol(t['symbol']?.toString() ?? '');
      t['id'] = t['id'] ?? t['orderId'];
      t['volume'] = t['qty'];
      t['createTime'] = t['time'];
      return t;
    }).toList();
  }

  /// Place a REAL Spot order. The app enforces a fixed $1 USDT notional.
  Future<Map<String, dynamic>?> placeOrder({
    required String symbol,
    required String side,
    required String type,
    required double volume,
    double? price,
    double? leverage,
    String? openType,
  }) async {
    final s = _apiSymbol(symbol);
    final normalizedSide = side.toUpperCase().contains('BUY') ? 'BUY' : 'SELL';
    final normalizedType = type.toUpperCase();
    const tradeUsd = fixedTradeUsd;

    final balances = await getRealBalances();
    if (normalizedSide == 'BUY') {
      final usdtFree = balances['USDT']?['free'] ?? 0.0;
      if (usdtFree + 1e-9 < tradeUsd) {
        throw Exception('الرصيد الفوري USDT غير كافٍ. المطلوب 1.00 USDT، المتاح ${usdtFree.toStringAsFixed(8)} USDT.');
      }
    }

    double orderPrice = price ?? 0;
    final params = <String, dynamic>{'symbol': s, 'side': normalizedSide, 'type': normalizedType};

    if (normalizedType == 'MARKET' && normalizedSide == 'BUY') {
      params['quoteOrderQty'] = _trimDecimal(tradeUsd);
    } else {
      if (orderPrice <= 0) {
        final ticker = await getTicker(s);
        orderPrice = _parseDouble(ticker?['lastPrice']);
      }
      if (orderPrice <= 0) throw Exception('تعذر الحصول على سعر Spot صالح للزوج $s.');

      final qty = tradeUsd / orderPrice;
      params['quantity'] = _trimDecimal(qty);

      if (normalizedSide == 'SELL') {
        final asset = s.endsWith('USDT') ? s.substring(0, s.length - 4) : '';
        final freeAsset = balances[asset]?['free'] ?? 0.0;
        if (freeAsset + 1e-12 < qty) {
          throw Exception('لا يوجد رصيد كافٍ لبيع 1.00 USDT من $asset. المتاح: ${freeAsset.toStringAsFixed(12)}.');
        }
      }

      if (normalizedType == 'LIMIT') {
        params['price'] = _trimDecimal(orderPrice);
        params['timeInForce'] = 'GTC';
      }
    }

    final data = await _privatePost('/api/v3/order', params);
    if (data is! Map) throw Exception('استجابة أمر MEXC غير صالحة.');
    final result = Map<String, dynamic>.from(data);
    result['symbol'] = _uiSymbol(result['symbol']?.toString() ?? s);
    result['orderId'] = result['orderId']?.toString();
    debugPrint('[MexcApiService] REAL SPOT ORDER: $normalizedSide $s 1.00 USDT');
    return result;
  }

  Future<bool> cancelOrder(String symbol, String orderId) async {
    await _privateDelete('/api/v3/order', {'symbol': _apiSymbol(symbol), 'orderId': orderId});
    return true;
  }

  Future<bool> cancelAllOrders(String symbol) async {
    await _privateDelete('/api/v3/openOrders', {'symbol': _apiSymbol(symbol)});
    return true;
  }
}
