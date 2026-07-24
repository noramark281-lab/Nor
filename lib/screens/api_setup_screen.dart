import 'package:flutter/material.dart';
import '../services/api_manager.dart';
import '../services/mexc_api_service.dart';

class ApiSetupScreen extends StatefulWidget {
  const ApiSetupScreen({super.key});

  @override
  State<ApiSetupScreen> createState() => _ApiSetupScreenState();
}

class _ApiSetupScreenState extends State<ApiSetupScreen> {
  final _keyController = TextEditingController();
  final _secretController = TextEditingController();
  bool _obscureSecret = true;
  bool _isSaving = false;
  bool _isTesting = false;
  String? _testResult;

  Future<void> _testConnection() async {
    setState(() => _isTesting = true);
    try {
      final tempManager = MexcApiManager();
      await tempManager.saveCredentials(
        _keyController.text.trim(),
        _secretController.text.trim(),
      );
      await tempManager.initialize();
      if (tempManager.isInitialized) {
        final api = MexcApiService();
        final account = await api.getAccountInfo();
        setState(() => _testResult = '✅ الاتصال ناجح! نوع الحساب: ${account?['accountType'] ?? 'unknown'}');
      } else {
        setState(() => _testResult = '❌ فشل الاتصال: تحقق من المفاتيح');
      }
    } catch (e) {
      setState(() => _testResult = '❌ خطأ: $e');
    } finally {
      setState(() => _isTesting = false);
    }
  }

  Future<void> _saveCredentials() async {
    setState(() => _isSaving = true);
    try {
      await MexcApiManager().saveCredentials(
        _keyController.text.trim(),
        _secretController.text.trim(),
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم حفظ المفاتيح بشكل آمن'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('إعداد API')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            const Text(
              'أدخل مفاتيح MEXC API',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: 8),
            const Text(
              'سيتم تشفير المفاتيح وتخزينها بشكل آمن في الجهاز',
              style: TextStyle(color: Colors.grey),
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _keyController,
              textAlign: TextAlign.right,
              decoration: const InputDecoration(
                labelText: 'API Key',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.vpn_key),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _secretController,
              textAlign: TextAlign.right,
              obscureText: _obscureSecret,
              decoration: InputDecoration(
                labelText: 'API Secret',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.lock),
                suffixIcon: IconButton(
                  icon: Icon(_obscureSecret ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _obscureSecret = !_obscureSecret),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                onPressed: _isTesting ? null : _testConnection,
                icon: _isTesting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.network_check),
                label: Text(_isTesting ? 'جاري الاختبار...' : 'اختبار الاتصال'),
              ),
            ),
            if (_testResult != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _testResult!,
                  style: TextStyle(
                    color: _testResult!.startsWith('✅') ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveCredentials,
                icon: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.save),
                label: Text(_isSaving ? 'جاري الحفظ...' : 'حفظ المفاتيح'),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'لا تشارك API مفاتيحك مع أحد. هذا التطبيق يخزنها مشفرة في جهازك فقط.',
              style: TextStyle(color: Colors.orange, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _keyController.dispose();
    _secretController.dispose();
    super.dispose();
  }
}
