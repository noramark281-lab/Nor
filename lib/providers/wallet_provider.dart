import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../services/mexc_api_service.dart';
import '../services/api_logger.dart';

class WalletProvider extends ChangeNotifier {
  double totalUsdtValue = 10000.0;
  List<Map<String, dynamic>> openOrders = [];
  bool loading = false;
  String? error;

  Future<void> syncAll() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      totalUsdtValue = 10000.0;
      openOrders = [];
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
