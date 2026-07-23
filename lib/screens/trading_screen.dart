import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';
import '../utils/constants.dart';
import 'api_setup_screen.dart';

class TradingScreen extends StatefulWidget {
  const TradingScreen({super.key});

  @override
  State<TradingScreen> createState() => _TradingScreenState();
}

class _TradingScreenState extends State<TradingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TradingProvider>().initTrading();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<TradingProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                DropdownButton<String>(
                  value: provider.selectedSymbol,
                  underline: const SizedBox(),
                  dropdownColor: Theme.of(context).colorScheme.surface,
                  items: Constants.symbols.map((s) => DropdownMenuItem(
                    value: s,
                    child: Text(s, style: const TextStyle(fontWeight: FontWeight.bold)),
                  )).toList(),
                  onChanged: (v) => provider.selectSymbol(v!),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ApiSetupScreen()),
                ),
              ),
            ],
          ),
          body: Column(
            children: [
              _buildPriceHeader(provider),
              _buildChartArea(provider),
              _buildTimeframes(provider),
              _buildDurationSelector(provider),
              _buildAmountInput(provider),
              const Spacer(),
              _buildTradeButtons(provider),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPriceHeader(TradingProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('السعر اللحظي', style: TextStyle(fontSize: 12, color: Colors.grey)),
              Text(
                '\$${provider.currentPrice.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF00C087)),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('الرصيد المتاح', style: TextStyle(fontSize: 12, color: Colors.grey)),
              Text(
                '\$${provider.balance.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartArea(TradingProvider provider) {
    return Expanded(
      flex: 3,
      child: Container(
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.black87,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: provider.klines.isEmpty
              ? const CircularProgressIndicator()
              : CustomPaint(
                  size: Size(MediaQuery.of(context).size.width - 32, 200),
                  painter: CandlestickPainter(provider.klines),
                ),
        ),
      ),
    );
  }

  Widget _buildTimeframes(TradingProvider provider) {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        reverse: true,
        itemCount: Constants.timeframes.length,
        itemBuilder: (context, index) {
          final tf = Constants.timeframes[index];
          final isSelected = provider.selectedTimeframe == tf;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: ChoiceChip(
              label: Text(tf),
              selected: isSelected,
              onSelected: (_) => provider.selectTimeframe(tf),
              selectedColor: const Color(0xFF00C087),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDurationSelector(TradingProvider provider) {
    final durations = [1, 5, 10, 30, 60];
    final labels = ['1د', '5د', '10د', '30د', '1س'];
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(durations.length, (index) {
          final isSelected = provider.selectedDuration == durations[index];
          return ChoiceChip(
            label: Text(labels[index]),
            selected: isSelected,
            onSelected: (_) => provider.selectDuration(durations[index]),
            selectedColor: const Color(0xFF00C087),
          );
        }),
      ),
    );
  }

  Widget _buildAmountInput(TradingProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.remove_circle_outline),
            onPressed: () {
              if (provider.tradeAmount > 1) {
                provider.setTradeAmount(provider.tradeAmount - 5);
              }
            },
          ),
          Expanded(
            child: TextField(
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: '${provider.tradeAmount.toStringAsFixed(0)} USDT',
                border: const OutlineInputBorder(),
              ),
              onChanged: (v) {
                final val = double.tryParse(v);
                if (val != null && val >= 1 && val <= 500) {
                  provider.setTradeAmount(val);
                }
              },
            ),
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () {
              if (provider.tradeAmount < 500) {
                provider.setTradeAmount(provider.tradeAmount + 5);
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTradeButtons(TradingProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: provider.isLoading ? null : () => provider.placeOrder('DOWN'),
              icon: const Icon(Icons.arrow_downward),
              label: const Text('بيع (DOWN)', style: TextStyle(fontSize: 18)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: provider.isLoading ? null : () => provider.placeOrder('UP'),
              icon: const Icon(Icons.arrow_upward),
              label: const Text('شراء (UP)', style: TextStyle(fontSize: 18)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CandlestickPainter extends CustomPainter {
  final List<Map<String, dynamic>> klines;
  CandlestickPainter(this.klines);

  @override
  void paint(Canvas canvas, Size size) {
    if (klines.isEmpty) return;
    final paint = Paint()..strokeWidth = 1;
    final candleWidth = size.width / klines.length * 0.7;
    final spacing = size.width / klines.length;

    double minPrice = double.infinity;
    double maxPrice = 0;
    for (var k in klines) {
      if (k['low'] < minPrice) minPrice = k['low'];
      if (k['high'] > maxPrice) maxPrice = k['high'];
    }
    final priceRange = maxPrice - minPrice;

    for (int i = 0; i < klines.length; i++) {
      final k = klines[i];
      final x = i * spacing + spacing / 2;
      final openY = size.height - ((k['open'] - minPrice) / priceRange * size.height);
      final closeY = size.height - ((k['close'] - minPrice) / priceRange * size.height);
      final highY = size.height - ((k['high'] - minPrice) / priceRange * size.height);
      final lowY = size.height - ((k['low'] - minPrice) / priceRange * size.height);

      final isGreen = k['close'] >= k['open'];
      paint.color = isGreen ? Colors.green : Colors.red;

      canvas.drawLine(Offset(x, highY), Offset(x, lowY), paint);
      canvas.drawRect(
        Rect.fromLTRB(x - candleWidth / 2, openY, x + candleWidth / 2, closeY),
        paint..style = PaintingStyle.fill,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
