# Manage Documents Settings Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Manage documents modal so it uses the same visual hierarchy, spacing, card treatment, and responsive behavior as the Settings page while preserving existing document behavior.

**Architecture:** Keep `DocumentManagementModal` as the existing modal-based CRUD surface. Add small semantic wrappers and section headings in the component, then scope all visual changes to existing `.document-modal-*` CSS classes in `frontend/src/styles/app.css`. No API, routing, persistence, or document workflow changes are included.

**Tech Stack:** React, TypeScript, Vite, Vitest, CSS custom properties in `frontend/src/styles/app.css`, lucide-react icons already used by the app.

---

## File Structure

- Modify `frontend/src/features/documents/DocumentManagementModal.tsx`
  - Add Settings-like section wrappers/titles for create, filters, and document library.
  - Keep existing state, callbacks, CRUD calls, and modal open/close behavior unchanged.
  - Keep existing inputs and actions, only adjust markup needed for styling.

- Modify `frontend/src/styles/app.css`
  - Restyle `.document-modal`, `.document-create-panel`, `.document-modal-filters`, `.document-modal-list`, `.document-modal-row`, and related document manager classes.
  - Reuse Settings page tokens and style patterns: `--neo-surface-soft`, 8px radius, semantic typography tokens, consistent 40px inputs, low-weight shadows, and responsive stacking.

- Optionally modify `docs/SESSION_LOG.md`
  - Add a compact entry after implementation and validation because this is a meaningful UI consistency change.

---

### Task 1: Add Settings-Like Section Structure

**Files:**
- Modify: `frontend/src/features/documents/DocumentManagementModal.tsx`

- [ ] **Step 1: Update the modal header copy structure**

In `DocumentManagementModal`, keep the existing `modal-header` but change the count line to clearer Settings-style helper copy:

```tsx
<header className="modal-header document-modal-header">
  <div>
    <h2 id="document-management-title">Manage documents</h2>
    <span>{context.documents.length} documents in your workspace</span>
  </div>
  <button type="button" className="icon-button" aria-label="Close document manager" onClick={onClose}>
    <X size={16} />
  </button>
</header>
```

- [ ] **Step 2: Add a body wrapper around the modal sections**

Wrap the create panel, filters, datalist, and document list in a new body container so the modal has one scrollable Settings-like content area:

```tsx
<div className="document-modal-body">
  {/* create panel */}
  {/* filters */}
  {/* datalist */}
  {/* list section */}
</div>
```

- [ ] **Step 3: Give the create panel a Settings-style title and body**

Replace the current flat create panel markup with this structure. Keep the existing state and `createDocument` call unchanged:

```tsx
<section className="document-create-panel">
  <div className="document-section-heading">
    <h3>Create document</h3>
    <span>Start blank or from an existing template.</span>
  </div>
  <div className="document-create-grid">
    <label>
      Title
      <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Untitled document" />
    </label>
    <label>
      Category
      <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Category" list="document-category-options" />
    </label>
    <label>
      Template
      <select value={newTemplateId} onChange={(event) => setNewTemplateId(event.target.value)}>
        <option value="">Blank document</option>
        {context.templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </label>
    <button type="button" className="primary document-create-button" onClick={() => void createDocument()} disabled={Boolean(context.busy)}>
      <FilePlus2 size={16} /> Create
    </button>
  </div>
</section>
```

- [ ] **Step 4: Give filters their own Settings-style section**

Replace the current flat filter section with this structure:

```tsx
<section className="document-modal-filters">
  <div className="document-section-heading">
    <h3>Find documents</h3>
    <span>Filter the library without changing document content.</span>
  </div>
  <div className="document-filter-grid">
    <label>
      Search
      <div className="input-with-icon">
        <Search size={16} />
        <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Title or category" />
      </div>
    </label>
    <label>
      Category
      <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
        <option value={ALL_DOCUMENT_CATEGORIES}>All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </label>
    <label>
      Sort
      <select value={sortMode} onChange={(event) => setSortMode(event.target.value as DocumentSortMode)}>
        <option value="updated-desc">Recently updated</option>
        <option value="created-desc">Recently created</option>
        <option value="title-asc">Title A-Z</option>
      </select>
    </label>
  </div>
</section>
```

- [ ] **Step 5: Wrap the document list in a library section**

Add a Settings-style section around the list:

```tsx
<section className="document-library-panel">
  <div className="document-section-heading">
    <h3>Document library</h3>
    <span>{visibleDocuments.length} shown</span>
  </div>
  <div className="document-modal-list">
    {/* existing empty/list rendering */}
  </div>
</section>
```

- [ ] **Step 6: Run TypeScript/build validation for markup**

Run:

```bash
cd frontend && npm run build
```

Expected: build succeeds. The existing Vite large chunk warning may still appear.

---

### Task 2: Restyle Modal Sections To Match Settings

**Files:**
- Modify: `frontend/src/styles/app.css`

- [ ] **Step 1: Update modal container and body**

Replace the current `.document-modal` grid row setup and add `.document-modal-body`:

```css
.document-modal {
  width: min(1120px, 100%);
  max-height: min(820px, calc(100vh - 48px));
  background: var(--neo-surface);
  border: 1px solid var(--neo-border-strong);
  border-radius: 8px;
  box-shadow: 14px 14px 34px var(--neo-shadow-dark), -10px -10px 24px var(--neo-shadow-light);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}

.document-modal-body {
  display: grid;
  gap: 14px;
  overflow: auto;
  padding: 18px;
}
```

- [ ] **Step 2: Align modal header with page hierarchy**

Add or update:

```css
.document-modal-header {
  background: var(--neo-surface);
}
```

- [ ] **Step 3: Convert document panels to Settings-style cards**

Replace the shared `.document-create-panel, .document-modal-filters` block with:

```css
.document-create-panel,
.document-modal-filters,
.document-library-panel {
  border: 1px solid color-mix(in srgb, var(--neo-border), var(--neo-text) 4%);
  background: var(--neo-surface-soft);
  border-radius: 8px;
  box-shadow: 3px 3px 9px color-mix(in srgb, var(--neo-shadow-dark), transparent 20%), -3px -3px 9px var(--neo-shadow-light);
  display: grid;
  gap: 14px;
  padding: 18px;
}
```

- [ ] **Step 4: Add section heading styling**

Add:

```css
.document-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.document-section-heading h3 {
  font-size: var(--app-text-section);
  line-height: var(--app-leading-tight);
  margin: 0;
}

.document-section-heading span {
  color: var(--neo-muted);
  font-size: var(--app-text-md);
}
```

- [ ] **Step 5: Move grid behavior into inner grids**

Replace existing `.document-create-panel` and `.document-modal-filters` grid-template rules with:

```css
.document-create-grid {
  align-items: end;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(160px, 1.2fr) minmax(140px, 1fr) minmax(160px, 1fr) auto;
}

.document-filter-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 220px) minmax(160px, 220px);
}
```

- [ ] **Step 6: Normalize form control sizing inside the document manager**

Add:

```css
.document-modal input,
.document-modal select {
  background: var(--neo-surface-raised);
  border-color: var(--neo-border-strong);
  min-height: 40px;
  width: 100%;
}
```

- [ ] **Step 7: Lighten the list area**

Replace `.document-modal-list` padding with:

```css
.document-modal-list {
  display: grid;
  align-content: start;
  gap: 10px;
  overflow: visible;
  padding: 0;
}
```

- [ ] **Step 8: Keep document rows compact and Settings-consistent**

Update `.document-modal-row` to:

```css
.document-modal-row {
  border: 1px solid color-mix(in srgb, var(--neo-border), transparent 18%);
  border-radius: 8px;
  background: var(--neo-surface);
  box-shadow: var(--neo-inset-shadow-small);
  display: grid;
  gap: 10px 14px;
  grid-template-columns: minmax(260px, 1fr) auto;
  padding: 12px;
}
```

Keep `.document-modal-row.active` behavior but make sure it remains readable:

```css
.document-modal-row.active {
  border-color: color-mix(in srgb, var(--neo-accent), var(--neo-border) 35%);
  background: var(--neo-accent-soft);
  box-shadow: var(--neo-inset-shadow-small);
}
```

- [ ] **Step 9: Run CSS sanity check**

Run:

```bash
cd frontend && npm test -- typographyTokens
```

Expected: typography token tests still pass. If this fails due to new raw font sizes, replace raw sizes with the app typography tokens.

---

### Task 3: Responsive Cleanup

**Files:**
- Modify: `frontend/src/styles/app.css`

- [ ] **Step 1: Update tablet breakpoint rules**

In the existing `@media (max-width: 900px)` block, replace document manager responsive selectors with:

```css
.document-create-grid,
.document-filter-grid,
.document-modal-row,
.document-row-fields {
  grid-template-columns: 1fr;
}

.document-section-heading {
  align-items: flex-start;
  flex-direction: column;
}
```

Keep the existing `.document-row-actions` mobile placement:

```css
.document-row-actions {
  grid-row: auto;
  grid-column: auto;
  justify-content: flex-start;
}
```

- [ ] **Step 2: Update mobile breakpoint padding**

In the existing `@media (max-width: 560px)` block, replace the document modal padding rules with:

```css
.document-modal-body {
  gap: 10px;
  padding: 10px;
}

.document-create-panel,
.document-modal-filters,
.document-library-panel {
  padding: 12px;
}
```

- [ ] **Step 3: Run build validation**

Run:

```bash
cd frontend && npm run build
```

Expected: build succeeds. The existing Vite large chunk warning may still appear.

---

### Task 4: Final Validation And Session Log

**Files:**
- Modify: `docs/SESSION_LOG.md`

- [ ] **Step 1: Run full frontend tests**

Run:

```bash
cd frontend && npm test
```

Expected: all frontend tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
cd frontend && npm run build
```

Expected: build succeeds. The existing Vite large chunk warning may still appear.

- [ ] **Step 3: Run whitespace diff check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 4: Update session log**

Append this compact entry to `docs/SESSION_LOG.md`:

```markdown
## 2026-07-09 - Manage documents Settings-style polish

Changed:
- Restyled the Manage documents modal with Settings-style section cards, spacing, and hierarchy.
- Kept document create, filter, edit, duplicate, export, delete, and open behavior unchanged.
- Improved responsive stacking for the document manager controls and rows.

Validation:
- `cd frontend && npm test -- typographyTokens`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `git diff --check`

Next:
- Browser visual verification remains To verify unless a local dev server is available.
- Vite still reports the existing large chunk warning during production build.
```

---

## Self-Review

- Spec coverage: The plan keeps the modal, preserves all document APIs and callbacks, applies Settings-like section cards and spacing, and includes responsive cleanup.
- Placeholder scan: No implementation steps contain unresolved placeholders.
- Type consistency: Existing `WorkspaceContext`, `DocumentRecord`, `DocumentSortMode`, and callback signatures are unchanged.
- Repo constraint check: No git commit steps are included because project instructions say the user handles git manually.
