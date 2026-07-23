import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'secure_storage_service.dart';

class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  String? _apiKey;
  String? _apiSecret;
  bool _initialized = false;

  bool get isInitialized => _initialized;
  String? get apiKey => _apiKey;

  Future<void> initialize() async {
    _apiKey = await SecureStorageService.getApiKey();
    _apiSecret = await SecureStorageService.getApiSecret();
    _initialized = _apiKey != null && _apiSecret != null;
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

  String _signRequest(String queryString) {
    if (_apiSecret == null) throw Exception('API Secret not set');
    final key = utf8.encode(_apiSecret!);
    final bytes = utf8.encode(queryString);
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(bytes);
    return digest.toString();
  }

  Future<http.Response> signedGet(String endpoint, {Map<String, String>? params}) async {
    if (!_initialized) throw Exception('API not initialized');
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final queryParams = params ?? {};
    queryParams['timestamp'] = timestamp;
    final queryString = queryParams.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');
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

  Future<http.Response> signedPost(String endpoint, Map<String, dynamic> body) async {
    if (!_initialized) throw Exception('API not initialized');
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    body['timestamp'] = timestamp;
    final bodyString = jsonEncode(body);
    final signature = _signRequest(bodyString);
    return await http.post(
      Uri.parse('https://api.mexc.com$endpoint?signature=$signature'),
      headers: {
        'X-MEXC-APIKEY': _apiKey!,
        'Content-Type': 'application/json',
      },
      body: bodyString,
    );
  }
}
