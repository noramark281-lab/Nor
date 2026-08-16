import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/market_provider.dart';
import 'providers/trading_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/wallet_provider.dart';
import 'services/api_manager.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await MexcApiManager().initialize();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => MarketProvider()),
        ChangeNotifierProvider(create: (_) => TradingProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, theme, _) {
          return MaterialApp(
            title: 'MEXC Spot Trader',
            debugShowCheckedModeBanner: false,
            themeMode: theme.themeMode,
            theme: theme.lightTheme,
            darkTheme: theme.darkTheme,
            locale: const Locale('ar', 'SA'),
            builder: (context, child) => Directionality(
              textDirection: TextDirection.rtl,
              child: child!,
            ),
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
