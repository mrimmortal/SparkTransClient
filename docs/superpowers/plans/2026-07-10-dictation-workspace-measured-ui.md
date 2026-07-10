# Dictation Workspace Measured UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tune the Documents workspace UI to match `docs/ui-reference/dictation-workspace-measurements.png` and `docs/ui-reference/dictation-workspace-ui-measurements.md`.

**Architecture:** Keep the existing React component structure and TipTap behavior. Implement the measured shell, chrome, canvas, rail, and footer proportions with scoped CSS changes in `frontend/src/styles/app.css`, only touching TSX if an existing class hook is missing.

**Tech Stack:** React 19, Vite, TypeScript, TipTap, lucide-react, CSS grid/flex/container queries.

---

### Task 1: Desktop Shell Proportions

**Files:**
- Modify: `frontend/src/styles/app.css`

- [ ] Set desktop tokens so the app shell matches the reference: `--app-sidebar-width: 273px`, `--document-right-rail-width: 220px`, `--document-shell-gutter: 12px`, and reference document paper tokens.
- [ ] Update `.workspace-documents` and `.documents-page` so the Documents route uses the measured light blue-gray background and `12px` main gutter.
- [ ] Keep non-Documents routes on the existing general shell behavior.

### Task 2: Documents Workspace Grid

**Files:**
- Modify: `frontend/src/styles/app.css`

- [ ] Update `.document-workspace-grid` to use `grid-template-columns: minmax(0, 1fr) var(--document-right-rail-width)` with `12px` gap on desktop.
- [ ] Keep `.editor-focus-mode .document-workspace-grid` as a single-column layout.
- [ ] Preserve the existing responsive breakpoint that stacks the right rail on narrower viewports.

### Task 3: Editor Chrome And Ribbon

**Files:**
- Modify: `frontend/src/styles/app.css`

- [ ] Tune `.document-editor-chrome` to a `12px` radius, subtle border, white background, and fixed desktop height target near `283px`.
- [ ] Tune `.workspace-documents .document-chrome-header` to the measured header band.
- [ ] Tune `.workspace-documents .document-editor-chrome .office-ribbon-tabs` and `.office-ribbon-body` so the tab line and ribbon groups align with the reference and remain horizontally scrollable when constrained.
- [ ] Preserve all existing button handlers and disabled visual placeholder controls.

### Task 4: Editor Canvas, Paper, Footer, And Right Rail

**Files:**
- Modify: `frontend/src/styles/app.css`

- [ ] Update `.editor-shell` to use a `24px` grid background, `30px` top canvas padding, and centered document paper.
- [ ] Update `.smart-editor` to target `846px` wide paper proportions, `99px` left/right text margins at the reference size, and the specified paper shadow.
- [ ] Update `.document-footer-dock` to target `73px` height and align to the main gutter.
- [ ] Tune `.document-right-rail` and `.right-rail-card` to match the `220px` rail and `194px` inner card target.

### Task 5: Validation

**Files:**
- Modify: `docs/SESSION_LOG.md`

- [ ] Run `cd frontend && npm run build`.
- [ ] Start or reuse the Vite dev server and visually inspect `/documents` at a desktop viewport close to the reference.
- [ ] Run `git diff --check`.
- [ ] Add a compact `docs/SESSION_LOG.md` entry with the changed UI areas and validation results.
