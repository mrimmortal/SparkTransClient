#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-8080}"

MIN_PYTHON_MAJOR=3
MIN_PYTHON_MINOR=12
MIN_NODE_MAJOR=22

usage() {
  cat <<EOF
Usage: $0 [up|deploy]

macOS direct terminal deployment.

Requires:
  Python 3.12 or newer
  Node.js 22 or newer, with npm

Runs the project using docs/COMMANDS.md:
  backend: python venv, pip install -r requirements.txt, seed user, uvicorn
  frontend: npm install, npm run build, npm run preview
EOF
}

confirm_install() {
  local name="$1"
  local answer

  read -r -p "$name is missing or unsupported. Install it now? [y/N] " answer
  case "$answer" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

require_brew() {
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi

  echo "Homebrew is required for automatic install on macOS." >&2
  echo "Install Homebrew or install the missing runtime manually, then re-run this script." >&2
  return 1
}

install_python() {
  confirm_install "Python $MIN_PYTHON_MAJOR.$MIN_PYTHON_MINOR+" || {
    echo "Install Python $MIN_PYTHON_MAJOR.$MIN_PYTHON_MINOR+ manually, then re-run this script." >&2
    return 1
  }

  require_brew
  brew install python@3.12
}

install_node() {
  confirm_install "Node.js $MIN_NODE_MAJOR+ with npm" || {
    echo "Install Node.js $MIN_NODE_MAJOR+ with npm manually, then re-run this script." >&2
    return 1
  }

  require_brew
  brew install node@22 || brew install node
}

find_python() {
  local candidate

  for candidate in python3.12 python3 python; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c "import sys; raise SystemExit(0 if sys.version_info >= ($MIN_PYTHON_MAJOR, $MIN_PYTHON_MINOR) else 1)" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done

  return 1
}

ensure_supported_python() {
  if PYTHON_BIN="$(find_python)"; then
    export PYTHON_BIN
    return 0
  fi

  install_python

  if PYTHON_BIN="$(find_python)"; then
    export PYTHON_BIN
    return 0
  fi

  echo "Python $MIN_PYTHON_MAJOR.$MIN_PYTHON_MINOR+ is still unavailable. Install it manually, then re-run this script." >&2
  return 1
}

ensure_supported_node() {
  local node_major

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    node_major="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
    if [[ "$node_major" -ge "$MIN_NODE_MAJOR" ]]; then
      return 0
    fi
  fi

  install_node

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    node_major="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
    if [[ "$node_major" -ge "$MIN_NODE_MAJOR" ]]; then
      return 0
    fi
  fi

  echo "Node.js $MIN_NODE_MAJOR+ with npm is still unavailable. Install it manually, then re-run this script." >&2
  return 1
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

ensure_supported_python
ensure_supported_node

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  "$PYTHON_BIN" -m venv "$BACKEND_DIR/.venv"
fi

"$BACKEND_DIR/.venv/bin/python" -m pip install -r "$BACKEND_DIR/requirements.txt"
"$BACKEND_DIR/.venv/bin/python" "$BACKEND_DIR/scripts/seed_sample_user.py"

npm --prefix "$FRONTEND_DIR" install
npm --prefix "$FRONTEND_DIR" run build

echo "Starting backend: http://$BACKEND_HOST:$BACKEND_PORT"
(
  cd "$BACKEND_DIR"
  .venv/bin/python -m uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT"
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
