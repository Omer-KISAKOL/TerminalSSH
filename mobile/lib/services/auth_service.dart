import 'api_service.dart';
import 'secure_storage_service.dart';

class AuthService {
  AuthService({
    ApiService? api,
    SecureStorageService? storage,
  })  : _api = api ?? ApiService(),
        _storage = storage ?? SecureStorageService();

  final ApiService _api;
  final SecureStorageService _storage;

  ApiService get api => _api;

  Future<bool> restoreSession() async {
    final token = await _storage.read('accessToken');
    if (token == null) return false;
    _api.accessToken = token;
    return true;
  }

  Future<String> login(String email, String password) async {
    final session = await _api.login(email, password);
    await _storage.write('accessToken', session['accessToken'] as String);
    await _storage.write('refreshToken', session['refreshToken'] as String);
    return session['user']['email'] as String;
  }

  Future<void> logout() async {
    await _storage.clearAll();
    _api.accessToken = null;
  }
}
