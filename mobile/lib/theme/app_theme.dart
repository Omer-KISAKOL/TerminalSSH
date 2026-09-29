import 'package:flutter/material.dart';

class AppColors {
  static const green = Color(0xFF22C55E);
  static const greenDark = Color(0xFF14532D);
  static const greenMuted = Color(0xFF4ADE80);
  static const greenSoft = Color(0xFF86EFAC);
  static const text = Color(0xFFE5E7EB);
  static const textMuted = Color(0xFF9CA3AF);
  static const background = Color(0xFF0D0D12);
  static const card = Color(0xFF16161D);
  static const border = Color(0xFF2A2A33);
  static const terminalBg = Color(0xFF0D0D12);
  static const terminalTabBg = Color(0xFF16161D);
  static const navActive = Color(0xFF14532D);
}

ThemeData buildAppTheme() {
  const textTheme = TextTheme(
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

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.green,
      onPrimary: Color(0xFF052E16),
      surface: AppColors.card,
      onSurface: AppColors.text,
      outline: AppColors.border,
    ),
    textTheme: textTheme,
    iconTheme: const IconThemeData(color: AppColors.text),
    dividerColor: AppColors.border,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.text,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.green,
      foregroundColor: Color(0xFF052E16),
      elevation: 2,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.card,
      labelStyle: const TextStyle(color: AppColors.textMuted),
      hintStyle: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.green),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.green,
        foregroundColor: const Color(0xFF052E16),
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
