import 'package:flutter/material.dart';

import '../models/server_profile.dart';
import '../services/auth_service.dart';
import '../services/profile_service.dart';
import '../services/snippet_service.dart';
import '../theme/app_theme.dart';
import '../widgets/connect_server_sheet.dart';
import '../widgets/host_card.dart';
import 'terminal_screen.dart';

class HostsScreen extends StatefulWidget {
  const HostsScreen({
    super.key,
    required this.authService,
    required this.snippetService,
    this.showConnectionsMode = false,
  });

  final AuthService authService;
  final SnippetService snippetService;
  final bool showConnectionsMode;

  @override
  State<HostsScreen> createState() => _HostsScreenState();
}

class _HostsScreenState extends State<HostsScreen> {
  late final ProfileService _profileService;
  List<ServerProfile> _profiles = [];
  bool _loading = true;
  String? _error;
  String _query = '';

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
      if (!mounted) return;
      setState(() => _profiles = profiles);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<ServerProfile> get _filteredProfiles {
    if (_query.trim().isEmpty) return _profiles;
    final q = _query.toLowerCase();
    return _profiles.where((profile) {
      return profile.name.toLowerCase().contains(q) ||
          profile.host.toLowerCase().contains(q) ||
          profile.username.toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _openTerminal(ServerProfile profile) async {
    ServerProfile resolved = profile;

    if (profile.password == null || profile.password!.isEmpty) {
      final result = await ConnectServerSheet.show(context, profile: profile);
      if (result == null || !mounted) return;
      resolved = result.toProfile(id: profile.id);
    }

    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TerminalScreen(
          profile: resolved,
          snippetService: widget.snippetService,
        ),
      ),
    );
  }

  Future<void> _addServer() async {
    final result = await ConnectServerSheet.show(context);
    if (result == null || !mounted) return;

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TerminalScreen(
          profile: result.toProfile(),
          snippetService: widget.snippetService,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.showConnectionsMode ? 'Bağlantılar' : 'Tüm kasalar';

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: widget.showConnectionsMode
          ? null
          : FloatingActionButton(
              onPressed: _addServer,
              child: const Icon(Icons.add),
            ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadProfiles,
          color: AppColors.green,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Row(
                    children: [
                      if (Navigator.of(context).canPop())
                        IconButton(
                          onPressed: () => Navigator.of(context).maybePop(),
                          icon: const Icon(Icons.arrow_back),
                          color: AppColors.greenDark,
                        ),
                      Expanded(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.shield_outlined, color: AppColors.greenDark, size: 20),
                            const SizedBox(width: 8),
                            Text(title, style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(width: 4),
                            const Icon(Icons.expand_more, color: AppColors.greenMuted, size: 20),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.search),
                        color: AppColors.greenDark,
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.greenDark,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: IconButton(
                          onPressed: () {
                            setState(() {
                              _profiles = [..._profiles]..sort(
                                  (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
                                );
                            });
                          },
                          icon: const Icon(Icons.sort_by_alpha, color: AppColors.greenSoft),
                        ),
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
                    style: const TextStyle(color: AppColors.greenDark),
                    decoration: InputDecoration(
                      hintText: 'Sunucu ara…',
                      prefixIcon: const Icon(Icons.search, color: AppColors.greenMuted),
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
              // if (!widget.showConnectionsMode)
              //   SliverToBoxAdapter(
              //     child: Padding(
              //       padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              //       child: Text('Gruplar', style: Theme.of(context).textTheme.titleMedium),
              //     ),
              //   ),
              // if (!widget.showConnectionsMode)
              //   SliverToBoxAdapter(
              //     child: SizedBox(
              //       height: 92,
              //       child: ListView(
              //         scrollDirection: Axis.horizontal,
              //         padding: const EdgeInsets.symmetric(horizontal: 16),
              //         children: [
              //           _GroupCard(title: 'Production', count: _profiles.length),
              //           const SizedBox(width: 12),
              //           _GroupCard(title: 'Development', count: 0),
              //         ],
              //       ),
              //     ),
              //   ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Text(
                    widget.showConnectionsMode ? 'Aktif oturumlar' : 'Sunucular',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ),
              if (_loading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator(color: AppColors.green)),
                )
              else if (_error != null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_error!, textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          FilledButton(onPressed: _loadProfiles, child: const Text('Tekrar dene')),
                        ],
                      ),
                    ),
                  ),
                )
              else if (_filteredProfiles.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Text(
                      widget.showConnectionsMode
                          ? 'Henüz açık bağlantı yok.'
                          : 'Kayıtlı sunucu bulunamadı.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                  sliver: SliverList.separated(
                    itemCount: _filteredProfiles.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final profile = _filteredProfiles[index];
                      return HostCard(
                        profile: profile,
                        onTap: () => _openTerminal(profile),
                        onLongPress: () async {
                          final result = await ConnectServerSheet.show(context, profile: profile);
                          if (result == null || !mounted) return;
                          await _openTerminal(result.toProfile(id: profile.id));
                        },
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GroupCard extends StatelessWidget {
  const _GroupCard({required this.title, required this.count});

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.greenDark,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.grid_view_rounded, color: AppColors.greenSoft, size: 20),
          ),
          const Spacer(),
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          Text('Sunucu: $count', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
