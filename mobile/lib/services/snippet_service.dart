import '../models/snippet.dart';
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

  Future<List<Snippet>> listSnippets() async {
    await _ensureAccessToken();
    return _api.listSnippets();
  }

  Future<Snippet> saveSnippet({
    String? id,
    required String name,
    required String content,
  }) async {
    await _ensureAccessToken();

    if (id == null) {
      return _api.createSnippet(name: name, content: content);
    }

    return _api.updateSnippet(id, name: name, content: content);
  }

  Future<void> deleteSnippet(String snippetId) async {
    await _ensureAccessToken();
    await _api.deleteSnippet(snippetId);
  }
}
