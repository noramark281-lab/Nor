class MexcFuturesConfig {
  static const String baseUrl = 'https://contract.mexc.com';
  static const String webSocketUrl = 'wss://contract.mexc.com/ws';
  
  // ضبط التداول الحي كوضع افتراضي
  static bool isTestnet = false;
  static bool useMockData = false;
}
