#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT="$ROOT/client"

cd "$CLIENT"

if [ ! -d "node_modules" ]; then
  npm install
fi

echo
echo "============================================================"
echo " TalentLink FRONTEND"
echo " React: http://0.0.0.0:3000/"
echo "============================================================"
echo

HOST=0.0.0.0 PORT=3000 npm start
