#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${1:-$ROOT_DIR/desktop/release}"
DEST_DIR="$ROOT_DIR/server/data/releases/electron"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Hata: Kaynak klasör yok: $SOURCE_DIR" >&2
  echo "Önce desktop/release üretin (pnpm dist:win / dist:linux / mac)." >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

shopt -s nullglob
copied=0
# AppImage kopyalanmaz (git/LFS ile dağıtılır). RPM dosya adı küçük harflidir:
# terminalssh-<sürüm>.x86_64.rpm — bu yüzden 'terminalssh*.rpm' kullanılır.
for pattern in 'latest*.yml' 'TerminalSSH*.exe' 'terminalssh*.rpm' 'TerminalSSH*.dmg' 'TerminalSSH*.zip' '*.blockmap'; do
  for file in "$SOURCE_DIR"/$pattern; do
    cp -f "$file" "$DEST_DIR/"
    echo "Kopyalandı: $(basename "$file")"
    copied=$((copied + 1))
  done
done

if [[ "$copied" -eq 0 ]]; then
  echo "Uyarı: Kopyalanacak electron-builder çıktısı bulunamadı." >&2
  exit 1
fi

echo "Tamam: $DEST_DIR"

export PUBLIC_RELEASE_BASE_URL="${PUBLIC_RELEASE_BASE_URL:-http://188.34.155.223:8787}"
if command -v pnpm >/dev/null 2>&1; then
  pnpm --filter @terminalssh/server releases:sync
else
  echo "Uyarı: pnpm yok; releases.json için 'pnpm releases:sync' çalıştırın."
fi