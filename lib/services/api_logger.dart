import 'dart:developer' as developer;

class ApiLogger {
  static void d(String tag, String message) {
    developer.log('[$tag] DEBUG: $message', name: 'MEXC_API');
  }

  static void i(String tag, String message) {
    developer.log('[$tag] INFO: $message', name: 'MEXC_API');
  }

  static void w(String tag, String message) {
    developer.log('[$tag] WARN: $message', name: 'MEXC_API');
  }

  static void e(String tag, String message) {
    developer.log('[$tag] ERROR: $message', name: 'MEXC_API');
  }
}
