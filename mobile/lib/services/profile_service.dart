import '../models/server_profile.dart';
import 'api_service.dart';
import 'secure_storage_service.dart';

class ProfileService {
  ProfileService({
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

  Future<List<ServerProfile>> syncProfiles() async {
    await _ensureAccessToken();
    final profiles = await _api.listProfiles();

    for (final profile in profiles) {
      if (profile.password != null) {
        await _storage.write('profile:${profile.id}:password', profile.password!);
      }
    }

    return profiles;
  }
}
