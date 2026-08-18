class EventContract {
  final String symbol;
  final String name;
  final String category;
  final double strikePrice;
  final double currentPrice;
  final double priceChangePercent;
  final double volume24h;
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
    required this.expiryDate,
    this.isActive = true,
    this.side = 'UP',
  });

  factory EventContract.fromJson(Map<String, dynamic> json) {
    return EventContract(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? 'Event',
      strikePrice: double.tryParse(json['strikePrice']?.toString() ?? '0') ?? 0.0,
      currentPrice: double.tryParse(json['currentPrice']?.toString() ?? '0') ?? 0.0,
      priceChangePercent: double.tryParse(json['priceChangePercent']?.toString() ?? '0') ?? 0.0,
      volume24h: double.tryParse(json['volume24h']?.toString() ?? '0') ?? 0.0,
      expiryDate: DateTime.tryParse(json['expiryDate'] ?? '') ?? DateTime.now().add(const Duration(days: 1)),
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
    'expiryDate': expiryDate.toIso8601String(),
    'isActive': isActive,
    'side': side,
  };
}

class TradeRecord {
  final String id;
  final String symbol;
  final String side;
  final double amount;
  final double entryPrice;
  final double? exitPrice;
  final DateTime entryTime;
  final DateTime? exitTime;
  final String status; // OPEN / CLOSED / CANCELLED
  final double? profit;
  final String strategy;

  TradeRecord({
    required this.id,
    required this.symbol,
    required this.side,
    required this.amount,
    required this.entryPrice,
    this.exitPrice,
    required this.entryTime,
    this.exitTime,
    this.status = 'OPEN',
    this.profit,
    this.strategy = 'Manual',
  });

  bool get isProfit => (profit ?? 0) > 0;
  bool get isOpen => status == 'OPEN';
}
