import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/profile_service.dart';
import '../services/profiles_controller.dart';
import '../services/snippet_service.dart';
import '../services/workspace_controller.dart';
import '../theme/app_theme.dart';
import 'auth_gate_screen.dart';
import 'hosts_screen.dart';
import 'settings_screen.dart';
import 'workspace_screen.dart';

class HomeShellScreen extends StatefulWidget {
  const HomeShellScreen({super.key, required this.authService});

  final AuthService authService;

  @override
  State<HomeShellScreen> createState() => _HomeShellScreenState();
}

class _HomeShellScreenState extends State<HomeShellScreen> {
  static const _hostsTab = 0;
  static const _terminalTab = 1;

  int _index = _hostsTab;
  late final SnippetService _snippetService;
  late final ProfilesController _profiles;
  final WorkspaceController _workspace = WorkspaceController();

  @override
  void initState() {
    super.initState();
    _snippetService = SnippetService(api: widget.authService.api);
    _profiles = ProfilesController(ProfileService(api: widget.authService.api));
  }

  @override
  void dispose() {
    _profiles.dispose();
    _workspace.dispose();
    super.dispose();
  }

  void _goTo(int index) => setState(() => _index = index);

  @override
  Widget build(BuildContext context) {
    final pages = [
      HostsScreen(
        profiles: _profiles,
        workspace: _workspace,
        onSessionOpened: () => _goTo(_terminalTab),
      ),
      WorkspaceScreen(
        workspace: _workspace,
        snippetService: _snippetService,
        onPickServer: () => _goTo(_hostsTab),
      ),
      SettingsScreen(
        authService: widget.authService,
        profiles: _profiles,
        snippetService: _snippetService,
        onLogout: () {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const AuthGateScreen()),
            (_) => false,
          );
        },
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: pages,
      ),
      bottomNavigationBar: ListenableBuilder(
        listenable: _workspace,
        builder: (context, _) {
          final count = _workspace.sessions.length;

          return NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: _goTo,
            backgroundColor: AppColors.card,
            indicatorColor: AppColors.navActive,
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.dns_outlined),
                selectedIcon: Icon(Icons.dns),
                label: 'Sunucular',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: count > 0,
                  label: Text('$count'),
                  child: const Icon(Icons.terminal_outlined),
                ),
                selectedIcon: Badge(
                  isLabelVisible: count > 0,
                  label: Text('$count'),
                  child: const Icon(Icons.terminal),
                ),
                label: 'Terminal',
              ),
              const NavigationDestination(
                icon: Icon(Icons.settings_outlined),
                selectedIcon: Icon(Icons.settings),
                label: 'Ayarlar',
              ),
            ],
          );
        },
      ),
    );
  }
}
