import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// MEXC Spot order form. Each submitted order is fixed at $1 USDT notional.
class TradingOrderForm extends StatefulWidget {
  final String side; // 'buy' or 'sell'
  final void Function(String type, String side, double price, double quantity, double leverage) onSubmit;

  const TradingOrderForm({super.key, required this.side, required this.onSubmit});

  @override
  State<TradingOrderForm> createState() => _TradingOrderFormState();
}

class _TradingOrderFormState extends State<TradingOrderForm> {
  final TextEditingController _priceCtrl = TextEditingController();
  int _selectedTab = 1; // Market by default

  static const List<String> _tabs = ['Limit', 'Market'];
  static const Color _bg = Color(0xFF0F1320);
  static const Color _card = Color(0xFF1A1D2D);
  static const Color _accent = Color(0xFF2D5AF5);
  static const Color _text = Color(0xFF9DA3B4);

  @override
  void dispose() {
    _priceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isBuy = widget.side == 'buy';
    final btnColor = isBuy ? const Color(0xFF00B87A) : const Color(0xFFFF4D4D);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: _card, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            decoration: BoxDecoration(color: _bg, borderRadius: BorderRadius.circular(8)),
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final selected = _selectedTab == i;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTab = i),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(color: selected ? _accent : Colors.transparent, borderRadius: BorderRadius.circular(8)),
                      child: Text(_tabs[i], textAlign: TextAlign.center, style: TextStyle(color: selected ? Colors.white : _text, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, fontSize: 13)),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: _bg, borderRadius: BorderRadius.circular(8)),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('حجم الصفقة', style: TextStyle(color: _text, fontSize: 12)),
                Text('1.00 USDT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (_selectedTab == 0) ...[
            _buildInputField(label: 'سعر الحد', controller: _priceCtrl, hint: '0.00', suffix: 'USDT'),
            const SizedBox(height: 12),
          ],
          const Text('يتم حساب كمية العملة تلقائياً من قيمة الصفقة الثابتة 1 USDT.', style: TextStyle(color: _text, fontSize: 11)),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _submit,
            style: ElevatedButton.styleFrom(backgroundColor: btnColor, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
            child: Text(isBuy ? 'شراء فوري — 1 USDT' : 'بيع فوري — 1 USDT', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({required String label, required TextEditingController controller, required String hint, required String suffix}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: _text, fontSize: 12)),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(color: _bg, borderRadius: BorderRadius.circular(8)),
          child: TextField(
            controller: controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
            decoration: InputDecoration(hintText: hint, hintStyle: TextStyle(color: _text.withOpacity(0.5)), suffixText: suffix, suffixStyle: const TextStyle(color: Colors.white70, fontSize: 12), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14), border: InputBorder.none),
          ),
        ),
      ],
    );
  }

  void _submit() {
    final price = double.tryParse(_priceCtrl.text) ?? 0;
    // Quantity is intentionally ignored by the Spot service; it enforces the requested fixed $1 notional.
    widget.onSubmit(_selectedTab == 0 ? 'limit' : 'market', widget.side == 'buy' ? 'BUY' : 'SELL', price, 1.0, 1.0);
  }
}
