# AI Context

Use this file as the first project-specific context after `AGENTS.md`.

## Project Summary

SparkTransClient is a production-oriented dictation workspace. It combines a
FastAPI backend, React/Vite frontend, SQLite persistence, and an external
CoreSTT WebSocket transcription service.

CoreSTT remains separate. This repo owns the app UI, authentication, document
storage, templates, macros, settings, logging, export endpoints, and the STT
proxy/client integration.

## Active Modules

- Backend API: `backend/app/main.py` wires health, auth, documents, templates,
  macros, settings, and `/ws/stt-proxy`.
- Backend configuration: `backend/app/core/config.py` reads `.env` through
  Pydantic settings.
- Backend persistence: `backend/app/db/session.py` and `backend/app/models/`
  use SQLite/SQLAlchemy.
- Frontend shell: `frontend/src/App.tsx` composes auth, TipTap editor,
  workspace data, dictation state, and `WorkspaceShell`.
- Frontend feature modules: `frontend/src/features/` contains routed pages,
  workspace state, dictation orchestration, and focused UI components.
- Frontend API client: `frontend/src/lib/api.ts` calls `/api/*` with cookies.
- CoreSTT frontend flow: `frontend/src/lib/sttClient.ts`,
  `frontend/src/lib/corestt.ts`, `frontend/src/lib/micCapture.ts`, and
  `frontend/public/corestt-audio-worklet.js`.
- CoreSTT backend proxy/protocol: `backend/app/api/stt_proxy.py` and
  `backend/app/services/corestt_protocol.py`.

## Key Entrypoints And Runtime Paths

- Local runner: `./scripts/run-dev.sh`
- Backend app import: `backend/app/main.py` exposes `app`
- Frontend app import: `frontend/src/main.tsx` renders `App`
- Vite dev proxy: `frontend/vite.config.ts` proxies `/api` and `/ws`
- Docker compose: `docker-compose.yml`
- Deployment wrappers: `scripts/deploy-docker-linux.sh`,
  `scripts/deploy-docker-windows.ps1`, `scripts/deploy-terminal-linux.sh`,
  and `scripts/deploy-terminal-windows.ps1`
- SQLite default: `backend/data/app.db`
- Upload volume/path in Docker: `/app/uploads`
- Default CoreSTT URL: `ws://127.0.0.1:8020/ws/transcribe`

## Validation Starting Point

Prefer targeted commands from `docs/COMMANDS.md`.

- Backend tests: `cd backend && .venv/bin/pytest -q`
- Backend syntax: `python3 -m compileall backend/app`
- Frontend tests: `cd frontend && npm test`
- Frontend build: `cd frontend && npm run build`
- Full local run: `./scripts/run-dev.sh`

Do not claim validation passed unless the command was run in the current
session.

## Read Next

- `docs/MODULE_MAP.md` to choose source files for focused work.
- `docs/API_CONTRACTS.md` for backend route contracts.
- `docs/PROJECT_PROGRESS.md` for implemented, partial, and deferred areas.
- `docs/TODO_BACKLOG.md` for known follow-ups.
- `WEBSOCKET_CLIENT_CONTRACT.md` before changing CoreSTT packet/message logic.

## Unknowns / To Verify

- CI workflow is not present in the inspected repo.
- Real CoreSTT microphone transcription smoke test still requires CoreSTT
  running separately.
- Production reverse proxy, migrations, backup/restore, and rate limiting are
  not fully documented or implemented.
