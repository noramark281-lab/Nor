import 'dart:convert';
import 'dart:math';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'api_manager.dart';
import '../utils/constants.dart';

/// Custom exception for API errors
class MexcApiException implements Exception {
  final String message;
  final int? statusCode;
  MexcApiException(this.message, {this.statusCode});
  @override
  String toString() => 'MexcApiException: $message (Status: $statusCode)';
}

/// MexcApiService - Real MEXC Spot API v3 integration
/// Provides: account info, balances, real spot orders, market data
class MexcApiService {
  final MexcApiManager _api = MexcApiManager();

  // ========== ACCOUNT & BALANCES ==========

  /// Get full Spot account information
  Future<Map<String, dynamic>?> getAccountInfo() async {
    try {
      final response = await _api.signedGet('/api/v3/account');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        throw MexcApiException('مفاتيح API غير مصرح لها أو غير صحيحة', statusCode: 401);
      } else if (response.statusCode == 429) {
        throw MexcApiException('تجاوز حد الطلبات - يرجى الانتظار قليلاً', statusCode: 429);
      } else {
        throw MexcApiException('خطأ في استعلام الحساب: ${response.body}', statusCode: response.statusCode);
      }
    } on MexcApiException {
      rethrow;
    } catch (e) {
      throw MexcApiException('تعذر الاتصال بـ MEXC API: $e');
    }
  }

  /// Get Futures/Contract account assets from contract.mexc.com
  Future<Map<String, dynamic>?> getFuturesAssets() async {
    try {
      final response = await _api.signedContractGet('/api/v1/private/account/assets');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true || data['code'] == 0 || data['code'] == 200) {
          return data;
        }
      }
    } catch (e) {
      print('Futures assets fetch warning: $e');
    }
    return null;
  }

  /// Get Capital coin config balances
  Future<List<Map<String, dynamic>>?> getCapitalBalances() async {
    try {
      final response = await _api.signedGet('/api/v3/capital/config/getall');
      if (response.statusCode == 200) {
        final list = jsonDecode(response.body);
        if (list is List) {
          return List<Map<String, dynamic>>.from(list);
        }
      }
    } catch (e) {
      print('Capital config fetch warning: $e');
    }
    return null;
  }

  /// Get specific asset balance across Spot and Futures wallets
  Future<Map<String, dynamic>?> getAssetBalance(String asset) async {
    double spotFree = 0.0;
    double spotLocked = 0.0;
    double futuresAvailable = 0.0;
    double futuresFrozen = 0.0;

    // 1. Try Spot account
    try {
      final info = await getAccountInfo();
      if (info != null && info['balances'] != null) {
        for (var bal in info['balances']) {
          if (bal['asset'] == asset) {
            spotFree = double.tryParse(bal['free'].toString()) ?? 0.0;
            spotLocked = double.tryParse(bal['locked'].toString()) ?? 0.0;
            break;
          }
        }
      }
    } catch (_) {}

    // 2. Try Futures / Contract assets
    try {
      final futuresData = await getFuturesAssets();
      if (futuresData != null && futuresData['data'] != null) {
        final assets = futuresData['data'];
        if (assets is List) {
          for (var item in assets) {
            if (item['currency'] == asset) {
              futuresAvailable = double.tryParse(item['availableBalance']?.toString() ?? item['cashBalance']?.toString() ?? '0') ?? 0.0;
              futuresFrozen = double.tryParse(item['frozenBalance']?.toString() ?? '0') ?? 0.0;
              break;
            }
          }
        } else if (assets is Map && assets['currency'] == asset) {
          futuresAvailable = double.tryParse(assets['availableBalance']?.toString() ?? assets['cashBalance']?.toString() ?? '0') ?? 0.0;
          futuresFrozen = double.tryParse(assets['frozenBalance']?.toString() ?? '0') ?? 0.0;
        }
      }
    } catch (_) {}

    // 3. Fallback to capital config if both are 0
    if (spotFree == 0 && futuresAvailable == 0) {
      try {
        final capital = await getCapitalBalances();
        if (capital != null) {
          for (var item in capital) {
            if (item['coin'] == asset) {
              spotFree = double.tryParse(item['free']?.toString() ?? '0') ?? 0.0;
              spotLocked = double.tryParse(item['locked']?.toString() ?? '0') ?? 0.0;
              break;
            }
          }
        }
      } catch (_) {}
    }

    final totalFree = spotFree > 0 ? spotFree : futuresAvailable;
    final totalLocked = spotLocked + futuresFrozen;

    return {
      'asset': asset,
      'free': totalFree,
      'locked': totalLocked,
      'spotFree': spotFree,
      'futuresAvailable': futuresAvailable,
      'total': totalFree + totalLocked,
    };
  }

  /// Get all non-zero balances across wallets
  Future<List<Map<String, dynamic>>> getAllBalances() async {
    final Map<String, Map<String, dynamic>> balanceMap = {};

    try {
      final info = await getAccountInfo();
      if (info != null && info['balances'] != null) {
        for (var bal in info['balances']) {
          final free = double.tryParse(bal['free'].toString()) ?? 0.0;
          final locked = double.tryParse(bal['locked'].toString()) ?? 0.0;
          if (free > 0 || locked > 0) {
            final asset = bal['asset'].toString();
            balanceMap[asset] = {
              'asset': asset,
              'free': free,
              'locked': locked,
              'total': free + locked,
            };
          }
        }
      }
    } catch (_) {}

    // Check Futures
    try {
      final futuresData = await getFuturesAssets();
      if (futuresData != null && futuresData['data'] is List) {
        for (var item in futuresData['data']) {
          final asset = item['currency']?.toString() ?? 'USDT';
          final avail = double.tryParse(item['availableBalance']?.toString() ?? item['cashBalance']?.toString() ?? '0') ?? 0.0;
          final frozen = double.tryParse(item['frozenBalance']?.toString() ?? '0') ?? 0.0;
          if (avail > 0 || frozen > 0) {
            if (balanceMap.containsKey(asset)) {
              balanceMap[asset]!['free'] = (balanceMap[asset]!['free'] as double) + avail;
              balanceMap[asset]!['locked'] = (balanceMap[asset]!['locked'] as double) + frozen;
              balanceMap[asset]!['total'] = (balanceMap[asset]!['free'] as double) + (balanceMap[asset]!['locked'] as double);
            } else {
              balanceMap[asset] = {
                'asset': asset,
                'free': avail,
                'locked': frozen,
                'total': avail + frozen,
              };
            }
          }
        }
      }
    } catch (_) {}

    return balanceMap.values.toList();
  }

  /// Get USDT available balance (reads Spot + Futures)
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
      // Validate amount
      if (amount <= 0) {
        throw MexcApiException('Amount must be greater than 0');
      }
      if (amount > Constants.maxTradeAmount) {
        throw MexcApiException('Amount exceeds max trade amount of \$${Constants.maxTradeAmount}');
      }

      final body = {
        'symbol': symbol,
        'side': side,
        'type': orderType,
        'quoteOrderQty': amount.toStringAsFixed(2),
      };

      final response = await _api.signedPost('/api/v3/order', body);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        throw MexcApiException('Bad request: ${error['msg'] ?? response.body}', statusCode: 400);
      } else if (response.statusCode == 401) {
        throw MexcApiException('Unauthorized - Check your API keys', statusCode: 401);
      } else if (response.statusCode == 429) {
        throw MexcApiException('Rate limit exceeded - Please wait', statusCode: 429);
      } else {
        throw MexcApiException('Order error: ${response.body}', statusCode: response.statusCode);
      }
    } on MexcApiException {
      rethrow;
    } catch (e) {
      throw MexcApiException('Order exception: $e');
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
