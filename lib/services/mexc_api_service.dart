import 'dart:async';
import 'dart:developer' as developer;
import 'api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// MEXC API Service - التداول الحقيقي المباشر للعقود الآجلة (Futures)
/// ═══════════════════════════════════════════════════════════════
class MexcApiService {
  static final MexcApiService _instance = MexcApiService._internal();
  factory MexcApiService() => _instance;
  MexcApiService._internal();

  final _api = MexcApiManager();

  // 1) الرصيد والحساب الحقيقي للعقود الآجلة
  Future<double> getUsdtBalance() async {
    try {
      final dynamic response = await _api.signedGet('/api/v1/private/account/assets');
      if (response != null && response['code'] == 200) {
        final List<dynamic> assets = response['data'] ?? [];
        final usdtAsset = assets.firstWhere(
          (element) => element['currency'] == 'USDT', 
          orElse: () => null
        );
        if (usdtAsset != null) {
          return double.tryParse(usdtAsset['availableBalance'].toString()) ?? 0.0;
        }
      }
      return 0.0;
    } catch (e) {
      developer.log('خطأ في جلب رصيد محفظة الفيوترز: $e', name: 'MexcApiService');
      return 0.0;
    }
  }

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
      return response != null && response['code'] == 200;
    } catch (_) {
      return false;
    }
  }

  // 2) بيانات سوق العقود الآجلة الحية
  Future<double> getCurrentPrice(String symbol) async {
    try {
      final res = await _api.publicGet('/api/v1/contract/ticker', params: {'symbol': symbol});
      if (res != null && res['code'] == 200) {
        final data = res['data'];
        return double.tryParse(data['lastPrice'].toString()) ?? 0.0;
      }
      return 0.0;
    } catch (_) {
      return 0.0;
    }
  }

  /// جلب بيانات شمعات العقود الآجلة الحقيقية لتحليل المؤشرات الفنية للبوت
  Future<List<Map<String, dynamic>>> getKlines(
    String symbol, {
    String interval = '1h',
    int limit = 50,
  }) async {
    try {
      String minutesInterval = '60';
      if (interval == '15m') minutesInterval = '15';
      if (interval == '5m') minutesInterval = '5';

      final dynamic res = await _api.publicGet('/api/v1/contract/kline/$symbol', params: {
        'interval': minutesInterval,
        'limit': limit.toString(),
      });

      if (res == null || res['code'] != 200) {
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
      throw Exception('فشل تحميل الشموع الحقيقية لـ $symbol: $e');
    }
  }

  /// التحقق من صلاحية رمز عقد الفيوترز بالموقع
  Future<bool> isValidSymbol(String symbol) async {
    try {
      final res = await _api.publicGet('/api/v1/contract/detail', params: {'symbol': symbol});
      return res != null && res['code'] == 200;
    } catch (_) {
      return false;
    }
  }

  // 3) المؤشرات الفنية المباشرة (Technical Indicators)
  Future<double> calculateRSI(String symbol, {int period = 14, String interval = '1h'}) async {
    try {
      final klines = await getKlines(symbol, interval: interval, limit: period + 30);
      if (klines.length < period + 1) return 0.0;

      final prices = klines.map((k) => k['close'] as double).toList();
      double gain = 0, loss = 0;

      for (int i = 1; i <= period; i++) {
        final diff = prices[i] - prices[i - 1];
        if (diff >= 0) gain += diff; else loss -= diff;
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
      return 100 - (100 / (1 + (avgGain / avgLoss)));
    } catch (_) {
      return 0.0;
    }
  }

  Future<Map<String, double>> calculateSMAs(String symbol, {required List<int> periods, String interval = '1h'}) async {
    try {
      final klines = await getKlines(symbol, interval: interval, limit: 50);
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

  /// الأزواج المعتمدة للعقود الآجلة لمنصة MEXC (مفصولة بشرطة سفلية للفيوترز)
  static const List<Map<String, String>> eventPairs = [
    {'symbol': 'BTC_USDT', 'name': 'Bitcoin', 'category': 'crypto'},
    {'symbol': 'ETH_USDT', 'name': 'Ethereum', 'category': 'crypto'},
    {'symbol': 'SOL_USDT', 'name': 'Solana', 'category': 'crypto'},
    {'symbol': 'XRP_USDT', 'name': 'XRP', 'category': 'crypto'},
    {'symbol': 'DOGE_USDT', 'name': 'Doge', 'category': 'crypto'},
  ];
}
