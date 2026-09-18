import 'package:flutter/material.dart';

import '../models/server_profile.dart';
import '../services/auth_service.dart';
import '../services/profile_service.dart';
import 'auth_gate_screen.dart';
import 'terminal_screen.dart';

class ProfilesScreen extends StatefulWidget {
  const ProfilesScreen({super.key, required this.authService});

  final AuthService authService;

  @override
  State<ProfilesScreen> createState() => _ProfilesScreenState();
}

class _ProfilesScreenState extends State<ProfilesScreen> {
  late final ProfileService _profileService;
  List<ServerProfile> _profiles = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _profileService = ProfileService(api: widget.authService.api);
    _loadProfiles();
  }

  Future<void> _loadProfiles() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final profiles = await _profileService.syncProfiles();
      setState(() => _profiles = profiles);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sunucular'),
        actions: [
          IconButton(onPressed: _loadProfiles, icon: const Icon(Icons.sync)),
          IconButton(
            onPressed: () async {
              await widget.authService.logout();
              if (!context.mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const AuthGateScreen()),
                (_) => false,
              );
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : ListView.builder(
                  itemCount: _profiles.length,
                  itemBuilder: (context, index) {
                    final profile = _profiles[index];
                    return ListTile(
                      title: Text(profile.name),
                      subtitle: Text('${profile.username}@${profile.host}:${profile.port}'),
                      onTap: profile.password == null
                          ? null
                          : () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => TerminalScreen(profile: profile),
                                ),
                              );
                            },
                    );
                  },
                ),
    );
  }
}
