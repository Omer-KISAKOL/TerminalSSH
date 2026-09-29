import 'package:flutter/material.dart';
import 'package:xterm/xterm.dart';

import '../models/server_profile.dart';
import '../services/command_queue.dart';
import '../services/snippet_service.dart';
import '../services/ssh_service.dart';
import '../widgets/snippet_panel.dart';
import '../theme/app_theme.dart';
import '../theme/terminal_theme.dart';

class TerminalScreen extends StatefulWidget {
  const TerminalScreen({
    super.key,
    required this.profile,
    this.snippetService,
  });

  final ServerProfile profile;
  final SnippetService? snippetService;

  @override
  State<TerminalScreen> createState() => _TerminalScreenState();
}

class _TerminalScreenState extends State<TerminalScreen> {
  final _terminal = Terminal();
  final _terminalFocus = FocusNode();
  final _sshService = SshService();
  late final CommandQueue _queue;
  bool _connecting = true;
  bool _snippetPanelOpen = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _queue = CommandQueue(
      onChanged: () {
        if (mounted) setState(() {});
      },
    );
    _queue.bindSend(_sshService.write);
    _connect();
  }

  Future<void> _connect() async {
    try {
      _terminal.write('Bağlanılıyor...\r\n');

      await _sshService.connect(
        host: widget.profile.host,
        port: widget.profile.port,
        username: widget.profile.username,
        password: widget.profile.password ?? '',
        onOutput: (data) {
          _queue.observeOutput(data);
          _terminal.write(data);
        },
        cols: _terminal.viewWidth,
        rows: _terminal.viewHeight,
      );

      _terminal.buffer.clear();
      _terminal.buffer.setCursor(0, 0);

      _terminal.onResize = (width, height, pixelWidth, pixelHeight) {
        _sshService.resizeTerminal(width, height, pixelWidth, pixelHeight);
      };

      _terminal.onOutput = (data) => _queue.handleInput(data);

      setState(() => _connecting = false);
    } catch (error) {
      setState(() {
        _connecting = false;
        _error = error.toString();
      });
    }
  }

  void _applySnippet(String content, {required bool appendNewline}) {
    _queue.handleInput(appendNewline ? '$content\n' : content, autoStart: appendNewline);
  }

  void _toggleSnippets() {
    if (widget.snippetService == null) return;
    setState(() => _snippetPanelOpen = !_snippetPanelOpen);
  }

  @override
  void dispose() {
    _queue.dispose();
    _terminalFocus.dispose();
    _sshService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.terminalBg,
      body: SafeArea(
        child: Column(
          children: [
            _TerminalTabBar(
              title: widget.profile.name,
              onClose: () => Navigator.of(context).pop(),
              onAdd: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: _connecting
                  ? const Center(child: CircularProgressIndicator(color: AppColors.green))
                  : _error != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text(_error!, style: const TextStyle(color: AppColors.green)),
                          ),
                        )
                      : Stack(
                          children: [
                            TerminalView(
                              _terminal,
                              focusNode: _terminalFocus,
                              autofocus: true,
                              theme: greenTerminalTheme,
                              textStyle: greenTerminalStyle,
                              backgroundOpacity: 1,
                            ),
                            if (_queue.phase != CommandQueuePhase.idle)
                              Align(
                                alignment: Alignment.bottomCenter,
                                child: _CommandQueueBanner(
                                  queue: _queue,
                                  onBegin: () {
                                    _queue.begin();
                                    _terminalFocus.requestFocus();
                                  },
                                  onCancel: () {
                                    _queue.cancel();
                                    _terminalFocus.requestFocus();
                                  },
                                  onDropPending: () {
                                    _queue.dropPending();
                                    _terminalFocus.requestFocus();
                                  },
                                ),
                              ),
                          ],
                        ),
            ),
            if (!_connecting && _error == null && _snippetPanelOpen && widget.snippetService != null)
              SnippetPanel(
                snippetService: widget.snippetService!,
                mode: SnippetPanelMode.terminal,
                onApply: _applySnippet,
                compact: true,
                onClose: () => setState(() => _snippetPanelOpen = false),
              ),
            if (!_connecting && _error == null)
              _TerminalToolbar(
                onOpenSnippets: widget.snippetService == null ? null : _toggleSnippets,
                snippetsOpen: _snippetPanelOpen,
              ),
          ],
        ),
      ),
    );
  }
}

class _CommandQueueBanner extends StatelessWidget {
  const _CommandQueueBanner({
    required this.queue,
    required this.onBegin,
    required this.onCancel,
    required this.onDropPending,
  });

  final CommandQueue queue;
  final VoidCallback onBegin;
  final VoidCallback onCancel;
  final VoidCallback onDropPending;

  @override
  Widget build(BuildContext context) {
    final running = queue.phase == CommandQueuePhase.running;

    return Material(
      color: const Color(0xF014161C),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxHeight: 220),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
              child: Text(
                running
                    ? 'Komut çalışıyor. Bitince sıradaki gönderilecek.'
                    : 'Komutlar hazır. Enter ile sırayla çalışır.',
                style: const TextStyle(color: AppColors.greenSoft, fontSize: 12),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (running)
                    TextButton(onPressed: onDropPending, child: const Text('Sırayı iptal et'))
                  else ...[
                    TextButton(onPressed: onCancel, child: const Text('İptal')),
                    FilledButton(onPressed: onBegin, child: const Text('Çalıştır')),
                  ],
                ],
              ),
            ),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                itemCount: queue.lines.length,
                itemBuilder: (context, index) {
                  final active = running && index == queue.activeIndex;
                  final done = running && index < queue.activeIndex;
                  return Text(
                    '${done ? '✓' : active ? '›' : '·'}  ${queue.lines[index]}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: active ? AppColors.green : AppColors.greenSoft,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TerminalTabBar extends StatelessWidget {
  const _TerminalTabBar({
    required this.title,
    required this.onClose,
    required this.onAdd,
  });

  final String title;
  final VoidCallback onClose;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.terminalTabBg,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.terminalBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(color: AppColors.green, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    onPressed: onClose,
                    icon: const Icon(Icons.more_vert, color: AppColors.greenMuted, size: 18),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: onAdd,
            icon: const Icon(Icons.add, color: AppColors.green),
          ),
        ],
      ),
    );
  }
}

class _TerminalToolbar extends StatelessWidget {
  const _TerminalToolbar({
    this.onOpenSnippets,
    this.snippetsOpen = false,
  });

  final VoidCallback? onOpenSnippets;
  final bool snippetsOpen;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.terminalTabBg,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          _ToolChip(
            label: 'Snippet',
            active: snippetsOpen,
            onTap: onOpenSnippets ?? () {},
          ),
        ],
      ),
    );
  }
}

class _ToolChip extends StatelessWidget {
  const _ToolChip({
    required this.label,
    required this.onTap,
    this.active = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.green.withValues(alpha: 0.18) : AppColors.terminalBg,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Text(label, style: const TextStyle(color: AppColors.green, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}
