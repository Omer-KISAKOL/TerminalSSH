import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/profile_service.dart';
import '../services/snippet_service.dart';
import '../theme/app_theme.dart';
import '../widgets/snippet_panel.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.authService,
    required this.profileService,
    required this.snippetService,
    required this.onLogout,
  });

  final AuthService authService;
  final ProfileService profileService;
  final SnippetService snippetService;
  final VoidCallback onLogout;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _exportBusy = false;
  bool _importBusy = false;
  String? _profileMessage;
  String? _profileError;

  Future<void> _exportProfiles({required bool includeSecrets}) async {
    if (includeSecrets) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Parolalı dışa aktarma'),
          content: const Text(
            'Parola ve özel anahtarlar JSON dosyasına düz metin olarak yazılır. Devam etmek istiyor musunuz?',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('İptal')),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Devam')),
          ],
        ),
      );

      if (confirmed != true || !mounted) return;
    }

    setState(() {
      _exportBusy = true;
      _profileMessage = null;
      _profileError = null;
    });

    try {
      final path = await widget.profileService.exportToFile(includeSecrets: includeSecrets);
      if (!mounted) return;

      if (path == null) {
        return;
      }

      setState(() => _profileMessage = 'Profiller dışa aktarıldı: $path');
    } catch (error) {
      if (!mounted) return;
      setState(() => _profileError = error.toString());
    } finally {
      if (mounted) setState(() => _exportBusy = false);
    }
  }

  Future<void> _importProfiles() async {
    setState(() {
      _importBusy = true;
      _profileMessage = null;
      _profileError = null;
    });

    try {
      final count = await widget.profileService.importFromFile();
      if (!mounted) return;

      if (count == 0) {
        return;
      }

      setState(() => _profileMessage = '$count profil içe aktarıldı.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _profileError = error.toString());
    } finally {
      if (mounted) setState(() => _importBusy = false);
    }
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
            _SettingsTile(
              icon: Icons.person_outline,
              title: 'Hesap',
              subtitle: 'Bulut profil senkronizasyonu aktif',
              onTap: () {},
            ),
            const SizedBox(height: 8),
            Text('Sunucu profilleri', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Kayıtlı sunucu bilgilerini JSON dosyası olarak dışa veya içe aktarın.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton(
                  onPressed: _exportBusy || _importBusy ? null : () => _exportProfiles(includeSecrets: false),
                  child: _exportBusy
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Dışa aktar (güvenli)'),
                ),
                OutlinedButton(
                  onPressed: _exportBusy || _importBusy ? null : () => _exportProfiles(includeSecrets: true),
                  child: const Text('Dışa aktar (parolalı)'),
                ),
                FilledButton(
                  onPressed: _exportBusy || _importBusy ? null : _importProfiles,
                  child: _importBusy
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('İçe aktar'),
                ),
              ],
            ),
            if (_profileMessage != null) ...[
              const SizedBox(height: 12),
              Text(_profileMessage!, style: Theme.of(context).textTheme.bodyMedium),
            ],
            if (_profileError != null) ...[
              const SizedBox(height: 12),
              Text(_profileError!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 24),
            Text('Snippet\'ler', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Tüm sunucularda paylaşılan komut ve metin parçaları.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            SnippetPanel(
              snippetService: widget.snippetService,
              mode: SnippetPanelMode.settings,
            ),
            const SizedBox(height: 16),
            _SettingsTile(
              icon: Icons.logout,
              title: 'Çıkış yap',
              subtitle: 'Oturumu kapat',
              onTap: () async {
                await widget.authService.logout();
                if (context.mounted) widget.onLogout();
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
