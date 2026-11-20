import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

import '../models/profile_export.dart';
import '../models/server_profile.dart';
import 'api_service.dart';
import 'secure_storage_service.dart';

class ImportResult {
  const ImportResult({required this.imported, required this.failed});

  final int imported;
  final List<String> failed;
}

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

  Future<ServerProfile> createProfile({
    required String name,
    required String host,
    required int port,
    required String username,
    required bool savePassword,
    String? password,
  }) async {
    await _ensureAccessToken();
    final profile = await _api.createProfile(
      name: name,
      host: host,
      port: port,
      username: username,
      authType: 'password',
      savePassword: savePassword,
      savePassphrase: false,
      password: savePassword ? password : null,
    );
    await _cacheSecrets(profile);
    return profile;
  }

  Future<ServerProfile> updateProfile(
    ServerProfile existing, {
    required String name,
    required String host,
    required int port,
    required String username,
    required bool savePassword,
    String? password,
  }) async {
    await _ensureAccessToken();
    final isPassword = existing.authType == 'password';
    final profile = await _api.updateProfile(
      existing.id,
      name: name,
      host: host,
      port: port,
      username: username,
      // Anahtar ile giriş yapan profillerin kimlik bilgilerine dokunulmaz.
      authType: isPassword ? 'password' : null,
      savePassword: isPassword ? savePassword : null,
      password: isPassword && savePassword ? password : null,
    );
    await _cacheSecrets(profile);
    return profile;
  }

  Future<void> deleteProfile(ServerProfile profile) async {
    await _ensureAccessToken();
    await _api.deleteProfile(profile.id);

    try {
      await _storage.delete('profile:${profile.id}:password');
    } catch (_) {
      // Yerel önbellek temizlenemese de sunucu kaydı silindi.
    }
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

  /// Seçilen dosyadan profilleri içe aktarır. Seçim iptal edilirse null döner.
  Future<ImportResult?> importFromFile() async {
    final result = await FilePicker.platform.pickFiles(
      dialogTitle: 'Sunucu profillerini içe aktar',
      // Android'de FileType.custom ile .json dosyaları çoğu cihazda seçilemiyor;
      // bu yüzden tüm dosyalar gösterilir, içerik ayrıca doğrulanır.
      type: FileType.any,
      withData: true,
    );

    if (result == null || result.files.isEmpty) {
      return null;
    }

    final file = result.files.single;
    var bytes = file.bytes;

    if (bytes == null && file.path != null) {
      bytes = await File(file.path!).readAsBytes();
    }

    if (bytes == null) {
      throw Exception('Dosya okunamadı.');
    }

    final skipped = <String>[];
    final bundle = ProfileExportBundle.fromJsonString(
      utf8.decode(bytes, allowMalformed: true),
      skipped: skipped,
    );

    if (bundle.profiles.isEmpty && skipped.isEmpty) {
      throw Exception('Dosyada içe aktarılacak profil yok.');
    }

    final outcome = await importFromBundle(bundle);
    return ImportResult(
      imported: outcome.imported,
      failed: [...skipped, ...outcome.failed],
    );
  }

  Future<ImportResult> importFromBundle(ProfileExportBundle bundle) async {
    await _ensureAccessToken();

    var imported = 0;
    final failed = <String>[];

    for (final entry in bundle.profiles) {
      try {
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
      } catch (error) {
        failed.add('${entry.name}: ${error.toString().replaceFirst('Exception: ', '')}');
      }
    }

    return ImportResult(imported: imported, failed: failed);
  }
}
