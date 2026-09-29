import 'dart:async';

enum CommandQueuePhase { idle, preview, running }

final _ansiPattern = RegExp('\u001B\\[[0-9;?]*[ -/]*[@-~]');
final _promptPattern = RegExp(r'(?:\$|#|%|❯|➜)\s*$');
final _anglePromptPattern = RegExp(r'(?:PS [A-Za-z]:|[@:~\\/].*)>\s*$');

List<String>? splitPastedCommands(String text) {
  if (text == '\r' || text == '\n' || text == '\r\n') {
    return null;
  }

  final normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  if (!normalized.contains('\n')) {
    return null;
  }

  final rawLines = normalized.split('\n');
  if (rawLines.isNotEmpty && rawLines.last.isEmpty) {
    rawLines.removeLast();
  }

  final lines = rawLines
      .map((line) => line.replaceAll(RegExp(r'\s+$'), ''))
      .where((line) => line.trim().isNotEmpty)
      .toList();

  if (lines.length <= 1) {
    return null;
  }

  return lines;
}

String stripAnsi(String value) => value.replaceAll(_ansiPattern, '');

String lastVisibleLine(String raw) {
  final rows = stripAnsi(raw).split('\n');

  for (var index = rows.length - 1; index >= 0; index -= 1) {
    final parts = rows[index].split('\r');
    final visible = parts.isEmpty ? '' : parts.last;
    if (visible.trim().isNotEmpty) {
      return visible.replaceAll(RegExp(r'\s+$'), '');
    }
  }

  return '';
}

bool isShellPrompt(String line) {
  final trimmed = line.trim();
  if (trimmed.isEmpty || trimmed.length > 160) {
    return false;
  }

  return _promptPattern.hasMatch(trimmed) || _anglePromptPattern.hasMatch(trimmed);
}

class CommandQueue {
  CommandQueue({this.onChanged});

  final void Function()? onChanged;

  CommandQueuePhase phase = CommandQueuePhase.idle;
  List<String> lines = [];
  int activeIndex = 0;

  String _output = '';
  bool _sawNewline = false;
  Timer? _idleTimer;
  void Function(String data)? _send;

  void bindSend(void Function(String data) send) {
    _send = send;
  }

  void handleInput(String data, {bool autoStart = false}) {
    final pasted = splitPastedCommands(data);

    if (pasted != null) {
      if (phase == CommandQueuePhase.running) {
        lines = [...lines, ...pasted];
        _emit();
        return;
      }

      lines = pasted;
      activeIndex = 0;

      if (autoStart) {
        phase = CommandQueuePhase.running;
        _emit();
        _dispatchCurrent();
        return;
      }

      phase = CommandQueuePhase.preview;
      _emit();
      return;
    }

    if (phase == CommandQueuePhase.preview) {
      if (RegExp(r'^[\r\n]+$').hasMatch(data)) {
        begin();
        return;
      }

      if (data == '\u001b' || data == '\u0003') {
        cancel();
      }

      return;
    }

    if (phase == CommandQueuePhase.running && data == '\u0003') {
      lines = lines.take(activeIndex + 1).toList();
      _send?.call(data);
      _emit();
      return;
    }

    _send?.call(data);
  }

  void observeOutput(String data) {
    if (phase != CommandQueuePhase.running || data.isEmpty) {
      return;
    }

    _output = '$_output$data';
    if (_output.length > 12000) {
      _output = _output.substring(_output.length - 12000);
    }

    if (data.contains('\n')) {
      _sawNewline = true;
    }

    _armIdle();
  }

  void begin() {
    if (phase != CommandQueuePhase.preview || lines.isEmpty) {
      return;
    }

    phase = CommandQueuePhase.running;
    activeIndex = 0;
    _dispatchCurrent();
  }

  void cancel() {
    _idleTimer?.cancel();
    phase = CommandQueuePhase.idle;
    lines = [];
    activeIndex = 0;
    _output = '';
    _sawNewline = false;
    _emit();
  }

  void dropPending() {
    if (phase != CommandQueuePhase.running) {
      cancel();
      return;
    }

    lines = lines.take(activeIndex + 1).toList();
    _emit();
  }

  void dispose() {
    _idleTimer?.cancel();
  }

  void _dispatchCurrent() {
    _output = '';
    _sawNewline = false;
    _idleTimer?.cancel();

    if (activeIndex >= lines.length) {
      _finish();
      return;
    }

    _send?.call('\u0015${lines[activeIndex]}\r');
    _emit();
  }

  void _onIdle() {
    _idleTimer = null;

    if (phase != CommandQueuePhase.running || !_sawNewline) {
      return;
    }

    final visible = lastVisibleLine(_output);
    final current = activeIndex < lines.length ? lines[activeIndex] : '';

    if (current.isNotEmpty && visible.endsWith(current)) {
      return;
    }

    if (!isShellPrompt(visible)) {
      return;
    }

    activeIndex += 1;

    if (activeIndex >= lines.length) {
      _finish();
      return;
    }

    _dispatchCurrent();
  }

  void _finish() {
    _idleTimer?.cancel();
    phase = CommandQueuePhase.idle;
    lines = [];
    activeIndex = 0;
    _output = '';
    _sawNewline = false;
    _emit();
  }

  void _armIdle() {
    _idleTimer?.cancel();
    _idleTimer = Timer(const Duration(milliseconds: 400), _onIdle);
  }

  void _emit() {
    onChanged?.call();
  }
}
