#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/server/docker-compose.yml"
CONTAINER_NAME="terminalssh-postgres"
VOLUME_NAME="terminalssh_pg_data"
IMAGE="docker.io/library/postgres:16-alpine"

run_compose() {
  local runner="$1"
  "$runner" compose -f "$COMPOSE_FILE" up -d
}

start_podman_container() {
  if podman container exists "$CONTAINER_NAME" 2>/dev/null; then
    podman start "$CONTAINER_NAME"
  else
    podman run -d \
      --name "$CONTAINER_NAME" \
      -e POSTGRES_USER=terminalssh \
      -e POSTGRES_PASSWORD=terminalssh \
      -e POSTGRES_DB=terminalssh \
      -p 5432:5432 \
      -v "${VOLUME_NAME}:/var/lib/postgresql/data:Z" \
      "$IMAGE"
  fi
}

print_help() {
  cat >&2 <<'EOF'
Hata: PostgreSQL container başlatılamadı.

Fedora seçenekleri:

1) Podman compose eklentisi:
   sudo dnf install podman-compose
   pnpm db:up

2) Docker uyumluluk (docker → podman):
   sudo dnf install podman-docker
   pnpm db:up

3) Yerel PostgreSQL (container olmadan):
   bash scripts/db-native-setup.sh
EOF
}

if command -v docker >/dev/null 2>&1; then
  if run_compose docker 2>/dev/null; then
    echo "PostgreSQL başlatıldı (docker compose)."
    exit 0
  fi
fi

if command -v podman >/dev/null 2>&1; then
  if run_compose podman 2>/dev/null; then
    echo "PostgreSQL başlatıldı (podman compose)."
    exit 0
  fi

  if start_podman_container 2>/dev/null; then
    echo "PostgreSQL başlatıldı (podman run)."
    exit 0
  fi
fi

print_help
exit 127
