#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ICON_DIR="$ROOT_DIR/resources/icons"
SVG="$ICON_DIR/icon.svg"

mkdir -p "$ICON_DIR/icons"

magick -background none "$SVG" -resize 512x512 "$ICON_DIR/icon.png"
magick -background none "$SVG" -resize 256x256 "$ICON_DIR/icons/256x256.png"
magick -background none "$SVG" -resize 128x128 "$ICON_DIR/icons/128x128.png"
magick -background none "$SVG" -resize 64x64 "$ICON_DIR/icons/64x64.png"
magick -background none "$SVG" -resize 48x48 "$ICON_DIR/icons/48x48.png"
magick -background none "$SVG" -resize 32x32 "$ICON_DIR/icons/32x32.png"
magick -background none "$SVG" -resize 16x16 "$ICON_DIR/icons/16x16.png"
magick "$ICON_DIR/icon.png" -define icon:auto-resize=256,128,64,48,32,16 "$ICON_DIR/icon.ico"

echo "Icons generated in $ICON_DIR"
