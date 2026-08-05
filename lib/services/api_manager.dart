import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

class MexcApiManager {
  static final MexcApiManager _instance = MexcApiManager._internal();
  factory MexcApiManager() => _instance;
  MexcApiManager._internal();

  // 1. تعديل الرابط ليتجه مباشرة لسيرفر العقود الآجلة (Futures)
  static const String baseUrl = 'https://contract.mexc.com'; 

  // قراءة المفاتيح المُمَرّرة أثناء البناء (--dart-define)
  final String apiKey = const String.fromEnvironment('MEXC_API_KEY');
  final String secretKey = const String.fromEnvironment('MEXC_SECRET_KEY');

  /// دالة تهيئة مستدعاة عند التشغيل (main.dart)
  Future<void> initialize() async {
    print("تم تهيئة مدير اتصال العقود الآجلة بنجاح حقيقي.");
  }

  /// خوارزمية توليد توقيع العقود الآجلة الحصرية لمنصة MEXC
  /// الصيغة المطلوبة بالسيرفر: ApiKey + Request-Time + BodyData
  String _generateFuturesSignature(String reqTime, String bodyStr) {
    final String textToSign = "$apiKey$reqTime$bodyStr";
    final hmac = Hmac(sha256, utf8.encode(secretKey));
    final digest = hmac.convert(utf8.encode(textToSign));
    return digest.toString();
  }

  /// طلب GET عام (Public) لجلب أسعار العقود اللحظية من السوق
  Future<dynamic> publicGet(String endpoint, {Map<String, String>? params}) async {
    final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: params);
    final response = await http.get(uri);
    return jsonDecode(response.body);
  }

  /// طلب GET موثّق وموقّع خاص بالعقود الآجلة (مثل جلب رصيد محفظة الفيوترز والمراكز المفتوحة)
  Future<dynamic> signedGet(String endpoint) async {
    final String url = "$baseUrl$endpoint";
    final String reqTime = DateTime.now().millisecondsSinceEpoch.toString();
    
    // طلبات الـ GET للعقود الآجلة لا تمتلك Body، لذا نمرر نصاً فارغاً للتوقيع
    final String signature = _generateFuturesSignature(reqTime, "");

    final response = await http.get(
      Uri.parse(url),
      headers: {
        "ApiKey": apiKey,
        "Request-Time": reqTime,
        "Signature": signature,
        "Content-Type": "application/json",
      },
    );
    return jsonDecode(response.body);
  }

  /// طلب POST موثّق وموقّع لتنفيذ تداول حقيقي (فتح/إغلاق صفقات العقود الآجلة والرافعة المالية)
  Future<dynamic> signedPost(String endpoint, {Map<String, dynamic>? body}) async {
    final String url = "$baseUrl$endpoint";
    final String reqTime = DateTime.now().millisecondsSinceEpoch.toString();
    
    // تحويل البيانات لنص JSON خام مضغوط (بدون مسافات متفرقة) لضمان مطابقة التوقيع الرقمي
    final String bodyStr = body != null ? jsonEncode(body) : "";
    
    // توليد التوقيع بدمج الوقت وجسم الطلب
    final String signature = _generateFuturesSignature(reqTime, bodyStr);

    final response = await http.post(
      Uri.parse(url),
      headers: {
        "ApiKey": apiKey,
        "Request-Time": reqTime,
        "Signature": signature,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: bodyStr,
    );
    return jsonDecode(response.body);
  }
}
