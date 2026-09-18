# Mimari

## İstemciler

| Platform | Teknoloji | SSH |
|----------|-----------|-----|
| Desktop | Electron + React | ssh2 |
| Mobile | Flutter | dartssh2 |

SSH trafiği **doğrudan istemciden hedef sunucuya** gider. Backend yalnızca hesap ve profil vault'u içindir.

## Backend

- Fastify REST API
- PostgreSQL
- Argon2id parola hash
- JWT access + refresh token
- AES-256-GCM vault (envelope encryption)

## Senkron

1. Kullanıcı hesap parolasıyla giriş yapar
2. API profilleri döner (sırlar çözülmüş)
3. Desktop: `safeStorage` cache
4. Mobile: `flutter_secure_storage` cache
5. Bağlantı istemciden doğrudan SSH/SFTP ile kurulur

## Monorepo

- `desktop/` — Electron uygulaması
- `server/` — API
- `mobile/` — Flutter istemci
- `packages/api-client/` — Desktop TypeScript API istemcisi
- `docs/api.md` — REST sözleşmesi (Dart mirror)
