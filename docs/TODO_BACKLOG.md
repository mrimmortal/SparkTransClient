# TODO Backlog

Use this as the single backlog for future AI sessions. Keep detailed feature
specs out of this file until a task is actively planned.

## Highest Priority

- Run and record a real CoreSTT end-to-end local microphone smoke test.
- Add backend API tests for auth, document ownership, document CRUD, and PDF export.
- Complete the voice command catalog and keep it aligned with UI help.

## Production Hardening

- Add Alembic migration files and migration command docs.
- Add rate limiting for login, upload, export, and WebSocket session creation.
- Add HTTPS/WSS reverse proxy examples for Caddy or Nginx.
- Add SQLite backup/restore scripts and docs.
- Add CI for backend tests, frontend tests, build, and audit.
- Decide whether to reduce or intentionally accept the current Vite chunk-size warning.

## Product Follow-Ups

- Documents: folders/projects, tags, pinned/recent/archive flows, global search, history/recovery, richer import/export formats.
- Editor: tables, images, outline/navigation, preview or split view, reusable snippets beyond macros.
- Templates: duplicate template, stronger preview, richer variable/fill-in workflow.
- Dictation: custom commands, command palette, clearer pause/resume states, confidence/diarization display if CoreSTT exposes metadata.
- Audio: upload audio file for transcription, save audio with a document, session resume after refresh.
- Collaboration: share links, comments, suggested edits, multi-user editing.
- AI assist: summarize, clean up dictated text, extract action items, generate titles, ask questions about the document.

## Deferred Mobile Mic

- Add dictation session model.
- Add desktop session WebSocket.
- Add mobile microphone WebSocket.
- Add mobile pairing code or QR flow.
- Build mobile app or mobile web microphone client.
