#!/bin/sh

set -eu

DEVICE_SERIAL=""
INSTALL_APK="true"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h)
      cat <<'EOF'
Usage: npm run release:android:local -- [--device <serial>] [--no-install]

Builds a signed Android release APK, then installs it to one connected USB device.
Pass --no-install to only build the APK.
EOF
      exit 0
      ;;
    --no-install)
      INSTALL_APK="false"
      shift
      ;;
    --device)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --device." >&2
        exit 1
      fi
      DEVICE_SERIAL="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(CDPATH= cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$REPO_ROOT/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

resolve_adb_path() {
  for candidate in \
    "${ADB_PATH-}" \
    "${ANDROID_SDK_ROOT-}/platform-tools/adb" \
    "${ANDROID_HOME-}/platform-tools/adb" \
    "$HOME/Library/Android/sdk/platform-tools/adb" \
    "adb"
  do
    if [ -z "$candidate" ]; then
      continue
    fi

    if command -v "$candidate" >/dev/null 2>&1; then
      printf '%s' "$candidate"
      return 0
    fi

    if [ -x "$candidate" ]; then
      printf '%s' "$candidate"
      return 0
    fi
  done

  return 1
}

sh "$SCRIPT_DIR/build-android-release.sh"

if [ "$INSTALL_APK" != "true" ]; then
  exit 0
fi

ADB_BIN="$(resolve_adb_path || true)"
if [ -z "$ADB_BIN" ]; then
  echo 'adb was not found. Install Android platform-tools or set ADB_PATH.' >&2
  exit 1
fi

DEVICES="$("$ADB_BIN" devices | tail -n +2 | sed '/^[[:space:]]*$/d' | awk -F'\t' '$2=="device" { print $1 }')"

if [ -n "$DEVICE_SERIAL" ]; then
  if ! printf '%s\n' "$DEVICES" | grep -Fx "$DEVICE_SERIAL" >/dev/null 2>&1; then
    echo "Requested device $DEVICE_SERIAL is not connected. Connected devices: ${DEVICES:-none}" >&2
    exit 1
  fi
  TARGET_DEVICE="$DEVICE_SERIAL"
else
  DEVICE_COUNT="$(printf '%s\n' "$DEVICES" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo 'No Android devices detected via adb. Connect a device or pass --no-install.' >&2
    exit 1
  fi
  if [ "$DEVICE_COUNT" -gt 1 ]; then
    echo "Multiple Android devices detected: $(printf '%s' "$DEVICES" | paste -sd ', ' -). Re-run with --device <serial>." >&2
    exit 1
  fi
  TARGET_DEVICE="$(printf '%s\n' "$DEVICES" | head -n 1)"
fi

echo "> $ADB_BIN -s $TARGET_DEVICE install -r $APK_PATH"
"$ADB_BIN" -s "$TARGET_DEVICE" install -r "$APK_PATH"
echo "Installed on device $TARGET_DEVICE."
