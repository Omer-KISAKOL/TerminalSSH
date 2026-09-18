import 'package:flutter/material.dart';
import 'package:xterm/xterm.dart';

import '../models/server_profile.dart';
import '../services/ssh_service.dart';

class TerminalScreen extends StatefulWidget {
  const TerminalScreen({super.key, required this.profile});

  final ServerProfile profile;

  @override
  State<TerminalScreen> createState() => _TerminalScreenState();
}

class _TerminalScreenState extends State<TerminalScreen> {
  final _terminal = Terminal();
  final _sshService = SshService();
  bool _connecting = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _connect();
  }

  Future<void> _connect() async {
    try {
      _terminal.write('Bağlanılıyor...\r\n');

      await _sshService.connect(
        host: widget.profile.host,
        port: widget.profile.port,
        username: widget.profile.username,
        password: widget.profile.password ?? '',
        onOutput: _terminal.write,
        cols: _terminal.viewWidth,
        rows: _terminal.viewHeight,
      );

      _terminal.buffer.clear();
      _terminal.buffer.setCursor(0, 0);
      _terminal.write('Bağlandı.\r\n');

      _terminal.onResize = (width, height, pixelWidth, pixelHeight) {
        _sshService.resizeTerminal(width, height, pixelWidth, pixelHeight);
      };

      _terminal.onOutput = (data) {
        _sshService.write(data);
      };

      setState(() => _connecting = false);
    } catch (error) {
      setState(() {
        _connecting = false;
        _error = error.toString();
      });
    }
  }

  @override
  void dispose() {
    _sshService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.profile.name)),
      body: _connecting
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : TerminalView(_terminal, autofocus: true),
    );
  }
}
