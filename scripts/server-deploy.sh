#!/usr/bin/env bash
# Canlı API güncelleme — deploy/README.md ile uyumlu.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

git pull
git lfs pull

export PUBLIC_RELEASE_BASE_URL="${1:-${PUBLIC_RELEASE_BASE_URL:-http://188.34.155.223:8787}}"
pnpm --filter @terminalssh/server releases:sync

pnpm install
pnpm --filter @terminalssh/api-client build
pnpm --filter @terminalssh/server build

if [[ "${RUN_DB_MIGRATE:-}" == "1" ]]; then
  pnpm --filter @terminalssh/server db:migrate
fi

echo "Build tamam. Servisi yeniden başlatın: sudo systemctl restart terminalssh-api"