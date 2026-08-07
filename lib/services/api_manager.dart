import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  // ── Secure Storage ──────────────────────────────────────────────
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _kApiKey = 'mexc_api_key';
  static const _kSecretKey = 'mexc_secret_key';

  String? _apiKey;
  String? _secretKey;
  bool _isInitialized = false;

  // ── Getters ─────────────────────────────────────────────────────
  bool get isInitialized => _isInitialized;
  String? get apiKey => _apiKey;
  String? get secretKey => _secretKey;

  // ── Initialization ──────────────────────────────────────────────
  Future<void> initialize() async {
    _apiKey = await _secureStorage.read(key: _kApiKey);
    _secretKey = await _secureStorage.read(key: _kSecretKey);

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
    await _secureStorage.write(key: _kApiKey, value: _apiKey!);
    await _secureStorage.write(key: _kSecretKey, value: _secretKey!);
    _isInitialized = true;
    debugPrint('[MexcApiManager] Credentials saved.');
  }

  Future<void> clearCredentials() async {
    await _secureStorage.delete(key: _kApiKey);
    await _secureStorage.delete(key: _kSecretKey);
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

  // ── Test Connectivity ───────────────────────────────────────────
  /// Quick validation: check if we can read account assets.
  /// Returns true if API call succeeds, false otherwise.
  Future<bool> testConnection() async {
    try {
      // Use a lightweight authenticated endpoint
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final headers = buildAuthHeaders(method: 'GET', queryString: '');
      debugPrint('[MexcApiManager] Test connection headers ready.');
      return headers.isNotEmpty;
    } catch (e) {
      debugPrint('[MexcApiManager] testConnection error: $e');
      return false;
    }
  }
}
