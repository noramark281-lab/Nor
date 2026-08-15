import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/event_contract.dart';

/// DatabaseService - تخزين سجل التداولات محلياً عبر SharedPreferences
/// يعمل على جميع المنصات (Android, Windows, iOS, Web, macOS, Linux)
class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  static const String _kTradesKey = 'mexc_trade_history_v1';

  Future<void> insertTrade(EventContract contract) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_kTradesKey) ?? [];
    list.insert(0, jsonEncode(contract.toJson()));
    if (list.length > 200) {
      list.removeRange(200, list.length);
    }
    await prefs.setStringList(_kTradesKey, list);
  }

  Future<List<EventContract>> getTradeHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_kTradesKey) ?? [];
    return list.map((item) {
      try {
        final map = jsonDecode(item) as Map<String, dynamic>;
        return EventContract.fromJson(map);
      } catch (_) {
        return null;
      }
    }).whereType<EventContract>().toList();
  }

  Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kTradesKey);
  }
}
