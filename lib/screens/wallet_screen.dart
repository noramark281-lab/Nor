import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../providers/trading_provider.dart';
import '../services/api_manager.dart';

/// ═══════════════════════════════════════════════════════════════════
/// Wallet Screen - شاشة المحفظة الحقيقية
///
/// تعرض:
/// • إجمالي الرصيد والأرصدة المتاحة والمجمدة
/// • قائمة الأصول
/// • الأوامر المفتوحة
/// • آخر الصفقات
/// ═══════════════════════════════════════════════════════════════════
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WalletProvider>().initialize();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final wallet = context.watch<WalletProvider>();
    final trading = context.watch<TradingProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'محفظتي',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync, color: Colors.white70),
            tooltip: 'مزامنة المحفظة',
            onPressed: wallet.loading ? null : () => wallet.syncAll(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF2D5AF5),
          labelColor: Colors.white,
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'الرصيد'),
            Tab(text: 'الأوامر'),
            Tab(text: 'الصفقات'),
          ],
        ),
      ),
      body: Column(
        children: [
          // ── بطاقة الرصيد الرئيسية ────────────────────────────────
          _buildBalanceCard(wallet, trading),

          // ── الأخطاء ──────────────────────────────────────────────
          if (wallet.error != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                      wallet.error!,
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

          // ── محتوى التبويبات ──────────────────────────────────────
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAssetsTab(wallet),
                _buildOrdersTab(wallet),
                _buildTradesTab(wallet),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // بطاقة الرصيد الرئيسية
  // ═══════════════════════════════════════════════════════════════
  Widget _buildBalanceCard(WalletProvider wallet, TradingProvider trading) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2D5AF5), Color(0xFF1A3FA0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2D5AF5).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // حالة الاتصال
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: MexcApiManager().isInitialized
                      ? const Color(0xFF00C087).withOpacity(0.2)
                      : const Color(0xFFFF3B30).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      MexcApiManager().isInitialized
                          ? Icons.cloud_done
                          : Icons.cloud_off,
                      color: MexcApiManager().isInitialized
                          ? const Color(0xFF00C087)
                          : const Color(0xFFFF3B30),
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      MexcApiManager().isInitialized
                          ? 'متصل بـ MEXC'
                          : 'غير متصل',
                      style: TextStyle(
                        color: MexcApiManager().isInitialized
                            ? const Color(0xFF00C087)
                            : const Color(0xFFFF3B30),
                        fontSize: 12,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
              const Text(
                'إجمالي الرصيد',
                style: TextStyle(
                  color: Colors.white70,
                  fontFamily: 'Cairo',
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // المبلغ الإجمالي
          Text(
            '${wallet.totalUsdtValue.toStringAsFixed(2)} USDT',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 16),

          // متاح / مجمد
          Row(
            children: [
              Expanded(
                child: _balanceSubItem(
                  'متاح',
                  wallet.availableUsdt,
                  const Color(0xFF00C087),
                ),
              ),
              Container(width: 1, height: 40, color: Colors.white24),
              Expanded(
                child: _balanceSubItem(
                  'مجمد',
                  wallet.lockedUsdt,
                  const Color(0xFFFFB800),
                ),
              ),
              Container(width: 1, height: 40, color: Colors.white24),
              Expanded(
                child: _balanceSubItem(
                  'أرباح الصفقات',
                  trading.totalProfit,
                  trading.totalProfit >= 0
                      ? const Color(0xFF00C087)
                      : const Color(0xFFFF3B30),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _balanceSubItem(String label, double value, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
            fontFamily: 'Cairo',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value.toStringAsFixed(2),
          style: TextStyle(
            color: color,
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // تبويب الأصول
  // ═══════════════════════════════════════════════════════════════
  Widget _buildAssetsTab(WalletProvider wallet) {
    if (wallet.loading && wallet.assetList.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!MexcApiManager().isInitialized) {
      return _buildNoConnection();
    }

    if (wallet.assetList.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد أصول في المحفظة',
          style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => wallet.syncAll(),
      color: const Color(0xFF2D5AF5),
      backgroundColor: const Color(0xFF1A1D2D),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: wallet.assetList.length,
        itemBuilder: (_, i) {
          final asset = wallet.assetList[i];
          final total = asset['total'] as double;
          final free = asset['free'] as double;
          final locked = asset['locked'] as double;
          final symbol = asset['asset'] as String;

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D2D),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                // أيقونة/رمز العملة
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2D5AF5).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      symbol.substring(0, symbol.length > 3 ? 3 : symbol.length),
                      style: const TextStyle(
                        color: Color(0xFF2D5AF5),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // اسم العملة والكمية
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        symbol,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'متاح: ${wallet.formatAssetValue(free)} | مجمد: ${wallet.formatAssetValue(locked)}',
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ),

                // الإجمالي
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      wallet.formatAssetValue(total),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (symbol == 'USDT')
                      const Text(
                        '\$${total.toStringAsFixed(2)}',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // تبويب الأوامر المفتوحة
  // ═══════════════════════════════════════════════════════════════
  Widget _buildOrdersTab(WalletProvider wallet) {
    if (wallet.loading && wallet.openOrders.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!MexcApiManager().isInitialized) {
      return _buildNoConnection();
    }

    if (wallet.openOrders.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد أوامر مفتوحة',
          style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => wallet.syncAll(),
      color: const Color(0xFF2D5AF5),
      backgroundColor: const Color(0xFF1A1D2D),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: wallet.openOrders.length,
        itemBuilder: (_, i) {
          final order = wallet.openOrders[i];
          final symbol = order['symbol']?.toString() ?? '';
          final side = order['side']?.toString() ?? '';
          final type = order['type']?.toString() ?? '';
          final price = double.tryParse(order['price']?.toString() ?? '0') ?? 0.0;
          final qty = double.tryParse(order['origQty']?.toString() ?? '0') ?? 0.0;
          final orderId = order['orderId']?.toString() ?? '';

          final isBuy = side.toUpperCase() == 'BUY';

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D2D),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isBuy
                    ? const Color(0xFF00C087).withOpacity(0.3)
                    : const Color(0xFFFF3B30).withOpacity(0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // زر الإلغاء
                    TextButton.icon(
                      onPressed: wallet.loading
                          ? null
                          : () => _confirmCancel(wallet, symbol, orderId),
                      icon: const Icon(Icons.cancel, size: 16, color: Colors.orangeAccent),
                      label: const Text(
                        'إلغاء',
                        style: TextStyle(
                          color: Colors.orangeAccent,
                          fontFamily: 'Cairo',
                          fontSize: 12,
                        ),
                      ),
                    ),

                    // نوع الأمر
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isBuy
                            ? const Color(0xFF00C087).withOpacity(0.15)
                            : const Color(0xFFFF3B30).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$side · $type',
                        style: TextStyle(
                          color: isBuy ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${qty.toStringAsFixed(6)} @ ${price > 0 ? price.toStringAsFixed(2) : 'سوقي'}',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                    Text(
                      symbol,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _confirmCancel(
      WalletProvider wallet, String symbol, String orderId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1A1D2D),
        title: const Text(
          'تأكيد الإلغاء',
          style: TextStyle(color: Colors.white, fontFamily: 'Cairo'),
          textAlign: TextAlign.right,
        ),
        content: const Text(
          'هل أنت متأكد من إلغاء هذا الأمر؟',
          style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
          textAlign: TextAlign.right,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('لا', style: TextStyle(fontFamily: 'Cairo')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'نعم، إلغاء',
              style: TextStyle(color: Colors.orangeAccent, fontFamily: 'Cairo'),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await wallet.cancelOrder(symbol, orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success ? 'تم إلغاء الأمر بنجاح' : 'فشل إلغاء الأمر',
              style: const TextStyle(fontFamily: 'Cairo'),
            ),
            backgroundColor: success ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
          ),
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // تبويب الصفقات
  // ═══════════════════════════════════════════════════════════════
  Widget _buildTradesTab(WalletProvider wallet) {
    if (wallet.loading && wallet.recentTrades.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!MexcApiManager().isInitialized) {
      return _buildNoConnection();
    }

    if (wallet.recentTrades.isEmpty) {
      return const Center(
        child: Text(
          'لا توجد صفقات حديثة',
          style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => wallet.syncAll(),
      color: const Color(0xFF2D5AF5),
      backgroundColor: const Color(0xFF1A1D2D),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: wallet.recentTrades.length,
        itemBuilder: (_, i) {
          final trade = wallet.recentTrades[i];
          final symbol = trade['symbol']?.toString() ?? '';
          final isBuyer = trade['isBuyer'] == true;
          final price = double.tryParse(trade['price']?.toString() ?? '0') ?? 0.0;
          final qty = double.tryParse(trade['qty']?.toString() ?? '0') ?? 0.0;
          final quoteQty = double.tryParse(trade['quoteQty']?.toString() ?? '0') ?? 0.0;
          final time = DateTime.fromMillisecondsSinceEpoch(
            trade['time'] ?? DateTime.now().millisecondsSinceEpoch,
          );

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D2D),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isBuyer
                        ? const Color(0xFF00C087).withOpacity(0.15)
                        : const Color(0xFFFF3B30).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isBuyer ? Icons.arrow_upward : Icons.arrow_downward,
                    color: isBuyer ? const Color(0xFF00C087) : const Color(0xFFFF3B30),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        symbol,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${qty.toStringAsFixed(4)} @ \$${price.toStringAsFixed(2)}',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${quoteQty.toStringAsFixed(2)} USDT',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${time.day}/${time.month} ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildNoConnection() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.cloud_off, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'لم يتم إعداد مفاتيح API',
            style: TextStyle(color: Colors.white, fontSize: 18, fontFamily: 'Cairo'),
          ),
          const SizedBox(height: 8),
          const Text(
            'يرجى إعداد مفاتيح API في شاشة الإعدادات',
            style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.read<WalletProvider>().syncAll(),
            icon: const Icon(Icons.settings),
            label: const Text('الإعدادات', style: TextStyle(fontFamily: 'Cairo')),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2D5AF5),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }
}
