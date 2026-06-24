#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="${SPARKTRANS_PROJECT_NAME:-sparktransclient}"
ACTION="${1:-up}"

usage() {
  cat <<EOF
Usage: $0 [up|deploy|restart|down|status|ps|logs]

Environment:
  SPARKTRANS_PROJECT_NAME  Docker Compose project name. Default: sparktransclient
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -p "$PROJECT_NAME" "$@"
    return
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -p "$PROJECT_NAME" "$@"
    return
  fi
  echo "Docker Compose is required. Install the Docker Compose plugin or docker-compose." >&2
  exit 1
}

case "$ACTION" in
  -h|--help|help)
    usage
    exit 0
    ;;
  up|deploy)
    require_command docker
    cd "$ROOT_DIR"
    compose up --build -d
    ;;
  restart)
    require_command docker
    cd "$ROOT_DIR"
    compose down
    compose up --build -d
    ;;
  down)
    require_command docker
    cd "$ROOT_DIR"
    compose down
    ;;
  status|ps)
    require_command docker
    cd "$ROOT_DIR"
    compose ps
    ;;
  logs)
    require_command docker
    cd "$ROOT_DIR"
    compose logs -f "${@:2}"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

if [[ "$ACTION" == "up" || "$ACTION" == "deploy" || "$ACTION" == "restart" ]]; then
  echo ""
  echo "SparkTransClient is starting with Docker Compose project: $PROJECT_NAME"
  echo "Frontend: http://localhost:8080"
  echo "Backend:  http://localhost:8000"
  echo "Logs:     $0 logs"
fi
