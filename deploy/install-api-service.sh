#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="terminalssh-api"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_FILE="$ROOT_DIR/deploy/terminalssh-api.service"
NODE_BIN="$(command -v node)"

if [[ ! -f "$ROOT_DIR/server/dist/index.js" ]]; then
  echo "Önce build alın: pnpm --filter @terminalssh/server build"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/server/.env" ]]; then
  echo "server/.env bulunamadı."
  exit 1
fi

TEMP_SERVICE="$(mktemp)"
sed \
  -e "s|ExecStart=.*|ExecStart=${NODE_BIN} ${ROOT_DIR}/server/dist/index.js|" \
  -e "s|WorkingDirectory=.*|WorkingDirectory=${ROOT_DIR}/server|" \
  -e "s|EnvironmentFile=.*|EnvironmentFile=${ROOT_DIR}/server/.env|" \
  "$SERVICE_FILE" > "$TEMP_SERVICE"

sudo cp "$TEMP_SERVICE" "/etc/systemd/system/${SERVICE_NAME}.service"
rm -f "$TEMP_SERVICE"

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo "Servis kuruldu."
systemctl status "$SERVICE_NAME" --no-pager
