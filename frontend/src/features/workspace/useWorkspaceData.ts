import { Editor } from "@tiptap/react";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { api, DocumentRecord, MacroRecord, ShortcutBindingRecord, TemplateRecord, UserRecord, UserSettingsRecord } from "../../lib/api";
import { confirmationMessages } from "../../lib/editorFlow";
import { moveToFirstTemplateMarker, moveToFirstTemplateMarkerAtOrAfter } from "../../lib/templateMarkerNavigation";
import { getTemplateDocumentTitle, highlightTemplatePlaceholders } from "../../lib/templateFlow";
import { buildCopyTitle } from "../documents/documentManagement";
import { defaultSettings } from "./defaultSettings";

export function useWorkspaceData({ user }: { user: UserRecord | null }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [macros, setMacros] = useState<MacroRecord[]>([]);
  const [settings, setSettings] = useState<UserSettingsRecord>(defaultSettings);
  const [shortcuts, setShortcuts] = useState<ShortcutBindingRecord[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState("");
  const [microOpen, setMicroOpen] = useState(false);
  const [microText, setMicroText] = useState("");
  const editorRef = useRef<Editor | null>(null);
  const pendingTemplateMarkerFocusRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    void refreshWorkspace();
  }, [user]);

  useEffect(() => {
    if (!settings.template_marker_navigation_enabled || !activeDocument || !pendingTemplateMarkerFocusRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;
    pendingTemplateMarkerFocusRef.current = false;
    window.requestAnimationFrame(() => {
      moveToFirstTemplateMarker(editor);
    });
  }, [activeDocument?.id, settings.template_marker_navigation_enabled]);

  function setWorkspaceMacros(action: SetStateAction<MacroRecord[]>) {
    setMacros((current) => (typeof action === "function" ? action(current) : action));
  }

  function setWorkspaceTemplates(action: SetStateAction<TemplateRecord[]>) {
    setTemplates((current) => (typeof action === "function" ? action(current) : action));
  }

  function setEditor(editor: Editor | null) {
    editorRef.current = editor;
  }

  async function runTask(label: string, task: () => Promise<void>) {
    setWarning("");
    setBusy(label);
    try {
      await task();
    } catch (error) {
      setWarning(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setBusy("");
    }
  }

  async function refreshWorkspace() {
    await runTask("Refreshing workspace", async () => {
      const [nextDocuments, nextTemplates, nextMacros, nextSettings, nextShortcuts] = await Promise.all([
        api.documents(),
        api.templates(),
        api.macros(),
        api.settings(),
        api.shortcuts(),
      ]);
      setDocuments(nextDocuments);
      setWorkspaceTemplates(nextTemplates);
      setWorkspaceMacros(nextMacros);
      setSettings(nextSettings);
      setShortcuts(nextShortcuts);
      setActiveDocument((current) => {
        if (current && nextDocuments.some((document) => document.id === current.id)) return current;
        return nextDocuments[0] ?? null;
      });
    });
  }

  async function updateSetting<Field extends keyof UserSettingsRecord>(field: Field, value: UserSettingsRecord[Field]) {
    await runTask("Updating setting", async () => {
      const updated = await api.updateSettings({ [field]: value } as Partial<UserSettingsRecord>);
      setSettings(updated);
    });
  }

  async function logoutWorkspace() {
    await runTask("Signing out", async () => {
      await api.logout();
      setDocuments([]);
      setWorkspaceTemplates([]);
      setWorkspaceMacros([]);
      setShortcuts([]);
      setActiveDocument(null);
      setSettings(defaultSettings);
    });
  }

  async function newDocument() {
    await runTask("Creating document", async () => {
      const template = templates.find((item) => item.id === settings.default_template_id) ?? null;
      const document = template
        ? await api.createDocument(getTemplateDocumentTitle(template), highlightTemplatePlaceholders(template.content_html || ""))
        : await api.createDocument("Untitled document");
      pendingTemplateMarkerFocusRef.current = Boolean(template && settings.template_marker_navigation_enabled);
      setDocuments((current) => [document, ...current]);
      setActiveDocument(document);
    });
  }

  async function createManagedDocument(payload: { title: string; category: string | null; templateId: number | null }) {
    await runTask("Creating document", async () => {
      const title = payload.title.trim() || "Untitled document";
      const category = normalizeCategory(payload.category);
      const template = templates.find((item) => item.id === payload.templateId) ?? null;
      const contentHtml = template ? highlightTemplatePlaceholders(template.content_html || "") : "";
      const document = await api.createDocument(title, contentHtml, category);
      pendingTemplateMarkerFocusRef.current = Boolean(template && settings.template_marker_navigation_enabled);
      setDocuments((current) => [document, ...current]);
      setActiveDocument(document);
    });
  }

  async function saveDocument() {
    const editor = editorRef.current;
    if (!activeDocument || !editor) return;
    await runTask("Saving document", async () => {
      const updated = await api.updateDocument(activeDocument.id, {
        title: activeDocument.title || "Untitled document",
        content_json: JSON.stringify(editor.getJSON()),
        content_html: editor.getHTML(),
      });
      setActiveDocument(updated);
      setDocuments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    });
  }

  async function deleteDocument() {
    if (!activeDocument) return;
    await deleteDocumentById(activeDocument.id);
  }

  async function deleteDocumentById(documentId: number) {
    if (settings.confirm_destructive_actions && !window.confirm(confirmationMessages.deleteDocument)) return;
    await runTask("Deleting document", async () => {
      await api.deleteDocument(documentId);
      setDocuments((current) => {
        const nextDocuments = current.filter((item) => item.id !== documentId);
        if (activeDocument?.id === documentId) {
          setActiveDocument(nextDocuments[0] ?? null);
        }
        return nextDocuments;
      });
    });
  }

  async function exportDocument() {
    if (!activeDocument) return;
    await exportDocumentById(activeDocument.id);
  }

  async function exportDocumentById(documentId: number) {
    const selectedDocument = documents.find((item) => item.id === documentId) ?? activeDocument;
    if (!selectedDocument || selectedDocument.id !== documentId) return;
    await runTask("Exporting PDF", async () => {
      const blob = await api.exportDocumentPdf(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedDocument.title || "document"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  async function updateDocumentMetadata(documentId: number, payload: { title: string; category: string | null }) {
    await runTask("Updating document", async () => {
      const updated = await api.updateDocument(documentId, {
        title: payload.title.trim() || "Untitled document",
        category: normalizeCategory(payload.category),
      });
      setDocuments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setActiveDocument((current) => (current?.id === updated.id ? updated : current));
    });
  }

  async function duplicateDocument(documentId: number) {
    const source = documents.find((item) => item.id === documentId);
    if (!source) return;
    await runTask("Duplicating document", async () => {
      const duplicate = await api.createDocument(buildCopyTitle(source.title), source.content_html, source.category, source.content_json);
      setDocuments((current) => [duplicate, ...current]);
      setActiveDocument(duplicate);
    });
  }

  async function insertTemplate(template: TemplateRecord) {
    const editor = editorRef.current;
    if (!activeDocument || !editor) {
      await runTask("Creating document from template", async () => {
        const document = await api.createDocument(getTemplateDocumentTitle(template), highlightTemplatePlaceholders(template.content_html || ""));
        pendingTemplateMarkerFocusRef.current = settings.template_marker_navigation_enabled;
        setDocuments((current) => [document, ...current]);
        setActiveDocument(document);
      });
      return;
    }
    const insertionStart = editor.state.selection.from;
    editor.chain().focus().insertContent(highlightTemplatePlaceholders(template.content_html || "")).run();
    if (settings.template_marker_navigation_enabled) {
      moveToFirstTemplateMarkerAtOrAfter(editor, insertionStart);
    }
  }

  return {
    documents,
    templates,
    macros,
    settings,
    shortcuts,
    activeDocument,
    warning,
    busy,
    microOpen,
    microText,
    setEditor,
    refreshWorkspace,
    setWarning,
    setActiveDocument,
    setTemplates: setWorkspaceTemplates,
    setMacros: setWorkspaceMacros,
    setSettings,
    updateSetting,
    setShortcuts,
    setMicroOpen,
    setMicroText,
    newDocument,
    createManagedDocument,
    saveDocument,
    deleteDocument,
    deleteDocumentById,
    exportDocument,
    exportDocumentById,
    updateDocumentMetadata,
    duplicateDocument,
    insertTemplate,
    logoutWorkspace,
  };
}

function normalizeCategory(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}
