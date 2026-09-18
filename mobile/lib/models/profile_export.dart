import 'dart:convert';

class ProfileExportEntry {
  const ProfileExportEntry({
    required this.name,
    required this.host,
    required this.port,
    required this.username,
    required this.authType,
    required this.savePassword,
    required this.savePassphrase,
    this.password,
    this.passphrase,
    this.privateKey,
  });

  final String name;
  final String host;
  final int port;
  final String username;
  final String authType;
  final bool savePassword;
  final bool savePassphrase;
  final String? password;
  final String? passphrase;
  final String? privateKey;

  Map<String, dynamic> toJson({required bool includeSecrets}) {
    return {
      'name': name,
      'host': host,
      'port': port,
      'username': username,
      'authType': authType,
      'savePassword': savePassword,
      'savePassphrase': savePassphrase,
      if (includeSecrets) 'password': password,
      if (includeSecrets) 'passphrase': passphrase,
      if (includeSecrets) 'privateKey': privateKey,
    };
  }

  factory ProfileExportEntry.fromJson(Map<String, dynamic> json) {
    return ProfileExportEntry(
      name: json['name'] as String,
      host: json['host'] as String,
      port: json['port'] as int,
      username: json['username'] as String,
      authType: json['authType'] as String? ?? 'password',
      savePassword: json['savePassword'] as bool? ?? false,
      savePassphrase: json['savePassphrase'] as bool? ?? false,
      password: json['password'] as String?,
      passphrase: json['passphrase'] as String?,
      privateKey: json['privateKey'] as String?,
    );
  }
}

class ProfileExportBundle {
  const ProfileExportBundle({
    required this.exportedAt,
    required this.includeSecrets,
    required this.profiles,
  });

  final String exportedAt;
  final bool includeSecrets;
  final List<ProfileExportEntry> profiles;

  Map<String, dynamic> toJson() {
    return {
      'version': 1,
      'kind': 'terminalssh-profiles',
      'exportedAt': exportedAt,
      'includeSecrets': includeSecrets,
      'profiles': profiles.map((entry) => entry.toJson(includeSecrets: includeSecrets)).toList(),
    };
  }

  String toJsonString() => const JsonEncoder.withIndent('  ').convert(toJson());

  factory ProfileExportBundle.fromJsonString(String raw) {
    final json = jsonDecode(raw) as Map<String, dynamic>;

    if (json['kind'] != 'terminalssh-profiles') {
      throw Exception('Bu dosya TerminalSSH profil dışa aktarımı değil.');
    }

    if (json['version'] != 1) {
      throw Exception('Desteklenmeyen dışa aktarma sürümü.');
    }

    final profiles = (json['profiles'] as List<dynamic>)
        .map((item) => ProfileExportEntry.fromJson(item as Map<String, dynamic>))
        .toList();

    return ProfileExportBundle(
      exportedAt: json['exportedAt'] as String? ?? DateTime.now().toUtc().toIso8601String(),
      includeSecrets: json['includeSecrets'] as bool? ?? false,
      profiles: profiles,
    );
  }
}
