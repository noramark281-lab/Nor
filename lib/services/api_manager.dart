import 'dart:convert';
import 'dart:collection';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'secure_storage_service.dart';

/// MexcApiManager - Handles HMAC-SHA256 signing for MEXC Spot API v3 and Contract/Futures API
/// Features:
/// - Server time synchronization to prevent timestamp drift (-1021 error)
/// - Sorted parameter query string encoding
/// - Spot API v3 signing
/// - Futures / Contract API signing
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  String? _apiKey;
  String? _apiSecret;
  bool _initialized = false;
  int _serverTimeOffset = 0;
  bool _timeSynced = false;

  bool get isInitialized => _initialized;
  String? get apiKey => _apiKey;
  String? get apiSecret => _apiSecret;

  Future<void> initialize() async {
    _apiKey = await SecureStorageService.getApiKey();
    _apiSecret = await SecureStorageService.getApiSecret();
    _initialized = _apiKey != null && _apiSecret != null && _apiKey!.isNotEmpty && _apiSecret!.isNotEmpty;
    if (_initialized) {
      _syncServerTime();
    }
  }

  Future<void> saveCredentials(String apiKey, String apiSecret) async {
    await SecureStorageService.saveApiKey(apiKey);
    await SecureStorageService.saveApiSecret(apiSecret);
    _apiKey = apiKey.trim();
    _apiSecret = apiSecret.trim();
    _initialized = true;
    _syncServerTime();
  }

  Future<void> clearCredentials() async {
    await SecureStorageService.clearApiKeys();
    _apiKey = null;
    _apiSecret = null;
    _initialized = false;
  }

  /// Sync server time to eliminate timestamp drift errors
  Future<void> _syncServerTime() async {
    try {
      final startTime = DateTime.now().millisecondsSinceEpoch;
      final response = await http.get(Uri.parse('https://api.mexc.com/api/v3/time'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final serverTime = data['serverTime'] as int;
        final endTime = DateTime.now().millisecondsSinceEpoch;
        final latency = (endTime - startTime) ~/ 2;
        _serverTimeOffset = (serverTime + latency) - endTime;
        _timeSynced = true;
      }
    } catch (_) {
      // Fallback to local time if ping fails
      _timeSynced = false;
    }
  }

  int get _currentTimestamp => DateTime.now().millisecondsSinceEpoch + (_timeSynced ? _serverTimeOffset : 0);

  /// Create HMAC-SHA256 signature for Spot API
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

  /// Create HMAC-SHA256 signature for Contract / Futures API
  String _signContractRequest(String accessKey, String timestamp, String paramString) {
    if (_apiSecret == null || _apiSecret!.isEmpty) {
      throw Exception('API Secret not set');
    }
    final targetStr = '$accessKey$timestamp$paramString';
    final key = utf8.encode(_apiSecret!);
    final bytes = utf8.encode(targetStr);
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

    final queryParams = Map<String, dynamic>.from(params ?? {});
    queryParams['timestamp'] = _currentTimestamp.toString();
    queryParams['recvWindow'] = '60000';

    final queryString = _buildQueryString(queryParams);
    final signature = _signRequest(queryString);
    final url = 'https://api.mexc.com$endpoint?$queryString&signature=$signature';

    return await http.get(
      Uri.parse(url),
      headers: {
        'X-MEXC-APIKEY': _apiKey!,
        'Content-Type': 'application/json',
      },
    );
  }

  /// Signed POST request for MEXC Spot API v3
  Future<http.Response> signedPost(String endpoint, Map<String, dynamic> body) async {
    if (!_initialized) throw Exception('API not initialized');

    final postParams = Map<String, dynamic>.from(body);
    postParams['timestamp'] = _currentTimestamp.toString();
    postParams['recvWindow'] = '60000';

    final queryString = _buildQueryString(postParams);
    final signature = _signRequest(queryString);
    final url = 'https://api.mexc.com$endpoint?$queryString&signature=$signature';

    return await http.post(
      Uri.parse(url),
      headers: {
        'X-MEXC-APIKEY': _apiKey!,
        'Content-Type': 'application/json',
      },
    );
  }

  /// Signed DELETE request for MEXC Spot API v3
  Future<http.Response> signedDelete(String endpoint, {Map<String, dynamic>? params}) async {
    if (!_initialized) throw Exception('API not initialized');

    final queryParams = Map<String, dynamic>.from(params ?? {});
    queryParams['timestamp'] = _currentTimestamp.toString();
    queryParams['recvWindow'] = '60000';

    final queryString = _buildQueryString(queryParams);
    final signature = _signRequest(queryString);
    final url = 'https://api.mexc.com$endpoint?$queryString&signature=$signature';

    return await http.delete(
      Uri.parse(url),
      headers: {
        'X-MEXC-APIKEY': _apiKey!,
        'Content-Type': 'application/json',
      },
    );
  }

  /// Signed GET request for MEXC Contract/Futures API
  Future<http.Response> signedContractGet(String endpoint, {Map<String, dynamic>? params}) async {
    if (!_initialized) throw Exception('API not initialized');

    final timestamp = _currentTimestamp.toString();
    final paramString = params != null && params.isNotEmpty ? _buildQueryString(params) : '';
    final signature = _signContractRequest(_apiKey!, timestamp, paramString);

    final url = paramString.isNotEmpty
        ? 'https://contract.mexc.com$endpoint?$paramString'
        : 'https://contract.mexc.com$endpoint';

    return await http.get(
      Uri.parse(url),
      headers: {
        'ApiKey': _apiKey!,
        'Request-Time': timestamp,
        'Signature': signature,
        'Content-Type': 'application/json',
      },
    );
  }

  /// Signed POST request for MEXC Contract/Futures API
  Future<http.Response> signedContractPost(String endpoint, Map<String, dynamic> body) async {
    if (!_initialized) throw Exception('API not initialized');

    final timestamp = _currentTimestamp.toString();
    final bodyJson = jsonEncode(body);
    final signature = _signContractRequest(_apiKey!, timestamp, bodyJson);

    return await http.post(
      Uri.parse('https://contract.mexc.com$endpoint'),
      headers: {
        'ApiKey': _apiKey!,
        'Request-Time': timestamp,
        'Signature': signature,
        'Content-Type': 'application/json',
      },
      body: bodyJson,
    );
  }
}
