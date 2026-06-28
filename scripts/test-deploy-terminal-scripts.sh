#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LINUX_SCRIPT="$ROOT_DIR/scripts/deploy-terminal-linux.sh"
MAC_SCRIPT="$ROOT_DIR/scripts/deploy-terminal-mac.sh"
WINDOWS_SCRIPT="$ROOT_DIR/scripts/deploy-terminal-windows.ps1"

assert_contains() {
  local file="$1"
  local pattern="$2"

  if ! grep -Fq -- "$pattern" "$file"; then
    echo "Expected $file to contain: $pattern" >&2
    exit 1
  fi
}

bash -n "$LINUX_SCRIPT"
bash -n "$MAC_SCRIPT"
"$LINUX_SCRIPT" help >/dev/null
"$MAC_SCRIPT" help >/dev/null

assert_contains "$LINUX_SCRIPT" 'MIN_PYTHON_MAJOR=3'
assert_contains "$LINUX_SCRIPT" 'MIN_PYTHON_MINOR=12'
assert_contains "$LINUX_SCRIPT" 'MIN_NODE_MAJOR=22'
assert_contains "$LINUX_SCRIPT" 'install_python()'
assert_contains "$LINUX_SCRIPT" 'install_node()'
assert_contains "$LINUX_SCRIPT" 'ensure_supported_python()'
assert_contains "$LINUX_SCRIPT" 'ensure_supported_node()'
assert_contains "$LINUX_SCRIPT" 'confirm_install'
assert_contains "$LINUX_SCRIPT" 'ensure_backend_venv()'
assert_contains "$LINUX_SCRIPT" '"$PYTHON_BIN" -m venv "$BACKEND_DIR/.venv"'
assert_contains "$LINUX_SCRIPT" 'npm --prefix "$FRONTEND_DIR" install'

assert_contains "$MAC_SCRIPT" 'MIN_PYTHON_MAJOR=3'
assert_contains "$MAC_SCRIPT" 'MIN_PYTHON_MINOR=12'
assert_contains "$MAC_SCRIPT" 'MIN_NODE_MAJOR=22'
assert_contains "$MAC_SCRIPT" 'install_python()'
assert_contains "$MAC_SCRIPT" 'install_node()'
assert_contains "$MAC_SCRIPT" 'ensure_supported_python()'
assert_contains "$MAC_SCRIPT" 'ensure_supported_node()'
assert_contains "$MAC_SCRIPT" 'confirm_install'
assert_contains "$MAC_SCRIPT" 'ensure_backend_venv()'
assert_contains "$MAC_SCRIPT" '"$PYTHON_BIN" -m venv "$BACKEND_DIR/.venv"'
assert_contains "$MAC_SCRIPT" 'brew install python@3.12'
assert_contains "$MAC_SCRIPT" 'npm --prefix "$FRONTEND_DIR" install'

assert_contains "$WINDOWS_SCRIPT" '$MinPythonMajor = 3'
assert_contains "$WINDOWS_SCRIPT" '$MinPythonMinor = 12'
assert_contains "$WINDOWS_SCRIPT" '$MinNodeMajor = 22'
assert_contains "$WINDOWS_SCRIPT" 'function Install-Python'
assert_contains "$WINDOWS_SCRIPT" 'function Install-Node'
assert_contains "$WINDOWS_SCRIPT" 'function Ensure-SupportedPython'
assert_contains "$WINDOWS_SCRIPT" 'function Ensure-SupportedNode'
assert_contains "$WINDOWS_SCRIPT" 'function Confirm-Install'
assert_contains "$WINDOWS_SCRIPT" 'function Ensure-BackendVenv'
assert_contains "$WINDOWS_SCRIPT" '-m venv (Join-Path $BackendDir ".venv")'
assert_contains "$WINDOWS_SCRIPT" '& npm --prefix $FrontendDir install'

echo "Deployment terminal script checks passed."
