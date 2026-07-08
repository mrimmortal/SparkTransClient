# Session Log

## 2026-07-09 - Compact Settings rows

Changed:
- Reworked non-profile Settings sections into compact top-heading rows instead
  of the previous left-title rail layout.
- Added reusable Settings row/toggle helpers, dependent row styling, full-width
  mobile controls, and a microphone status pill.
- Added focused helper coverage for microphone status badge tone selection.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build` — passes with existing large chunk warning

Next:
- Browser visual verification remains To verify because local dev server
  escalation was not approved.

## 2026-07-09 - Transcription profile CRUD layout redesign

Changed:
- Reworked Settings transcription profiles from a dropdown/editor split into an
  inline master-detail layout with a profile list and profile editor.
- Added explicit New profile behavior, inline delete confirmation, active
  profile badges, and responsive profile-list/action styling.
- Added focused helper coverage for profile list names, new profile drafts, and
  post-delete profile selection.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build` — passes with existing large chunk warning

Next:
- Browser visual verification remains To verify because local dev server
  escalation was not approved.

## 2026-07-09 - Stronger recording state for floating action

Changed:
- Changed the floating transcription recording state from subtle primary-color
  glow to a red filled button with stronger red pulse.
- Added recording-action color tokens so the active recording state remains
  visible across light, warm, and dark themes.

Validation:
- `cd frontend && npm test -- floatingActionPosition`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-09 - Recording glow for floating transcription action

Changed:
- Added a recording-state class to the floating transcription action while
  dictation is streaming or microphone capture is active.
- Added a glowing pulse effect for recording state with a reduced-motion
  fallback.
- Covered the floating action class selection with a focused unit test.

Validation:
- `cd frontend && npm test -- floatingActionPosition`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-09 - Draggable transcription action

Changed:
- Made the floating transcription action pill-shaped and draggable within the
  viewport.
- Persisted the floating action position in browser local storage and clamped it
  after viewport resize.
- Added focused tests for default and clamped floating action positioning.

Validation:
- `cd frontend && npm test -- floatingActionPosition`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-09 - Floating transcription action

Changed:
- Added a fixed bottom-right transcription action to the Documents page that
  reuses the existing dictation start/stop/connect behavior.
- Styled the action above other app UI with safe-area-aware positioning and a
  full-width mobile treatment.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-09 - Application responsive UI pass

Changed:
- Added a tablet breakpoint for the document workspace so the editor and right
  rail collapse before controls become cramped.
- Improved mobile sidebar behavior with horizontal navigation, bounded document
  list height, and safer account/action wrapping.
- Improved mobile behavior for document headers, action rows, manager grids,
  settings sections, modals, toasts, and the floating micro editor.
- Made shared button rows wrap by default and used dynamic viewport height where
  supported.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build` — passes with existing large chunk warning

Next:
- Rendered browser verification remains To verify because the in-app browser
  connector failed before attaching in this environment.

## 2026-07-09 - Settings page visual polish

Changed:
- Refined Settings page spacing, hierarchy, and contrast for a more
  professional productivity-app layout.
- Strengthened section/card/input contrast, increased section rhythm, and made
  Settings controls more consistent in size.
- Improved transcription profile layout spacing and marked profile deletion as
  a danger action.
- Tightened responsive behavior for Settings section headers and profile editor
  columns.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build` — passes with existing large chunk warning

Next:
- Browser visual verification remains To verify because the in-app browser
  connector failed before attaching.

## 2026-07-08 - Settings page layout refresh

Changed:
- Reworked the Settings page from a compact three-column grid into clearer
  full-width sections for appearance, dictation, transcription profiles,
  transcript handling, microphone, and documents/safety.
- Moved the domain profile UI into its own section and separated active-profile
  selection from profile definition editing.
- Added responsive CSS so settings sections collapse to one column on mobile.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build` — passes with existing large chunk warning

Next:
- Browser visual verification not run because starting the local Vite dev server
  outside the sandbox was not approved.

## 2026-07-08 - Domain profile backend proxy

Changed:
- Added authenticated backend proxy routes for `GET`, `PUT`, and `DELETE`
  `/api/domain-profiles`.
- Proxy routes derive the CoreSTT HTTP origin from `CORESTT_WS_URL` and forward
  requests to CoreSTT `/api/domain-profiles`.
- Added backend proxy tests and updated API/module docs.

Validation:
- `cd backend && .venv/bin/pytest tests/test_domain_profiles_proxy.py -q`
- `cd backend && .venv/bin/pytest -q`
- `python3 -m compileall backend/app`

## 2026-07-08 - Domain profile dropdown fallback

Changed:
- Updated domain profile response normalization to derive dropdown profile names
  from the `profiles` object keys when no `domainProfiles` or
  `domain_profiles` list is returned.
- Added focused API client coverage for profile-object-only responses.

Validation:
- `cd frontend && npm test -- src/lib/api.test.ts src/features/settings/domainProfileForm.test.ts src/lib/corestt.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-08 - Domain profile response normalization

Changed:
- Normalized domain profile API responses so the frontend accepts both
  `domainProfiles` and `domain_profiles` profile lists.
- Added API client coverage for snake_case profile-list responses.

Validation:
- `cd frontend && npm test -- src/lib/api.test.ts src/features/settings/domainProfileForm.test.ts src/lib/corestt.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-08 - Domain profile settings UI

Changed:
- Added a Settings-page domain profile component that loads, selects, saves,
  and deletes transcription profiles through the frontend API client.
- Reused `settings.profile` as the selected dictation domain.
- Added focused form serialization helpers and tests for profile prompt/hotword
  payloads.

Validation:
- `cd frontend && npm test -- src/features/settings/domainProfileForm.test.ts src/lib/api.test.ts src/lib/corestt.test.ts`
- `cd frontend && npm test`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-08 - Domain profile client calls

Changed:
- Added frontend API client methods for `GET`, `PUT`, and `DELETE`
  `/api/domain-profiles`.
- Updated `SttClient.start()` to accept an optional domain profile and send it
  in the WebSocket `start` control message.
- Wired dictation start to use the existing `settings.profile` value as the
  selected domain.
- Treated CoreSTT `error` messages with `where: "domain"` as non-retryable.

Validation:
- `cd frontend && npm test -- src/lib/api.test.ts src/lib/corestt.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-08 - Repeated voice undo command dedupe

Changed:
- Bypassed duplicate final-transcript text filtering for recognized voice
  command phrases so repeated commands like `undo` behave like repeated toolbar
  button clicks.
- Kept duplicate transcript protection for normal dictated text.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-08 - Voice undo command alignment

Changed:
- Routed voice `undo` and `redo` through a focused editor-flow helper that
  matches the TipTap toolbar history command sequence.
- Added unit coverage for the voice history command sequence.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-07 - Next line list continuation

Changed:
- Updated the `next line` voice command to use Enter-like editor behavior.
- In active bullet or numbered lists, `next line` now splits the current list
  item so the next dictated text continues the list.
- Outside lists, `next line` uses normal block splitting instead of a hard
  break.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts`
- `cd frontend && npm test -- src/lib/corestt.test.ts src/lib/commandEmbeddings.test.ts src/lib/dictationFlow.test.ts src/lib/editorFlow.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-07-07 - List voice command insertion behavior

Changed:
- Updated bullet and numbered list voice commands so starting a list creates a
  fresh editor position before enabling list mode instead of converting the
  existing paragraph above the cursor.
- Added focused editor-flow coverage for start/stop list command sequencing.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts`
- `cd frontend && npm test -- src/lib/corestt.test.ts src/lib/commandEmbeddings.test.ts src/lib/dictationFlow.test.ts src/lib/editorFlow.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning
- `cd frontend && npm test`

## 2026-07-07 - Explicit start/stop voice command modes

Changed:
- Added explicit `start`/`stop` voice command routing for bold, italic,
  underline, upper/lower case modes, list modes, heading, quote, code block,
  paragraph, and horizontal rule insertion.
- Made `next line` the primary line-break command while keeping `new line`,
  `newline`, and `line break` as command variants.
- Applied upper/lower case modes to future dictated insertions and updated
  in-app help plus user-facing command docs.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts src/lib/commandEmbeddings.test.ts src/lib/dictationFlow.test.ts`
- `cd frontend && npm run build` — passes with existing large chunk warning

## 2026-06-27 - Semantic voice command matching

Changed:
- Added `frontend/src/lib/commandEmbeddings.ts` with `CommandEmbeddingMatcher`
  class that loads Xenova/all-MiniLM-L6-v2 via Transformers.js for semantic
  voice command routing (cosine similarity at 0.75 threshold).
- Added `routeFinalTextSemantic()` in `corestt.ts` as an async semantic
  alternative to `routeFinalText()` — falls back to exact matching when the
  model is not yet loaded.
- Added `routeTemplateVoiceCommandSemantic()` in `templateFlow.ts` for
  semantic template name matching.
- Wired the matcher into `useDictationSession.ts` — model loads in background
  on mount, template embeddings recompute when template list changes,
  `insertFinalText()` now uses semantic routing when available.
- Added 27 tests in `commandEmbeddings.test.ts` covering cosine similarity
  math, matcher lifecycle, fallback behavior, mock embedding matching, and
  integration with settings filters (voice commands, variants, template
  marker navigation, macro expansion).

Validation:
- `cd frontend && npm test` — 118 passed (was 67)
- `cd frontend && npm run build` — passes with existing large chunk warning

Next:
- Vite built chunk now includes ONNX Runtime Web WASM (~23.5 MB) and
  transformers.js library (~516 KB); model weights (~23 MB) download at
  runtime from Hugging Face Hub and cache in browser.

## 2026-06-24 - Project progress refresh

Changed:
- Updated `docs/PROJECT_PROGRESS.md` with the latest automated validation results.
- Clarified that macro/template/settings and STT proxy API tests already exist.
- Updated `docs/TODO_BACKLOG.md` so remaining backend API test work focuses on auth, documents, ownership, and PDF export.

Validation:
- `cd backend && .venv/bin/pytest -q`
- `python3 -m compileall backend/app`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `cd frontend && npm audit --audit-level=high`

Next:
- Real CoreSTT microphone smoke test still requires CoreSTT running separately.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-24 - Feature backlog

Changed:
- Added `docs/FEATURE_BACKLOG.md` with immediate product feature priorities
  and later general-purpose feature checklist items.

Validation:
- Documentation-only review.

## 2026-06-24 - OS deployment scripts

Changed:
- Added separate Docker and direct-terminal deployment wrappers for Linux/macOS
  and Windows PowerShell under `scripts/`.
- Documented wrapper usage in command and AI context docs.

Validation:
- `bash -n scripts/deploy-docker-linux.sh`
- `bash -n scripts/deploy-terminal-linux.sh`
- `./scripts/deploy-docker-linux.sh help`
- `./scripts/deploy-terminal-linux.sh help`
- PowerShell syntax validation not run because `pwsh`/`powershell` is not
  available on this host.

## 2026-06-28 - Terminal deployment runtime setup

Changed:
- Rewrote direct-terminal deployment wrappers for macOS, Linux, and Windows.
- Added simple Python 3.12+ and Node.js 22+ checks that ask before installing
  missing runtimes.
- Added explicit backend virtual environment creation and verification before
  installing Python dependencies.
- Aligned dependency install and startup commands with `docs/COMMANDS.md`.
- Added a focused script validation check for terminal deployment wrappers.

Validation:
- `bash scripts/test-deploy-terminal-scripts.sh`

## 2026-06-24 - Frontend module split

Changed:
- Split the former monolithic frontend workspace from `App.tsx` into feature
  modules under `frontend/src/features/`.
- Added focused workspace data and dictation session hooks while preserving
  routes, API calls, CSS classes, and STT behavior.
- Updated AI context docs to point future sessions at the new frontend module
  boundaries.

Validation:
- `cd frontend && npm run build`
- `cd frontend && npm test`

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
- Added Phase 1 voice recording control so `stop recording`, `stop dictation`,
  and `pause recording` stop active dictation.
- Moved realtime transcript display from the dictation status row into a
  temporary grey Smart Editor preview that clears before final insertion.
- Added high-value voice editing commands for `scratch that`, deleting the last
  word/sentence, `undo that`, `redo that`, and `save document`.

Validation:
- `cd frontend && npm test -- src/lib/corestt.test.ts src/lib/editorFlow.test.ts`
- `cd frontend && npm test -- src/lib/dictationFlow.test.ts`
- `cd frontend && npm test -- src/lib/realtimeTranscriptPreview.test.ts`
- `cd frontend && npm test -- src/lib/editorVoiceCommands.test.ts`
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

## 2026-06-27 - Template categories and fill-in fields

Changed:
- Added optional template categories across API records, SQLite startup compatibility, and frontend create/edit/filter UI.
- Added `{{field_name}}` placeholder detection and a required fill-in form before inserting templates from the template manager.
- Added backend and frontend regression coverage for category search/persistence, upload response shape, and placeholder filling.

Validation:
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`
- `cd frontend && npm test -- src/lib/templateFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Template manager UX pass

Changed:
- Moved new template creation into the template sidebar and changed the page to a two-column manager layout.
- Made template placeholder fields visible immediately for the selected template instead of hiding them behind the insert action.
- Preserved filled placeholder values for matching fields while clearing stale values when template HTML changes.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`

Next:
- Browser visual verification was blocked by the in-app browser connector setup error in this session.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Template edit regression fix

Changed:
- Fixed selected-template sync so local edits are not overwritten while typing.
- Added regression coverage for preserving local template edits until the template list changes.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts src/lib/api.test.ts`
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`
- `cd frontend && npm run build`

Next:
- Browser visual verification remains To verify because the in-app browser connector failed during setup.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Configurable neomorphic themes

Changed:
- Added persisted `ui_theme` settings support with `neo-cool`, `neo-warm`, and `neo-dark` presets.
- Added a Settings appearance selector and applied saved theme classes to the workspace.
- Refactored frontend styling around neomorphic theme variables, raised/inset controls, panels, editor, modal, and status surfaces.

Validation:
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py::test_user_settings_defaults_and_update`
- `cd frontend && npm test -- src/features/settings/settingsFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`
- Local HTTP smoke: backend health on `http://127.0.0.1:8000/api/health/live`, Vite HTML on `http://127.0.0.1:5175/`

Next:
- Browser visual verification remains To verify because browser control failed during setup.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Documents workspace mockup redesign

Changed:
- Reworked the Documents workspace into a mockup-inspired layout with preserved sidebar, document, dictation, quick setting, search/replace, toolbar, marker navigation, editor, footer, and Micro Editor controls.
- Added a Documents right rail for dictation help, local editor quick actions, and diagnostics summary.
- Added editor helper coverage for text metrics, date/time quick actions, and clear-last-sentence behavior.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts src/features/documents/DocumentQuickSettings.test.ts`
- `cd frontend && npm run build`
- Local HTTP smoke: Vite HTML on `http://127.0.0.1:5175/`

Next:
- Browser visual verification remains To verify.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Documents viewport scroll fix

Changed:
- Constrained the Documents workspace to the viewport so the footer dock stays visible.
- Made the editor shell and right rail own their internal scrolling.
- Added responsive sizing tokens for Documents controls, cards, text, spacing, and editor padding across desktop, tablet, and phone breakpoints.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts src/features/documents/DocumentQuickSettings.test.ts`
- `cd frontend && npm run build`

Next:
- Browser visual verification remains To verify.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Dictation profile UI removal

Changed:
- Removed the non-functional dictation profile selector from Settings.
- Removed the profile readout from Diagnostics and user-facing manual text.

Validation:
- `cd frontend && npm test -- src/features/settings/settingsFlow.test.ts`
- `cd frontend && npm run build`

Next:
- Backend settings still retain `profile` for API/storage compatibility.

## 2026-06-27 - Document quick settings

Changed:
- Added immediate-save quick toggles to the Documents page for common dictation workflow settings.
- Added a Smart/Micro target selector on Documents while keeping the same settings available in Settings.
- Hid the inactive Shortcuts editor from Settings while leaving the shortcut API/storage in place.

Validation:
- `cd frontend && npm test -- src/lib/api.test.ts src/features/documents/DocumentQuickSettings.test.ts`
- `cd frontend && npm run build`

Next:
- Shortcuts remain stored by the API but do not have runtime keyboard handling yet.

## 2026-06-27 - Document management modal

Changed:
- Added optional document categories across backend records, schemas, API responses, and SQLite startup compatibility.
- Added a sidebar document section with recent documents plus a `Manage` modal for search, sort, category filtering, create, rename, categorize, duplicate, export, and delete.
- Added focused backend and frontend coverage for document categories and document management filtering/sorting.

Validation:
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`
- `cd frontend && npm test -- src/lib/api.test.ts src/features/documents/documentManagement.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Template marker voice navigation

Changed:
- Added a persisted `template_marker_navigation_enabled` setting with Settings UI control.
- Added template marker metadata and editor helpers for selecting/replacing highlighted `{{marker}}` fields.
- Routed `next field` as a Smart Editor command only when marker navigation is enabled.
- Focused the first inserted marker for UI, default-template document, and voice template insertion paths.

Validation:
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`
- `cd frontend && npm test -- src/lib/templateFlow.test.ts src/lib/corestt.test.ts src/lib/api.test.ts src/lib/templateMarkerNavigation.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Template marker setting persistence fix

Changed:
- Made the template marker voice navigation checkbox persist immediately when toggled.
- Added focused settings-flow coverage for immediate persistence fields.

Validation:
- `cd frontend && npm test -- src/features/settings/settingsFlow.test.ts src/lib/api.test.ts src/lib/corestt.test.ts src/lib/templateMarkerNavigation.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Settings save behavior fix

Changed:
- Unified Settings page behavior so every user setting persists immediately on change.
- Kept shortcut edits on the explicit Shortcuts save action.
- Expanded backend settings coverage to verify every settings field survives update and fresh read.

Validation:
- `cd frontend && npm test -- src/features/settings/settingsFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Settings explicit save button

Changed:
- Restored draft-only Settings behavior so settings persist only when Save settings is clicked.
- Moved the Save settings button to the top-right Settings header and disabled it when there are no settings or shortcut changes.
- Removed the duplicate save button from the Shortcuts panel.

Validation:
- `cd frontend && npm test -- src/features/settings/settingsFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Template voice navigation setting polish

Changed:
- Reworded the template field voice navigation setting for clearer scanning.
- Top-aligned checkbox controls so multi-line settings read as one control.

Validation:
- `cd frontend && npm test -- src/features/settings/settingsFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Settings persistence runtime verification

Changed:
- Enabled backend reload in `scripts/run-dev.sh` to prevent stale API code during local development.
- Restarted the local dev servers so `/api/settings` includes `template_marker_navigation_enabled`.
- Verified the template marker navigation setting persists through PATCH, fresh GET, and SQLite storage.

Validation:
- Local API PATCH/GET against `http://127.0.0.1:8000/api/settings`
- SQLite read of `user_settings.template_marker_navigation_enabled`

Next:
- The local dev server is running at `http://127.0.0.1:5173/`.

## 2026-06-27 - Guided template marker dictation

Changed:
- Added `template_marker_auto_advance_enabled` settings support.
- Added previous, first, skip, and cancel marker navigation commands.
- Added a Smart Editor marker navigation panel with field progress and command hints.
- Added active-marker styling without changing saved document content.

Validation:
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`
- `cd frontend && npm test -- src/lib/templateMarkerNavigation.test.ts src/lib/corestt.test.ts src/features/settings/settingsFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Template markdown marker insertion

Changed:
- Removed the fill-before-insert template flow.
- Template markdown markers like `{{patient_name}}` now stay in inserted content and are wrapped with a highlighted token style.
- Applied marker highlighting to template preview, manual insertion, default-template document creation, and voice-driven template insertion.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`

Next:
- Browser visual verification remains To verify because the in-app browser connector failed during setup.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-27 - Template marker render fix

Changed:
- Wrapped plain-text template content in paragraph HTML before inserting highlighted markers.
- Added a TipTap mark extension so highlighted template marker spans render as inline tokens instead of literal HTML text.

Validation:
- `cd frontend && npm test -- src/lib/templateFlow.test.ts src/lib/api.test.ts`
- `cd frontend && npm run build`
- `cd backend && .venv/bin/pytest -q tests/test_macro_template_api.py`
- `git diff --check`

Next:
- Browser visual verification remains To verify because the in-app browser connector failed during setup.
- Vite still reports the existing large chunk warning during production build.

## 2026-06-28 - Template marker panel overlap fix

Changed:
- Switched the document main column from fixed grid rows to a vertical flex stack.
- Made the editor shell the flexible scroll region so the optional marker panel no longer shares the editor row.

Validation:
- `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-06-28 - Compact Documents editor layout

Changed:
- Merged dictation status and primary document actions into the Documents header.
- Moved quick settings and find/replace behind compact toggle buttons.
- Added editor focus mode that hides secondary controls and the right rail while keeping save, dictation, toolbar, and marker actions available.
- Slimmed the toolbar and template marker panel to increase Smart Editor vertical space.

Validation:
- `cd frontend && npm test -- src/lib/editorFlow.test.ts`
- `cd frontend && npm run build`
- Local HTTP smoke against `http://127.0.0.1:5174/`

Next:
- Browser visual verification remains To verify because the in-app browser connector failed during setup.
- Vite still reports the existing large chunk warning during production build.
