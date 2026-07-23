import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_PKCS1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accountName: 'mexc_trader_secure',
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static Future<void> saveApiKey(String apiKey) async {
    await _storage.write(key: 'mexc_api_key', value: apiKey);
  }

  static Future<void> saveApiSecret(String apiSecret) async {
    await _storage.write(key: 'mexc_api_secret', value: apiSecret);
  }

  static Future<String?> getApiKey() async {
    return await _storage.read(key: 'mexc_api_key');
  }

  static Future<String?> getApiSecret() async {
    return await _storage.read(key: 'mexc_api_secret');
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  static Future<void> clearApiKeys() async {
    await _storage.delete(key: 'mexc_api_key');
    await _storage.delete(key: 'mexc_api_secret');
  }
}
