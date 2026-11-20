import 'package:flutter/material.dart';

import '../screens/auth_gate_screen.dart';
import '../theme/app_theme.dart';
import '../theme/appearance_themes.dart';

class TerminalSshApp extends StatelessWidget {
  const TerminalSshApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeController.instance,
      builder: (context, _) => MaterialApp(
        title: 'TerminalSSH',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const AuthGateScreen(),
      ),
    );
  }
}
