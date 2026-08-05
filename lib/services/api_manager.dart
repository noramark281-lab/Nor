import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  static const String baseUrl = 'https://api.mexc.com';

  // قراءة المفاتيح المُمَرّرة أثناء البناء (--dart-define)
  final String apiKey = const String.fromEnvironment('MEXC_API_KEY');
  final String secretKey = const String.fromEnvironment('MEXC_SECRET_KEY');

  /// إنشاء توقيع HMAC SHA256 للطلبات الموقعة
  String _generateSignature(String queryString) {
    final hmac = Hmac(sha256, utf8.encode(secretKey));
    final digest = hmac.convert(utf8.encode(queryString));
    return digest.toString();
  }

  /// طلب GET عام (Public)
  Future<dynamic> publicGet(String endpoint, {Map<String, String>? params}) async {
    final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: params);
    final response = await http.get(uri);
    return jsonDecode(response.body);
  }

  /// طلب GET موثّق وموقّع (Signed GET)
  Future<dynamic> signedGet(String endpoint, {Map<String, String>? params}) async {
    final queryParams = Map<String, String>.from(params ?? {});
    queryParams['timestamp'] = DateTime.now().millisecondsSinceEpoch.toString();
    queryParams['recvWindow'] = '5000';

    final queryString = Uri(queryParameters: queryParams).query;
    final signature = _generateSignature(queryString);
    final fullUrl = '$baseUrl$endpoint?$queryString&signature=$signature';

    final response = await http.get(
      Uri.parse(fullUrl),
      headers: {
        'X-MEXC-APIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    );

    return jsonDecode(response.body);
  }

  /// طلب POST موثّق وموقّع (Signed POST)
  Future<dynamic> signedPost(String endpoint, {Map<String, String>? body}) async {
    final queryParams = Map<String, String>.from(body ?? {});
    queryParams['timestamp'] = DateTime.now().millisecondsSinceEpoch.toString();
    queryParams['recvWindow'] = '5000';

    final queryString = Uri(queryParameters: queryParams).query;
    final signature = _generateSignature(queryString);
    final fullUrl = '$baseUrl$endpoint?$queryString&signature=$signature';

    final response = await http.post(
      Uri.parse(fullUrl),
      headers: {
        'X-MEXC-APIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    );

    return jsonDecode(response.body);
  }
}
