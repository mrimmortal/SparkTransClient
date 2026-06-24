# Module Map

Use this map to find the smallest relevant file set for future work.

## Backend

| Area | Files | Tests |
|---|---|---|
| App entrypoint | `backend/app/main.py` | smoke import via commands |
| Config/logging | `backend/app/core/config.py`, `backend/app/core/logging.py` | compile checks |
| Database/session | `backend/app/db/session.py`, `backend/app/models/*.py` | `backend/tests/test_sample_seed.py` |
| Auth/session | `backend/app/api/auth.py`, `backend/app/services/security.py` | `backend/tests/test_sample_seed.py` |
| Sample data | `backend/app/services/seed.py`, `backend/scripts/seed_sample_user.py` | `backend/tests/test_sample_seed.py` |
| Documents | `backend/app/api/documents.py`, `backend/app/models/document.py` | To add API tests |
| Templates | `backend/app/api/templates.py`, `backend/app/services/templates.py` | `backend/tests/test_macro_template_api.py` |
| Macros | `backend/app/api/macros.py`, `backend/app/models/macro.py` | `backend/tests/test_macro_template_api.py` |
| Settings/shortcuts | `backend/app/api/settings.py`, `backend/app/models/settings.py` | To add API tests |
| CoreSTT protocol/proxy | `backend/app/services/corestt_protocol.py`, `backend/app/api/stt_proxy.py` | `backend/tests/test_corestt_packet.py`, `backend/tests/test_stt_proxy.py` |

## Frontend

| Area | Files | Tests |
|---|---|---|
| App shell/composition | `frontend/src/App.tsx`, `frontend/src/features/workspace/WorkspaceShell.tsx` | build validation |
| Workspace state | `frontend/src/features/workspace/useWorkspaceData.ts`, `frontend/src/features/workspace/types.ts` | build validation |
| Dictation orchestration | `frontend/src/features/dictation/useDictationSession.ts`, `frontend/src/features/dictation/DictationControlPanel.tsx` | `frontend/src/lib/corestt.test.ts`, build validation |
| Routed UI pages | `frontend/src/features/documents/`, `frontend/src/features/templates/`, `frontend/src/features/macros/`, `frontend/src/features/settings/`, `frontend/src/features/diagnostics/` | build validation |
| Shared UI components | `frontend/src/components/`, `frontend/src/features/micro-editor/` | build validation |
| API client | `frontend/src/lib/api.ts` | `frontend/src/lib/api.test.ts` |
| CoreSTT protocol/client | `frontend/src/lib/corestt.ts`, `frontend/src/lib/sttClient.ts`, `frontend/src/lib/micCapture.ts`, `frontend/public/corestt-audio-worklet.js` | `frontend/src/lib/corestt.test.ts` |
| Sample credentials | `frontend/src/lib/sampleUser.ts` | `frontend/src/lib/corestt.test.ts` |
| Entrypoint | `frontend/src/main.tsx` | build validation |
| Dev proxy | `frontend/vite.config.ts`, `scripts/run-dev.sh` | smoke startup |
| Deployment scripts | `scripts/deploy-docker-linux.sh`, `scripts/deploy-docker-windows.ps1`, `scripts/deploy-terminal-linux.sh`, `scripts/deploy-terminal-windows.ps1`, `docker-compose.yml` | syntax checks, deployment smoke when available |
| User workflow docs | `docs/USER_MANUAL.md`, `docs/PROJECT_PROGRESS.md` | doc/source consistency checks |

## Docs

| Purpose | File |
|---|---|
| Commands | `docs/COMMANDS.md` |
| User workflow | `docs/USER_MANUAL.md` |
| Progress tracking | `docs/PROJECT_PROGRESS.md` |
| Session notes | `docs/SESSION_LOG.md` |
| CoreSTT contract | `WEBSOCKET_CLIENT_CONTRACT.md` |

## Boundaries

- Do not change CoreSTT behavior from this project.
- Do not edit generated outputs, virtualenvs, `node_modules`, `.pytest_cache`, `__pycache__`, or `frontend/dist`.
- Do not commit real `.env` files or production secrets.
