import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:crypto/crypto.dart';
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
    required String apiKey,
    required String secretKey,
    required int timestamp,
    required String paramString,
  }) {
    final message = '$apiKey$timestamp$paramString';
    final hmac = Hmac(sha256, utf8.encode(secretKey));
    final digest = hmac.convert(utf8.encode(message));
    return digest.toString();
  }

  // ── Header Builder ──────────────────────────────────────────────
  Map<String, String> buildAuthHeaders({
    String method = 'GET',
    String? paramString,
  }) {
    if (!_isInitialized) {
      debugPrint('[MexcApiManager] WARNING: Not initialized, returning empty headers');
      return {'Content-Type': 'application/json'};
    }

    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final param = paramString ?? '';

    final signature = _generateSignature(
      apiKey: _apiKey!,
      secretKey: _secretKey!,
      timestamp: timestamp,
      paramString: param,
    );

    return {
      'ApiKey': _apiKey!,
      'Request-Time': timestamp.toString(),
      'Signature': signature,
      'Content-Type': 'application/json',
    };
  }

  // ── Convenience Methods ─────────────────────────────────────────
  Map<String, String> getHeaders({String? query}) =>
      buildAuthHeaders(method: 'GET', paramString: query);

  Map<String, String> getPostHeaders({String? body}) =>
      buildAuthHeaders(method: 'POST', paramString: body);
}
