import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../services/api_manager.dart';
import 'api_setup_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0F1320),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('الإعدادات', style: TextStyle(fontFamily: 'Cairo')),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionTitle('المظهر'),
          _tile(
            icon: theme.isDark ? Icons.dark_mode : Icons.light_mode,
            title: 'الوضع الليلي',
            trailing: Switch(
              value: theme.isDark,
              onChanged: (_) => theme.toggleTheme(),
              activeColor: const Color(0xFF2D5AF5),
            ),
          ),
          const Divider(color: Color(0xFF2A2E3F)),
          _sectionTitle('API & الأمان'),
          _tile(
            icon: Icons.vpn_key,
            title: 'إدارة مفاتيح API',
            subtitle: MexcApiManager().isInitialized
                ? 'مفاتيح محفوظة ✅'
                : 'لم يتم الإعداد',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ApiSetupScreen()),
            ),
          ),
          _tile(
            icon: Icons.delete_forever,
            title: 'حذف المفاتيح',
            subtitle: 'إزالة بيانات API من الجهاز',
            onTap: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  backgroundColor: const Color(0xFF1A1D2D),
                  title: const Text(
                    'تأكيد',
                    style: TextStyle(color: Colors.white, fontFamily: 'Cairo'),
                  ),
                  content: const Text(
                    'هل تريد حذف مفاتيح API؟',
                    style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text(
                        'إلغاء',
                        style: TextStyle(fontFamily: 'Cairo'),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text(
                        'حذف',
                        style: TextStyle(
                          color: Colors.red,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                  ],
                ),
              );
              if (ok == true) {
                await MexcApiManager().clearCredentials();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'تم حذف المفاتيح',
                        style: TextStyle(fontFamily: 'Cairo'),
                      ),
                    ),
                  );
                }
              }
            },
          ),
          const Divider(color: Color(0xFF2A2E3F)),
          _sectionTitle('عن التطبيق'),
          _tile(icon: Icons.info, title: 'الإصدار', subtitle: '1.6.0'),
          _tile(
            icon: Icons.warning_amber,
            title: 'تحذير المخاطر',
            subtitle: 'التداول يحمل مخاطر عالية',
            onTap: () => showDialog(
              context: context,
              builder: (_) => AlertDialog(
                backgroundColor: const Color(0xFF1A1D2D),
                title: const Text(
                  'تحذير',
                  style: TextStyle(color: Colors.red, fontFamily: 'Cairo'),
                ),
                content: const Text(
                  'التداول في عقود الحدث والخيارات يحمل مخاطر كبيرة بخسارة رأس المال. لا تضمن هذه الأداة الأرباح. ابدأ بمبالغ صغيرة وجرب على حساب تجريبي أولاً.',
                  style: TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'فهمت',
                      style: TextStyle(fontFamily: 'Cairo'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text(
        title,
        style: const TextStyle(
          color: Color(0xFF2D5AF5),
          fontWeight: FontWeight.bold,
          fontFamily: 'Cairo',
        ),
      ),
    );
  }

  Widget _tile({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white70),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: const TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
            )
          : null,
      trailing: trailing ?? const Icon(Icons.chevron_left, color: Colors.grey),
      onTap: onTap,
    );
  }
}
