import 'dart:math';
import '../models/event_contract.dart';

/// استراتيجيات التداول الآلي (5 استراتيجيات)
class AutoTradingStrategies {
  final Random _rnd = Random();

  // 1. Momentum - تتبع الزخم
  Map<String, dynamic> momentumStrategy(List<double> prices) {
    if (prices.length < 10) return {'signal': 'HOLD', 'confidence': 0.0};
    final sma10 = _sma(prices, 10);
    final sma20 = _sma(prices, 20);
    final current = prices.last;
    if (sma10 > sma20 * 1.01 && current > sma10) {
      return {'signal': 'BUY', 'confidence': 0.72};
    } else if (sma10 < sma20 * 0.99 && current < sma10) {
      return {'signal': 'SELL', 'confidence': 0.68};
    }
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // 2. Mean Reversion - العودة للمتوسط
  Map<String, dynamic> meanReversion(List<double> prices) {
    if (prices.length < 20) return {'signal': 'HOLD', 'confidence': 0.0};
    final mean = _sma(prices, 20);
    final std = _stdDev(prices, mean);
    final current = prices.last;
    final zScore = (current - mean) / (std + 1e-9);
    if (zScore < -2.0) {
      return {'signal': 'BUY', 'confidence': 0.65};
    } else if (zScore > 2.0) {
      return {'signal': 'SELL', 'confidence': 0.65};
    }
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // 3. Breakout - اختراق المستويات
  Map<String, dynamic> breakoutStrategy(List<double> prices) {
    if (prices.length < 14) return {'signal': 'HOLD', 'confidence': 0.0};
    final high14 = prices.sublist(prices.length - 14).reduce(max);
    final low14 = prices.sublist(prices.length - 14).reduce(min);
    final current = prices.last;
    if (current > high14 * 0.998) {
      return {'signal': 'BUY', 'confidence': 0.70};
    } else if (current < low14 * 1.002) {
      return {'signal': 'SELL', 'confidence': 0.70};
    }
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // 4. Sentiment - بناء على الحجم والتقلب
  Map<String, dynamic> sentimentStrategy(List<double> prices, List<double> volumes) {
    if (prices.length < 5 || volumes.length < 5) return {'signal': 'HOLD', 'confidence': 0.0};
    final avgVol = volumes.reduce((a, b) => a + b) / volumes.length;
    final recentVol = volumes.last;
    final priceChange = ((prices.last - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;
    if (recentVol > avgVol * 1.5 && priceChange > 1.5) {
      return {'signal': 'BUY', 'confidence': 0.68};
    } else if (recentVol > avgVol * 1.5 && priceChange < -1.5) {
      return {'signal': 'SELL', 'confidence': 0.68};
    }
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // 5. Hybrid - دمج الاستراتيجيات
  Map<String, dynamic> hybridStrategy(List<double> prices, List<double> volumes) {
    final mom = momentumStrategy(prices);
    final mr = meanReversion(prices);
    final br = breakoutStrategy(prices);
    final sent = sentimentStrategy(prices, volumes);

    int buyCount = 0, sellCount = 0;
    double totalConf = 0;
    for (final s in [mom, mr, br, sent]) {
      if (s['signal'] == 'BUY') { buyCount++; totalConf += (s['confidence'] as double); }
      if (s['signal'] == 'SELL') { sellCount++; totalConf += (s['confidence'] as double); }
    }

    if (buyCount >= 3) {
      return {'signal': 'BUY', 'confidence': totalConf / buyCount};
    } else if (sellCount >= 3) {
      return {'signal': 'SELL', 'confidence': totalConf / sellCount};
    }
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // SMA Crossover (للمبتدئين)
  Map<String, dynamic> smaCrossover(List<double> prices) {
    if (prices.length < 20) return {'signal': 'HOLD', 'confidence': 0.0};
    final sma5 = _sma(prices.sublist(prices.length - 5), 5);
    final sma20 = _sma(prices, 20);
    if (sma5 > sma20 * 1.005) return {'signal': 'BUY', 'confidence': 0.60};
    if (sma5 < sma20 * 0.995) return {'signal': 'SELL', 'confidence': 0.60};
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // Heikin Ashi (تبسيط)
  Map<String, dynamic> heikinAshiSignal(List<double> prices) {
    if (prices.length < 3) return {'signal': 'HOLD', 'confidence': 0.0};
    final ha = _heikinAshi(prices);
    if (ha.length < 2) return {'signal': 'HOLD', 'confidence': 0.0};
    final last = ha.last;
    final prev = ha[ha.length - 2];
    if (last['close']! > last['open']! && prev['close']! < prev['open']!) {
      return {'signal': 'BUY', 'confidence': 0.58};
    } else if (last['close']! < last['open']! && prev['close']! > prev['open']!) {
      return {'signal': 'SELL', 'confidence': 0.58};
    }
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // مساعدات
  double _sma(List<double> data, int period) {
    if (data.length < period) period = data.length;
    final slice = data.sublist(data.length - period);
    return slice.reduce((a, b) => a + b) / slice.length;
  }

  double _stdDev(List<double> data, double mean) {
    final variances = data.map((v) => pow(v - mean, 2)).toList();
    return sqrt(variances.reduce((a, b) => a + b) / data.length);
  }

  List<Map<String, double>> _heikinAshi(List<double> prices) {
    final List<Map<String, double>> result = [];
    for (int i = 0; i < prices.length; i++) {
      final close = prices[i];
      final open = i == 0 ? close : (result.last['open']! + result.last['close']!) / 2;
      result.add({'open': open, 'close': close});
    }
    return result;
  }
}
