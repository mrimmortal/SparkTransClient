# Next Line Spark Landing Page Content

Content source for a future website landing page. This file is copy only; it is
not an implementation spec.

## SEO

SEO title:

```text
Next Line Spark | Clinical Dictation And Document Workspace
```

Meta description:

```text
Next Line Spark helps clinical teams dictate, edit, template, manage, and export documents in a focused workspace powered by CoreSTT.
```

Suggested page slug:

```text
/
```

## Hero

Eyebrow:

```text
Clinical dictation workspace
```

Headline:

```text
Turn clinical speech into structured documents faster.
```

Subheadline:

```text
Next Line Spark brings dictation, Smart Editor controls, templates, macros, document management, and PDF export into one focused workspace for clinical teams.
```

Primary CTA:

```text
Try Next Line Spark
```

Secondary CTA:

```text
View workflow
```

Hero support points:

- Dictate into a focused document editor.
- Use voice commands for formatting, navigation, and cleanup.
- Start from templates, expand common phrases, and export finished notes.

## Problem

Section headline:

```text
Clinical documentation should not slow down the work.
```

Body copy:

```text
Clinical teams need notes, reports, summaries, and follow-ups to be accurate, structured, and available quickly. Too often, the work is split across dictation tools, document editors, templates, manual formatting, and export steps.
```

```text
Next Line Spark is built around the documentation workflow itself: speak, edit, structure, review, and export from one practical workspace.
```

Problem cards:

### Too much switching

Clinical documentation often moves between separate dictation, editing, template, and export tools.

### Repeated phrases

Common clinical wording, closing notes, and standard phrases are typed or corrected again and again.

### Unstructured templates

Templates help, but they are harder to use when fields, navigation, and dictation are not connected.

### Limited visibility

Teams need clear status for microphone capture, transcription readiness, document saves, and service health.

## Product Promise

Section headline:

```text
One workspace for clinical dictation and document completion.
```

Body copy:

```text
Next Line Spark combines a Smart Editor, CoreSTT-powered dictation, voice commands, templates, macros, document management, and diagnostics in a single browser-based workspace.
```

Promise bullets:

- Create or open a clinical document.
- Start dictation from the floating recording control.
- Use voice commands to format and navigate without leaving the note.
- Insert templates and move through highlighted fields.
- Expand repeated phrases with macros.
- Review, save, manage, and export the finished document.

## Feature Sections

### Smart Editor

Headline:

```text
Edit while you dictate.
```

Copy:

```text
The Smart Editor is the primary workspace for clinical notes and reports. It supports rich editing actions such as headings, lists, quotes, code blocks, horizontal rules, undo, redo, search and replace, and clear formatting.
```

Highlights:

- Live realtime transcript preview before final text is inserted.
- Final transcript insertion into the active editor target.
- Save status, document metadata, and PDF export in the document workspace.

### Voice Commands

Headline:

```text
Control the editor with spoken commands.
```

Copy:

```text
Next Line Spark recognizes spoken commands for common editing actions, including new lines, new paragraphs, undo, redo, formatting, list controls, template navigation, select all, and safe clear-all handling.
```

Highlights:

- Voice commands can target the Smart Editor even when dictation text is routed elsewhere.
- Common command variants can be enabled in Settings.
- Destructive actions use confirmation prompts when safety settings are enabled.

### Templates

Headline:

```text
Start from repeatable clinical structures.
```

Copy:

```text
Teams can create, search, edit, categorize, upload, preview, and insert templates. Template fields such as patient or visit markers can stay highlighted so they are easier to complete during dictation.
```

Highlights:

- Insert templates into the active document.
- Upload `.docx` templates.
- Navigate highlighted template fields by voice.

### Macros

Headline:

```text
Expand repeated phrases automatically.
```

Copy:

```text
Macros replace short spoken or typed trigger phrases with longer standard text, helping teams reuse common clinical wording and reduce repetitive typing.
```

Highlights:

- Create, edit, enable, disable, and delete macros.
- Expand macros during final transcript routing.
- Turn macro expansion on or off from Settings.

### Domain Profiles

Headline:

```text
Tune dictation context for the work at hand.
```

Copy:

```text
Domain profiles let teams manage transcription hints such as initial prompts, realtime prompts, and hotwords. Profiles can be selected for future CoreSTT sessions to bias transcription toward the right terminology.
```

Highlights:

- List existing domain profiles.
- Create or update profile definitions.
- Delete profiles when they are no longer needed.

### Document Management

Headline:

```text
Keep documents organized and ready to use.
```

Copy:

```text
The document manager supports creating documents, searching, sorting, filtering by category, renaming, categorizing, duplicating, opening, exporting, and deleting documents.
```

Highlights:

- Recent documents in the sidebar.
- Manage documents in a focused modal.
- Export active or managed documents as PDF.

### Settings And Diagnostics

Headline:

```text
Operational controls where teams need them.
```

Copy:

```text
Settings centralize dictation behavior, transcript handling, microphone selection, document defaults, safety prompts, theme presets, and domain profiles. Diagnostics show service health, workspace counts, STT state, microphone status, packet counts, and reconnect attempts.
```

Highlights:

- Choose the default editor target.
- Configure autosave and duplicate transcript protection.
- Check microphone permission and capture status.

### CoreSTT Integration

Headline:

```text
Powered by your CoreSTT transcription service.
```

Copy:

```text
Next Line Spark uses the existing CoreSTT WebSocket service for speech-to-text. The application owns the browser workspace, authenticated documents, templates, macros, settings, exports, and the STT proxy/client integration.
```

Highlights:

- Works as an editing workspace even when CoreSTT is not running.
- Real dictation requires CoreSTT to be available.
- Production deployments should use HTTPS/WSS and the FastAPI STT proxy unless CoreSTT is independently secured.

## Workflow

Section headline:

```text
From spoken note to finished document.
```

### 1. Open or create a document

Start with a blank document, an existing note, or a template-based structure.

### 2. Start dictation

Use the floating dictation control. When CoreSTT is ready and the browser has microphone access, realtime transcript appears in the editor before final text is committed.

### 3. Shape the note with voice commands

Say commands such as `new paragraph`, `start bullet list`, `stop bold`, `delete last sentence`, `save document`, or `next field` to keep the workflow moving.

### 4. Reuse templates and macros

Insert templates, move through highlighted fields, and expand repeated phrases with macros.

### 5. Review, save, and export

Use the Smart Editor and document controls to review the final note, save changes, manage metadata, and export a PDF when needed.

## Use Cases

### Clinical notes

Draft visit notes and structured clinical documentation with dictation, templates, and editor commands.

### Meeting minutes

Capture operational or clinical meeting notes, reuse templates, and export clean summaries.

### Reports

Build longer reports with headings, lists, reusable phrases, and PDF export.

### Structured template completion

Insert templates with highlighted fields, then move through fields by voice while dictating values.

## Trust And Deployment

Section headline:

```text
Built for controlled clinical workflows.
```

Copy:

```text
Next Line Spark is designed for teams that want a practical dictation workspace with clear deployment boundaries. The app includes authenticated access, document ownership checks, local development and deployment scripts, and a FastAPI proxy for CoreSTT traffic.
```

Trust points:

- Authenticated workspace with HTTP-only session cookies.
- Documents, templates, macros, settings, and shortcuts are stored in the app.
- SQLite persistence is available for local and Docker deployments.
- Docker and direct terminal startup paths are documented.
- Production deployments should set a real secret key, use HTTPS/WSS, keep secrets in environment variables, and avoid using the sample account.

Compliance note:

```text
Next Line Spark does not currently claim HIPAA, SOC 2, or other formal compliance certification. Teams should review deployment, security, retention, and operational requirements before production clinical use.
```

## FAQ

### Does Next Line Spark include speech-to-text?

Next Line Spark connects to an existing CoreSTT WebSocket service for speech-to-text. CoreSTT remains a separate transcription service.

### Can I use the app without CoreSTT?

Yes. The workspace can be used for editing, templates, macros, settings, document management, and export. Real dictation requires CoreSTT to be running and reachable.

### Does browser microphone capture work in production?

Browser microphone capture requires localhost during development or HTTPS/WSS in production. Production deployments should serve the app securely.

### Can teams create their own templates?

Yes. Templates can be created, edited, categorized, searched, uploaded from `.docx`, previewed, inserted into documents, and used with highlighted fields.

### What are macros used for?

Macros expand short trigger phrases into longer replacement text, which is useful for repeated clinical wording, standard closing notes, and routine phrasing.

### What are domain profiles?

Domain profiles manage transcription hints such as prompts and hotwords. They help bias future CoreSTT sessions toward the terminology needed for a given workflow.

### Can documents be exported?

Yes. Documents can be exported as PDF from the document workspace or document manager.

### Is this ready for production clinical deployment?

The app includes deployment scripts and production-oriented building blocks, but production teams should still complete their own hardening review. Current known follow-ups include rate limiting, migration workflow, reverse proxy examples, backup/restore scripts, CI, and a real CoreSTT microphone smoke test.

## Final CTA

Headline:

```text
Bring dictation, editing, templates, and document management into one clinical workspace.
```

Body:

```text
Next Line Spark helps clinical teams move from spoken information to structured documents with fewer context switches and clearer workflow controls.
```

Primary CTA:

```text
Try Next Line Spark
```

Secondary CTA:

```text
Review deployment notes
```
