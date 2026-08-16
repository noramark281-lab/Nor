import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/candle_data.dart';
import '../services/mexc_api_service.dart';
import '../services/mexc_klines_extension.dart';

/// Interval presets supported by the documented MEXC Spot V3 API.
class ChartInterval {
  final String label;
  final String apiValue;
  const ChartInterval(this.label, this.apiValue);
}

const List<ChartInterval> kIntervals = [
  ChartInterval('1m', '1m'),
  ChartInterval('5m', '5m'),
  ChartInterval('15m', '15m'),
  ChartInterval('1h', '60m'),
  ChartInterval('4h', '4h'),
  ChartInterval('1d', '1d'),
];

class PriceChart extends StatefulWidget {
  final String symbol; // e.g. "BTC_USDT"
  const PriceChart({super.key, required this.symbol});

  @override
  State<PriceChart> createState() => _PriceChartState();
}

class _PriceChartState extends State<PriceChart> {
  List<CandleData> _candles = [];
  bool _loading = true;
  String _error = '';
  ChartInterval _interval = kIntervals[0];
  int _tapIndex = -1;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void didUpdateWidget(covariant PriceChart old) {
    super.didUpdateWidget(old);
    if (old.symbol != widget.symbol) _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final data = await MexcApiService().getKlines(
        widget.symbol,
        interval: _interval.apiValue,
        limit: 120,
      );
      if (!mounted) return;
      setState(() {
        _candles = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFF0F1320);
    const card = Color(0xFF1A1D2D);
    const accent = Color(0xFF2D5AF5);
    const bullish = Color(0xFF00B87A);
    const bearish = Color(0xFFFF4D4D);
    const textColor = Color(0xFF9DA3B4);

    return Container(
      color: bg,
      child: Column(
        children: [
          Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: kIntervals.length,
              itemBuilder: (context, i) {
                final selected = _interval == kIntervals[i];
                return GestureDetector(
                  onTap: () {
                    setState(() => _interval = kIntervals[i]);
                    _loadData();
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: selected ? accent : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      kIntervals[i].label,
                      style: TextStyle(
                        color: selected ? Colors.white : textColor,
                        fontSize: 12,
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_candles.isNotEmpty) _buildPriceInfo(_candles.last, bullish, bearish),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: accent))
                : _error.isNotEmpty
                    ? _buildError(_error)
                    : _candles.isEmpty
                        ? _buildError('No data available')
                        : _buildChart(context, card, bullish, bearish, textColor, accent),
          ),
          if (_candles.isNotEmpty)
            SizedBox(
              height: 60,
              child: _buildVolumeChart(bullish, bearish, textColor),
            ),
        ],
      ),
    );
  }

  Widget _buildPriceInfo(CandleData last, Color bullish, Color bearish) {
    final color = last.isBullish ? bullish : bearish;
    final change = last.close - last.open;
    final changePct = last.open != 0 ? (change / last.open) * 100 : 0.0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          const Text('O', style: TextStyle(color: Colors.white54, fontSize: 11)),
          const SizedBox(width: 4),
          Text(last.open.toStringAsFixed(2), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 14),
          const Text('H', style: TextStyle(color: Colors.white54, fontSize: 11)),
          const SizedBox(width: 4),
          Text(last.high.toStringAsFixed(2), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 14),
          const Text('L', style: TextStyle(color: Colors.white54, fontSize: 11)),
          const SizedBox(width: 4),
          Text(last.low.toStringAsFixed(2), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 14),
          const Text('C', style: TextStyle(color: Colors.white54, fontSize: 11)),
          const SizedBox(width: 4),
          Text(last.close.toStringAsFixed(2), style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(width: 14),
          Text(
            '${change >= 0 ? '+' : ''}${change.toStringAsFixed(2)} (${changePct.toStringAsFixed(2)}%)',
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  Widget _buildChart(BuildContext context, Color card, Color bullish, Color bearish, Color textColor, Color accent) {
    final minPrice = _candles.map((c) => c.low).reduce((a, b) => a < b ? a : b);
    final maxPrice = _candles.map((c) => c.high).reduce((a, b) => a > b ? a : b);
    final range = maxPrice - minPrice;
    final padding = range == 0 ? maxPrice * 0.01 : range * 0.05;
    final minY = minPrice - padding;
    final maxY = maxPrice + padding;

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth / (_candles.length * 1.4)).clamp(1.5, 8.0).toDouble();
        return BarChart(
          BarChartData(
            alignment: BarChartAlignment.center,
            maxY: maxY,
            minY: minY,
            gridData: FlGridData(
              show: true,
              drawVerticalLine: true,
              horizontalInterval: (maxY - minY) / 5,
              verticalInterval: (_candles.length / 6).ceilToDouble(),
              getDrawingHorizontalLine: (value) => const FlLine(color: Color(0xFF2A2D3E), strokeWidth: 0.5),
              getDrawingVerticalLine: (value) => const FlLine(color: Color(0xFF2A2D3E), strokeWidth: 0.5),
            ),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 60,
                  getTitlesWidget: (value, meta) {
                    if (value == meta.min || value == meta.max) return const SizedBox.shrink();
                    final diff = maxY - minY;
                    final step = diff / 5;
                    if (step <= 0) return const SizedBox.shrink();
                    final idx = ((value - minY) / step).round();
                    if (idx >= 0 && idx <= 5) {
                      return Text(
                        value.toStringAsFixed(2),
                        style: TextStyle(color: textColor, fontSize: 10),
                        textDirection: TextDirection.ltr,
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            barTouchData: BarTouchData(
              enabled: true,
              touchTooltipData: BarTouchTooltipData(
                getTooltipColor: (touchedSpot) => const Color(0xFF2A2D3E),
                getTooltipItem: (group, groupIndex, rod, rodIndex) {
                  final c = _candles[groupIndex];
                  return BarTooltipItem(
                    'O: ${c.open.toStringAsFixed(2)}\nH: ${c.high.toStringAsFixed(2)}\nL: ${c.low.toStringAsFixed(2)}\nC: ${c.close.toStringAsFixed(2)}',
                    const TextStyle(color: Colors.white, fontSize: 11),
                  );
                },
              ),
              touchCallback: (FlTouchEvent event, barTouchResponse) {
                if (event is FlTapUpEvent && barTouchResponse?.spot != null) {
                  setState(() => _tapIndex = barTouchResponse!.spot!.touchedBarGroupIndex);
                }
              },
            ),
            barGroups: _candles.asMap().entries.map((entry) {
              final i = entry.key;
              final c = entry.value;
              final color = c.isBullish ? bullish : bearish;
              final isTapped = i == _tapIndex;
              return BarChartGroupData(
                x: i,
                barRods: [
                  BarChartRodData(
                    fromY: c.low,
                    toY: c.high,
                    color: color.withOpacity(0.7),
                    width: 1,
                    borderRadius: BorderRadius.zero,
                  ),
                  BarChartRodData(
                    fromY: c.bodyBottom,
                    toY: c.bodyTop,
                    color: isTapped ? color.withOpacity(0.9) : color.withOpacity(0.85),
                    width: width,
                    borderRadius: BorderRadius.circular(1),
                    backDrawRodData: BackgroundBarChartRodData(
                      show: true,
                      fromY: c.bodyBottom,
                      toY: c.bodyTop,
                      color: color.withOpacity(0.2),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        );
      },
    );
  }

  Widget _buildVolumeChart(Color bullish, Color bearish, Color textColor) {
    final maxVol = _candles.map((c) => c.volume).reduce((a, b) => a > b ? a : b);
    final chartMax = maxVol > 0 ? maxVol * 1.2 : 1.0;
    return Padding(
      padding: const EdgeInsets.only(left: 60, right: 8, bottom: 4),
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.center,
          maxY: chartMax,
          minY: 0,
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          barTouchData: BarTouchData(enabled: false),
          barGroups: _candles.asMap().entries.map((entry) {
            final i = entry.key;
            final c = entry.value;
            final color = c.isBullish ? bullish : bearish;
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  fromY: 0,
                  toY: c.volume,
                  color: color.withOpacity(0.5),
                  width: 2,
                  borderRadius: BorderRadius.zero,
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildError(String msg) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFFF4D4D), size: 40),
          const SizedBox(height: 8),
          const Text('خطأ في تحميل الرسم البياني', style: TextStyle(color: Color(0xFFFF4D4D))),
          const SizedBox(height: 4),
          TextButton(
            onPressed: _loadData,
            child: const Text('إعادة المحاولة', style: TextStyle(color: Color(0xFF2D5AF5))),
          ),
        ],
      ),
    );
  }
}
