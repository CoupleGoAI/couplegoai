#!/bin/bash

# ── config ──────────────────────────────────────────────
DEVICE_1="iPhone 16e"
DEVICE_2="iPhone 17 Pro"
PROJECT_DIR="$(pwd)"
EXPO_PORT=8081
# ────────────────────────────────────────────────────────

echo "🚀 Booting simulators..."

UDID_1=$(xcrun simctl list devices available | grep "$DEVICE_1" | head -1 | grep -E -o '[0-9A-F-]{36}')
UDID_2=$(xcrun simctl list devices available | grep "$DEVICE_2" | head -1 | grep -E -o '[0-9A-F-]{36}')

if [ -z "$UDID_1" ] || [ -z "$UDID_2" ]; then
  echo "❌ Could not find simulators. Run:"
  echo "   xcrun simctl list devices available"
  exit 1
fi

echo "📱 Device 1: $DEVICE_1 ($UDID_1)"
echo "📱 Device 2: $DEVICE_2 ($UDID_2)"

xcrun simctl boot "$UDID_1" 2>/dev/null
xcrun simctl boot "$UDID_2" 2>/dev/null
open -a Simulator

sleep 5

# Background job opens simulators once Expo has had time to start
(
  sleep 20
  echo ""
  echo "📲 Opening Expo in simulators..."
  xcrun simctl openurl "$UDID_1" "exp://127.0.0.1:$EXPO_PORT"
  sleep 2
  xcrun simctl openurl "$UDID_2" "exp://127.0.0.1:$EXPO_PORT"
  echo "✅ Simulators launched!"
) &

# Hand terminal over to Expo — fully interactive from here
echo "🟢 Starting Expo (you have full control)..."
cd "$PROJECT_DIR"
npm run start:prod:clear