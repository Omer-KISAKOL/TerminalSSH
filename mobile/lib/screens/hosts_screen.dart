import 'package:flutter/material.dart';

import '../models/server_profile.dart';
import '../services/profiles_controller.dart';
import '../services/workspace_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/connect_server_sheet.dart';
import '../widgets/host_card.dart';

class HostsScreen extends StatefulWidget {
  const HostsScreen({
    super.key,
    required this.profiles,
    required this.workspace,
    required this.onSessionOpened,
  });

  final ProfilesController profiles;
  final WorkspaceController workspace;

  /// Yeni sekme açıldığında terminal ekranına geçmek için çağrılır.
  final VoidCallback onSessionOpened;

  @override
  State<HostsScreen> createState() => _HostsScreenState();
}

class _HostsScreenState extends State<HostsScreen> {
  String _query = '';

  @override
  void initState() {
    super.initState();
    widget.profiles.refresh();
  }

  List<ServerProfile> _filtered(List<ServerProfile> profiles) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return profiles;
    return profiles.where((profile) {
      return profile.name.toLowerCase().contains(q) ||
          profile.host.toLowerCase().contains(q) ||
          profile.username.toLowerCase().contains(q);
    }).toList();
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  String _clean(Object error) => error.toString().replaceFirst('Exception: ', '');

  void _openSession(ServerProfile profile) {
    widget.workspace.open(profile);
    widget.onSessionOpened();
  }

  Future<void> _connect(ServerProfile profile) async {
    var resolved = profile;

    if (profile.password == null || profile.password!.isEmpty) {
      final result = await ConnectServerSheet.show(
        context,
        profile: profile,
        mode: ServerSheetMode.connect,
      );
      if (result == null || !mounted) return;
      resolved = result.toProfile(id: profile.id);
    }

    _openSession(resolved);
  }

  Future<void> _addServer() async {
    final result = await ConnectServerSheet.show(context);
    if (result == null || !mounted) return;

    try {
      final created = await widget.profiles.add(
        name: result.name,
        host: result.host,
        port: result.port,
        username: result.username,
        savePassword: result.savePassword,
        password: result.password,
      );
      if (!mounted) return;
      _openSession(result.toProfile(id: created.id));
    } catch (error) {
      _showMessage(_clean(error));
    }
  }

  Future<void> _editServer(ServerProfile profile) async {
    final result = await ConnectServerSheet.show(
      context,
      profile: profile,
      mode: ServerSheetMode.edit,
    );
    if (result == null || !mounted) return;

    try {
      await widget.profiles.update(
        profile,
        name: result.name,
        host: result.host,
        port: result.port,
        username: result.username,
        savePassword: result.savePassword,
        password: result.password,
      );
      _showMessage('Sunucu güncellendi.');
    } catch (error) {
      _showMessage(_clean(error));
    }
  }

  Future<void> _deleteServer(ServerProfile profile) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sunucuyu sil'),
        content: Text('"${profile.name}" sunucusunu silmek istiyor musunuz? Bu işlem geri alınamaz.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('İptal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await widget.profiles.remove(profile);
      widget.workspace.closeForProfile(profile.id);
      _showMessage('Sunucu silindi.');
    } catch (error) {
      _showMessage(_clean(error));
    }
  }

  void _onAction(ServerProfile profile, HostAction action) {
    switch (action) {
      case HostAction.connect:
        _connect(profile);
      case HostAction.edit:
        _editServer(profile);
      case HostAction.delete:
        _deleteServer(profile);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.profiles,
      builder: (context, _) {
        final controller = widget.profiles;
        final profiles = _filtered(controller.profiles);

        return Scaffold(
          backgroundColor: AppColors.background,
          floatingActionButton: FloatingActionButton(
            tooltip: 'Sunucu ekle',
            onPressed: _addServer,
            child: const Icon(Icons.add),
          ),
          body: SafeArea(
            child: RefreshIndicator(
              onRefresh: controller.refresh,
              color: AppColors.green,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
                      child: Row(
                        children: [
                          Icon(Icons.dns_outlined, color: AppColors.greenSoft, size: 22),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text('Sunucular', style: Theme.of(context).textTheme.titleLarge),
                          ),
                          IconButton(
                            tooltip: 'Ada göre sırala',
                            onPressed: controller.sortByName,
                            icon: Icon(Icons.sort_by_alpha, color: AppColors.greenSoft),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: TextField(
                        onChanged: (value) => setState(() => _query = value),
                        style: TextStyle(color: AppColors.text),
                        decoration: InputDecoration(
                          hintText: 'Sunucu ara…',
                          prefixIcon: Icon(Icons.search, color: AppColors.greenMuted),
                          filled: true,
                          fillColor: AppColors.card,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (controller.loading && controller.profiles.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(child: CircularProgressIndicator(color: AppColors.green)),
                    )
                  else if (controller.error != null && controller.profiles.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(controller.error!, textAlign: TextAlign.center),
                              const SizedBox(height: 12),
                              FilledButton(onPressed: controller.refresh, child: const Text('Tekrar dene')),
                            ],
                          ),
                        ),
                      ),
                    )
                  else if (profiles.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Text(
                          'Kayıtlı sunucu bulunamadı.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                      sliver: SliverList.separated(
                        itemCount: profiles.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final profile = profiles[index];
                          return HostCard(
                            profile: profile,
                            onTap: () => _connect(profile),
                            onAction: (action) => _onAction(profile, action),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
