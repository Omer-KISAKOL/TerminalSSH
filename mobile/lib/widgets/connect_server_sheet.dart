import 'package:flutter/material.dart';

import '../models/server_profile.dart';
import '../theme/app_theme.dart';
import 'password_field.dart';

enum ServerSheetMode {
  /// Yeni sunucu kaydı oluşturur.
  add,

  /// Kayıtlı sunucuyu düzenler.
  edit,

  /// Kayıtlı parolası olmayan sunucu için yalnızca parola ister.
  connect,
}

class ConnectServerSheet extends StatefulWidget {
  const ConnectServerSheet({
    super.key,
    this.profile,
    this.mode = ServerSheetMode.add,
  });

  final ServerProfile? profile;
  final ServerSheetMode mode;

  static Future<ConnectServerResult?> show(
    BuildContext context, {
    ServerProfile? profile,
    ServerSheetMode mode = ServerSheetMode.add,
  }) {
    return showModalBottomSheet<ConnectServerResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
        child: ConnectServerSheet(profile: profile, mode: mode),
      ),
    );
  }

  @override
  State<ConnectServerSheet> createState() => _ConnectServerSheetState();
}

class _ConnectServerSheetState extends State<ConnectServerSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _hostController;
  late final TextEditingController _portController;
  late final TextEditingController _usernameController;
  late final TextEditingController _passwordController;
  late bool _savePassword;
  String? _error;

  bool get _connectOnly => widget.mode == ServerSheetMode.connect;

  @override
  void initState() {
    super.initState();
    final profile = widget.profile;
    _nameController = TextEditingController(text: profile?.name ?? '');
    _hostController = TextEditingController(text: profile?.host ?? '');
    _portController = TextEditingController(text: '${profile?.port ?? 22}');
    _usernameController = TextEditingController(text: profile?.username ?? '');
    _passwordController = TextEditingController(text: profile?.password ?? '');
    _savePassword = profile?.savePassword ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _hostController.dispose();
    _portController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String get _title {
    switch (widget.mode) {
      case ServerSheetMode.add:
        return 'Sunucu ekle';
      case ServerSheetMode.edit:
        return 'Sunucuyu düzenle';
      case ServerSheetMode.connect:
        return 'Sunucuya bağlan';
    }
  }

  String get _submitLabel {
    switch (widget.mode) {
      case ServerSheetMode.add:
        return 'Kaydet ve bağlan';
      case ServerSheetMode.edit:
        return 'Kaydet';
      case ServerSheetMode.connect:
        return 'Bağlan';
    }
  }

  void _submit() {
    final host = _hostController.text.trim();
    final username = _usernameController.text.trim();
    final port = int.tryParse(_portController.text.trim());

    if (host.isEmpty) {
      setState(() => _error = 'Adres gerekli.');
      return;
    }

    if (port == null || port < 1 || port > 65535) {
      setState(() => _error = 'Port 1-65535 arasında olmalıdır.');
      return;
    }

    if (username.isEmpty) {
      setState(() => _error = 'Kullanıcı adı gerekli.');
      return;
    }

    final name = _nameController.text.trim();

    Navigator.of(context).pop(
      ConnectServerResult(
        name: name.isEmpty ? host : name,
        host: host,
        port: port,
        username: username,
        password: _passwordController.text,
        savePassword: _connectOnly ? false : _savePassword,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isKeyProfile = widget.profile?.authType == 'privateKey';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(_title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          if (!_connectOnly) ...[
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Sunucu adı'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _hostController,
              keyboardType: TextInputType.url,
              autocorrect: false,
              decoration: const InputDecoration(labelText: 'Adres'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _portController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Port'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _usernameController,
                    autocorrect: false,
                    decoration: const InputDecoration(labelText: 'Kullanıcı'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          if (isKeyProfile && widget.mode == ServerSheetMode.edit)
            Text(
              'Bu sunucu özel anahtar ile giriş yapıyor; anahtar bilgileri değiştirilmez.',
              style: Theme.of(context).textTheme.bodySmall,
            )
          else ...[
            PasswordField(
              controller: _passwordController,
              labelText: 'SSH parolası',
              hintText: widget.mode == ServerSheetMode.edit && widget.profile?.hasSavedPassword == true
                  ? 'Boş bırakılırsa mevcut parola korunur'
                  : null,
            ),
            if (!_connectOnly)
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: _savePassword,
                onChanged: (value) => setState(() => _savePassword = value),
                activeColor: AppColors.green,
                title: const Text('Parolayı kaydet'),
                subtitle: Text(
                  'Kapalıysa her bağlantıda parola sorulur.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: AppColors.danger)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _submit,
            child: Text(_submitLabel),
          ),
        ],
      ),
    );
  }
}

class ConnectServerResult {
  const ConnectServerResult({
    required this.name,
    required this.host,
    required this.port,
    required this.username,
    required this.password,
    required this.savePassword,
  });

  final String name;
  final String host;
  final int port;
  final String username;
  final String password;
  final bool savePassword;

  ServerProfile toProfile({String? id}) {
    return ServerProfile(
      id: id ?? 'local-$host-$username',
      name: name,
      host: host,
      port: port,
      username: username,
      authType: 'password',
      savePassword: savePassword,
      savePassphrase: false,
      hasSavedPassword: password.isNotEmpty,
      hasSavedPassphrase: false,
      hasSavedPrivateKey: false,
      password: password.isEmpty ? null : password,
    );
  }
}
