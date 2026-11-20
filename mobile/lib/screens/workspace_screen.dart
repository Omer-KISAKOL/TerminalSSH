import 'package:flutter/material.dart';

import '../services/snippet_service.dart';
import '../services/workspace_controller.dart';
import '../theme/app_theme.dart';
import 'terminal_screen.dart';

/// Açık sunucu oturumlarını masaüstündeki gibi sekmeler halinde gösterir.
class WorkspaceScreen extends StatelessWidget {
  const WorkspaceScreen({
    super.key,
    required this.workspace,
    required this.snippetService,
    required this.onPickServer,
  });

  final WorkspaceController workspace;
  final SnippetService snippetService;

  /// Yeni sekme için Sunucular ekranına geçer.
  final VoidCallback onPickServer;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: workspace,
      builder: (context, _) {
        final sessions = workspace.sessions;

        if (sessions.isEmpty) {
          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.terminal, size: 48, color: AppColors.greenMuted),
                      const SizedBox(height: 12),
                      Text('Açık oturum yok', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 4),
                      Text(
                        'Bir sunucuya bağlandığınızda burada sekme olarak açılır.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: onPickServer,
                        icon: const Icon(Icons.dns_outlined),
                        label: const Text('Sunucu seç'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        final activeIndex = workspace.activeIndex < 0 ? 0 : workspace.activeIndex;

        return Scaffold(
          backgroundColor: AppColors.terminalBg,
          body: SafeArea(
            child: Column(
              children: [
                _TabBar(workspace: workspace, onAdd: onPickServer),
                Expanded(
                  child: IndexedStack(
                    index: activeIndex,
                    children: [
                      for (final session in sessions)
                        TerminalPanel(
                          key: ValueKey(session.id),
                          profile: session.profile,
                          snippetService: snippetService,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.workspace, required this.onAdd});

  final WorkspaceController workspace;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.terminalTabBg,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final session in workspace.sessions)
                    _Tab(
                      title: session.title,
                      active: session.id == workspace.activeId,
                      onTap: () => workspace.select(session.id),
                      onClose: () => workspace.close(session.id),
                    ),
                ],
              ),
            ),
          ),
          IconButton(
            tooltip: 'Yeni sekme',
            onPressed: onAdd,
            icon: Icon(Icons.add, color: AppColors.green),
          ),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({
    required this.title,
    required this.active,
    required this.onTap,
    required this.onClose,
  });

  final String title;
  final bool active;
  final VoidCallback onTap;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: Material(
        color: active ? AppColors.terminalBg : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 180),
            padding: const EdgeInsets.only(left: 12, right: 2),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: active ? AppColors.green.withValues(alpha: 0.6) : AppColors.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: active ? AppColors.green : AppColors.textMuted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Sekmeyi kapat',
                  onPressed: onClose,
                  icon: Icon(Icons.close, size: 16, color: AppColors.textMuted),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 36),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
