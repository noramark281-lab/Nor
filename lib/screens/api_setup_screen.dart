import 'package:flutter/material.dart';
import '../services/api_manager.dart';

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
            const SizedBox(height: 24),
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
                label: Text(_isSaving ? 'جاري الحفظ...' : 'حفظ'),
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
