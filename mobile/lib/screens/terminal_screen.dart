import 'package:flutter/material.dart';
import 'package:xterm/xterm.dart';

import '../models/server_profile.dart';
import '../services/command_queue.dart';
import '../services/snippet_service.dart';
import '../services/ssh_service.dart';
import '../theme/app_theme.dart';
import '../theme/terminal_theme.dart';
import '../widgets/snippet_panel.dart';

/// Tek bir SSH oturumunun terminal içeriği. Sekme çubuğunu çalışma alanı çizer;
/// bu widget sekme gizlendiğinde de bağlı kalır (IndexedStack içinde).
class TerminalPanel extends StatefulWidget {
  const TerminalPanel({
    super.key,
    required this.profile,
    this.snippetService,
  });

  final ServerProfile profile;
  final SnippetService? snippetService;

  @override
  State<TerminalPanel> createState() => _TerminalPanelState();
}

class _TerminalPanelState extends State<TerminalPanel> {
  final _terminal = Terminal();
  final _terminalFocus = FocusNode();
  SshService _sshService = SshService();
  late final CommandQueue _queue;
  bool _connecting = true;
  bool _snippetPanelOpen = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _queue = CommandQueue(
      // nano/vim gibi alternatif ekran kullanan uygulamalarda girdi kuyruğa alınmaz.
      shouldBypass: () => _terminal.isUsingAltBuffer,
      onChanged: () {
        if (mounted) setState(() {});
      },
    );
    _queue.bindSend((data) => _sshService.write(data));
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

      if (mounted) setState(() => _connecting = false);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _connecting = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _reconnect() async {
    await _sshService.disconnect();
    _sshService = SshService();
    _queue.cancel();
    _terminal.buffer.clear();
    _terminal.buffer.setCursor(0, 0);

    setState(() {
      _connecting = true;
      _error = null;
    });

    await _connect();
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
    final snippetService = widget.snippetService;

    return Column(
      children: [
        Expanded(
          child: _connecting
              ? Center(child: CircularProgressIndicator(color: AppColors.green))
              : _error != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _error!,
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppColors.danger),
                            ),
                            const SizedBox(height: 16),
                            FilledButton.icon(
                              onPressed: _reconnect,
                              icon: const Icon(Icons.refresh),
                              label: const Text('Yeniden bağlan'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Container(
                      color: AppColors.terminalBg,
                      child: Stack(
                        children: [
                          TerminalView(
                            _terminal,
                            focusNode: _terminalFocus,
                            autofocus: true,
                            theme: buildTerminalTheme(),
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
        ),
        if (!_connecting && _error == null && _snippetPanelOpen && snippetService != null)
          SnippetPanel(
            snippetService: snippetService,
            mode: SnippetPanelMode.terminal,
            onApply: _applySnippet,
            compact: true,
            onClose: () => setState(() => _snippetPanelOpen = false),
          ),
        // Snippet servisi yoksa hiçbir işlevi olmayan çubuk gösterilmez.
        if (!_connecting && _error == null && snippetService != null)
          _TerminalToolbar(
            onOpenSnippets: _toggleSnippets,
            snippetsOpen: _snippetPanelOpen,
          ),
      ],
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
      color: AppColors.card.withValues(alpha: 0.96),
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
                style: TextStyle(color: AppColors.greenSoft, fontSize: 12),
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
                    '${done ? '✓' : active ? '›' : '·'}  ${queue.lines[index].replaceAll('\n', ' ⏎ ')}',
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

class _TerminalToolbar extends StatelessWidget {
  const _TerminalToolbar({
    required this.onOpenSnippets,
    required this.snippetsOpen,
  });

  final VoidCallback onOpenSnippets;
  final bool snippetsOpen;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.terminalTabBg,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          Material(
            color: snippetsOpen ? AppColors.green.withValues(alpha: 0.18) : AppColors.terminalBg,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              onTap: onOpenSnippets,
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Text(
                  'Snippet',
                  style: TextStyle(color: AppColors.green, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
