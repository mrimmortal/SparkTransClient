import { Editor } from "@tiptap/react";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { api, DocumentRecord, MacroRecord, ShortcutBindingRecord, TemplateRecord, UserRecord, UserSettingsRecord } from "../../lib/api";
import { confirmationMessages } from "../../lib/editorFlow";
import { getTemplateDocumentTitle } from "../../lib/templateFlow";
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

  useEffect(() => {
    if (!user) return;
    void refreshWorkspace();
  }, [user]);

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
        ? await api.createDocument(getTemplateDocumentTitle(template), template.content_html || "")
        : await api.createDocument("Untitled document");
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
    if (settings.confirm_destructive_actions && !window.confirm(confirmationMessages.deleteDocument)) return;
    await runTask("Deleting document", async () => {
      await api.deleteDocument(activeDocument.id);
      setDocuments((current) => {
        const nextDocuments = current.filter((item) => item.id !== activeDocument.id);
        setActiveDocument(nextDocuments[0] ?? null);
        return nextDocuments;
      });
    });
  }

  async function exportDocument() {
    if (!activeDocument) return;
    await runTask("Exporting PDF", async () => {
      const blob = await api.exportDocumentPdf(activeDocument.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeDocument.title || "document"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  async function insertTemplate(template: TemplateRecord) {
    const editor = editorRef.current;
    if (!activeDocument || !editor) {
      await runTask("Creating document from template", async () => {
        const document = await api.createDocument(getTemplateDocumentTitle(template), template.content_html || "");
        setDocuments((current) => [document, ...current]);
        setActiveDocument(document);
      });
      return;
    }
    editor.chain().focus().insertContent(template.content_html || "").run();
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
    setShortcuts,
    setMicroOpen,
    setMicroText,
    newDocument,
    saveDocument,
    deleteDocument,
    exportDocument,
    insertTemplate,
    logoutWorkspace,
  };
}
