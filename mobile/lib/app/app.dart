import 'package:flutter/material.dart';

import '../screens/auth_gate_screen.dart';

class TerminalSshApp extends StatelessWidget {
  const TerminalSshApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TerminalSSH',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6366F1), brightness: Brightness.dark),
        useMaterial3: true,
      ),
      home: const AuthGateScreen(),
    );
  }
}
