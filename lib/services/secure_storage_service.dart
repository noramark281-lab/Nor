import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// SecureStorageService - Stores API keys and backend URL securely
class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const String _apiKeyKey = 'mexc_api_key';
  static const String _apiSecretKey = 'mexc_api_secret';
  static const String _backendUrlKey = 'backend_url';

  static Future<void> saveApiKey(String key) async {
    await _storage.write(key: _apiKeyKey, value: key);
  }

  static Future<String?> getApiKey() async {
    return await _storage.read(key: _apiKeyKey);
  }

  static Future<void> saveApiSecret(String secret) async {
    await _storage.write(key: _apiSecretKey, value: secret);
  }

  static Future<String?> getApiSecret() async {
    return await _storage.read(key: _apiSecretKey);
  }

  static Future<void> saveBackendUrl(String url) async {
    await _storage.write(key: _backendUrlKey, value: url);
  }

  static Future<String?> getBackendUrl() async {
    return await _storage.read(key: _backendUrlKey);
  }

  static Future<void> clearApiKeys() async {
    await _storage.delete(key: _apiKeyKey);
    await _storage.delete(key: _apiSecretKey);
    await _storage.delete(key: _backendUrlKey);
  }
}
