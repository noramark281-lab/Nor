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
      _error = e.toString();
      // Fallback: إذا فشلت الـ API، نعرض الأزواج المعروفة مع بيانات افتراضية
      _contracts = MexcApiService.eventPairs.map((p) => EventContract(
        symbol: p['symbol']!,
        name: p['name']!,
        category: p['category']!,
        strikePrice: 0,
        currentPrice: 0,
        priceChangePercent: 0,
        volume24h: 0,
        expiryDate: DateTime.now().add(const Duration(days: 1)),
        isActive: true,
        side: 'UP',
      )).toList();
    }

    _loading = false;
    notifyListeners();
  }

  /// يجلب بيانات السوق الحقيقية من MEXC ويحوّلها إلى EventContract
  Future<List<EventContract>> _fetchRealMarketData() async {
    final tickers = await _api.getAllTickers24hr();
    const pairs = MexcApiService.eventPairs;
    final contracts = <EventContract>[];

    for (final pair in pairs) {
      final symbol = pair['symbol']!;
      final ticker = tickers.firstWhere(
        (t) => t['symbol'] == symbol,
        orElse: () => {},
      );

      if (ticker.isNotEmpty) {
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
      } else {
        // إذا لم يُعثر على بيانات السوق، نستخدم بيانات افتراضية
        contracts.add(EventContract(
          symbol: symbol,
          name: pair['name']!,
          category: pair['category']!,
          strikePrice: 0,
          currentPrice: 0,
          priceChangePercent: 0,
          volume24h: 0,
          expiryDate: DateTime.now().add(const Duration(days: 1)),
          isActive: true,
          side: 'UP',
        ));
      }
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
