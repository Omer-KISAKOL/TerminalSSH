import 'package:flutter/material.dart';

class AppColors {
  static const green = Color(0xFF22C55E);
  static const greenDark = Color(0xFF15803D);
  static const greenMuted = Color(0xFF16A34A);
  static const greenSoft = Color(0xFF86EFAC);
  static const background = Color(0xFFF3F4F6);
  static const card = Color(0xFFFFFFFF);
  static const border = Color(0xFFE5E7EB);
  static const terminalBg = Color(0xFF0D0D12);
  static const terminalTabBg = Color(0xFF16161D);
  static const navActive = Color(0xFFDBEAFE);
}

ThemeData buildAppTheme() {
  const textTheme = TextTheme(
    displayLarge: TextStyle(color: AppColors.greenDark),
    displayMedium: TextStyle(color: AppColors.greenDark),
    displaySmall: TextStyle(color: AppColors.greenDark),
    headlineLarge: TextStyle(color: AppColors.greenDark),
    headlineMedium: TextStyle(color: AppColors.greenDark),
    headlineSmall: TextStyle(color: AppColors.greenDark),
    titleLarge: TextStyle(color: AppColors.greenDark, fontWeight: FontWeight.w600),
    titleMedium: TextStyle(color: AppColors.greenDark, fontWeight: FontWeight.w600),
    titleSmall: TextStyle(color: AppColors.greenDark, fontWeight: FontWeight.w600),
    bodyLarge: TextStyle(color: AppColors.greenDark),
    bodyMedium: TextStyle(color: AppColors.greenDark),
    bodySmall: TextStyle(color: AppColors.greenMuted),
    labelLarge: TextStyle(color: AppColors.greenDark),
    labelMedium: TextStyle(color: AppColors.greenMuted),
    labelSmall: TextStyle(color: AppColors.greenMuted),
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: const ColorScheme.light(
      primary: AppColors.green,
      onPrimary: AppColors.greenDark,
      surface: AppColors.card,
      onSurface: AppColors.greenDark,
    ),
    textTheme: textTheme,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.greenDark,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.navActive,
      foregroundColor: AppColors.greenDark,
      elevation: 2,
    ),
    inputDecorationTheme: InputDecorationTheme(
      labelStyle: const TextStyle(color: AppColors.greenMuted),
      hintStyle: TextStyle(color: AppColors.greenMuted.withValues(alpha: 0.8)),
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
        foregroundColor: AppColors.greenDark,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          color: selected ? AppColors.greenDark : AppColors.greenMuted,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
          fontSize: 12,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(color: selected ? AppColors.greenDark : AppColors.greenMuted);
      }),
    ),
  );
}
