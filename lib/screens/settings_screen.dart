import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../services/api_manager.dart';
import 'api_setup_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return Scaffold(
          appBar: AppBar(title: const Text('الإعدادات')),
          body: ListView(
            children: [
              SwitchListTile(
                title: const Text('الوضع الليلي'),
                value: themeProvider.themeMode == ThemeMode.dark,
                onChanged: (_) => themeProvider.toggleTheme(),
              ),
              ListTile(
                leading: const Icon(Icons.vpn_key),
                title: const Text('إدارة API Keys'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ApiSetupScreen()),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_forever, color: Colors.red),
                title: const Text('حذف جميع البيانات', style: TextStyle(color: Colors.red)),
                onTap: () async {
                  await MexcApiManager().clearCredentials();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم حذف البيانات')),
                  );
                },
              ),
              const Divider(),
              const ListTile(
                title: Text('الإصدار'),
                trailing: Text('6.0.0+60'),
              ),
            ],
          ),
        );
      },
    );
  }
}


