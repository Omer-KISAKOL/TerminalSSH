import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({
    super.key,
    required this.authService,
    required this.onLogout,
  });

  final AuthService authService;
  final VoidCallback onLogout;

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
            _SettingsTile(
              icon: Icons.person_outline,
              title: 'Hesap',
              subtitle: 'Bulut profil senkronizasyonu aktif',
              onTap: () {},
            ),
            _SettingsTile(
              icon: Icons.sync,
              title: 'Profilleri yenile',
              subtitle: 'Sunucudan son profilleri çek',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Kasalar sekmesinden yenileyebilirsiniz.')),
                );
              },
            ),
            _SettingsTile(
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

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        child: ListTile(
          onTap: onTap,
          leading: Icon(icon, color: AppColors.greenDark),
          title: Text(title, style: Theme.of(context).textTheme.titleMedium),
          subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          trailing: Icon(Icons.chevron_right, color: AppColors.greenMuted.withValues(alpha: 0.7)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}
