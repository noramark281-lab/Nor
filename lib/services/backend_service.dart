import 'dart:convert';
import 'package:http/http.dart' as http;
import 'secure_storage_service.dart';
import '../utils/constants.dart';

/// BackendService - Connects to Python cloud trading bot
/// Used for: 24/7 cloud bot control, monitoring, manual trades via backend
class BackendService {
  String _baseUrl = Constants.defaultBackendUrl;

  BackendService({String? baseUrl}) {
    if (baseUrl != null && baseUrl.isNotEmpty) {
      _baseUrl = baseUrl;
    }
    _loadUrl();
  }

  Future<void> _loadUrl() async {
    final saved = await SecureStorageService.getBackendUrl();
    if (saved != null && saved.isNotEmpty) {
      _baseUrl = saved;
    }
  }

  Future<void> setBaseUrl(String url) async {
    _baseUrl = url;
    await SecureStorageService.saveBackendUrl(url);
  }

  String get baseUrl => _baseUrl;

  // ========== CREDENTIALS ==========

  Future<Map<String, dynamic>> initializeBot(String apiKey, String apiSecret) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/init'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'api_key': apiKey, 'api_secret': apiSecret}),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'error': 'HTTP ${response.statusCode}: ${response.body}'};
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  // ========== BOT CONTROL ==========

  Future<Map<String, dynamic>> startBot() async {
    return _post('/api/start');
  }

  Future<Map<String, dynamic>> stopBot() async {
    return _post('/api/stop');
  }

  Future<Map<String, dynamic>> pauseBot() async {
    return _post('/api/pause');
  }

  Future<Map<String, dynamic>> resumeBot() async {
    return _post('/api/resume');
  }

  Future<Map<String, dynamic>> getStatus() async {
    return _get('/api/status');
  }

  // ========== CONFIG ==========

  Future<Map<String, dynamic>> updateConfig({
    String? symbol,
    double? maxTradeUsd,
    String? strategy,
    int? intervalSeconds,
    double? stopLossPercent,
    double? takeProfitPercent,
    int? maxDailyTrades,
    bool? enabled,
  }) async {
    final body = <String, dynamic>{};
    if (symbol != null) body['symbol'] = symbol;
    if (maxTradeUsd != null) body['max_trade_usd'] = maxTradeUsd;
    if (strategy != null) body['strategy'] = strategy;
    if (intervalSeconds != null) body['interval_seconds'] = intervalSeconds;
    if (stopLossPercent != null) body['stop_loss_percent'] = stopLossPercent;
    if (takeProfitPercent != null) body['take_profit_percent'] = takeProfitPercent;
    if (maxDailyTrades != null) body['max_daily_trades'] = maxDailyTrades;
    if (enabled != null) body['enabled'] = enabled;

    return _postBody('/api/config', body);
  }

  // ========== TRADES ==========

  Future<Map<String, dynamic>> manualTrade(String side, {String? symbol, double? amountUsd}) async {
    final body = <String, dynamic>{'side': side};
    if (symbol != null) body['symbol'] = symbol;
    if (amountUsd != null) body['amount_usd'] = amountUsd;
    return _postBody('/api/trade/manual', body);
  }

  Future<Map<String, dynamic>> getTradeHistory({int limit = 100}) async {
    return _get('/api/trades/history?limit=$limit');
  }

  Future<Map<String, dynamic>> getOpenPositions() async {
    return _get('/api/positions');
  }

  Future<Map<String, dynamic>> emergencyCloseAll() async {
    return _post('/api/emergency/close-all');
  }

  // ========== ACCOUNT ==========

  Future<Map<String, dynamic>> getBalance({String asset = 'USDT'}) async {
    return _get('/api/balance?asset=$asset');
  }

  Future<Map<String, dynamic>> getAccount() async {
    return _get('/api/account');
  }

  // ========== MARKET ==========

  Future<Map<String, dynamic>> getMarketPrice(String symbol) async {
    return _get('/api/market/price?symbol=$symbol');
  }

  Future<Map<String, dynamic>> getMarketTicker(String symbol) async {
    return _get('/api/market/ticker?symbol=$symbol');
  }

  Future<Map<String, dynamic>> syncTime() async {
    return _get('/api/time/sync');
  }

  Future<Map<String, dynamic>> healthCheck() async {
    return _get('/health');
  }

  // ========== HTTP HELPERS ==========

  Future<Map<String, dynamic>> _get(String path) async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl$path'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'error': 'HTTP ${response.statusCode}: ${response.body}'};
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> _post(String path) async {
    try {
      final response = await http.post(Uri.parse('$_baseUrl$path'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'error': 'HTTP ${response.statusCode}: ${response.body}'};
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> _postBody(String path, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'error': 'HTTP ${response.statusCode}: ${response.body}'};
    } catch (e) {
      return {'error': e.toString()};
    }
  }
}
