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

  /// Alanlar eksikse FormatException fırlatır; tip farklılıklarına
  /// (ör. port değerinin yazı olarak gelmesi) toleranslıdır.
  factory ProfileExportEntry.fromJson(Map<String, dynamic> json) {
    String requireString(String key) {
      final value = json[key];
      if (value is String && value.trim().isNotEmpty) return value.trim();
      throw FormatException('"$key" alanı eksik.');
    }

    final rawPort = json['port'];
    final port = rawPort is num ? rawPort.toInt() : int.tryParse('$rawPort') ?? 22;

    if (port < 1 || port > 65535) {
      throw const FormatException('Geçersiz port.');
    }

    final host = requireString('host');
    final rawName = json['name'];

    return ProfileExportEntry(
      name: rawName is String && rawName.trim().isNotEmpty ? rawName.trim() : host,
      host: host,
      port: port,
      username: requireString('username'),
      authType: json['authType'] == 'privateKey' ? 'privateKey' : 'password',
      savePassword: json['savePassword'] == true,
      savePassphrase: json['savePassphrase'] == true,
      password: json['password'] is String ? json['password'] as String : null,
      passphrase: json['passphrase'] is String ? json['passphrase'] as String : null,
      privateKey: json['privateKey'] is String ? json['privateKey'] as String : null,
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

  /// Geçerli kayıtları döndürür; okunamayan kayıtlar [skipped] listesine yazılır.
  factory ProfileExportBundle.fromJsonString(String raw, {List<String>? skipped}) {
    var text = raw;
    if (text.isNotEmpty && text.codeUnitAt(0) == 0xFEFF) {
      text = text.substring(1);
    }

    final dynamic decoded;
    try {
      decoded = jsonDecode(text);
    } catch (_) {
      throw Exception('Dosya geçerli bir JSON değil.');
    }

    if (decoded is! Map<String, dynamic> || decoded['kind'] != 'terminalssh-profiles') {
      throw Exception('Bu dosya TerminalSSH profil dışa aktarımı değil.');
    }

    final version = decoded['version'];
    if (version != null && version != 1) {
      throw Exception('Desteklenmeyen dışa aktarma sürümü.');
    }

    final list = decoded['profiles'];
    if (list is! List<dynamic>) {
      throw Exception('Dosyada profil listesi bulunamadı.');
    }

    final profiles = <ProfileExportEntry>[];

    for (var index = 0; index < list.length; index += 1) {
      final item = list[index];
      try {
        if (item is! Map<String, dynamic>) throw const FormatException('Geçersiz kayıt.');
        profiles.add(ProfileExportEntry.fromJson(item));
      } on FormatException catch (error) {
        skipped?.add('${index + 1}. kayıt: ${error.message}');
      }
    }

    return ProfileExportBundle(
      exportedAt: decoded['exportedAt'] as String? ?? DateTime.now().toUtc().toIso8601String(),
      includeSecrets: decoded['includeSecrets'] == true,
      profiles: profiles,
    );
  }
}
