#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile"
FLUTTER_HOME="${FLUTTER_HOME:-$HOME/flutter}"

resolve_flutter() {
  if command -v flutter >/dev/null 2>&1; then
    command -v flutter
    return 0
  fi

  if [[ -x "$FLUTTER_HOME/bin/flutter" ]]; then
    echo "$FLUTTER_HOME/bin/flutter"
    return 0
  fi

  return 1
}

install_flutter_sdk() {
  if [[ -x "$FLUTTER_HOME/bin/flutter" ]]; then
    return 0
  fi

  echo "Flutter SDK bulunamadı. $FLUTTER_HOME konumuna kuruluyor..."
  git clone --depth 1 -b stable https://github.com/flutter/flutter.git "$FLUTTER_HOME"
}

main() {
  local flutter_bin

  if ! flutter_bin="$(resolve_flutter)"; then
    install_flutter_sdk
    flutter_bin="$FLUTTER_HOME/bin/flutter"
  fi

  export PATH="$(dirname "$flutter_bin"):$PATH"

  echo "Flutter: $($flutter_bin --version | head -n 1)"

  if [[ ! -d "$MOBILE_DIR/android" ]]; then
    echo "Android/iOS platform dosyaları oluşturuluyor..."
    (
      cd "$MOBILE_DIR"
      "$flutter_bin" create . --org com.terminalssh --project-name terminal_ssh_mobile
    )
  fi

  (
    cd "$MOBILE_DIR"
    "$flutter_bin" pub get
  )

  echo
  echo "Kurulum tamam. Sonraki adımlar:"
  echo "  export PATH=\"$(dirname "$flutter_bin"):\$PATH\""
  echo "  $flutter_bin doctor"
  echo "  cd mobile && flutter run"
  echo
  echo "Release APK:"
  echo "  cd mobile && flutter build apk --release"
}

main "$@"
