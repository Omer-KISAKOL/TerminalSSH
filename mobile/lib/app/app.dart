import 'package:flutter/material.dart';

import '../screens/auth_gate_screen.dart';
import '../theme/app_theme.dart';

class TerminalSshApp extends StatelessWidget {
  const TerminalSshApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TerminalSSH',
      theme: buildAppTheme(),
      home: const AuthGateScreen(),
    );
  }
}
