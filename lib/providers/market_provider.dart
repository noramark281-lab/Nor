import 'package:flutter/material.dart';
import '../models/event_contract.dart';
import '../services/mexc_api_service.dart';

class MarketProvider with ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  List<EventContract> _contracts = [];
  bool _loading = false;
  String? _error;

  List<EventContract> get contracts => _contracts;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> loadContracts() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _contracts = await _api.fetchEventContracts();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  List<EventContract> get upContracts =>
      _contracts.where((c) => c.side == 'UP').toList();

  List<EventContract> get downContracts =>
      _contracts.where((c) => c.side == 'DOWN').toList();

  EventContract? getContractBySymbol(String symbol) {
    try {
      return _contracts.firstWhere((c) => c.symbol == symbol);
    } catch (_) {
      return null;
    }
  }
}
