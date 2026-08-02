import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:provider/provider.dart';
import '../services/api_manager.dart';
import '../providers/wallet_provider.dart';

class ApiSetupScreen extends StatefulWidget {
  final Widget? nextScreen;
  const ApiSetupScreen({super.key, this.nextScreen});

  @override
  State<ApiSetupScreen> createState() => _ApiSetupScreenState();
}

class _ApiSetupScreenState extends State<ApiSetupScreen> {
  final _keyController = TextEditingController();
  final _secretController = TextEditingController();
  final _localAuth = LocalAuthentication();
  bool _obscureSecret = true;
  bool _isSaving = false;

  Future<void> _saveWithAuth() async {
    final didAuth = await _localAuth.authenticate(
      localizedReason: 'الرجاء التحقق من هويتك لحفظ مفاتيح API',
      options: const AuthenticationOptions(
        biometricOnly: true,
        stickyAuth: true,
      ),
    );
    if (!didAuth) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('لم يتم التحقق من الهوية')),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      await MexcApiManager().setCredentials(
        _keyController.text.trim(),
        _secretController.text.trim(),
      );
      // تهيئة المحفظة بعد إدخال المفاتيح
      await context.read<WalletProvider>().initialize();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم حفظ المفاتيح بشكل آمن ✅'),
          backgroundColor: Colors.green,
        ),
      );
      if (widget.nextScreen != null) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => widget.nextScreen!),
        );
      } else {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('إعداد API', style: TextStyle(fontFamily: 'Cairo')),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            const Text(
              'أدخل مفاتيح MEXC API',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Cairo'),
            ),
            const SizedBox(height: 8),
            const Text(
              'سيتم تشفير المفاتيح وتخزينها بشكل آمن في الجهاز',
              style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _keyController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'API Key',
                labelStyle: const TextStyle(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.vpn_key, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF1A1D2D),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _secretController,
              obscureText: _obscureSecret,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'API Secret',
                labelStyle: const TextStyle(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.lock, color: Colors.grey),
                suffixIcon: IconButton(
                  icon: Icon(_obscureSecret ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                  onPressed: () => setState(() => _obscureSecret = !_obscureSecret),
                ),
                filled: true,
                fillColor: const Color(0xFF1A1D2D),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D5AF5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isSaving ? null : _saveWithAuth,
                icon: _isSaving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.fingerprint),
                label: Text(_isSaving ? 'جاري الحفظ...' : 'حفظ مع التحقق البيومتري', style: const TextStyle(fontFamily: 'Cairo')),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              '⚠ لا تشارك API مفاتيحك مع أحد. هذا التطبيق يخزنها مشفرة في جهازك فقط.',
              style: TextStyle(color: Colors.orange, fontSize: 12, fontFamily: 'Cairo'),
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
