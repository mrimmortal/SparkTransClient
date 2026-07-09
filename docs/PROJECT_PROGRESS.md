# Project Progress Checklist

This checklist tracks the implementation against the production-ready multipurpose dictation platform plan.

Status key:

- `[x]` Implemented and validated by automated or smoke checks.
- `[~]` Partially implemented; usable foundation exists, but planned workflow is incomplete.
- `[ ]` Not implemented yet.

## Current Validation Snapshot

Frontend checks last verified on 2026-07-09:

- `[x]` Frontend tests: `cd frontend && npm test` (`162 passed`)
- `[x]` Frontend build: `cd frontend && npm run build` (passes with existing large chunk warning)
- `[x]` CSS typography guard: `cd frontend && npm test -- typographyTokens`

Backend checks last recorded on 2026-06-27:

- `[x]` Backend tests: `cd backend && .venv/bin/pytest -q` (`11 passed`)
- `[x]` Backend syntax: `python3 -m compileall backend/app`
- `[x]` Macro/template/settings API tests are covered in `backend/tests/test_macro_template_api.py`.
- `[x]` STT proxy relay/log tests are covered in `backend/tests/test_stt_proxy.py`.

Smoke checks last recorded on 2026-06-20:

- `[x]` Local health smoke: `GET /api/health/live`
- `[x]` Sample login smoke: `POST /api/auth/login`
- `[x]` Frontend route smoke: `/`, `/documents`, `/templates`, `/macros`, `/settings`, `/diagnostics`
- `[x]` Backend resource smoke: document export, template CRUD/search, macro CRUD, settings, shortcuts
- `[ ]` Real CoreSTT microphone transcription smoke test. Requires CoreSTT running separately.

## Foundation

- `[x]` React + Vite + TypeScript frontend scaffold.
- `[x]` FastAPI backend scaffold.
- `[x]` SQLite database with SQLAlchemy models.
- `[~]` Alembic-ready dependency included; migration files are not created yet.
- `[x]` Docker files and `docker-compose.yml` scaffold.
- `[x]` One-command local runner: `./scripts/run-dev.sh`.
- `[x]` Sample user seed workflow.
- `[x]` User manual.

## Authentication And Security

- `[x]` Email/password registration and login.
- `[x]` HTTP-only session cookie.
- `[x]` Argon2 password hashing.
- `[x]` Sample user password repair during seeding.
- `[x]` Per-user ownership checks for implemented document/template/macro/settings routes.
- `[x]` CORS allowlist and trusted host middleware.
- `[~]` Structured request logging with request IDs.
- `[x]` Payload-safe structured STT proxy lifecycle/frame logs.
- `[~]` Audit events for implemented auth/resource workflows.
- `[ ]` Rate limiting for login, uploads, exports, and WebSocket creation.
- `[ ]` Production secret management enforcement beyond `.env.example` guidance.

## CoreSTT Integration

- `[x]` CoreSTT packet encoder/validator follows `WEBSOCKET_CLIENT_CONTRACT.md`.
- `[x]` Frontend STT state machine foundation.
- `[x]` Backend STT proxy route.
- `[x]` Backend STT proxy relays text and binary frames in both directions.
- `[x]` Backend STT proxy logs lifecycle/frame counts without payload text or audio bytes.
- `[x]` Frontend handles `realtime`, `final`, `clear`, `warning`, and `error` message classes.
- `[x]` Frontend control messages and diagnostics exist.
- `[x]` Browser microphone capture pipeline is wired to `SttClient.sendFloatSamples`.
- `[x]` Browser microphone permission-denied warning is actionable.
- `[ ]` Real CoreSTT end-to-end dictation test.
- `[x]` Bounded reconnect/backoff.

## Minimal UI

- `[x]` Minimal document workspace layout.
- `[x]` Left sidebar for document navigation.
- `[x]` Smart Editor with TipTap.
- `[x]` Floating Micro Editor.
- `[x]` Compact dictation toolbar.
- `[x]` Hidden-by-default diagnostics panel.
- `[x]` Visible login error handling.
- `[x]` Route-based navigation for documents, templates, macros, settings, and diagnostics.
- `[x]` Template and macro manager UI.
- `[x]` Export button downloads PDFs.

## Documents

- `[x]` Backend document CRUD.
- `[x]` Frontend document list, create, edit, and save.
- `[x]` Document ownership enforced.
- `[x]` PDF export backend endpoint.
- `[x]` Frontend PDF download flow.
- `[x]` Search/replace UI.
- `[x]` Document categories and management modal.

## Templates

- `[x]` Backend template CRUD foundation.
- `[x]` Backend `.docx` upload/import with validation and HTML sanitization.
- `[x]` Backend fuzzy template search.
- `[x]` Sample template seeded.
- `[x]` Frontend loads template count in diagnostics.
- `[x]` Full template manager UI.
- `[x]` Insert template into Smart Editor.
- `[x]` Voice-driven template insertion workflow.

## Macros And Commands

- `[x]` Backend macro CRUD foundation.
- `[x]` Sample macro seeded.
- `[x]` Frontend macro expansion for final transcript routing.
- `[x]` Smart Editor-only command routing.
- `[x]` Initial commands: new line, new paragraph, undo, redo, select all, clear all.
- `[x]` Full macro manager UI.
- `[ ]` Complete voice command catalog from the plan.
- `[x]` User-configurable command and macro enablement preferences.
- `[x]` Semantic voice command matching via sentence embeddings (MiniLM-L6-v2)
  replaces exact-string command matching — handles STT variations, synonyms,
  and phrasing differences without hardcoded word lists.

## Settings And Shortcuts

- `[x]` Backend settings endpoint.
- `[x]` Backend shortcut persistence endpoint.
- `[x]` Full frontend settings screen.
- `[x]` Keyboard shortcut edit UI.
- `[x]` Audio device preference UI.

## Mobile Microphone Support

- `[x]` Frontend transcript routing has `DictationAudioSource` type for future support.
- `[ ]` Mobile pairing/session backend models and APIs.
- `[ ]` Mobile microphone WebSocket.
- `[ ]` Desktop session WebSocket.
- `[ ]` Mobile app or mobile web client.

## Production Readiness

- `[x]` Health endpoints: live, ready, version.
- `[x]` Docker/VPS-oriented scaffold.
- `[x]` Dependency audit currently reports zero high-or-higher frontend vulnerabilities.
- `[x]` Payload-safe STT proxy structured logs exist.
- `[~]` General JSON structured request logs exist.
- `[~]` File upload validation exists for `.docx`.
- `[ ]` Reverse proxy config for Caddy/Nginx.
- `[ ]` Backup/restore script for SQLite volume.
- `[ ]` Alembic migration workflow.
- `[ ]` CI pipeline.
- `[ ]` Rate limiting and security headers hardening.

## Next Recommended Milestone

1. Run and record a real CoreSTT microphone transcription smoke test.
2. Add the remaining backend API tests for auth, document ownership, document CRUD, and PDF export flows.
3. Complete the voice command catalog.
4. Add rate limiting and Alembic migrations before production deployment.
