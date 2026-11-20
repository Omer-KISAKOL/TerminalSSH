import 'api_service.dart';
import 'secure_storage_service.dart';

/// Giriş sonucu: ya oturum açıldı ya da güvenlik sorusu kurulumu gerekiyor.
class LoginResult {
  const LoginResult.signedIn(this.email)
      : setupToken = null;

  const LoginResult.needsSecuritySetup({required this.email, required String this.setupToken});

  final String email;
  final String? setupToken;

  bool get requiresSecuritySetup => setupToken != null;
}

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

  /// Oturum geri yüklendiyse true; kullanıcı güvenlik sorusu kurulumuna ihtiyaç
  /// duyuyorsa [needsSecuritySetup] true olur.
  bool needsSecuritySetup = false;

  Future<bool> restoreSession() async {
    final access = await _storage.read('accessToken');
    final refresh = await _storage.read('refreshToken');

    if (access == null || refresh == null) {
      return false;
    }

    _api.accessToken = access;
    _api.refreshToken = refresh;

    try {
      final info = await _api.me();
      needsSecuritySetup = info['requiresSecuritySetup'] == true;
      return true;
    } catch (_) {
      try {
        await _api.refreshSession();
        final info = await _api.me();
        needsSecuritySetup = info['requiresSecuritySetup'] == true;
        return true;
      } catch (_) {
        await logout();
        return false;
      }
    }
  }

  Future<LoginResult> login(String email, String password) async {
    final session = await _api.login(email, password);
    final userEmail = (session['user'] as Map<String, dynamic>)['email'] as String;

    if (session['requiresSecuritySetup'] == true) {
      return LoginResult.needsSecuritySetup(
        email: userEmail,
        setupToken: session['setupToken'] as String,
      );
    }

    await _persistSession(
      session['accessToken'] as String,
      session['refreshToken'] as String,
    );
    needsSecuritySetup = false;
    return LoginResult.signedIn(userEmail);
  }

  Future<String> register({
    required String email,
    required String password,
    required String securityQuestionId,
    required String securityAnswer,
  }) async {
    final session = await _api.register(
      email: email,
      password: password,
      securityQuestionId: securityQuestionId,
      securityAnswer: securityAnswer,
    );
    await _persistSession(
      session['accessToken'] as String,
      session['refreshToken'] as String,
    );
    needsSecuritySetup = false;
    return (session['user'] as Map<String, dynamic>)['email'] as String;
  }

  Future<String> requestPasswordResetQuestion(String email) {
    return _api.getPasswordResetQuestion(email);
  }

  Future<void> resetPassword({
    required String email,
    required String securityAnswer,
    required String newPassword,
  }) {
    return _api.resetPasswordWithSecurityAnswer(
      email: email,
      securityAnswer: securityAnswer,
      newPassword: newPassword,
    );
  }

  /// Giriş sırasında alınan setupToken ile güvenlik sorusunu kaydedip oturumu açar.
  Future<void> completeSecuritySetupWithToken({
    required String setupToken,
    required String securityQuestionId,
    required String securityAnswer,
  }) async {
    final session = await _api.completeSecuritySetupWithToken(
      setupToken: setupToken,
      securityQuestionId: securityQuestionId,
      securityAnswer: securityAnswer,
    );
    await _persistSession(
      session['accessToken'] as String,
      session['refreshToken'] as String,
    );
    needsSecuritySetup = false;
  }

  /// Oturum zaten açıkken (geri yüklenen oturum) güvenlik sorusunu kaydeder.
  Future<void> completeSecuritySetupAuthenticated({
    required String securityQuestionId,
    required String securityAnswer,
  }) async {
    await _api.completeSecuritySetupAuthenticated(
      securityQuestionId: securityQuestionId,
      securityAnswer: securityAnswer,
    );
    needsSecuritySetup = false;
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
    needsSecuritySetup = false;
  }
}
