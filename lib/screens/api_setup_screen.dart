import 'package:flutter/material.dart';
import '../services/api_manager.dart';
import '../services/mexc_api_service.dart';

/// ═══════════════════════════════════════════════════════════════════
/// API Setup Screen - إعداد مفاتيح MEXC Futures API
/// ═══════════════════════════════════════════════════════════════════
class ApiSetupScreen extends StatefulWidget {
  final Widget? nextScreen;
  const ApiSetupScreen({super.key, this.nextScreen});

  @override
  State<ApiSetupScreen> createState() => _ApiSetupScreenState();
}

class _ApiSetupScreenState extends State<ApiSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiKeyCtrl = TextEditingController();
  final _secretKeyCtrl = TextEditingController();

  bool _loading = false;
  bool _obscureSecret = true;
  String? _statusMsg;
  bool _statusIsError = false;

  @override
  void initState() {
    super.initState();
    _loadExistingKeys();
  }

  Future<void> _loadExistingKeys() async {
    await MexcApiManager().initialize();
    final manager = MexcApiManager();
    if (manager.isInitialized) {
      setState(() {
        _apiKeyCtrl.text = manager.apiKey ?? '';
        _secretKeyCtrl.text = manager.secretKey ?? '';
      });
    }
  }

  @override
  void dispose() {
    _apiKeyCtrl.dispose();
    _secretKeyCtrl.dispose();
    super.dispose();
  }

  // ── Validation ──────────────────────────────────────────────────
  Future<void> _validateAndSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _statusMsg = null;
      _statusIsError = false;
    });

    try {
      // Save credentials first
      await MexcApiManager().setCredentials(
        apiKey: _apiKeyCtrl.text.trim(),
        secretKey: _secretKeyCtrl.text.trim(),
      );

      // Test with a real authenticated API call (account assets)
      final api = MexcApiService();
      final balances = await api.getRealBalances();

      setState(() {
        _loading = false;
        _statusMsg = '✅ تم التحقق بنجاح! تم الاتصال بـ MEXC Futures API.';
        _statusIsError = false;
      });
      if (widget.nextScreen != null && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => widget.nextScreen!),
        );
      }
    } catch (e) {
      // Clear credentials on failure
      await MexcApiManager().clearCredentials();

      setState(() {
        _loading = false;
        _statusMsg = '❌ فشل التحقق: $e';
        _statusIsError = true;
      });
    }
  }

  // ── UI ──────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF141414),
        title: const Text(
          'إعداد API - MEXC Futures',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Icon & Title ────────────────────────────────────
              const Icon(Icons.vpn_key, size: 64, color: Color(0xFF00C087)),
              const SizedBox(height: 16),
              Text(
                'ربط حساب MEXC Futures',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'أدخل مفاتيح API الخاصة بـ MEXC Futures للاتصال بحسابك الحقيقي. لا تقلق، يتم تشفير المفاتيح وتخزينها بأمان على جهازك.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
              ),
              const SizedBox(height: 32),

              // ── API Key ─────────────────────────────────────────
              _buildLabel('مفتاح API (ApiKey)'),
              TextFormField(
                controller: _apiKeyCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('مثال: mx0vgl...'),
                validator: (v) =>
                    v == null || v.trim().length < 10 ? 'مفتاح API غير صالح' : null,
              ),
              const SizedBox(height: 20),

              // ── Secret Key ──────────────────────────────────────
              _buildLabel('مفتاح السر (SecretKey)'),
              TextFormField(
                controller: _secretKeyCtrl,
                obscureText: _obscureSecret,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('مثال: a1b2c3d4...').copyWith(
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureSecret ? Icons.visibility_off : Icons.visibility,
                      color: Colors.grey,
                    ),
                    onPressed: () => setState(() => _obscureSecret = !_obscureSecret),
                  ),
                ),
                validator: (v) =>
                    v == null || v.trim().length < 10 ? 'مفتاح السر غير صالح' : null,
              ),
              const SizedBox(height: 32),

              // ── Status ──────────────────────────────────────────
              if (_statusMsg != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _statusIsError
                        ? const Color(0x33FF3B30)
                        : const Color(0x3300C087),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _statusIsError
                          ? const Color(0xFFFF3B30)
                          : const Color(0xFF00C087),
                    ),
                  ),
                  child: Text(
                    _statusMsg!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _statusIsError
                          ? const Color(0xFFFF3B30)
                          : const Color(0xFF00C087),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              if (_statusMsg != null) const SizedBox(height: 20),

              // ── Buttons ─────────────────────────────────────────
              ElevatedButton.icon(
                onPressed: _loading ? null : _validateAndSave,
                icon: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.check_circle, color: Colors.white),
                label: Text(
                  _loading ? 'جارٍ التحقق...' : 'التحقق وحفظ المفاتيح',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00C087),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: _loading
                    ? null
                    : () async {
                        await MexcApiManager().clearCredentials();
                        setState(() {
                          _apiKeyCtrl.clear();
                          _secretKeyCtrl.clear();
                          _statusMsg = 'تم مسح المفاتيح';
                          _statusIsError = false;
                        });
                      },
                icon: const Icon(Icons.delete_forever, color: Colors.grey),
                label: const Text(
                  'مسح المفاتيح',
                  style: TextStyle(color: Colors.grey),
                ),
              ),

              const SizedBox(height: 24),
              const Divider(color: Color(0xFF2A2A2A)),
              const SizedBox(height: 16),

              // ── Instructions ────────────────────────────────────
              _buildInfoCard(
                icon: Icons.info_outline,
                title: 'كيف تحصل على مفاتيح API؟',
                children: const [
                  '1. سجّل الدخول إلى MEXC',
                  '2. اذهب إلى: الحساب ← API Management',
                  '3. أنشئ مفتاح API جديد (Futures)',
                  '4. فعّل صلاحيات: Read + Trade',
                  '5. انسخ ApiKey و SecretKey والصقهما هنا',
                ],
              ),
              const SizedBox(height: 16),
              _buildInfoCard(
                icon: Icons.security,
                title: 'الأمان',
                children: const [
                  '• المفاتيح تُخزّن مشفّرة في الجهاز فقط.',
                  '• لا يتم إرسالها لأي خادم خارجي.',
                  '• يُنصح بتقييد IP في إعدادات MEXC.',
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.grey),
      filled: true,
      fillColor: const Color(0xFF1A1A1A),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF00C087), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFFF3B30), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required List<String> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF00C087), size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...children.map(
            (line) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                line,
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
