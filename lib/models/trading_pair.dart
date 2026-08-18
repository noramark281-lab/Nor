/// Trading pair model for market list
class TradingPair {
  final String symbol;
  final String base;
  final String quote;
  final double lastPrice;
  final double priceChangePercent;
  final double volume24h;
  final String category;

  TradingPair({
    required this.symbol,
    required this.base,
    required this.quote,
    required this.lastPrice,
    required this.priceChangePercent,
    required this.volume24h,
    this.category = 'Futures',
  });

  factory TradingPair.fromMap(Map<String, dynamic> m) {
    return TradingPair(
      symbol: m['symbol']?.toString() ?? '',
      base: m['base']?.toString() ?? '',
      quote: m['quote']?.toString() ?? 'USDT',
      lastPrice: (m['lastPrice'] as num?)?.toDouble() ?? 0.0,
      priceChangePercent: (m['priceChangePercent'] as num?)?.toDouble() ?? 0.0,
      volume24h: (m['volume24h'] as num?)?.toDouble() ?? 0.0,
      category: m['category']?.toString() ?? 'Futures',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'symbol': symbol,
      'base': base,
      'quote': quote,
      'lastPrice': lastPrice,
      'priceChangePercent': priceChangePercent,
      'volume24h': volume24h,
      'category': category,
    };
  }
}
