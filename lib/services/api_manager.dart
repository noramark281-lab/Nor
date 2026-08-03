import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/constants.dart';

/// Custom exceptions for MEXC API errors
class MexcApiException implements Exception {
  final String message;
  final int statusCode;
  MexcApiException(this.message, this.statusCode);
  @override
  String toString() => 'MexcApiException($statusCode): $message';
}

class MexcRateLimitException extends MexcApiException {
  MexcRateLimitException(super.message) : super(429);
}

/// Logger that works in BOTH debug and release builds (prints to stdout/logcat)
class ApiLogger {
  static void i(String tag, String msg) => _log('I', tag, msg);
  static void e(String tag, String msg) => _log('E', tag, msg);
  static void w(String tag, String msg) => _log('W', tag, msg);
  static void _log(String level, String tag, String msg) {
    final line = '[$level] MEXC_API | $tag | $msg';
    // ignore: avoid_print
    print(line);
  }
}

/// Manages MEXC API authentication and network requests
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  String _apiKey = '';
  String _secretKey = '';
  int _serverTimeOffset = 0;
  bool _initialized = false;

  String get apiKey => _apiKey;
  String get secretKey => _secretKey;
  bool get isInitialized => _initialized;

  /// Returns true if API keys are available (either from env or secure storage)
  bool get hasKeys => _apiKey.isNotEmpty && _secretKey.isNotEmpty;

  Future<void> initialize() async {
    await _loadKeys();
    if (hasKeys) {
      try {
        await syncServerTime();
      } catch (e) {
        ApiLogger.e('initialize', 'Server time sync failed: $e');
      }
    }
    _initialized = true;
  }

  Future<void> _loadKeys() async {
    // 1. Environment variables (from --dart-define)
    _apiKey = const String.fromEnvironment('MEXC_API_KEY');
    _secretKey = const String.fromEnvironment('MEXC_SECRET_KEY');

    if (_apiKey.isEmpty || _secretKey.isEmpty) {
      // 2. Secure storage fallback
      _apiKey = await _storage.read(key: 'mexc_api_key') ?? '';
      _secretKey = await _storage.read(key: 'mexc_secret_key') ?? '';
    }

    ApiLogger.i('loadKeys', 'API Key loaded: ${_apiKey.isNotEmpty} (len=${_apiKey.length})');
    ApiLogger.i('loadKeys', 'Secret loaded: ${_secretKey.isNotEmpty} (len=${_secretKey.length})');
  }

  Future<void> saveKeys(String apiKey, String secretKey) async {
    _apiKey = apiKey;
    _secretKey = secretKey;
    await _storage.write(key: 'mexc_api_key', value: apiKey);
    await _storage.write(key: 'mexc_secret_key', value: secretKey);
    await syncServerTime();
    _initialized = true;
  }

  Future<void> clearKeys() async {
    _apiKey = '';
    _secretKey = '';
    await _storage.delete(key: 'mexc_api_key');
    await _storage.delete(key: 'mexc_secret_key');
  }

  /// Syncs local time with MEXC server time to avoid timestamp errors
  Future<void> syncServerTime() async {
    try {
      final response = await publicGet('/api/v3/time');
      if (response.containsKey('serverTime')) {
        final serverTime = response['serverTime'] as int;
        _serverTimeOffset = serverTime - DateTime.now().millisecondsSinceEpoch;
        ApiLogger.i('syncServerTime', 'Offset: $_serverTimeOffset ms');
      }
    } catch (e) {
      _serverTimeOffset = 0;
      ApiLogger.e('syncServerTime', 'Time sync error: $e');
      rethrow;
    }
  }

  int get _timestamp => DateTime.now().millisecondsSinceEpoch + _serverTimeOffset;

  /// Signs a request using HMAC SHA256
  String _sign(String query) {
    final hmac = Hmac(sha256, utf8.encode(_secretKey));
    final digest = hmac.convert(utf8.encode(query));
    return digest.toString(); // lowercase hex
  }

  Map<String, String> get _headers => {
        'X-MEXC-APIKEY': _apiKey,
        'Content-Type': 'application/json',
      };

  /// Generic GET for public endpoints
  Future<Map<String, dynamic>> publicGet(String endpoint, {Map<String, String>? params}) async {
    var uri = Uri.parse('${AppConstants.mexcBaseUrl}$endpoint');
    if (params != null && params.isNotEmpty) {
      uri = uri.replace(queryParameters: params);
    }
    ApiLogger.i('publicGet', '→ GET $uri');
    final response = await http.get(uri).timeout(const Duration(seconds: 10));
    ApiLogger.i('publicGet', '← ${response.statusCode} | bodyLength=${response.body.length}');
    return _handleResponse(response);
  }

  /// Generic GET for signed endpoints
  Future<Map<String, dynamic>> signedGet(String endpoint, {Map<String, String>? params}) async {
    if (!hasKeys) throw MexcApiException('API keys not configured', 401);

    final timestamp = _timestamp.toString();
    final recvWindow = '10000';

    final queryParams = <String, String>{
      'timestamp': timestamp,
      'recvWindow': recvWindow,
    };
    if (params != null) queryParams.addAll(params);

    final query = queryParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    final signature = _sign(query);
    queryParams['signature'] = signature;

    final uri = Uri.parse('${AppConstants.mexcBaseUrl}$endpoint')
        .replace(queryParameters: queryParams);

    ApiLogger.i('signedGet', '→ SIGNED GET $endpoint | keyPrefix=${_apiKey.substring(0, _apiKey.length > 4 ? 4 : _apiKey.length)}...');
    final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 10));
    ApiLogger.i('signedGet', '← ${response.statusCode} | bodyLength=${response.body.length}');
    return _handleResponse(response);
  }

  /// Generic POST for signed endpoints (form-urlencoded body)
  Future<Map<String, dynamic>> signedPost(String endpoint, {Map<String, String>? body}) async {
    if (!hasKeys) throw MexcApiException('API keys not configured', 401);

    final timestamp = _timestamp.toString();
    final recvWindow = '10000';

    final bodyParams = <String, String>{
      'timestamp': timestamp,
      'recvWindow': recvWindow,
    };
    if (body != null) bodyParams.addAll(body);

    final bodyString = bodyParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    final signature = _sign(bodyString);
    bodyParams['signature'] = signature;

    final finalBody = bodyParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    final uri = Uri.parse('${AppConstants.mexcBaseUrl}$endpoint');

    ApiLogger.i('signedPost', '→ POST $uri');
    final response = await http.post(
      uri,
      headers: {
        'X-MEXC-APIKEY': _apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: finalBody,
    ).timeout(const Duration(seconds: 10));
    ApiLogger.i('signedPost', '← ${response.statusCode} | bodyLength=${response.body.length}');
    return _handleResponse(response);
  }

  /// Generic DELETE for signed endpoints
  Future<Map<String, dynamic>> signedDelete(String endpoint, {Map<String, String>? params}) async {
    if (!hasKeys) throw MexcApiException('API keys not configured', 401);

    final timestamp = _timestamp.toString();
    final recvWindow = '10000';

    final queryParams = <String, String>{
      'timestamp': timestamp,
      'recvWindow': recvWindow,
    };
    if (params != null) queryParams.addAll(params);

    final query = queryParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    final signature = _sign(query);
    queryParams['signature'] = signature;

    final uri = Uri.parse('${AppConstants.mexcBaseUrl}$endpoint')
        .replace(queryParameters: queryParams);

    ApiLogger.i('signedDelete', '→ DELETE $uri');
    final response = await http.delete(uri, headers: _headers).timeout(const Duration(seconds: 10));
    ApiLogger.i('signedDelete', '← ${response.statusCode} | bodyLength=${response.body.length}');
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    final preview = response.body.substring(0, response.body.length.clamp(0, 500));
    ApiLogger.i('_handleResponse', 'status=${response.statusCode} bodyPreview=$preview');

    if (response.statusCode == 429) {
      throw MexcRateLimitException('Rate limit exceeded');
    }

    if (response.statusCode >= 400) {
      String errorMsg;
      try {
        final data = jsonDecode(response.body);
        errorMsg = data['msg']?.toString() ?? 'HTTP ${response.statusCode}';
      } catch (_) {
        errorMsg = 'HTTP ${response.statusCode}: ${response.body}';
      }
      throw MexcApiException(errorMsg, response.statusCode);
    }

    try {
      final body = jsonDecode(response.body);
      if (body is Map<String, dynamic>) return body;
      if (body is List) return {'data': body};
      throw MexcApiException('Unexpected response type: ${body.runtimeType}', 500);
    } catch (e) {
      throw MexcApiException('Invalid JSON response: ${response.body}', 500);
    }
  }

  void debugLog(String message) {
    if (kDebugMode) debugPrint('[MEXC] $message');
  }
}
