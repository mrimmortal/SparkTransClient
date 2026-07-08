# API Contracts

Base URL in development: `http://127.0.0.1:8000`.

Authentication uses an HTTP-only cookie named by backend settings.

## Auth

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create user and session. |
| `POST` | `/api/auth/login` | Create session for existing user. |
| `POST` | `/api/auth/logout` | Clear session. |
| `GET` | `/api/auth/me` | Return authenticated user. |

## Documents

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/documents` | List current user's documents. |
| `POST` | `/api/documents` | Create document. |
| `GET` | `/api/documents/{document_id}` | Read owned document. |
| `PATCH` | `/api/documents/{document_id}` | Update owned document. |
| `DELETE` | `/api/documents/{document_id}` | Delete owned document. |
| `POST` | `/api/documents/{document_id}/export/pdf` | Export owned document as PDF. |

Document records include `id`, `title`, optional `category`, `content_json`,
`content_html`, `created_at`, and `updated_at`. Create and update payloads
accept optional `category`.

## Templates

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/templates` | List current user's templates. |
| `POST` | `/api/templates` | Create template. |
| `POST` | `/api/templates/upload` | Upload `.docx` template. |
| `GET` | `/api/templates/search?q=...` | Fuzzy search owned templates. |
| `PATCH` | `/api/templates/{template_id}` | Update owned template. |
| `DELETE` | `/api/templates/{template_id}` | Delete owned template. |

Template records include `id`, `name`, optional `category`, `content_html`,
optional `source_filename`, and `created_at`. Create and update payloads accept
optional `category`; `.docx` uploads return `category: null`.

## Macros, Settings, Shortcuts

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/macros` | List current user's macros. |
| `POST` | `/api/macros` | Create macro. |
| `PATCH` | `/api/macros/{macro_id}` | Update owned macro. |
| `DELETE` | `/api/macros/{macro_id}` | Delete owned macro. |
| `GET` | `/api/settings` | Read user settings. |
| `PATCH` | `/api/settings` | Update user settings. |
| `GET` | `/api/shortcuts` | List shortcut bindings. |
| `PUT` | `/api/shortcuts` | Replace shortcut bindings. |

User settings include:

- `audio_device_id`
- `voice_commands_enabled`
- `macros_enabled`
- `default_editor_target`
- `profile`
- `auto_connect_corestt`
- `autosave_enabled`
- `autosave_interval_seconds`
- `confirm_destructive_actions`
- `duplicate_transcript_protection_enabled`
- `duplicate_transcript_window_ms`
- `ignore_blank_audio_enabled`
- `voice_command_variants_enabled`
- `default_template_id`
- `show_microphone_status`
- `template_marker_navigation_enabled`
- `template_marker_auto_advance_enabled`
- `ui_theme`

## Health And Config

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health/live` | Process liveness. |
| `GET` | `/api/health/ready` | Database readiness. |
| `GET` | `/api/health/version` | Version metadata. |
| `GET` | `/api/config` | Public frontend config. |

## Domain Profiles

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/domain-profiles` | Proxy CoreSTT editable domain profile details. |
| `PUT` | `/api/domain-profiles/{name}` | Proxy create or replace for one CoreSTT domain profile. |
| `DELETE` | `/api/domain-profiles/{name}` | Proxy delete for one CoreSTT domain profile. |

Domain profile routes require the current SparkTransClient user session. The
proxy derives the CoreSTT HTTP origin from `CORESTT_WS_URL` and forwards to
CoreSTT `/api/domain-profiles`.

## WebSocket

| Path | Purpose |
|---|---|
| `/ws/stt-proxy` | Relay CoreSTT text and binary frames. |

CoreSTT packet and message rules are defined in `WEBSOCKET_CLIENT_CONTRACT.md`.
