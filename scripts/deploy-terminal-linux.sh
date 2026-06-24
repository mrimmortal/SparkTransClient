#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-8080}"

usage() {
  cat <<EOF
Usage: $0 [up|deploy]

Starts backend and frontend directly in this terminal without Docker.

Environment:
  BACKEND_HOST   Backend bind host. Default: 127.0.0.1
  BACKEND_PORT   Backend port. Default: 8000
  FRONTEND_HOST  Frontend preview host. Default: 127.0.0.1
  FRONTEND_PORT  Frontend preview port. Default: 8080
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

ACTION="${1:-up}"
case "$ACTION" in
  -h|--help|help)
    usage
    exit 0
    ;;
  up|deploy)
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

require_command python3
require_command npm

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  python3 -m venv "$BACKEND_DIR/.venv"
fi

"$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
"$BACKEND_DIR/.venv/bin/python" "$BACKEND_DIR/scripts/seed_sample_user.py"

if [[ -f "$FRONTEND_DIR/package-lock.json" ]]; then
  npm --prefix "$FRONTEND_DIR" ci
else
  npm --prefix "$FRONTEND_DIR" install
fi
npm --prefix "$FRONTEND_DIR" run build

echo "Starting backend: http://$BACKEND_HOST:$BACKEND_PORT"
(
  cd "$BACKEND_DIR"
  .venv/bin/uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

echo "Starting frontend preview: http://$FRONTEND_HOST:$FRONTEND_PORT"
npm --prefix "$FRONTEND_DIR" run preview -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

echo ""
echo "Sample login:"
echo "  Email:    sample@sparktrans.app"
echo "  Password: SampleUser123!"
echo ""
echo "CoreSTT expected at ws://127.0.0.1:8020/ws/transcribe for real dictation."
echo "Press Ctrl+C to stop both servers."

wait "$BACKEND_PID" "$FRONTEND_PID"
