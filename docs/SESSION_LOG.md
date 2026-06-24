# Session Log

## 2026-06-20

- Scaffolded production-oriented React + FastAPI dictation platform.
- Added CoreSTT contract utilities using `WEBSOCKET_CLIENT_CONTRACT.md`.
- Added minimal productivity UI, backend auth/resource models, structured logging, health endpoints, STT proxy, and focused tests.

## 2026-06-20 - Local run workflow

Changed:
- Added sample-user seeding and one-command local runner.
- Added user manual and updated command docs.

Validation:
- `backend/.venv/bin/pytest tests/test_sample_seed.py -q`
- `backend/scripts/seed_sample_user.py`
- `scripts/run-dev.sh` startup smoke test
- `curl /api/health/live`
- `curl /api/auth/login` with sample credentials

Next:
- Keep CoreSTT running separately for real transcription tests.

## 2026-06-20 - Progress tracking docs

Changed:
- Added project checklist, module map, API contract summary, and backlog.
- Mapped implemented, partial, and deferred items back to the original plan.

Validation:
- Markdown/source consistency scan.
- Backend tests, frontend tests, frontend build, backend compile.

Next:
- Use `docs/PROJECT_PROGRESS.md` as the canonical project tracking checklist.

## 2026-06-24 - Spoken punctuation and formatting commands

Changed:
- Added frontend routing for dictated punctuation phrases such as `comma`,
  `full stop`, `question mark`, `colon`, and `semicolon`.
- Added Smart Editor voice commands for `bold`, `italic`, `underline`, and
  `clear formatting`.
- Added TipTap underline support and documented the new commands.
- Reorganized the in-app Dictation help panel for first-time users with setup
  steps, punctuation, formatting, editor controls, templates, and macro notes.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts src/lib/editorFlow.test.ts`
- `cd frontend && npm test -- src/lib/dictationFlow.test.ts`
- `cd frontend && npm run build`

## 2026-06-20 - CoreSTT browser microphone integration

Changed:
- Wired browser microphone capture into CoreSTT streaming with AudioWorklet 40 ms chunks.
- Added READY-aware start sequencing, bounded reconnect/backoff, safer STT errors, and diagnostics.
- Added focused frontend tests for STT lifecycle and microphone support detection.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Run the manual real CoreSTT microphone smoke test with CoreSTT running at `ws://127.0.0.1:8020/ws/transcribe`.

## 2026-06-20 - AI context bootstrap

Changed:
- Added `AI_CONTEXT.md` as the first project-specific context after `AGENTS.md`.
- Updated module/backlog docs to reflect the current CoreSTT microphone state.

Validation:
- Documentation-only review planned; runtime tests not required for docs-only changes.

Next:
- Keep `docs/PROJECT_PROGRESS.md` and `docs/TODO_BACKLOG.md` aligned after future feature work.

## 2026-06-20 - CoreSTT proxy relay verification

Changed:
- Added a focused backend WebSocket proxy test using a fake CoreSTT upstream.
- Verified text and binary frames relay from client to CoreSTT and CoreSTT to client.
- Updated the module map with the new proxy test.

Validation:
- `cd backend && .venv/bin/pytest tests/test_stt_proxy.py -q`
- `cd backend && .venv/bin/pytest -q`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Real microphone transcription still requires a manual smoke test with CoreSTT running at `ws://127.0.0.1:8020/ws/transcribe`.

## 2026-06-20 - Microphone permission UI message

Changed:
- Mapped browser microphone permission-denied errors to an actionable UI warning.
- Added focused frontend coverage for the permission-denied message.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm run build`

Next:
- If the warning appears, allow microphone access for the site in browser/system settings, then start dictation again.

## 2026-06-20 - STT proxy structured logs

Changed:
- Added JSON lifecycle/frame logs for `/ws/stt-proxy`.
- Logged connect, upstream connect, client/CoreSTT frame metadata, disconnect summaries, rejected origins, and errors.
- Kept logs payload-safe: no transcript text, control payloads, or audio bytes are logged.
- Documented where to see STT proxy logs in `docs/COMMANDS.md`.

Validation:
- `cd backend && .venv/bin/pytest tests/test_stt_proxy.py -q`
- `cd backend && .venv/bin/pytest -q`

Next:
- Watch the backend terminal while starting/stopping dictation to inspect `stt_proxy_*` events.

## 2026-06-20 - Progress tracker refresh

Changed:
- Updated `docs/PROJECT_PROGRESS.md` for STT proxy relay/log verification and browser microphone permission handling.
- Updated backlog to track the remaining real CoreSTT microphone smoke test instead of missing instructions.

Validation:
- Backend tests, frontend tests, frontend build, frontend audit, backend compile.

Next:
- Run the real CoreSTT microphone smoke test when CoreSTT is available.

## 2026-06-20 - Desktop UI backend wiring

Changed:
- Added route-based frontend navigation for documents, templates, macros, settings, and diagnostics.
- Expanded the frontend API client to cover existing backend auth, resource, health/config, PDF export, and upload endpoints.
- Wired document export/search-replace/delete, template CRUD/upload/insert, macro CRUD/toggle, settings/shortcuts, and audio device preference UI.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`
- Local HTTP route smoke for `/`, `/documents`, `/templates`, `/macros`, `/settings`, and `/diagnostics`
- Local API smoke for sample login, document export, template CRUD/search, macro CRUD, settings, shortcuts, and logout

Next:
- Real CoreSTT microphone transcription still requires CoreSTT running separately.

## 2026-06-20 - Macro flow fix

Changed:
- Fixed live dictation macro routing to read the latest macro/settings/editor state instead of stale STT callback closures.
- Improved macro manager create/save/toggle/delete flow with trimmed payloads, functional state updates, immediate enabled toggles, and row-level dirty/error state.
- Added focused frontend tests for macro draft normalization and macro list updates.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Real transcript expansion still needs a manual CoreSTT smoke test with CoreSTT running separately.

## 2026-06-20 - Macro and template hardening

Changed:
- Added template manager draft normalization, save validation, functional state updates, and upload retry reset.
- Added voice-driven template insertion for final transcript commands like `insert template Meeting minutes`.
- Improved macro expansion near punctuation so replacements do not duplicate terminal punctuation.
- Added frontend tests for template flow helpers and backend API tests for macro/template CRUD, ownership isolation, sanitization, search, `.docx` upload, and invalid upload rejection.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Manual browser smoke is still useful for visual interaction details if a browser runner is available.

## 2026-06-20 - Macro and template validation audit

Validation:
- `./scripts/run-dev.sh` reached the local stack with elevated localhost binding; Vite served on `http://127.0.0.1:5174/` because `5173` was occupied.
- Live route smoke returned HTTP 200 and a React root for `/`, `/documents`, `/templates`, `/macros`, `/settings`, and `/diagnostics`.
- Live API smoke passed sample login plus macro create/toggle/edit/delete and template create/sanitize/search/edit/delete.
- `python3 -m compileall backend/app`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd frontend && npm audit --audit-level=high`
- `cd backend && .venv/bin/pytest -q`

Next:
- In-app browser automation was unavailable in this environment, so visual click-by-click browser smoke remains a manual follow-up.
- Real CoreSTT microphone transcription still requires CoreSTT running separately.

## 2026-06-20 - Macro/template punctuation edge cases

Changed:
- Expanded macro transcript punctuation handling for comma, semicolon, and colon adjacency so replacements do not leave doubled punctuation.
- Expanded template voice-command normalization to ignore common trailing dictated punctuation.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts src/lib/templateFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Click-level browser smoke and real CoreSTT microphone transcription still require an available browser runner/CoreSTT runtime.

## 2026-06-20 - Macro apostrophe trigger coverage

Changed:
- Added regression coverage for macro triggers containing apostrophes, such as `doctor's note`.
- No production code change was needed; current token-boundary macro matching already supports this case.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Click-level browser smoke and real CoreSTT microphone transcription still require an available browser runner/CoreSTT runtime.

## 2026-06-20 - Macro/template API client wiring coverage

Changed:
- Added frontend API client coverage for macro enable/disable PATCH requests.
- Added frontend API client coverage for encoded template search queries and void template delete requests.
- Updated the module map to point API client work at `frontend/src/lib/api.test.ts`.

Validation:
- `cd frontend && npm test -- src/lib/api.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Click-level browser smoke and real CoreSTT microphone transcription still require an available browser runner/CoreSTT runtime.

## 2026-06-20 - Macro non-cascading expansion

Changed:
- Macro expansion now runs as a single pass over the original transcript text, so one macro replacement is not rewritten by another macro in the same final transcript.
- Preserved longest-trigger priority and added regression coverage for replacement text containing another trigger.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Click-level browser smoke and real CoreSTT microphone transcription still require an available browser runner/CoreSTT runtime.

## 2026-06-20 - Template voice whitespace normalization

Changed:
- Template voice-command matching now collapses repeated whitespace in saved template names and spoken commands before comparing.
- Added regression coverage for a saved name like `Meeting   minutes` matching `insert template meeting minutes`.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Click-level browser smoke and real CoreSTT microphone transcription still require an available browser runner/CoreSTT runtime.

## 2026-06-20 - Macro overlap priority

Changed:
- Macro expansion now processes longer triggers before shorter triggers so a short macro cannot rewrite part of a longer macro phrase first.
- Added regression coverage for overlapping triggers such as `note` and `standard closing note`.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Click-level browser smoke and real CoreSTT microphone transcription still require an available browser runner/CoreSTT runtime.

## 2026-06-20 - Macro symbol trigger coverage

Changed:
- Replaced macro word-boundary matching with explicit token-boundary matching so triggers with punctuation or regex characters, such as `c++`, can expand.
- Added regression coverage that symbol triggers expand while ordinary triggers still do not match inside longer words.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q`

Next:
- Click-level browser smoke and real CoreSTT microphone transcription still require an available browser runner/CoreSTT runtime.

## 2026-06-20 - Template get voice command

Changed:
- Added `get template <template name>` as a supported voice phrase for inserting a matching template into the Smart Editor.
- Updated template voice-command regression coverage and user-facing command docs.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-23 - Settings screen expansion

Changed:
- Added persisted settings for auto-connect, autosave, destructive confirmations, duplicate transcript protection/window, blank-audio filtering, voice-command variants, default template, and microphone status visibility.
- Reworked the Settings page into Dictation, Transcript handling, Microphone, Documents and safety, and Shortcuts sections with save-state feedback.
- Wired new settings into existing dictation, transcript, template, document, and destructive-action behavior.
- Added SQLite startup compatibility for new `user_settings` columns.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`
- `cd backend && .venv/bin/pytest -q`

Next:
- Vite still reports the existing large chunk warning during production build.
- Broader features such as backup/import/export-all and new export formats remain separate feature work.

## 2026-06-23 - Template insert creates document when empty

Changed:
- Made `Insert in document` create a new document from the selected template when no document/editor is active.
- The new document uses the template name as the title and the template HTML as initial content.
- Updated the template insert button to wait for insertion/creation before navigating back to Documents.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-23 - Final transcript text dedupe

Changed:
- Added a short text-level dedupe window for final transcript insertion so duplicate final events with different segment IDs do not insert the same first phrase twice.
- Kept the existing segment-ID dedupe and cleared both final transcript dedupe stores on CoreSTT clear events.
- Added regression coverage for repeated final transcript text with punctuation/case differences.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-23 - Smart Editor command target precedence

Changed:
- Routed recognized Smart Editor voice commands before applying the normal transcript insertion target.
- This keeps commands like `new line`, `undo`, and `clear all` executing even when Micro Editor is open or the default target is Micro Editor.
- Updated user-facing command docs and regression coverage for command precedence.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-23 - Smart Editor command aliases

Changed:
- Added Smart Editor command aliases for common STT outputs such as `newline`, `new-line`, `new para`, `select everything`, and `clear everything`.
- Updated dictation help and the user manual to show the accepted command variants.
- Added routing regression coverage for the command aliases.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts src/lib/dictationFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-22 - Smart Editor command normalization

Changed:
- Normalized dictated Smart Editor command phrases before routing so capitalization, repeated spaces, and trailing punctuation do not make commands insert as plain text.
- Added regression coverage for `new line.`, `new paragraph,`, `select all:`, and `clear all!`.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-22 - Editor action safety guards

Changed:
- Kept the primary dictation action disabled while CoreSTT is connected but not ready to start.
- Disabled document save when the active Smart Editor has no text.
- Added confirmation prompts before clearing editor content or deleting documents, templates, and macros.

Validation:
- `cd frontend && npm test -- src/lib/dictationFlow.test.ts src/lib/editorFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-22 - Dictation flow UX polish

Changed:
- Replaced separate document-page dictation controls with a state-aware primary dictation action.
- Added compact dictation status details and a collapsible help panel for setup, commands, templates, macros, and settings.
- Added focused frontend coverage for dictation action state and help content.

Validation:
- `cd frontend && npm test -- src/lib/dictationFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-22 - Template voice command dedupe

Changed:
- Added a short frontend dedupe window for template voice commands so duplicate final events with different segment IDs do not insert the same template twice.
- Cleared recent template command tracking when CoreSTT sends a clear event.
- Added focused coverage for duplicate template voice command suppression.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-22 - Editor productivity toolbar

Changed:
- Added a compact Smart Editor toolbar for formatting, lists, undo/redo, and clearing formatting.
- Added local save-state feedback near the document title and action buttons for the no-document editor empty state.
- Added focused frontend coverage for editor save labels and toolbar command definitions.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-22 - Editor toolbar expansion and layout fix

Changed:
- Wrapped the document route content in its own grid so search, toolbar, and editor empty states no longer get pushed down by the parent panel layout.
- Added paragraph, quote, code block, and horizontal rule toolbar actions.
- Added clearer disabled button styling for unavailable editor and dictation actions.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-22 - Final transcript dedupe

Changed:
- Added frontend tracking for inserted final transcript segment IDs so duplicate final events do not insert the same speech twice.
- Cleared routed final segment tracking when CoreSTT sends a clear event.
- Added focused coverage for final transcript segment dedupe.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.
