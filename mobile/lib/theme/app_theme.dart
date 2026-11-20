import 'package:flutter/material.dart';

import 'appearance_themes.dart';

/// Uygulama renkleri seçili temadan okunur. Tema değişince ThemeController tüm
/// arayüzü yeniden çizdirir, bu yüzden bunlar const değil getter'dır.
class AppColors {
  static AppearanceTheme get _t => ThemeController.instance.theme;

  static Color get green => _t.accent;
  static Color get greenDark => Color.lerp(_t.surfaceRaised, _t.accent, 0.28)!;
  static Color get greenMuted => Color.lerp(_t.accent, _t.textMuted, 0.35)!;
  static Color get greenSoft => Color.lerp(_t.accent, _t.text, 0.30)!;
  static Color get text => _t.text;
  static Color get textMuted => _t.textMuted;
  static Color get background => _t.surface;
  static Color get card => _t.surfaceRaised;
  static Color get cardMuted => _t.surfaceMuted;
  static Color get border => _t.border;
  static Color get terminalBg => _t.terminalBackground;
  static Color get terminalTabBg => _t.surfaceRaised;
  static Color get navActive => greenDark;
  static Color get statusConnected => _t.statusConnected;
  static Color get danger => _t.isLight ? const Color(0xFFDC2626) : const Color(0xFFF87171);

  /// Vurgu rengi üzerindeki yazı/ikon rengi.
  static Color get onAccent =>
      _t.accent.computeLuminance() > 0.58 ? const Color(0xFF101114) : const Color(0xFFF8FAFC);
}

ThemeData buildAppTheme() {
  final t = ThemeController.instance.theme;
  final brightness = t.isLight ? Brightness.light : Brightness.dark;

  final textTheme = TextTheme(
    displayLarge: TextStyle(color: AppColors.text),
    displayMedium: TextStyle(color: AppColors.text),
    displaySmall: TextStyle(color: AppColors.text),
    headlineLarge: TextStyle(color: AppColors.text),
    headlineMedium: TextStyle(color: AppColors.text),
    headlineSmall: TextStyle(color: AppColors.text),
    titleLarge: TextStyle(color: AppColors.text, fontWeight: FontWeight.w600),
    titleMedium: TextStyle(color: AppColors.text, fontWeight: FontWeight.w600),
    titleSmall: TextStyle(color: AppColors.text, fontWeight: FontWeight.w600),
    bodyLarge: TextStyle(color: AppColors.text),
    bodyMedium: TextStyle(color: AppColors.text),
    bodySmall: TextStyle(color: AppColors.textMuted),
    labelLarge: TextStyle(color: AppColors.text),
    labelMedium: TextStyle(color: AppColors.textMuted),
    labelSmall: TextStyle(color: AppColors.textMuted),
  );

  final scheme = (t.isLight ? const ColorScheme.light() : const ColorScheme.dark()).copyWith(
    primary: AppColors.green,
    onPrimary: AppColors.onAccent,
    surface: AppColors.card,
    onSurface: AppColors.text,
    outline: AppColors.border,
    error: AppColors.danger,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: scheme,
    textTheme: textTheme,
    iconTheme: IconThemeData(color: AppColors.text),
    dividerColor: AppColors.border,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.text,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppColors.green,
      foregroundColor: AppColors.onAccent,
      elevation: 2,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.card,
      labelStyle: TextStyle(color: AppColors.textMuted),
      hintStyle: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.green),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.green,
        foregroundColor: AppColors.onAccent,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: AppColors.green),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.text,
        side: BorderSide(color: AppColors.border),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.card,
      indicatorColor: AppColors.navActive,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          color: selected ? AppColors.greenSoft : AppColors.textMuted,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
          fontSize: 12,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(color: selected ? AppColors.greenSoft : AppColors.textMuted);
      }),
    ),
  );
}
