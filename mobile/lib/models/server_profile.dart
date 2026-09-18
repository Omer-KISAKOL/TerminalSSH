class ServerProfile {
  const ServerProfile({
    required this.id,
    required this.name,
    required this.host,
    required this.port,
    required this.username,
    required this.authType,
    required this.savePassword,
    required this.savePassphrase,
    required this.hasSavedPassword,
    required this.hasSavedPassphrase,
    required this.hasSavedPrivateKey,
    this.password,
    this.passphrase,
    this.privateKey,
    this.lastConnectedAt,
  });

  final String id;
  final String name;
  final String host;
  final int port;
  final String username;
  final String authType;
  final bool savePassword;
  final bool savePassphrase;
  final bool hasSavedPassword;
  final bool hasSavedPassphrase;
  final bool hasSavedPrivateKey;
  final String? password;
  final String? passphrase;
  final String? privateKey;
  final String? lastConnectedAt;

  factory ServerProfile.fromJson(Map<String, dynamic> json) {
    return ServerProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      host: json['host'] as String,
      port: json['port'] as int,
      username: json['username'] as String,
      authType: json['authType'] as String,
      savePassword: json['savePassword'] as bool? ?? false,
      savePassphrase: json['savePassphrase'] as bool? ?? false,
      hasSavedPassword: json['hasSavedPassword'] as bool? ?? false,
      hasSavedPassphrase: json['hasSavedPassphrase'] as bool? ?? false,
      hasSavedPrivateKey: json['hasSavedPrivateKey'] as bool? ?? false,
      password: json['password'] as String?,
      passphrase: json['passphrase'] as String?,
      privateKey: json['privateKey'] as String?,
      lastConnectedAt: json['lastConnectedAt'] as String?,
    );
  }
}
