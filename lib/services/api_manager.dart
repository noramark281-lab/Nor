import 'dart:convert';
import 'dart:developer' as developer;
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'secure_storage_service.dart';

/// MEXC Futures API Manager
/// Base URL: https://contract.mexc.com (MEXC Futures / Contract API)
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  static const String baseUrl = 'https://contract.mexc.com';

  String _apiKey = const String.fromEnvironment('MEXC_API_KEY', defaultValue: '');
  String _secretKey = const String.fromEnvironment('MEXC_SECRET_KEY', defaultValue: '');
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized && _apiKey.isNotEmpty && _secretKey.isNotEmpty;
  String get apiKey => _apiKey;
  String get secretKey => _secretKey;

  Future<void> initialize() async {
    try {
      if (_apiKey.isEmpty || _secretKey.isEmpty) {
        final creds = await SecureStorageService.getApiCredentials();
        if (creds['apiKey'] != null && creds['apiKey']!.isNotEmpty) {
          _apiKey = creds['apiKey']!;
          _secretKey = creds['apiSecret'] ?? '';
        }
      }
    } catch (e) {
      developer.log('Secure storage unavailable: $e', name: 'MexcApiManager');
    }
    _isInitialized = true;
  }

  Future<void> setCredentials(String apiKey, String secretKey) async {
    _apiKey = apiKey;
    _secretKey = secretKey;
    await SecureStorageService.saveApiCredentials(apiKey, secretKey);
    _isInitialized = true;
  }

  Future<void> clearCredentials() async {
    _apiKey = '';
    _secretKey = '';
    await SecureStorageService.clearApiKeys();
    _isInitialized = false;
  }

  /// MEXC Futures HMAC-SHA256 signature: ApiKey + Request-Time + paramsString
  String _generateFuturesSignature(String reqTime, String paramsString) {
    final String textToSign = "$_apiKey$reqTime$paramsString";
    final hmac = Hmac(sha256, utf8.encode(_secretKey));
    final digest = hmac.convert(utf8.encode(textToSign));
    return digest.toString();
  }

  String _buildQueryString(Map<String, String>? params) {
    if (params == null || params.isEmpty) return '';
    final sortedKeys = params.keys.toList()..sort();
    return sortedKeys.map((k) => '$k=${params[k]}').join('&');
  }

  // ── Public (unsigned) GET ───────────────────────────
  Future<dynamic> publicGet(String endpoint, {Map<String, String>? params}) async {
    final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: params);
    final response = await http.get(uri);
    if (response.statusCode != 200) {
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    }
    return jsonDecode(response.body);
  }

  // ── Authenticated GET ───────────────────────────────
  Future<dynamic> signedGet(String endpoint, {Map<String, String>? params}) async {
    if (!_isInitialized) throw Exception('API Manager not initialized');
    final queryString = _buildQueryString(params);
    final reqTime = DateTime.now().millisecondsSinceEpoch.toString();
    final signature = _generateFuturesSignature(reqTime, queryString);

    final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: params);
    final response = await http.get(
      uri,
      headers: {
        "ApiKey": _apiKey,
        "Request-Time": reqTime,
        "Signature": signature,
        "Content-Type": "application/json",
      },
    );
    if (response.statusCode != 200) {
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    }
    return jsonDecode(response.body);
  }

  // ── Authenticated POST ──────────────────────────────
  Future<dynamic> signedPost(String endpoint, {Map<String, dynamic>? body}) async {
    if (!_isInitialized) throw Exception('API Manager not initialized');
    final url = '$baseUrl$endpoint';
    final reqTime = DateTime.now().millisecondsSinceEpoch.toString();
    final bodyStr = body != null ? jsonEncode(body) : "";
    final signature = _generateFuturesSignature(reqTime, bodyStr);

    final response = await http.post(
      Uri.parse(url),
      headers: {
        "ApiKey": _apiKey,
        "Request-Time": reqTime,
        "Signature": signature,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: bodyStr,
    );
    if (response.statusCode != 200) {
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    }
    return jsonDecode(response.body);
  }
}
