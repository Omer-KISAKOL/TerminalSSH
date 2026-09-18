import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'auth_gate_screen.dart';
import 'hosts_screen.dart';
import 'settings_screen.dart';

class HomeShellScreen extends StatefulWidget {
  const HomeShellScreen({super.key, required this.authService});

  final AuthService authService;

  @override
  State<HomeShellScreen> createState() => _HomeShellScreenState();
}

class _HomeShellScreenState extends State<HomeShellScreen> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      HostsScreen(authService: widget.authService),
      HostsScreen(authService: widget.authService, showConnectionsMode: true),
      SettingsScreen(
        authService: widget.authService,
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
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        backgroundColor: AppColors.card,
        indicatorColor: AppColors.navActive,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Kasalar',
          ),
          NavigationDestination(
            icon: Icon(Icons.link_outlined),
            selectedIcon: Icon(Icons.link),
            label: 'Bağlantılar',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Ayarlar',
          ),
        ],
      ),
    );
  }
}
