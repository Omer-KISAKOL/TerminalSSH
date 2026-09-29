# Canlı sunucu (API)

## Giriş hatası: `password authentication failed for user "terminalssh"`

Bu mesaj **mobil/desktop kaynaklı değildir**; canlı API PostgreSQL’e bağlanamıyor demektir.

Sunucuda (SSH):

```bash
cd /path/to/TerminalSSH
git pull
bash deploy/fix-postgres-auth.sh
```

`server/.env` içinde şu satır olmalı (port **5433** — 5432 başka projelerde kalabilir):

```env
DATABASE_URL=postgresql://terminalssh:terminalssh@localhost:5433/terminalssh
```

Parolayı değiştirdiyseniz `TERMINALSSH_PG_PASSWORD=...` ile script’e verin veya `ALTER USER` ile eşitleyin.

Kontrol:

```bash
curl -s -X POST http://127.0.0.1:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"x@y.z","password":"x"}'
```

DB sağlıklıysa yanıt: `{"error":"E-posta veya parola hatalı."}` — Postgres hata metni **olmamalı**.

## API servisi

```bash
pnpm --filter @terminalssh/server build
bash deploy/install-api-service.sh
```
