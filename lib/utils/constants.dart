/// الثوابت والإعدادات العامة
class AppConstants {
  static const String appName = 'MEXC Event Trader';
  static const String appVersion = '1.8.0+19';

  /// روابط MEXC API الإنتاجية الحقيقية
  static const String mexcBaseUrl = 'https://contract.mexc.com';
  static const String mexcWssUrl = 'wss://wss.mexc.com/ws';
  static const String mexcWebSocket = 'wss://wbs.mexc.com/ws';
  static const String defaultBackendUrl = 'http://localhost:8000';

  /// العملات المدعومة
  static const List<String> symbols = [
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'DOGEUSDT',
    'BNBUSDT',
    'ADAUSDT',
  ];

  /// الاستراتيجيات
  static const Map<String, String> strategyNames = {
    'scalping': 'سكالبينغ سريع (Scalping)',
    'grid': 'تداول الشبكة (Grid Trading)',
    'trend': 'تتبع الاتجاه (Trend Following)',
    'dca': 'متوسط التكلفة (DCA)',
    'ai': 'تحليل ذكي (AI Strategy)',
  };

  /// مفاتيح API المُضمَّنة في وقت البناء (Build-time) عبر --dart-define
  static const String buildTimeApiKey = String.fromEnvironment(
    'MEXC_API_KEY',
    defaultValue: String.fromEnvironment(
      'VITE_MEXC_API_KEY',
      defaultValue: String.fromEnvironment('API_KEY'),
    ),
  );

  static const String buildTimeApiSecret = String.fromEnvironment(
    'MEXC_SECRET_KEY',
    defaultValue: String.fromEnvironment(
      'MEXC_API_SECRET',
      defaultValue: String.fromEnvironment(
        'VITE_MEXC_SECRET_KEY',
        defaultValue: String.fromEnvironment('SECRET_KEY'),
      ),
    ),
  );

  static const String serverIp = String.fromEnvironment(
    'SERVER_IP',
    defaultValue: String.fromEnvironment(
      'VITE_SERVER_IP',
      defaultValue: String.fromEnvironment('HOST_IP'),
    ),
  );

  static String get backendUrl {
    final ip = serverIp.trim();
    if (ip.isNotEmpty) {
      if (ip.startsWith('http://') || ip.startsWith('https://')) {
        return ip;
      }
      return 'http://$ip:8000';
    }
    return defaultBackendUrl;
  }

  /// إعدادات التداول الافتراضية
  static const double defaultTradeAmount = 5.0;
  static const double maxRiskPerTrade = 0.02; // 2% من الرصيد
  static const int maxConsecutiveLosses = 3;

  /// فترات الاستراتيجيات
  static const int smaShortPeriod = 5;
  static const int smaLongPeriod = 20;
  static const int rsiPeriod = 14;
  static const int bollingerPeriod = 20;
}

typedef Constants = AppConstants;

