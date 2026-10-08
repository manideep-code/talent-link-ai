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

  if command -v gh >/dev/null 2>&1; then
    echo "[TalentLink] Setting API port 8000 to public..."

    if gh codespace ports visibility 8000:public; then
      echo "[TalentLink] API port 8000 is public."
    else
      echo "[TalentLink] Warning: could not automatically set port 8000 to public."
    fi
  else
    echo "[TalentLink] Warning: GitHub CLI (gh) is not available."
  fi

  echo
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

  # Give the backend a moment to start, then make port 8000 public.
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