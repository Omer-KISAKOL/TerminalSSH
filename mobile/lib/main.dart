import 'package:flutter/material.dart';

import 'app/app.dart';
import 'theme/appearance_themes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ThemeController.instance.load();
  runApp(const TerminalSshApp());
}
