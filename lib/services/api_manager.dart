import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

/// ═══════════════════════════════════════════════════════════════════
/// MEXC Futures API v1 Authentication Manager
/// ═══════════════════════════════════════════════════════════════════
///
/// MEXC Futures v1 Auth Requirements:
///   - Headers: ApiKey, Request-Time, Signature, Content-Type
///   - Signature = HMAC-SHA256(secretKey, accessKey + timestamp + paramString)
///   - GET  → paramString = query string (e.g. "symbol=BTC_USDT")
///   - POST → paramString = request body JSON string
///   - timestamp = milliseconds since epoch
///
/// Uses SharedPreferences for cross-platform storage (Android, iOS, Windows, macOS, Linux)
///
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  // ── SharedPreferences (cross-platform including Windows) ────────
  static const _kApiKey = 'mexc_api_key';
  static const _kSecretKey = 'mexc_secret_key';

  String? _apiKey;
  String? _secretKey;
  bool _isInitialized = false;

  // ── Getters ─────────────────────────────────────────────────────
  bool get isInitialized => _isInitialized;
  String? get apiKey => _apiKey;
  String? get secretKey => _secretKey;
  String? get apiSecret => _secretKey;

  // ── Initialization ──────────────────────────────────────────────
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _apiKey = prefs.getString(_kApiKey);
    _secretKey = prefs.getString(_kSecretKey);

    // Fallback to build-time dart-define values (CI/CD / GitHub Actions)
    if (_apiKey == null || _apiKey!.isEmpty) {
      _apiKey = AppConstants.buildTimeApiKey.isNotEmpty ? AppConstants.buildTimeApiKey : null;
    }
    if (_secretKey == null || _secretKey!.isEmpty) {
      _secretKey = AppConstants.buildTimeApiSecret.isNotEmpty ? AppConstants.buildTimeApiSecret : null;
    }

    _isInitialized = (_apiKey?.isNotEmpty ?? false) && (_secretKey?.isNotEmpty ?? false);
    debugPrint('[MexcApiManager] initialized=$_isInitialized');
  }

  // ── Key Management ──────────────────────────────────────────────
  Future<void> setCredentials({required String apiKey, required String secretKey}) async {
    _apiKey = apiKey.trim();
    _secretKey = secretKey.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kApiKey, _apiKey!);
    await prefs.setString(_kSecretKey, _secretKey!);
    _isInitialized = true;
    debugPrint('[MexcApiManager] Credentials saved.');
  }

  Future<void> clearCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kApiKey);
    await prefs.remove(_kSecretKey);
    _apiKey = null;
    _secretKey = null;
    _isInitialized = false;
    debugPrint('[MexcApiManager] Credentials cleared.');
  }

  // ── Signature Generation (Futures v1) ───────────────────────────
  /// Generates MEXC Futures v1 signature.
  /// Signature = HMAC-SHA256(secretKey, accessKey + timestamp + paramString)
  String _generateSignature({
    required String timestamp,
    required String paramString,
  }) {
    if (_secretKey == null || _secretKey!.isEmpty) {
      throw Exception('Secret key not available');
    }
    final payload = '$_apiKey$timestamp$paramString';
    final hmac = Hmac(sha256, utf8.encode(_secretKey!));
    final digest = hmac.convert(utf8.encode(payload));
    return digest.toString();
  }

  // ── Headers Builder ─────────────────────────────────────────────
  /// Builds authenticated headers for MEXC Futures v1 API requests.
  Map<String, String> buildAuthHeaders({
    required String method,
    String? queryString,
    String? bodyString,
  }) {
    if (!_isInitialized) {
      throw Exception('API keys not initialized. Please configure API credentials first.');
    }

    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();

    // Determine paramString based on method
    String paramString;
    if (method.toUpperCase() == 'GET') {
      paramString = queryString ?? '';
    } else {
      paramString = bodyString ?? '';
    }

    final signature = _generateSignature(
      timestamp: timestamp,
      paramString: paramString,
    );

    final headers = {
      'ApiKey': _apiKey!,
      'Request-Time': timestamp,
      'Signature': signature,
      'Accept': 'application/json',
    };
    if (method.toUpperCase() == 'POST') {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  // ── Convenience: GET Auth Headers ───────────────────────────────
  Map<String, String> getAuthHeadersForGet(String queryString) {
    return buildAuthHeaders(method: 'GET', queryString: queryString);
  }

  // ── Convenience: POST Auth Headers ──────────────────────────────
  Map<String, String> getAuthHeadersForPost(String bodyString) {
    return buildAuthHeaders(method: 'POST', bodyString: bodyString);
  }

  // ── Spot API v3 Support ─────────────────────────────────────────
  /// Sign Spot query string: HMAC-SHA256(secretKey, queryString)
  String signSpotQuery(String queryString) {
    if (_secretKey == null || _secretKey!.isEmpty) {
      throw Exception('Secret key not available');
    }
    final hmac = Hmac(sha256, utf8.encode(_secretKey!));
    final digest = hmac.convert(utf8.encode(queryString));
    return digest.toString();
  }

  /// Get Spot request headers
  Map<String, String> getSpotHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-MEXC-APIKEY': _apiKey ?? '',
      'Accept': 'application/json',
    };
  }

  // ── Test Connectivity ───────────────────────────────────────────
  /// Quick validation: check if we can read account assets.
  /// Returns true if API call succeeds, false otherwise.
  Future<bool> testConnection() async {
    try {
      final headers = buildAuthHeaders(method: 'GET', queryString: '');
      debugPrint('[MexcApiManager] Test connection headers ready.');
      return headers.isNotEmpty;
    } catch (e) {
      debugPrint('[MexcApiManager] testConnection error: $e');
      return false;
    }
  }

  // ── Public & Signed Request Helpers ─────────────────────────────
  static const String _defaultBaseUrl = 'https://contract.mexc.com';

  /// Execute public HTTP GET request
  Future<dynamic> publicGet(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    String baseUrl = _defaultBaseUrl,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint').replace(
        queryParameters: queryParameters?.map((key, value) => MapEntry(key, value.toString())),
      );
      final response = await http.get(uri, headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (e) {
      debugPrint('[MexcApiManager] publicGet error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Execute signed HTTP GET request
  Future<dynamic> signedGet(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    String baseUrl = _defaultBaseUrl,
  }) async {
    try {
      final queryPairs = queryParameters?.entries.map((e) => '${e.key}=${e.value}').toList() ?? [];
      final queryString = queryPairs.join('&');
      final uri = Uri.parse('$baseUrl$endpoint${queryString.isNotEmpty ? '?$queryString' : ''}');
      final headers = buildAuthHeaders(method: 'GET', queryString: queryString);

      final response = await http.get(uri, headers: headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (e) {
      debugPrint('[MexcApiManager] signedGet error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Execute signed HTTP POST request
  Future<dynamic> signedPost(
    String endpoint, {
    Map<String, dynamic>? body,
    String baseUrl = _defaultBaseUrl,
  }) async {
    try {
      final bodyString = body != null ? jsonEncode(body) : '';
      final uri = Uri.parse('$baseUrl$endpoint');
      final headers = buildAuthHeaders(method: 'POST', bodyString: bodyString);

      final response = await http.post(uri, headers: headers, body: bodyString.isNotEmpty ? bodyString : null);
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (e) {
      debugPrint('[MexcApiManager] signedPost error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }
}
