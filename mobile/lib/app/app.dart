import 'package:flutter/material.dart';

import '../screens/auth_gate_screen.dart';
import '../services/release_check_service.dart';
import '../theme/app_theme.dart';
import '../theme/appearance_themes.dart';
import '../widgets/update_available_dialog.dart';

class TerminalSshApp extends StatefulWidget {
  const TerminalSshApp({super.key});

  @override
  State<TerminalSshApp> createState() => _TerminalSshAppState();
}

class _TerminalSshAppState extends State<TerminalSshApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final update = await ReleaseCheckService.instance.checkOnceOnAppOpen();
      if (update == null || !mounted) {
        return;
      }

      final navigator = _navigatorKey.currentState;
      final overlayContext = navigator?.overlay?.context;

      if (overlayContext != null && overlayContext.mounted) {
        await showUpdateAvailableDialog(overlayContext, update);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeController.instance,
      builder: (context, _) => MaterialApp(
        navigatorKey: _navigatorKey,
        title: 'TerminalSSH',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const AuthGateScreen(),
      ),
    );
  }
}
