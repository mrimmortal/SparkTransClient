# Session Log

Keep this file compact. Add only entries that help a future AI session resume
without rediscovering recent decisions.

## 2026-07-09 - Documentation context compression

Changed:
- Audited repo markdown files outside `.ai-rules`.
- Removed completed one-off implementation plan context.
- Folded `docs/FEATURE_BACKLOG.md` into `docs/TODO_BACKLOG.md`.
- Compressed `WEBSOCKET_CLIENT_CONTRACT.md` to current protocol facts.
- Replaced the long chronological session log with this continuation summary.

Validation:
- `rg --files -g '*.md' -g '!.ai-rules/**'`
- `find . -name '*.md' -not -path './.ai-rules/*' -not -path './.git/*' -not -path './frontend/node_modules/*' -not -path './backend/.venv/*' -not -path './backend/.pytest_cache/*' -exec wc -l {} +`
- `git diff --check`

Next:
- Keep future entries concise and avoid logging tiny styling-only changes unless they affect continuation.

## 2026-07-09 - Public landing page

Changed:
- Added a public Next Line Spark landing page for logged-out users at `/`.
- Moved the sign-in screen to `/login` and kept authenticated users in the existing workspace routes.
- Added responsive landing styles and a product-workspace visual mockup.

Validation:
- `cd frontend && npm test -- typographyTokens`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- Local Vite route checks: `GET /` and `GET /login` returned HTTP 200.
- `git diff --check`

Next:
- In-app browser visual verification was unavailable in this environment; manually review `http://127.0.0.1:5174/`.
- Vite still reports the existing large chunk warning during production build.

## Current UI State

Changed:
- Sidebar brand lockup uses the Next Line Spark visual style.
- Documents workspace was polished around an editor-first layout.
- Floating dictation is the single primary dictation start/stop control; it is draggable, always on top, and red/glowing while recording.
- Right rail is compact: Dictation Status, Quick Actions, and collapsed Dictation Help.
- Settings, Templates, Macros, Manage documents, and profile CRUD use Settings-style cards, hierarchy, spacing, and responsive behavior.
- Clear-editor voice command uses an app warning modal instead of browser confirm.
- Typography tokens were standardized in `frontend/src/styles/app.css`; raw font-size values are intentionally limited to the brand lockup.

Validation:
- Recent frontend checks passed on 2026-07-09: `cd frontend && npm test`, `cd frontend && npm run build`, `git diff --check`.
- Build still reports the existing Vite large chunk warning.

Next:
- Browser visual verification across desktop/tablet/mobile remains To verify.

## Current Dictation And Voice Behavior

Changed:
- CoreSTT browser microphone capture, proxy relay, packet validation, and structured payload-safe STT logs exist.
- Domain profile proxy/client/UI exist for `GET`, `PUT`, and `DELETE /api/domain-profiles`.
- Semantic voice command matching uses MiniLM sentence embeddings.
- Boundary command handling supports safe editor commands at the start/end of dictated text.
- Destructive/navigation/action commands remain full-utterance commands.
- Explicit spoken `full stop` punctuation is preserved while automatic trailing full stops are stripped from normal transcript insertions.
- `select all` / `select everything` moves the Smart Editor cursor to document end before selecting all.

Validation:
- Recent focused tests passed for `corestt`, `editorFlow`, command embeddings, and dictation flow during the related work.

Next:
- Real CoreSTT microphone transcription smoke test still requires CoreSTT running separately.

## Historical Milestones

Changed:
- Backend owns auth, documents, templates, macros, settings, shortcuts, health/config, and STT proxy routes.
- Frontend owns routed workspace pages, TipTap Smart Editor, document management, templates, macros, settings, diagnostics, dictation orchestration, and API client.
- Documents support CRUD, categories, management modal, save, PDF export, search/replace, and template insertion.
- Templates support CRUD, `.docx` upload/import, categories, placeholder markers, and voice-driven insertion/navigation.
- Macros support CRUD, final transcript expansion, enabled toggles, and non-cascading/priority behavior.
- Deployment helpers exist for Docker and direct terminal runs on supported platforms.

Validation:
- See `docs/COMMANDS.md` for verified command entrypoints.
- See `docs/PROJECT_PROGRESS.md` for implementation status.

Next:
- Keep source-of-truth details in focused docs: `AI_CONTEXT.md`, `docs/MODULE_MAP.md`, `docs/API_CONTRACTS.md`, `WEBSOCKET_CLIENT_CONTRACT.md`, and `docs/TODO_BACKLOG.md`.
