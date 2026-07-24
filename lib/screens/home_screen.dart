import 'package:flutter/material.dart';
import 'trading_screen.dart';
import 'bot_screen.dart';
import 'cloud_bot_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';
import 'wallet_screen.dart';
import 'api_setup_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 2;

  final List<Widget> _screens = [
    const WalletScreen(),
    const BotScreen(),
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
          BottomNavigationBarItem(icon: Icon(Icons.smart_toy), label: 'البوت المحلي'),
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
        actions: [
          IconButton(
            icon: const Icon(Icons.key),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ApiSetupScreen()),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            _buildHeaderCard(),
            const SizedBox(height: 16),
            _buildMenuCard(context, 'التداول المباشر', Icons.candlestick_chart, const TradingScreen(), Colors.green),
            _buildMenuCard(context, 'البوت السحابي 24/7', Icons.cloud, const CloudBotScreen(), Colors.blue),
            _buildMenuCard(context, 'البوت المحلي', Icons.smart_toy, const BotScreen(), Colors.purple),
            _buildMenuCard(context, 'المحفظة', Icons.account_balance_wallet, const WalletScreen(), Colors.orange),
            _buildMenuCard(context, 'التاريخ', Icons.history, const HistoryScreen(), Colors.teal),
            _buildMenuCard(context, 'الإعدادات', Icons.settings, const SettingsScreen(), Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Card(
      color: const Color(0xFF00C087).withOpacity(0.1),
      child: const Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.verified, color: Color(0xFF00C087), size: 32),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'MEXC Spot Trader',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'تداول حقيقي عبر API مع حد \$1 للصفقة',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuCard(BuildContext context, String title, IconData icon, Widget screen, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(title, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
      ),
    );
  }
}

class MarketsScreen extends StatelessWidget {
  const MarketsScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(child: Text('الأسواق - قريباً', style: TextStyle(fontSize: 18, color: Colors.grey))),
  );
}
