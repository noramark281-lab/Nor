import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../services/mexc_api_service.dart';

/// يوفر بيانات السوق الحية من MEXC Futures API
class MarketProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  List<EventContract> _contracts = [];
  bool _loading = false;
  String? _error;

  List<EventContract> get contracts => _contracts;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> loadContracts() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _contracts = await _fetchRealMarketData();
    } catch (e) {
      _error = 'فشل تحميل بيانات السوق: $e';
      _contracts = [];
    }

    _loading = false;
    notifyListeners();
  }

  /// يجلب بيانات السوق الحقيقية من MEXC Futures ويحوّلها إلى EventContract
  Future<List<EventContract>> _fetchRealMarketData() async {
    final tickers = await _api.getAllTickers24hr();
    if (tickers.isEmpty) {
      throw Exception('لم يتم استلام بيانات السوق من MEXC Futures. تحقق من الاتصال بالإنترنت.');
    }

    const pairs = MexcApiService.eventPairs;
    final contracts = <EventContract>[];

    for (final pair in pairs) {
      final symbol = pair['symbol']!;
      Map<String, dynamic>? ticker;
      try {
        ticker = tickers.firstWhere((t) => t['symbol'] == symbol);
      } catch (_) {
        ticker = null;
      }

      if (ticker != null && ticker.isNotEmpty) {
        // MEXC Futures ticker fields
        final price = _parseDouble(ticker['lastPrice'] ?? ticker['lastFairPrice'] ?? ticker['lastPrice'] ?? 0);
        final change = _parseDouble(ticker['riseFallRate'] ?? ticker['priceChangePercent'] ?? ticker['riseFallRate'] ?? 0);
        final volume = _parseDouble(ticker['volume24'] ?? ticker['volume'] ?? ticker['amount24'] ?? 0);
        final high = _parseDouble(ticker['highPrice'] ?? ticker['maxBidPrice'] ?? 0);

        contracts.add(EventContract(
          symbol: symbol,
          name: pair['name']!,
          category: pair['category']!,
          strikePrice: high,
          currentPrice: price,
          priceChangePercent: change * 100, // riseFallRate may be decimal (0.05 = 5%)
          volume24h: volume,
          expiryDate: DateTime.now().add(const Duration(days: 1)),
          isActive: true,
          side: change >= 0 ? 'UP' : 'DOWN',
        ));
      }
    }

    if (contracts.isEmpty) {
      throw Exception('لم يتم العثور على بيانات للأزواج المحددة. قد تكون MEXC Futures API غير متاحة.');
    }

    return contracts;
  }

  List<EventContract> get upContracts =>
      _contracts.where((c) => c.side == 'UP').toList();

  List<EventContract> get downContracts =>
      _contracts.where((c) => c.side == 'DOWN').toList();

  EventContract? getContractBySymbol(String symbol) {
    try {
      return _contracts.firstWhere((c) => c.symbol == symbol);
    } catch (_) {
      return null;
    }
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}
