import 'package:flutter/material.dart';
import 'trading_screen.dart';
import 'bot_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 2;

  final List<Widget> _screens = [
    const WalletScreen(),
    const TradingScreen(),
    const TradingScreen(),
    const MarketsScreen(),
    const HomeMainScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF00C087),
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet), label: 'المحفظة'),
          BottomNavigationBarItem(icon: Icon(Icons.gavel), label: 'العقود الآجلة'),
          BottomNavigationBarItem(icon: Icon(Icons.swap_vert), label: 'تداول'),
          BottomNavigationBarItem(icon: Icon(Icons.show_chart), label: 'الأسواق'),
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'الرئيسية'),
        ],
      ),
    );
  }
}

class HomeMainScreen extends StatelessWidget {
  const HomeMainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الرئيسية'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            _buildMenuCard(context, 'التداول', Icons.candlestick_chart, const TradingScreen()),
            _buildMenuCard(context, 'البوت التلقائي', Icons.smart_toy, const BotScreen()),
            _buildMenuCard(context, 'التاريخ', Icons.history, const HistoryScreen()),
            _buildMenuCard(context, 'الإعدادات', Icons.settings, const SettingsScreen()),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuCard(BuildContext context, String title, IconData icon, Widget screen) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF00C087)),
        title: Text(title, textAlign: TextAlign.right),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
      ),
    );
  }
}

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('المحفظة')));
}

class MarketsScreen extends StatelessWidget {
  const MarketsScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('الأسواق')));
}
