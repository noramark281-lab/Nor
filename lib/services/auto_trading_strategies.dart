import 'dart:math';
import 'api_manager.dart'; // استدعاء مدير الاتصال الحقيقي المركزي

/// استراتيجيات التداول الآلي وربطها بالتنفيذ الحقيقي على خوادم MEXC Futures
class AutoTradingStrategies {
  
  // إنشاء نسخة مفردة للوصول للمحرك البرمجي من أي مكان بالتطبيق
  static final AutoTradingStrategies _instance = AutoTradingStrategies._internal();
  factory AutoTradingStrategies() => _instance;
  AutoTradingStrategies._internal();

  final MexcApiManager _apiManager = MexcApiManager();

  /// الدالة المحورية الكبرى: تفحص الإشارات البرمجية وتنفذ الصفقات حقيقياً فوراً
  Future<void> evaluateAndExecute({
    required String symbol,          // مثال: "BTC_USDT"
    required List<double> prices,    // مصفوفة الأسعار الحية الحالية
    required List<double> volumes,   // مصفوفة الأحجام اللحظية
    required int contractVol,        // حجم الصفقة بالعقود (مثال: 10 عقود)
    required int leverage,           // الرافعة المالية المطلوبة (مثال: 10)
    required String selectedStrategy // الاستراتيجية المختارة من واجهة التطبيق
  }) async {
    
    Map<String, dynamic> decision = {'signal': 'HOLD', 'confidence': 0.0};

    // 1. فرز واختيار الاستراتيجية الفنية المطلوبة لحساب الإشارة
    switch (selectedStrategy) {
      case 'Momentum':
        decision = momentumStrategy(prices);
        break;
      case 'Mean Reversion':
        decision = meanReversion(prices);
        break;
      case 'Breakout':
        decision = breakoutStrategy(prices);
        break;
      case 'Sentiment':
        decision = sentimentStrategy(prices, volumes);
        break;
      case 'Hybrid':
        decision = hybridStrategy(prices, volumes);
        break;
      case 'SMA Crossover':
        decision = smaCrossover(prices);
        break;
      default:
        decision = {'signal': 'HOLD', 'confidence': 0.0};
    }

    print("📊 تقرير البوت الحالي لزوج $symbol: الإشارة الناتجة [${decision['signal']}] بنسبة تأكيد [${decision['confidence']}]");

    // 2. إذا كانت الإشارة انتظر (HOLD)، يتم إيقاف التنفيذ والانتظار للشمعة القادمة
    if (decision['signal'] == 'HOLD') return;

    try {
      // 3. ضبط وتعديل الرافعة المالية على خادم المنصة قبل إرسال العقد
      print("⚙️ جاري مواءمة الرافعة المالية إلى ${leverage}x لزوج $symbol...");
      await _apiManager.signedPost('/api/v1/private/position/leverage', body: {
        "symbol": symbol,
        "leverage": leverage,
        "openType": 1 // 1 تعني حساب معزول Isolated لتقليل المخاطر
      });

      // 4. ترجمة الإشارة البرمجية إلى معاملات العقود الآجلة الحقيقية
      int orderSide = 1; // الافتراضي 1 وهو فتح صفقة شراء (Open Long)
      if (decision['signal'] == 'SELL') {
        orderSide = 3; // 3 تعني فتح صفقة بيع على المكشوف (Open Short)
      }

      print("🚀 إشارة حقيقية مكشوفة! جاري إرسال الطلب فوراً إلى منصة MEXC...");
      
      // صياغة الـ Payload الحقيقي للعقود الآجلة
      final Map<String, dynamic> orderPayload = {
        "symbol": symbol,
        "price": 0,          // 0 تعني الشراء ماركت بالسعر الحالي اللحظي للسوق
        "vol": contractVol,   // عدد العقود المطلوبة بالتداول
        "leverage": leverage,
        "side": orderSide,
        "type": 5,           // 5 تعني Market Order للتنفيذ اللحظي الفوري
        "openType": 1
      };

      // إرسال الطلب الموثق والموقع بالـ HMAC-SHA256
      final response = await _apiManager.signedPost('/api/v1/private/order/create', body: orderPayload);

      if (response != null && response['code'] == 200) {
        print("✅ نجاح كامل! تم فتح صفقة حقيقية لزوج $symbol. تفاصيل العقد: ${response['data']}");
      } else {
        print("❌ رفض الخادم تنفيذ الصفقة: $response");
      }

    } catch (e) {
      print("❌ حدث خطأ فادح أثناء محاولة تنفيذ التداول التلقائي: $e");
    }
  }

  // ===== الاستراتيجيات الفنية الرياضية (تم الإبقاء عليها كما هي بكودك الأصلي) =====

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
    if (buyCount >= 3) return {'signal': 'BUY', 'confidence': totalConf / buyCount};
    if (sellCount >= 3) return {'signal': 'SELL', 'confidence': totalConf / sellCount};
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  Map<String, dynamic> smaCrossover(List<double> prices) {
    if (prices.length < 20) return {'signal': 'HOLD', 'confidence': 0.0};
    final sma5 = _sma(prices.sublist(prices.length - 5), 5);
    final sma20 = _sma(prices, 20);
    if (sma5 > sma20 * 1.005) return {'signal': 'BUY', 'confidence': 0.60};
    if (sma5 < sma20 * 0.995) return {'signal': 'SELL', 'confidence': 0.60};
    return {'signal': 'HOLD', 'confidence': 0.5};
  }

  // دالة المساعدات الرياضية لحساب المتوسط والانحراف
  double _sma(List<double> data, int period) {
    if (data.length < period) period = data.length;
    final slice = data.sublist(data.length - period);
    return slice.reduce((a, b) => a + b) / slice.length;
  }

  double _stdDev(List<double> data, double mean) {
    final variances = data.map((v) => pow(v - mean, 2)).toList();
    return sqrt(variances.reduce((a, b) => a + b) / data.length);
  }
}
