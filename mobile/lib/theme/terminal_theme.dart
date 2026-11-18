import 'package:flutter/material.dart';
import 'package:xterm/xterm.dart';

const greenTerminalTheme = TerminalTheme(
  cursor: Color(0xFF86EFAC),
  selection: Color(0x664ADE80),
  foreground: Color(0xFF4ADE80),
  background: Color(0xFF0D0D12),
  black: Color(0xFF0D0D12),
  red: Color(0xFFEF4444),
  green: Color(0xFF4ADE80),
  yellow: Color(0xFFEAB308),
  blue: Color(0xFF3B82F6),
  magenta: Color(0xFFA855F7),
  cyan: Color(0xFF06B6D4),
  white: Color(0xFF4ADE80),
  brightBlack: Color(0xFF166534),
  brightRed: Color(0xFFF87171),
  brightGreen: Color(0xFF86EFAC),
  brightYellow: Color(0xFFFACC15),
  brightBlue: Color(0xFF60A5FA),
  brightMagenta: Color(0xFFC084FC),
  brightCyan: Color(0xFF22D3EE),
  brightWhite: Color(0xFFA7F3D0),
  searchHitBackground: Color(0x664ADE80),
  searchHitBackgroundCurrent: Color(0x994ADE80),
  searchHitForeground: Color(0xFF052E16),
);

const greenTerminalStyle = TerminalStyle(
  fontFamily: 'monospace',
  fontSize: 11,
  height: 1.1,
);