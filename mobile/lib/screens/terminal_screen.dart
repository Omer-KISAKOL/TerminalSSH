import 'package:flutter/material.dart';
import 'package:xterm/xterm.dart';

import '../models/server_profile.dart';
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
  final _sshService = SshService();
  bool _connecting = true;
  bool _snippetPanelOpen = false;
  String? _error;

  @override
  void initState() {
    super.initState();
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
        onOutput: _terminal.write,
        cols: _terminal.viewWidth,
        rows: _terminal.viewHeight,
      );

      _terminal.buffer.clear();
      _terminal.buffer.setCursor(0, 0);

      _terminal.onResize = (width, height, pixelWidth, pixelHeight) {
        _sshService.resizeTerminal(width, height, pixelWidth, pixelHeight);
      };

      _terminal.onOutput = _sshService.write;

      setState(() => _connecting = false);
    } catch (error) {
      setState(() {
        _connecting = false;
        _error = error.toString();
      });
    }
  }

  void _sendCtrl(String key) {
    _sshService.write(String.fromCharCode(key.codeUnitAt(0) - 96));
  }

  void _applySnippet(String content, {required bool appendNewline}) {
    _sshService.write(appendNewline ? '$content\n' : content);
  }

  void _toggleSnippets() {
    if (widget.snippetService == null) return;
    setState(() => _snippetPanelOpen = !_snippetPanelOpen);
  }

  @override
  void dispose() {
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
                      : TerminalView(
                          _terminal,
                          autofocus: true,
                          theme: greenTerminalTheme,
                          textStyle: greenTerminalStyle,
                          backgroundOpacity: 1,
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
                onCtrl: _sendCtrl,
                onInsert: _sshService.write,
                onOpenSnippets: widget.snippetService == null ? null : _toggleSnippets,
                snippetsOpen: _snippetPanelOpen,
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
    required this.onCtrl,
    required this.onInsert,
    this.onOpenSnippets,
    this.snippetsOpen = false,
  });

  final void Function(String key) onCtrl;
  final void Function(String data) onInsert;
  final VoidCallback? onOpenSnippets;
  final bool snippetsOpen;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.terminalTabBg,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _ToolChip(icon: Icons.touch_app_outlined, onTap: () {}),
            _ToolChip(icon: Icons.auto_fix_high_outlined, onTap: () {}),
            _ToolChip(label: '***', onTap: () => onInsert('***')),
            _ToolChip(
              label: '{}',
              active: snippetsOpen,
              onTap: onOpenSnippets ?? () => onInsert('{}'),
            ),
            _ToolChip(icon: Icons.folder_outlined, onTap: () {}),
            _ToolChip(
              label: 'Ctrl',
              onTap: () {},
              onLongPress: () => onCtrl('c'),
            ),
            _ToolChip(icon: Icons.more_horiz, onTap: () {}),
          ],
        ),
      ),
    );
  }
}

class _ToolChip extends StatelessWidget {
  const _ToolChip({
    this.icon,
    this.label,
    required this.onTap,
    this.onLongPress,
    this.active = false,
  });

  final IconData? icon;
  final String? label;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: active ? AppColors.green.withValues(alpha: 0.18) : AppColors.terminalBg,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          onLongPress: onLongPress,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: icon != null
                ? Icon(icon, color: AppColors.green, size: 20)
                : Text(label!, style: const TextStyle(color: AppColors.green, fontWeight: FontWeight.w600)),
          ),
        ),
      ),
    );
  }
}
