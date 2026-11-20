import 'package:flutter/foundation.dart';

import '../models/server_profile.dart';

/// Açık bir terminal sekmesi. Aynı sunucu birden fazla sekmede açılabilir.
class TerminalSession {
  TerminalSession({required this.id, required this.profile, required this.title});

  final String id;
  final ServerProfile profile;
  final String title;
}

/// Masaüstündeki gibi yan yana (sekmeli) açık sunucu oturumlarını yönetir.
class WorkspaceController extends ChangeNotifier {
  final List<TerminalSession> sessions = [];
  String? activeId;
  int _counter = 0;

  TerminalSession? get active {
    for (final session in sessions) {
      if (session.id == activeId) return session;
    }
    return null;
  }

  int get activeIndex => sessions.indexWhere((session) => session.id == activeId);

  TerminalSession open(ServerProfile profile) {
    _counter += 1;
    final sameName = sessions.where((session) => session.profile.name == profile.name).length;
    final session = TerminalSession(
      id: 'session-$_counter',
      profile: profile,
      title: sameName == 0 ? profile.name : '${profile.name} (${sameName + 1})',
    );
    sessions.add(session);
    activeId = session.id;
    notifyListeners();
    return session;
  }

  void select(String id) {
    if (activeId == id) return;
    activeId = id;
    notifyListeners();
  }

  void close(String id) {
    final index = sessions.indexWhere((session) => session.id == id);
    if (index < 0) return;

    sessions.removeAt(index);

    if (activeId == id) {
      activeId = sessions.isEmpty ? null : sessions[index.clamp(0, sessions.length - 1)].id;
    }

    notifyListeners();
  }

  /// Silinen bir sunucunun açık sekmelerini kapatır.
  void closeForProfile(String profileId) {
    final ids = sessions.where((session) => session.profile.id == profileId).map((s) => s.id).toList();
    for (final id in ids) {
      close(id);
    }
  }
}
