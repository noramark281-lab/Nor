/// الثوابت والإعدادات العامة
class AppConstants {
  static const String appName = 'MEXC Event Trader';
  static const String appVersion = '1.0.0';
  static const String mexcBaseUrl = 'https://api.mexc.com';
  static const String mexcWssUrl = 'wss://wss.mexc.com/ws';
  
  // إعدادات التداول الافتراضية
  static const double defaultTradeAmount = 5.0;
  static const double maxRiskPerTrade = 0.02; // 2% من الرصيد
  static const int maxConsecutiveLosses = 3;
  
  // فترات الاستراتيجيات
  static const int smaShortPeriod = 5;
  static const int smaLongPeriod = 20;
  static const int rsiPeriod = 14;
  static const int bollingerPeriod = 20;
}