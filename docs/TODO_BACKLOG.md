# TODO Backlog

Keep this list aligned with `docs/PROJECT_PROGRESS.md`.

## High Priority

- Run and record a real CoreSTT end-to-end local microphone smoke test.
- Add backend API tests for auth, documents, templates, macros, and ownership.

## Production Hardening

- Add Alembic migration files and migration command docs.
- Add rate limiting for login, upload, export, and WebSocket session creation.
- Add Caddy or Nginx reverse proxy example for HTTPS/WSS.
- Add SQLite backup/restore scripts and docs.
- Add CI workflow for backend tests, frontend tests, build, and audit.

## Product UI

- Complete voice command catalog from the original plan.
- Add focused automated UI tests if a browser test runner is installed.

## Deferred Mobile Mic

- Add dictation session model.
- Add desktop session WebSocket.
- Add mobile microphone WebSocket.
- Add mobile pairing code or QR flow.
- Build mobile app or mobile web microphone client.
