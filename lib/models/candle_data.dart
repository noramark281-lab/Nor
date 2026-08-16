class CandleData {
  final DateTime openTime;
  final DateTime closeTime;
  final double open;
  final double high;
  final double low;
  final double close;
  final double volume;
  final double quoteVolume;

  const CandleData({
    required this.openTime,
    required this.closeTime,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
    required this.quoteVolume,
  });

  bool get isBullish => close >= open;
  double get bodyTop => open > close ? open : close;
  double get bodyBottom => open < close ? open : close;

  factory CandleData.fromMexc(List<dynamic> row) {
    if (row.length < 8) {
      throw const FormatException('Invalid MEXC kline row');
    }

    double number(dynamic value) => double.tryParse(value.toString()) ?? 0.0;
    int millis(dynamic value) => value is num
        ? value.toInt()
        : int.tryParse(value.toString()) ?? 0;

    return CandleData(
      openTime: DateTime.fromMillisecondsSinceEpoch(millis(row[0]), isUtc: true),
      open: number(row[1]),
      high: number(row[2]),
      low: number(row[3]),
      close: number(row[4]),
      volume: number(row[5]),
      closeTime: DateTime.fromMillisecondsSinceEpoch(millis(row[6]), isUtc: true),
      quoteVolume: number(row[7]),
    );
  }
}
