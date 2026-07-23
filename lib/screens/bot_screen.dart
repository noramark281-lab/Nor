import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';
import '../utils/constants.dart';

class BotScreen extends StatelessWidget {
  const BotScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<TradingProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          appBar: AppBar(title: const Text('البوت التلقائي')),
          body: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text(
                  'اختر استراتيجية التداول',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                DropdownButton<String>(
                  isExpanded: true,
                  value: provider.botStrategy,
                  items: Constants.strategyNames.entries.map((e) => DropdownMenuItem(
                    value: e.key,
                    child: Text(e.value, textAlign: TextAlign.right),
                  )).toList(),
                  onChanged: (v) => provider.setBotStrategy(v!),
                ),
                const SizedBox(height: 24),
                Card(
                  child: ListTile(
                    title: const Text('حالة البوت'),
                    trailing: Switch(
                      value: provider.botRunning,
                      onChanged: (_) {
                        if (provider.botRunning) {
                          provider.stopBot();
                        } else {
                          provider.startBot();
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (provider.botRunning)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.sync, color: Colors.green),
                        SizedBox(width: 8),
                        Text('البوت يعمل...'),
                      ],
                    ),
                  ),
                const Spacer(),
                const Text(
                  '⚠️ تحذير: البوت يتداول بأموال حقيقية. تأكد من فهم المخاطر.',
                  style: TextStyle(color: Colors.orange),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
