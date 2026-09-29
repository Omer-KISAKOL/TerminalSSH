# Canlı sunucu (API)

## Giriş hatası: `password authentication failed for user "terminalssh"`

Bu mesaj **mobil/desktop kaynaklı değildir**; canlı API PostgreSQL’e bağlanamıyor demektir.

Sunucuda (SSH):

```bash
cd /path/to/TerminalSSH
git pull
bash deploy/fix-postgres-auth.sh
```

`server/.env` içinde port **5433** olmalı (`docker-compose` host portu; **5432** genelde başka Postgres):

```env
DATABASE_URL=postgresql://terminalssh:terminalssh@127.0.0.1:5433/terminalssh
```

`5432` kaldıysa giriş yine Postgres hatası verir; `fix-postgres-auth.sh` bunu otomatik düzeltir.

Parolayı değiştirdiyseniz `TERMINALSSH_PG_PASSWORD=...` ile script’e verin veya `ALTER USER` ile eşitleyin.

Kontrol:

```bash
curl -s -X POST http://127.0.0.1:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com","password":"x"}'
```

DB sağlıklıysa yanıt: `{"error":"E-posta veya parola hatalı."}` — Postgres hata metni **olmamalı**.

## API servisi

```bash
pnpm --filter @terminalssh/server build
bash deploy/install-api-service.sh
```
