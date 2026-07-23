import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<TradingProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          appBar: AppBar(title: const Text('التاريخ')),
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Text('الصفقات المفتوحة (${provider.openOrders.length})'),
                    Text('الصفقات المغلقة (${provider.history.length})'),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: provider.history.length,
                  itemBuilder: (context, index) {
                    final order = provider.history[index];
                    final isWon = order.status == 'WON';
                    return ListTile(
                      leading: Icon(
                        isWon ? Icons.check_circle : Icons.cancel,
                        color: isWon ? Colors.green : Colors.red,
                      ),
                      title: Text('${order.symbol} - ${order.side}'),
                      subtitle: Text('المبلغ: ${order.amount} USDT'),
                      trailing: Text(
                        order.status,
                        style: TextStyle(
                          color: isWon ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
