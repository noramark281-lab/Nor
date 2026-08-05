import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/market_provider.dart';
import '../models/event_contract.dart';
import 'trading_screen.dart';
import 'wallet_screen.dart';
import 'bot_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    _MarketTab(),
    TradingScreen(),
    WalletScreen(),
    BotScreen(),
    HistoryScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        backgroundColor: const Color(0xFF1A1D2D),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF2D5AF5),
        unselectedItemColor: Colors.grey,
        selectedLabelStyle: const TextStyle(fontFamily: 'Cairo', fontSize: 11),
        unselectedLabelStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 11,
        ),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.candlestick_chart),
            label: 'التداول',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet),
            label: 'المحفظة',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.smart_toy), label: 'البوت'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'التاريخ'),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'الإعدادات',
          ),
        ],
      ),
    );
  }
}

class _MarketTab extends StatefulWidget {
  const _MarketTab();

  @override
  State<_MarketTab> createState() => _MarketTabState();
}

class _MarketTabState extends State<_MarketTab> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<MarketProvider>().loadContracts());
  }

  @override
  Widget build(BuildContext context) {
    final market = context.watch<MarketProvider>();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.refresh, color: Colors.white),
                  onPressed: market.loadContracts,
                ),
                const Text(
                  'عقود الحدث المتاحة',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (market.error != null)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: Colors.red,
                        size: 48,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        market.error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.red,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: market.loadContracts,
                        icon: const Icon(Icons.refresh),
                        label: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                ),
              )
            else if (market.loading)
              const Expanded(child: Center(child: CircularProgressIndicator()))
            else if (market.contracts.isEmpty)
              const Expanded(
                child: Center(
                  child: Text(
                    'لا توجد عقود متاحة حالياً',
                    style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
                  ),
                ),
              )
            else
              Expanded(
                child: ListView.builder(
                  itemCount: market.contracts.length,
                  itemBuilder: (_, i) =>
                      _ContractCard(contract: market.contracts[i]),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ContractCard extends StatelessWidget {
  final EventContract contract;
  const _ContractCard({required this.contract});

  @override
  Widget build(BuildContext context) {
    final isUp = contract.side == 'UP';
    return Card(
      color: const Color(0xFF1A1D2D),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isUp
                ? const Color(0xFF00C087).withOpacity(0.15)
                : const Color(0xFFFF3B30).withOpacity(0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            isUp ? Icons.arrow_upward : Icons.arrow_downward,
            color: isUp ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
          ),
        ),
        title: Text(
          contract.name,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
        subtitle: Text(
          'السعر: \$${contract.currentPrice.toStringAsFixed(2)} | الحجم: ${(contract.volume24h / 1000).toStringAsFixed(1)}K',
          style: const TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
        ),
        trailing: Text(
          '${contract.priceChangePercent > 0 ? '+' : ''}${contract.priceChangePercent.toStringAsFixed(2)}%',
          style: TextStyle(
            color: contract.priceChangePercent >= 0
                ? const Color(0xFF00C087)
                : const Color(0xFFFF3B30),
            fontWeight: FontWeight.bold,
          ),
        ),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => TradingScreen(contract: contract)),
        ),
      ),
    );
  }
}
