class EventContract {
  final String symbol;
  final String side; // UP or DOWN
  final double amount;
  final int durationMinutes;
  final double payoutPercent;
  final DateTime expiryTime;
  final String status; // OPEN, WON, LOST
  final double? closePrice;

  EventContract({
    required this.symbol,
    required this.side,
    required this.amount,
    required this.durationMinutes,
    this.payoutPercent = 80.0,
    required this.expiryTime,
    this.status = 'OPEN',
    this.closePrice,
  });

  Map<String, dynamic> toJson() => {
    'symbol': symbol,
    'side': side,
    'amount': amount,
    'durationMinutes': durationMinutes,
    'payoutPercent': payoutPercent,
    'expiryTime': expiryTime.toIso8601String(),
    'status': status,
    'closePrice': closePrice,
  };

  factory EventContract.fromJson(Map<String, dynamic> json) => EventContract(
    symbol: json['symbol'],
    side: json['side'],
    amount: json['amount'].toDouble(),
    durationMinutes: json['durationMinutes'],
    payoutPercent: json['payoutPercent'].toDouble(),
    expiryTime: DateTime.parse(json['expiryTime']),
    status: json['status'],
    closePrice: json['closePrice']?.toDouble(),
  );
}
