#!/usr/bin/env bash
# Start an automation Chrome: its own profile, its own window, debug port open.
#
# This is deliberately NOT your everyday Chrome. Each profile keeps its own
# login and cookies under ./profiles/<name>, so a script driving one can never
# wander into your normal browsing session, and two Claude accounts can be
# signed in at once without fighting each other.
#
#   ./bin/start-chrome.sh opterra     -> profile "opterra",  port 9223
#   ./bin/start-chrome.sh personal    -> profile "personal", port 9224
#
# Run this once per account, sign into claude.ai in the window that opens, and
# leave it open. Scripts attach to it by port.

set -euo pipefail

NAME="${1:-default}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="$HERE/profiles/$NAME"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Stable port per profile name so you never have to remember which is which.
case "$NAME" in
  opterra)  PORT=9223 ;;
  personal) PORT=9224 ;;
  *)        PORT="${CLAUDE_SYNC_PORT:-9225}" ;;
esac

if [ ! -x "$CHROME" ]; then
  echo "Chrome not found at: $CHROME" >&2
  exit 1
fi

if curl -s --max-time 2 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
  echo "Profile '$NAME' is already running on port $PORT. Nothing to do."
  exit 0
fi

mkdir -p "$PROFILE"

"$CHROME" \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$PROFILE" \
  --no-first-run \
  --no-default-browser-check \
  "https://claude.ai/projects" \
  >/dev/null 2>&1 &

echo "Launching Chrome profile '$NAME' on port $PORT"
echo "Profile dir: $PROFILE"

for _ in $(seq 1 30); do
  if curl -s --max-time 1 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
    echo
    echo "Ready. Sign into the '$NAME' Claude account in the window that just"
    echo "opened, then leave the window open."
    echo
    echo "Scripts talk to this profile with:  --port $PORT"
    exit 0
  fi
  sleep 0.5
done

echo "Chrome started but the debug port never came up. Check the window." >&2
exit 1
