import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'mexc_futures_config.dart';

class MexcApiService {
  final String apiKey;
  final String secretKey;

  static const List<String> eventPairs = [
    'BTC_USDT',
    'ETH_USDT',
    'SOL_USDT',
    'XRP_USDT'
  ];

  MexcApiService({this.apiKey = '', this.secretKey = ''});

  String _generateSignature(String timestamp, String paramString) {
    String query = '$apiKey$timestamp$paramString';
    List<int> hmacBytes = Hmac(sha256, utf8.encode(secretKey)).convert(utf8.encode(query)).bytes;
    return hmacBytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  Future<List<dynamic>> getAllTickers24hr() async {
    try {
      final response = await http.get(
        Uri.parse('${MexcFuturesConfig.baseUrl}/api/v1/contract/ticker'),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      }
    } catch (_) {}
    return [];
  }

  Future<Map<String, dynamic>> getRealBalances() async {
    return await getAccountAssets();
  }

  Future<List<dynamic>> getOpenOrders() async {
    return [];
  }

  Future<List<dynamic>> getAllMyTrades() async {
    return [];
  }

  Future<List<dynamic>> getPositions(String symbol) async {
    return [];
  }

  Future<bool> cancelOrder(String symbol, String orderId) async {
    return true;
  }

  Future<String> getDepositAddress(String currency) async {
    return '';
  }

  Future<Map<String, dynamic>> getAccountAssets() async {
    if (apiKey.isEmpty || secretKey.isEmpty) return {};
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final signature = _generateSignature(timestamp, '');

    final response = await http.get(
      Uri.parse('${MexcFuturesConfig.baseUrl}/api/v1/private/account/assets'),
      headers: {
        'ApiKey': apiKey,
        'Request-Time': timestamp,
        'Signature': signature,
        'Content-Type': 'application/json',
      },
    );

    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> placeOrder({
    required String symbol,
    required double price,
    required int vol,
    required int side,
    required int type,
    int openType = 1,
    int leverage = 10,
  }) async {
    if (apiKey.isEmpty || secretKey.isEmpty) return {};
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final bodyData = json.encode({
      "symbol": symbol,
      "price": price,
      "vol": vol,
      "leverage": leverage,
      "side": side,
      "type": type,
      "openType": openType,
    });

    final signature = _generateSignature(timestamp, bodyData);

    final response = await http.post(
      Uri.parse('${MexcFuturesConfig.baseUrl}/api/v1/private/order/submit'),
      headers: {
        'ApiKey': apiKey,
        'Request-Time': timestamp,
        'Signature': signature,
        'Content-Type': 'application/json',
      },
      body: bodyData,
    );

    return json.decode(response.body);
  }
}
