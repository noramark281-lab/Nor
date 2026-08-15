class EventContract {
  final String id;
  final String symbol;
  final String side; // UP (أعلى) or DOWN (أدنى)
  final double amount;
  final int durationMinutes;
  final double payoutPercent;
  final double strikePrice;
  final DateTime entryTime;
  final DateTime expiryTime;
  String status; // OPEN, WON, LOST
  double? closePrice;
  double profit;

  EventContract({
    required this.id,
    required this.symbol,
    required this.side,
    required this.amount,
    required this.durationMinutes,
    this.payoutPercent = 80.0,
    required this.strikePrice,
    required this.entryTime,
    required this.expiryTime,
    this.status = 'OPEN',
    this.closePrice,
    this.profit = 0.0,
  });

  int get remainingSeconds {
    final diff = expiryTime.difference(DateTime.now()).inSeconds;
    return diff > 0 ? diff : 0;
  }

  bool get isExpired => DateTime.now().isAfter(expiryTime);

  double get potentialPayout => amount + (amount * payoutPercent / 100);

  Map<String, dynamic> toJson() => {
    'id': id,
    'symbol': symbol,
    'side': side,
    'amount': amount,
    'durationMinutes': durationMinutes,
    'payoutPercent': payoutPercent,
    'strikePrice': strikePrice,
    'entryTime': entryTime.toIso8601String(),
    'expiryTime': expiryTime.toIso8601String(),
    'status': status,
    'closePrice': closePrice,
    'profit': profit,
  };

  factory EventContract.fromJson(Map<String, dynamic> json) => EventContract(
    id: json['id'] ?? 'ec_${DateTime.now().millisecondsSinceEpoch}',
    symbol: json['symbol'] ?? 'BTCUSDT',
    side: json['side'] ?? 'UP',
    amount: (json['amount'] as num).toDouble(),
    durationMinutes: (json['durationMinutes'] as num).toInt(),
    payoutPercent: (json['payoutPercent'] as num?)?.toDouble() ?? 80.0,
    strikePrice: (json['strikePrice'] as num?)?.toDouble() ?? 0.0,
    entryTime: json['entryTime'] != null ? DateTime.parse(json['entryTime']) : DateTime.now(),
    expiryTime: DateTime.parse(json['expiryTime']),
    status: json['status'] ?? 'OPEN',
    closePrice: (json['closePrice'] as num?)?.toDouble(),
    profit: (json['profit'] as num?)?.toDouble() ?? 0.0,
  );
}
