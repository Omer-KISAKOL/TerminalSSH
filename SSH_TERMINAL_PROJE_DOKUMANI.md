# SSH Terminal Masaüstü Uygulaması — Proje Dokümanı

## Proje ismi: **TerminalSSH**

## 1. Projenin amacı

Electron tabanlı, sade ve güvenli bir masaüstü SSH istemcisi geliştir. Uygulamanın tek amacı kullanıcının bir sunucuya SSH ile bağlanması ve interaktif terminali kullanmasıdır.

Bu proje Termius'un tam alternatifi değildir. SFTP, ekip paylaşımı, bulut senkronizasyonu, snippet, seri bağlantı, Telnet ve gelişmiş ağ araçları kapsam dışındadır.

## 2. Teknoloji yığını

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- `ssh2`: SSH bağlantısı ve uzak shell
- `@xterm/xterm`: terminal arayüzü
- `@xterm/addon-fit`: terminali alana sığdırma
- `electron-store`: kayıtlı sunucu profilleri ve uygulama tercihleri
- Electron `safeStorage`: parola ve özel anahtar parolası gibi hassas değerleri şifreleme
- Paket yöneticisi: pnpm

Gereksiz bağımlılık ekleme. HTTP istemcisi gerekirse Axios yerine `fetch` tercih et.

## 3. MVP kapsamı



### Bağlantı formu

- Profil adı
- Sunucu adresi (IP veya domain)
- Port; varsayılan değer `22`
- Kullanıcı adı
- Kimlik doğrulama yöntemi:
  - Parola
  - Özel anahtar
- Parola alanı
- Özel anahtar dosyası seçimi
- Özel anahtar parola alanı (gerekiyorsa)
- Bağlan butonu
- İsteğe bağlı `Bu sunucuyu kaydet` seçeneği



### Terminal

- İnteraktif SSH shell
- Renkli terminal çıktısı (`xterm-256color`)
- Klavye girdilerinin gecikmeden sunucuya aktarılması
- Terminal alanı değiştiğinde PTY boyutunun güncellenmesi
- Bağlantı durumu göstergesi
- Bağlantıyı kesme
- Tekrar bağlanma
- Terminali temizleme
- Kopyalama ve yapıştırma



### Kayıtlı sunucular

- Profilleri listeleme
- Profil ekleme, düzenleme ve silme
- Profil seçerek bağlanma
- Son bağlanılan sunucuyu belirtme
- Parolayı kaydetme ayrı ve varsayılan olarak kapalı bir tercih olmalı



## 4. Kapsam dışı özellikler

- SFTP veya dosya yöneticisi
- Bulut senkronizasyonu
- Takım/organizasyon sistemi
- Komut snippet'ları
- Port forwarding
- Telnet, Mosh veya seri port
- Aynı anda birden fazla terminal sekmesi (ilk sürümde)
- Mobil uygulama
- Kullanıcı hesabı veya backend API
- Telemetri ve analitik



## 5. Mimari kurallar

Electron'un süreç sınırlarını koru:

- **Renderer:** React arayüzü ve xterm terminali
- **Preload:** yalnızca izin verilen, tip güvenli IPC metotları
- **Main process:** `ssh2`, shell stream yönetimi, dosya seçimi, güvenli saklama ve profil işlemleri

Renderer içinde `ssh2`, Node.js `fs`, `path`, `child_process` veya doğrudan Electron API kullanma.

BrowserWindow güvenlik ayarları:

```ts
webPreferences: {
  preload: preloadPath,
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
}
```

Renderer'a genel amaçlı `ipcRenderer.send` açma. Her işlem için dar kapsamlı bir preload metodu tanımla.

## 6. Önerilen klasör yapısı

```text
src/
  main/
    index.ts
    ipc/
      ssh.handlers.ts
      profile.handlers.ts
      dialog.handlers.ts
    services/
      ssh-session-manager.ts
      profile-store.ts
      secret-store.ts
  preload/
    index.ts
    api.types.ts
  renderer/
    src/
      app/
      components/
        connection/
        terminal/
        profiles/
        ui/
      hooks/
        useSshSession.ts
        useTerminal.ts
      stores/
      types/
      App.tsx
      main.tsx
  shared/
    contracts/
      ssh.ts
      profile.ts
    ipc-channels.ts
```



## 7. Veri modelleri

```ts
type AuthType = "password" | "privateKey";

interface ServerProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  privateKeyPath?: string;
  savePassword: boolean;
  encryptedPassword?: string;
  encryptedPassphrase?: string;
  lastConnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectRequest {
  profileId?: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  cols: number;
  rows: number;
}

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "disconnected"
  | "error";
```

`encryptedPassword` ve `encryptedPassphrase` renderer'a geri gönderilmemeli. Profil listeleme yanıtında yalnızca `hasSavedPassword` gibi bir boolean kullanılmalı.

## 8. IPC sözleşmesi

Preload API yaklaşık olarak aşağıdaki gibi olmalı:

```ts
interface DesktopApi {
  ssh: {
    connect(input: ConnectRequest): Promise<{ sessionId: string }>;
    write(sessionId: string, data: string): Promise<void>;
    resize(sessionId: string, cols: number, rows: number): Promise<void>;
    disconnect(sessionId: string): Promise<void>;
    onData(callback: (event: SshDataEvent) => void): () => void;
    onStatus(callback: (event: SshStatusEvent) => void): () => void;
  };
  profiles: {
    list(): Promise<PublicServerProfile[]>;
    save(input: SaveProfileRequest): Promise<PublicServerProfile>;
    remove(id: string): Promise<void>;
  };
  files: {
    selectPrivateKey(): Promise<string | null>;
  };
}
```

Event abonelikleri mutlaka temizleme fonksiyonu döndürmeli. React component unmount olduğunda listener kaldırılmalı.

## 9. SSH oturum yönetimi

Main process içinde oturumları `Map<string, Session>` yapısında yönet.

Her oturum şunları içersin:

- Benzersiz `sessionId`
- `ssh2.Client`
- Shell stream
- Bağlantı durumu
- İlgili BrowserWindow/WebContents kimliği

Kurallar:

- Bağlantı zaman aşımı: 15 saniye
- Uygulama penceresi kapanınca tüm bağlantıları kapat
- SSH istemcisinin `error`, `close`, `end` ve `ready` olaylarını işle
- Aynı oturum için tekrarlı `disconnect` çağrısı hata üretmemeli
- Renderer yalnızca kendisine ait oturumu kontrol edebilmeli
- Terminal yeniden boyutlandırılırken geçersiz veya aşırı değerleri reddet

Shell açılışı:

```ts
client.shell(
  {
    term: "xterm-256color",
    cols,
    rows,
  },
  callback,
);
```

Resize sırasında shell stream üzerinde `setWindow(rows, cols, 0, 0)` kullan.

## 10. SSH host anahtarı doğrulaması

Üretim kalitesindeki uygulama `hostVerifier` kullanmalıdır. İlk bağlantıda sunucunun fingerprint bilgisini göster ve kullanıcının onayıyla güvenilen sunucular listesine kaydet. Sonraki bağlantılarda fingerprint değişirse bağlantıyı durdur ve açık bir güvenlik uyarısı göster.

İlk geliştirme aşamasında doğrulama ertelenirse bunu kodda ve README'de açık bir TODO olarak belirt; sessizce güvenliymiş gibi davranma.

## 11. Güvenli saklama

- Parolaları ve passphrase değerlerini düz metin saklama.
- Electron `safeStorage.isEncryptionAvailable()` kontrolü yap.
- Şifreleme kullanılamıyorsa hassas bilgiyi kaydetme ve kullanıcıya anlaşılır uyarı göster.
- `safeStorage.encryptString()` sonucunu Base64 olarak sakla.
- Hassas değerleri loglama.
- Bağlantı hatalarında parola veya özel anahtar içeriğini hata mesajına ekleme.
- Özel anahtarın kendisi yerine mümkünse yalnızca dosya yolunu sakla; bağlantı sırasında main process dosyayı okusun.



## 12. Arayüz tasarımı

Koyu temalı, sade ve masaüstü odaklı bir tasarım kullan.

Yerleşim:

- Sol kenar çubuğu: uygulama adı, yeni bağlantı ve kayıtlı sunucular (bağlan butonu)
- Ana alan: bağlantı yoksa form; bağlıysa terminal ve sunucu sekmeleri
- Üst terminal çubuğu: sunucu adı, durum, yeniden bağlan ve bağlantıyı kes

Durum renkleri:

- Gri: bağlı değil
- Sarı: bağlanıyor
- Yeşil: bağlı
- Kırmızı: hata

Form doğrulaması:

- Host boş olamaz
- Port `1–65535` arasında olmalı
- Kullanıcı adı boş olamaz
- Seçilen kimlik doğrulama yönteminin gerekli alanları sağlanmalı
- Bağlantı devam ederken form ve bağlan butonu devre dışı olmalı

Hata mesajları teknik yığın izlerini göstermemeli. Örnek kullanıcı mesajları:

- Sunucuya ulaşılamadı.
- Bağlantı zaman aşımına uğradı.
- Kullanıcı adı veya parola hatalı.
- Özel anahtar okunamadı.
- Sunucunun kimliği daha önce kaydedilenden farklı.



## 13. Terminal davranışları

- Terminal component yalnızca bir kez oluşturulmalı.
- `FitAddon` ile ilk açılışta ve alan değişiminde terminali sığdır.
- Resize çağrılarını debounce et.
- `terminal.onData()` çıktısını aktif SSH oturumuna gönder.
- Sunucudan gelen veriyi `terminal.write()` ile yaz.
- Bağlantı kesildiğinde terminale okunabilir bir sistem mesajı yaz.
- `Ctrl+C`, `Ctrl+D`, yön tuşları, Tab ve diğer terminal tuşları uzak shell'e gitmeli.
- Kopyalama için seçili metinde `Ctrl+C`, yapıştırma için `Ctrl+V` destekle.
- Terminale sağ tık menüsü eklenebilir: Kopyala, Yapıştır, Temizle.



## 14. Hata yönetimi ve loglama

- Main process için küçük bir logger servisi oluştur.
- Geliştirmede detaylı, production'da güvenli ve sınırlı log üret.
- Parola, passphrase, özel anahtar içeriği ve tam bağlantı payload'ını loglama.
- Bilinen `ssh2` hata kodlarını kullanıcı dostu hata türlerine dönüştür.
- Beklenmeyen renderer hataları uygulamayı tamamen kullanılmaz hâle getirmemeli.



## 15. Test planı



### Birim testleri

- Profil doğrulama
- Hassas veri şifreleme/çözme
- IPC payload doğrulama
- SSH hata mesajı eşleme
- Session manager yaşam döngüsü



### Entegrasyon testleri

- Parola ile başarılı bağlantı
- Anahtar ile başarılı bağlantı
- Yanlış parola
- Ulaşılamayan host
- Timeout
- Bağlantı sırasında pencerenin kapanması
- Terminal resize
- Bağlantı koptuktan sonra tekrar bağlanma



### Manuel kabul testi

- Fedora üzerinde uygulama açılıyor.
- Bir Ubuntu sunucusuna bağlanılabiliyor.
- `top`, `nano`, `vim` gibi interaktif uygulamalar doğru çalışıyor.
- Türkçe karakterler doğru görünüyor.
- Terminal yeniden boyutlandırıldığında satırlar doğru düzenleniyor.
- Kopyalama/yapıştırma çalışıyor.
- Uygulama kapanınca sunucudaki shell oturumu kapanıyor.
- Kaydedilmiş parola dosyada düz metin görünmüyor.



## 16. Uygulama aşamaları



### Aşama 1 — Proje temeli

- Electron + React + TypeScript + Vite kurulumu
- Tailwind yapılandırması
- Güvenli BrowserWindow ve preload köprüsü
- ESLint ve formatter



### Aşama 2 — İlk çalışan terminal

- xterm component
- `ssh2` bağlantısı
- IPC üzerinden input/output akışı
- Bağlanma ve bağlantıyı kesme
- Resize desteği



### Aşama 3 — Profil yönetimi

- `electron-store`
- Profil ekleme/düzenleme/silme
- Özel anahtar dosyası seçimi
- `safeStorage` ile parola saklama



### Aşama 4 — Güvenlik ve dayanıklılık

- Host fingerprint doğrulama
- Timeout ve hata eşleme
- Listener ve session temizliği
- IPC payload doğrulama



### Aşama 5 — Dağıtım

- Fedora/Linux için AppImage ve tercihen `.rpm`
- Windows için kurulum paketi
- Uygulama ikonu ve metadata
- Temiz makinede kurulum testi



## 17. Tamamlanma kriterleri

MVP aşağıdaki koşullar sağlandığında tamamlanmış sayılır:

- Kullanıcı parola veya özel anahtar ile SSH bağlantısı kurabiliyor.
- Komutlar interaktif terminalde çalışıyor.
- Terminal boyutu uzak PTY'ye doğru aktarılıyor.
- Bağlantı hataları anlaşılır biçimde gösteriliyor.
- Kayıtlı profiller yönetilebiliyor.
- Hassas bilgiler düz metin saklanmıyor veya loglanmıyor.
- Renderer doğrudan Node.js/Electron yetkisine sahip değil.
- Pencere kapanırken tüm oturumlar temizleniyor.
- Linux build alınabiliyor.



## 18. Cursor için çalışma talimatı

Bu dokümanı projenin ana gereksinim kaynağı kabul et. Uygulamayı aşamalar hâlinde geliştir ve her aşamada:

1. Önce mevcut kod tabanını incele.
2. Değişecek dosyaları ve kısa uygulama planını belirt.
3. Küçük, anlaşılır ve tip güvenli değişiklikler yap.
4. Güvenlik sınırlarını ihlal eden kestirme çözümler kullanma.
5. TypeScript hatalarını, lint kontrollerini ve ilgili testleri çalıştır.
6. Başarısız kontrolleri saklama; nedeni ve kalan işi açıkça yaz.
7. Bir sonraki aşamaya geçmeden önce mevcut aşamanın kabul kriterlerini doğrula.

İlk görev: Aşama 1'i uygula. Eğer proje henüz oluşturulmadıysa pnpm kullanan Electron + React + TypeScript + Vite projesini başlat, güvenli preload mimarisini kur, Tailwind'i ekle ve geliştirme/build komutlarının çalıştığını doğrula. Henüz SSH özelliğini uygulama; yalnızca sonraki aşama için temiz ve güvenli temeli hazırla.

## 19. Cursor'a verilecek kısa başlangıç promptları

```text
Proje kökündeki SSH_TERMINAL_PROJE_DOKUMANI.md dosyasını eksiksiz oku ve gereksinim kaynağı olarak kabul et. Yalnızca Aşama 1'i uygula. pnpm kullan. Electron güvenlik ayarlarını değiştirme; nodeIntegration kapalı, contextIsolation ve sandbox açık olmalı. Genel amaçlı IPC köprüsü açma. Önce planı yaz, sonra uygula; en sonunda typecheck, lint ve build çalıştırarak sonucu raporla.
```

