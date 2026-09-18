class ServerProfile {
  const ServerProfile({
    required this.id,
    required this.name,
    required this.host,
    required this.port,
    required this.username,
    required this.authType,
    required this.savePassword,
    required this.hasSavedPassword,
    this.password,
    this.lastConnectedAt,
  });

  final String id;
  final String name;
  final String host;
  final int port;
  final String username;
  final String authType;
  final bool savePassword;
  final bool hasSavedPassword;
  final String? password;
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
      hasSavedPassword: json['hasSavedPassword'] as bool? ?? false,
      password: json['password'] as String?,
      lastConnectedAt: json['lastConnectedAt'] as String?,
    );
  }
}
