import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'secure_storage_service.dart';

class MexcApiException implements Exception {
  final String message;
  final int? code;
  MexcApiException(this.message, {this.code});
  @override
  String toString() => 'MexcApiException: $message (code: $code)';
}

class MexcRateLimitException implements Exception {
  final String message;
  MexcRateLimitException(this.message);
  @override
  String toString() => 'MexcRateLimitException: $message';
}

class ApiLogger {
  static void e(String tag, String message) {
    if (kDebugMode) print('[$tag Error] $message');
  }
  static void i(String tag, String message) {
    if (kDebugMode) print('[$tag Info] $message');
  }
}

class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  static const String baseUrl = 'https://api.mexc.com';

  String _apiKey = const String.fromEnvironment('MEXC_API_KEY');
  String _secretKey = const String.fromEnvironment('MEXC_SECRET_KEY');
  bool _initialized = false;

  bool get isInitialized => _initialized || (_apiKey.isNotEmpty && _secretKey.isNotEmpty);

  Future<void> initialize() async {
    final storage = SecureStorageService();
    final savedKey = await storage.getApiKey();
    final savedSecret = await storage.getSecretKey();

    if (savedKey != null && savedKey.isNotEmpty) _apiKey = savedKey;
    if (savedSecret != null && savedSecret.isNotEmpty) _secretKey = savedSecret;

    _initialized = _apiKey.isNotEmpty && _secretKey.isNotEmpty;
  }

  Future<void> setCredentials(String apiKey, String secretKey) async {
    _apiKey = apiKey;
    _secretKey = secretKey;
    _initialized = true;
    final storage = SecureStorageService();
    await storage.saveApiKey(apiKey);
    await storage.saveSecretKey(secretKey);
  }

  Future<void> clearCredentials() async {
    _apiKey = '';
    _secretKey = '';
    _initialized = false;
    final storage = SecureStorageService();
    await storage.clearAll();
  }

  String _generateSignature(String queryString) {
    final hmac = Hmac(sha256, utf8.encode(_secretKey));
    final digest = hmac.convert(utf8.encode(queryString));
    return digest.toString();
  }

  Map<String, String> _stringifyParams(Map<String, dynamic>? params) {
    final Map<String, String> result = {};
    if (params != null) {
      params.forEach((key, value) {
        if (value != null) {
          result[key] = value.toString();
        }
      });
    }
    return result;
  }

  Future<dynamic> publicGet(String endpoint, {Map<String, dynamic>? params}) async {
    final stringParams = _stringifyParams(params);
    final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: stringParams.isNotEmpty ? stringParams : null);
    final response = await http.get(uri);
    return _handleResponse(response);
  }

  Future<dynamic> signedGet(String endpoint, {Map<String, dynamic>? params}) async {
    final queryParams = _stringifyParams(params);
    queryParams['timestamp'] = DateTime.now().millisecondsSinceEpoch.toString();
    queryParams['recvWindow'] = '5000';

    final queryString = Uri(queryParameters: queryParams).query;
    final signature = _generateSignature(queryString);
    final fullUrl = '$baseUrl$endpoint?$queryString&signature=$signature';

    final response = await http.get(
      Uri.parse(fullUrl),
      headers: {
        'X-MEXC-APIKEY': _apiKey,
        'Content-Type': 'application/json',
      },
    );

    return _handleResponse(response);
  }

  Future<dynamic> signedPost(String endpoint, {Map<String, dynamic>? body, Map<String, dynamic>? params}) async {
    final queryParams = _stringifyParams(params ?? body);
    queryParams['timestamp'] = DateTime.now().millisecondsSinceEpoch.toString();
    queryParams['recvWindow'] = '5000';

    final queryString = Uri(queryParameters: queryParams).query;
    final signature = _generateSignature(queryString);
    final fullUrl = '$baseUrl$endpoint?$queryString&signature=$signature';

    final response = await http.post(
      Uri.parse(fullUrl),
      headers: {
        'X-MEXC-APIKEY': _apiKey,
        'Content-Type': 'application/json',
      },
    );

    return _handleResponse(response);
  }

  Future<dynamic> signedDelete(String endpoint, {Map<String, dynamic>? params}) async {
    final queryParams = _stringifyParams(params);
    queryParams['timestamp'] = DateTime.now().millisecondsSinceEpoch.toString();
    queryParams['recvWindow'] = '5000';

    final queryString = Uri(queryParameters: queryParams).query;
    final signature = _generateSignature(queryString);
    final fullUrl = '$baseUrl$endpoint?$queryString&signature=$signature';

    final response = await http.delete(
      Uri.parse(fullUrl),
      headers: {
        'X-MEXC-APIKEY': _apiKey,
        'Content-Type': 'application/json',
      },
    );

    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode == 429) {
      throw MexcRateLimitException('تجاوزت حد الطلبات المسموح (Too Many Requests)');
    }
    final data = jsonDecode(response.body);
    if (response.statusCode != 200) {
      final msg = data is Map && data.containsKey('msg') ? data['msg'] : 'خطأ في الطلب';
      final code = data is Map && data.containsKey('code') ? data['code'] : response.statusCode;
      throw MexcApiException(msg.toString(), code: int.tryParse(code.toString()));
    }
    return data;
  }
}
