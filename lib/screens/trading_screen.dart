import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/event_contract.dart';
import '../providers/trading_provider.dart';
import '../services/api_manager.dart';

class TradingScreen extends StatefulWidget {
  final EventContract? contract;
  const TradingScreen({super.key, this.contract});

  @override
  State<TradingScreen> createState() => _TradingScreenState();
}

class _TradingScreenState extends State<TradingScreen> {
  final _amountCtrl = TextEditingController(text: '10');
  bool _isLimit = false;
  final _limitPriceCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    // تحديث الرصيد عند فتح الشاشة
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TradingProvider>().syncBalance();
    });
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _limitPriceCtrl.dispose();
    super.dispose();
  }

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
        actions: [
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            tooltip: 'تحديث الرصيد',
            onPressed: () => provider.syncBalance(),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // بطاقة الرصيد
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2D5AF5), Color(0xFF1A3FA0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Text(
                    'الرصيد المتاح',
                    style: TextStyle(color: Colors.white70, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${provider.balance.toStringAsFixed(2)} USDT',
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                  ),
                  if (!MexcApiManager().isInitialized)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        '⚠️ لم يتم إعداد مفاتيح API',
                        style: TextStyle(color: Colors.orangeAccent, fontFamily: 'Cairo'),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

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
            const SizedBox(height: 12),

            // Limit order toggle
            Row(
              children: [
                Switch(
                  value: _isLimit,
                  onChanged: (v) => setState(() => _isLimit = v),
                  activeColor: const Color(0xFF2D5AF5),
                ),
                const Text(
                  'أمر محدد (Limit)',
                  style: TextStyle(color: Colors.white, fontFamily: 'Cairo'),
                ),
              ],
            ),

            if (_isLimit)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: TextField(
                  controller: _limitPriceCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontSize: 18),
                  decoration: InputDecoration(
                    labelText: 'سعر التنفيذ',
                    labelStyle: const TextStyle(color: Colors.grey),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFF1A1D2D),
                    suffixText: 'USDT',
                    suffixStyle: const TextStyle(color: Colors.grey),
                  ),
                ),
              ),

            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF3B30),
                      minimumSize: const Size.fromHeight(56),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: provider.loading || !MexcApiManager().isInitialized
                        ? null
                        : () => _placeOrder('SELL'),
                    icon: provider.loading
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.arrow_downward),
                    label: Text(
                      provider.loading ? 'جاري التنفيذ...' : 'هابط',
                      style: const TextStyle(fontSize: 18, fontFamily: 'Cairo'),
                    ),
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
                    onPressed: provider.loading || !MexcApiManager().isInitialized
                        ? null
                        : () => _placeOrder('BUY'),
                    icon: provider.loading
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.arrow_upward),
                    label: Text(
                      provider.loading ? 'جاري التنفيذ...' : 'صاعد',
                      style: const TextStyle(fontSize: 18, fontFamily: 'Cairo'),
                    ),
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

            // عرض الأخطاء
            if (provider.error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF3B30).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFF3B30)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFFF3B30)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        provider.error!,
                        style: const TextStyle(color: Color(0xFFFF3B30), fontFamily: 'Cairo'),
                        textAlign: TextAlign.right,
                      ),
                    ),
                  ],
                ),
              ),
            ],
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

  Future<void> _placeOrder(String side) async {
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    if (amount <= 0 || widget.contract == null) return;

    final limitPrice = _isLimit ? (double.tryParse(_limitPriceCtrl.text) ?? 0) : null;
    if (_isLimit && (limitPrice == null || limitPrice <= 0)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى إدخال سعر تنفيذ صحيح', style: TextStyle(fontFamily: 'Cairo'))),
      );
      return;
    }

    final success = await context.read<TradingProvider>().placeTrade(
      symbol: widget.contract!.symbol,
      side: side,
      amount: amount,
      price: widget.contract!.currentPrice,
      isLimit: _isLimit,
      limitPrice: limitPrice,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'تم إرسال أمر $side ${_isLimit ? "(Limit)" : "(Market)"} بنجاح',
            style: const TextStyle(fontFamily: 'Cairo'),
          ),
          backgroundColor: side == 'BUY' ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.read<TradingProvider>().error ?? 'فشل إرسال الأمر',
            style: const TextStyle(fontFamily: 'Cairo'),
          ),
          backgroundColor: const Color(0xFFFF3B30),
        ),
      );
    }
  }
}
