import 'package:flutter/material.dart';
import 'trading_screen.dart';
import 'wallet_screen.dart';

/// التطبيق يحتوي عمداً على وجهتين رئيسيتين فقط:
/// التداول الآجل للحدث ومحفظتي الآجلة.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  static const _pages = <Widget>[
    TradingScreen(),
    WalletScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFF0F1320);
    const accent = Color(0xFF2D5AF5);
    const muted = Color(0xFF9DA3B4);

    return Scaffold(
      backgroundColor: bg,
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF151827),
            border: Border(top: BorderSide(color: Color(0xFF2A2D3E))),
          ),
          child: SizedBox(
            height: 68,
            child: Row(
              children: [
                _navItem(
                  label: 'التداول الآجل للحدث',
                  icon: Icons.candlestick_chart,
                  selected: _index == 0,
                  accent: accent,
                  muted: muted,
                  onTap: () => setState(() => _index = 0),
                ),
                _navItem(
                  label: 'محفظتي الآجلة',
                  icon: Icons.account_balance_wallet_outlined,
                  selected: _index == 1,
                  accent: accent,
                  muted: muted,
                  onTap: () => setState(() => _index = 1),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem({
    required String label,
    required IconData icon,
    required bool selected,
    required Color accent,
    required Color muted,
    required VoidCallback onTap,
  }) {
    final color = selected ? accent : muted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
