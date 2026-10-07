#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER="$ROOT/server"
VENV="$SERVER/venv"

if [ ! -x "$VENV/bin/python" ]; then
  python -m venv "$VENV"
  "$VENV/bin/python" -m pip install -q -r "$SERVER/requirements.txt"
fi

cd "$SERVER"

if command -v fuser >/dev/null 2>&1; then
  fuser -k 8000/tcp 2>/dev/null || true
fi

echo
echo "============================================================"
echo " TalentLink BACKEND"
echo " Django: http://0.0.0.0:8000/"
echo " OTP EMAILS WILL APPEAR LIVE IN THIS TERMINAL"
echo "============================================================"
echo

exec "$VENV/bin/python" manage.py runserver 0.0.0.0:8000
