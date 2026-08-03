import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../services/mexc_api_service.dart';

/// يوفر بيانات السوق الحية من MEXC API
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

  /// يجلب بيانات السوق الحقيقية من MEXC ويحوّلها إلى EventContract
  Future<List<EventContract>> _fetchRealMarketData() async {
    final tickers = await _api.getAllTickers24hr();
    if (tickers.isEmpty) {
      throw Exception('لم يتم استلام بيانات السوق من MEXC. تحقق من الاتصال بالإنترنت.');
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
        final price = double.tryParse(ticker['lastPrice']?.toString() ?? '0') ?? 0.0;
        final change = double.tryParse(ticker['priceChangePercent']?.toString() ?? '0') ?? 0.0;
        final volume = double.tryParse(ticker['volume']?.toString() ?? '0') ?? 0.0;
        final high = double.tryParse(ticker['highPrice']?.toString() ?? '0') ?? 0.0;

        contracts.add(EventContract(
          symbol: symbol,
          name: pair['name']!,
          category: pair['category']!,
          strikePrice: high,
          currentPrice: price,
          priceChangePercent: change,
          volume24h: volume,
          expiryDate: DateTime.now().add(const Duration(days: 1)),
          isActive: true,
          side: change >= 0 ? 'UP' : 'DOWN',
        ));
      }
    }

    if (contracts.isEmpty) {
      throw Exception('لم يتم العثور على بيانات للأزواج المحددة. قد تكون MEXC API غير متاحة.');
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
}
