import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// MEXC Futures API authentication manager.
///
/// API credentials are stored only on the account owner's device through the
/// platform secure store. They are never accepted from build-time definitions
/// and therefore are never embedded in a distributable APK.
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  static const _kApiKey = 'mexc_api_key';
  static const _kSecretKey = 'mexc_secret_key';
  static const _defaultBaseUrl = 'https://api.mexc.com';

  static final FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  String? _apiKey;
  String? _secretKey;
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;
  String? get apiKey => _apiKey;
  String? get secretKey => _secretKey;
  String? get apiSecret => _secretKey;

  /// Loads the owner-supplied credentials from Android Keystore / iOS Keychain.
  ///
  /// Existing plaintext SharedPreferences entries are migrated once and removed.
  Future<void> initialize() async {
    _apiKey = await _secureStorage.read(key: _kApiKey);
    _secretKey = await _secureStorage.read(key: _kSecretKey);

    if ((_apiKey?.isEmpty ?? true) || (_secretKey?.isEmpty ?? true)) {
      await _migrateLegacyCredentials();
    }

    _isInitialized = (_apiKey?.isNotEmpty ?? false) &&
        (_secretKey?.isNotEmpty ?? false);
    debugPrint('[MexcApiManager] initialized=$_isInitialized');
  }

  Future<void> _migrateLegacyCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    final legacyApiKey = prefs.getString(_kApiKey)?.trim();
    final legacySecretKey = prefs.getString(_kSecretKey)?.trim();

    if (legacyApiKey?.isNotEmpty == true && legacySecretKey?.isNotEmpty == true) {
      await _secureStorage.write(key: _kApiKey, value: legacyApiKey);
      await _secureStorage.write(key: _kSecretKey, value: legacySecretKey);
      await prefs.remove(_kApiKey);
      await prefs.remove(_kSecretKey);
      _apiKey = legacyApiKey;
      _secretKey = legacySecretKey;
      debugPrint('[MexcApiManager] Legacy credentials migrated to secure storage.');
    }
  }

  Future<void> setCredentials({
    required String apiKey,
    required String secretKey,
  }) async {
    final normalizedApiKey = apiKey.trim();
    final normalizedSecretKey = secretKey.trim();
    if (normalizedApiKey.isEmpty || normalizedSecretKey.isEmpty) {
      throw ArgumentError('مفتاح API والمفتاح السري مطلوبان.');
    }

    await _secureStorage.write(key: _kApiKey, value: normalizedApiKey);
    await _secureStorage.write(key: _kSecretKey, value: normalizedSecretKey);
    _apiKey = normalizedApiKey;
    _secretKey = normalizedSecretKey;
    _isInitialized = true;
    debugPrint('[MexcApiManager] Credentials saved in secure storage.');
  }

  Future<void> clearCredentials() async {
    await _secureStorage.delete(key: _kApiKey);
    await _secureStorage.delete(key: _kSecretKey);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kApiKey);
    await prefs.remove(_kSecretKey);

    _apiKey = null;
    _secretKey = null;
    _isInitialized = false;
    debugPrint('[MexcApiManager] Credentials cleared.');
  }

  String _generateSignature({
    required String timestamp,
    required String parameterString,
  }) {
    final apiKey = _apiKey;
    final secretKey = _secretKey;
    if (apiKey == null || apiKey.isEmpty || secretKey == null || secretKey.isEmpty) {
      throw StateError('مفاتيح MEXC غير مهيأة.');
    }

    final payload = '$apiKey$timestamp$parameterString';
    return Hmac(sha256, utf8.encode(secretKey)).convert(utf8.encode(payload)).toString();
  }

  Map<String, String> buildAuthHeaders({
    required String method,
    String? queryString,
    String? bodyString,
  }) {
    if (!_isInitialized) {
      throw StateError('مفاتيح MEXC غير مهيأة. أدخل المفاتيح من إعدادات التطبيق.');
    }

    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final parameterString = method.toUpperCase() == 'GET'
        ? (queryString ?? '')
        : (bodyString ?? '');

    final headers = <String, String>{
      'ApiKey': _apiKey!,
      'Request-Time': timestamp,
      'Signature': _generateSignature(
        timestamp: timestamp,
        parameterString: parameterString,
      ),
      'Accept': 'application/json',
      'Language': 'en-US',
    };
    if (method.toUpperCase() == 'POST') {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  Map<String, String> getAuthHeadersForGet(String queryString) {
    return buildAuthHeaders(method: 'GET', queryString: queryString);
  }

  Map<String, String> getAuthHeadersForPost(String bodyString) {
    return buildAuthHeaders(method: 'POST', bodyString: bodyString);
  }

  String signSpotQuery(String queryString) {
    final secretKey = _secretKey;
    if (secretKey == null || secretKey.isEmpty) {
      throw StateError('المفتاح السري غير متاح.');
    }
    return Hmac(sha256, utf8.encode(secretKey)).convert(utf8.encode(queryString)).toString();
  }

  Map<String, String> getSpotHeaders() {
    return <String, String>{
      'Content-Type': 'application/json',
      'X-MEXC-APIKEY': _apiKey ?? '',
      'Accept': 'application/json',
    };
  }

  /// Verifies the credentials through an authenticated MEXC account request.
  /// It never treats locally available headers as proof of a valid connection.
  Future<bool> testConnection() async {
    try {
      final response = await http
          .get(
            Uri.parse('$_defaultBaseUrl/api/v1/private/account/assets'),
            headers: getAuthHeadersForGet(''),
          )
          .timeout(const Duration(seconds: 10));
      if (response.statusCode != 200) return false;

      final payload = jsonDecode(response.body);
      return payload is Map && payload['success'] == true;
    } catch (error) {
      debugPrint('[MexcApiManager] testConnection error: $error');
      return false;
    }
  }

  Future<dynamic> publicGet(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    String baseUrl = _defaultBaseUrl,
  }) async {
    try {
      final queryString = _buildSortedQueryString(queryParameters);
      final uri = Uri.parse('$baseUrl$endpoint${queryString.isEmpty ? '' : '?$queryString'}');
      final response = await http.get(uri, headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (error) {
      debugPrint('[MexcApiManager] publicGet error: $error');
      return {'success': false, 'message': error.toString()};
    }
  }

  Future<dynamic> signedGet(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    String baseUrl = _defaultBaseUrl,
  }) async {
    try {
      final queryString = _buildSortedQueryString(queryParameters);
      final uri = Uri.parse('$baseUrl$endpoint${queryString.isEmpty ? '' : '?$queryString'}');
      final response = await http.get(
        uri,
        headers: getAuthHeadersForGet(queryString),
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (error) {
      debugPrint('[MexcApiManager] signedGet error: $error');
      return {'success': false, 'message': error.toString()};
    }
  }

  Future<dynamic> signedPost(
    String endpoint, {
    Map<String, dynamic>? body,
    String baseUrl = _defaultBaseUrl,
  }) async {
    try {
      final bodyString = jsonEncode(body ?? const <String, dynamic>{});
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: getAuthHeadersForPost(bodyString),
        body: bodyString,
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (error) {
      debugPrint('[MexcApiManager] signedPost error: $error');
      return {'success': false, 'message': error.toString()};
    }
  }

  String _buildSortedQueryString(Map<String, dynamic>? queryParameters) {
    if (queryParameters == null || queryParameters.isEmpty) return '';
    final entries = queryParameters.entries
        .where((entry) => entry.value != null)
        .toList()
      ..sort((left, right) => left.key.compareTo(right.key));
    return entries
        .map((entry) => '${Uri.encodeQueryComponent(entry.key)}=${Uri.encodeQueryComponent(entry.value.toString())}')
        .join('&');
  }
}
