import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/profiles_controller.dart';
import '../services/snippet_service.dart';
import '../theme/appearance_themes.dart';
import '../theme/app_theme.dart';
import 'settings_pages.dart';

/// Masaüstündeki ayarlar penceresindeki bölümlerin menü olarak karşılığı.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({
    super.key,
    required this.authService,
    required this.profiles,
    required this.snippetService,
    required this.onLogout,
  });

  final AuthService authService;
  final ProfilesController profiles;
  final SnippetService snippetService;
  final VoidCallback onLogout;

  void _open(BuildContext context, Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Ayarlar', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            SettingsTile(
              icon: Icons.person_outline,
              title: 'Hesap',
              subtitle: 'Oturum ve bulut senkronizasyonu',
              onTap: () => _open(
                context,
                AccountSettingsPage(authService: authService, onLogout: onLogout),
              ),
            ),
            SettingsTile(
              icon: Icons.palette_outlined,
              title: 'Temalar',
              subtitle: ThemeController.instance.theme.name,
              onTap: () => _open(context, const ThemesSettingsPage()),
            ),
            SettingsTile(
              icon: Icons.swap_vert,
              title: 'Sunucu profilleri',
              subtitle: 'JSON olarak içe veya dışa aktar',
              onTap: () => _open(context, ProfilesSettingsPage(profiles: profiles)),
            ),
            SettingsTile(
              icon: Icons.data_object,
              title: 'Snippet\'ler',
              subtitle: 'Tüm sunucularda paylaşılan komutlar',
              onTap: () => _open(context, SnippetsSettingsPage(snippetService: snippetService)),
            ),
            SettingsTile(
              icon: Icons.logout,
              title: 'Çıkış yap',
              subtitle: 'Oturumu kapat',
              onTap: () async {
                await authService.logout();
                if (context.mounted) onLogout();
              },
            ),
          ],
        ),
      ),
    );
  }
}
