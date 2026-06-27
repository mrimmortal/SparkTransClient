import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eraser,
  FileText,
  HeartPulse,
  HelpCircle,
  Keyboard,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Play,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { EditorContent } from "@tiptap/react";
import { useNavigate } from "react-router-dom";
import { getDictationAction, getDictationHelpContent, getEditorTargetLabel } from "../../lib/dictationFlow";
import {
  canSaveEditorDocument,
  clearLastSentenceText,
  formatEditorCountLabel,
  formatQuickActionDate,
  formatQuickActionTime,
  getEditorTextMetrics,
  getSaveStatusLabel,
} from "../../lib/editorFlow";
import {
  cancelTemplateMarkerNavigation,
  getTemplateMarkerNavigationState,
  moveToFirstTemplateMarker,
  moveToNextTemplateMarker,
  moveToPreviousTemplateMarker,
  skipTemplateMarker,
  TemplateMarkerNavigationState,
} from "../../lib/templateMarkerNavigation";
import { formatMicStatus } from "../dictation/formatMicStatus";
import { WorkspaceContext } from "../workspace/types";
import { DocumentQuickSettings, DOCUMENT_QUICK_TARGETS } from "./DocumentQuickSettings";
import { formatDocumentDate } from "./documentManagement";
import { EditorEmptyState } from "./EditorEmptyState";
import { EditorToolbar } from "./EditorToolbar";

export function DocumentsPage({ context }: { context: WorkspaceContext }) {
  const navigate = useNavigate();
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editorFocusMode, setEditorFocusMode] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [dictationSeconds, setDictationSeconds] = useState(0);
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
  const editorText = context.editor?.getText() ?? "";
  const editorMetrics = getEditorTextMetrics(editorText);
  const activeTarget: "smart-editor" | "micro-editor" = context.microOpen || context.settings.default_editor_target === "micro-editor" ? "micro-editor" : "smart-editor";
  const connectionReady = context.connectionState === "READY" || context.connectionState === "STREAMING";
  const microphoneActive = context.micStatus === "capturing" || context.micStatus === "starting";
  const dictationRunning = context.connectionState === "STREAMING" || microphoneActive;

  useEffect(() => {
    setEditorDirty(false);
    setDictationSeconds(0);
  }, [context.activeDocument?.id, context.activeDocument?.updated_at]);

  useEffect(() => {
    if (!dictationRunning) return undefined;
    const interval = window.setInterval(() => setDictationSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [dictationRunning]);

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

  function insertEditorText(text: string) {
    if (!context.editor || !context.activeDocument) return;
    context.editor.chain().focus().insertContent(`${text} `).run();
    setEditorDirty(true);
  }

  function clearLastSentence() {
    if (!context.editor || !context.activeDocument) return;
    const nextText = clearLastSentenceText(context.editor.getText());
    context.editor.commands.setContent(plainTextToEditorHtml(nextText));
    setEditorDirty(true);
  }

  const markerPanelVisible = Boolean(context.activeDocument && context.settings.template_marker_navigation_enabled && markerNavigationState.total);

  return (
    <section className={editorFocusMode ? "documents-page editor-focus-mode" : "documents-page"}>
      <div className="document-workspace-grid">
        <div className="document-workspace-main">
          <header className="topbar document-hero-bar">
            <div className="document-title-group">
              <span className="document-icon-card"><FileText size={22} /></span>
              <span className="document-title-copy">
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
                  <span className="status-dot" aria-hidden="true" /> {context.activeDocument ? saveStatus : "No document"}
                  {context.activeDocument ? <span> · Updated {formatDocumentDate(context.activeDocument.updated_at)}</span> : null}
                </span>
              </span>
            </div>
            <div className="document-control-cluster">
              <div className="document-status-inline">
                <button className="primary compact-dictation-action" onClick={runDictationAction} disabled={dictationAction.disabled}>
                  {dictationAction.intent === "stop" ? <Pause size={16} /> : <Mic size={16} />}
                  {dictationAction.label}
                </button>
                <span className={`status ${context.connectionState.toLowerCase()}`}>
                  <span className="status-dot" aria-hidden="true" /> {context.connectionState}
                </span>
                <div className="quick-target-group document-target-segment" role="group" aria-label="Default dictation target">
                  {DOCUMENT_QUICK_TARGETS.map((target) => (
                    <button
                      key={target.value}
                      type="button"
                      className={context.settings.default_editor_target === target.value ? "quick-toggle active" : "quick-toggle"}
                      aria-pressed={context.settings.default_editor_target === target.value}
                      onClick={() => void context.updateSetting("default_editor_target", target.value)}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="toolbar document-primary-actions">
                <button onClick={() => void context.saveDocument()} disabled={!canSaveActiveDocument}><Save size={16} /> Save</button>
                <button onClick={() => void context.exportDocument()} disabled={!context.activeDocument}><Download size={16} /> Export</button>
                <button className="danger" onClick={() => void context.deleteDocument()} disabled={!context.activeDocument}><Trash2 size={16} /> Delete</button>
                {!editorFocusMode && (
                  <>
                    <button
                      className={quickSettingsOpen ? "icon-button active" : "icon-button"}
                      type="button"
                      title="Quick settings"
                      aria-label="Quick settings"
                      aria-pressed={quickSettingsOpen}
                      onClick={() => setQuickSettingsOpen((current) => !current)}
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                    <button
                      className={searchOpen ? "icon-button active" : "icon-button"}
                      type="button"
                      title="Find and replace"
                      aria-label="Find and replace"
                      aria-pressed={searchOpen}
                      onClick={() => setSearchOpen((current) => !current)}
                    >
                      <Search size={16} />
                    </button>
                  </>
                )}
                <button
                  className={editorFocusMode ? "icon-button active" : "icon-button"}
                  type="button"
                  title={editorFocusMode ? "Exit focus mode" : "Focus mode"}
                  aria-label={editorFocusMode ? "Exit focus mode" : "Focus mode"}
                  aria-pressed={editorFocusMode}
                  onClick={() => setEditorFocusMode((current) => !current)}
                >
                  {editorFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>
          </header>

          {context.warning && <div className="banner warning dictation-warning">{context.warning}</div>}

          {!editorFocusMode && (quickSettingsOpen || searchOpen) && (
            <div className="document-secondary-stack">
              {quickSettingsOpen && <DocumentQuickSettings context={context} showTargets={false} />}

              {searchOpen && (
                <section className="search-replace document-utility-card">
                  <label>
                    Find
                    <input value={findText} onChange={(event) => setFindText(event.target.value)} />
                  </label>
                  <label>
                    Replace
                    <input value={replaceText} onChange={(event) => setReplaceText(event.target.value)} />
                  </label>
                  <button onClick={replaceInDocument}><Search size={16} /> Replace all</button>
                </section>
              )}
            </div>
          )}

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

          <footer className="document-footer-dock">
            <span className="footer-save-indicator">
              <CheckCircle2 size={18} />
              <span>
                <strong>{context.activeDocument ? saveStatus : "No document selected"}</strong>
                <small>{context.activeDocument ? `Last saved ${formatDocumentDate(context.activeDocument.updated_at)}` : "Create or select a document"}</small>
              </span>
            </span>
            <span>{formatEditorCountLabel(editorMetrics)}</span>
            <span>{formatElapsedTime(dictationSeconds)}</span>
            <span className="footer-action-row">
              <button className="icon-button" title="Micro Editor" aria-label="Micro Editor" onClick={() => context.setMicroOpen(!context.microOpen)}><Keyboard size={16} /></button>
              <button className="icon-button" title={dictationAction.label} aria-label={dictationAction.label} onClick={runDictationAction} disabled={dictationAction.disabled}>
                {dictationAction.intent === "stop" ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button className="icon-button" title="Settings" aria-label="Settings" onClick={() => navigate("/settings")}><SlidersHorizontal size={16} /></button>
              <button
                className={editorFocusMode ? "icon-button active" : "icon-button"}
                title={editorFocusMode ? "Exit focus mode" : "Focus mode"}
                aria-label={editorFocusMode ? "Exit focus mode" : "Focus mode"}
                aria-pressed={editorFocusMode}
                onClick={() => setEditorFocusMode((current) => !current)}
              >
                {editorFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </span>
          </footer>
        </div>

        {!editorFocusMode && (
          <DocumentRightRail
            context={context}
            activeTarget={activeTarget}
            connectionReady={connectionReady}
            microphoneActive={microphoneActive}
            helpOpen={helpOpen}
            onToggleHelp={() => setHelpOpen((current) => !current)}
            onInsertDate={() => insertEditorText(formatQuickActionDate())}
            onInsertTime={() => insertEditorText(formatQuickActionTime())}
            onClearLastSentence={clearLastSentence}
            onUndo={() => context.editor?.chain().focus().undo().run()}
            onDiagnostics={() => navigate("/diagnostics")}
          />
        )}
      </div>
    </section>
  );
}

function DocumentRightRail({
  context,
  activeTarget,
  connectionReady,
  microphoneActive,
  helpOpen,
  onToggleHelp,
  onInsertDate,
  onInsertTime,
  onClearLastSentence,
  onUndo,
  onDiagnostics,
}: {
  context: WorkspaceContext;
  activeTarget: "smart-editor" | "micro-editor";
  connectionReady: boolean;
  microphoneActive: boolean;
  helpOpen: boolean;
  onToggleHelp: () => void;
  onInsertDate: () => void;
  onInsertTime: () => void;
  onClearLastSentence: () => void;
  onUndo: () => void;
  onDiagnostics: () => void;
}) {
  const help = getDictationHelpContent();
  const quickActionsDisabled = !context.activeDocument || !context.editor;

  return (
    <aside className="document-right-rail">
      <section className="right-rail-card">
        <header>
          <h2><HelpCircle size={18} /> Dictation Help</h2>
          <button className="icon-button" aria-label={helpOpen ? "Hide dictation help" : "Show dictation help"} onClick={onToggleHelp}>
            {helpOpen ? <X size={16} /> : <ArrowRight size={16} />}
          </button>
        </header>
        <div className="tip-card">
          <strong>Tip</strong>
          <p>Use voice commands to format, navigate, and edit hands-free.</p>
          {!helpOpen && <button type="button" onClick={onToggleHelp}>View all commands <ArrowRight size={14} /></button>}
        </div>
        {helpOpen && (
          <div className="right-rail-command-list">
            <strong>Formatting</strong>
            <span>{help.formattingCommands.join(", ")}</span>
            <strong>Editing</strong>
            <span>{help.editorControls.join(", ")}</span>
            <strong>Templates</strong>
            <span>{help.templatePhrases.join(", ")}</span>
          </div>
        )}
      </section>

      <section className="right-rail-card">
        <header>
          <h2><SlidersHorizontal size={18} /> Quick Actions</h2>
        </header>
        <div className="right-rail-actions">
          <button type="button" onClick={onInsertDate} disabled={quickActionsDisabled}><Calendar size={16} /> Insert current date</button>
          <button type="button" onClick={onInsertTime} disabled={quickActionsDisabled}><Clock size={16} /> Insert current time</button>
          <button type="button" onClick={onClearLastSentence} disabled={quickActionsDisabled}><Eraser size={16} /> Clear last sentence</button>
          <button type="button" onClick={onUndo} disabled={quickActionsDisabled}><Undo2 size={16} /> Undo last action</button>
        </div>
      </section>

      <section className="right-rail-card">
        <header>
          <h2><HeartPulse size={18} /> Dictation Status</h2>
        </header>
        <div className="diagnostics-summary">
          <span className={connectionReady ? "summary-good" : "summary-warn"}>
            <span className="status-dot" aria-hidden="true" /> {connectionReady ? "CoreSTT ready" : context.connectionState}
          </span>
          <dl>
            <dt>Microphone</dt>
            <dd>{formatMicStatus(context.micStatus)}</dd>
            <dt>Audio packets</dt>
            <dd>{context.audioPacketCount}</dd>
            <dt>Target</dt>
            <dd>{getEditorTargetLabel(activeTarget)}</dd>
            <dt>Capture</dt>
            <dd>{microphoneActive ? "Active" : "Not capturing"}</dd>
          </dl>
          <button type="button" onClick={onDiagnostics}><HeartPulse size={16} /> Diagnostics</button>
        </div>
      </section>
    </aside>
  );
}

function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function plainTextToEditorHtml(text: string): string {
  if (!text.trim()) return "";
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
