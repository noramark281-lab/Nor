import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Trading order form widget matching MEXC futures UI
class TradingOrderForm extends StatefulWidget {
  final String side; // 'buy' or 'sell'
  final void Function(String type, String side, double price, double quantity, double leverage)
      onSubmit;

  const TradingOrderForm({
    super.key,
    required this.side,
    required this.onSubmit,
  });

  @override
  State<TradingOrderForm> createState() => _TradingOrderFormState();
}

class _TradingOrderFormState extends State<TradingOrderForm> {
  final TextEditingController _priceCtrl = TextEditingController();
  final TextEditingController _qtyCtrl = TextEditingController();
  int _selectedTab = 0; // 0 = Limit, 1 = Market
  double _leverage = 1.0;
  bool _tpSl = false;

  static const List<String> _tabs = ['Limit', 'Market'];

  static const Color _bg = Color(0xFF0F1320);
  static const Color _card = Color(0xFF1A1D2D);
  static const Color _accent = Color(0xFF2D5AF5);
  static const Color _text = Color(0xFF9DA3B4);

  @override
  void dispose() {
    _priceCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isBuy = widget.side == 'buy';
    final btnColor = isBuy ? const Color(0xFF00B87A) : const Color(0xFFFF4D4D);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Order type tabs
          Container(
            decoration: BoxDecoration(
              color: _bg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final selected = _selectedTab == i;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTab = i),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: selected ? _accent : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _tabs[i],
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: selected ? Colors.white : _text,
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 16),

          // Leverage selector
          _buildLeverageRow(),
          const SizedBox(height: 14),

          // Price input (only for limit)
          if (_selectedTab == 0) ...[
            _buildInputField(
              label: 'Price',
              controller: _priceCtrl,
              hint: '0.00',
              suffix: 'USDT',
            ),
            const SizedBox(height: 14),
          ],

          // Quantity input
          _buildInputField(
            label: 'Size',
            controller: _qtyCtrl,
            hint: '0.00',
            suffix: 'USDT',
          ),
          const SizedBox(height: 14),

          // TP/SL toggle
          Row(
            children: [
              SizedBox(
                height: 24,
                child: Switch(
                  value: _tpSl,
                  onChanged: (v) => setState(() => _tpSl = v),
                  activeColor: _accent,
                  inactiveTrackColor: _bg,
                ),
              ),
              const Text(
                'TP / SL',
                style: TextStyle(color: _text, fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Submit button
          ElevatedButton(
            onPressed: _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: btnColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            child: Text(
              isBuy ? 'Buy / Long' : 'Sell / Short',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeverageRow() {
    final leverages = [1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 125.0];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Leverage', style: TextStyle(color: _text, fontSize: 12)),
            Text('${_leverage.toStringAsFixed(0)}x', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: leverages.map((l) {
            final selected = (_leverage - l).abs() < 0.01;
            return GestureDetector(
              onTap: () => setState(() => _leverage = l),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: selected ? _accent : _bg,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: selected ? _accent : const Color(0xFF2A2D3D)),
                ),
                child: Text(
                  '${l.toStringAsFixed(0)}x',
                  style: TextStyle(
                    color: selected ? Colors.white : _text,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required String suffix,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: _text, fontSize: 12)),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(8),
          ),
          child: TextField(
            controller: controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: _text.withOpacity(0.5)),
              suffixText: suffix,
              suffixStyle: const TextStyle(color: Colors.white70, fontSize: 12),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              border: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  void _submit() {
    final price = double.tryParse(_priceCtrl.text) ?? 0;
    final qty = double.tryParse(_qtyCtrl.text) ?? 0;
    if (qty <= 0) return;
    widget.onSubmit(
      _selectedTab == 0 ? 'limit' : 'market',
      widget.side == 'buy' ? 'BUY' : 'SELL',
      price,
      qty,
      _leverage,
    );
  }
}
