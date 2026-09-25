#!/usr/bin/env bash
# One-command launcher for macOS / Linux.
#   ./start.sh       build the app (when changed) and serve everything on http://localhost:8000
#   ./start.sh dev   developer mode: backend on :8000 plus the React dev server on :3000
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/patient-checkin-system"
BACKEND="$APP/backend"
MODE="${1:-prod}"

# --- Pick a Python that TensorFlow supports (3.9 - 3.12) ---
PY=""
for c in python3.12 python3.11 python3.10 python3.9 python3 python; do
  if command -v "$c" >/dev/null 2>&1; then
    v=$("$c" -c 'import sys; print("%d.%d" % sys.version_info[:2])')
    case "$v" in 3.9|3.10|3.11|3.12) PY="$c"; break ;; esac
  fi
done
if [ -z "$PY" ]; then
  echo "❌ Python 3.9 - 3.12 is required (TensorFlow does not support newer versions)."
  echo "   Install Python 3.11 from https://www.python.org/downloads/ and run this again."
  exit 1
fi
command -v npm >/dev/null 2>&1 || { echo "❌ Node.js is required. Install it from https://nodejs.org/"; exit 1; }

# --- Backend setup (first run, or whenever requirements.txt changes) ---
if [ -d "$BACKEND/venv" ] && ! cmp -s "$BACKEND/requirements.txt" "$BACKEND/venv/requirements.installed"; then
  echo "♻️  requirements.txt changed, rebuilding the Python environment ..."
  rm -rf "$BACKEND/venv"
fi
if [ ! -x "$BACKEND/venv/bin/python" ]; then
  echo "📦 Creating Python virtual environment with $PY ..."
  "$PY" -m venv "$BACKEND/venv"
  "$BACKEND/venv/bin/python" -m pip install --upgrade pip
  "$BACKEND/venv/bin/python" -m pip install -r "$BACKEND/requirements.txt"
  cp "$BACKEND/requirements.txt" "$BACKEND/venv/requirements.installed"
fi

# --- Frontend packages (first run, or whenever package-lock.json changes) ---
if ! cmp -s "$APP/package-lock.json" "$APP/node_modules/.installed-lock"; then
  echo "📦 Installing frontend packages ..."
  (cd "$APP" && npm install)
  cp "$APP/package-lock.json" "$APP/node_modules/.installed-lock"
fi

open_browser() {
  for _ in $(seq 1 120); do
    if curl -s -o /dev/null "http://localhost:$1/api/v1/health" 2>/dev/null; then
      (command -v xdg-open >/dev/null && xdg-open "http://localhost:$2") || (command -v open >/dev/null && open "http://localhost:$2") || true
      return
    fi
    sleep 1
  done
}

if [ "$MODE" = "dev" ]; then
  echo "🚀 Backend on http://localhost:8000, frontend dev server on http://localhost:3000 ..."
  (cd "$BACKEND" && ./venv/bin/python -m uvicorn main:app --port 8000 --reload) &
  BACK_PID=$!
  trap 'kill $BACK_PID 2>/dev/null' EXIT INT TERM
  cd "$APP" && npm start
  exit
fi

# --- Build the app when the source changed since the last build ---
if [ ! -f "$APP/build/index.html" ] || [ -n "$(find "$APP/src" "$APP/public" "$APP/package.json" -newer "$APP/build/index.html" -print -quit)" ]; then
  echo "🛠  Building the app (about a minute) ..."
  (cd "$APP" && npm run build)
fi

echo "🚀 Starting on http://localhost:8000  (press Ctrl+C to stop)"
[ -z "$NO_BROWSER" ] && open_browser 8000 8000 &
cd "$BACKEND" && exec ./venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000
