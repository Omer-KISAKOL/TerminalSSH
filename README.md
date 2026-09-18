# TerminalSSH Monorepo

Electron masaüstü SSH/SFTP istemcisi, Fastify backend ve Flutter mobil istemci.

## Yapı

```
TerminalSSH/
├── desktop/     Electron + React + ssh2
├── server/      Fastify + PostgreSQL API
├── mobile/      Flutter + dartssh2
├── packages/    Paylaşılan TypeScript paketleri
└── docs/        API ve mimari dokümantasyon
```

## Geliştirme

### Bağımlılıklar

```bash
pnpm install
```

### Veritabanı

**Container (Docker veya Podman):**

```bash
pnpm db:up
pnpm --filter @terminalssh/server db:migrate
```

Fedora'da Docker yoksa Podman yeterlidir (`podman` kurulu olmalı). İsterseniz:

```bash
sudo dnf install podman podman-compose
# veya docker komutu için: sudo dnf install podman-docker
```

**Container olmadan (yerel PostgreSQL):**

```bash
sudo dnf install postgresql-server postgresql
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
bash scripts/db-native-setup.sh
pnpm --filter @terminalssh/server db:migrate
```

### API sunucusu

```bash
pnpm dev:server
```

Varsayılan: `http://localhost:8787`

### Masaüstü uygulama

```bash
pnpm dev
```

Ortam değişkeni (isteğe bağlı):

```bash
TERMINALSSH_API_URL=http://localhost:8787 pnpm dev
```

### Test ve derleme

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Hesap ve profil sync

- Kullanıcı kaydı / girişi JWT ile yapılır
- Profil sırları sunucuda AES-256-GCM vault ile saklanır
- SSH trafiği istemciden doğrudan hedef sunucuya gider
- API sözleşmesi: [`docs/api.md`](docs/api.md)

## Mobil

Android geliştirme: [`mobile/README.md`](mobile/README.md)

Flutter SDK kurulu değilse önce [`mobile/README.md`](mobile/README.md) içindeki Fedora kurulum adımlarını izleyin.

```bash
bash scripts/mobile-setup.sh   # Flutter + android/ iskeleti
cd mobile
flutter run
```

## Dağıtım

### Masaüstü (Windows `.exe`, Linux AppImage/RPM, macOS `.dmg`)

Masaüstü uygulama **Electron + electron-builder** ile paketlenir. RDP istemcisi gibi kurulabilir bir uygulama dosyası üretir; SSH trafiği yine doğrudan hedef sunucuya gider, backend yalnızca hesap/profil sync içindir.

**Önkoşul (monorepo kökünden bir kez):**

```bash
pnpm install
pnpm --filter @terminalssh/api-client build
```

**Windows — kurulum `.exe` (NSIS installer):**

Windows makinede (veya Linux’ta Wine ile cross-build):

```bash
cd desktop
pnpm dist:win
```

Çıktılar `desktop/release/` altında:

| Dosya | Açıklama |
|-------|----------|
| `TerminalSSH Setup x.x.x.exe` | Çift tıkla kurulum sihirbazı (masaüstü + Başlat menüsü kısayolu) |
| `win-unpacked/` | Taşınabilir sürüm (kurulum yapmadan `TerminalSSH.exe` çalıştırılabilir) |

Kullanıcıya vermek için genelde **`TerminalSSH Setup … .exe`** dosyasını paylaşın.

**Linux — AppImage veya RPM (Fedora vb.):**

```bash
cd desktop
pnpm dist:linux:appimage   # tek dosya, kurulum gerektirmez
# veya
pnpm dist:linux:rpm        # dnf install ile kurulabilir paket
# veya ikisi birden:
pnpm dist:linux
```

Çıktılar yine `desktop/release/`:

| Dosya | Açıklama |
|-------|----------|
| `TerminalSSH-x.x.x.AppImage` | `chmod +x` sonrası doğrudan çalıştırılır |
| `TerminalSSH-x.x.x.x86_64.rpm` | `sudo dnf install ./TerminalSSH-….rpm` |

**macOS — `.dmg` (Mac’te derleyin):**

```bash
cd desktop
pnpm exec electron-builder --config electron-builder.yml --mac
```

Çıktı: `desktop/release/TerminalSSH-x.x.x.dmg`

**Notlar:**

- İlk paketlemede ikonlar otomatik üretilir (`pnpm icons` script’i `dist:*` komutlarına dahil).
- Windows `.exe` üretmek için en sorunsuz yol **Windows 10/11 üzerinde** `pnpm dist:win` çalıştırmaktır.
- Linux’tan Windows paketi almak isterseniz Wine ve ek bağımlılıklar gerekebilir; resmi yol Windows ortamıdır.
- Paketlenmiş uygulama varsayılan API adresini build zamanındaki ortamdan alır; farklı sunucu için `TERMINALSSH_API_URL=… pnpm dist:win` ile derleyin.

---

### Mobil (Android `.apk`)

Release APK, Flutter ile üretilir. Detaylı geliştirme notları: [`mobile/README.md`](mobile/README.md)

**Önkoşullar:**

```bash
bash scripts/mobile-setup.sh          # Flutter + android/ iskeleti
flutter doctor                        # Android toolchain yeşil olmalı
flutter doctor --android-licenses     # lisanslar kabul edilmiş olmalı
```

**Release APK:**

```bash
cd mobile
flutter pub get
flutter build apk --release
```

Çıktı:

```
mobile/build/app/outputs/flutter-apk/app-release.apk
```

Bu dosyayı Android telefona kopyalayıp yükleyebilirsiniz (bilinmeyen kaynak / “Install unknown apps” izni gerekebilir).

**Daha küçük APK (ABI başına ayrı paket):**

```bash
flutter build apk --release --split-per-abi
```

Çıktı: `app-armeabi-v7a-release.apk`, `app-arm64-v8a-release.apk` vb. — cihaza uygun olanı yükleyin.

**Play Store için (isteğe bağlı):**

```bash
flutter build appbundle --release
```

Çıktı: `build/app/outputs/bundle/release/app-release.aab`

**Fiziksel cihazda test:** Telefon bilgisayarla aynı ağda olmalı; API adresi `mobile/lib/services/api_config.dart` içinde bilgisayar IP’nize göre ayarlanmalıdır (emülatörde `10.0.2.2` kullanılır). Backend: `pnpm dev:server`.
