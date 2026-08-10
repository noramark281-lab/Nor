class TradeRecord {
  final String id;
  final String symbol;
  final String side;
  final double price;
  final double amount;
  final double pnl;
  final DateTime timestamp;

  TradeRecord({
    required this.id,
    required this.symbol,
    required this.side,
    required this.price,
    required this.amount,
    this.pnl = 0.0,
    required this.timestamp,
  });
}
