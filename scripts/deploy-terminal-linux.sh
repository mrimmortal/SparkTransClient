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

Starts backend and frontend directly in this terminal without Docker.

Environment:
  BACKEND_HOST   Backend bind host. Default: 127.0.0.1
  BACKEND_PORT   Backend port. Default: 8000
  FRONTEND_HOST  Frontend preview host. Default: 127.0.0.1
  FRONTEND_PORT  Frontend preview port. Default: 8080

Requires:
  Python      3.12 or newer
  Node.js     22 or newer, with npm
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

run_with_sudo_if_needed() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    echo "This installer needs elevated privileges. Re-run as root or install manually: $*" >&2
    return 1
  fi
}

manual_python_instructions() {
  cat >&2 <<EOF
Python $MIN_PYTHON_MAJOR.$MIN_PYTHON_MINOR+ is required and was not found.

Install Python $MIN_PYTHON_MAJOR.$MIN_PYTHON_MINOR or newer, then re-run:
  macOS:        brew install python@3.12
  Debian/Ubuntu: sudo apt-get update && sudo apt-get install -y python3.12 python3.12-venv python3-pip
  Fedora/RHEL: sudo dnf install -y python3.12 python3.12-pip
EOF
}

manual_node_instructions() {
  cat >&2 <<EOF
Node.js $MIN_NODE_MAJOR+ with npm is required and was not found.

Install Node.js $MIN_NODE_MAJOR or newer, then re-run:
  macOS:        brew install node@22
  Linux:        install Node.js $MIN_NODE_MAJOR+ from your OS package manager or NodeSource
EOF
}

install_python() {
  echo "Python $MIN_PYTHON_MAJOR.$MIN_PYTHON_MINOR+ not available. Attempting installation..."

  if command -v brew >/dev/null 2>&1; then
    brew install python@3.12
  elif command -v apt-get >/dev/null 2>&1; then
    run_with_sudo_if_needed apt-get update
    run_with_sudo_if_needed apt-get install -y python3.12 python3.12-venv python3-pip
  elif command -v dnf >/dev/null 2>&1; then
    run_with_sudo_if_needed dnf install -y python3.12 python3.12-pip
  elif command -v yum >/dev/null 2>&1; then
    run_with_sudo_if_needed yum install -y python3.12 python3.12-pip
  elif command -v pacman >/dev/null 2>&1; then
    run_with_sudo_if_needed pacman -Sy --needed python python-pip
  else
    manual_python_instructions
    return 1
  fi
}

install_node() {
  echo "Node.js $MIN_NODE_MAJOR+ with npm not available. Attempting installation..."

  if command -v brew >/dev/null 2>&1; then
    brew install node@22 || brew install node
  elif command -v apt-get >/dev/null 2>&1; then
    run_with_sudo_if_needed apt-get update
    run_with_sudo_if_needed apt-get install -y nodejs npm
  elif command -v dnf >/dev/null 2>&1; then
    run_with_sudo_if_needed dnf install -y nodejs npm
  elif command -v yum >/dev/null 2>&1; then
    run_with_sudo_if_needed yum install -y nodejs npm
  elif command -v pacman >/dev/null 2>&1; then
    run_with_sudo_if_needed pacman -Sy --needed nodejs npm
  else
    manual_node_instructions
    return 1
  fi
}

find_python() {
  local candidates=(
    python3.12
    python3
    python
  )
  local candidate

  for candidate in "${candidates[@]}"; do
    if command -v "$candidate" >/dev/null 2>&1; then
      "$candidate" - <<'PY' >/dev/null 2>&1 && {
import sys
raise SystemExit(0 if sys.version_info >= (3, 12) else 1)
PY
        command -v "$candidate"
        return 0
      }
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

  manual_python_instructions
  return 1
}

ensure_supported_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    local node_major
    node_major="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
    if [[ "$node_major" -ge "$MIN_NODE_MAJOR" ]]; then
      return 0
    fi
  fi

  install_node

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    local node_major
    node_major="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
    if [[ "$node_major" -ge "$MIN_NODE_MAJOR" ]]; then
      return 0
    fi
  fi

  manual_node_instructions
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

require_command "$BACKEND_DIR/.venv/bin/python"
require_command "$BACKEND_DIR/.venv/bin/pip"

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
