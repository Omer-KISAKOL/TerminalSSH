final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

String? validateEmail(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return 'E-posta gerekli.';
  if (!_emailPattern.hasMatch(trimmed)) return 'Geçerli bir e-posta adresi girin.';
  return null;
}

String? validateAccountPassword(String value) {
  if (value.isEmpty) return 'Parola gerekli.';
  if (value.length < 8) return 'Parola en az 8 karakter olmalıdır.';
  return null;
}

String? validateSecurityAnswer(String value) {
  final trimmed = value.trim();
  if (trimmed.length < 2) return 'Güvenlik cevabı en az 2 karakter olmalıdır.';
  if (trimmed.length > 120) return 'Güvenlik cevabı çok uzun.';
  return null;
}

String cleanError(Object error) {
  final text = error.toString();
  return text.startsWith('Exception: ') ? text.substring('Exception: '.length) : text;
}
