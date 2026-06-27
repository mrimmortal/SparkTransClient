import { useMemo, useState } from "react";
import { Copy, Download, ExternalLink, FilePlus2, Save, Search, Trash2, X } from "lucide-react";
import { DocumentRecord } from "../../lib/api";
import { WorkspaceContext } from "../workspace/types";
import {
  ALL_DOCUMENT_CATEGORIES,
  DocumentSortMode,
  documentMatchesFilters,
  formatDocumentDate,
  getDocumentCategories,
  sortDocuments,
} from "./documentManagement";

type DocumentManagementModalProps = {
  context: WorkspaceContext;
  onClose: () => void;
};

export function DocumentManagementModal({ context, onClose }: DocumentManagementModalProps) {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_DOCUMENT_CATEGORIES);
  const [sortMode, setSortMode] = useState<DocumentSortMode>("updated-desc");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("");
  const categories = useMemo(() => getDocumentCategories(context.documents), [context.documents]);
  const visibleDocuments = useMemo(
    () => sortDocuments(context.documents.filter((document) => documentMatchesFilters(document, searchText, categoryFilter)), sortMode),
    [context.documents, searchText, categoryFilter, sortMode],
  );

  async function createDocument() {
    await context.createManagedDocument({
      title: newTitle || "Untitled document",
      category: newCategory,
      templateId: newTemplateId ? Number(newTemplateId) : null,
    });
    setNewTitle("");
    setNewCategory("");
    setNewTemplateId("");
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="document-modal" role="dialog" aria-modal="true" aria-labelledby="document-management-title">
        <header className="modal-header">
          <div>
            <h2 id="document-management-title">Manage documents</h2>
            <span>{context.documents.length} documents</span>
          </div>
          <button type="button" className="icon-button" aria-label="Close document manager" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <section className="document-create-panel">
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
        </section>

        <section className="document-modal-filters">
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
        </section>

        <datalist id="document-category-options">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <div className="document-modal-list">
          {context.documents.length === 0 ? (
            <DocumentEmptyState title="No documents yet" detail="Create a blank document or start from a template." />
          ) : visibleDocuments.length === 0 ? (
            <DocumentEmptyState title="No matching documents" detail="Change the search or category filter." />
          ) : (
            visibleDocuments.map((document) => (
              <DocumentManagementRow
                key={document.id}
                document={document}
                active={document.id === context.activeDocument?.id}
                busy={Boolean(context.busy)}
                onOpen={() => {
                  context.setActiveDocument(document);
                  onClose();
                }}
                onSave={(payload) => context.updateDocumentMetadata(document.id, payload)}
                onDuplicate={() => context.duplicateDocument(document.id)}
                onExport={() => context.exportDocumentById(document.id)}
                onDelete={() => context.deleteDocumentById(document.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function DocumentManagementRow({
  document,
  active,
  busy,
  onOpen,
  onSave,
  onDuplicate,
  onExport,
  onDelete,
}: {
  document: DocumentRecord;
  active: boolean;
  busy: boolean;
  onOpen: () => void;
  onSave: (payload: { title: string; category: string | null }) => Promise<void>;
  onDuplicate: () => Promise<void>;
  onExport: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState(document.title);
  const [category, setCategory] = useState(document.category ?? "");
  const normalizedTitle = title.trim() || "Untitled document";
  const normalizedCategory = category.trim();
  const changed = normalizedTitle !== document.title || normalizedCategory !== (document.category ?? "");

  async function saveMetadata() {
    await onSave({ title: normalizedTitle, category: normalizedCategory });
    setTitle(normalizedTitle);
    setCategory(normalizedCategory);
  }

  return (
    <article className={active ? "document-modal-row active" : "document-modal-row"}>
      <div className="document-row-fields">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Category
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="No category" list="document-category-options" />
        </label>
      </div>
      <div className="document-row-meta">
        <span>{document.category || "No category"}</span>
        <span>Updated {formatDocumentDate(document.updated_at)}</span>
        <span>Created {formatDocumentDate(document.created_at)}</span>
      </div>
      <div className="document-row-actions">
        <button type="button" onClick={onOpen}>
          <ExternalLink size={16} /> Open
        </button>
        <button type="button" onClick={() => void saveMetadata()} disabled={!changed || busy}>
          <Save size={16} /> Save
        </button>
        <button type="button" onClick={() => void onDuplicate()} disabled={busy}>
          <Copy size={16} /> Duplicate
        </button>
        <button type="button" onClick={() => void onExport()} disabled={busy}>
          <Download size={16} /> Export
        </button>
        <button type="button" onClick={() => void onDelete()} disabled={busy}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </article>
  );
}

function DocumentEmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="document-modal-empty">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
