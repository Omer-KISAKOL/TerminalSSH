import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/snippet.dart';
import '../models/server_profile.dart';
import 'api_config.dart';

class ApiService {
  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? resolveApiBaseUrl();

  final String baseUrl;
  String? accessToken;

  Map<String, String> _headers({bool auth = false}) {
    final headers = {'Content-Type': 'application/json'};

    if (auth && accessToken != null) {
      headers['Authorization'] = 'Bearer $accessToken';
    }

    return headers;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
        'deviceName': 'Android',
      }),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Giriş başarısız');
    }

    accessToken = body['accessToken'] as String;
    return body;
  }

  Future<List<ServerProfile>> listProfiles() async {
    final response = await http.get(
      Uri.parse('$baseUrl/profiles'),
      headers: _headers(auth: true),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Profiller alınamadı');
    }

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
    final response = await http.post(
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
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Profil oluşturulamadı');
    }

    return ServerProfile.fromJson(body['profile'] as Map<String, dynamic>);
  }

  Future<List<Snippet>> listSnippets() async {
    final response = await http.get(
      Uri.parse('$baseUrl/snippets'),
      headers: _headers(auth: true),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Snippet listesi alınamadı');
    }

    final snippets = body['snippets'] as List<dynamic>;
    return snippets.map((item) => Snippet.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Snippet> createSnippet({
    required String name,
    required String content,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/snippets'),
      headers: _headers(auth: true),
      body: jsonEncode({'name': name, 'content': content}),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Snippet oluşturulamadı');
    }

    return Snippet.fromJson(body['snippet'] as Map<String, dynamic>);
  }

  Future<Snippet> updateSnippet(
    String snippetId, {
    required String name,
    required String content,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/snippets/$snippetId'),
      headers: _headers(auth: true),
      body: jsonEncode({'name': name, 'content': content}),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Snippet güncellenemedi');
    }

    return Snippet.fromJson(body['snippet'] as Map<String, dynamic>);
  }

  Future<void> deleteSnippet(String snippetId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/snippets/$snippetId'),
      headers: _headers(auth: true),
    );

    if (response.statusCode >= 400) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(body['error'] ?? 'Snippet silinemedi');
    }
  }
}
