import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';
import '../models/event_contract.dart';

class TradingScreen extends StatefulWidget {
  final EventContract? contract;
  const TradingScreen({super.key, this.contract});

  @override
  State<TradingScreen> createState() => _TradingScreenState();
}

class _TradingScreenState extends State<TradingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLimit = false;
  final TextEditingController _amountCtrl = TextEditingController(text: '10');
  final TextEditingController _limitPriceCtrl = TextEditingController();

  String _side = 'BUY';
  String _selectedStrategy = 'Hybrid';
  String? _lastSignal;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _amountCtrl.dispose();
    _limitPriceCtrl.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    final limitPrice = _isLimit ? double.tryParse(_limitPriceCtrl.text) : null;
    if (amount <= 0) {
      _showSnack('أدخل مبلغ صالح');
      return;
    }
    if (_isLimit && (limitPrice == null || limitPrice <= 0)) {
      _showSnack('أدخل سعر محدد صالح');
      return;
    }

    final side = _side;
    final ok = await context.read<TradingProvider>().placeTrade(
      symbol: widget.contract!.symbol,
      side: side,
      amount: amount,
      price: widget.contract!.currentPrice,
      isLimit: _isLimit,
      limitPrice: limitPrice,
    );

    if (ok) {
      _showSnack('تم تنفيذ الأمر بنجاح');
      _amountCtrl.clear();
      _limitPriceCtrl.clear();
    } else {
      final error = context.read<TradingProvider>().error ?? 'فشل تنفيذ الأمر';
      _showSnack(error);
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontFamily: 'Cairo')),
        backgroundColor: msg.contains('نجاح') ? const Color(0xFF00C087) : Colors.red,
      ),
    );
  }

  void _analyzeMarket() async {
    final analysis = await context.read<TradingProvider>().analyzeReal(widget.contract!.symbol);
    if (analysis != null) {
      setState(() => _lastSignal = analysis['trend'] ?? 'محايد');
      _showSnack('إشارة: ${_lastSignal!} | RSI: ${analysis['rsi']?.toStringAsFixed(1)} | Momentum: ${analysis['momentum']?.toStringAsFixed(2)}%');
    } else {
      _showSnack('فشل تحليل السوق');
    }
  }

  @override
  Widget build(BuildContext context) {
    final trade = context.watch<TradingProvider>();
    final contract = widget.contract;

    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          contract?.name ?? 'تداول العقود',
          style: const TextStyle(fontFamily: 'Cairo'),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          if (contract != null) _buildPriceHeader(contract),
          TabBar(
            controller: _tabController,
            labelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
            unselectedLabelStyle: const TextStyle(fontFamily: 'Cairo'),
            tabs: const [
              Tab(text: 'التداول'),
              Tab(text: 'التحليل'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTradeTab(trade, contract),
                _buildAnalysisTab(trade),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceHeader(EventContract contract) {
    final isUp = contract.priceChangePercent >= 0;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1D2D),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '\$${contract.currentPrice.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                isUp ? Icons.trending_up : Icons.trending_down,
                color: isUp ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
              ),
            ],
          ),
          Text(
            '${isUp ? '+' : ''}${contract.priceChangePercent.toStringAsFixed(2)}% (${contract.side == 'UP' ? 'صاعد' : 'هابط'})',
            style: TextStyle(
              color: isUp ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _priceStat('الحجم', '${(contract.volume24h / 1000).toStringAsFixed(1)}K'),
              _priceStat('الحد الأعلى', '\$${contract.highPrice?.toStringAsFixed(2) ?? '-'}'),
              _priceStat('الحد الأدنى', '\$${contract.lowPrice?.toStringAsFixed(2) ?? '-'}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _priceStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12, fontFamily: 'Cairo')),
      ],
    );
  }

  Widget _buildTradeTab(TradingProvider trade, EventContract? contract) {
    if (contract == null) return const Center(child: Text('لا يوجد عقد محدد', style: TextStyle(color: Colors.grey, fontFamily: 'Cairo')));

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('الرصيد: ${trade.balance.toStringAsFixed(2)} USDT', style: const TextStyle(color: Colors.white, fontFamily: 'Cairo')),
              if (trade.loading) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            ],
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('أمر محدد (Limit)', style: TextStyle(color: Colors.white, fontFamily: 'Cairo')),
            value: _isLimit,
            onChanged: (v) => setState(() => _isLimit = v),
            activeColor: const Color(0xFF2D5AF5),
          ),
          if (_isLimit)
            TextField(
              controller: _limitPriceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'سعر الحد',
                labelStyle: const TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: const Color(0xFF1A1D2D),
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _amountCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'حجم العقود',
              labelStyle: const TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true,
              fillColor: const Color(0xFF1A1D2D),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: trade.loading ? null : () { setState(() => _side = 'BUY'); _placeOrder(); },
                  icon: const Icon(Icons.arrow_upward),
                  label: const Text('شراء / طويل', style: TextStyle(fontFamily: 'Cairo')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00C087),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: trade.loading ? null : () { setState(() => _side = 'SELL'); _placeOrder(); },
                  icon: const Icon(Icons.arrow_downward),
                  label: const Text('بيع / قصير', style: TextStyle(fontFamily: 'Cairo')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF3B30),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text('الصفقات المفتوحة', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
          const SizedBox(height: 12),
          Expanded(
            child: trade.openTrades.isEmpty
                ? const Center(child: Text('لا توجد صفقات مفتوحة', style: TextStyle(color: Colors.grey, fontFamily: 'Cairo')))
                : ListView.builder(
                    itemCount: trade.openTrades.length,
                    itemBuilder: (_, i) => _TradeItem(trade: trade.openTrades[i]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisTab(TradingProvider trade) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ElevatedButton.icon(
            onPressed: _analyzeMarket,
            icon: const Icon(Icons.analytics),
            label: const Text('تحليل السوق الحقيقي', style: TextStyle(fontFamily: 'Cairo')),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2D5AF5),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
          const SizedBox(height: 16),
          if (_lastSignal != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1D2D),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('الإشارة: $_lastSignal', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                  const SizedBox(height: 8),
                  Text('الاستراتيجية: $_selectedStrategy', style: const TextStyle(color: Colors.grey, fontFamily: 'Cairo')),
                ],
              ),
            ),
          const SizedBox(height: 24),
          const Text('الاستراتيجيات', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: trade.availableStrategies.map((s) => ChoiceChip(
              label: Text(s, style: const TextStyle(fontFamily: 'Cairo')),
              selected: _selectedStrategy == s,
              onSelected: (_) => setState(() => _selectedStrategy = s),
              selectedColor: const Color(0xFF2D5AF5),
            )).toList(),
          ),
          const SizedBox(height: 24),
          const Text('إشارة البوت', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D2D),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              trade.lastSignal ?? 'لا توجد إشارة حالياً',
              style: TextStyle(
                color: trade.lastSignal == 'BUY' ? const Color(0xFF00C087) : trade.lastSignal == 'SELL' ? const Color(0xFFFF3B30) : Colors.grey,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

class _TradeItem extends StatelessWidget {
  final TradeRecord trade;
  const _TradeItem({required this.trade});

  @override
  Widget build(BuildContext context) {
    final isBuy = trade.side == 'BUY';
    return Card(
      color: const Color(0xFF1A1D2D),
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(
          isBuy ? Icons.arrow_upward : Icons.arrow_downward,
          color: isBuy ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
        ),
        title: Text(
          '${trade.symbol} - ${trade.strategy}',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
        ),
        subtitle: Text(
          '${trade.side} | حجم: ${trade.amount} @ \$${trade.entryPrice.toStringAsFixed(2)}',
          style: const TextStyle(color: Colors.grey, fontSize: 12, fontFamily: 'Cairo'),
        ),
        trailing: ElevatedButton(
          onPressed: () async {
            final ok = await context.read<TradingProvider>().closeTrade(trade);
            if (!ok) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('فشل إغلاق الصفقة', style: TextStyle(fontFamily: 'Cairo'))),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            foregroundColor: Colors.white,
          ),
          child: const Text('إغلاق', style: TextStyle(fontFamily: 'Cairo')),
        ),
      ),
    );
  }
}
