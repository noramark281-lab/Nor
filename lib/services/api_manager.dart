import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  static const _kApiKey = 'mexc_api_key';
  static const _kSecretKey = 'mexc_secret_key';
  static const _kBlockpitApiKey = 'blockpit_mexc_api_key';
  static const _kBlockpitSecretKey = 'blockpit_mexc_secret_key';
  static const String _defaultBaseUrl = 'https://contract.mexc.com';

  String? _apiKey;
  String? _secretKey;
  String? _blockpitApiKey;
  String? _blockpitSecretKey;
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;
  String? get apiKey => _apiKey;
  String? get secretKey => _secretKey;
  String? get apiSecret => _secretKey;
  String? get blockpitApiKey => _blockpitApiKey;
  String? get blockpitSecretKey => _blockpitSecretKey;
  bool get hasBlockpitCredentials => (_blockpitApiKey?.isNotEmpty ?? false) && (_blockpitSecretKey?.isNotEmpty ?? false);

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _apiKey = prefs.getString(_kApiKey);
    _secretKey = prefs.getString(_kSecretKey);
    _blockpitApiKey = prefs.getString(_kBlockpitApiKey);
    _blockpitSecretKey = prefs.getString(_kBlockpitSecretKey);
    _apiKey ??= AppConstants.botApiKey.isNotEmpty ? AppConstants.botApiKey : (AppConstants.buildTimeApiKey.isNotEmpty ? AppConstants.buildTimeApiKey : null);
    _secretKey ??= AppConstants.botSecretKey.isNotEmpty ? AppConstants.botSecretKey : (AppConstants.buildTimeApiSecret.isNotEmpty ? AppConstants.buildTimeApiSecret : null);
    _blockpitApiKey ??= AppConstants.blockpitApiKey.isNotEmpty ? AppConstants.blockpitApiKey : null;
    _blockpitSecretKey ??= AppConstants.blockpitSecretKey.isNotEmpty ? AppConstants.blockpitSecretKey : null;
    _isInitialized = (_apiKey?.isNotEmpty ?? false) && (_secretKey?.isNotEmpty ?? false);
    debugPrint('[MexcApiManager] initialized=$_isInitialized, hasBlockpit=$hasBlockpitCredentials');
  }

  Future<void> setCredentials({required String apiKey, required String secretKey}) async {
    _apiKey = apiKey.trim();
    _secretKey = secretKey.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kApiKey, _apiKey!);
    await prefs.setString(_kSecretKey, _secretKey!);
    _isInitialized = true;
  }

  Future<void> setBlockpitCredentials({required String apiKey, required String secretKey}) async {
    _blockpitApiKey = apiKey.trim();
    _blockpitSecretKey = secretKey.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kBlockpitApiKey, _blockpitApiKey!);
    await prefs.setString(_kBlockpitSecretKey, _blockpitSecretKey!);
  }

  Future<void> clearCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kApiKey);
    await prefs.remove(_kSecretKey);
    await prefs.remove(_kBlockpitApiKey);
    await prefs.remove(_kBlockpitSecretKey);
    _apiKey = _secretKey = _blockpitApiKey = _blockpitSecretKey = null;
    _isInitialized = false;
  }

  String _generateSignature({required String timestamp, required String paramString}) {
    if (_secretKey == null || _secretKey!.isEmpty || _apiKey == null || _apiKey!.isEmpty) {
      throw StateError('API credentials are not available');
    }
    final payload = '$_apiKey$timestamp$paramString';
    return Hmac(sha256, utf8.encode(_secretKey!)).convert(utf8.encode(payload)).toString();
  }

  Map<String, String> buildAuthHeaders({required String method, String? queryString, String? bodyString}) {
    if (!_isInitialized) throw StateError('API keys not initialized');
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final paramString = method.toUpperCase() == 'GET' ? (queryString ?? '') : (bodyString ?? '');
    final signature = _generateSignature(timestamp: timestamp, paramString: paramString);
    final headers = <String, String>{
      'ApiKey': _apiKey!,
      'Request-Time': timestamp,
      'Signature': signature,
      'Accept': 'application/json',
    };
    if (method.toUpperCase() == 'POST') headers['Content-Type'] = 'application/json';
    return headers;
  }

  Map<String, String> getAuthHeadersForGet(String queryString) => buildAuthHeaders(method: 'GET', queryString: queryString);
  Map<String, String> getAuthHeadersForPost(String bodyString) => buildAuthHeaders(method: 'POST', bodyString: bodyString);

  /// اتصال حقيقي بحساب العقود: لا يعتبر نجاحاً إلا إذا أعاد الخادم استجابة حساب صحيحة.
  Future<bool> testConnection() async {
    if (!_isInitialized) return false;
    try {
      final response = await signedGet('/api/v1/private/account/assets').timeout(const Duration(seconds: 15));
      if (response is! Map) return false;
      final success = response['success'] == true;
      if (!success) debugPrint('[MexcApiManager] account connection rejected: ${response['code']} ${response['message']}');
      return success;
    } catch (e) {
      debugPrint('[MexcApiManager] real testConnection error: $e');
      return false;
    }
  }

  Future<dynamic> publicGet(String endpoint, {Map<String, dynamic>? queryParameters, String baseUrl = _defaultBaseUrl}) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: queryParameters?.map((k, v) => MapEntry(k, v.toString())));
      final response = await http.get(uri, headers: const {'Accept': 'application/json'}).timeout(const Duration(seconds: 20));
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<dynamic> signedGet(String endpoint, {Map<String, dynamic>? queryParameters, String baseUrl = _defaultBaseUrl}) async {
    try {
      final pairs = queryParameters?.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value.toString())}').toList() ?? const <String>[];
      final queryString = pairs.join('&');
      final uri = Uri.parse('$baseUrl$endpoint${queryString.isEmpty ? '' : '?$queryString'}');
      final response = await http.get(uri, headers: buildAuthHeaders(method: 'GET', queryString: queryString)).timeout(const Duration(seconds: 20));
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<dynamic> signedPost(String endpoint, {Map<String, dynamic>? body, String baseUrl = _defaultBaseUrl}) async {
    try {
      final bodyString = body == null ? '' : jsonEncode(body);
      final response = await http.post(Uri.parse('$baseUrl$endpoint'), headers: buildAuthHeaders(method: 'POST', bodyString: bodyString), body: bodyString.isEmpty ? null : bodyString).timeout(const Duration(seconds: 20));
      if (response.statusCode == 200) return jsonDecode(response.body);
      return {'success': false, 'code': response.statusCode, 'message': response.body};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
