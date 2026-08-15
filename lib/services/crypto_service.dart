import 'dart:convert';
import 'package:encrypt/encrypt.dart' as encrypt;

class CryptoService {
  static final CryptoService _instance = CryptoService._internal();
  factory CryptoService() => _instance;
  CryptoService._internal();

  late encrypt.Key _key;
  late encrypt.IV _iv;

  Future<void> initialize() async {
    final deviceKey = await _generateDeviceKey();
    _key = encrypt.Key.fromUtf8(deviceKey);
    _iv = encrypt.IV.fromLength(16);
  }

  String encryptText(String plainText) {
    final encrypter = encrypt.Encrypter(
      encrypt.AES(_key, mode: encrypt.AESMode.cbc),
    );
    final encrypted = encrypter.encrypt(plainText, iv: _iv);
    return encrypted.base64;
  }

  String decryptText(String encryptedText) {
    final encrypter = encrypt.Encrypter(
      encrypt.AES(_key, mode: encrypt.AESMode.cbc),
    );
    final encrypted = encrypt.Encrypted.fromBase64(encryptedText);
    return encrypter.decrypt(encrypted, iv: _iv);
  }

  Future<String> _generateDeviceKey() async {
    final deviceId = 'device_unique_id_${DateTime.now().year}';
    return _deriveKey(deviceId, 32);
  }

  String _deriveKey(String input, int length) {
    final bytes = utf8.encode(input);
    final buffer = StringBuffer();
    for (var i = 0; i < length; i++) {
      buffer.writeCharCode(bytes[i % bytes.length] + (i * 7) % 256);
    }
    return buffer.toString();
  }
}
