# Canlı sunucu (API)

## Sunucu güncelleme (backend)

Sunucuda (`/var/www/TerminalSSH`, systemd servisi `terminalssh-api`):

**Bir kerelik kurulum — Git LFS** (`git: 'lfs' is not a git command` hatası alırsanız; APK/exe/AppImage dosyaları LFS ile tutulur):

```bash
sudo apt install git-lfs     # Ubuntu/Debian
git lfs install              # kullanıcı başına bir kez
```

Güncelleme:

```bash
cd /var/www/TerminalSSH

git pull
git lfs pull

# Kurulum dosyalarından releases.json sürümlerini ve platform indirme URL'lerini günceller
# (Windows latest.yml, macOS latest-mac.yml, Fedora/Linux latest-linux.yml, Android pubspec)
export PUBLIC_RELEASE_BASE_URL=http://188.34.155.223:8787
pnpm releases:sync

pnpm install                                  # bağımlılık değiştiyse
pnpm --filter @terminalssh/api-client build   # server bunu kullanıyorsa
pnpm --filter @terminalssh/server build       # server/dist üretir (tsc)

pnpm --filter @terminalssh/server db:migrate  # yalnızca şema/migration değiştiyse

sudo systemctl restart terminalssh-api
```

Tek komut (sunucuda repo kökünden, migrate isteğe bağlı `RUN_DB_MIGRATE=1`):

```bash
bash scripts/server-deploy.sh http://188.34.155.223:8787
sudo systemctl restart terminalssh-api
```

Kontrol:

```bash
systemctl status terminalssh-api --no-pager
journalctl -u terminalssh-api -n 50 --no-pager
curl -s http://127.0.0.1:8787/health          # {"ok":true}
```

Notlar:

- Servis `server/dist/index.js` çalıştırır; `git pull` tek başına yetmez, **build alıp restart** gerekir.
- `deploy/install-api-service.sh` yalnızca ilk kurulum içindir (systemd servisini yazar). `.service` dosyasını veya Node yolunu değiştirmediyseniz güncellemede çalıştırmayın.
- Giriş sırasında Postgres hatası alırsanız aşağıdaki bölüme bakın (`fix-postgres-auth.sh`).
- Masaüstü/Android istemci güncellemeleri ayrı akıştır: bkz. [Uygulama güncellemeleri](#uygulama-güncellemeleri).

## Uygulama güncellemeleri

Tüm istemciler **yalnızca uygulama açılışında bir kez** kontrol eder; arka planda sürekli bildirim yok.

**Platform seçimi (otomatik):**

| Ortam                   | Nasıl anlar                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Paketli Windows         | `electron-updater` → `latest.yml` + `.exe`                                                            |
| Paketli macOS           | `latest-mac.yml` + zip/dmg                                                                            |
| Fedora / Linux masaüstü | `latest-linux.yml` + **AppImage** (OTA için; RPM manuel kurulum)                                      |
| Android                 | `platform=android` + `releases.json`                                                                  |
| Manuel indirme          | `GET /releases/installer?platform=desktop-windows` (veya `desktop-linux`, `desktop-macos`, `android`) |

Sunucu `GET /releases/check` çağrısında istemci `platform` gönderir; masaüstünde sürüm önceliği sunucudaki `latest*.yml` dosyalarındadır.

### Masaüstü (Windows / macOS / Linux AppImage) — tam arka plan güncelleme

Paketlenmiş uygulama `electron-updater` kullanır:

1. Açılışta `server/data/releases/electron/` altındaki `latest.yml` / `latest-mac.yml` / `latest-linux.yml` okunur.
2. Güncelleme **arka planda indirilir** (`autoDownload`).
3. Kullanıcıya diyalog çıkar; **Yeniden başlat ve kur** → uygulama kapanır, kurulum biter (Windows NSIS, macOS zip, Linux AppImage).

**Yayın akışı:**

Windows kurulum dosyası **~100MB+** olduğu için repoda **Git LFS** kullanılır (`.gitattributes`). Yeni clone: `git lfs install` ve `git lfs pull`. Push: `.\scripts\git-push-sync.ps1` (önce yönetici ile `.\scripts\enable-ssh-agent.ps1`).

```bash
# İlgili platformda derle
cd desktop
pnpm dist:win          # veya dist:linux / mac

# Çıktıları API sunucusuna kopyala (Linux/macOS/Git Bash)
bash ../scripts/publish-desktop-releases.sh

# releases.json otomatik: publish script sonunda veya `pnpm releases:sync`
```

Canlı sunucuda dosyalar: `server/data/releases/electron/`  
Örnek: `latest.yml`, `TerminalSSH Setup 2.1.0.exe`, `.blockmap`, `TerminalSSH-2.1.0.AppImage`, …

**Notlar:**

- **macOS:** İmzasız derlemelerde Gatekeeper uyarısı olabilir; ekip içi için ad-hoc imza veya Apple Developer notarization gerekir.
- **Linux RPM:** Otomatik güncelleme için **AppImage** hedefini kullanın (`electron-builder` generic feed).
- Geliştirme modu (`pnpm dev`) eski manifest kontrolünü kullanır; `electron-updater` yalnızca paketli exe/dmg/AppImage’de çalışır.

### Android (Play Store yok) — ekip içi APK OTA

Önerilen yöntem: **API üzerinden doğrudan APK** (`ota_update` eklentisi).

1. Release APK derleyin: `cd mobile && flutter build apk --release`
2. Sunucuya kopyalayın: `server/data/releases/android/terminalssh.apk` (veya sürümlü dosya adı)
3. `server/data/releases.json` → `android.version` ve `android.downloadUrl` güncelleyin:

```json
"android": {
  "version": "0.2.0",
  "downloadUrl": "http://188.34.155.223:8787/releases/android/terminalssh.apk",
  "releaseNotes": "…"
}
```

1. Kullanıcı uygulamayı açınca diyalog → **Güncelle** → APK iner, Android kurulum ekranı açılır.

**Ekip politikası:** Cihazlarda “bu kaynaktan uygulama yükleme” izni gerekir (bilinmeyen kaynaklar / REQUEST_INSTALL_PACKAGES). Play Store yerine tek APK URL’si ile tüm ekibi güncellersiniz.

**Alternatifler (isteğe bağlı):** Firebase App Distribution, MDM (Intune), özel indirme portalı — hepsi yine APK + sürüm manifesti mantığına dayanır.

### Manifest kontrolü

```bash
curl -s "http://127.0.0.1:8787/releases/check?platform=android&current=0.1.0"
curl -s "http://127.0.0.1:8787/releases/electron/latest.yml"
```

