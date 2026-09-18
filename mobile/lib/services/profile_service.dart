import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

import '../models/profile_export.dart';
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

  Future<void> _cacheSecrets(ServerProfile profile) async {
    if (profile.password != null) {
      await _storage.write('profile:${profile.id}:password', profile.password!);
    }
  }

  Future<List<ServerProfile>> syncProfiles() async {
    await _ensureAccessToken();
    final profiles = await _api.listProfiles();

    for (final profile in profiles) {
      await _cacheSecrets(profile);
    }

    return profiles;
  }

  ProfileExportEntry _toExportEntry(ServerProfile profile, {required bool includeSecrets}) {
    return ProfileExportEntry(
      name: profile.name,
      host: profile.host,
      port: profile.port,
      username: profile.username,
      authType: profile.authType,
      savePassword: profile.savePassword,
      savePassphrase: profile.savePassphrase,
      password: includeSecrets ? profile.password : null,
      passphrase: includeSecrets ? profile.passphrase : null,
      privateKey: includeSecrets ? profile.privateKey : null,
    );
  }

  Future<ProfileExportBundle> buildExportBundle({required bool includeSecrets}) async {
    await _ensureAccessToken();
    final profiles = await _api.listProfiles();

    return ProfileExportBundle(
      exportedAt: DateTime.now().toUtc().toIso8601String(),
      includeSecrets: includeSecrets,
      profiles: profiles.map((profile) => _toExportEntry(profile, includeSecrets: includeSecrets)).toList(),
    );
  }

  Future<String?> exportToFile({required bool includeSecrets}) async {
    final bundle = await buildExportBundle(includeSecrets: includeSecrets);
    final fileName = 'terminalssh-profiles-${DateTime.now().toIso8601String().substring(0, 10)}.json';

    final path = await FilePicker.platform.saveFile(
      dialogTitle: 'Sunucu profillerini dışa aktar',
      fileName: fileName,
      type: FileType.custom,
      allowedExtensions: const ['json'],
      bytes: Uint8List.fromList(utf8.encode(bundle.toJsonString())),
    );

    return path;
  }

  Future<int> importFromFile() async {
    final result = await FilePicker.platform.pickFiles(
      dialogTitle: 'Sunucu profillerini içe aktar',
      type: FileType.custom,
      allowedExtensions: const ['json'],
      withData: true,
    );

    if (result == null || result.files.isEmpty) {
      return 0;
    }

    final file = result.files.single;
    final bytes = file.bytes;

    if (bytes == null) {
      throw Exception('Dosya okunamadı.');
    }

    final bundle = ProfileExportBundle.fromJsonString(utf8.decode(bytes));
    return importFromBundle(bundle);
  }

  Future<int> importFromBundle(ProfileExportBundle bundle) async {
    await _ensureAccessToken();

    var imported = 0;

    for (final entry in bundle.profiles) {
      final profile = await _api.createProfile(
        name: entry.name,
        host: entry.host,
        port: entry.port,
        username: entry.username,
        authType: entry.authType,
        savePassword: entry.savePassword,
        savePassphrase: entry.savePassphrase,
        password: entry.password,
        passphrase: entry.passphrase,
        privateKey: entry.privateKey,
      );

      await _cacheSecrets(profile);
      imported += 1;
    }

    return imported;
  }
}
