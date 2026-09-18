#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/server/docker-compose.yml"
CONTAINER_NAME="terminalssh-postgres"

run_compose_down() {
  local runner="$1"
  "$runner" compose -f "$COMPOSE_FILE" down
}

stopped=false

if command -v docker >/dev/null 2>&1; then
  if run_compose_down docker 2>/dev/null; then
    stopped=true
  fi
fi

if command -v podman >/dev/null 2>&1; then
  if [[ "$stopped" == false ]] && run_compose_down podman 2>/dev/null; then
    stopped=true
  fi

  if podman container exists "$CONTAINER_NAME" 2>/dev/null; then
    podman stop "$CONTAINER_NAME" >/dev/null
    stopped=true
  fi
fi

if [[ "$stopped" == true ]]; then
  echo "PostgreSQL durduruldu."
  exit 0
fi

echo "Durdurulacak veritabanı container'ı bulunamadı." >&2
exit 0
