import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

import '../utils/constants.dart';
import 'secure_storage_service.dart';

/// مدير API الموحَّد لـ MEXC - يدعم التداول الحقيقي عبر API v3
///
/// يدعم قراءة مفاتيح API من:
/// 1. متغيرات البناء (--dart-define) لأتمتة CI/CD
/// 2. flutter_secure_storage للإدخال اليدوي داخل التطبيق
///
class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  bool _initialized = false;
  String? _apiKey;
  String? _apiSecret;
  int _serverTimeOffset = 0;
  DateTime? _lastTimeSync;

  // ── Rate limiter ────────────────────────────────────────────────
  final Map<String, List<DateTime>> _requestLog = {};
  static const int _maxRequestsPerSecond = 5;
  static const int _maxRequestsPerMinute = 300;

  // ── Getters ─────────────────────────────────────────────────────
  bool get isInitialized => _initialized;
  String? get apiKey => _apiKey;
  String? get apiSecret => _apiSecret;

  // ── Initialization ──────────────────────────────────────────────
  Future<void> initialize() async {
    if (_initialized) return;

    // 1️⃣ محاولة قراءة المفاتيح من متغيرات البناء أولاً
    final buildKey = AppConstants.buildTimeApiKey;
    final buildSecret = AppConstants.buildTimeApiSecret;

    if (buildKey.isNotEmpty && buildSecret.isNotEmpty) {
      _apiKey = buildKey;
      _apiSecret = buildSecret;
      debugLog('✅ API keys loaded from build-time environment variables');
    } else {
      // 2️⃣ محاولة قراءة من التخزين الآمن (الإدخال اليدوي)
      final stored = await SecureStorageService.getApiCredentials();
      _apiKey = stored['apiKey'];
      _apiSecret = stored['apiSecret'];
      if (_apiKey != null && _apiSecret != null) {
        debugLog('✅ API keys loaded from secure storage');
      }
    }

    if (_apiKey != null && _apiSecret != null) {
      // مزامنة الوقت مع سيرفر MEXC لتجنب مشاكل التوقيت
      await syncServerTime();
      _initialized = true;
    }
  }

  Future<void> setCredentials(String key, String secret) async {
    _apiKey = key;
    _apiSecret = secret;
    await SecureStorageService.saveApiCredentials(key, secret);
    await syncServerTime();
    _initialized = true;
  }

  Future<void> clearCredentials() async {
    _apiKey = null;
    _apiSecret = null;
    _initialized = false;
    _serverTimeOffset = 0;
    await SecureStorageService.clearAll();
  }

  // ── Server time sync ────────────────────────────────────────────
  /// يجلب وقت السيرفر ويحسب الفرق مع الجهاز المحلي
  Future<void> syncServerTime() async {
    try {
      final localBefore = DateTime.now().millisecondsSinceEpoch;
      final response = await http
          .get(Uri.parse('${AppConstants.mexcBaseUrl}/api/v3/time'))
          .timeout(const Duration(seconds: 10));
      final localAfter = DateTime.now().millisecondsSinceEpoch;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final serverTime = (data['serverTime'] as int);
        final roundTrip = localAfter - localBefore;
        // تقدير وقت السيرفر = serverTime + (roundTrip / 2)
        final estimatedServerTime = serverTime + (roundTrip ~/ 2);
        _serverTimeOffset = estimatedServerTime - localAfter;
        _lastTimeSync = DateTime.now();
        debugLog('⏱ Server time synced. Offset: ${_serverTimeOffset}ms, RTT: ${roundTrip}ms');
      }
    } catch (e) {
      debugLog('⚠️ Failed to sync server time: $e');
      // نستمر بدون مزامنة - قد يعمل إذا كان التوقيت المحلي دقيقاً
    }
  }

  /// يُرجع الـ timestamp المُستخدم في توقيع الطلبات
  int get _timestamp => DateTime.now().millisecondsSinceEpoch + _serverTimeOffset;

  // ── Signature ───────────────────────────────────────────────────
  /// يُنشئ توقيع HMAC-SHA256 مطابقاً لمواصفات MEXC API v3
  String _sign(String queryString) {
    if (_apiSecret == null) throw Exception('API Secret not initialized');
    final key = utf8.encode(_apiSecret!);
    final bytes = utf8.encode(queryString);
    final hmac = Hmac(sha256, key);
    return hmac.convert(bytes).toString();
  }

  /// يُرتِّب المعاملات أبجدياً ويُنشئ الـ query string
  String _buildQueryString(Map<String, dynamic> params) {
    final sorted = params.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    return sorted
        .where((e) => e.value != null)
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
        .join('&');
  }

  // ── Rate Limiting ───────────────────────────────────────────────
  Future<void> _checkRateLimit(String endpointKey) async {
    final now = DateTime.now();
    final log = _requestLog.putIfAbsent(endpointKey, () => []);

    // تنظيف الطلبات القديمة (> 1 دقيقة)
    log.removeWhere((t) => now.difference(t).inSeconds > 60);

    // فحص الحد الثاني
    final recent = log.where((t) => now.difference(t).inSeconds < 1).length;
    if (recent >= _maxRequestsPerSecond) {
      await Future.delayed(const Duration(milliseconds: 250));
    }

    // فحص الحد الدقيقة
    if (log.length >= _maxRequestsPerMinute) {
      final oldest = log.first;
      final wait = 60 - now.difference(oldest).inSeconds + 1;
      if (wait > 0) {
        debugLog('⏳ Rate limit approached. Waiting $wait seconds...');
        await Future.delayed(Duration(seconds: wait));
      }
    }

    log.add(now);
  }

  // ── HTTP helpers ────────────────────────────────────────────────
  Future<http.Response> signedGet(
    String path, {
    Map<String, dynamic>? params,
    bool skipSignature = false,
  }) async {
    await _checkRateLimit(path);

    final queryParams = <String, dynamic>{
      if (params != null) ...params,
      if (!skipSignature) 'timestamp': _timestamp,
    };

    var query = _buildQueryString(queryParams);
    if (!skipSignature) {
      final signature = _sign(query);
      query += '&signature=$signature';
    }

    final url = Uri.parse('${AppConstants.mexcBaseUrl}$path?$query');
    final headers = <String, String>{
      'Accept': 'application/json',
      if (!skipSignature && _apiKey != null) 'X-MEXC-APIKEY': _apiKey!,
    };

    debugLog('📡 GET $path');
    final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 20));
    return _handleResponse(response, path);
  }

  Future<http.Response> signedPost(
    String path, {
    Map<String, dynamic>? body,
    bool skipSignature = false,
  }) async {
    await _checkRateLimit(path);

    final queryParams = <String, dynamic>{
      if (body != null) ...body,
      if (!skipSignature) 'timestamp': _timestamp,
    };

    var query = _buildQueryString(queryParams);
    if (!skipSignature) {
      final signature = _sign(query);
      query += '&signature=$signature';
    }

    final url = Uri.parse('${AppConstants.mexcBaseUrl}$path');
    final headers = <String, String>{
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      if (!skipSignature && _apiKey != null) 'X-MEXC-APIKEY': _apiKey!,
    };

    debugLog('📡 POST $path');
    final response = await http.post(url, headers: headers, body: query).timeout(const Duration(seconds: 20));
    return _handleResponse(response, path);
  }

  Future<http.Response> signedDelete(
    String path, {
    Map<String, dynamic>? params,
  }) async {
    await _checkRateLimit(path);

    final queryParams = <String, dynamic>{
      if (params != null) ...params,
      'timestamp': _timestamp,
    };

    var query = _buildQueryString(queryParams);
    final signature = _sign(query);
    query += '&signature=$signature';

    final url = Uri.parse('${AppConstants.mexcBaseUrl}$path?$query');
    final headers = <String, String>{
      'Accept': 'application/json',
      if (_apiKey != null) 'X-MEXC-APIKEY': _apiKey!,
    };

    debugLog('📡 DELETE $path');
    final response = await http.delete(url, headers: headers).timeout(const Duration(seconds: 20));
    return _handleResponse(response, path);
  }

  /// طلبات عامة بدون توقيع (البيانات العامة)
  Future<http.Response> publicGet(String path, {Map<String, dynamic>? params}) async {
    await _checkRateLimit(path);
    var uri = Uri.parse('${AppConstants.mexcBaseUrl}$path');
    if (params != null) {
      uri = uri.replace(queryParameters: params.map((k, v) => MapEntry(k, v.toString())));
    }
    debugLog('📡 PUBLIC GET $path');
    return http.get(uri, headers: {'Accept': 'application/json'}).timeout(const Duration(seconds: 15));
  }

  // ── Response handler ────────────────────────────────────────────
  http.Response _handleResponse(http.Response response, String endpoint) {
    debugLog('📥 ${response.statusCode} from $endpoint');

    if (response.statusCode == 429) {
      throw MexcRateLimitException('Rate limit exceeded on $endpoint. Please wait.');
    }

    if (response.statusCode == 418) {
      throw MexcRateLimitException('IP banned by MEXC. Too many requests.');
    }

    if (response.statusCode >= 400) {
      String msg = 'HTTP ${response.statusCode}';
      try {
        final data = jsonDecode(response.body);
        msg = data['msg']?.toString() ?? data['message']?.toString() ?? response.body;
      } catch (_) {
        msg = response.body.isNotEmpty ? response.body : msg;
      }

      // إعادة مزامنة الوقت إذا كانت المشكلة متعلقة بالتوقيت
      if (msg.contains('timestamp') || msg.contains('Timestamp')) {
        debugLog('⏱ Timestamp error detected, re-syncing...');
        syncServerTime(); // async fire-and-forget
      }

      throw MexcApiException(msg, statusCode: response.statusCode);
    }

    return response;
  }

  // ── Helpers ─────────────────────────────────────────────────────
  void debugLog(String message) {
    // ignore: avoid_print
    if (const bool.fromEnvironment('DEBUG', defaultValue: false)) print('[MEXC] $message');
  }
}

// ═════════════════════════════════════════════════════════════════
// Custom Exceptions
// ═════════════════════════════════════════════════════════════════

class MexcApiException implements Exception {
  final String message;
  final int statusCode;
  MexcApiException(this.message, {this.statusCode = 0});
  @override
  String toString() => 'MexcApiException: $message (HTTP $statusCode)';
}

class MexcRateLimitException implements Exception {
  final String message;
  MexcRateLimitException(this.message);
  @override
  String toString() => 'MexcRateLimitException: $message';
}
