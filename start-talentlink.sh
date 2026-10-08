#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo " TalentLink one-command launcher"
echo "============================================================"
echo

bash "$ROOT/scripts/prepare-talentlink.sh"


set_backend_public() {
  echo
  echo "[TalentLink] Waiting for backend port 8000..."

  for i in {1..30}; do
    if (echo >/dev/tcp/127.0.0.1/8000) >/dev/null 2>&1; then
      echo "[TalentLink] Backend is listening on port 8000."
      break
    fi

    sleep 1
  done

  if ! (echo >/dev/tcp/127.0.0.1/8000) >/dev/null 2>&1; then
    echo "[TalentLink] ERROR: Backend did not start on port 8000."
    return 1
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "[TalentLink] ERROR: GitHub CLI (gh) is not available."
    return 1
  fi

  if [ -z "${CODESPACE_NAME:-}" ]; then
    echo "[TalentLink] ERROR: CODESPACE_NAME is not available."
    return 1
  fi

  echo "[TalentLink] Setting API port 8000 to public..."
  echo "[TalentLink] Codespace: $CODESPACE_NAME"

  # Explicitly target THIS Codespace.
  gh codespace ports visibility \
    8000:public \
    --codespace "$CODESPACE_NAME"

  echo "[TalentLink] Verifying port 8000 visibility..."

  for i in {1..10}; do
    VISIBILITY="$(
      gh codespace ports \
        --codespace "$CODESPACE_NAME" \
        --json sourcePort,visibility \
        --jq '.[] | select(.sourcePort == 8000) | .visibility' \
        2>/dev/null || true
    )"

    if [ "$VISIBILITY" = "public" ]; then
      echo "[TalentLink] API port 8000 is PUBLIC."
      echo
      return 0
    fi

    sleep 1
  done

  echo "[TalentLink] ERROR: Port 8000 could not be confirmed as public."
  echo "[TalentLink] Current port information:"
  gh codespace ports --codespace "$CODESPACE_NAME" || true

  return 1
}


if command -v tmux >/dev/null 2>&1; then
  SESSION="talentlink"

  tmux kill-session -t "$SESSION" 2>/dev/null || true

  tmux new-session -d -s "$SESSION" -c "$ROOT"

  tmux send-keys \
    -t "$SESSION:0.0" \
    "bash '$ROOT/scripts/start-backend.sh'" \
    C-m

  tmux split-window -h -t "$SESSION:0" -c "$ROOT"

  tmux send-keys \
    -t "$SESSION:0.1" \
    "bash '$ROOT/scripts/start-frontend.sh'" \
    C-m

  tmux select-pane -t "$SESSION:0.0"

  echo "Backend and frontend are running in a live split terminal."
  echo "The backend pane remains visible so OTP output is not hidden."
  echo

  set_backend_public

  exec tmux attach-session -t "$SESSION"
fi


echo "tmux is not installed."
echo "Starting both services with live output in this terminal."
echo

bash "$ROOT/scripts/start-backend.sh" &
BACKEND_PID=$!

bash "$ROOT/scripts/start-frontend.sh" &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

set_backend_public

wait