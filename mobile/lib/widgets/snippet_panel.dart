import 'package:flutter/material.dart';

import '../models/snippet.dart';
import '../services/snippet_service.dart';
import '../theme/app_theme.dart';
import 'snippet_editor_sheet.dart';

enum SnippetPanelMode { settings, terminal }

class SnippetPanel extends StatefulWidget {
  const SnippetPanel({
    super.key,
    required this.snippetService,
    this.mode = SnippetPanelMode.settings,
    this.onApply,
    this.onClose,
    this.compact = false,
  });

  final SnippetService snippetService;
  final SnippetPanelMode mode;
  final void Function(String content, {required bool appendNewline})? onApply;
  final VoidCallback? onClose;
  final bool compact;

  @override
  State<SnippetPanel> createState() => _SnippetPanelState();
}

class _SnippetPanelState extends State<SnippetPanel> {
  List<Snippet> _snippets = [];
  bool _loading = true;
  String? _error;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _loadSnippets();
  }

  Future<void> _loadSnippets() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final snippets = await widget.snippetService.listSnippets();
      if (!mounted) return;
      setState(() => _snippets = snippets);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Snippet> get _filteredSnippets {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return _snippets;
    return _snippets.where((snippet) {
      return snippet.name.toLowerCase().contains(q) ||
          snippet.content.toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _openEditor({Snippet? snippet}) async {
    final result = await SnippetEditorSheet.show(context, snippet: snippet);
    if (result == null || !mounted) return;

    await widget.snippetService.saveSnippet(
      id: result.id,
      name: result.name,
      content: result.content,
    );
    await _loadSnippets();
  }

  Future<void> _deleteSnippet(Snippet snippet) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Snippet sil'),
        content: Text('"${snippet.name}" snippet\'ini silmek istiyor musunuz?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('İptal')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sil')),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    await widget.snippetService.deleteSnippet(snippet.id);
    await _loadSnippets();
  }

  @override
  Widget build(BuildContext context) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.compact)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 8, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text('Snippet\'ler', style: Theme.of(context).textTheme.titleMedium),
                ),
                if (widget.onClose != null)
                  IconButton(
                    onPressed: widget.onClose,
                    icon: const Icon(Icons.close),
                    color: AppColors.greenMuted,
                  ),
              ],
            ),
          ),
        Padding(
          padding: EdgeInsets.fromLTRB(20, widget.compact ? 12 : 0, 20, 12),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _openEditor(),
                  icon: const Text('{}', style: TextStyle(fontWeight: FontWeight.w700)),
                  label: const Text('Yeni Snippet'),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: TextField(
            onChanged: (value) => setState(() => _query = value),
            decoration: const InputDecoration(
              hintText: 'Snippet ara…',
              prefixIcon: Icon(Icons.search),
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (_loading)
          const Expanded(
            child: Center(child: CircularProgressIndicator(color: AppColors.green)),
          )
        else if (_error != null)
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton(onPressed: _loadSnippets, child: const Text('Tekrar dene')),
                  ],
                ),
              ),
            ),
          )
        else if (_filteredSnippets.isEmpty)
          const Expanded(
            child: Center(child: Text('Henüz snippet yok.')),
          )
        else
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              itemCount: _filteredSnippets.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final snippet = _filteredSnippets[index];
                return _SnippetCard(
                  snippet: snippet,
                  mode: widget.mode,
                  onRun: widget.onApply == null
                      ? null
                      : () => widget.onApply!(snippet.content, appendNewline: true),
                  onPaste: widget.onApply == null
                      ? null
                      : () => widget.onApply!(snippet.content, appendNewline: false),
                  onEdit: () => _openEditor(snippet: snippet),
                  onDelete: () => _deleteSnippet(snippet),
                );
              },
            ),
          ),
      ],
    );

    if (widget.compact) {
      return Container(
        height: 320,
        decoration: const BoxDecoration(
          color: AppColors.card,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: content,
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: SizedBox(height: 360, child: content),
    );
  }
}

class _SnippetCard extends StatelessWidget {
  const _SnippetCard({
    required this.snippet,
    required this.mode,
    required this.onEdit,
    required this.onDelete,
    this.onRun,
    this.onPaste,
  });

  final Snippet snippet;
  final SnippetPanelMode mode;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback? onRun;
  final VoidCallback? onPaste;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('{}', style: TextStyle(color: AppColors.greenMuted, fontWeight: FontWeight.w700)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  snippet.name,
                  style: Theme.of(context).textTheme.titleSmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (mode == SnippetPanelMode.terminal) ...[
                TextButton(onPressed: onRun, child: const Text('RUN')),
                TextButton(onPressed: onPaste, child: const Text('PASTE')),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Text(
            snippet.content,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontFamily: 'monospace'),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              OutlinedButton(onPressed: onEdit, child: const Text('Düzenle')),
              const SizedBox(width: 8),
              TextButton(onPressed: onDelete, child: const Text('Sil')),
            ],
          ),
        ],
      ),
    );
  }
}
