import { useEffect, useMemo, useState } from "react";
import { Download, Pause, Save, Search, Trash2 } from "lucide-react";
import { EditorContent } from "@tiptap/react";
import { useNavigate } from "react-router-dom";
import { getDictationAction } from "../../lib/dictationFlow";
import { canSaveEditorDocument, getSaveStatusLabel } from "../../lib/editorFlow";
import { DictationControlPanel } from "../dictation/DictationControlPanel";
import { WorkspaceContext } from "../workspace/types";
import { EditorEmptyState } from "./EditorEmptyState";
import { EditorToolbar } from "./EditorToolbar";

export function DocumentsPage({ context }: { context: WorkspaceContext }) {
  const navigate = useNavigate();
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const savingDocument = context.busy === "Saving document";
  const saveStatus = getSaveStatusLabel({ dirty: editorDirty, saving: savingDocument });
  const canSaveActiveDocument = canSaveEditorDocument({
    hasActiveDocument: Boolean(context.activeDocument),
    saving: savingDocument,
    text: context.editor?.getText() ?? "",
  });
  const dictationAction = useMemo(
    () =>
      getDictationAction({
        hasActiveDocument: Boolean(context.activeDocument),
        connectionState: context.connectionState,
        micStatus: context.micStatus,
        retryAttempt: context.retryAttempt,
      }),
    [context.activeDocument, context.connectionState, context.micStatus, context.retryAttempt],
  );

  useEffect(() => {
    setEditorDirty(false);
  }, [context.activeDocument?.id, context.activeDocument?.updated_at]);

  useEffect(() => {
    if (!context.editor) return undefined;
    const markDirty = () => {
      if (context.activeDocument) setEditorDirty(true);
    };
    context.editor.on("update", markDirty);
    return () => {
      context.editor?.off("update", markDirty);
    };
  }, [context.editor, context.activeDocument?.id]);

  useEffect(() => {
    if (!context.settings.auto_connect_corestt || !context.activeDocument) return;
    if (context.connectionState === "DISCONNECTED" || context.connectionState === "CLOSED") {
      context.connectStt();
    }
  }, [context.settings.auto_connect_corestt, context.activeDocument?.id, context.connectionState]);

  useEffect(() => {
    if (!context.settings.autosave_enabled || !editorDirty || !canSaveActiveDocument) return undefined;
    const delayMs = Math.max(5, context.settings.autosave_interval_seconds) * 1000;
    const timeout = window.setTimeout(() => {
      void context.saveDocument();
    }, delayMs);
    return () => window.clearTimeout(timeout);
  }, [
    context.settings.autosave_enabled,
    context.settings.autosave_interval_seconds,
    editorDirty,
    canSaveActiveDocument,
    context.activeDocument?.id,
    context.activeDocument?.title,
    context.editor,
  ]);

  function replaceInDocument() {
    if (!context.editor || !findText) return;
    const html = context.editor.getHTML();
    if (!html.includes(findText)) {
      context.setWarning("Search text was not found in the current document.");
      return;
    }
    context.editor.commands.setContent(html.split(findText).join(replaceText));
    setEditorDirty(true);
  }

  function runDictationAction() {
    if (dictationAction.intent === "stop") {
      context.stopDictation();
      return;
    }
    if (dictationAction.intent === "start") {
      context.startDictation();
      return;
    }
    context.connectStt();
  }

  return (
    <section className="documents-page">
      <header className="topbar">
        <div className="document-title-group">
          <input
            className="title-input"
            value={context.activeDocument?.title ?? "Untitled document"}
            onChange={(event) => {
              if (!context.activeDocument) return;
              setEditorDirty(true);
              context.setActiveDocument({ ...context.activeDocument, title: event.target.value });
            }}
            disabled={!context.activeDocument}
          />
          <span className={savingDocument ? "save-status saving" : editorDirty ? "save-status dirty" : "save-status"}>
            {context.activeDocument ? saveStatus : "No document"}
          </span>
        </div>
        <div className="toolbar">
          <button onClick={() => context.setMicroOpen(!context.microOpen)}><Pause size={16} /> Micro</button>
          <button onClick={() => void context.saveDocument()} disabled={!canSaveActiveDocument}><Save size={16} /> Save</button>
          <button onClick={() => void context.exportDocument()} disabled={!context.activeDocument}><Download size={16} /> Export</button>
          <button onClick={() => void context.deleteDocument()} disabled={!context.activeDocument}><Trash2 size={16} /> Delete</button>
        </div>
      </header>

      <DictationControlPanel
        context={context}
        action={dictationAction}
        helpOpen={helpOpen}
        onAction={runDictationAction}
        onToggleHelp={() => setHelpOpen((current) => !current)}
      />

      <div className="search-replace">
        <label>
          Find
          <input value={findText} onChange={(event) => setFindText(event.target.value)} />
        </label>
        <label>
          Replace
          <input value={replaceText} onChange={(event) => setReplaceText(event.target.value)} />
        </label>
        <button onClick={replaceInDocument}><Search size={16} /> Replace all</button>
      </div>

      <EditorToolbar editor={context.editor} disabled={!context.activeDocument || !context.editor} />

      <div className="editor-shell">
        {context.activeDocument ? (
          <EditorContent editor={context.editor} />
        ) : (
          <EditorEmptyState onCreate={() => void context.newDocument()} onUseTemplate={() => navigate("/templates")} />
        )}
      </div>
    </section>
  );
}
