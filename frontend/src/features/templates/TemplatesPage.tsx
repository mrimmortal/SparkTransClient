import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Plus, Save, Search, Tag, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { TemplateRecord, api } from "../../lib/api";
import {
  canSaveTemplateDraft,
  getTemplateSelectionForListChange,
  getTemplatePlaceholders,
  highlightTemplatePlaceholders,
  normalizeTemplateDraft,
  removeTemplateById,
  upsertTemplate,
} from "../../lib/templateFlow";
import { confirmationMessages } from "../../lib/editorFlow";
import { WorkspaceContext } from "../workspace/types";
import { withWarning } from "../workspace/withWarning";

export function TemplatesPage({ context }: { context: WorkspaceContext }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<TemplateRecord | null>(context.templates[0] ?? null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const previousTemplatesRef = useRef(context.templates);
  const templateDraft = { name, category, content_html: content };
  const categories = useMemo(
    () => Array.from(new Set(context.templates.map((template) => template.category).filter((value): value is string => Boolean(value)))).sort(),
    [context.templates],
  );
  const visibleTemplates = useMemo(
    () => context.templates.filter((template) => !categoryFilter || template.category === categoryFilter),
    [context.templates, categoryFilter],
  );
  const selectedPlaceholders = selected ? getTemplatePlaceholders(selected.content_html) : [];
  const previewHtml = selected ? highlightTemplatePlaceholders(selected.content_html) : "";

  useEffect(() => {
    setSelected((current) => getTemplateSelectionForListChange(context.templates, current, previousTemplatesRef.current));
    previousTemplatesRef.current = context.templates;
  }, [context.templates]);

  async function searchTemplates() {
    await withWarning(context, async () => {
      context.setTemplates(query.trim() ? await api.searchTemplates(query.trim()) : await api.templates());
    });
  }

  async function createTemplate(event: FormEvent) {
    event.preventDefault();
    if (!canSaveTemplateDraft(templateDraft)) return;
    setCreating(true);
    await withWarning(context, async () => {
      const template = await api.createTemplate(normalizeTemplateDraft(templateDraft));
      context.setTemplates((current) => upsertTemplate(current, template));
      setSelected(template);
      setName("");
      setCategory("");
      setContent("");
    });
    setCreating(false);
  }

  async function saveTemplate() {
    if (!selected) return;
    const draft = normalizeTemplateDraft(selected);
    if (!canSaveTemplateDraft(draft)) {
      context.setWarning("Template name is required.");
      return;
    }
    setSaving(true);
    await withWarning(context, async () => {
      const updated = await api.updateTemplate(selected.id, draft);
      context.setTemplates((current) => upsertTemplate(current, updated));
      setSelected(updated);
    });
    setSaving(false);
  }

  async function deleteTemplate() {
    if (!selected) return;
    if (context.settings.confirm_destructive_actions && !window.confirm(confirmationMessages.deleteTemplate)) return;
    setSaving(true);
    await withWarning(context, async () => {
      await api.deleteTemplate(selected.id);
      context.setTemplates((current) => removeTemplateById(current, selected.id));
      setSelected(null);
    });
    setSaving(false);
  }

  async function uploadTemplate(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await withWarning(context, async () => {
      const template = await api.uploadTemplate(file);
      context.setTemplates((current) => upsertTemplate(current, template));
      setSelected(template);
    });
    event.target.value = "";
    setUploading(false);
  }

  async function startInsertTemplate() {
    if (!selected) return;
    await context.insertTemplate(selected);
    navigate("/documents");
  }

  return (
    <section className="manager-page">
      <PageHeader title="Templates" />
      <div className="manager-grid two template-manager-grid">
        <section className="panel">
          <div className="inline-form">
            <input placeholder="Search templates" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button onClick={() => void searchTemplates()}><Search size={16} /> Search</button>
          </div>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <label className="file-button">
            <Upload size={16} /> {uploading ? "Uploading" : "Upload .docx"}
            <input type="file" accept=".docx" onChange={(event) => void uploadTemplate(event)} disabled={uploading} />
          </label>
          <details className="template-create">
            <summary><Plus size={16} /> New template</summary>
            <form onSubmit={(event) => void createTemplate(event)} className="stack">
              <input placeholder="Template name" value={name} onChange={(event) => setName(event.target.value)} />
              <input placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
              <textarea placeholder="Template HTML" value={content} onChange={(event) => setContent(event.target.value)} />
              <button className="primary" type="submit" disabled={creating || !canSaveTemplateDraft(templateDraft)}>
                <Plus size={16} /> {creating ? "Creating" : "Create template"}
              </button>
            </form>
          </details>
          <div className="list">
            {visibleTemplates.map((template) => (
              <button key={template.id} className={template.id === selected?.id ? "doc active" : "doc"} onClick={() => setSelected(template)}>
                {template.name}
                {template.category ? <span className="template-category"><Tag size={12} /> {template.category}</span> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="panel wide">
          {selected ? (
            <div className="stack template-editor">
              <div className="template-edit-fields">
                <input value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
                <input value={selected.category ?? ""} placeholder="Category" onChange={(event) => setSelected({ ...selected, category: event.target.value })} />
              </div>
              <textarea className="template-html-input" value={selected.content_html} onChange={(event) => setSelected({ ...selected, content_html: event.target.value })} />
              {selectedPlaceholders.length ? (
                <section className="placeholder-summary">
                  <h2>Markdown fields</h2>
                  <div className="placeholder-chip-row">
                    {selectedPlaceholders.map((placeholder) => (
                      <span key={placeholder} className="template-placeholder-token">{`{{${placeholder}}}`}</span>
                    ))}
                  </div>
                </section>
              ) : null}
              <div className="button-row">
                <button onClick={() => void saveTemplate()} disabled={saving || !canSaveTemplateDraft(selected)}><Save size={16} /> {saving ? "Saving" : "Save"}</button>
                <button onClick={() => void startInsertTemplate()} disabled={Boolean(context.busy)}>
                  <FileText size={16} /> Insert in document
                </button>
                <button onClick={() => void deleteTemplate()} disabled={saving}><Trash2 size={16} /> Delete</button>
              </div>
              <div className="preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          ) : (
            <EmptyState title="No template selected" text="Select a template or create a new one." />
          )}
        </section>
      </div>
    </section>
  );
}
