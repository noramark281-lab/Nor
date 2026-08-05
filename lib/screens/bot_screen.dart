import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trading_provider.dart';
import '../providers/wallet_provider.dart';

class BotScreen extends StatefulWidget {
  const BotScreen({super.key});

  @override
  State<BotScreen> createState() => _BotScreenState();
}

class _BotScreenState extends State<BotScreen> {
  Timer? _walletSyncTimer;

  void _startBotWalletSync(WalletProvider wallet) {
    _walletSyncTimer?.cancel();
    _walletSyncTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) wallet.syncAll();
    });
  }

  void _stopBotWalletSync() {
    _walletSyncTimer?.cancel();
    _walletSyncTimer = null;
  }

  @override
  void dispose() {
    _stopBotWalletSync();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bot = context.watch<TradingProvider>();
    final wallet = context.watch<WalletProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'البوت التلقائي',
          style: TextStyle(fontFamily: 'Cairo'),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            tooltip: 'تحديث الرصيد',
            onPressed: () {
              bot.syncBalance();
              wallet.syncAll();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // حالة البوت والرصيد
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
                    bot.isTrading
                        ? 'البوت يعمل حالياً (تداول حقيقي)'
                        : 'البوت متوقف',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'الاستراتيجية: ${bot.selectedStrategy}',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.currency_bitcoin,
                        color: Colors.amber,
                        size: 20,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${bot.balance.toStringAsFixed(2)} USDT',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'محفظة: ${wallet.totalUsdtValue.toStringAsFixed(2)} USDT',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontFamily: 'Cairo',
                      fontSize: 13,
                    ),
                  ),
                  if (bot.consecutiveLosses > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        '⚠️ خسائر متتالية: ${bot.consecutiveLosses}',
                        style: const TextStyle(
                          color: Colors.orangeAccent,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // آخر إشارة
            if (bot.lastSignal != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: bot.lastSignal == 'BUY'
                      ? const Color(0xFF00C087).withOpacity(0.15)
                      : bot.lastSignal == 'SELL'
                      ? const Color(0xFFFF3B30).withOpacity(0.15)
                      : const Color(0xFF1A1D2D),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: bot.lastSignal == 'BUY'
                        ? const Color(0xFF00C087)
                        : bot.lastSignal == 'SELL'
                        ? const Color(0xFFFF3B30)
                        : Colors.transparent,
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      bot.lastSignal == 'BUY'
                          ? Icons.arrow_upward
                          : bot.lastSignal == 'SELL'
                          ? Icons.arrow_downward
                          : Icons.horizontal_rule,
                      color: bot.lastSignal == 'BUY'
                          ? const Color(0xFF00C087)
                          : bot.lastSignal == 'SELL'
                          ? const Color(0xFFFF3B30)
                          : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'آخر إشارة: ${bot.lastSignal == 'BUY'
                          ? 'شراء'
                          : bot.lastSignal == 'SELL'
                          ? 'بيع'
                          : 'انتظار'}',
                      style: TextStyle(
                        color: bot.lastSignal == 'BUY'
                            ? const Color(0xFF00C087)
                            : bot.lastSignal == 'SELL'
                            ? const Color(0xFFFF3B30)
                            : Colors.grey,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            if (bot.lastSignal != null) const SizedBox(height: 24),

            // أوامر مفتوحة من المحفظة
            if (wallet.openOrders.isNotEmpty) ...[
              const Text(
                'أوامر مفتوحة في المحفظة',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
                textAlign: TextAlign.right,
              ),
              const SizedBox(height: 12),
              ...wallet.openOrders.take(3).map((order) {
                final symbol = order['symbol']?.toString() ?? '';
                final side = order['side']?.toString() ?? '';
                final isBuy = side.toUpperCase() == 'BUY';
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1D2D),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isBuy
                          ? const Color(0xFF00C087).withOpacity(0.3)
                          : const Color(0xFFFF3B30).withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        side,
                        style: TextStyle(
                          color: isBuy
                              ? const Color(0xFF00C087)
                              : const Color(0xFFFF3B30),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(symbol, style: const TextStyle(color: Colors.white)),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 24),
            ],

            const Text(
              'اختر استراتيجية',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
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

            // زر تشغيل/إيقاف
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: bot.isTrading
                    ? const Color(0xFFFF3B30)
                    : const Color(0xFF00C087),
                minimumSize: const Size.fromHeight(56),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: bot.loading
                  ? null
                  : () async {
                      if (bot.isTrading) {
                        bot.stopAutoTrading();
                        _stopBotWalletSync();
                      } else {
                        bot.startAutoTrading();
                        _startBotWalletSync(wallet);
                      }
                      // مزامنة المحفظة بعد تغيير الحالة
                      await wallet.syncAll();
                    },
              icon: bot.loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Icon(bot.isTrading ? Icons.stop : Icons.play_arrow),
              label: Text(
                bot.loading
                    ? 'جاري التنفيذ...'
                    : bot.isTrading
                    ? 'إيقاف البوت'
                    : 'تشغيل البوت',
                style: const TextStyle(fontSize: 18, fontFamily: 'Cairo'),
              ),
            ),
            const SizedBox(height: 16),

            // صفقات مفتوحة
            if (bot.openTrades.isNotEmpty) ...[
              const Text(
                'صفقات مفتوحة',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
                textAlign: TextAlign.right,
              ),
              const SizedBox(height: 12),
              ...bot.openTrades.map((t) => _tradeTile(t, context)),
              const SizedBox(height: 24),
            ],

            // إجمالي الربح
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1D2D),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${bot.totalProfit >= 0 ? '+' : ''}${bot.totalProfit.toStringAsFixed(2)} USDT',
                        style: TextStyle(
                          color: bot.totalProfit >= 0
                              ? const Color(0xFF00C087)
                              : const Color(0xFFFF3B30),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const Text(
                        'إجمالي الأرباح/الخسائر',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'عدد الصفقات المغلقة: ${bot.closedTrades.length}',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontFamily: 'Cairo',
                    ),
                    textAlign: TextAlign.right,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // وصف الاستراتيجيات
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1D2D),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'وصف الاستراتيجيات',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 8),
                  _strategyDesc(
                    'Hybrid',
                    'دمج جميع الاستراتيجيات للحصول على أفضل قرار',
                  ),
                  _strategyDesc('Momentum', 'تتبع زخم السعر باستخدام SMA'),
                  _strategyDesc('Breakout', 'التداول عند اختراق المستويات'),
                  _strategyDesc(
                    'SMA Crossover',
                    'أفضل للمبتدئين - تقاطع المتوسطات',
                  ),
                  _strategyDesc(
                    'MeanReversion',
                    'الشراء عند الانخفاض والبيع عند الارتفاع',
                  ),
                  _strategyDesc(
                    'Heikin Ashi',
                    'تصفية الضوضاء باستخدام شموع Heikin Ashi',
                  ),
                  _strategyDesc('Sentiment', 'تحليل الحجم والزخم معاً'),
                ],
              ),
            ),

            // عرض الأخطاء
            if (bot.error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF3B30).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFF3B30)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFFF3B30)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        bot.error!,
                        style: const TextStyle(
                          color: Color(0xFFFF3B30),
                          fontFamily: 'Cairo',
                        ),
                        textAlign: TextAlign.right,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _tradeTile(TradeRecord trade, BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1D2D),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: trade.side == 'BUY'
              ? const Color(0xFF00C087).withOpacity(0.3)
              : const Color(0xFFFF3B30).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                trade.entryPrice.toStringAsFixed(4),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${trade.amount.toStringAsFixed(2)} USDT',
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  Icon(
                    trade.side == 'BUY'
                        ? Icons.arrow_upward
                        : Icons.arrow_downward,
                    color: trade.side == 'BUY'
                        ? const Color(0xFF00C087)
                        : const Color(0xFFFF3B30),
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    trade.symbol,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
              Text(
                trade.side == 'BUY' ? 'شراء' : 'بيع',
                style: TextStyle(
                  color: trade.side == 'BUY'
                      ? const Color(0xFF00C087)
                      : const Color(0xFFFF3B30),
                  fontSize: 12,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ],
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
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 13,
                fontFamily: 'Cairo',
              ),
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            name,
            style: const TextStyle(
              color: Color(0xFF2D5AF5),
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}
