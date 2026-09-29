import 'dart:convert';

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

  Future<Map<String, dynamic>> _decodeJson(http.Response response, {String fallback = 'API isteği başarısız'}) async {
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? fallback);
    }

    return body;
  }

  Future<void> refreshSession() async {
    await _rotateTokens();
  }

  Future<http.Response> _send(Future<http.Response> request) {
    return request.timeout(_requestTimeout);
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

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Oturum yenilenemedi');
    }

    accessToken = body['accessToken'] as String;
    refreshToken = body['refreshToken'] as String;

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

    accessToken = body['accessToken'] as String;
    refreshToken = body['refreshToken'] as String;
    return body;
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

  Future<void> deleteSnippet(String snippetId) async {
    final response = await _authorizedRequest(
      () => http.delete(Uri.parse('$baseUrl/snippets/$snippetId'), headers: _headers(auth: true)),
    );

    if (response.statusCode >= 400) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(body['error'] ?? 'Snippet silinemedi');
    }
  }
}
