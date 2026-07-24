import 'dart:convert';
import 'dart:collection';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'secure_storage_service.dart';

/// MexcApiManager - Handles HMAC-SHA256 signing for MEXC Spot API v3
/// FIXES: Sorted parameters, proper query string encoding
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  String? _apiKey;
  String? _apiSecret;
  bool _initialized = false;

  bool get isInitialized => _initialized;
  String? get apiKey => _apiKey;
  String? get apiSecret => _apiSecret;

  Future<void> initialize() async {
    _apiKey = await SecureStorageService.getApiKey();
    _apiSecret = await SecureStorageService.getApiSecret();
    _initialized = _apiKey != null && _apiSecret != null && _apiKey!.isNotEmpty && _apiSecret!.isNotEmpty;
  }

  Future<void> saveCredentials(String apiKey, String apiSecret) async {
    await SecureStorageService.saveApiKey(apiKey);
    await SecureStorageService.saveApiSecret(apiSecret);
    _apiKey = apiKey;
    _apiSecret = apiSecret;
    _initialized = true;
  }

  Future<void> clearCredentials() async {
    await SecureStorageService.clearApiKeys();
    _apiKey = null;
    _apiSecret = null;
    _initialized = false;
  }

  /// Create HMAC-SHA256 signature
  String _signRequest(String queryString) {
    if (_apiSecret == null || _apiSecret!.isEmpty) {
      throw Exception('API Secret not set');
    }
    final key = utf8.encode(_apiSecret!);
    final bytes = utf8.encode(queryString);
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(bytes);
    return digest.toString();
  }

  /// Build sorted query string for MEXC v3 (params MUST be sorted alphabetically)
  String _buildQueryString(Map<String, dynamic> params) {
    final sorted = SplayTreeMap<String, String>.from(
      params.map((k, v) => MapEntry(k, v.toString())),
    );
    return sorted.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');
  }

  /// Signed GET request for MEXC Spot API v3
  Future<http.Response> signedGet(String endpoint, {Map<String, dynamic>? params}) async {
    if (!_initialized) throw Exception('API not initialized');

    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final queryParams = params ?? {};
    queryParams['timestamp'] = timestamp;

    final queryString = _buildQueryString(queryParams);
    final signature = _signRequest(queryString);
    final url = 'https://api.mexc.com$endpoint?$queryString&signature=$signature';

    return await http.get(
      Uri.parse(url),
      headers: {
        'X-MEXC-APIKEY': _apiKey!,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );
  }

  /// Signed POST request for MEXC Spot API v3
  Future<http.Response> signedPost(String endpoint, Map<String, dynamic> body) async {
    if (!_initialized) throw Exception('API not initialized');

    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    body['timestamp'] = timestamp;

    final queryString = _buildQueryString(body);
    final signature = _signRequest(queryString);
    final url = 'https://api.mexc.com$endpoint?$queryString&signature=$signature';

    return await http.post(
      Uri.parse(url),
      headers: {
        'X-MEXC-APIKEY': _apiKey!,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );
  }

  /// Signed DELETE request for MEXC Spot API v3
  Future<http.Response> signedDelete(String endpoint, {Map<String, dynamic>? params}) async {
    if (!_initialized) throw Exception('API not initialized');

    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final queryParams = params ?? {};
    queryParams['timestamp'] = timestamp;

    final queryString = _buildQueryString(queryParams);
    final signature = _signRequest(queryString);
    final url = 'https://api.mexc.com$endpoint?$queryString&signature=$signature';

    return await http.delete(
      Uri.parse(url),
      headers: {
        'X-MEXC-APIKEY': _apiKey!,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );
  }
}
