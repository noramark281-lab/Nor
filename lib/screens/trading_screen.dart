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
        // Show error snackbar
        if (provider.lastError != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(provider.lastError!),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 4),
                action: SnackBarAction(
                  label: 'إغلاق',
                  textColor: Colors.white,
                  onPressed: () => provider.clearError(),
                ),
              ),
            );
            provider.clearError();
          });
        }

        return Scaffold(
          appBar: AppBar(
            title: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildSymbolDropdown(provider),
              ],
            ),
            actions: [
              // API status indicator with tooltip
              Tooltip(
                message: provider.apiInitialized ? 'متصل بـ MEXC API' : 'غير متصل - تحقق من مفاتيح API',
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: provider.apiInitialized ? Colors.green : Colors.red,
                    boxShadow: [
                      BoxShadow(
                        color: (provider.apiInitialized ? Colors.green : Colors.red).withOpacity(0.5),
                        blurRadius: 6,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.settings),
                tooltip: 'إعدادات API',
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ApiSetupScreen()),
                ).then((_) => provider.refreshApiStatus()),
              ),
            ],
          ),
          body: Stack(
            children: [
              Column(
                children: [
                  _buildPriceHeader(provider),
                  _buildApiWarning(provider),
                  _buildChartArea(provider),
                  _buildTimeframes(provider),
                  _buildAmountInput(provider),
                  _buildFeeInfo(provider),
                  const Spacer(),
                  _buildTradeButtons(provider),
                  const SizedBox(height: 16),
                ],
              ),
              if (provider.isLoading)
                Container(
                  color: Colors.black.withOpacity(0.5),
                  child: const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00C087)),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFeeInfo(TradingProvider provider) {
    final fee = provider.getTradeFee(provider.tradeAmount);
    final total = provider.getTotalWithFee(provider.tradeAmount);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.info_outline, size: 14, color: Colors.grey[600]),
          const SizedBox(width: 4),
          Text(
            'رسوم المنصة: \$${fee.toStringAsFixed(4)} (0.1%) | المجموع: \$${total.toStringAsFixed(4)}',
            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildSymbolDropdown(TradingProvider provider) {
    return DropdownButton<String>(
      value: provider.selectedSymbol,
      underline: const SizedBox(),
      dropdownColor: Theme.of(context).colorScheme.surface,
      items: Constants.symbols.map((s) => DropdownMenuItem(
        value: s,
        child: Text(s, style: const TextStyle(fontWeight: FontWeight.bold)),
      )).toList(),
      onChanged: (v) => provider.selectSymbol(v!),
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
              const Text('رصيد USDT', style: TextStyle(fontSize: 12, color: Colors.grey)),
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

  Widget _buildApiWarning(TradingProvider provider) {
    if (provider.apiInitialized) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber, color: Colors.orange, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'لم يتم إعداد مفاتيح API. اضغط على الإعدادات لإدخال مفاتيح MEXC.',
              style: TextStyle(color: Colors.orange[800], fontSize: 12),
            ),
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

  /// Amount input with STRICT $1 cap enforcement
  Widget _buildAmountInput(TradingProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // $1 cap badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF00C087).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF00C087)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.security, color: Color(0xFF00C087), size: 14),
                    SizedBox(width: 4),
                    Text(
                      'حد أقصى: \$1 للصفقة',
                      style: TextStyle(color: Color(0xFF00C087), fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              Text(
                'المبلغ: \$${provider.tradeAmount.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.remove_circle_outline),
                onPressed: () {
                  final newAmount = provider.tradeAmount - 0.5;
                  if (newAmount >= Constants.minTradeAmount) {
                    provider.setTradeAmount(newAmount);
                  }
                },
              ),
              Expanded(
                child: Slider(
                  value: provider.tradeAmount,
                  min: Constants.minTradeAmount,
                  max: Constants.maxTradeAmount,
                  divisions: 10, // 0.1 steps up to 1.0
                  label: '\$${provider.tradeAmount.toStringAsFixed(2)}',
                  activeColor: const Color(0xFF00C087),
                  onChanged: (v) => provider.setTradeAmount(v),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle_outline),
                onPressed: () {
                  // Cannot exceed $1
                  provider.setTradeAmount(Constants.maxTradeAmount);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTradeButtons(TradingProvider provider) {
    final canTrade = provider.apiInitialized && provider.balance >= provider.tradeAmount;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: canTrade && !provider.isLoading
                  ? () => _showOrderConfirmation(context, provider, 'SELL', Colors.red)
                  : null,
              icon: const Icon(Icons.arrow_downward),
              label: const Text('بيع (SELL)', style: TextStyle(fontSize: 18)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                disabledBackgroundColor: Colors.red.withOpacity(0.3),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: canTrade && !provider.isLoading
                  ? () => _showOrderConfirmation(context, provider, 'BUY', Colors.green)
                  : null,
              icon: const Icon(Icons.arrow_upward),
              label: const Text('شراء (BUY)', style: TextStyle(fontSize: 18)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                disabledBackgroundColor: Colors.green.withOpacity(0.3),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showOrderConfirmation(BuildContext context, TradingProvider provider, String side, Color color) {
    final fee = provider.getTradeFee(provider.tradeAmount);
    final total = provider.getTotalWithFee(provider.tradeAmount);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning_amber, color: color),
            const SizedBox(width: 8),
            Text('تأكيد ${side == 'BUY' ? 'الشراء' : 'البيع'}'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('الزوج: ${provider.selectedSymbol}'),
            Text('النوع: ${side == 'BUY' ? 'شراء' : 'بيع'}'),
            Text('المبلغ: \$${provider.tradeAmount.toStringAsFixed(2)}'),
            Text('الرسوم: \$${fee.toStringAsFixed(4)}'),
            const Divider(),
            Text(
              'المجموع: \$${total.toStringAsFixed(4)}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange),
              ),
              child: const Text(
                'تنبيه: هذا أمر تداول حقيقي على منصة MEXC. يرجى التأكد قبل المتابعة.',
                style: TextStyle(fontSize: 12, color: Colors.orange),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              provider.placeOrder(side == 'BUY' ? 'UP' : 'DOWN').then((success) {
                if (success && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('✅ تم تنفيذ أمر ${side == 'BUY' ? 'الشراء' : 'البيع'} بنجاح'),
                      backgroundColor: Colors.green,
                      duration: const Duration(seconds: 3),
                    ),
                  );
                }
              });
            },
            style: ElevatedButton.styleFrom(backgroundColor: color),
            child: Text(side == 'BUY' ? 'شراء' : 'بيع'),
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
    if (priceRange == 0) return;

    for (int i = 0; i < klines.length; i++) {
      final k = klines[i];
      final x = i * spacing + spacing / 2;
      final openY = size.height - ((k['open'] - minPrice) / priceRange * size.height);
      final closeY = size.height - ((k['close'] - minPrice) / priceRange * size.height);
      final highY = size.height - ((k['high'] - minPrice) / priceRange * size.height);
      final lowY = size.height - ((k['low'] - minPrice) / priceRange * size.height);

      final isGreen = k['close'] >= k['open'];
      paint.color = isGreen ? Colors.green : Colors.red;
      paint.style = PaintingStyle.stroke;

      canvas.drawLine(Offset(x, highY), Offset(x, lowY), paint);
      paint.style = PaintingStyle.fill;
      canvas.drawRect(
        Rect.fromLTRB(x - candleWidth / 2, openY, x + candleWidth / 2, closeY),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
