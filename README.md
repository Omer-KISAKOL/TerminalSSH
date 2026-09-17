# TerminalSSH

Electron tabanlı, sade ve güvenli bir masaüstü SSH istemcisi. Parola veya özel anahtar ile sunucuya bağlanır, interaktif terminal oturumu sağlar.

## Kurulum

### Geliştirici bağımlılıkları

- Node.js 20+
- pnpm 9+
- Fedora/Linux paketleme için: `rpm-build`, `libxcrypt-compat` (RPM hedefi için)

```bash
git clone <repo-url> TerminalSSH
cd TerminalSSH
pnpm install
```

### Son kullanıcı (Linux)

Derlenmiş paketler `release/` klasöründe oluşur:

- **AppImage:** çift tıklayın veya `./TerminalSSH-0.1.0.AppImage`
- **RPM:** `sudo dnf install ./terminalssh-0.1.0.x86_64.rpm`

RPM derlemek için geliştirme ortamında şu paketler gerekir:

```bash
sudo dnf install rpm-build libxcrypt-compat
pnpm dist:linux:rpm
```

| Paket | Neden |
|---|---|
| `rpm-build` | `rpmbuild` aracını sağlar (electron-builder RPM üretimi için zorunlu) |
| `libxcrypt-compat` | electron-builder'ın gömülü `fpm` aracının Ruby bağımlılığı |

## Geliştirme

```bash
pnpm dev
```

Uygulama Vite geliştirme sunucusu ve Electron penceresi ile açılır.

### Komutlar

| Komut | Açıklama |
|---|---|
| `pnpm dev` | Geliştirme modu |
| `pnpm typecheck` | TypeScript doğrulama |
| `pnpm lint` | Oxlint |
| `pnpm test` | Vitest birim testleri |
| `pnpm build` | `dist/` ve `dist-electron/` üretir |
| `pnpm icons` | Uygulama ikonlarını oluşturur |
| `pnpm dist` | Tüm platform paketleri |
| `pnpm dist:linux` | Linux AppImage + RPM |
| `pnpm dist:win` | Windows NSIS kurulum |

## Build ve paketleme

```bash
pnpm dist:linux
```

Çıktılar:

- `dist/` — renderer (React)
- `dist-electron/` — main process ve preload
- `release/` — dağıtım paketleri (AppImage, RPM, NSIS)

Bu klasörler `.gitignore` içinde yer alır; her build öncesi temiz üretim önerilir.

## Mimari

```
electron/main/       → ssh2, profil store, IPC handlers
electron/preload/    → dar kapsamlı desktopApi
shared/              → sözleşmeler, doğrulama, IPC kanalları
src/                 → React arayüzü, xterm terminal
resources/icons/     → uygulama ikonları
```

Güvenlik sınırları:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- SSH yalnızca main process'te
- Parola/passphrase `safeStorage` ile şifrelenir

## Güvenlik

- SSH host anahtarı fingerprint doğrulaması (ilk bağlantıda onay, değişimde uyarı)
- Renderer'a ham host anahtarı gönderilmez
- Production loglarında parola, passphrase ve özel anahtar yolu maskelenir
- IPC payload doğrulaması merkezi ve tip güvenlidir
- Oturum sahipliği `webContentsId` + `sessionId` ile kontrol edilir

## Manuel kabul testi

Dokümandaki kontrol listesi:

- [ ] Fedora üzerinde uygulama açılıyor
- [ ] Bir Ubuntu sunucusuna bağlanılabiliyor
- [ ] `top`, `nano`, `vim` gibi interaktif uygulamalar doğru çalışıyor
- [ ] Türkçe karakterler doğru görünüyor
- [ ] Terminal yeniden boyutlandırıldığında satırlar doğru düzenleniyor
- [ ] Kopyalama/yapıştırma (Ctrl+C/V ve sağ tık menüsü) çalışıyor
- [ ] Uygulama kapanınca sunucudaki shell oturumu kapanıyor
- [ ] Kaydedilmiş parola dosyada düz metin görünmüyor

## Bilinen sınırlamalar

- Tek terminal oturumu (çoklu sekme yok)
- SFTP, port forwarding, snippet ve bulut senkronizasyonu yok
- macOS paketi yapılandırılmış ancak birincil hedef Linux/Windows
- RPM paketi `rpmbuild` gerektirir; ortamda yoksa yalnızca AppImage üretilir
- Otomatik güncelleme mekanizması yok
- `window.confirm` profil silme onayı için kullanılıyor (ileride özel dialog eklenebilir)

## Lisans

Özel proje — TerminalSSH markası bağımsızdır; Termius veya üçüncü taraf görselleri kullanılmaz.
