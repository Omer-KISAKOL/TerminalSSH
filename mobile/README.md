# TerminalSSH Mobile

Flutter + dartssh2 tabanlı Android istemcisi (iOS sonraki faz).

## Önkoşullar

1. **Flutter SDK** (stable)
2. **Android Studio** veya en azından Android SDK + platform-tools
3. Erişilebilir **canlı API** (`http://188.34.155.223:8787`)

### Fedora'da Flutter kurulumu

Sistemde `flutter: komut bulunamadı` hatası alıyorsanız SDK henüz kurulu değildir.

**Önerilen (resmi SDK):**

```bash
git clone --depth 1 -b stable https://github.com/flutter/flutter.git ~/flutter
echo 'export PATH="$HOME/flutter/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
flutter doctor
```

**Android geliştirme araçları:**

```bash
sudo dnf install android-tools
# Android Studio: https://developer.android.com/studio
```

`flutter doctor` çıktısında Android toolchain yeşil olmalı. Eksik lisanslar için:

```bash
flutter doctor --android-licenses
```

### Otomatik proje hazırlığı

Monorepo kökünden:

```bash
bash scripts/mobile-setup.sh
```

Bu script:
- Flutter yoksa `~/flutter` altına SDK indirir
- `android/` (ve `ios/`) platform klasörlerini `flutter create` ile oluşturur
- `flutter pub get` çalıştırır

## Geliştirme

**Hedef platform:** Android (emülatör veya fiziksel cihaz). Chrome/web ve Linux masaüstü bu proje için uygun değildir — `dartssh2` ham TCP soketi kullanır, tarayıcıda çalışmaz.

```bash
export PATH="$HOME/flutter/bin:$PATH"   # PATH'e ekli değilse
cd mobile
flutter pub get
flutter devices                       # Android cihaz/emülatör listesi
flutter run -d android                # yalnızca Android
```

### Linux masaüstünde test (isteğe bağlı)

Fedora'da Linux hedefi için ek paketler:

```bash
sudo dnf install cmake ninja-build clang gtk3-devel libsecret-devel
flutter run -d linux
```

`libsecret-1` hatası alırsanız yalnızca `libsecret-devel` eksiktir — `flutter_secure_storage` bunu gerektirir.

Clang 22 + `deprecated-literal-operator` derleme hatası için `linux/CMakeLists.txt` içinde `-Wno-deprecated-literal-operator` bayrağı eklenmiştir (Fedora 44).

SSH bağlantısı Linux hedefinde çalışır; asıl dağıtım hedefi yine Android'dir.

### API adresi

Dev ve release aynı canlı backend kullanılır (`lib/services/api_config.dart`):

`http://188.34.155.223:8787`

Mobil istemci doğrudan HTTP istekleri yapar; tarayıcı CORS kuralları geçerli değildir.

## Release APK

```bash
cd mobile
flutter build apk --release
```

Çıktı: `build/app/outputs/flutter-apk/app-release.apk`

## Mobil v1 kapsamı

| Özellik | Durum |
|---------|--------|
| Giriş (login) | Var |
| Kayıt (register) | Henüz yok |
| Profil listesi + sync | Var |
| Parola ile SSH + tek terminal | Var |
| `flutter_secure_storage` cache | Var (şifreler) |
| Token refresh | Henüz yok |
| Android platform projesi | `mobile-setup.sh` ile oluşturulur |

## API

Backend sözleşmesi: [`../docs/api.md`](../docs/api.md)
