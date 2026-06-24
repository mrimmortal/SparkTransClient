import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { FileText, Plus, Save, Search, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { TemplateRecord, api } from "../../lib/api";
import {
  canSaveTemplateDraft,
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
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<TemplateRecord | null>(context.templates[0] ?? null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const templateDraft = { name, content_html: content };

  useEffect(() => {
    const currentSelected = selected ? context.templates.find((template) => template.id === selected.id) : null;
    if (currentSelected) {
      if (currentSelected !== selected) setSelected(currentSelected);
      return;
    }
    setSelected(context.templates[0] ?? null);
  }, [context.templates, selected]);

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

  return (
    <section className="manager-page">
      <PageHeader title="Templates" />
      <div className="manager-grid">
        <section className="panel">
          <div className="inline-form">
            <input placeholder="Search templates" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button onClick={() => void searchTemplates()}><Search size={16} /> Search</button>
          </div>
          <label className="file-button">
            <Upload size={16} /> {uploading ? "Uploading" : "Upload .docx"}
            <input type="file" accept=".docx" onChange={(event) => void uploadTemplate(event)} disabled={uploading} />
          </label>
          <div className="list">
            {context.templates.map((template) => (
              <button key={template.id} className={template.id === selected?.id ? "doc active" : "doc"} onClick={() => setSelected(template)}>
                {template.name}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <form onSubmit={(event) => void createTemplate(event)} className="stack">
            <h2>New template</h2>
            <input placeholder="Template name" value={name} onChange={(event) => setName(event.target.value)} />
            <textarea placeholder="Template HTML" value={content} onChange={(event) => setContent(event.target.value)} />
            <button className="primary" type="submit" disabled={creating || !canSaveTemplateDraft(templateDraft)}>
              <Plus size={16} /> {creating ? "Creating" : "Create template"}
            </button>
          </form>
        </section>

        <section className="panel wide">
          {selected ? (
            <div className="stack">
              <input value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
              <textarea value={selected.content_html} onChange={(event) => setSelected({ ...selected, content_html: event.target.value })} />
              <div className="button-row">
                <button onClick={() => void saveTemplate()} disabled={saving || !canSaveTemplateDraft(selected)}><Save size={16} /> {saving ? "Saving" : "Save"}</button>
                <button
                  onClick={async () => {
                    await context.insertTemplate(selected);
                    navigate("/documents");
                  }}
                  disabled={Boolean(context.busy)}
                >
                  <FileText size={16} /> Insert in document
                </button>
                <button onClick={() => void deleteTemplate()} disabled={saving}><Trash2 size={16} /> Delete</button>
              </div>
              <div className="preview" dangerouslySetInnerHTML={{ __html: selected.content_html }} />
            </div>
          ) : (
            <EmptyState title="No template selected" text="Select a template or create a new one." />
          )}
        </section>
      </div>
    </section>
  );
}
