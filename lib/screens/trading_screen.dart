import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/event_contract.dart';
import '../providers/trading_provider.dart';

class TradingScreen extends StatefulWidget {
  final EventContract? contract;
  const TradingScreen({super.key, this.contract});

  @override
  State<TradingScreen> createState() => _TradingScreenState();
}

class _TradingScreenState extends State<TradingScreen> {
  final _amountCtrl = TextEditingController(text: '10');

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TradingProvider>();
    final contract = widget.contract;

    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          contract?.name ?? 'تداول',
          style: const TextStyle(fontFamily: 'Cairo'),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (contract != null) ...[
              _buildInfoCard(contract),
              const SizedBox(height: 20),
            ],
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white, fontSize: 18),
              decoration: InputDecoration(
                labelText: 'المبلغ (USDT)',
                labelStyle: const TextStyle(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: const Color(0xFF1A1D2D),
                suffixText: 'USDT',
                suffixStyle: const TextStyle(color: Colors.grey),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF3B30),
                      minimumSize: const Size.fromHeight(56),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _placeOrder('SELL'),
                    icon: const Icon(Icons.arrow_downward),
                    label: const Text('هابط', style: TextStyle(fontSize: 18, fontFamily: 'Cairo')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00C087),
                      minimumSize: const Size.fromHeight(56),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _placeOrder('BUY'),
                    icon: const Icon(Icons.arrow_upward),
                    label: const Text('صاعد', style: TextStyle(fontSize: 18, fontFamily: 'Cairo')),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            if (provider.lastSignal != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: provider.lastSignal == 'BUY'
                      ? const Color(0xFF00C087).withOpacity(0.1)
                      : provider.lastSignal == 'SELL'
                          ? const Color(0xFFFF3B30).withOpacity(0.1)
                          : const Color(0xFF2D5AF5).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'إشارة البوت: ${provider.lastSignal}',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: provider.lastSignal == 'BUY'
                        ? const Color(0xFF00C087)
                        : provider.lastSignal == 'SELL'
                            ? const Color(0xFFFF3B30)
                            : Colors.white,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(EventContract c) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1D2D),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _infoItem('السعر الحالي', '\$${c.currentPrice.toStringAsFixed(2)}'),
              _infoItem('الحجم 24h', '${(c.volume24h / 1000).toStringAsFixed(1)}K'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _infoItem('الإضراب', '\$${c.strikePrice.toStringAsFixed(0)}'),
              _infoItem('الانتهاء', '${c.expiryDate.day}/${c.expiryDate.month}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12, fontFamily: 'Cairo')),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }

  void _placeOrder(String side) {
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    if (amount <= 0 || widget.contract == null) return;
    context.read<TradingProvider>().placeTrade(
      symbol: widget.contract!.symbol,
      side: side,
      amount: amount,
      price: widget.contract!.currentPrice,
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('تم إرسال أمر $side', style: const TextStyle(fontFamily: 'Cairo'))),
    );
  }
}
