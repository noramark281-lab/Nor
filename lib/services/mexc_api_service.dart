import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'api_manager.dart';
import '../utils/constants.dart';

/// MexcApiService - Real MEXC Spot API v3 integration
/// Provides: account info, balances, real spot orders, market data
class MexcApiService {
  final MexcApiManager _api = MexcApiManager();

  // ========== ACCOUNT ==========

  /// Get full account information
  Future<Map<String, dynamic>?> getAccountInfo() async {
    try {
      final response = await _api.signedGet('/api/v3/account');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      print('Account error: ${response.statusCode} - ${response.body}');
    } catch (e) {
      print('Account exception: $e');
    }
    return null;
  }

  /// Get specific asset balance (free + locked)
  Future<Map<String, dynamic>?> getAssetBalance(String asset) async {
    final info = await getAccountInfo();
    if (info != null && info['balances'] != null) {
      for (var bal in info['balances']) {
        if (bal['asset'] == asset) {
          return {
            'asset': asset,
            'free': double.tryParse(bal['free'].toString()) ?? 0.0,
            'locked': double.tryParse(bal['locked'].toString()) ?? 0.0,
            'total': (double.tryParse(bal['free'].toString()) ?? 0.0) +
                     (double.tryParse(bal['locked'].toString()) ?? 0.0),
          };
        }
      }
    }
    return {'asset': asset, 'free': 0.0, 'locked': 0.0, 'total': 0.0};
  }

  /// Get all non-zero balances
  Future<List<Map<String, dynamic>>> getAllBalances() async {
    final info = await getAccountInfo();
    final List<Map<String, dynamic>> balances = [];
    if (info != null && info['balances'] != null) {
      for (var bal in info['balances']) {
        final free = double.tryParse(bal['free'].toString()) ?? 0.0;
        final locked = double.tryParse(bal['locked'].toString()) ?? 0.0;
        if (free > 0 || locked > 0) {
          balances.add({
            'asset': bal['asset'],
            'free': free,
            'locked': locked,
            'total': free + locked,
          });
        }
      }
    }
    return balances;
  }

  /// Get USDT free balance
  Future<double> getUSDTBalance() async {
    final bal = await getAssetBalance('USDT');
    return bal?['free'] ?? 0.0;
  }

  // ========== ORDERS ==========

  /// Place a real SPOT MARKET order on MEXC
  /// Uses quoteOrderQty to spend exactly $amount worth
  Future<Map<String, dynamic>?> placeSpotOrder({
    required String symbol,
    required String side, // BUY or SELL
    required double amount, // Amount in USDT (capped at $1 in provider)
    String orderType = 'MARKET',
  }) async {
    try {
      final body = {
        'symbol': symbol,
        'side': side,
        'type': orderType,
        'quoteOrderQty': amount.toStringAsFixed(2),
      };

      final response = await _api.signedPost('/api/v3/order', body);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      print('Order error: ${response.statusCode} - ${response.body}');
      return {'error': 'API ${response.statusCode}: ${response.body}'};
    } catch (e) {
      print('Order exception: $e');
      return {'error': e.toString()};
    }
  }

  /// Place a LIMIT order
  Future<Map<String, dynamic>?> placeLimitOrder({
    required String symbol,
    required String side,
    required double quantity,
    required double price,
  }) async {
    try {
      final body = {
        'symbol': symbol,
        'side': side,
        'type': 'LIMIT',
        'quantity': quantity.toStringAsFixed(6),
        'price': price.toStringAsFixed(2),
        'timeInForce': 'GTC',
      };

      final response = await _api.signedPost('/api/v3/order', body);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'error': 'API ${response.statusCode}: ${response.body}'};
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  /// Cancel an order
  Future<Map<String, dynamic>?> cancelOrder(String symbol, int orderId) async {
    try {
      final response = await _api.signedDelete('/api/v3/order', params: {
        'symbol': symbol,
        'orderId': orderId.toString(),
      });
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'error': 'API ${response.statusCode}'};
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  /// Get all open orders
  Future<List<dynamic>> getOpenOrders({String? symbol}) async {
    try {
      final params = symbol != null ? {'symbol': symbol} : null;
      final response = await _api.signedGet('/api/v3/openOrders', params: params);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Open orders error: $e');
    }
    return [];
  }

  /// Get order history
  Future<List<dynamic>> getOrderHistory(String symbol) async {
    try {
      final response = await _api.signedGet('/api/v3/allOrders', params: {
        'symbol': symbol,
        'limit': '50',
      });
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Order history error: $e');
    }
    return [];
  }

  // ========== MARKET DATA ==========

  /// Get 24h ticker statistics
  Future<Map<String, dynamic>?> getTicker24h(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('${Constants.mexcApiBase}/api/v3/ticker/24hr?symbol=$symbol'),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Ticker error: $e');
    }
    return null;
  }

  /// Get current price
  Future<double> getCurrentPrice(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('${Constants.mexcApiBase}/api/v3/ticker/price?symbol=$symbol'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return double.tryParse(data['price'].toString()) ?? 0.0;
      }
    } catch (e) {
      print('Price error: $e');
    }
    return 0.0;
  }

  /// Get klines/candlestick data
  Future<List<dynamic>> getKlines(String symbol, String interval, {int limit = 100}) async {
    try {
      final response = await http.get(
        Uri.parse('${Constants.mexcApiBase}/api/v3/klines?symbol=$symbol&interval=$interval&limit=$limit'),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Klines error: $e');
    }
    return [];
  }

  /// Get exchange info (trading rules, symbols, filters)
  Future<Map<String, dynamic>?> getExchangeInfo() async {
    try {
      final response = await http.get(
        Uri.parse('${Constants.mexcApiBase}/api/v3/exchangeInfo'),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Exchange info error: $e');
    }
    return null;
  }

  /// Get symbol info (min qty, min notional, etc.)
  Future<Map<String, dynamic>?> getSymbolInfo(String symbol) async {
    final info = await getExchangeInfo();
    if (info != null && info['symbols'] != null) {
      for (var s in info['symbols']) {
        if (s['symbol'] == symbol) {
          return s;
        }
      }
    }
    return null;
  }

  // ========== DEPRECATED (Event Trading) ==========
  // Kept for backwards compatibility but returns null
  Future<Map<String, dynamic>?> placeEventOrder(String symbol, String side, double amount, int duration) async {
    print('WARNING: Event orders are deprecated. Use placeSpotOrder for real trading.');
    return null;
  }

  Future<List<dynamic>> getEventContracts() async {
    return [];
  }
}
