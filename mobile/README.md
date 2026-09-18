# TerminalSSH Mobile

Flutter + dartssh2 tabanlı Android istemcisi (iOS sonraki faz).

## Önkoşullar

1. **Flutter SDK** (stable)
2. **Android Studio** veya en azından Android SDK + platform-tools
3. Çalışan **backend** (`pnpm dev:server`, varsayılan `:8787`)

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

Platform otomatik seçilir (`lib/services/api_config.dart`):

| Ortam | Doğru URL |
|-------|-----------|
| **Chrome / Flutter web** | `http://localhost:8787` |
| Linux/macOS desktop | `http://localhost:8787` |
| Android emülatör | `http://10.0.2.2:8787` |
| Fiziksel Android (aynı Wi‑Fi) | `http://<bilgisayar-ip>:8787` |

**Chrome'da API çalışmıyorsa:** `10.0.2.2` yalnızca Android emülatör içindir; web'de `localhost` kullanılmalıdır (artık otomatik).

Fiziksel telefonda test için `api_config.dart` içinde Android satırını bilgisayar IP'nizle güncelleyin:

```bash
hostname -I | awk '{print $1}'   # örn. 192.168.1.42
# → http://192.168.1.42:8787
```

Backend'in çalıştığından emin olun: `pnpm dev:server` → `http://localhost:8787/health`

Backend CORS mobil için gerekmez; doğrudan HTTP istekleri kullanılır.

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
