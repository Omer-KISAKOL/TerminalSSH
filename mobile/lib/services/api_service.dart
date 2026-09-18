import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/profile_snippet.dart';
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

  Future<List<ProfileSnippet>> listSnippets(String profileId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/profiles/$profileId/snippets'),
      headers: _headers(auth: true),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Snippet listesi alınamadı');
    }

    final snippets = body['snippets'] as List<dynamic>;
    return snippets.map((item) => ProfileSnippet.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<ProfileSnippet> createSnippet(
    String profileId, {
    required String name,
    required String content,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/profiles/$profileId/snippets'),
      headers: _headers(auth: true),
      body: jsonEncode({'name': name, 'content': content}),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Snippet oluşturulamadı');
    }

    return ProfileSnippet.fromJson(body['snippet'] as Map<String, dynamic>);
  }

  Future<ProfileSnippet> updateSnippet(
    String profileId,
    String snippetId, {
    required String name,
    required String content,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/profiles/$profileId/snippets/$snippetId'),
      headers: _headers(auth: true),
      body: jsonEncode({'name': name, 'content': content}),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Snippet güncellenemedi');
    }

    return ProfileSnippet.fromJson(body['snippet'] as Map<String, dynamic>);
  }

  Future<void> deleteSnippet(String profileId, String snippetId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/profiles/$profileId/snippets/$snippetId'),
      headers: _headers(auth: true),
    );

    if (response.statusCode >= 400) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(body['error'] ?? 'Snippet silinemedi');
    }
  }
}
