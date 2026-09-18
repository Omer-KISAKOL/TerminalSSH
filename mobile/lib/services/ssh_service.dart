import 'dart:convert';
import 'dart:typed_data';

import 'package:dartssh2/dartssh2.dart';

class SshService {
  SSHClient? _client;
  SSHSession? _session;

  Future<void> connect({
    required String host,
    required int port,
    required String username,
    required String password,
    required void Function(String data) onOutput,
    void Function(int width, int height, int pixelWidth, int pixelHeight)? onResize,
    int cols = 120,
    int rows = 32,
  }) async {
    final socket = await SSHSocket.connect(host, port, timeout: const Duration(seconds: 15));
    _client = SSHClient(
      socket,
      username: username,
      onPasswordRequest: () => password,
    );

    await _client!.authenticated;
    _session = await _client!.shell(
      pty: SSHPtyConfig(width: cols, height: rows),
    );

    _session!.stdout
        .cast<List<int>>()
        .transform(Utf8Decoder())
        .listen(onOutput);

    _session!.stderr
        .cast<List<int>>()
        .transform(Utf8Decoder())
        .listen(onOutput);

    if (onResize != null) {
      onResize(cols, rows, 0, 0);
    }
  }

  void resizeTerminal(int width, int height, int pixelWidth, int pixelHeight) {
    _session?.resizeTerminal(width, height, pixelWidth, pixelHeight);
  }

  void write(String data) {
    _session?.write(Uint8List.fromList(utf8.encode(data)));
  }

  Future<void> disconnect() async {
    _session?.close();
    _client?.close();
    _session = null;
    _client = null;
  }
}
