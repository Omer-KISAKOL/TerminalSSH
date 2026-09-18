import 'package:flutter/material.dart';

import '../models/snippet.dart';
import '../theme/app_theme.dart';

class SnippetEditorSheet extends StatefulWidget {
  const SnippetEditorSheet({
    super.key,
    this.snippet,
  });

  final Snippet? snippet;

  static Future<SnippetEditorResult?> show(BuildContext context, {Snippet? snippet}) {
    return showModalBottomSheet<SnippetEditorResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: SnippetEditorSheet(snippet: snippet),
      ),
    );
  }

  @override
  State<SnippetEditorSheet> createState() => _SnippetEditorSheetState();
}

class _SnippetEditorSheetState extends State<SnippetEditorSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _contentController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.snippet?.name ?? '');
    _contentController = TextEditingController(text: widget.snippet?.content ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  void _submit() {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      return;
    }

    Navigator.of(context).pop(
      SnippetEditorResult(
        id: widget.snippet?.id,
        name: name,
        content: _contentController.text,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.snippet == null ? 'Yeni snippet' : 'Snippet düzenle',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Ad'),
            autofocus: true,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _contentController,
            decoration: const InputDecoration(labelText: 'İçerik'),
            minLines: 3,
            maxLines: 8,
            style: const TextStyle(fontFamily: 'monospace'),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _submit,
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
  }
}

class SnippetEditorResult {
  const SnippetEditorResult({
    this.id,
    required this.name,
    required this.content,
  });

  final String? id;
  final String name;
  final String content;
}
