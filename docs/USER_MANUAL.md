# SparkTransClient User Manual

## What This App Does

SparkTransClient is a desktop dictation workspace for creating and editing documents.
It uses the existing CoreSTT WebSocket service for speech-to-text and keeps document,
template, macro, and settings features inside this application.

## Start The App

From the project root:

```bash
./scripts/run-dev.sh
```

Open:

```text
http://127.0.0.1:5173/
```

The script starts:

- FastAPI backend on `http://127.0.0.1:8000`
- React frontend on `http://127.0.0.1:5173`
- sample user and starter content

For real dictation, CoreSTT must already be running at:

```text
ws://127.0.0.1:8020/ws/transcribe
```

## Sample Login

Use this account for local testing:

```text
Email: sample@sparktrans.app
Password: SampleUser123!
```

Do not use this account or password in production.

## Main Workspace

The app uses a route-based desktop layout:

- `/documents`: document list, Smart Editor, dictation controls, search/replace, PDF export, and Micro Editor.
- `/templates`: template search, create, edit, delete, `.docx` upload, preview, and insert into the active document.
- `/macros`: macro create, edit, enable/disable, and delete.
- `/settings`: voice command, macro expansion, default editor target, audio device, and shortcut settings.
- `/diagnostics`: backend health/config, workspace counts, STT state, microphone status, audio packet counts, and reconnect attempts.

## Test Basic Editing

1. Sign in with the sample user.
2. Open `Sample dictation note`.
3. Type text in the Smart Editor or use the editor toolbar for formatting, lists, quotes, code blocks, horizontal rules, undo/redo, or clearing formatting.
4. Check the save status near the title, then click `Save`. The save button is available only when the active editor has text.
5. Use `Find` and `Replace` if needed, then click `Replace all`.
6. Click `Export` to download a PDF copy.
7. Refresh the page and sign in again.
8. Confirm the saved document appears in the list.

## Test Dictation

1. Start CoreSTT separately.
2. In SparkTransClient, open or create a document.
3. Use the primary dictation button to connect, start dictation after CoreSTT reports ready, stop dictation, or retry after a connection error.
4. Allow browser microphone access when prompted.
5. Speak a short English phrase into the desktop microphone.
6. Realtime transcript appears as a grey italic preview in the Smart Editor.
7. Final transcript replaces the preview and is inserted into the active editor target.
8. Open `Dictation help` on the document screen for setup status, supported voice commands, template phrases, and macro/settings pointers.
9. Open `Diagnostics` to confirm microphone status, sample rate, audio packet count, and reconnect attempt details.
10. Stop dictation when finished and confirm microphone status changes away from capturing.

If CoreSTT is not running, the app UI still opens, but real transcription will not work.
Browser microphone capture requires localhost during development or HTTPS/WSS in production.

## Smart Editor Commands

These voice commands control the Smart Editor even when the normal transcript
target is set to Micro Editor:

| Spoken text | Action |
|---|---|
| `new line`, `newline` | Insert line break |
| `new paragraph`, `new para` | Insert paragraph |
| `undo` | Undo editor change |
| `redo` | Redo editor change |
| `undo that` | Undo editor change |
| `redo that` | Redo editor change |
| `scratch that` | Remove the last final dictated phrase inserted into the Smart Editor |
| `delete last word`, `delete previous word` | Delete the word before the cursor or the selected text |
| `delete last sentence` | Delete text back to the previous sentence boundary or paragraph start |
| `save document` | Save the current document |
| `bold` | Toggle bold formatting |
| `italic` | Toggle italic formatting |
| `underline` | Toggle underline formatting |
| `clear formatting` | Clear active formatting and block style |
| `select all`, `select everything` | Select editor content |
| `clear all`, `clear everything` | Ask before clearing editor content |
| `stop recording`, `stop dictation`, `pause recording` | Stop active dictation |

Outside the Smart Editor, recognized phrases are inserted as plain text.
Recording control phrases work while dictation is running.

Spoken punctuation is converted in final dictated text when voice commands are
enabled. For example, `hello comma world full stop` inserts `hello, world.`.
Supported punctuation phrases include `comma`, `full stop`, `period`,
`question mark`, `exclamation mark`, `exclamation point`, `colon`, `semicolon`,
`dash`, `hyphen`, `slash`, `open bracket`, `close bracket`, `open quote`, and
`close quote`.

## Macro Test

The sample user includes this macro:

```text
Trigger: standard closing note
Replacement: Please review the above details and confirm if any correction is required.
```

When final transcript contains `standard closing note`, the app expands it before insertion.
Macro expansion can be turned off on the `Settings` page.

Use `Macros` to create, edit, enable, disable, and delete phrase expansions.
Enable/disable changes save immediately. Edited trigger or replacement text shows
as unsaved until `Save` is clicked. Deleting a macro asks for confirmation first.

## Micro Editor

1. Click `Micro`.
2. Type or dictate temporary text.
3. Click `Move to Smart Editor` to append it to the main document.
4. Click `Close` when finished.

## Templates

The sample user includes a `Meeting minutes` template for testing template storage.
Use `Templates` to search, create, upload, edit, delete, preview, or insert templates
into the active Smart Editor document.
Templates can have one optional category for filtering. Template HTML can include
markdown-style fields such as `{{patient_name}}`; those markers stay in the
inserted document and are highlighted so they are easy to find.
When voice navigation through template fields is enabled in Settings, inserting
a template opens a field navigation panel and selects the first highlighted
marker. A final dictated transcript replaces the selected marker. Say
`next field`, `previous field`, `first field`, `skip field`, or
`cancel field navigation` to move through markers. If auto-advance is enabled,
the next marker is selected after each dictated value.
Say `insert template <template name>`, `use template <template name>`, or
`get template <template name>` during dictation to insert a matching template
into the Smart Editor.
Template names are required and trimmed before save. Upload accepts `.docx` files;
failed uploads reset the file picker so the same file can be retried. Deleting a
template asks for confirmation first.

## Export

Use the sidebar document section for quick access to recent documents. Click
`Manage` to search, sort, filter by category, create from a template, rename,
categorize, duplicate, export, or delete documents.
Click `Export` on the `Documents` page to download the active document as a PDF.
Deleting a document asks for confirmation first.

## Settings And Shortcuts

Use `Settings` to adjust dictation behavior, transcript handling, microphone
selection, document defaults, safety prompts, and shortcuts.
The top-right `Save settings` button is enabled when settings or shortcuts have
unsaved changes. Click it to persist the changes.

Useful options include auto-connecting CoreSTT on the Documents page, allowing
common voice-command variants, ignoring `[BLANK_AUDIO]`, preventing repeated
final transcripts, enabling document auto-save, choosing a default template for
new documents, voice navigation through template fields, template field
auto-advance, and requiring confirmation before clearing or deleting data.
The microphone section can list browser audio inputs and run a basic microphone
permission check when the browser permits device access.

## Production Notes

- Set a real `SECRET_KEY`.
- Use HTTPS/WSS behind a reverse proxy.
- Prefer the FastAPI STT proxy in production.
- Do not expose CoreSTT directly on untrusted networks unless separately secured.
- Do not use the sample user in production.
