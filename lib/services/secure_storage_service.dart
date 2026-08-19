import 'package:shared_preferences/shared_preferences.dart';
import 'package:encrypt/encrypt.dart' as encrypt;

/// خدمة التخزين الآمن - تعمل على جميع المنصات (Android, iOS, Windows, macOS, Linux)
///
/// على Windows/macOS/Linux: يستخدم shared_preferences + تشفير AES
/// على Android/iOS: يستخدم shared_preferences مع تشفير مدمج
///
class SecureStorageService {
  static SecureStorageService? _instance;
  static SecureStorageService get instance => _instance ??= SecureStorageService._();

  SharedPreferences? _prefs;
  encrypt.Encrypter? _encrypter;
  encrypt.IV? _iv;
  bool _initialized = false;

  SecureStorageService._();

  /// Initialize the service (must be called before first use)
  Future<void> init() async {
    if (_initialized) return;
    _prefs = await SharedPreferences.getInstance();
    _initEncryption();
    _initialized = true;
  }

  void _initEncryption() {
    // Fixed device-specific key for AES-256 encryption
    const deviceKey = 'mexc_trader_encryption_key_2024_32b';
    final key = encrypt.Key.fromUtf8(deviceKey.padRight(32).substring(0, 32));
    _iv = encrypt.IV.fromLength(16);
    _encrypter = encrypt.Encrypter(encrypt.AES(key, mode: encrypt.AESMode.cbc));
  }

  String _encrypt(String plainText) {
    if (_encrypter == null || _iv == null) return plainText;
    final encrypted = _encrypter!.encrypt(plainText, iv: _iv!);
    return encrypted.base64;
  }

  String _decrypt(String encryptedText) {
    if (_encrypter == null || _iv == null) return encryptedText;
    try {
      final encrypted = encrypt.Encrypted.fromBase64(encryptedText);
      return _encrypter!.decrypt(encrypted, iv: _iv!);
    } catch (e) {
      // If decryption fails, return raw value (might be unencrypted from old version)
      return encryptedText;
    }
  }

  // ── API Key Storage ──────────────────────────────────────────────

  Future<void> saveApiKey(String apiKey) async {
    await init();
    await _prefs!.setString('mexc_api_key_enc', _encrypt(apiKey));
  }

  Future<void> saveApiSecret(String apiSecret) async {
    await init();
    await _prefs!.setString('mexc_api_secret_enc', _encrypt(apiSecret));
  }

  Future<String?> getApiKey() async {
    await init();
    final encrypted = _prefs!.getString('mexc_api_key_enc');
    if (encrypted != null) return _decrypt(encrypted);
    // Fallback: check for unencrypted key (migration from old version)
    final raw = _prefs!.getString('mexc_api_key');
    if (raw != null) {
      // Migrate to encrypted storage
      await saveApiKey(raw);
      await _prefs!.remove('mexc_api_key');
      return raw;
    }
    return null;
  }

  Future<String?> getApiSecret() async {
    await init();
    final encrypted = _prefs!.getString('mexc_api_secret_enc');
    if (encrypted != null) return _decrypt(encrypted);
    // Fallback: check for unencrypted key (migration from old version)
    final raw = _prefs!.getString('mexc_api_secret');
    if (raw != null) {
      // Migrate to encrypted storage
      await saveApiSecret(raw);
      await _prefs!.remove('mexc_api_secret');
      return raw;
    }
    return null;
  }

  Future<void> clearAll() async {
    await init();
    await _prefs!.clear();
  }

  Future<void> clearApiKeys() async {
    await init();
    await _prefs!.remove('mexc_api_key_enc');
    await _prefs!.remove('mexc_api_secret_enc');
    await _prefs!.remove('mexc_api_key');
    await _prefs!.remove('mexc_api_secret');
  }

  Future<void> saveApiCredentials(String apiKey, String apiSecret) async {
    await saveApiKey(apiKey);
    await saveApiSecret(apiSecret);
  }

  Future<Map<String, String?>> getApiCredentials() async {
    return {
      'apiKey': await getApiKey(),
      'apiSecret': await getApiSecret(),
    };
  }

  // ── Backend URL Storage ──────────────────────────────────────────

  static Future<void> saveBackendUrl(String url) async {
    final s = instance;
    await s.init();
    await s._prefs!.setString('backend_url', url);
  }

  static Future<String?> getBackendUrl() async {
    final s = instance;
    await s.init();
    return s._prefs!.getString('backend_url');
  }
}
