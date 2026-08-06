import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final _storage = const FlutterSecureStorage();

  static const _keyApiKey = 'mexc_api_key';
  static const _keySecretKey = 'mexc_secret_key';

  Future<void> saveApiKey(String apiKey) async {
    await _storage.write(key: _keyApiKey, value: apiKey);
  }

  Future<String?> getApiKey() async {
    return await _storage.read(key: _keyApiKey);
  }

  Future<void> saveSecretKey(String secretKey) async {
    await _storage.write(key: _keySecretKey, value: secretKey);
  }

  Future<String?> getSecretKey() async {
    return await _storage.read(key: _keySecretKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
