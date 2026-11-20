import 'package:flutter/foundation.dart';

import '../models/server_profile.dart';
import 'profile_service.dart';

/// Sunucu profil listesinin tek kaynağı. Sunucular ekranı ve ayarlar (içe aktarma)
/// aynı listeyi paylaşır; biri değiştirince diğeri de güncellenir.
class ProfilesController extends ChangeNotifier {
  ProfilesController(this.service);

  final ProfileService service;

  List<ServerProfile> profiles = [];
  bool loading = true;
  String? error;

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      profiles = await service.syncProfiles();
    } catch (e) {
      error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<ServerProfile> add({
    required String name,
    required String host,
    required int port,
    required String username,
    required bool savePassword,
    String? password,
  }) async {
    final profile = await service.createProfile(
      name: name,
      host: host,
      port: port,
      username: username,
      savePassword: savePassword,
      password: password,
    );
    profiles = [...profiles, profile];
    notifyListeners();
    return profile;
  }

  Future<ServerProfile> update(
    ServerProfile existing, {
    required String name,
    required String host,
    required int port,
    required String username,
    required bool savePassword,
    String? password,
  }) async {
    final profile = await service.updateProfile(
      existing,
      name: name,
      host: host,
      port: port,
      username: username,
      savePassword: savePassword,
      password: password,
    );
    profiles = [for (final item in profiles) item.id == existing.id ? profile : item];
    notifyListeners();
    return profile;
  }

  Future<void> remove(ServerProfile profile) async {
    await service.deleteProfile(profile);
    profiles = profiles.where((item) => item.id != profile.id).toList();
    notifyListeners();
  }

  void sortByName() {
    profiles = [...profiles]..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    notifyListeners();
  }
}
