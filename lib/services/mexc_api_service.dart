import 'dart:async';
import 'dart:developer' as developer;
import 'api_manager.dart';
import 'mexc_futures_config.dart';

class MexcApiService {
  static final MexcApiService _instance = MexcApiService._internal();
  factory MexcApiService() => _instance;
  MexcApiService._internal();

  final _api = MexcApiManager();

  // ═══════════════════════════════════════════
  // Account & Wallet
  // ═══════════════════════════════════════════

  /// Alias for getUsdtBalance for UI compatibility
  Future<double> getUSDTBalance() async => getUsdtBalance();

  Future<double> getUsdtBalance() async {
    try {
      final response = await _api.signedGet('/api/v1/private/account/assets');
      if (response != null && response['code'] == 0) {
        final List<dynamic> assets = response['data'] ?? [];
        final usdtAsset = assets.firstWhere(
          (element) => element['currency'] == 'USDT',
          orElse: () => null,
        );
        if (usdtAsset != null) {
          return double.tryParse(usdtAsset['availableBalance'].toString()) ??
              0.0;
        }
      }
      return 0.0;
    } catch (e) {
      developer.log(
        'خطأ في جلب رصيد محفظة الفيوترز: \$e',
        name: 'MexcApiService',
      );
      return 0.0;
    }
  }

  /// Fetch futures wallet balance specifically
  Future<double> getFuturesBalance() async {
    try {
      final response = await _api.signedGet('/api/v1/private/account/assets');
      if (response != null && response['code'] == 0) {
        final List<dynamic> assets = response['data'] ?? [];
        final usdtAsset = assets.firstWhere(
          (element) => element['currency'] == 'USDT',
          orElse: () => null,
        );
        if (usdtAsset != null) {
          return double.tryParse(usdtAsset['availableBalance'].toString()) ??
              0.0;
        }
      }
      return 0.0;
    } catch (e) {
      developer.log(
        'خطأ في جلب رصيد العقود الآجلة: \$e',
        name: 'MexcApiService',
      );
      return 0.0;
    }
  }

  /// Fetch account info summary
  Future<Map<String, dynamic>?> getAccountInfo() async {
    try {
      final response = await _api.signedGet('/api/v1/private/account/assets');
      if (response != null && response['code'] == 0) {
        final List<dynamic> assets = response['data'] ?? [];
        double totalUsdt = 0.0;
        double availableUsdt = 0.0;
        for (final asset in assets) {
          if (asset['currency'] == 'USDT') {
            totalUsdt = double.tryParse(asset['totalBalance']?.toString() ?? '0') ?? 0.0;
            availableUsdt = double.tryParse(asset['availableBalance']?.toString() ?? '0') ?? 0.0;
          }
        }
        return {
          'totalUsdt': totalUsdt,
          'availableUsdt': availableUsdt,
          'assets': assets,
        };
      }
      return null;
    } catch (e) {
      developer.log('خطأ في جلب معلومات الحساب: \$e', name: 'MexcApiService');
      return null;
    }
  }

  /// Alias for getRealBalances for UI compatibility
  Future<Map<String, Map<String, double>>> getAllBalances() async => getRealBalances();

  Future<Map<String, Map<String, double>>> getRealBalances() async {
    try {
      final response = await _api.signedGet('/api/v1/private/account/assets');
      final balances = <String, Map<String, double>>{};
      if (response != null && response['code'] == 0) {
        final List<dynamic> assets = response['data'] ?? [];
        for (final asset in assets) {
          final currency = asset['currency']?.toString() ?? '';
          if (currency.isNotEmpty) {
            balances[currency] = {
              'free':
                  double.tryParse(asset['availableBalance'].toString()) ?? 0.0,
              'locked':
                  double.tryParse(asset['frozenBalance'].toString()) ?? 0.0,
            };
          }
        }
      }
      return balances;
    } catch (e) {
      developer.log('خطأ في جلب الأرصدة: \$e', name: 'MexcApiService');
      return {};
    }
  }

  Future<List<Map<String, dynamic>>> getOpenOrders() async {
    try {
      final response = await _api.signedGet(
        '/api/v1/private/order/open_orders',
      );
      if (response != null && response['code'] == 0) {
        final List<dynamic> orders = response['data'] ?? [];
        return orders.map((o) {
          final map = Map<String, dynamic>.from(o);
          // Normalize MEXC numeric side codes to BUY/SELL strings
          final sideNum = map['side']?.toString() ?? '';
          if (sideNum == '1' || sideNum == '2') {
            map['side'] = 'BUY';
          } else if (sideNum == '3' || sideNum == '4') {
            map['side'] = 'SELL';
          }
          // Alias fields for UI compatibility
          if (map['orderId'] == null && map['id'] != null)
            map['orderId'] = map['id'];
          if (map['origQty'] == null && map['vol'] != null)
            map['origQty'] = map['vol'];
          return map;
        }).toList();
      }
      return [];
    } catch (e) {
      developer.log('خطأ في جلب الأوامر المفتوحة: \$e', name: 'MexcApiService');
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getAllMyTrades() async {
    try {
      final response = await _api.signedGet(
        '/api/v1/private/order/history_orders',
      );
      if (response != null && response['code'] == 0) {
        final List<dynamic> trades = response['data'] ?? [];
        return trades.map((t) {
          final map = Map<String, dynamic>.from(t);
          // Normalize side
          final sideNum = map['side']?.toString() ?? '';
          if (sideNum == '1' || sideNum == '2') {
            map['side'] = 'BUY';
          } else if (sideNum == '3' || sideNum == '4') {
            map['side'] = 'SELL';
          }
          map['isBuyer'] = (sideNum == '1' || sideNum == '2');
          // Alias fields for UI compatibility
          if (map['qty'] == null && map['vol'] != null) map['qty'] = map['vol'];
          if (map['quoteQty'] == null &&
              map['vol'] != null &&
              map['price'] != null) {
            final vol = double.tryParse(map['vol'].toString()) ?? 0;
            final price = double.tryParse(map['price'].toString()) ?? 0;
            map['quoteQty'] = (vol * price).toString();
          }
          if (map['time'] == null && map['createTime'] != null)
            map['time'] = map['createTime'];
          return map;
        }).toList();
      }
      return [];
    } catch (e) {
      developer.log('خطأ في جلب سجل الصفقات: \$e', name: 'MexcApiService');
      return [];
    }
  }

  Future<bool> cancelOrder(String symbol, String orderId) async {
    try {
      final response = await _api.signedPost(
        '/api/v1/private/order/cancel',
        body: {'symbol': symbol, 'orderId': orderId},
      );
      return response != null && response['code'] == 0;
    } catch (e) {
      developer.log('خطأ في إلغاء الأمر: \$e', name: 'MexcApiService');
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getPositions(String symbol) async {
    try {
      final response = await _api.signedGet(
        '/api/v1/private/position/open_positions',
        params: {'symbol': symbol},
      );
      if (response != null && response['code'] == 0) {
        final List<dynamic> positions = response['data'] ?? [];
        return positions.map((p) => Map<String, dynamic>.from(p)).toList();
      }
      return [];
    } catch (e) {
      developer.log('خطأ في جلب المراكز: \$e', name: 'MexcApiService');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getDepositAddress(String currency) async {
    try {
      final response = await _api.signedGet(
        '/api/v1/private/account/deposit/address/\$currency',
      );
      if (response != null && response['code'] == 0) {
        return Map<String, dynamic>.from(response['data'] ?? {});
      }
      return null;
    } catch (e) {
      developer.log('خطأ في جلب عنوان الإيداع: \$e', name: 'MexcApiService');
      return null;
    }
  }

  // ═══════════════════════════════════════════
  // Spot Trading
  // ═══════════════════════════════════════════

  Future<Map<String, dynamic>?> placeSpotOrder({
    required String symbol,
    required String side,
    required double amount,
    double? price,
    String type = 'MARKET',
  }) async {
    try {
      final int orderSide = (side.toUpperCase() == 'BUY') ? 1 : 3;
      final int orderType = (type.toUpperCase() == 'LIMIT') ? 1 : 5;
      final double orderPrice =
          (type.toUpperCase() == 'LIMIT' && price != null && price > 0) ? price : 0;

      final Map<String, dynamic> payload = {
        'symbol': symbol,
        'price': orderPrice,
        'vol': amount.toInt(),
        'side': orderSide,
        'type': orderType,
        'openType': 1,
      };

      final response = await _api.signedPost(
        '/api/v1/private/order/create',
        body: payload,
      );

      if (response != null && response['code'] == 0) {
        return {
          'success': true,
          'orderId': response['data']?.toString(),
          'symbol': symbol,
          'side': side,
          'amount': amount,
          'price': orderPrice,
        };
      } else {
        return {
          'success': false,
          'message': response?['message'] ?? 'رفضت المنصة تنفيذ الأمر',
        };
      }
    } catch (e) {
      developer.log('خطأ في تنفيذ أمر Spot: \$e', name: 'MexcApiService');
      return {'success': false, 'message': e.toString()};
    }
  }

  // ═══════════════════════════════════════════
  // Futures Trading
  // ═══════════════════════════════════════════

  Future<Map<String, dynamic>?> placeFuturesOrder({
    required String symbol,
    required String side,
    required double amount,
    double? price,
    String type = 'MARKET',
    int leverage = MexcFuturesConfig.defaultLeverage,
  }) async {
    try {
      // Ensure leverage is set to 1 as requested (no additional leverage)
      final int effectiveLeverage = leverage <= 0 ? 1 : leverage;
      await _api.signedPost(
        '/api/v1/private/position/leverage',
        body: {'symbol': symbol, 'leverage': effectiveLeverage, 'openType': 1},
      );

      final int orderSide = (side.toUpperCase() == 'BUY') ? 1 : 3;
      final int orderType = (type.toUpperCase() == 'LIMIT') ? 1 : 5;
      final double orderPrice =
          (type.toUpperCase() == 'LIMIT' && price != null && price > 0) ? price : 0;

      // Force 1 USDT order size as requested
      final double orderAmount = amount <= 0 ? MexcFuturesConfig.fixedOrderSizeUsdt : amount;

      final Map<String, dynamic> payload = {
        'symbol': symbol,
        'price': orderPrice,
        'vol': orderAmount.toInt(),
        'leverage': effectiveLeverage,
        'side': orderSide,
        'type': orderType,
        'openType': 1,
      };

      final response = await _api.signedPost(
        '/api/v1/private/order/create',
        body: payload,
      );

      if (response != null && response['code'] == 0) {
        return {
          'success': true,
          'orderId': response['data']?.toString(),
          'symbol': symbol,
          'side': side,
          'amount': orderAmount,
          'price': orderPrice,
          'leverage': effectiveLeverage,
        };
      } else {
        return {
          'success': false,
          'message': response?['message'] ?? 'رفضت المنصة تنفيذ العقد الآجل',
        };
      }
    } catch (e) {
      developer.log('خطأ في تنفيذ عقد آجل: \$e', name: 'MexcApiService');
      return {'success': false, 'message': e.toString()};
    }
  }

  // ═══════════════════════════════════════════
  // Market Data
  // ═══════════════════════════════════════════

  Future<bool> testConnectivity() async {
    try {
      final response = await _api.publicGet('/api/v1/contract/ping');
      return response != null;
    } catch (_) {
      return false;
    }
  }

  Future<bool> testApiKeys() async {
    try {
      final response = await _api.signedGet('/api/v1/private/account/assets');
      return response != null && response['code'] == 0;
    } catch (_) {
      return false;
    }
  }

  Future<double> getCurrentPrice(String symbol) async {
    try {
      final res = await _api.publicGet(
        '/api/v1/contract/ticker',
        params: {'symbol': symbol},
      );
      if (res != null && res['code'] == 0) {
        final data = res['data'];
        return double.tryParse(data['lastPrice'].toString()) ?? 0.0;
      }
      return 0.0;
    } catch (_) {
      return 0.0;
    }
  }

  Future<List<Map<String, dynamic>>> getKlines(
    String symbol, {
    String interval = '1h',
    int limit = 50,
  }) async {
    try {
      String minutesInterval = '60';
      if (interval == '15m') minutesInterval = '15';
      if (interval == '5m') minutesInterval = '5';

      final dynamic res = await _api.publicGet(
        '/api/v1/contract/kline/\$symbol',
        params: {'interval': minutesInterval, 'limit': limit.toString()},
      );

      if (res == null || res['code'] != 0) {
        throw Exception('استجابة خاطئة من خادم الشموع');
      }

      final List<dynamic> list = res['data'] ?? [];

      return list.map((e) {
        return {
          'openTime': e['time'],
          'open': double.tryParse(e['open'].toString()) ?? 0.0,
          'high': double.tryParse(e['high'].toString()) ?? 0.0,
          'low': double.tryParse(e['low'].toString()) ?? 0.0,
          'close': double.tryParse(e['close'].toString()) ?? 0.0,
          'volume': double.tryParse(e['vol'].toString()) ?? 0.0,
        };
      }).toList();
    } catch (e) {
      throw Exception('فشل تحميل الشموع الحقيقية لـ \$symbol: \$e');
    }
  }

  Future<bool> isValidSymbol(String symbol) async {
    try {
      final res = await _api.publicGet(
        '/api/v1/contract/detail',
        params: {'symbol': symbol},
      );
      return res != null && res['code'] == 0;
    } catch (_) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getAllTickers24hr() async {
    try {
      final res = await _api.publicGet('/api/v1/contract/ticker');
      if (res != null && res['code'] == 0) {
        final List<dynamic> data = res['data'] ?? [];
        return data.map((t) {
          final map = Map<String, dynamic>.from(t);
          // Normalize field names for UI compatibility
          if (map['lastPrice'] == null && map['last'] != null)
            map['lastPrice'] = map['last'];
          if (map['priceChangePercent'] == null && map['riseFallRate'] != null)
            map['priceChangePercent'] = map['riseFallRate'];
          if (map['volume'] == null && map['volume24'] != null)
            map['volume'] = map['volume24'];
          if (map['highPrice'] == null && map['high'] != null)
            map['highPrice'] = map['high'];
          return map;
        }).toList();
      }
      return [];
    } catch (e) {
      developer.log('خطأ في جلب قائمة الأسعار: \$e', name: 'MexcApiService');
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // Technical Indicators
  // ═══════════════════════════════════════════

  Future<double> calculateRSI(
    String symbol, {
    int period = 14,
    String interval = '1h',
  }) async {
    final klines = await getKlines(
      symbol,
      interval: interval,
      limit: period + 1,
    );
    if (klines.length < period + 1)
      throw Exception('البيانات غير كافية لحساب RSI');

    final closes = klines.map((k) => k['close'] as double).toList();
    double gains = 0, losses = 0;

    for (int i = 1; i <= period; i++) {
      final diff = closes[i] - closes[i - 1];
      if (diff > 0) {
        gains += diff;
      } else {
        losses += diff.abs();
      }
    }

    double avgGain = gains / period;
    double avgLoss = losses / period;

    for (int i = period + 1; i < closes.length; i++) {
      final diff = closes[i] - closes[i - 1];
      avgGain = ((avgGain * (period - 1)) + (diff > 0 ? diff : 0)) / period;
      avgLoss =
          ((avgLoss * (period - 1)) + (diff < 0 ? diff.abs() : 0)) / period;
    }

    if (avgLoss == 0) return 100;
    final rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  Future<Map<String, double>> calculateSMAs(
    String symbol, {
    required List<int> periods,
    String interval = '1h',
  }) async {
    final maxPeriod = periods.reduce((a, b) => a > b ? a : b);
    final klines = await getKlines(
      symbol,
      interval: interval,
      limit: maxPeriod,
    );
    if (klines.length < maxPeriod)
      throw Exception('البيانات غير كافية لحساب المتوسطات');

    final closes = klines.map((k) => k['close'] as double).toList();
    final results = <String, double>{};

    for (final period in periods) {
      if (closes.length >= period) {
        final sum = closes
            .sublist(closes.length - period)
            .reduce((a, b) => a + b);
        results['SMA\$period'] = sum / period;
      }
    }
    return results;
  }

  static const List<Map<String, String>> eventPairs = [
    {'symbol': 'BTC_USDT', 'name': 'Bitcoin', 'category': 'crypto'},
    {'symbol': 'ETH_USDT', 'name': 'Ethereum', 'category': 'crypto'},
    {'symbol': 'SOL_USDT', 'name': 'Solana', 'category': 'crypto'},
    {'symbol': 'XRP_USDT', 'name': 'XRP', 'category': 'crypto'},
    {'symbol': 'DOGE_USDT', 'name': 'Doge', 'category': 'crypto'},
  ];
}
