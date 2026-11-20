import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../models/snippet.dart';
import '../models/server_profile.dart';
import 'api_config.dart';

typedef SessionPersister = Future<void> Function(String accessToken, String refreshToken);

const _requestTimeout = Duration(seconds: 12);

class ApiService {
  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? resolveApiBaseUrl();

  final String baseUrl;
  String? accessToken;
  String? refreshToken;
  SessionPersister? persistSession;

  Map<String, String> _headers({bool auth = false}) {
    final headers = {'Content-Type': 'application/json'};

    if (auth && accessToken != null) {
      headers['Authorization'] = 'Bearer $accessToken';
    }

    return headers;
  }

  Map<String, dynamic> _parseBody(http.Response response, {String fallback = 'API isteği başarısız'}) {
    Map<String, dynamic>? body;

    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) body = decoded;
    } catch (_) {
      body = null;
    }

    if (body == null) {
      if (response.statusCode >= 400) {
        throw Exception(
          response.statusCode == 429
              ? 'Çok fazla istek gönderildi. Lütfen kısa bir süre bekleyin.'
              : 'API isteği başarısız (HTTP ${response.statusCode}).',
        );
      }
      throw Exception('API yanıtı okunamadı.');
    }

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? fallback);
    }

    return body;
  }

  Future<Map<String, dynamic>> _decodeJson(http.Response response, {String fallback = 'API isteği başarısız'}) async {
    return _parseBody(response, fallback: fallback);
  }

  Future<void> refreshSession() async {
    await _rotateTokens();
  }

  Future<http.Response> _send(Future<http.Response> request) async {
    const unreachable = 'API sunucusuna ulaşılamıyor. Bağlantı ve sunucunun çalıştığını kontrol edin.';

    try {
      return await request.timeout(_requestTimeout);
    } on TimeoutException {
      throw Exception(unreachable);
    } on SocketException {
      throw Exception(unreachable);
    } on http.ClientException {
      throw Exception(unreachable);
    }
  }

  Future<void> _rotateTokens() async {
    final currentRefreshToken = refreshToken;

    if (currentRefreshToken == null) {
      throw Exception('Oturum süresi doldu.');
    }

    final response = await _send(http.post(
      Uri.parse('$baseUrl/auth/refresh'),
      headers: _headers(),
      body: jsonEncode({'refreshToken': currentRefreshToken}),
    ));

    final body = _parseBody(response, fallback: 'Oturum yenilenemedi');
    _applySessionBody(body);

    if (persistSession != null) {
      await persistSession!(accessToken!, refreshToken!);
    }
  }

  Future<http.Response> _authorizedRequest(
    Future<http.Response> Function() send, {
    bool allowRefresh = true,
  }) async {
    var response = await _send(send());

    if (response.statusCode == 401 && allowRefresh && refreshToken != null) {
      await _rotateTokens();
      response = await send();
    }

    return response;
  }

  Future<Map<String, dynamic>> me() async {
    final response = await _authorizedRequest(
      () => http.get(Uri.parse('$baseUrl/auth/me'), headers: _headers(auth: true)),
    );

    return _decodeJson(response, fallback: 'Oturum doğrulanamadı');
  }

  Future<void> logoutRemote() async {
    final currentRefreshToken = refreshToken;

    if (currentRefreshToken == null) {
      return;
    }

    await _send(http.post(
      Uri.parse('$baseUrl/auth/logout'),
      headers: _headers(),
      body: jsonEncode({'refreshToken': currentRefreshToken}),
    ));
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _send(http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
        'deviceName': 'Android',
      }),
    ));

    final body = await _decodeJson(response, fallback: 'Giriş başarısız');

    if (body['requiresSecuritySetup'] == true) {
      return body;
    }

    _applySessionBody(body);
    return body;
  }

  void _applySessionBody(Map<String, dynamic> body) {
    final access = body['accessToken'];
    final refresh = body['refreshToken'];

    if (access is! String || refresh is! String || access.isEmpty || refresh.isEmpty) {
      throw Exception('Sunucu yanıtı geçersiz: oturum belirteçleri eksik.');
    }

    accessToken = access;
    refreshToken = refresh;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String securityQuestionId,
    required String securityAnswer,
  }) async {
    final response = await _send(http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
        'securityQuestionId': securityQuestionId,
        'securityAnswer': securityAnswer,
        'deviceName': 'Android',
      }),
    ));

    final body = await _decodeJson(response, fallback: 'Kayıt başarısız');
    _applySessionBody(body);
    return body;
  }

  Future<String> getPasswordResetQuestion(String email) async {
    final response = await _send(http.post(
      Uri.parse('$baseUrl/auth/password-reset/question'),
      headers: _headers(),
      body: jsonEncode({'email': email}),
    ));

    final body = await _decodeJson(response, fallback: 'Güvenlik sorusu alınamadı');
    return body['securityQuestionId'] as String;
  }

  Future<void> resetPasswordWithSecurityAnswer({
    required String email,
    required String securityAnswer,
    required String newPassword,
  }) async {
    final response = await _send(http.post(
      Uri.parse('$baseUrl/auth/password-reset/confirm'),
      headers: _headers(),
      body: jsonEncode({
        'email': email,
        'securityAnswer': securityAnswer,
        'newPassword': newPassword,
      }),
    ));

    await _decodeJson(response, fallback: 'Parola sıfırlanamadı');
  }

  Future<Map<String, dynamic>> completeSecuritySetupWithToken({
    required String setupToken,
    required String securityQuestionId,
    required String securityAnswer,
  }) async {
    final response = await _send(http.post(
      Uri.parse('$baseUrl/auth/security-setup'),
      headers: _headers(),
      body: jsonEncode({
        'setupToken': setupToken,
        'securityQuestionId': securityQuestionId,
        'securityAnswer': securityAnswer,
        'deviceName': 'Android',
      }),
    ));

    final body = await _decodeJson(response, fallback: 'Güvenlik sorusu kaydedilemedi');
    _applySessionBody(body);
    return body;
  }

  /// Oturum zaten açıkken (geri yüklenen oturum) güvenlik sorusunu kaydeder.
  Future<void> completeSecuritySetupAuthenticated({
    required String securityQuestionId,
    required String securityAnswer,
  }) async {
    final response = await _authorizedRequest(
      () => http.post(
        Uri.parse('$baseUrl/auth/security-setup/complete'),
        headers: _headers(auth: true),
        body: jsonEncode({
          'securityQuestionId': securityQuestionId,
          'securityAnswer': securityAnswer,
        }),
      ),
    );

    await _decodeJson(response, fallback: 'Güvenlik sorusu kaydedilemedi');
  }

  Future<List<ServerProfile>> listProfiles() async {
    final response = await _authorizedRequest(
      () => http.get(Uri.parse('$baseUrl/profiles'), headers: _headers(auth: true)),
    );

    final body = await _decodeJson(response, fallback: 'Profiller alınamadı');

    final profiles = body['profiles'] as List<dynamic>;
    return profiles.map((item) => ServerProfile.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<ServerProfile> createProfile({
    required String name,
    required String host,
    required int port,
    required String username,
    required String authType,
    required bool savePassword,
    required bool savePassphrase,
    String? password,
    String? passphrase,
    String? privateKey,
  }) async {
    final response = await _authorizedRequest(
      () => http.post(
        Uri.parse('$baseUrl/profiles'),
        headers: _headers(auth: true),
        body: jsonEncode({
          'name': name,
          'host': host,
          'port': port,
          'username': username,
          'authType': authType,
          'savePassword': savePassword,
          'savePassphrase': savePassphrase,
          'password': password,
          'passphrase': passphrase,
          'privateKey': privateKey,
        }),
      ),
    );

    final body = await _decodeJson(response, fallback: 'Profil oluşturulamadı');

    return ServerProfile.fromJson(body['profile'] as Map<String, dynamic>);
  }

  Future<ServerProfile> updateProfile(
    String profileId, {
    required String name,
    required String host,
    required int port,
    required String username,
    String? authType,
    bool? savePassword,
    String? password,
  }) async {
    final response = await _authorizedRequest(
      () => http.put(
        Uri.parse('$baseUrl/profiles/$profileId'),
        headers: _headers(auth: true),
        body: jsonEncode({
          'name': name,
          'host': host,
          'port': port,
          'username': username,
          if (authType != null) 'authType': authType,
          if (savePassword != null) 'savePassword': savePassword,
          if (password != null) 'password': password,
        }),
      ),
    );

    final body = await _decodeJson(response, fallback: 'Sunucu güncellenemedi');

    return ServerProfile.fromJson(body['profile'] as Map<String, dynamic>);
  }

  Future<void> deleteProfile(String profileId) async {
    final response = await _authorizedRequest(
      () => http.delete(Uri.parse('$baseUrl/profiles/$profileId'), headers: _headers(auth: true)),
    );

    if (response.statusCode >= 400) {
      _parseBody(response, fallback: 'Sunucu silinemedi');
    }
  }

  Future<List<Snippet>> listSnippets() async {
    final response = await _authorizedRequest(
      () => http.get(Uri.parse('$baseUrl/snippets'), headers: _headers(auth: true)),
    );

    final body = await _decodeJson(response, fallback: 'Snippet listesi alınamadı');

    final snippets = body['snippets'] as List<dynamic>;
    return snippets.map((item) => Snippet.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Snippet> createSnippet({
    required String name,
    required String content,
  }) async {
    final response = await _authorizedRequest(
      () => http.post(
        Uri.parse('$baseUrl/snippets'),
        headers: _headers(auth: true),
        body: jsonEncode({'name': name, 'content': content}),
      ),
    );

    final body = await _decodeJson(response, fallback: 'Snippet oluşturulamadı');

    return Snippet.fromJson(body['snippet'] as Map<String, dynamic>);
  }

  Future<Snippet> updateSnippet(
    String snippetId, {
    required String name,
    required String content,
  }) async {
    final response = await _authorizedRequest(
      () => http.put(
        Uri.parse('$baseUrl/snippets/$snippetId'),
        headers: _headers(auth: true),
        body: jsonEncode({'name': name, 'content': content}),
      ),
    );

    final body = await _decodeJson(response, fallback: 'Snippet güncellenemedi');

    return Snippet.fromJson(body['snippet'] as Map<String, dynamic>);
  }

  Future<List<Snippet>> reorderSnippets(List<String> orderedIds) async {
    for (var index = 0; index < orderedIds.length; index += 1) {
      final id = orderedIds[index];
      final response = await _authorizedRequest(
        () => http.put(
          Uri.parse('$baseUrl/snippets/$id'),
          headers: _headers(auth: true),
          body: jsonEncode({'sortOrder': index}),
        ),
      );

      await _decodeJson(response, fallback: 'Snippet sırası güncellenemedi');
    }

    return listSnippets();
  }

  Future<void> deleteSnippet(String snippetId) async {
    final response = await _authorizedRequest(
      () => http.delete(Uri.parse('$baseUrl/snippets/$snippetId'), headers: _headers(auth: true)),
    );

    if (response.statusCode >= 400) {
      _parseBody(response, fallback: 'Snippet silinemedi');
    }
  }
}
