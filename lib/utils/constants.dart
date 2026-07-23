class Constants {
  static const List<String> symbols = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'XRPUSDT',
    'SOLUSDT',
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
    'grid_trading': 'الشبكة (Grid Trading)',
    'rsi_divergence': 'تباعد RSI',
    'arbitrage': 'المراجحة (Arbitrage)',
  };

  static const String mexcApiBase = 'https://api.mexc.com';
  static const String mexcWebSocket = 'wss://wbs.mexc.com/ws';

  static const double defaultPayout = 0.80;
  static const double minTradeAmount = 1.0;
  static const double maxTradeAmount = 250.0;
}
