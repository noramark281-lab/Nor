import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/market_provider.dart';
import '../providers/theme_provider.dart';
import 'trading_screen.dart';
import 'bot_screen.dart';
import 'history_screen.dart';
import 'wallet_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MarketProvider>().loadMarketData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bg = const Color(0xFF0F1320);
    final card = const Color(0xFF1A1D2D);
    final accent = const Color(0xFF2D5AF5);
    final textColor = const Color(0xFF9DA3B4);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        title: const Text('MEXC Event Trader', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.brightness_6, color: Colors.white),
            onPressed: () => context.read<ThemeProvider>().toggleTheme(),
          ),
        ],
      ),
      body: Consumer<MarketProvider>(
        builder: (context, mp, _) {
          return Column(
            children: [
              // ── Search bar ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: TextField(
                  controller: _searchController,
                  textDirection: TextDirection.ltr,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  onChanged: (q) => mp.setSearchQuery(q),
                  decoration: InputDecoration(
                    hintText: 'ابحث عن زوج تداول...',
                    hintStyle: TextStyle(color: textColor.withOpacity(0.5), fontSize: 13),
                    prefixIcon: Icon(Icons.search, color: textColor, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.clear, color: textColor, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              mp.setSearchQuery('');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: card,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF2D5AF5), width: 1),
                    ),
                  ),
                ),
              ),
              // ── Category tabs ──
              Container(
                height: 36,
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: MarketProvider.kCategories.length,
                  itemBuilder: (context, i) {
                    final selected = mp.categoryIndex == i;
                    return GestureDetector(
                      onTap: () => mp.setCategoryIndex(i),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: selected ? accent : card,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          MarketProvider.kCategories[i],
                          style: TextStyle(
                            color: selected ? Colors.white : textColor,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              // ── Market List Header ──
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    SizedBox(width: 32), // star icon space
                    Expanded(
                      flex: 2,
                      child: Text('الزوج', style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                    Expanded(
                      flex: 2,
                      child: Text('السعر', textAlign: TextAlign.center, style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                    Expanded(
                      flex: 2,
                      child: Text('التغير 24h', textAlign: TextAlign.center, style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                    Expanded(
                      flex: 2,
                      child: Text('الحجم', textAlign: TextAlign.end, style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFF2A2D3E)),
              // ── Market List ──
              Expanded(
                child: _buildMarketList(mp, card, textColor, accent),
              ),
              // ── Bottom stats ──
              _buildBottomStats(mp, card, textColor),
            ],
          );
        },
      ),
      bottomNavigationBar: _buildBottomNav(context, accent, textColor),
    );
  }

  Widget _buildMarketList(MarketProvider mp, Color card, Color textColor, Color accent) {
    if (mp.isLoading && mp.filteredPairs.isEmpty) {
      return ListView.builder(
        itemCount: 8,
        itemBuilder: (_, i) => _buildShimmerItem(card, textColor),
      );
    }
    if (mp.errorMessage != null && mp.filteredPairs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: const Color(0xFFFF4D4D), size: 48),
            const SizedBox(height: 12),
            Text(mp.errorMessage!, style: TextStyle(color: textColor, fontSize: 14)),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: mp.refresh,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('إعادة المحاولة'),
              style: ElevatedButton.styleFrom(
                backgroundColor: accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
      );
    }
    if (mp.filteredPairs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, color: textColor.withOpacity(0.4), size: 48),
            const SizedBox(height: 12),
            Text('لا توجد نتائج', style: TextStyle(color: textColor.withOpacity(0.6), fontSize: 14)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => mp.loadMarketData(),
      color: accent,
      backgroundColor: card,
      child: ListView.builder(
        itemCount: mp.filteredPairs.length,
        padding: const EdgeInsets.only(bottom: 8),
        itemBuilder: (_, i) {
          final pair = mp.filteredPairs[i];
          final isUp = pair.priceChangePercent >= 0;
          final changeColor = isUp ? const Color(0xFF00B87A) : const Color(0xFFFF4D4D);
          final isFav = mp.isFavorite(pair.symbol);
          return InkWell(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const TradingScreen()),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: const Color(0xFF2A2D3E), width: 0.5)),
              ),
              child: Row(
                children: [
                  // Favorite star
                  GestureDetector(
                    onTap: () => mp.toggleFavorite(pair.symbol),
                    child: Icon(
                      isFav ? Icons.star : Icons.star_border,
                      color: isFav ? const Color(0xFFFFB800) : textColor.withOpacity(0.4),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Symbol info
                  Expanded(
                    flex: 2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          pair.symbol.replaceAll('_', '/'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          pair.base,
                          style: TextStyle(color: textColor, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  // Price
                  Expanded(
                    flex: 2,
                    child: Text(
                      pair.lastPrice.toStringAsFixed(pair.lastPrice < 1 ? 4 : 2),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ),
                  // Change
                  Expanded(
                    flex: 2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: changeColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${isUp ? '+' : ''}${pair.priceChangePercent.toStringAsFixed(2)}%',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: changeColor, fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ),
                  ),
                  // Volume
                  Expanded(
                    flex: 2,
                    child: Text(
                      _formatVolume(pair.volume24h),
                      textAlign: TextAlign.end,
                      style: TextStyle(color: textColor, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildShimmerItem(Color card, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(width: 18, height: 18, color: textColor.withOpacity(0.08)),
          const SizedBox(width: 10),
          Expanded(
            child: Container(height: 14, color: textColor.withOpacity(0.08)),
          ),
          const SizedBox(width: 12),
          Container(width: 60, height: 14, color: textColor.withOpacity(0.08)),
          const SizedBox(width: 12),
          Container(width: 50, height: 14, color: textColor.withOpacity(0.08)),
        ],
      ),
    );
  }

  Widget _buildBottomStats(MarketProvider mp, Color card, Color textColor) {
    if (mp.pairs.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: card,
        border: Border(top: BorderSide(color: const Color(0xFF2A2D3E), width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statItem('الأزواج', '${mp.pairs.length}', textColor),
          _statItem('24h حجم', _formatVolume(mp.pairs.fold(0.0, (s, p) => s + p.volume24h)), textColor),
          _statItem('تحديث', '30s', textColor),
        ],
      ),
    );
  }

  Widget _statItem(String label, String value, Color textColor) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: TextStyle(color: textColor.withOpacity(0.6), fontSize: 10)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
      ],
    );
  }

  Widget _buildBottomNav(BuildContext context, Color accent, Color textColor) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1D2D),
        border: Border(top: BorderSide(color: const Color(0xFF2A2D3E), width: 1)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _navItem(context, 'السوق', Icons.show_chart, true, accent, textColor),
              _navItem(context, 'التداول', Icons.candlestick_chart, false, accent, textColor, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TradingScreen()))),
              _navItem(context, 'البوت', Icons.smart_toy, false, accent, textColor, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BotScreen()))),
              _navItem(context, 'التاريخ', Icons.history, false, accent, textColor, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()))),
              _navItem(context, 'المحفظة', Icons.account_balance_wallet, false, accent, textColor, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(BuildContext context, String label, IconData icon, bool active, Color accent, Color textColor, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: active ? accent : textColor, size: 22),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(color: active ? accent : textColor, fontSize: 11, fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatVolume(double v) {
    if (v >= 1e9) return '${(v / 1e9).toStringAsFixed(2)}B';
    if (v >= 1e6) return '${(v / 1e6).toStringAsFixed(2)}M';
    if (v >= 1e3) return '${(v / 1e3).toStringAsFixed(2)}K';
    return v.toStringAsFixed(2);
  }
}
