#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo " TalentLink one-command launcher"
echo "============================================================"
echo

bash "$ROOT/scripts/prepare-talentlink.sh"

if command -v tmux >/dev/null 2>&1; then
  SESSION="talentlink"
  tmux kill-session -t "$SESSION" 2>/dev/null || true
  tmux new-session -d -s "$SESSION" -c "$ROOT"
  tmux send-keys -t "$SESSION:0.0" "bash '$ROOT/scripts/start-backend.sh'" C-m
  tmux split-window -h -t "$SESSION:0" -c "$ROOT"
  tmux send-keys -t "$SESSION:0.1" "bash '$ROOT/scripts/start-frontend.sh'" C-m
  tmux select-pane -t "$SESSION:0.0"

  echo "Backend and frontend are running in a live split terminal."
  echo "The backend pane remains visible so OTP output is not hidden."
  echo
  exec tmux attach-session -t "$SESSION"
fi

echo "tmux is not installed."
echo "Starting both services with live output in this terminal."
echo

bash "$ROOT/scripts/start-backend.sh" &
BACKEND_PID=$!
bash "$ROOT/scripts/start-frontend.sh" &
FRONTEND_PID=$!

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true' INT TERM EXIT
wait
