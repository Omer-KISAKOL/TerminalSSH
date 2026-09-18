import 'package:flutter/material.dart';

import '../models/server_profile.dart';
import '../theme/app_theme.dart';
import 'password_field.dart';

class ConnectServerSheet extends StatefulWidget {
  const ConnectServerSheet({
    super.key,
    this.profile,
  });

  final ServerProfile? profile;

  static Future<ConnectServerResult?> show(
    BuildContext context, {
    ServerProfile? profile,
  }) {
    return showModalBottomSheet<ConnectServerResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ConnectServerSheet(profile: profile),
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

  @override
  void initState() {
    super.initState();
    final profile = widget.profile;
    _nameController = TextEditingController(text: profile?.name ?? '');
    _hostController = TextEditingController(text: profile?.host ?? '');
    _portController = TextEditingController(text: '${profile?.port ?? 22}');
    _usernameController = TextEditingController(text: profile?.username ?? '');
    _passwordController = TextEditingController(text: profile?.password ?? '');
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

  void _submit() {
    final port = int.tryParse(_portController.text.trim()) ?? 22;
    Navigator.of(context).pop(
      ConnectServerResult(
        name: _nameController.text.trim().isEmpty ? _hostController.text.trim() : _nameController.text.trim(),
        host: _hostController.text.trim(),
        port: port,
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.profile == null ? 'Sunucu ekle' : 'Sunucuya bağlan',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Sunucu adı'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _hostController,
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
                  decoration: const InputDecoration(labelText: 'Kullanıcı'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          PasswordField(
            controller: _passwordController,
            labelText: 'SSH parolası',
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _submit,
            child: Text(widget.profile == null ? 'Kaydet ve bağlan' : 'Bağlan'),
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
  });

  final String name;
  final String host;
  final int port;
  final String username;
  final String password;

  ServerProfile toProfile({String? id}) {
    return ServerProfile(
      id: id ?? 'local-$host-$username',
      name: name,
      host: host,
      port: port,
      username: username,
      authType: 'password',
      savePassword: false,
      savePassphrase: false,
      hasSavedPassword: password.isNotEmpty,
      hasSavedPassphrase: false,
      hasSavedPrivateKey: false,
      password: password.isEmpty ? null : password,
    );
  }
}
