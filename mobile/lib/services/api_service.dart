import 'dart:convert';

import 'package:http/http.dart' as http;

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
}
