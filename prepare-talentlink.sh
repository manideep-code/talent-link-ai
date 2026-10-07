#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER="$ROOT/server"
CLIENT="$ROOT/client"
VENV="$SERVER/venv"

echo "[TalentLink] Preparing environment..."

if [ ! -x "$VENV/bin/python" ]; then
  echo "[TalentLink] Creating Python virtual environment..."
  python -m venv "$VENV"
fi

echo "[TalentLink] Installing/checking backend dependencies..."
"$VENV/bin/python" -m pip install -q -r "$SERVER/requirements.txt"

if [ ! -d "$CLIENT/node_modules" ]; then
  echo "[TalentLink] Installing frontend dependencies..."
  (cd "$CLIENT" && npm install)
fi

echo "[TalentLink] Applying Django migrations..."
(
  cd "$SERVER"
  "$VENV/bin/python" manage.py migrate --noinput
)

echo "[TalentLink] Preparation complete."
