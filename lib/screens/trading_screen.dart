import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';
import '../providers/wallet_provider.dart';
import '../providers/market_provider.dart';
import '../widgets/price_chart.dart';
import '../widgets/trading_order_form.dart';

class TradingScreen extends StatefulWidget {
  const TradingScreen({super.key});

  @override
  State<TradingScreen> createState() => _TradingScreenState();
}

class _TradingScreenState extends State<TradingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchCtrl = TextEditingController();
  bool _showChart = true;
  int _side = 0; // 0=Buy 1=Sell

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TradingProvider>().loadPairs();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bg = const Color(0xFF0F1320);
    final card = const Color(0xFF1A1D2D);
    final accent = const Color(0xFF2D5AF5);
    final bullish = const Color(0xFF00B87A);
    final bearish = const Color(0xFFFF4D4D);
    final textColor = const Color(0xFF9DA3B4);

    return Consumer<TradingProvider>(
      builder: (context, tp, _) {
        final symbol = tp.selectedSymbol ?? 'BTC_USDT';

        return Scaffold(
          backgroundColor: bg,
          appBar: AppBar(
            backgroundColor: bg,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: _buildSymbolSelector(tp, accent, textColor),
            actions: [
              IconButton(
                icon: Icon(_showChart ? Icons.show_chart : Icons.show_chart_outlined, color: accent),
                onPressed: () => setState(() => _showChart = !_showChart),
                tooltip: 'الرسم البياني',
              ),
            ],
          ),
          body: Column(
            children: [
              // ── Price Chart ──
              if (_showChart)
                SizedBox(
                  height: 320,
                  child: PriceChart(symbol: symbol),
                ),

              // ── Order Form ──
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // Side toggle
                      _buildSideToggle(bullish, bearish),
                      // Order form
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: TradingOrderForm(
                          side: _side == 0 ? 'buy' : 'sell',
                          onSubmit: (type, side, price, quantity, leverage) {
                            tp.placeOrder(
                              type: type,
                              side: side,
                              price: price,
                              quantity: quantity,
                              leverage: leverage,
                            );
                          },
                        ),
                      ),
                      // Leverage info
                      _buildLeverageInfo(tp, card, textColor, accent),
                      // ── Positions & Orders Tabs ──
                      _buildPositionsOrdersSection(card, textColor, bullish, bearish, accent),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSymbolSelector(TradingProvider tp, Color accent, Color textColor) {
    return GestureDetector(
      onTap: () => _showSymbolPicker(context, tp),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            (tp.selectedSymbol ?? 'BTC_USDT').replaceAll('_', '/'),
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
          ),
          const SizedBox(width: 6),
          Icon(Icons.keyboard_arrow_down, color: textColor, size: 20),
          const SizedBox(width: 8),
          if (tp.selectedPair != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: accent.withOpacity(0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${tp.selectedPair!.priceChangePercent.toStringAsFixed(2)}%',
                style: TextStyle(
                  color: tp.selectedPair!.priceChangePercent >= 0 ? const Color(0xFF00B87A) : const Color(0xFFFF4D4D),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showSymbolPicker(BuildContext context, TradingProvider tp) {
    final textColor = const Color(0xFF9DA3B4);
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1D2D),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final pairs = tp.pairs.where((p) {
              final q = _searchCtrl.text.toLowerCase();
              return q.isEmpty || p.symbol.toLowerCase().contains(q) || p.base.toLowerCase().contains(q);
            }).toList();
            return Container(
              height: 500,
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: textColor.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(color: Colors.white),
                    onChanged: (_) => setModalState(() {}),
                    decoration: InputDecoration(
                      hintText: 'بحث عن زوج...',
                      hintStyle: TextStyle(color: textColor.withOpacity(0.6)),
                      prefixIcon: Icon(Icons.search, color: textColor),
                      filled: true,
                      fillColor: const Color(0xFF0F1320),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.builder(
                      itemCount: pairs.length,
                      itemBuilder: (_, i) {
                        final p = pairs[i];
                        final isUp = p.priceChangePercent >= 0;
                        return ListTile(
                          dense: true,
                          leading: CircleAvatar(
                            radius: 14,
                            backgroundColor: const Color(0xFF2D5AF5).withOpacity(0.2),
                            child: Text(p.base[0], style: const TextStyle(color: Colors.white, fontSize: 12)),
                          ),
                          title: Text(
                            p.symbol.replaceAll('_', '/'),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          trailing: Text(
                            '${isUp ? '+' : ''}${p.priceChangePercent.toStringAsFixed(2)}%',
                            style: TextStyle(
                              color: isUp ? const Color(0xFF00B87A) : const Color(0xFFFF4D4D),
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                          subtitle: Text(
                            '${p.lastPrice.toStringAsFixed(2)} USDT',
                            style: TextStyle(color: textColor, fontSize: 12),
                          ),
                          onTap: () {
                            tp.selectPair(p.symbol);
                            Navigator.pop(ctx);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSideToggle(Color bullish, Color bearish) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1D2D),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _side = 0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _side == 0 ? bullish : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'شراء / طويل',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _side == 0 ? Colors.white : const Color(0xFF9DA3B4),
                    fontWeight: _side == 0 ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _side = 1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _side == 1 ? bearish : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'بيع / قصير',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _side == 1 ? Colors.white : const Color(0xFF9DA3B4),
                    fontWeight: _side == 1 ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeverageInfo(TradingProvider tp, Color card, Color textColor, Color accent) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(Icons.settings, size: 16, color: textColor),
          const SizedBox(width: 8),
          Text('الرافعة المالية:', style: TextStyle(color: textColor, fontSize: 13)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: accent.withOpacity(0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text('${tp.leverage}x', style: TextStyle(color: accent, fontWeight: FontWeight.w700, fontSize: 13)),
          ),
          const Spacer(),
          Text('التوفر: ${tp.availableBalance.toStringAsFixed(2)} USDT', style: TextStyle(color: textColor, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildPositionsOrdersSection(Color card, Color textColor, Color bullish, Color bearish, Color accent) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          TabBar(
            controller: _tabController,
            indicatorColor: accent,
            indicatorSize: TabBarIndicatorSize.tab,
            labelColor: Colors.white,
            unselectedLabelColor: textColor,
            labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            tabs: const [
              Tab(text: 'الأوامر المفتوحة'),
              Tab(text: 'الصفقات المفتوحة'),
            ],
          ),
          SizedBox(
            height: 240,
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOpenOrdersTab(textColor, bullish, bearish, accent),
                _buildOpenPositionsTab(textColor, bullish, bearish, accent),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOpenOrdersTab(Color textColor, Color bullish, Color bearish, Color accent) {
    return Consumer<WalletProvider>(
      builder: (context, wp, _) {
        final orders = wp.openOrders.where((o) => o['status'] == 'open' || o['status'] == 'pending').toList();
        if (orders.isEmpty) {
          return _buildEmptyState('لا توجد أومر مفتوحة', Icons.receipt_long_outlined, textColor);
        }
        return ListView.builder(
          itemCount: orders.length,
          padding: const EdgeInsets.all(8),
          itemBuilder: (_, i) {
            final o = orders[i];
            final isBuy = o['side']?.toString().toLowerCase() == 'buy';
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF0F1320),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isBuy ? bullish.withOpacity(0.15) : bearish.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isBuy ? 'شراء' : 'بيع',
                          style: TextStyle(color: isBuy ? bullish : bearish, fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('${o['symbol']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                      const Spacer(),
                      Text('${o['type']?.toString().toUpperCase() ?? 'LIMIT'}', style: TextStyle(color: textColor, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('الكمية: ${o['quantity']}', style: TextStyle(color: textColor, fontSize: 12)),
                      Text('السعر: ${o['price']}', style: TextStyle(color: textColor, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('الوقت: ${o['createdAt'] ?? '-'}', style: TextStyle(color: textColor, fontSize: 11)),
                      GestureDetector(
                        onTap: () {
                          wp.cancelOrder(o['symbol']?.toString() ?? '', o['id']?.toString() ?? '');
                        },
                        child: Text('إلغاء', style: TextStyle(color: bearish, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildOpenPositionsTab(Color textColor, Color bullish, Color bearish, Color accent) {
    return Consumer<WalletProvider>(
      builder: (context, wp, _) {
        final positions = wp.positions.where((p) => p['status'] == 'open').toList();
        if (positions.isEmpty) {
          return _buildEmptyState('لا توجد صفقات مفتوحة', Icons.pie_chart_outline, textColor);
        }
        return ListView.builder(
          itemCount: positions.length,
          padding: const EdgeInsets.all(8),
          itemBuilder: (_, i) {
            final pos = positions[i];
            final isLong = pos['side']?.toString().toLowerCase() == 'long' || pos['side']?.toString().toLowerCase() == 'buy';
            final pnl = double.tryParse(pos['pnl']?.toString() ?? '0') ?? 0.0;
            final pnlColor = pnl >= 0 ? bullish : bearish;
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF0F1320),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isLong ? bullish.withOpacity(0.15) : bearish.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isLong ? 'طويل' : 'قصير',
                          style: TextStyle(color: isLong ? bullish : bearish, fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('${pos['symbol']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                      const Spacer(),
                      Text('${pos['leverage']}x', style: TextStyle(color: accent, fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('الكمية: ${pos['quantity']}', style: TextStyle(color: textColor, fontSize: 12)),
                      Text('السعر: ${pos['entryPrice']}', style: TextStyle(color: textColor, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('الحجم: ${pos['size'] ?? pos['quantity']}', style: TextStyle(color: textColor, fontSize: 12)),
                      Text('PL: ${pnl >= 0 ? '+' : ''}${pnl.toStringAsFixed(2)} USDT',
                          style: TextStyle(color: pnlColor, fontSize: 13, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState(String text, IconData icon, Color textColor) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 40, color: textColor.withOpacity(0.4)),
          const SizedBox(height: 8),
          Text(text, style: TextStyle(color: textColor.withOpacity(0.6), fontSize: 14)),
        ],
      ),
    );
  }
}
