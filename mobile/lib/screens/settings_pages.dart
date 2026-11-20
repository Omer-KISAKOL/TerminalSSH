import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/profiles_controller.dart';
import '../services/snippet_service.dart';
import '../theme/app_theme.dart';
import '../theme/appearance_themes.dart';
import '../widgets/snippet_panel.dart';

class SettingsTile extends StatelessWidget {
  const SettingsTile({
    super.key,
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
          leading: Icon(icon, color: AppColors.greenSoft),
          title: Text(title, style: Theme.of(context).textTheme.titleMedium),
          subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          trailing: Icon(Icons.chevron_right, color: AppColors.greenMuted.withValues(alpha: 0.7)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}

class _SettingsPageScaffold extends StatelessWidget {
  const _SettingsPageScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(title)),
      body: SafeArea(child: child),
    );
  }
}

// ---------------------------------------------------------------- Hesap

class AccountSettingsPage extends StatefulWidget {
  const AccountSettingsPage({super.key, required this.authService, required this.onLogout});

  final AuthService authService;
  final VoidCallback onLogout;

  @override
  State<AccountSettingsPage> createState() => _AccountSettingsPageState();
}

class _AccountSettingsPageState extends State<AccountSettingsPage> {
  String? _email;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final info = await widget.authService.api.me();
      final user = info['user'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() => _email = user?['email'] as String?);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SettingsPageScaffold(
      title: 'Hesap',
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('E-posta', style: Theme.of(context).textTheme.labelMedium),
                const SizedBox(height: 4),
                Text(
                  _email ?? (_error ?? 'Yükleniyor…'),
                  style: _error != null
                      ? TextStyle(color: AppColors.danger)
                      : Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Text(
                  'Sunucu profilleriniz ve snippet\'leriniz hesabınıza bağlı olarak tüm cihazlarda senkronize edilir.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () async {
              await widget.authService.logout();
              if (!context.mounted) return;
              Navigator.of(context).popUntil((route) => route.isFirst);
              widget.onLogout();
            },
            icon: const Icon(Icons.logout),
            label: const Text('Çıkış yap'),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------- Temalar

class ThemesSettingsPage extends StatelessWidget {
  const ThemesSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return _SettingsPageScaffold(
      title: 'Temalar',
      child: ListenableBuilder(
        listenable: ThemeController.instance,
        builder: (context, _) {
          final selected = ThemeController.instance.theme.id;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Uygulama ve terminal renklerini seçin. Seçim bu cihazda saklanır.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 12),
              for (final theme in appearanceThemes)
                _ThemeCard(
                  theme: theme,
                  selected: theme.id == selected,
                  onTap: () => ThemeController.instance.select(theme.id),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _ThemeCard extends StatelessWidget {
  const _ThemeCard({required this.theme, required this.selected, required this.onTap});

  final AppearanceTheme theme;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: selected ? AppColors.green : AppColors.border,
                width: selected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                // Küçük terminal önizlemesi: tema arka planı + üç renk çubuğu.
                Container(
                  width: 72,
                  height: 48,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.terminalBackground,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: theme.border),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (var i = 0; i < theme.previewBars.length; i += 1)
                        Container(
                          width: [48.0, 34.0, 22.0][i % 3],
                          height: 5,
                          decoration: BoxDecoration(
                            color: theme.previewBars[i],
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(theme.name, style: Theme.of(context).textTheme.titleMedium),
                ),
                if (selected) Icon(Icons.check_circle, color: AppColors.green),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- Sunucu profilleri

class ProfilesSettingsPage extends StatefulWidget {
  const ProfilesSettingsPage({super.key, required this.profiles});

  final ProfilesController profiles;

  @override
  State<ProfilesSettingsPage> createState() => _ProfilesSettingsPageState();
}

class _ProfilesSettingsPageState extends State<ProfilesSettingsPage> {
  bool _exportBusy = false;
  bool _importBusy = false;
  String? _message;
  List<String> _failures = [];
  String? _error;

  bool get _busy => _exportBusy || _importBusy;

  Future<void> _export({required bool includeSecrets}) async {
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
      _message = null;
      _error = null;
      _failures = [];
    });

    try {
      final path = await widget.profiles.service.exportToFile(includeSecrets: includeSecrets);
      if (!mounted) return;
      if (path != null) setState(() => _message = 'Profiller dışa aktarıldı.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _exportBusy = false);
    }
  }

  Future<void> _import() async {
    setState(() {
      _importBusy = true;
      _message = null;
      _error = null;
      _failures = [];
    });

    try {
      final result = await widget.profiles.service.importFromFile();
      if (!mounted || result == null) return;

      setState(() {
        _message = '${result.imported} profil içe aktarıldı.';
        _failures = result.failed;
      });

      if (result.imported > 0) {
        await widget.profiles.refresh();
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _importBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const spinner = SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2));

    return _SettingsPageScaffold(
      title: 'Sunucu profilleri',
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Kayıtlı sunucu bilgilerini JSON dosyası olarak dışa veya içe aktarın. '
            'Masaüstü uygulamasından alınan dosyalar da içe aktarılabilir.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _busy ? null : _import,
            icon: _importBusy ? spinner : const Icon(Icons.file_download_outlined),
            label: const Text('İçe aktar'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _busy ? null : () => _export(includeSecrets: false),
            icon: _exportBusy ? spinner : const Icon(Icons.file_upload_outlined),
            label: const Text('Dışa aktar (güvenli)'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _busy ? null : () => _export(includeSecrets: true),
            icon: const Icon(Icons.key_outlined),
            label: const Text('Dışa aktar (parolalı)'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 16),
            Text(_message!, style: Theme.of(context).textTheme.bodyMedium),
          ],
          if (_failures.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('Aktarılamayanlar:', style: TextStyle(color: AppColors.danger)),
            for (final failure in _failures)
              Text('• $failure', style: Theme.of(context).textTheme.bodySmall),
          ],
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(_error!, style: TextStyle(color: AppColors.danger)),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------- Snippet'ler

class SnippetsSettingsPage extends StatelessWidget {
  const SnippetsSettingsPage({super.key, required this.snippetService});

  final SnippetService snippetService;

  @override
  Widget build(BuildContext context) {
    return _SettingsPageScaffold(
      title: 'Snippet\'ler',
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Tüm sunucularda paylaşılan komut ve metin parçaları. Sıralamak için tutamaçtan sürükleyin.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          SnippetPanel(
            snippetService: snippetService,
            mode: SnippetPanelMode.settings,
          ),
        ],
      ),
    );
  }
}
