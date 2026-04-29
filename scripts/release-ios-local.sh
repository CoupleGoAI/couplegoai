#!/bin/sh

set -eu

CLEAN_PREBUILD="false"
DEVICE_ID=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h)
      cat <<'EOF'
Usage: npm run release:ios:native
       npm run ios:release:debug

Builds and installs a local iOS Release build on a connected iPhone.

Options:
  --clean             Regenerate ios/ before building
  --no-clean          Reuse existing ios/ project
  --device <id>       Install on a specific device identifier or name

Required env in shell, .env, or .env.local:
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  EXPO_PUBLIC_SUPABASE_ANON_KEY

Optional env:
  IOS_DEVELOPMENT_TEAM     Apple Developer Team ID for local signing
EOF
      exit 0
      ;;
    --clean)
      CLEAN_PREBUILD="true"
      shift
      ;;
    --no-clean)
      CLEAN_PREBUILD="false"
      shift
      ;;
    --device)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --device." >&2
        exit 1
      fi
      DEVICE_ID="$2"
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
IOS_DIR="$REPO_ROOT/ios"
APP_PATH="$REPO_ROOT/ios/build/Build/Products/Release-iphoneos/CoupleGoAI.app"

load_env_file() {
  ENV_PATH="$1"

  if [ -f "$ENV_PATH" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_PATH"
    set +a
  fi
}

require_env() {
  NAME="$1"
  VALUE="$(eval "printf '%s' \"\${$NAME-}\"")"

  if [ -z "$VALUE" ]; then
    echo "Missing required env var: $NAME" >&2
    exit 1
  fi
}

require_command() {
  NAME="$1"

  if ! command -v "$NAME" >/dev/null 2>&1; then
    echo "Missing required command: $NAME" >&2
    exit 1
  fi
}

resolve_device_id() {
  REQUESTED_DEVICE="$1"

  xcodebuild -workspace "$IOS_DIR/CoupleGoAI.xcworkspace" -scheme CoupleGoAI -showdestinations 2>/dev/null \
    | awk -v requested="$REQUESTED_DEVICE" '
      /platform:iOS,/ && /arch:arm64/ && $0 !~ /Simulator/ && $0 !~ /placeholder/ {
        id = $0
        sub(/^.*id:/, "", id)
        sub(/,.*/, "", id)

        name = $0
        sub(/^.*name:/, "", name)
        sub(/ }.*/, "", name)

        if (requested == "" || requested == id || requested == name || index(name, requested) > 0) {
          print id
          exit
        }
      }
    '
}

cd "$REPO_ROOT"

load_env_file "$REPO_ROOT/.env"
load_env_file "$REPO_ROOT/.env.local"

require_env EXPO_PUBLIC_SUPABASE_URL
require_env EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
require_env EXPO_PUBLIC_SUPABASE_ANON_KEY

require_command xcodebuild
require_command xcrun
require_command pod
require_command security

if [ "$(uname -s)" != "Darwin" ]; then
  echo "iOS native release builds require macOS." >&2
  exit 1
fi

if [ "$CLEAN_PREBUILD" = "true" ] || [ ! -d "$IOS_DIR" ]; then
  echo "> CI=1 npx expo prebuild --platform ios --clean"
  CI=1 npx expo prebuild --platform ios --clean
else
  echo "> CI=1 npx expo prebuild --platform ios"
  CI=1 npx expo prebuild --platform ios
fi

DEVELOPMENT_TEAM="${IOS_DEVELOPMENT_TEAM-}"
if [ -z "$DEVELOPMENT_TEAM" ]; then
  DEVELOPMENT_TEAM="$(security find-identity -v -p codesigning | sed -n 's/.*Apple Development: .* (\([A-Z0-9][A-Z0-9]*\)).*/\1/p' | head -n 1)"
fi

if [ -z "$DEVELOPMENT_TEAM" ]; then
  echo "Could not find an Apple Development signing identity. Sign into Xcode or set IOS_DEVELOPMENT_TEAM." >&2
  exit 1
fi

DEVICE_ID="$(resolve_device_id "$DEVICE_ID")"

if [ -z "$DEVICE_ID" ]; then
  echo "No paired iPhone found. Connect and trust your iPhone, or pass --device <id>." >&2
  xcodebuild -workspace "$IOS_DIR/CoupleGoAI.xcworkspace" -scheme CoupleGoAI -showdestinations >&2
  exit 1
fi

echo "> xcodebuild -workspace ios/CoupleGoAI.xcworkspace -scheme CoupleGoAI -configuration Release -destination id=$DEVICE_ID -derivedDataPath ios/build build"
xcodebuild \
  -workspace "$IOS_DIR/CoupleGoAI.xcworkspace" \
  -scheme CoupleGoAI \
  -configuration Release \
  -destination "id=$DEVICE_ID" \
  -derivedDataPath "$IOS_DIR/build" \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" \
  build

if [ ! -d "$APP_PATH" ]; then
  echo "Release app was not created at $APP_PATH." >&2
  exit 1
fi

echo "> xcrun devicectl device install app --device $DEVICE_ID $APP_PATH"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"

if command -v ios-deploy >/dev/null 2>&1; then
  echo "> ios-deploy --id $DEVICE_ID --justlaunch --bundle_id com.couplegoai.app"
  ios-deploy --id "$DEVICE_ID" --justlaunch --bundle_id com.couplegoai.app
else
  echo "Installed standalone iOS Release app on $DEVICE_ID. Open CoupleGoAI from the device home screen."
fi
