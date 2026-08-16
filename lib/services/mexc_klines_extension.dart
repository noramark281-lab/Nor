import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/candle_data.dart';
import 'mexc_api_service.dart';

/// Spot-only market-data extension for the chart.
/// Uses the documented MEXC Spot V3 /api/v3/klines endpoint.
extension MexcKlinesExtension on MexcApiService {
  Future<List<CandleData>> getKlines(
    String symbol, {
    String interval = '1m',
    int limit = 120,
  }) async {
    final normalizedSymbol = symbol
        .replaceAll('_', '')
        .replaceAll('/', '')
        .toUpperCase();

    const allowedIntervals = <String>{
      '1m', '5m', '15m', '30m', '60m', '4h', '1d', '1W', '1M',
    };
    final safeInterval = allowedIntervals.contains(interval) ? interval : '1m';
    final safeLimit = limit.clamp(1, 1000);

    final uri = Uri.parse('https://api.mexc.com/api/v3/klines').replace(
      queryParameters: {
        'symbol': normalizedSymbol,
        'interval': safeInterval,
        'limit': safeLimit.toString(),
      },
    );

    final response = await http.get(uri).timeout(const Duration(seconds: 12));
    if (response.statusCode != 200) {
      throw Exception('فشل جلب شموع Spot من MEXC: HTTP ${response.statusCode}');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! List) {
      throw Exception('استجابة شموع MEXC غير صالحة.');
    }

    return decoded
        .whereType<List<dynamic>>()
        .map(CandleData.fromMexc)
        .toList(growable: false);
  }
}
