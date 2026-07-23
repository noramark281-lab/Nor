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
    'trend_following': 'اتباع الاتجاه (Trend Following)',
    'mean_reversion': 'الارتداد المتوسط (Mean Reversion)',
    'momentum': 'الزخم (Momentum)',
    'breakout': 'الاختراق (Breakout)',
    'rsi_divergence': 'تباعد RSI',
    'random': 'عشوائي (للاختبار)',
  };

  static const String mexcApiBase = 'https://api.mexc.com';
  static const String mexcWebSocket = 'wss://wbs.mexc.com/ws';

  static const double defaultPayout = 0.85;
  static const double minTradeAmount = 1.0;
  static const double maxTradeAmount = 500.0;
}
