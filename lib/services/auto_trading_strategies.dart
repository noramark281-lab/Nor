import 'dart:math';
import 'mexc_api_service.dart';

class AutoTradingStrategies {
  final MexcApiService _api = MexcApiService();
  final Random _random = Random();

  Future<String?> executeStrategy(String strategyName, String symbol, double amount, int duration) async {
    switch (strategyName) {
      case 'sma':
        return await _smaCrossover(symbol, amount, duration);
      case 'bollinger':
        return await _bollingerBands(symbol, amount, duration);
      case 'stochastic':
        return await _stochastic(symbol, amount, duration);
      case 'volume_price':
        return await _volumePrice(symbol, amount, duration);
      case 'heikin_ashi':
        return await _heikinAshi(symbol, amount, duration);
      case 'breakout':
        return await _breakout(symbol, amount, duration);
      case 'random':
        return await _randomStrategy(symbol, amount, duration);
      default:
        return null;
    }
  }

  Future<String?> _smaCrossover(String symbol, double amount, int duration) async {
    final klines = await _api.getKlines(symbol, '15m', limit: 25);
    if (klines.length < 20) return null;
    final shortSMA = _calculateSMA(klines, 5);
    final longSMA = _calculateSMA(klines, 20);
    if (shortSMA > longSMA) {
      return 'UP';
    } else if (shortSMA < longSMA) {
      return 'DOWN';
    }
    return null;
  }

  double _calculateSMA(List<dynamic> klines, int period) {
    double sum = 0;
    for (int i = klines.length - period; i < klines.length; i++) {
      sum += double.parse(klines[i][4].toString());
    }
    return sum / period;
  }

  Future<String?> _bollingerBands(String symbol, double amount, int duration) async {
    final klines = await _api.getKlines(symbol, '15m', limit: 25);
    if (klines.length < 20) return null;
    final sma = _calculateSMA(klines, 20);
    final stdDev = _calculateStdDev(klines, 20, sma);
    final upper = sma + (2 * stdDev);
    final lower = sma - (2 * stdDev);
    final currentPrice = double.parse(klines.last[4].toString());
    if (currentPrice < lower) return 'UP';
    if (currentPrice > upper) return 'DOWN';
    return null;
  }

  double _calculateStdDev(List<dynamic> klines, int period, double mean) {
    double sum = 0;
    for (int i = klines.length - period; i < klines.length; i++) {
      final price = double.parse(klines[i][4].toString());
      sum += (price - mean) * (price - mean);
    }
    return sqrt(sum / period);
  }

  Future<String?> _stochastic(String symbol, double amount, int duration) async {
    final klines = await _api.getKlines(symbol, '15m', limit: 20);
    if (klines.length < 14) return null;
    double lowestLow = double.infinity;
    double highestHigh = 0;
    for (int i = klines.length - 14; i < klines.length; i++) {
      final low = double.parse(klines[i][3].toString());
      final high = double.parse(klines[i][2].toString());
      if (low < lowestLow) lowestLow = low;
      if (high > highestHigh) highestHigh = high;
    }
    final currentClose = double.parse(klines.last[4].toString());
    final k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    if (k < 20) return 'UP';
    if (k > 80) return 'DOWN';
    return null;
  }

  Future<String?> _volumePrice(String symbol, double amount, int duration) async {
    final klines = await _api.getKlines(symbol, '5m', limit: 10);
    if (klines.length < 5) return null;
    double avgVolume = 0;
    for (var k in klines) {
      avgVolume += double.parse(k[5].toString());
    }
    avgVolume /= klines.length;
    final lastVolume = double.parse(klines.last[5].toString());
    final lastClose = double.parse(klines.last[4].toString());
    final prevClose = double.parse(klines[klines.length - 2][4].toString());
    if (lastVolume > avgVolume * 1.5 && lastClose > prevClose) return 'UP';
    if (lastVolume > avgVolume * 1.5 && lastClose < prevClose) return 'DOWN';
    return null;
  }

  Future<String?> _heikinAshi(String symbol, double amount, int duration) async {
    final klines = await _api.getKlines(symbol, '15m', limit: 5);
    if (klines.length < 3) return null;
    final prev = klines[klines.length - 2];
    final curr = klines.last;
    final prevOpen = double.parse(prev[1].toString());
    final prevClose = double.parse(prev[4].toString());
    final currOpen = double.parse(curr[1].toString());
    final currClose = double.parse(curr[4].toString());
    final prevGreen = prevClose > prevOpen;
    final currGreen = currClose > currOpen;
    if (!prevGreen && currGreen) return 'UP';
    if (prevGreen && !currGreen) return 'DOWN';
    return null;
  }

  Future<String?> _breakout(String symbol, double amount, int duration) async {
    final klines = await _api.getKlines(symbol, '1h', limit: 25);
    if (klines.length < 20) return null;
    double highestHigh = 0;
    double lowestLow = double.infinity;
    for (int i = klines.length - 20; i < klines.length - 1; i++) {
      final high = double.parse(klines[i][2].toString());
      final low = double.parse(klines[i][3].toString());
      if (high > highestHigh) highestHigh = high;
      if (low < lowestLow) lowestLow = low;
    }
    final currentPrice = double.parse(klines.last[4].toString());
    if (currentPrice > highestHigh) return 'UP';
    if (currentPrice < lowestLow) return 'DOWN';
    return null;
  }

  Future<String?> _randomStrategy(String symbol, double amount, int duration) async {
    return _random.nextBool() ? 'UP' : 'DOWN';
  }
}
