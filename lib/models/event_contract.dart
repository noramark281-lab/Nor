class EventContract {
  final String symbol;
  final String name;
  final String category;
  final double strikePrice;
  final double currentPrice;
  final double priceChangePercent;
  final double volume24h;
  final double? highPrice;
  final double? lowPrice;
  final DateTime expiryDate;
  final bool isActive;
  final String side; // UP / DOWN

  EventContract({
    required this.symbol,
    required this.name,
    required this.category,
    required this.strikePrice,
    required this.currentPrice,
    required this.priceChangePercent,
    required this.volume24h,
    this.highPrice,
    this.lowPrice,
    required this.expiryDate,
    this.isActive = true,
    this.side = 'UP',
  });

  factory EventContract.fromJson(Map<String, dynamic> json) {
    return EventContract(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? 'Event',
      strikePrice:
          double.tryParse(json['strikePrice']?.toString() ?? '0') ?? 0.0,
      currentPrice:
          double.tryParse(json['currentPrice']?.toString() ?? '0') ?? 0.0,
      priceChangePercent:
          double.tryParse(json['priceChangePercent']?.toString() ?? '0') ?? 0.0,
      volume24h: double.tryParse(json['volume24h']?.toString() ?? '0') ?? 0.0,
      highPrice: double.tryParse(json['highPrice']?.toString() ?? ''),
      lowPrice: double.tryParse(json['lowPrice']?.toString() ?? ''),
      expiryDate:
          DateTime.tryParse(json['expiryDate'] ?? '') ??
          DateTime.now().add(const Duration(days: 1)),
      isActive: json['isActive'] ?? true,
      side: json['side'] ?? 'UP',
    );
  }

  Map<String, dynamic> toJson() => {
    'symbol': symbol,
    'name': name,
    'category': category,
    'strikePrice': strikePrice,
    'currentPrice': currentPrice,
    'priceChangePercent': priceChangePercent,
    'volume24h': volume24h,
    'highPrice': highPrice,
    'lowPrice': lowPrice,
    'expiryDate': expiryDate.toIso8601String(),
    'isActive': isActive,
    'side': side,
  };
}
