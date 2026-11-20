import 'dart:async';

enum CommandQueuePhase { idle, preview, running }

final _ansiPattern = RegExp('\u001B\\[[0-9;?]*[ -/]*[@-~]');
final _promptPattern = RegExp(r'(?:\$|#|%|❯|➜)\s*$');
final _anglePromptPattern = RegExp(r'(?:PS [A-Za-z]:|[@:~\\/].*)>\s*$');

class _HeredocMarker {
  const _HeredocMarker(this.delimiter, this.stripTabs);

  final String delimiter;
  final bool stripTabs;
}

enum _QuoteState { none, single, double }

class _ScanResult {
  _ScanResult(this.quote, this.heredocs);

  final _QuoteState quote;
  final List<_HeredocMarker> heredocs;
}

// <<EOF, <<-EOF, <<'EOF', <<"EOF", <<\EOF
final _heredocPattern = RegExp(
  r'''^<<(-?)\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][\w.-]*))''',
);
final _whitespaceChar = RegExp(r'\s');
final _trailingBackslash = RegExp(r'(?:^|[^\\])(?:\\\\)*\\$');

/// Bir komut satırını tarar: açık kalan tırnak durumunu ve satırda açılan heredoc
/// işaretlerini döndürür.
_ScanResult _scanCommandLine(String line, _QuoteState initialQuote) {
  final heredocs = <_HeredocMarker>[];
  var quote = initialQuote;

  for (var index = 0; index < line.length; index += 1) {
    final char = line[index];

    if (quote == _QuoteState.single) {
      if (char == "'") quote = _QuoteState.none;
      continue;
    }

    if (char == r'\') {
      index += 1;
      continue;
    }

    if (quote == _QuoteState.double) {
      if (char == '"') quote = _QuoteState.none;
      continue;
    }

    if (char == "'") {
      quote = _QuoteState.single;
      continue;
    }

    if (char == '"') {
      quote = _QuoteState.double;
      continue;
    }

    if (char == '#' && (index == 0 || _whitespaceChar.hasMatch(line[index - 1]))) {
      break;
    }

    if (char == '<' &&
        index + 1 < line.length &&
        line[index + 1] == '<' &&
        (index + 2 >= line.length || line[index + 2] != '<')) {
      final match = _heredocPattern.firstMatch(line.substring(index));

      if (match != null) {
        heredocs.add(_HeredocMarker(
          match.group(2) ?? match.group(3) ?? match.group(4) ?? '',
          match.group(1) == '-',
        ));
        index += match.group(0)!.length - 1;
        continue;
      }

      index += 1;
    }
  }

  return _ScanResult(quote, heredocs);
}

/// Yapıştırılan metni çalıştırılacak komut birimlerine böler. Heredoc (EOF) gövdesi,
/// satır sonu ters bölü ile devam eden ve tırnağı kapanmayan komutlar tek birim kalır;
/// birim içindeki satırlar satır sonu karakteriyle birleştirilir.
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

  final units = <String>[];
  var current = <String>[];
  var quote = _QuoteState.none;
  var pending = <_HeredocMarker>[];

  for (final rawLine in rawLines) {
    if (pending.isNotEmpty) {
      current.add(rawLine);
      final marker = pending.first;
      final candidate = marker.stripTabs ? rawLine.replaceFirst(RegExp(r'^\t+'), '') : rawLine;

      if (candidate == marker.delimiter) {
        pending = pending.sublist(1);
      }

      if (pending.isEmpty && quote == _QuoteState.none) {
        units.add(current.join('\n'));
        current = [];
      }
      continue;
    }

    final line = quote == _QuoteState.none ? rawLine.replaceAll(RegExp(r'\s+$'), '') : rawLine;

    if (current.isEmpty && line.trim().isEmpty) {
      continue;
    }

    current.add(line);

    final scanned = _scanCommandLine(line, quote);
    quote = scanned.quote;
    pending = scanned.heredocs;

    final continued = quote != _QuoteState.none || _trailingBackslash.hasMatch(line);

    if (pending.isEmpty && !continued) {
      units.add(current.join('\n'));
      current = [];
    }
  }

  if (current.isNotEmpty) {
    units.add(current.join('\n'));
  }

  if (units.isEmpty || (units.length == 1 && !units.first.contains('\n'))) {
    return null;
  }

  return units;
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
  CommandQueue({this.onChanged, this.shouldBypass});

  final void Function()? onChanged;

  /// true ise girdi kuyruğa alınmadan doğrudan gönderilir (nano/vim gibi tam ekran uygulamalar).
  final bool Function()? shouldBypass;

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
    if (phase == CommandQueuePhase.idle && !autoStart && (shouldBypass?.call() ?? false)) {
      _send?.call(data);
      return;
    }

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

    _send?.call('\u0015${lines[activeIndex].split('\n').join('\r')}\r');
    _emit();
  }

  void _onIdle() {
    _idleTimer = null;

    if (phase != CommandQueuePhase.running || !_sawNewline) {
      return;
    }

    final visible = lastVisibleLine(_output);
    final current = activeIndex < lines.length ? lines[activeIndex].split('\n').last : '';

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
