# Session Log

Keep this file compact. Add only entries that help a future AI session resume
without rediscovering recent decisions.

## 2026-07-10 - Paragraph toolbar compacting

Changed:
- Tightened the Documents paragraph ribbon group into a stable four-column icon grid.
- Reduced paragraph group widths at desktop and MacBook breakpoints so the right divider no longer leaves excess blank space around the icons.

Validation:
- Passed: `cd frontend && npm run build`
- Passed: `git diff --check`

Next:
- Vite may still report the existing large chunk warning during production build.

## 2026-07-10 - Retina 13-inch MacBook workspace adjustment

Changed:
- Extended compact Documents breakpoints to `1536px` wide so Retina 13-inch effective viewports around `1470 x 850` no longer use oversized desktop proportions.
- Added a short-height `1380px-1536px` override that reduces sidebar, right rail, chrome, footer, and paper height so the document fits above the footer.

Validation:
- Passed: `cd frontend && npm run build`
- Browser checked `/documents` at `1470 x 850`; paper measured `800 x 460`, footer starts below the paper, Focus remains visible, and right rail actions fit.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - MacBook Air workspace layout adjustment

Changed:
- Added a `1380px-1440px` by `850px+` Documents breakpoint for MacBook Air-like viewports.
- Preserved compact laptop controls while widening the shell to `252px` sidebar, `210px` right rail, and `820px` paper.
- Kept paper height at `520px` so it fits within the visible editor shell at `1440 x 900`.

Validation:
- Passed: `cd frontend && npm run build`
- Browser checked `/documents` at `1440 x 900`; measurements showed visible Focus control, `820 x 520` paper, `948px` main editor column, and `210px` right rail.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Laptop workspace layout adjustment

Changed:
- Added a `1181px-1440px` Documents breakpoint for laptop-sized screens.
- Reduced laptop sidebar, right rail, chrome, ribbon, paper, and footer dimensions while preserving the larger desktop reference layout.
- Compact laptop header action buttons to icons so Save, Export, Delete, Settings, Search, and Focus all fit.
- Switched laptop right-rail quick actions to one column so labels such as `Clear sentence` do not clip.

Validation:
- Passed: `cd frontend && npm run build`
- Browser checked `/documents` at `1366 x 768`; Focus is visible, quick action labels fit, and the three-column layout remains intact.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Ribbon category spacing reduction

Changed:
- Reduced Documents ribbon group inner padding and fixed widths for Clipboard, Font, Paragraph, and Insert.
- Changed the measured desktop ribbon body from distributed spacing to left-packed groups so category gaps no longer consume the available toolbar space.

Validation:
- Passed: `cd frontend && npm run build`
- Browser checked `/documents` at `1625 x 968`; ribbon group measurements are adjacent without distributed blank lanes.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Measured dictation workspace UI implementation

Changed:
- Tuned the Documents workspace shell to the measurement reference: `273px` sidebar, `220px` right rail, `12px` document gutter, and `73px` footer dock.
- Adjusted the merged document chrome, ribbon tab/body heights, editor grid background, centered `846 x 530` paper target, paper padding, and shadows.
- Changed the default dictation Connect action placement to the lower-left sidebar area while keeping drag/clamp behavior and using a new persisted position key.
- Added `docs/superpowers/plans/2026-07-10-dictation-workspace-measured-ui.md`.

Validation:
- Passed: `cd frontend && npm test -- floatingActionPosition`
- Passed: `cd frontend && npm run build`
- Passed: browser visual check at `1625 x 968` on `http://127.0.0.1:5176/documents`.
- Passed: DOM measurements showed sidebar `273px`, right rail `220px`, editor chrome `290px`, paper `846 x 530`, and footer `73px`.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Dictation workspace measurement reference

Changed:
- Added `docs/ui-reference/dictation-workspace-measurements.png`, an annotated version of the provided reference screenshot with shell, ribbon, canvas, paper, rail, and status-bar measurements.
- Added `docs/ui-reference/dictation-workspace-ui-measurements.md` as a concise Codex handoff for planning and implementing the measured UI.

Validation:
- Verified the annotated PNG exists and remains `1625 x 968`.

Next:
- Use the UI reference doc as the planning input before implementing any further workspace layout changes.

## 2026-07-10 - Merged compact editor chrome

Changed:
- Merged the document title/status/action header and editor ribbon into one `document-editor-chrome` surface.
- Converted Save, Export, and Delete to compact icon buttons with titles and ARIA labels.
- Scoped compact ribbon overrides to the merged chrome, including hidden visual group labels and horizontal ribbon overflow.
- Added responsive fixes so the floating Connect action layers below the chrome and the mobile ribbon keeps horizontal overflow instead of stacking taller.
- Kept document save/export/delete, target switching, and TipTap toolbar command handlers unchanged.

Validation:
- `cd frontend && npm run build`
- Browser visual verification at `http://localhost:5173/documents` for desktop, 900px tablet, and 390px mobile viewports.
- `git diff --check`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Focus mode toolbar visibility fix

Changed:
- Removed the focus-mode CSS rule that hid `.document-editor-chrome .editor-toolbar`.
- Keeps the compact editor ribbon available in focus mode.

Validation:
- `cd frontend && npm run build`
- `git diff --check`

Next:
- Browser harness could inspect toolbar visibility, but the focus-mode click did not toggle state during verification; manual UI check remains useful.

## 2026-07-10 - Documents editor-only layout correction

Changed:
- Reverted the over-broad Documents layout changes that hid the main sidebar, right rail, footer dock, and floating dictation action.
- Kept subsequent visual work scoped to the editor chrome and document canvas.
- Added inline title/status styling and labeled top editor action buttons for the merged editor chrome.
- Added editor-container responsive behavior so the Office-like header uses one row on wide editor widths and wraps controls inside the editor area on narrower widths.

Validation:
- `cd frontend && npm run build`
- Browser visual checks at wide desktop, tablet, and mobile widths.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Editor ribbon reference fidelity pass

Changed:
- Added disabled visual font controls for strikethrough, subscript, superscript, font color, and highlight to better match the Word-style reference.
- Matched non-active ribbon tab coloring more closely to the screenshot while keeping only Home functional.
- Reduced ribbon tab height, group height, command padding, and font group width after visual verification showed too much whitespace.
- Kept existing TipTap command behavior unchanged.

Validation:
- `cd frontend && npm run build`
- Browser visual verification at `http://localhost:5173/documents`

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Office ribbon clipping correction

Changed:
- Reduced Office ribbon group widths and command button sizes so Insert no longer clips on desktop.
- Let ribbon groups wrap at clean group boundaries when the available editor width is tight.
- Added a dedicated compact ribbon icon size token for toolbar controls.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Browser visual verification remains To verify at `http://127.0.0.1:5174/`.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Compact Office ribbon layout correction

Changed:
- Reworked editor ribbon groups so commands sit in compact rows and labels stay at the bottom.
- Fixed Font, Paragraph, and History groups that were stretching vertically across the ribbon.
- Kept desktop ribbon compact while preserving tablet/mobile wrapping behavior.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Browser visual verification remains To verify at `http://127.0.0.1:5174/`.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Office ribbon alignment correction

Changed:
- Tightened the Office-like editor ribbon to stay in one horizontal desktop band.
- Flattened ribbon button styling and reduced command size/padding to better match the reference.
- Kept tablet/mobile ribbon wrapping for usability.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Browser visual verification remains To verify at `http://127.0.0.1:5174/`.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Office-like editor ribbon shell

Changed:
- Expanded the Documents editor toolbar into an Office-like shell with File/Home/Insert/Layout/Review/View tabs.
- Kept Home as the active functional tab and added disabled visual placeholders for unsupported Office controls.
- Preserved existing TipTap toolbar commands while presenting them in Clipboard, History, Font, Paragraph, and Insert ribbon groups.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Browser visual verification remains To verify at `http://127.0.0.1:5174/`.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Word-like Smart Editor UI pass

Changed:
- Kept TipTap as the editor engine and restyled the Documents editor into a Word-inspired page canvas.
- Grouped editor toolbar controls into ribbon-lite sections for style, font, paragraph, and history actions.
- Tuned editor document typography, page spacing, list indentation, blockquote, and code block styling.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `git diff --check`

Next:
- Browser visual verification remains To verify at `http://127.0.0.1:5174/`.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Realtime transcript append-only animation

Changed:
- Realtime interim preview now compares the previous and latest interim text.
- Only newly appended words get a fast muted fade/up animation; repeated or revised text updates without replaying the animation.
- Added a subtle blinking cursor at the end of active realtime preview text.
- Added focused helper tests for append, repeat, and revision cases.

Validation:
- `cd frontend && npm test -- realtimeTranscriptPreview`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Browser visual verification with live CoreSTT interim chunks remains To verify.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Friendlier microphone settings section

Changed:
- Added a current microphone summary to Settings so the selected device is obvious.
- Reworded microphone selection/testing copy around automatic device loading and permission checks.
- Made the advanced device ID field visually secondary and responsive.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Browser visual/device-permission verification remains To verify.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Automatic microphone devices and diagnostics label

Changed:
- Settings now auto-loads available browser microphone devices when the page opens.
- Removed the redundant manual `Load devices` action; `Check microphone` remains and refreshes labels after permission succeeds.
- Diagnostics now shows the selected microphone label alongside microphone capture status.
- Added focused audio device helper tests for filtering and selected-label fallback behavior.

Validation:
- `cd frontend && npm test -- audioDevices`
- `cd frontend && npm test`
- `cd frontend && npm run build`

Next:
- Browser device label display remains To verify because labels can depend on microphone permission.
- Vite still reports the existing large chunk warning during production build.

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

## 2026-07-09 - Domain profile search

Changed:
- Added search filtering to the Transcription profiles list in Settings.
- Added filtered count and empty-state copy for unmatched profile searches.
- Added focused helper coverage for case-insensitive profile filtering.

Validation:
- `cd frontend && npm test -- domainProfileForm`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `git diff --check`

Next:
- Browser visual verification remains To verify.
- Vite still reports the existing large chunk warning during production build.

## 2026-07-09 - Sticky Settings header

Changed:
- Kept the Settings page header/save actions fixed in place while the settings form content scrolls.
- Scoped the scroll containment to Settings only so other manager pages keep their existing page scroll.

Validation:
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `git diff --check`

Next:
- Browser visual verification remains To verify.
- Vite still reports the existing large chunk warning during production build.

# 2026-07-09 Microphone Device Selection

Changed:
- Browser microphone capture now builds explicit audio constraints for the selected saved device id.
- Active dictation restarts microphone capture when the saved `audio_device_id` changes, so the newly selected microphone is used without requiring a manual stop/start.
- Focused tests cover default microphone constraints, exact selected-device constraints, and active capture restart detection.

Validation:
- Passed: `cd frontend && npm test -- src/lib/corestt.test.ts`
- Passed: `cd frontend && npm run build`
- Build still reports the existing Vite large chunk warning.

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

## 2026-07-10 - Compact merged document editor chrome

Changed:
- Merged the document title/status/actions and editor ribbon into one Office-style editor chrome for the Documents page.
- Kept the left navigation sidebar and right dictation rail intact; editor-specific styling is scoped to the Documents center workspace.
- Added narrow editor-container rules so the header and ribbon compact inside the center column instead of forcing extra vertical whitespace.
- Preserved focus mode toolbar visibility while hiding secondary controls according to the existing focus behavior.
- Tightened the active desktop toolbar breakpoint: compacted header controls, reduced ribbon group widths, kept desktop group labels visible, fixed the History label to `Undo / Redo`, and prevented Insert tiles from forcing extra ribbon height.

Validation:
- Passed: `cd frontend && npm run build`
- Passed: `git diff --check`
- Browser checked `http://localhost:5173/documents` at the active desktop viewport: sidebar and right rail remain visible, editor toolbar remains visible in focus mode, and the compact chrome frees more editor height.
- Browser rechecked the active `1280x720` viewport: editor chrome reduced from about `265px` to `235px`, ribbon body reduced from about `108px` to `97px`, and toolbar controls remained clickable.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - MacBook ribbon spacing adjustment

Changed:
- Widened the Documents ribbon Font, Paragraph, and Insert groups at laptop widths so controls use available right-side space.
- Increased the font family/font size row allocation to prevent the group separator from visually overlapping the font size control.
- Kept the adjustment scoped to the Documents editor chrome responsive rules.

Validation:
- Passed: `cd frontend && npm run build`
- Passed: browser visual check at `1470x850` on `http://127.0.0.1:5176/documents`; no page-level horizontal overflow, and the Font group boundary no longer crosses the font size control.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Practical ribbon tool arrangement

Changed:
- Rebalanced the Documents ribbon groups so Font and Paragraph receive priority width while Clipboard and Undo / Redo stay compact.
- Changed Insert tools to a 2x2 grid for Table, Image, Link, and Comment so the group uses vertical space instead of spreading horizontally.
- Added more group padding around separators to keep dividers from crowding controls.

Validation:
- Passed: `cd frontend && npm run build`
- Passed: browser visual check at `1470x850` on `http://127.0.0.1:5176/documents`; ribbon body measured `990px` client width and `990px` scroll width with no horizontal overflow.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - Reduced Documents toolbar chrome

Changed:
- Removed the File/Home/Insert/Layout/Review/View ribbon tab menu from the Documents editor toolbar.
- Removed disabled Link and Comment placeholders from the Insert group, leaving Table and Image only.
- Reduced Documents toolbar body, group, command, and editor chrome heights at desktop and laptop breakpoints.
- Reduced Clipboard and Insert command label sizing at laptop widths.

Validation:
- Passed: `cd frontend && npm run build`
- Passed: `git diff --check`
- Not run: browser visual verification was blocked by the browser URL policy for the local page.

Next:
- Vite still reports the existing large chunk warning during production build.

## 2026-07-10 - New paragraph voice command visibility

Changed:
- Updated the `new paragraph` voice command path to split the current text
  block and insert one tab so the Smart Editor starts the new paragraph on a
  new indented line.
- Added focused coverage for paragraph command behavior.

Validation:
- Passed: `cd frontend && npm test -- --run src/lib/editorFlow.test.ts`
- Passed: `cd frontend && npm test -- --run src/lib/corestt.test.ts src/lib/commandEmbeddings.test.ts src/lib/editorFlow.test.ts src/lib/dictationFlow.test.ts`
- Passed: `cd frontend && npm run build`

Next:
- Vite still reports the existing large chunk warning during production build.

## Current Dictation And Voice Behavior

Changed:
- CoreSTT browser microphone capture, proxy relay, packet validation, and structured payload-safe STT logs exist.
- Domain profile proxy/client/UI exist for `GET`, `PUT`, and `DELETE /api/domain-profiles`.
- Semantic voice command matching uses MiniLM sentence embeddings.
- Boundary command handling supports safe editor commands at the start/end of dictated text.
- Destructive/navigation/action commands remain full-utterance commands.
- Explicit spoken `full stop` punctuation is preserved while automatic trailing full stops are stripped from normal transcript insertions.
- `new paragraph` splits the current text block and inserts one tab indentation.
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
