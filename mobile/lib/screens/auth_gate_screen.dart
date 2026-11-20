import 'package:flutter/material.dart';

import '../models/security_questions.dart';
import '../services/auth_service.dart';
import '../services/auth_validation.dart';
import '../theme/app_theme.dart';
import '../widgets/password_field.dart';
import 'home_shell_screen.dart';

enum _AuthMode { login, register, forgotEmail, forgotReset, securitySetup }

class AuthGateScreen extends StatefulWidget {
  const AuthGateScreen({super.key});

  @override
  State<AuthGateScreen> createState() => _AuthGateScreenState();
}

class _AuthGateScreenState extends State<AuthGateScreen> {
  final _authService = AuthService();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _answerController = TextEditingController();

  _AuthMode _mode = _AuthMode.login;
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  String? _info;
  String? _questionId;
  String? _setupToken;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _answerController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    var restored = false;

    try {
      restored = await _authService.restoreSession().timeout(const Duration(seconds: 15));
    } catch (_) {
      restored = false;
    }

    if (!mounted) return;

    if (restored && _authService.needsSecuritySetup) {
      // Oturum açık ama güvenlik sorusu yok: önce kurulumu tamamlat.
      setState(() {
        _loading = false;
        _setupToken = null;
        _mode = _AuthMode.securitySetup;
      });
      return;
    }

    if (restored) {
      _openHome();
      return;
    }

    setState(() => _loading = false);
  }

  void _openHome() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => HomeShellScreen(authService: _authService)),
    );
  }

  void _switchMode(_AuthMode mode, {String? info}) {
    setState(() {
      _mode = mode;
      _error = null;
      _info = info;
      _passwordController.clear();
      _confirmController.clear();
      _answerController.clear();
      if (mode != _AuthMode.securitySetup && mode != _AuthMode.register) {
        _questionId = null;
      }
    });
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _submitting = true;
      _error = null;
      _info = null;
    });

    try {
      await action();
    } catch (error) {
      if (mounted) setState(() => _error = cleanError(error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _login() => _run(() async {
        final emailError = validateEmail(_emailController.text);
        if (emailError != null) throw Exception(emailError);
        if (_passwordController.text.isEmpty) throw Exception('Parola gerekli.');

        final result = await _authService.login(_emailController.text.trim(), _passwordController.text);
        if (!mounted) return;

        if (result.requiresSecuritySetup) {
          setState(() {
            _setupToken = result.setupToken;
            _questionId = null;
            _answerController.clear();
            _mode = _AuthMode.securitySetup;
          });
          return;
        }

        _openHome();
      });

  Future<void> _register() => _run(() async {
        final emailError = validateEmail(_emailController.text);
        final passwordError = validateAccountPassword(_passwordController.text);
        final answerError = validateSecurityAnswer(_answerController.text);

        if (emailError != null) throw Exception(emailError);
        if (passwordError != null) throw Exception(passwordError);
        if (_passwordController.text != _confirmController.text) {
          throw Exception('Parolalar eşleşmiyor.');
        }
        if (_questionId == null) throw Exception('Güvenlik sorusu seçmelisiniz.');
        if (answerError != null) throw Exception(answerError);

        await _authService.register(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          securityQuestionId: _questionId!,
          securityAnswer: _answerController.text.trim(),
        );
        if (!mounted) return;
        _openHome();
      });

  Future<void> _requestQuestion() => _run(() async {
        final emailError = validateEmail(_emailController.text);
        if (emailError != null) throw Exception(emailError);

        final questionId = await _authService.requestPasswordResetQuestion(_emailController.text.trim());
        if (!mounted) return;
        setState(() {
          _questionId = questionId;
          _answerController.clear();
          _mode = _AuthMode.forgotReset;
        });
      });

  Future<void> _resetPassword() => _run(() async {
        final answerError = validateSecurityAnswer(_answerController.text);
        final passwordError = validateAccountPassword(_passwordController.text);

        if (answerError != null) throw Exception(answerError);
        if (passwordError != null) throw Exception(passwordError);
        if (_passwordController.text != _confirmController.text) {
          throw Exception('Parolalar eşleşmiyor.');
        }

        await _authService.resetPassword(
          email: _emailController.text.trim(),
          securityAnswer: _answerController.text.trim(),
          newPassword: _passwordController.text,
        );
        if (!mounted) return;
        _switchMode(_AuthMode.login, info: 'Parolanız güncellendi. Giriş yapabilirsiniz.');
      });

  Future<void> _completeSecuritySetup() => _run(() async {
        final answerError = validateSecurityAnswer(_answerController.text);
        if (_questionId == null) throw Exception('Güvenlik sorusu seçmelisiniz.');
        if (answerError != null) throw Exception(answerError);

        final token = _setupToken;
        if (token != null) {
          await _authService.completeSecuritySetupWithToken(
            setupToken: token,
            securityQuestionId: _questionId!,
            securityAnswer: _answerController.text.trim(),
          );
        } else {
          await _authService.completeSecuritySetupAuthenticated(
            securityQuestionId: _questionId!,
            securityAnswer: _answerController.text.trim(),
          );
        }

        if (!mounted) return;
        _openHome();
      });

  Future<void> _cancelSecuritySetup() async {
    if (_setupToken == null) {
      await _authService.logout();
    }
    _setupToken = null;
    if (mounted) _switchMode(_AuthMode.login);
  }

  String get _title {
    switch (_mode) {
      case _AuthMode.login:
        return 'Giriş yap';
      case _AuthMode.register:
        return 'Hesap oluştur';
      case _AuthMode.forgotEmail:
      case _AuthMode.forgotReset:
        return 'Parolayı sıfırla';
      case _AuthMode.securitySetup:
        return 'Güvenlik sorusu ekleyin';
    }
  }

  String get _subtitle {
    switch (_mode) {
      case _AuthMode.login:
        return 'Sunucularınız tüm cihazlarınızda senkronize edilir.';
      case _AuthMode.register:
        return 'Profilleriniz güvenli biçimde bulutta saklanır.';
      case _AuthMode.forgotEmail:
        return 'Hesabınıza kayıtlı e-posta adresini girin.';
      case _AuthMode.forgotReset:
        return 'Güvenlik sorusunu yanıtlayın ve yeni parolanızı belirleyin.';
      case _AuthMode.securitySetup:
        return 'Hesabınız güncellendi. Parola sıfırlama için bir kez güvenlik sorusu seçin; ardından giriş tamamlanır.';
    }
  }

  Widget _questionPicker() {
    return DropdownButtonFormField<String>(
      key: ValueKey('question-$_mode-$_questionId'),
      value: _questionId, // ignore: deprecated_member_use
      isExpanded: true,
      dropdownColor: AppColors.card,
      decoration: const InputDecoration(labelText: 'Güvenlik sorusu'),
      hint: const Text('Bir güvenlik sorusu seçin'),
      items: [
        for (final question in securityQuestions)
          DropdownMenuItem(value: question.id, child: Text(question.label, overflow: TextOverflow.ellipsis)),
      ],
      onChanged: _submitting ? null : (value) => setState(() => _questionId = value),
    );
  }

  Widget _answerField() {
    return TextField(
      controller: _answerController,
      autocorrect: false,
      enableSuggestions: false,
      decoration: const InputDecoration(
        labelText: 'Güvenlik cevabı',
        helperText: 'Büyük/küçük harf duyarlı değildir.',
      ),
    );
  }

  Widget _submitButton(String label, VoidCallback onPressed) {
    return FilledButton(
      onPressed: _submitting ? null : onPressed,
      child: _submitting
          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
          : Text(label),
    );
  }

  Widget _emailField({bool enabled = true}) {
    return TextField(
      controller: _emailController,
      enabled: enabled,
      keyboardType: TextInputType.emailAddress,
      autofillHints: const [AutofillHints.email],
      decoration: const InputDecoration(labelText: 'E-posta'),
    );
  }

  List<Widget> _fields() {
    const gap = SizedBox(height: 12);

    switch (_mode) {
      case _AuthMode.login:
        return [
          _emailField(),
          gap,
          PasswordField(
            controller: _passwordController,
            autofillHints: const [AutofillHints.password],
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: _submitting ? null : () => _switchMode(_AuthMode.forgotEmail),
              child: const Text('Şifremi unuttum'),
            ),
          ),
          const SizedBox(height: 8),
          _submitButton('Giriş yap', _login),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : () => _switchMode(_AuthMode.register),
            child: const Text('Hesap oluştur'),
          ),
        ];
      case _AuthMode.register:
        return [
          _emailField(),
          gap,
          PasswordField(
            controller: _passwordController,
            autofillHints: const [AutofillHints.newPassword],
          ),
          gap,
          PasswordField(
            controller: _confirmController,
            labelText: 'Parola tekrar',
            autofillHints: const [AutofillHints.newPassword],
          ),
          gap,
          _questionPicker(),
          gap,
          _answerField(),
          const SizedBox(height: 24),
          _submitButton('Hesap oluştur', _register),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : () => _switchMode(_AuthMode.login),
            child: const Text('Giriş yap'),
          ),
        ];
      case _AuthMode.forgotEmail:
        return [
          _emailField(),
          const SizedBox(height: 24),
          _submitButton('Devam', _requestQuestion),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : () => _switchMode(_AuthMode.login),
            child: const Text('Giriş ekranına dön'),
          ),
        ];
      case _AuthMode.forgotReset:
        return [
          _emailField(enabled: false),
          gap,
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Güvenlik sorusu', style: Theme.of(context).textTheme.labelMedium),
                const SizedBox(height: 4),
                Text(securityQuestionLabel(_questionId ?? '')),
              ],
            ),
          ),
          gap,
          _answerField(),
          gap,
          PasswordField(
            controller: _passwordController,
            labelText: 'Yeni parola',
            autofillHints: const [AutofillHints.newPassword],
          ),
          gap,
          PasswordField(
            controller: _confirmController,
            labelText: 'Parola tekrar',
            autofillHints: const [AutofillHints.newPassword],
          ),
          const SizedBox(height: 24),
          _submitButton('Parolayı güncelle', _resetPassword),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : () => _switchMode(_AuthMode.login),
            child: const Text('Giriş ekranına dön'),
          ),
        ];
      case _AuthMode.securitySetup:
        return [
          _questionPicker(),
          gap,
          _answerField(),
          const SizedBox(height: 24),
          _submitButton('Kaydet ve devam et', _completeSecuritySetup),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _submitting ? null : _cancelSecuritySetup,
            child: const Text('Giriş ekranına dön'),
          ),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('TerminalSSH')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(_title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(_subtitle, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 20),
              if (_info != null) ...[
                Text(_info!, style: const TextStyle(color: AppColors.greenMuted)),
                const SizedBox(height: 12),
              ],
              ..._fields(),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.redAccent)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
