import 'api_service.dart';
import 'secure_storage_service.dart';

class AuthService {
  AuthService({
    ApiService? api,
    SecureStorageService? storage,
  })  : _api = api ?? ApiService(),
        _storage = storage ?? SecureStorageService() {
    _api.persistSession = _persistSession;
  }

  final ApiService _api;
  final SecureStorageService _storage;

  ApiService get api => _api;

  Future<void> _persistSession(String accessToken, String refreshToken) async {
    await _storage.write('accessToken', accessToken);
    await _storage.write('refreshToken', refreshToken);
    _api.accessToken = accessToken;
    _api.refreshToken = refreshToken;
  }

  Future<bool> restoreSession() async {
    final access = await _storage.read('accessToken');
    final refresh = await _storage.read('refreshToken');

    if (access == null || refresh == null) {
      return false;
    }

    _api.accessToken = access;
    _api.refreshToken = refresh;

    try {
      await _api.me();
      return true;
    } catch (_) {
      try {
        await _api.refreshSession();
        await _api.me();
        return true;
      } catch (_) {
        await logout();
        return false;
      }
    }
  }

  Future<String> login(String email, String password) async {
    final session = await _api.login(email, password);
    await _persistSession(
      session['accessToken'] as String,
      session['refreshToken'] as String,
    );
    return session['user']['email'] as String;
  }

  Future<void> logout() async {
    try {
      await _api.logoutRemote();
    } catch (_) {
      // Yerel oturumu yine de kapat.
    }

    await _storage.clearAll();
    _api.accessToken = null;
    _api.refreshToken = null;
  }
}
