import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';

class BotScreen extends StatelessWidget {
  const BotScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bot = context.watch<TradingProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('البوت التلقائي', style: TextStyle(fontFamily: 'Cairo')),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2D5AF5), Color(0xFF1A3FA0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Icon(
                    bot.isTrading ? Icons.play_circle : Icons.pause_circle,
                    size: 64,
                    color: Colors.white,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    bot.isTrading ? 'البوت يعمل حالياً' : 'البوت متوقف',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'الاستراتيجية: ${bot.selectedStrategy}',
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontFamily: 'Cairo'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'اختر استراتيجية',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.end,
              children: bot.availableStrategies.map((s) {
                final isSelected = bot.selectedStrategy == s;
                return ChoiceChip(
                  label: Text(s, style: const TextStyle(fontFamily: 'Cairo')),
                  selected: isSelected,
                  selectedColor: const Color(0xFF2D5AF5),
                  backgroundColor: const Color(0xFF1A1D2D),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey,
                    fontFamily: 'Cairo',
                  ),
                  onSelected: (_) => bot.selectStrategy(s),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: bot.isTrading ? const Color(0xFFFF3B30) : const Color(0xFF00C087),
                minimumSize: const Size.fromHeight(56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                if (bot.isTrading) {
                  bot.stopAutoTrading();
                } else {
                  bot.startAutoTrading();
                }
              },
              icon: Icon(bot.isTrading ? Icons.stop : Icons.play_arrow),
              label: Text(
                bot.isTrading ? 'إيقاف البوت' : 'تشغيل البوت',
                style: const TextStyle(fontSize: 18, fontFamily: 'Cairo'),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1D2D),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('وصف الاستراتيجيات', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                  const SizedBox(height: 8),
                  _strategyDesc('Hybrid', 'دمج جميع الاستراتيجيات للحصول على أفضل قرار'),
                  _strategyDesc('Momentum', 'تتبع زخم السعر باستخدام SMA'),
                  _strategyDesc('Breakout', 'التداول عند اختراق المستويات'),
                  _strategyDesc('SMA Crossover', 'أفضل للمبتدئين - تقاطع المتوسطات'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _strategyDesc(String name, String desc) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Expanded(
            child: Text(
              desc,
              style: const TextStyle(color: Colors.grey, fontSize: 13, fontFamily: 'Cairo'),
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            name,
            style: const TextStyle(color: Color(0xFF2D5AF5), fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
          ),
        ],
      ),
    );
  }
}
