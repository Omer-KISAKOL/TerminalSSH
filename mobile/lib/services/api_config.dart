import 'package:flutter/foundation.dart';

/// Backend API kök adresi — platforma göre otomatik seçilir.
///
/// | Platform              | Adres                    |
/// |-----------------------|--------------------------|
/// | Chrome / Flutter web  | http://localhost:8787    |
/// | Linux/macOS desktop   | http://localhost:8787    |
/// | Android emülatör      | http://10.0.2.2:8787     |
/// | Fiziksel Android      | http://<bilgisayar-ip>:8787 |
String resolveApiBaseUrl() {
  if (kIsWeb) {
    return 'http://localhost:8787';
  }

  if (defaultTargetPlatform == TargetPlatform.android) {
    // Android Studio emülatörü host makineye 10.0.2.2 ile ulaşır.
    // Fiziksel cihazda aşağıdaki satırı bilgisayar IP'nizle değiştirin:
    // return 'http://192.168.1.100:8787';
    return 'http://10.0.2.2:8787';
  }

  return 'http://localhost:8787';
}
