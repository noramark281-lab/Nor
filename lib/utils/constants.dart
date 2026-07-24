class Constants {
  static const List<String> symbols = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'XRPUSDT',
    'SOLUSDT',
    'ADAUSDT',
    'DOGEUSDT',
    'DOTUSDT',
    'MATICUSDT',
    'LINKUSDT',
    'LTCUSDT',
    'AVAXUSDT',
  ];

  static const List<String> timeframes = [
    '1m',
    '5m',
    '15m',
    '1h',
    '4h',
    '1d',
  ];

  static const Map<String, String> strategyNames = {
    'scalping': 'المضاربة السريعة (Scalping)',
    'mean_reversion': 'الارتداد المتوسط (Mean Reversion)',
    'rsi': 'مؤشر القوة النسبية (RSI)',
    'trend_following': 'اتباع الاتجاه (Trend Following)',
    'random': 'عشوائي (للاختبار)',
  };

  static const String mexcApiBase = 'https://api.mexc.com';
  static const String mexcWebSocket = 'wss://wbs.mexc.com/ws';

  // === REAL TRADING LIMITS ===
  // MAX $1 per trade - enforced in UI and backend
  static const double defaultPayout = 0.85;
  static const double minTradeAmount = 1.0;
  static const double maxTradeAmount = 1.0;  // $1 CAP
  static const double maxDailyTradeAmount = 50.0;  // $50 daily max
  static const int maxDailyTrades = 50;

  // Backend config
  static const String defaultBackendUrl = 'https://mexc-trading-bot.onrender.com';
}
