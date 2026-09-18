import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.controller,
    this.labelText = 'Parola',
    this.hintText,
    this.autofillHints,
  });

  final TextEditingController controller;
  final String labelText;
  final String? hintText;
  final Iterable<String>? autofillHints;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      obscureText: _obscure,
      autofillHints: widget.autofillHints,
      style: const TextStyle(color: AppColors.greenDark),
      decoration: InputDecoration(
        labelText: widget.labelText,
        hintText: widget.hintText,
        suffixIcon: IconButton(
          onPressed: () => setState(() => _obscure = !_obscure),
          icon: Icon(
            _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: AppColors.greenMuted,
          ),
          tooltip: _obscure ? 'Parolayı göster' : 'Parolayı gizle',
        ),
      ),
    );
  }
}
