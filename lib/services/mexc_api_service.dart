import 'dart:convert';
import 'api_manager.dart';
import '../models/event_contract.dart';

/// خدمة التواصل مع MEXC API
class MexcApiService {
  final MexcApiManager _api = MexcApiManager();

  // --- حساب المستخدم ---
  Future<Map<String, dynamic>?> getAccountInfo() async {
    try {
      final res = await _api.signedGet('/api/v3/account');
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  // --- عقود الحدث (Event Contracts) ---
  Future<List<EventContract>> fetchEventContracts() async {
    try {
      // MEXC لا يوفر Event Contracts API رسمياً في الوقت الحالي
      // سنستخدم بيانات تجريبية حقيقية الشكل لعرض الواجهة
      return _mockEventContracts();
    } catch (e) {
      return _mockEventContracts();
    }
  }

  // --- أسعار السوق ---
  Future<Map<String, dynamic>?> getTicker(String symbol) async {
    try {
      final res = await _api.publicGet('/api/v3/ticker/24hr', params: {'symbol': symbol});
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getAllTickers() async {
    try {
      final res = await _api.publicGet('/api/v3/ticker/24hr');
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // --- أوامر التداول ---
  Future<Map<String, dynamic>?> placeOrder({
    required String symbol,
    required String side,
    required double quantity,
    String type = 'MARKET',
    double? price,
  }) async {
    try {
      final body = {
        'symbol': symbol,
        'side': side,
        'type': type,
        'quantity': quantity.toString(),
        if (price != null) 'price': price.toString(),
      };
      final res = await _api.signedPost('/api/v3/order', body);
      if (res.statusCode == 200) return jsonDecode(res.body);
      return {'error': res.body};
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  Future<List<Map<String, dynamic>>> getOpenOrders({String? symbol}) async {
    try {
      final params = <String, String>{};
      if (symbol != null) params['symbol'] = symbol;
      final res = await _api.signedGet('/api/v3/openOrders', params: params);
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // بيانات تجريبية لعقود الحدث (للعرض حتى توفر MEXC API رسمياً)
  List<EventContract> _mockEventContracts() {
    final now = DateTime.now();
    return [
      EventContract(
        symbol: 'BTC_UP_202508',
        name: 'BTC صاعد أغسطس 2026',
        category: 'Crypto',
        strikePrice: 85000,
        currentPrice: 82.5,
        priceChangePercent: 5.2,
        volume24h: 1420000,
        expiryDate: now.add(const Duration(days: 15)),
        side: 'UP',
      ),
      EventContract(
        symbol: 'BTC_DOWN_202508',
        name: 'BTC هابط أغسطس 2026',
        category: 'Crypto',
        strikePrice: 85000,
        currentPrice: 17.5,
        priceChangePercent: -2.1,
        volume24h: 980000,
        expiryDate: now.add(const Duration(days: 15)),
        side: 'DOWN',
      ),
      EventContract(
        symbol: 'ETH_UP_202508',
        name: 'ETH صاعد أغسطس 2026',
        category: 'Crypto',
        strikePrice: 4200,
        currentPrice: 68.0,
        priceChangePercent: 3.8,
        volume24h: 760000,
        expiryDate: now.add(const Duration(days: 15)),
        side: 'UP',
      ),
      EventContract(
        symbol: 'ETH_DOWN_202508',
        name: 'ETH هابط أغسطس 2026',
        category: 'Crypto',
        strikePrice: 4200,
        currentPrice: 32.0,
        priceChangePercent: -1.5,
        volume24h: 540000,
        expiryDate: now.add(const Duration(days: 15)),
        side: 'DOWN',
      ),
      EventContract(
        symbol: 'FED_RATE_CUT',
        name: 'خفض الفائدة الأمريكية',
        category: 'Macro',
        strikePrice: 5.25,
        currentPrice: 45.0,
        priceChangePercent: 1.2,
        volume24h: 3200000,
        expiryDate: now.add(const Duration(days: 30)),
        side: 'UP',
      ),
    ];
  }
}
