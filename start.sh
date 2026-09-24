#!/usr/bin/env bash
# One-command launcher for macOS / Linux.
# Sets up the backend venv and frontend packages on first run, then starts both.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/patient-checkin-system"
BACKEND="$APP/backend"

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

# --- Backend setup (first run only) ---
if [ ! -x "$BACKEND/venv/bin/python" ]; then
  echo "📦 Creating Python virtual environment with $PY ..."
  "$PY" -m venv "$BACKEND/venv"
  "$BACKEND/venv/bin/python" -m pip install --upgrade pip
  "$BACKEND/venv/bin/python" -m pip install -r "$BACKEND/requirements.txt"
fi

# --- Frontend setup (first run only) ---
if [ ! -d "$APP/node_modules" ]; then
  echo "📦 Installing frontend packages ..."
  (cd "$APP" && npm install)
fi

# --- Start both; stop the backend when the frontend is closed ---
echo "🚀 Starting backend on http://localhost:8000 ..."
(cd "$BACKEND" && ./venv/bin/python -m uvicorn main:app --port 8000) &
BACK_PID=$!
trap 'kill $BACK_PID 2>/dev/null' EXIT INT TERM

echo "🚀 Starting frontend on http://localhost:3000 ..."
cd "$APP" && npm start
