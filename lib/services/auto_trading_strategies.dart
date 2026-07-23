import 'dart:math';
import 'mexc_api_service.dart';

class AutoTradingStrategies {
  final MexcApiService _api = MexcApiService();
  final Random _random = Random();

  Future<String?> executeStrategy(String strategyName, String symbol, double amount, int duration) async {
    switch (strategyName) {
      case 'trend_following':
        return await _smaCrossover(symbol, amount, duration);
      case 'mean_reversion':
        return await _bollingerBands(symbol, amount, duration);
      case 'momentum':
        return await _stochastic(symbol, amount, duration);
      case 'breakout':
        return await _breakout(symbol, amount, duration);
      case 'rsi_divergence':
        return await _stochastic(symbol, amount, duration); // Using stochastic as proxy for RSI logic
      case 'random':
        return await _randomStrategy(symbol, amount, duration);
      default:
        // Default to trend following if name mismatch
        return await _smaCrossover(symbol, amount, duration);
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
