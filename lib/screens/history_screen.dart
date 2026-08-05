import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final trades = context.watch<TradingProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('سجل الصفقات', style: TextStyle(fontFamily: 'Cairo')),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSummary(trades),
            const SizedBox(height: 16),
            const Text(
              'الصفقات المفتوحة',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: 8),
            Expanded(
              child: trades.openTrades.isEmpty
                  ? const Center(
                      child: Text('لا توجد صفقات مفتوحة', style: TextStyle(color: Colors.grey, fontFamily: 'Cairo')),
                    )
                  : ListView.builder(
                      itemCount: trades.openTrades.length,
                      itemBuilder: (_, i) => _TradeTile(trade: trades.openTrades[i]),
                    ),
            ),
            const Divider(color: Colors.grey),
            const Text(
              'الصفقات المغلقة',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: 8),
            Expanded(
              child: trades.closedTrades.isEmpty
                  ? const Center(
                      child: Text('لا توجد صفقات مغلقة', style: TextStyle(color: Colors.grey, fontFamily: 'Cairo')),
                    )
                  : ListView.builder(
                      itemCount: trades.closedTrades.length,
                      itemBuilder: (_, i) => _TradeTile(trade: trades.closedTrades[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummary(TradingProvider trades) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1D2D),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _sumItem('الرصيد', '\$${trades.balance.toStringAsFixed(2)}', Colors.white),
          _sumItem('الربح/خسارة', '\$${trades.totalProfit.toStringAsFixed(2)}',
              trades.totalProfit >= 0 ? const Color(0xFF00C087) : const Color(0xFFFF3B30)),
          _sumItem('الصفقات', '${trades.trades.length}', const Color(0xFF2D5AF5)),
        ],
      ),
    );
  }

  Widget _sumItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12, fontFamily: 'Cairo')),
      ],
    );
  }
}

class _TradeTile extends StatelessWidget {
  final dynamic trade;
  const _TradeTile({required this.trade});

  @override
  Widget build(BuildContext context) {
    final isUp = trade.side == 'BUY';
    final isOpen = trade.status == 'OPEN';
    final profit = trade.profit ?? 0.0;
    return Card(
      color: const Color(0xFF1A1D2D),
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: isUp ? const Color(0xFF00C087).withOpacity(0.15) : const Color(0xFFFF3B30).withOpacity(0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(isUp ? Icons.arrow_upward : Icons.arrow_downward,
              color: isUp ? const Color(0xFF00C087) : const Color(0xFFFF3B30)),
        ),
        title: Text(
          '${trade.symbol} - ${trade.strategy}',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
        ),
        subtitle: Text(
          '${trade.side} | ${trade.amount} USDT @ ${trade.entryPrice}',
          style: const TextStyle(color: Colors.grey, fontSize: 12, fontFamily: 'Cairo'),
        ),
        trailing: isOpen
            ? const Chip(
                label: Text('مفتوحة', style: TextStyle(color: Colors.white, fontFamily: 'Cairo')),
                backgroundColor: Color(0xFF2D5AF5),
              )
            : Text(
                '${profit >= 0 ? '+' : ''}${profit.toStringAsFixed(2)} USDT',
                style: TextStyle(
                  color: profit >= 0 ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }
}
