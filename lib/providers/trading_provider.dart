import 'package:flutter/material.dart';
import '../services/mexc_api_service.dart';

class TradingProvider with ChangeNotifier {
  MexcApiService? _apiService;
  bool _isLive = true;

  bool get isLive => _isLive;

  void setApiKeys(String apiKey, String secretKey) {
    _apiService = MexcApiService(apiKey: apiKey, secretKey: secretKey);
    notifyListeners();
  }

  Future<void> executeLiveTrade({
    required String symbol,
    required double price,
    required int vol,
    required int side,
  }) async {
    if (_apiService == null) {
      throw Exception("مفاتيح API غير معينة");
    }
    await _apiService!.placeOrder(
      symbol: symbol,
      price: price,
      vol: vol,
      side: side,
      type: 5, // Market Order
    );
    notifyListeners();
  }
}
