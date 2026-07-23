import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'api_manager.dart';

class MexcApiService {
  final MexcApiManager _api = MexcApiManager();

  Future<Map<String, dynamic>?> getAccountInfo() async {
    try {
      final response = await _api.signedGet('/api/v3/account');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Account error: $e');
    }
    return null;
  }

  Future<List<dynamic>> getEventContracts() async {
    try {
      final response = await http.get(
        Uri.parse('https://www.mexc.com/open/api/v2/market/coin/list'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? [];
      }
    } catch (e) {
      print('Contracts error: $e');
    }
    return [];
  }

  Future<Map<String, dynamic>?> getTicker(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('https://api.mexc.com/api/v3/ticker/24hr?symbol=$symbol'),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Ticker error: $e');
    }
    return null;
  }

  Future<List<dynamic>> getKlines(String symbol, String interval, {int limit = 100}) async {
    try {
      final response = await http.get(
        Uri.parse('https://api.mexc.com/api/v3/klines?symbol=$symbol&interval=$interval&limit=$limit'),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Klines error: $e');
    }
    return [];
  }

  Future<Map<String, dynamic>?> placeEventOrder(String symbol, String side, double amount, int duration) async {
    try {
      final body = {
        'symbol': symbol,
        'side': side,
        'amount': amount.toString(),
        'duration': duration.toString(),
      };
      final response = await _api.signedPost('/api/v3/event/order', body);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Order error: $e');
    }
    return null;
  }

  Future<double> getBalance() async {
    try {
      final info = await getAccountInfo();
      if (info != null && info['balances'] != null) {
        for (var balance in info['balances']) {
          if (balance['asset'] == 'USDT') {
            return double.tryParse(balance['free']) ?? 0.0;
          }
        }
      }
    } catch (e) {
      print('Balance error: $e');
    }
    return 0.0;
  }
}
