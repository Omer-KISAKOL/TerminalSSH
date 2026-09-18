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

## Dağıtım (masaüstü)

```bash
cd desktop
pnpm dist:linux:appimage
```
