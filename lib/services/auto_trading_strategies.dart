import 'dart:math';
import 'mexc_api_service.dart';

class AutoTradingStrategies {
  final MexcApiService _api = MexcApiService();

  Future<String?> executeStrategy(String strategyName, String symbol, double amount, int duration) async {
    switch (strategyName) {
      case 'trend_following':
        return await _smaCrossover(symbol);
      case 'mean_reversion':
        return await _bollingerBands(symbol);
      case 'momentum':
        return await _stochastic(symbol);
      case 'breakout':
        return await _breakout(symbol);
      case 'rsi_divergence':
        return await _rsiStrategy(symbol);
      default:
        return await _smaCrossover(symbol);
    }
  }

  Future<String?> _smaCrossover(String symbol) async {
    final klines = await _api.getKlines(symbol, '15m', limit: 30);
    if (klines.length < 20) return null;
    
    final shortSMA = _calculateSMA(klines, 7);
    final longSMA = _calculateSMA(klines, 25);
    
    if (shortSMA > longSMA) return 'UP';
    if (shortSMA < longSMA) return 'DOWN';
    return null;
  }

  double _calculateSMA(List<dynamic> klines, int period) {
    double sum = 0;
    for (int i = klines.length - period; i < klines.length; i++) {
      sum += double.parse(klines[i][4].toString());
    }
    return sum / period;
  }

  Future<String?> _bollingerBands(String symbol) async {
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

  Future<String?> _rsiStrategy(String symbol) async {
    final klines = await _api.getKlines(symbol, '15m', limit: 30);
    if (klines.length < 15) return null;
    
    final rsi = _calculateRSI(klines, 14);
    if (rsi < 30) return 'UP';
    if (rsi > 70) return 'DOWN';
    return null;
  }

  double _calculateRSI(List<dynamic> klines, int period) {
    double gains = 0;
    double losses = 0;
    
    for (int i = klines.length - period; i < klines.length; i++) {
      final change = double.parse(klines[i][4].toString()) - double.parse(klines[i-1][4].toString());
      if (change > 0) gains += change; else losses -= change;
    }
    
    if (losses == 0) return 100;
    final rs = (gains / period) / (losses / period);
    return 100 - (100 / (1 + rs));
  }

  Future<String?> _stochastic(String symbol) async {
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

  Future<String?> _breakout(String symbol) async {
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
}
