import 'package:flutter/material.dart';
import 'package:xterm/xterm.dart';

import 'appearance_themes.dart';

/// Seçili görünüm temasından xterm teması üretir.
TerminalTheme buildTerminalTheme() {
  final t = ThemeController.instance.theme;
  final light = t.isLight;
  final accent = t.terminalCursor;
  final fg = t.terminalForeground;

  return TerminalTheme(
    cursor: accent,
    selection: accent.withValues(alpha: 0.35),
    foreground: fg,
    background: t.terminalBackground,
    black: light ? const Color(0xFF1F2937) : t.terminalBackground,
    red: light ? const Color(0xFFDC2626) : const Color(0xFFEF4444),
    green: light ? const Color(0xFF15803D) : const Color(0xFF4ADE80),
    yellow: light ? const Color(0xFFA16207) : const Color(0xFFEAB308),
    blue: light ? const Color(0xFF1D4ED8) : const Color(0xFF3B82F6),
    magenta: light ? const Color(0xFF7E22CE) : const Color(0xFFA855F7),
    cyan: light ? const Color(0xFF0E7490) : const Color(0xFF06B6D4),
    white: fg,
    brightBlack: t.textMuted,
    brightRed: light ? const Color(0xFFB91C1C) : const Color(0xFFF87171),
    brightGreen: light ? const Color(0xFF166534) : const Color(0xFF86EFAC),
    brightYellow: light ? const Color(0xFF854D0E) : const Color(0xFFFACC15),
    brightBlue: light ? const Color(0xFF1E40AF) : const Color(0xFF60A5FA),
    brightMagenta: light ? const Color(0xFF6B21A8) : const Color(0xFFC084FC),
    brightCyan: light ? const Color(0xFF155E75) : const Color(0xFF22D3EE),
    brightWhite: t.text,
    searchHitBackground: accent.withValues(alpha: 0.4),
    searchHitBackgroundCurrent: accent.withValues(alpha: 0.6),
    searchHitForeground: t.terminalBackground,
  );
}

const greenTerminalStyle = TerminalStyle(
  fontFamily: 'monospace',
  fontSize: 11,
  height: 1.1,
);
