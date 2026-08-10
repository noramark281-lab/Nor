class TradeRecord {
  final String id;
  final String symbol;
  final String side;
  final double amount;
  final double entryPrice;
  final DateTime enteredAt;
  final String status;
  final DateTime? closedAt;
  final double? profit;

  const TradeRecord({
    required this.id,
    required this.symbol,
    required this.side,
    required this.amount,
    required this.entryPrice,
    required this.enteredAt,
    this.status = 'open',
    this.closedAt,
    this.profit,
  });

  double get price => entryPrice;
  double get quantity => entryPrice > 0 ? amount / entryPrice : 0;

  TradeRecord copyWith({
    String? id,
    String? symbol,
    String? side,
    double? amount,
    double? entryPrice,
    DateTime? enteredAt,
    String? status,
    DateTime? closedAt,
    double? profit,
  }) {
    return TradeRecord(
      id: id ?? this.id,
      symbol: symbol ?? this.symbol,
      side: side ?? this.side,
      amount: amount ?? this.amount,
      entryPrice: entryPrice ?? this.entryPrice,
      enteredAt: enteredAt ?? this.enteredAt,
      status: status ?? this.status,
      closedAt: closedAt ?? this.closedAt,
      profit: profit ?? this.profit,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'symbol': symbol,
      'side': side,
      'amount': amount,
      'entryPrice': entryPrice,
      'enteredAt': enteredAt.toIso8601String(),
      'status': status,
      'closedAt': closedAt?.toIso8601String(),
      'profit': profit,
    };
  }

  factory TradeRecord.fromJson(Map<String, dynamic> json) {
    return TradeRecord(
      id: json['id']?.toString() ?? '',
      symbol: json['symbol']?.toString() ?? '',
      side: json['side']?.toString() ?? 'BUY',
      amount: (json['amount'] ?? 0).toDouble(),
      entryPrice: (json['entryPrice'] ?? 0).toDouble(),
      enteredAt: json['enteredAt'] != null
          ? DateTime.parse(json['enteredAt'].toString())
          : DateTime.now(),
      status: json['status']?.toString() ?? 'open',
      closedAt: json['closedAt'] != null
          ? DateTime.parse(json['closedAt'].toString())
          : null,
      profit:
          json['profit'] != null ? (json['profit'] as num).toDouble() : null,
    );
  }
}
