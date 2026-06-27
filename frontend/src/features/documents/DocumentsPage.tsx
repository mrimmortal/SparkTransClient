import { useEffect, useMemo, useState } from "react";
import { Download, Pause, Save, Search, Trash2 } from "lucide-react";
import { EditorContent } from "@tiptap/react";
import { useNavigate } from "react-router-dom";
import { getDictationAction } from "../../lib/dictationFlow";
import { canSaveEditorDocument, getSaveStatusLabel } from "../../lib/editorFlow";
import {
  cancelTemplateMarkerNavigation,
  getTemplateMarkerNavigationState,
  moveToFirstTemplateMarker,
  moveToNextTemplateMarker,
  moveToPreviousTemplateMarker,
  skipTemplateMarker,
  TemplateMarkerNavigationState,
} from "../../lib/templateMarkerNavigation";
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
  const [markerNavigationState, setMarkerNavigationState] = useState<TemplateMarkerNavigationState>({
    active: false,
    currentName: null,
    currentIndex: -1,
    total: 0,
  });
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
    const syncMarkerNavigation = () => {
      setMarkerNavigationState(getTemplateMarkerNavigationState(context.editor!.state));
    };
    const markDirty = () => {
      if (context.activeDocument) setEditorDirty(true);
      syncMarkerNavigation();
    };
    syncMarkerNavigation();
    context.editor.on("update", markDirty);
    context.editor.on("selectionUpdate", syncMarkerNavigation);
    return () => {
      context.editor?.off("update", markDirty);
      context.editor?.off("selectionUpdate", syncMarkerNavigation);
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

  function runMarkerNavigation(action: "first" | "previous" | "next" | "skip" | "exit") {
    if (!context.editor) return;
    const moved =
      action === "first"
        ? moveToFirstTemplateMarker(context.editor)
        : action === "previous"
          ? moveToPreviousTemplateMarker(context.editor)
          : action === "next"
            ? moveToNextTemplateMarker(context.editor)
            : action === "skip"
              ? skipTemplateMarker(context.editor)
              : cancelTemplateMarkerNavigation(context.editor);
    if (!moved) context.setWarning(action === "previous" ? "No previous template field found." : "No next template field found.");
    setMarkerNavigationState(getTemplateMarkerNavigationState(context.editor.state));
  }

  const markerPanelVisible = Boolean(context.activeDocument && context.settings.template_marker_navigation_enabled && markerNavigationState.total);

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

      {markerPanelVisible && (
        <section className="template-marker-panel">
          <div>
            <strong>{markerNavigationState.active ? `Field ${markerNavigationState.currentIndex + 1} of ${markerNavigationState.total}` : `${markerNavigationState.total} fields available`}</strong>
            <span>{markerNavigationState.currentName ?? "Select a field to begin"}</span>
          </div>
          <div className="template-marker-actions">
            <button type="button" onClick={() => runMarkerNavigation("first")}>First</button>
            <button type="button" onClick={() => runMarkerNavigation("previous")}>Previous</button>
            <button type="button" onClick={() => runMarkerNavigation("next")}>Next</button>
            <button type="button" onClick={() => runMarkerNavigation("skip")}>Skip</button>
            <button type="button" onClick={() => runMarkerNavigation("exit")}>Exit</button>
          </div>
          <span className="settings-note">Voice: next field, previous field, first field, skip field, cancel field navigation.</span>
        </section>
      )}

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
