/// الثوابت والإعدادات العامة المحدثة للعقود الآجلة
class AppConstants {
  static const String appName = 'MEXC Event Trader';
  static const String appVersion = '1.6.0';

  /// روابط MEXC API الإنتاجية الحقيقية للحسابات الآجلة (Futures)
  static const String mexcBaseUrl = 'https://mexc.com';
  static const String mexcWssUrl = 'wss://://mexc.com';

  /// مفاتيح API المُضمَّنة في وقت البناء (Build-time) عبر --dart-define
  static const String buildTimeApiKey = String.fromEnvironment('MEXC_API_KEY');
  static const String buildTimeApiSecret = String.fromEnvironment('MEXC_SECRET_KEY');

  /// إعدادات التداول الافتراضية للعقود الآجلة
  static const double defaultTradeAmount = 1.0; // البداية بـ عقد واحد كحد أدنى
  static const double maxRiskPerTrade = 0.02; // 2% من الرصيد
  static const int maxConsecutiveLosses = 3;

  /// فترات الاستراتيجيات
  static const int smaShortPeriod = 5;
  static const int smaLongPeriod = 20;
  static const int rsiPeriod = 14;
  static const int bollingerPeriod = 20;
}
