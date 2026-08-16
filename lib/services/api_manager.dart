import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

/// MEXC Spot API V3 authentication manager.
///
/// API credentials are entered by the owner on the device and stored locally.
/// They are deliberately NOT injected into the public APK at build time.
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  static const _kApiKey = 'mexc_api_key';
  static const _kSecretKey = 'mexc_secret_key';

  String? _apiKey;
  String? _secretKey;
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;
  String? get apiKey => _apiKey;
  String? get secretKey => _secretKey;
  String? get apiSecret => _secretKey;

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _apiKey = prefs.getString(_kApiKey);
    _secretKey = prefs.getString(_kSecretKey);
    _isInitialized = (_apiKey?.isNotEmpty ?? false) && (_secretKey?.isNotEmpty ?? false);
    debugPrint('[MexcApiManager] Spot credentials initialized=$_isInitialized');
  }

  Future<void> setCredentials({required String apiKey, required String secretKey}) async {
    _apiKey = apiKey.trim();
    _secretKey = secretKey.trim();
    if (_apiKey!.isEmpty || _secretKey!.isEmpty) {
      throw Exception('يجب إدخال API Key و Secret Key.');
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kApiKey, _apiKey!);
    await prefs.setString(_kSecretKey, _secretKey!);
    _isInitialized = true;
  }

  Future<void> clearCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kApiKey);
    await prefs.remove(_kSecretKey);
    _apiKey = null;
    _secretKey = null;
    _isInitialized = false;
  }

  String signSpotQuery(String queryString) {
    if (_secretKey == null || _secretKey!.isEmpty) throw Exception('Secret key not available');
    return Hmac(sha256, utf8.encode(_secretKey!)).convert(utf8.encode(queryString)).toString();
  }

  Map<String, String> getSpotHeaders() {
    if (!_isInitialized || _apiKey == null || _apiKey!.isEmpty) {
      throw Exception('MEXC Spot API credentials are not configured.');
    }
    return {
      'Content-Type': 'application/json',
      'X-MEXC-APIKEY': _apiKey!,
      'Accept': 'application/json',
    };
  }

  // Backwards-compatible helpers for any remaining callers. They are no longer
  // used by the Spot service for authentication.
  Map<String, String> getAuthHeadersForGet(String queryString) => getSpotHeaders();
  Map<String, String> getAuthHeadersForPost(String bodyString) => getSpotHeaders();

  Future<bool> testConnection() async {
    try {
      return _isInitialized && _apiKey!.isNotEmpty && _secretKey!.isNotEmpty;
    } catch (_) {
      return false;
    }
  }
}
