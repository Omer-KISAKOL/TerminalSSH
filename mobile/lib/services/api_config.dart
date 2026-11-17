import 'package:flutter/foundation.dart';

const String _productionApiBaseUrl = 'http://188.34.155.223:8787';

String _defaultDevelopmentApiBaseUrl() {
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:8787';
  }
  return 'http://localhost:8787';
}

/// Release derlemeleri canlı sunucuya; debug/profile yerel backend'e bağlanır.
/// Fiziksel cihazda yerel API için:
/// `flutter run --dart-define=API_BASE_URL=http://<bilgisayar-ip>:8787`
String resolveApiBaseUrl() {
  const override = String.fromEnvironment('API_BASE_URL');
  if (override.isNotEmpty) {
    return override;
  }
  if (kReleaseMode) {
    return _productionApiBaseUrl;
  }
  return _defaultDevelopmentApiBaseUrl();
}