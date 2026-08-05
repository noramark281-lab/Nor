import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'MEXC Event Trader';
  static const String appVersion = '1.6.1';

  // MEXC Futures / Contract API Base URL
  static const String mexcBaseUrl = 'https://contract.mexc.com';
  // MEXC Futures WebSocket
  static const String mexcWssUrl = 'wss://wss.mexc.com/ws';

  static const String buildTimeApiKey = String.fromEnvironment('MEXC_API_KEY');
  static const String buildTimeApiSecret = String.fromEnvironment('MEXC_SECRET_KEY');

  static const double defaultTradeAmount = 1.0;
  static const double maxRiskPerTrade = 0.02;
  static const int maxConsecutiveLosses = 3;

  static const int smaShortPeriod = 5;
  static const int smaLongPeriod = 20;
  static const int rsiPeriod = 14;
  static const int bollingerPeriod = 20;
}
