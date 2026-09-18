#!/usr/bin/env bash
set -euo pipefail

# Fedora / RHEL yerel PostgreSQL kurulumu (Docker/Podman olmadan geliştirme için).
# Çalıştırma: bash scripts/db-native-setup.sh

if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL istemcisi yok. Kurulum:"
  echo "  sudo dnf install postgresql-server postgresql"
  exit 1
fi

if ! systemctl is-active --quiet postgresql 2>/dev/null; then
  echo "PostgreSQL servisi çalışmıyor. Önce:"
  echo "  sudo dnf install postgresql-server"
  echo "  sudo postgresql-setup --initdb"
  echo "  sudo systemctl enable --now postgresql"
  exit 1
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'terminalssh') THEN
    CREATE ROLE terminalssh LOGIN PASSWORD 'terminalssh';
  END IF;
END
$$;

SELECT 'CREATE DATABASE terminalssh OWNER terminalssh'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'terminalssh')\gexec
SQL

echo ""
echo "Yerel PostgreSQL hazır."
echo "server/.env içindeki DATABASE_URL zaten şu değere uygun olmalı:"
echo "  postgresql://terminalssh:terminalssh@localhost:5432/terminalssh"
echo ""
echo "Sonraki adım:"
echo "  pnpm --filter @terminalssh/server db:migrate"
