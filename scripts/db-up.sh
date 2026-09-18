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

Yaygın nedenler:
- 5432 portu dolu (yerel PostgreSQL): ss -tlnp | grep 5432
- Eski container çakışması: docker ps -a | grep terminalssh-postgres

Manuel deneme:
  docker compose -f server/docker-compose.yml up -d

Docker yoksa yerel PostgreSQL:
  sudo apt install postgresql postgresql-contrib
  bash scripts/db-native-setup.sh
EOF
}

try_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi

  echo "Docker Compose ile PostgreSQL başlatılıyor..."
  if run_compose docker; then
    echo "PostgreSQL başlatıldı (docker compose)."
    return 0
  fi

  return 1
}

try_podman() {
  if ! command -v podman >/dev/null 2>&1; then
    return 1
  fi

  echo "Podman Compose ile PostgreSQL başlatılıyor..."
  if run_compose podman; then
    echo "PostgreSQL başlatıldı (podman compose)."
    return 0
  fi

  echo "Podman run ile PostgreSQL başlatılıyor..."
  if start_podman_container; then
    echo "PostgreSQL başlatıldı (podman run)."
    return 0
  fi

  return 1
}

if try_docker || try_podman; then
  exit 0
fi

print_help
exit 1
