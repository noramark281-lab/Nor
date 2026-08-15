import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';
import '../models/event_contract.dart';
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
        if (provider.lastError != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(provider.lastError!),
                backgroundColor: Colors.red.shade700,
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
          backgroundColor: const Color(0xFF0B0E11),
          appBar: AppBar(
            backgroundColor: const Color(0xFF161A1E),
            elevation: 0,
            title: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.timer_outlined, color: Color(0xFF00C087), size: 20),
                SizedBox(width: 8),
                Text(
                  'العقود الآجلة للأحداث - BTC/USDT',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh, color: Colors.white70),
                tooltip: 'تحديث الرصيد والأسعار',
                onPressed: () => provider.fetchBalance(),
              ),
              IconButton(
                icon: Icon(
                  Icons.vpn_key_outlined,
                  color: provider.apiInitialized ? const Color(0xFF00C087) : Colors.orange,
                ),
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
              SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    _buildTopHeader(provider),
                    _buildDurationSelector(provider),
                    _buildChartArea(provider),
                    _buildChartIntervals(provider),
                    _buildBalanceAndPayoutCard(provider),
                    _buildAmountControls(provider),
                    _buildTradeButtons(provider),
                    if (provider.activeContracts.isNotEmpty) _buildActiveContractsList(provider),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
              if (provider.isLoading)
                Container(
                  color: Colors.black.withOpacity(0.6),
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

  Widget _buildTopHeader(TradingProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF161A1E),
        border: Border(bottom: BorderSide(color: Color(0xFF2B3139), width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF7931A).withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.currency_bitcoin, color: Color(0xFFF7931A), size: 22),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'BTC/USDT',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  Text(
                    'سعر المؤشر المباشر',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                  ),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                provider.currentPrice > 0 ? '\${provider.currentPrice.toStringAsFixed(2)}' : 'جاري التحميل...',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00C087),
                  fontFamily: 'monospace',
                ),
              ),
              const Row(
                children: [
                  Icon(Icons.sensors, size: 12, color: Color(0xFF00C087)),
                  SizedBox(width: 4),
                  Text('MEXC Live', style: TextStyle(fontSize: 10, color: Color(0xFF00C087))),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDurationSelector(TradingProvider provider) {
    final durations = [
      {'label': '10 دقائق', 'minutes': 10},
      {'label': '30 دقيقة', 'minutes': 30},
      {'label': '1 ساعة', 'minutes': 60},
      {'label': '1 يوم', 'minutes': 1440},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: const Color(0xFF161A1E),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: durations.map((d) {
          final isSelected = provider.selectedDurationMinutes == d['minutes'];
          return Expanded(
            child: GestureDetector(
              onTap: () => provider.selectDuration(d['minutes'] as int),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF00C087) : const Color(0xFF2B3139),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  d['label'] as String,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.black : Colors.white70,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildChartArea(TradingProvider provider) {
    return Container(
      height: 220,
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF161A1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2B3139)),
      ),
      child: provider.klines.isEmpty
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00C087)),
              ),
            )
          : CustomPaint(
              size: const Size(double.infinity, 220),
              painter: CandlestickPainter(provider.klines),
            ),
    );
  }

  Widget _buildChartIntervals(TradingProvider provider) {
    final intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: intervals.map((tf) {
          final isSel = provider.selectedTimeframe == tf;
          return GestureDetector(
            onTap: () => provider.selectTimeframe(tf),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              margin: const EdgeInsets.only(left: 6),
              decoration: BoxDecoration(
                color: isSel ? const Color(0xFF00C087).withOpacity(0.2) : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: isSel ? const Color(0xFF00C087) : const Color(0xFF2B3139)),
              ),
              child: Text(
                tf,
                style: TextStyle(
                  fontSize: 11,
                  color: isSel ? const Color(0xFF00C087) : Colors.grey,
                  fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildBalanceAndPayoutCard(TradingProvider provider) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF161A1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2B3139)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.account_balance_wallet, color: Color(0xFF00C087), size: 18),
                  const SizedBox(width: 6),
                  Text(
                    '${provider.balance.toStringAsFixed(4)} USDT المتاح',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Text(
                provider.apiInitialized ? 'حساب MEXC متصل' : 'يرجى ربط API',
                style: TextStyle(
                  fontSize: 11,
                  color: provider.apiInitialized ? const Color(0xFF00C087) : Colors.orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Divider(color: Color(0xFF2B3139), height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildPayoutPill('دفع أعلى 80%', const Color(0xFF00C087)),
              _buildPayoutPill('دفع أقل 80%', const Color(0xFFFF4D4F)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPayoutPill(String title, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        title,
        style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13),
      ),
    );
  }

  Widget _buildAmountControls(TradingProvider provider) {
    final quickAmounts = [1.0, 5.0, 10.0, 25.0, 50.0, 100.0, 250.0];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF161A1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2B3139)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '1-250 USDT',
                style: TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
              Text(
                'مبلغ العقد: \${provider.tradeAmount.toStringAsFixed(1)} USDT',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.remove_circle, color: Color(0xFFFF4D4F), size: 28),
                onPressed: () => provider.setTradeAmount(provider.tradeAmount - 1.0),
              ),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: quickAmounts.map((amt) {
                      final isSel = provider.tradeAmount == amt;
                      return GestureDetector(
                        onTap: () => provider.setTradeAmount(amt),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSel ? const Color(0xFF00C087) : const Color(0xFF2B3139),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '\${amt.toInt()}',
                            style: TextStyle(
                              color: isSel ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle, color: Color(0xFF00C087), size: 28),
                onPressed: () => provider.setTradeAmount(provider.tradeAmount + 1.0),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF0B0E11),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'العائد المتوقع: +${provider.potentialProfit.toStringAsFixed(2)} USDT',
                  style: const TextStyle(color: Color(0xFF00C087), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                Text(
                  'المجموع عند الربح: ${provider.potentialPayout.toStringAsFixed(2)} USDT',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTradeButtons(TradingProvider provider) {
    final canTrade = provider.apiInitialized && provider.balance >= provider.tradeAmount;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          // RED DOWN BUTTON
          Expanded(
            child: ElevatedButton(
              onPressed: canTrade && !provider.isLoading
                  ? () => _confirmAndOpenContract(context, provider, 'DOWN', const Color(0xFFFF4D4F))
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF4D4F),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 4,
                disabledBackgroundColor: const Color(0xFFFF4D4F).withOpacity(0.3),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.south_east, size: 20),
                      SizedBox(width: 6),
                      Text('أدنى ↘', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Text('دفع 80%', style: TextStyle(fontSize: 11, color: Colors.white70)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          // GREEN UP BUTTON
          Expanded(
            child: ElevatedButton(
              onPressed: canTrade && !provider.isLoading
                  ? () => _confirmAndOpenContract(context, provider, 'UP', const Color(0xFF00C087))
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C087),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 4,
                disabledBackgroundColor: const Color(0xFF00C087).withOpacity(0.3),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.north_east, size: 20),
                      SizedBox(width: 6),
                      Text('أعلى ↗', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Text('دفع 80%', style: TextStyle(fontSize: 11, color: Colors.black87)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveContractsList(TradingProvider provider) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF161A1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2B3139)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.hourglass_top, color: Color(0xFF00C087), size: 16),
              SizedBox(width: 6),
              Text(
                'العقود الآجلة النشطة (جاري التسوية اللحظية)',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...provider.activeContracts.map((contract) {
            final isUp = contract.side == 'UP';
            final remainingSec = contract.remainingSeconds;
            final min = remainingSec ~/ 60;
            final sec = remainingSec % 60;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF0B0E11),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isUp ? const Color(0xFF00C087).withOpacity(0.4) : const Color(0xFFFF4D4F).withOpacity(0.4)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(isUp ? Icons.arrow_upward : Icons.arrow_downward, color: isUp ? const Color(0xFF00C087) : const Color(0xFFFF4D4F), size: 16),
                          const SizedBox(width: 4),
                          Text(
                            '${isUp ? "أعلى ↗" : "أدنى ↘"} - \${contract.amount} USDT',
                            style: TextStyle(fontWeight: FontWeight.bold, color: isUp ? const Color(0xFF00C087) : const Color(0xFFFF4D4F)),
                          ),
                        ],
                      ),
                      Text(
                        'سعر الدخول: \${contract.strikePrice.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${min.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')}',
                        style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                      ),
                      const Text(
                        'متبقي على التسوية',
                        style: TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  void _confirmAndOpenContract(BuildContext context, TradingProvider provider, String side, Color color) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF161A1E),
        title: Row(
          children: [
            Icon(side == 'UP' ? Icons.north_east : Icons.south_east, color: color),
            const SizedBox(width: 8),
            Text(
              'تأكيد عقد حدث ${side == "UP" ? "أعلى ↗" : "أدنى ↘"}',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('الزوج: BTC/USDT', style: TextStyle(color: Colors.grey.shade300)),
            Text('المدة: ${provider.selectedDurationMinutes} دقيقة', style: TextStyle(color: Colors.grey.shade300)),
            Text('المبلغ: \${provider.tradeAmount.toStringAsFixed(2)} USDT', style: TextStyle(color: Colors.grey.shade300)),
            Text('نسبة الدفع: 80%', style: const TextStyle(color: Color(0xFF00C087), fontWeight: FontWeight.bold)),
            Text('العائد الإجمالي عند الربح: \${provider.potentialPayout.toStringAsFixed(2)} USDT', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF00C087)),
              ),
              child: const Text(
                'تداول حقيقي في العقود الآجلة للأحداث على MEXC. يتم تحويل الأرباح تلقائياً إلى محفظتك عند استحقاق الأجل.',
                style: TextStyle(fontSize: 11, color: Colors.white70),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              provider.openEventContract(side).then((success) {
                if (success && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('✅ تم فتح عقد ${side == "UP" ? "أعلى ↗" : "أدنى ↘"} بنجاح'),
                      backgroundColor: const Color(0xFF00C087),
                      duration: const Duration(seconds: 3),
                    ),
                  );
                }
              });
            },
            style: ElevatedButton.styleFrom(backgroundColor: color),
            child: Text(
              side == 'UP' ? 'تأكيد (أعلى)' : 'تأكيد (أدنى)',
              style: TextStyle(color: side == 'UP' ? Colors.black : Colors.white, fontWeight: FontWeight.bold),
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
    final paint = Paint()..strokeWidth = 1.2;
    final spacing = size.width / klines.length;
    final candleWidth = spacing * 0.7;

    double minPrice = double.infinity;
    double maxPrice = 0;
    for (var k in klines) {
      if (k['low'] < minPrice) minPrice = k['low'];
      if (k['high'] > maxPrice) maxPrice = k['high'];
    }
    final priceRange = maxPrice - minPrice;
    if (priceRange <= 0) return;

    for (int i = 0; i < klines.length; i++) {
      final k = klines[i];
      final x = i * spacing + spacing / 2;
      final openY = size.height - ((k['open'] - minPrice) / priceRange * (size.height - 20) + 10);
      final closeY = size.height - ((k['close'] - minPrice) / priceRange * (size.height - 20) + 10);
      final highY = size.height - ((k['high'] - minPrice) / priceRange * (size.height - 20) + 10);
      final lowY = size.height - ((k['low'] - minPrice) / priceRange * (size.height - 20) + 10);

      final isGreen = k['close'] >= k['open'];
      paint.color = isGreen ? const Color(0xFF00C087) : const Color(0xFFFF4D4F);

      // Wick
      paint.style = PaintingStyle.stroke;
      canvas.drawLine(Offset(x, highY), Offset(x, lowY), paint);

      // Body
      paint.style = PaintingStyle.fill;
      final top = openY < closeY ? openY : closeY;
      final bottom = openY < closeY ? closeY : openY;
      final h = (bottom - top).clamp(1.0, size.height);
      canvas.drawRect(
        Rect.fromLTWH(x - candleWidth / 2, top, candleWidth, h),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
