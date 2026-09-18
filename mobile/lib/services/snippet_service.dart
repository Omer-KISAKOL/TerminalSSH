import '../models/profile_snippet.dart';
import 'api_service.dart';
import 'secure_storage_service.dart';

class SnippetService {
  SnippetService({
    required ApiService api,
    SecureStorageService? storage,
  })  : _api = api,
        _storage = storage ?? SecureStorageService();

  final ApiService _api;
  final SecureStorageService _storage;

  Future<void> _ensureAccessToken() async {
    if (_api.accessToken != null) {
      return;
    }

    final token = await _storage.read('accessToken');
    _api.accessToken = token;
  }

  Future<List<ProfileSnippet>> listSnippets(String profileId) async {
    await _ensureAccessToken();
    return _api.listSnippets(profileId);
  }

  Future<ProfileSnippet> saveSnippet({
    required String profileId,
    String? id,
    required String name,
    required String content,
  }) async {
    await _ensureAccessToken();

    if (id == null) {
      return _api.createSnippet(profileId, name: name, content: content);
    }

    return _api.updateSnippet(profileId, id, name: name, content: content);
  }

  Future<void> deleteSnippet(String profileId, String snippetId) async {
    await _ensureAccessToken();
    await _api.deleteSnippet(profileId, snippetId);
  }
}
