#!/usr/bin/env bash
set -Eeuo pipefail

# TalentLink one-command Codespaces startup
# Usage from the repository root:
#   bash start-talentlink.sh
#
# It:
#   1. prepares the Django virtual environment
#   2. installs backend/frontend dependencies when needed
#   3. applies Django migrations
#   4. makes the frontend API calls Codespaces-safe via the CRA proxy
#   5. starts Django on 0.0.0.0:8000
#   6. starts React on 0.0.0.0:3000
#   7. prints the app URL for Codespaces

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

die() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

command -v python >/dev/null 2>&1 || die "Python is not installed."
command -v npm >/dev/null 2>&1 || die "Node/npm is not installed."

[ -f "$SERVER_DIR/manage.py" ] || die "server/manage.py not found."
[ -f "$SERVER_DIR/requirements.txt" ] || die "server/requirements.txt not found."
[ -f "$CLIENT_DIR/package.json" ] || die "client/package.json not found."

cd "$ROOT_DIR"

# ------------------------------------------------------------
# 1. Python virtual environment
# ------------------------------------------------------------
if [ -x "$SERVER_DIR/venv/bin/python" ]; then
  VENV_PYTHON="$SERVER_DIR/venv/bin/python"
elif [ -x "$SERVER_DIR/.venv/bin/python" ]; then
  VENV_PYTHON="$SERVER_DIR/.venv/bin/python"
else
  log "Creating server/venv ..."
  python -m venv "$SERVER_DIR/venv"
  VENV_PYTHON="$SERVER_DIR/venv/bin/python"
fi

log "Installing backend dependencies ..."
"$VENV_PYTHON" -m pip install -r "$SERVER_DIR/requirements.txt"

# ------------------------------------------------------------
# 2. Frontend dependencies
# ------------------------------------------------------------
if [ ! -d "$CLIENT_DIR/node_modules" ]; then
  log "Installing frontend dependencies ..."
  (
    cd "$CLIENT_DIR"
    npm install
  )
fi

# ------------------------------------------------------------
# 3. Make the existing API client work from a forwarded
#    Codespaces browser URL.
#
#    CRA serves the UI on port 3000 and proxies /api/* to Django
#    on port 8000 inside the same Codespace. This removes the
#    browser dependency on 127.0.0.1:8000.
# ------------------------------------------------------------
log "Checking frontend API configuration ..."

python - "$CLIENT_DIR/src/utils/axiosInstance.js" "$CLIENT_DIR/package.json" <<'PY'
from pathlib import Path
import json
import shutil
import sys

axios_path = Path(sys.argv[1])
package_path = Path(sys.argv[2])

# Patch known hard-coded local API URLs only when they are present.
# A one-time .bak file is kept beside the source file.
if axios_path.exists():
    original = axios_path.read_text(encoding="utf-8")
    updated = original

    replacements = {
        "http://127.0.0.1:8000/api/": "/api/",
        "http://localhost:8000/api/": "/api/",
        "http://127.0.0.1:8000/api/users/token/refresh/": "/api/users/token/refresh/",
        "http://localhost:8000/api/users/token/refresh/": "/api/users/token/refresh/",
    }

    for old, new in replacements.items():
        updated = updated.replace(old, new)

    if updated != original:
        backup = axios_path.with_suffix(axios_path.suffix + ".bak")
        if not backup.exists():
            shutil.copy2(axios_path, backup)
        axios_path.write_text(updated, encoding="utf-8")
        print(f"Updated API client: {axios_path}")
    else:
        print("API client already uses a portable API base or contains no known hard-coded localhost URL.")
else:
    print(f"WARNING: {axios_path} not found; API-client patch skipped.")

# Add CRA's development proxy without disturbing existing scripts/dependencies.
data = json.loads(package_path.read_text(encoding="utf-8"))
desired_proxy = "http://127.0.0.1:8000"

if data.get("proxy") != desired_proxy:
    data["proxy"] = desired_proxy
    package_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Set client proxy: {desired_proxy}")
else:
    print("Client proxy already configured.")
PY

# ------------------------------------------------------------
# 4. Database migrations
# ------------------------------------------------------------
log "Applying Django migrations ..."
(
  cd "$SERVER_DIR"
  "$VENV_PYTHON" manage.py migrate --noinput
)

# ------------------------------------------------------------
# 5. Stop old TalentLink dev servers started from this repo.
#    Do not kill unrelated Python/Node processes.
# ------------------------------------------------------------
stop_old_processes() {
  local patterns=(
    "$SERVER_DIR.*manage.py runserver"
    "$CLIENT_DIR.*react-scripts start"
  )

  for pattern in "${patterns[@]}"; do
    if command -v pkill >/dev/null 2>&1; then
      pkill -f "$pattern" 2>/dev/null || true
    fi
  done
}

stop_old_processes
sleep 1

# ------------------------------------------------------------
# 6. Start backend
# ------------------------------------------------------------
log "Starting Django on 0.0.0.0:${BACKEND_PORT} ..."
(
  cd "$SERVER_DIR"
  exec "$VENV_PYTHON" manage.py runserver "0.0.0.0:${BACKEND_PORT}"
) >"$ROOT_DIR/.talentlink-backend.log" 2>&1 &

BACKEND_PID=$!

# ------------------------------------------------------------
# 7. Start frontend
# ------------------------------------------------------------
log "Starting React on 0.0.0.0:${FRONTEND_PORT} ..."
(
  cd "$CLIENT_DIR"
  exec npm start -- --host 0.0.0.0 --port "$FRONTEND_PORT"
) >"$ROOT_DIR/.talentlink-frontend.log" 2>&1 &

FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM

# ------------------------------------------------------------
# 8. Wait briefly for both services
# ------------------------------------------------------------
wait_for_port() {
  local port="$1"
  local name="$2"

  for _ in $(seq 1 60); do
    if (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  printf '\n%s did not become ready. Check its log:\n' "$name"
  printf '  %s\n' "$ROOT_DIR/.talentlink-${name,,}.log"
  return 1
}

wait_for_port "$BACKEND_PORT" "backend" || true
wait_for_port "$FRONTEND_PORT" "frontend" || true

# ------------------------------------------------------------
# 9. Print a Codespaces URL which GitHub recognizes as a
#    forwarded-port URL.
# ------------------------------------------------------------
if [ "${CODESPACES:-false}" = "true" ] && [ -n "${CODESPACE_NAME:-}" ] && [ -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; then
  APP_URL="https://${CODESPACE_NAME}-${FRONTEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
  APP_URL="http://localhost:${FRONTEND_PORT}"
fi

printf '\n============================================================\n'
printf '  TalentLink is starting\n'
printf '  Frontend: %s\n' "$APP_URL"
printf '  Backend:  http://127.0.0.1:%s\n' "$BACKEND_PORT"
printf '============================================================\n\n'
printf 'Codespaces will auto-forward the ports. The repository devcontainer\n'
printf 'configuration below is set to open the frontend in a browser tab.\n\n'
printf 'Logs:\n'
printf '  Backend:  %s/.talentlink-backend.log\n' "$ROOT_DIR"
printf '  Frontend: %s/.talentlink-frontend.log\n' "$ROOT_DIR"
printf '\nPress Ctrl+C to stop the servers.\n\n'

# Keep this terminal attached while the child processes run.
wait
