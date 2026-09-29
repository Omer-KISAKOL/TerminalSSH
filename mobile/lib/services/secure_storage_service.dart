import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
                resetOnError: true,
              ),
            );

  final FlutterSecureStorage _storage;
  static const _timeout = Duration(seconds: 4);

  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value).timeout(_timeout);

  Future<String?> read(String key) =>
      _storage.read(key: key).timeout(_timeout, onTimeout: () => null);

  Future<void> delete(String key) => _storage.delete(key: key).timeout(_timeout);

  Future<void> clearAll() => _storage.deleteAll().timeout(_timeout);
}
