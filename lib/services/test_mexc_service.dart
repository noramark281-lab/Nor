import 'api_manager.dart';

class MexcTestService {
  final MexcApiManager _api = MexcApiManager();

  Future<void> testConnection() async {
    try {
      print("جاري التحقق من الاتصال وتجربة API MEXC...");
      
      // 1. جلب سعر البيتكوين اللحظي
      final ticker = await _api.publicGet('/api/v3/ticker/price', params: {'symbol': 'BTCUSDT'});
      print("الاتصال ناجح! سعر BTC الحالي: ${ticker['price']} USDT");

      // 2. جلب رصيد المحفظة عند توفر المفاتيح
      if (_api.isInitialized) {
        final accountInfo = await _api.signedGet('/api/v3/account');
        print("تم الاتصال بالحساب بنجاح!");
        print("الأرصدة: ${accountInfo['balances']}");
      } else {
        print("يرجى إدخال مفاتيح الـ API في شاشة الإعدادات داخل التطبيق.");
      }
    } catch (e) {
      print("❌ حدث خطأ أثناء الاتصال: $e");
    }
  }
}
