#!/usr/bin/env bash
# Canlı sunucuda (188.34.155.223) çalıştırın: monorepo kökünden
#   bash deploy/fix-postgres-auth.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/server/.env"
COMPOSE_FILE="$ROOT_DIR/server/docker-compose.yml"
CONTAINER="${TERMINALSSH_PG_CONTAINER:-terminalssh-postgres}"
PG_USER="${TERMINALSSH_PG_USER:-terminalssh}"
PG_DB="${TERMINALSSH_PG_DB:-terminalssh}"
PG_PASSWORD="${TERMINALSSH_PG_PASSWORD:-terminalssh}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Hata: $ENV_FILE bulunamadı."
  exit 1
fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' | tr -d '"')"
if [[ -z "$DATABASE_URL" ]]; then
  echo "Hata: DATABASE_URL server/.env içinde tanımlı değil."
  exit 1
fi

runtime_for_container() {
  if command -v podman >/dev/null 2>&1 && podman container exists "$CONTAINER" 2>/dev/null; then
    echo podman
    return 0
  fi
  if command -v docker >/dev/null 2>&1 && docker container inspect "$CONTAINER" >/dev/null 2>&1; then
    echo docker
    return 0
  fi
  return 1
}

RUNTIME=""
if ! RUNTIME="$(runtime_for_container)"; then
  echo "Postgres konteyneri ($CONTAINER) yok. Başlatılıyor..."
  if command -v podman-compose >/dev/null 2>&1; then
    (cd "$ROOT_DIR/server" && podman-compose -f docker-compose.yml up -d)
  elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    (cd "$ROOT_DIR/server" && docker compose up -d)
  else
    echo "podman-compose veya docker compose gerekli."
    exit 1
  fi
  RUNTIME="$(runtime_for_container)"
fi

echo "Konteyner: $CONTAINER ($RUNTIME)"
echo "Beklenen DATABASE_URL: postgresql://${PG_USER}:****@localhost:5433/${PG_DB}"

if [[ "$DATABASE_URL" != *"@localhost:5433/"* ]] && [[ "$DATABASE_URL" != *"@127.0.0.1:5433/"* ]]; then
  echo "Uyarı: DATABASE_URL port/host docker-compose (127.0.0.1:5433) ile uyuşmuyor olabilir."
  echo "  Mevcut: $DATABASE_URL"
fi

echo "Postgres kullanıcı parolası senkronize ediliyor..."
"$RUNTIME" exec "$CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
  "ALTER USER ${PG_USER} WITH PASSWORD '${PG_PASSWORD}';"

export DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:5433/${PG_DB}"
if command -v psql >/dev/null 2>&1; then
  psql "$DATABASE_URL" -c 'SELECT 1 AS ok;'
else
  "$RUNTIME" exec "$CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c 'SELECT 1 AS ok;'
fi

if systemctl is-active terminalssh-api >/dev/null 2>&1; then
  sudo systemctl restart terminalssh-api
  echo "terminalssh-api yeniden başlatıldı."
else
  echo "systemd servisi yok; API'yi elle yeniden başlatın."
fi

echo "Test:"
curl -sf -X POST http://127.0.0.1:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"health-check@invalid.local","password":"x"}' | head -c 200 || true
echo
echo "Beklenen: {\"error\":\"E-posta veya parola hatalı.\"} (DB bağlantısı çalışıyorsa)"
