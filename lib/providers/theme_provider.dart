import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider with ChangeNotifier {
  bool _isDark = true;

  bool get isDark => _isDark;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getBool('is_dark') ?? true;
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _isDark = !_isDark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_dark', _isDark);
    notifyListeners();
  }

  ThemeMode get themeMode => _isDark ? ThemeMode.dark : ThemeMode.light;

  ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF2D5AF5),
        secondary: Color(0xFF00C087),
        surface: Color(0xFFF5F7FA),
        error: Color(0xFFFF3B30),
      ),
      scaffoldBackgroundColor: const Color(0xFFF5F7FA),
      fontFamily: 'Cairo',
    );
  }

  ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF2D5AF5),
        secondary: Color(0xFF00C087),
        surface: Color(0xFF1A1D2D),
        error: Color(0xFFFF3B30),
      ),
      scaffoldBackgroundColor: const Color(0xFF0F1320),
      fontFamily: 'Cairo',
    );
  }
}
