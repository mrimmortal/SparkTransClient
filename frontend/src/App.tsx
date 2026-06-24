import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { EditorContent, Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import {
  Activity,
  Bold,
  ClipboardList,
  Download,
  FileText,
  Heading2,
  HeartPulse,
  Italic,
  List,
  ListOrdered,
  LogOut,
  Mic,
  Pause,
  Plus,
  Redo2,
  RemoveFormatting,
  Save,
  Search,
  Code2,
  Settings,
  Square,
  Trash2,
  Pilcrow,
  Quote,
  Minus,
  Underline,
  Undo2,
  Upload,
  Wand2,
} from "lucide-react";
import {
  api,
  DocumentRecord,
  HealthStatus,
  MacroRecord,
  PublicConfig,
  ShortcutBindingRecord,
  TemplateRecord,
  UserRecord,
  UserSettingsRecord,
  VersionInfo,
} from "./lib/api";
import {
  applyTranscriptEvent,
  ConnectionState,
  isBlankAudioTranscript,
  resolveSttUrl,
  routeFinalText,
  shouldInsertFinalTranscript,
  shouldInsertFinalTranscriptText,
  TranscriptState,
} from "./lib/corestt";
import { getMicrophoneCaptureErrorMessage, isMicrophoneCaptureSupported, MicrophoneCapture } from "./lib/micCapture";
import { SttClient } from "./lib/sttClient";
import { sampleUser } from "./lib/sampleUser";
import { canSaveMacroDraft, normalizeMacroDraft, removeMacroById, upsertMacro } from "./lib/macroFlow";
import {
  canSaveTemplateDraft,
  getTemplateDocumentTitle,
  normalizeTemplateDraft,
  removeTemplateById,
  routeTemplateVoiceCommand,
  shouldInsertTemplateVoiceCommand,
  upsertTemplate,
} from "./lib/templateFlow";
import { DictationAction, getDictationAction, getDictationHelpContent, getEditorTargetLabel } from "./lib/dictationFlow";
import { canSaveEditorDocument, confirmationMessages, EditorToolbarCommand, editorToolbarItems, getSaveStatusLabel } from "./lib/editorFlow";

const defaultSettings: UserSettingsRecord = {
  audio_device_id: null,
  voice_commands_enabled: true,
  macros_enabled: true,
  default_editor_target: "smart-editor",
  profile: "general",
  auto_connect_corestt: false,
  autosave_enabled: false,
  autosave_interval_seconds: 30,
  confirm_destructive_actions: true,
  duplicate_transcript_protection_enabled: true,
  duplicate_transcript_window_ms: 5000,
  ignore_blank_audio_enabled: true,
  voice_command_variants_enabled: true,
  default_template_id: null,
  show_microphone_status: true,
};

type WorkspaceContext = {
  user: UserRecord;
  documents: DocumentRecord[];
  templates: TemplateRecord[];
  macros: MacroRecord[];
  settings: UserSettingsRecord;
  shortcuts: ShortcutBindingRecord[];
  activeDocument: DocumentRecord | null;
  editor: Editor | null;
  connectionState: ConnectionState;
  realtimeText: string;
  warning: string;
  busy: string;
  microOpen: boolean;
  microText: string;
  micStatus: string;
  audioPacketCount: number;
  audioSampleRate: number;
  retryAttempt: number;
  refreshWorkspace: () => Promise<void>;
  setWarning: (message: string) => void;
  setActiveDocument: (document: DocumentRecord | null) => void;
  setTemplates: Dispatch<SetStateAction<TemplateRecord[]>>;
  setMacros: Dispatch<SetStateAction<MacroRecord[]>>;
  setSettings: (settings: UserSettingsRecord) => void;
  setShortcuts: (shortcuts: ShortcutBindingRecord[]) => void;
  setMicroOpen: (open: boolean) => void;
  setMicroText: (text: string) => void;
  newDocument: () => Promise<void>;
  saveDocument: () => Promise<void>;
  deleteDocument: () => Promise<void>;
  exportDocument: () => Promise<void>;
  insertTemplate: (template: TemplateRecord) => Promise<void>;
  connectStt: () => void;
  startDictation: () => void;
  stopDictation: () => void;
  logout: () => Promise<void>;
};

export function App() {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState(sampleUser.email);
  const [password, setPassword] = useState(sampleUser.password);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [macros, setMacros] = useState<MacroRecord[]>([]);
  const [settings, setSettings] = useState<UserSettingsRecord>(defaultSettings);
  const [shortcuts, setShortcuts] = useState<ShortcutBindingRecord[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("DISCONNECTED");
  const [transcripts, setTranscripts] = useState<TranscriptState>({ realtimeBySegment: {}, finalBySegment: {} });
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState("");
  const [microOpen, setMicroOpen] = useState(false);
  const [microText, setMicroText] = useState("");
  const [micStatus, setMicStatus] = useState("idle");
  const [audioPacketCount, setAudioPacketCount] = useState(0);
  const [audioSampleRate, setAudioSampleRate] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const sttRef = useRef<SttClient | null>(null);
  const micRef = useRef<MicrophoneCapture | null>(null);
  const micStartingRef = useRef(false);
  const dictationRequestedRef = useRef(false);
  const macrosRef = useRef(macros);
  const templatesRef = useRef(templates);
  const settingsRef = useRef(settings);
  const microOpenRef = useRef(microOpen);
  const editorRef = useRef<Editor | null>(null);
  const insertedFinalSegmentsRef = useRef(new Set<number>());
  const recentFinalTranscriptTextRef = useRef(new Map<string, number>());
  const recentTemplateVoiceCommandsRef = useRef(new Map<string, number>());

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Placeholder.configure({ placeholder: "Start dictation or type your document..." }),
    ],
    content: activeDocument?.content_html || "",
    editorProps: {
      attributes: {
        class: "smart-editor",
      },
    },
  });

  const realtimeText = useMemo(() => Object.values(transcripts.realtimeBySegment).join(" "), [transcripts]);

  function setWorkspaceMacros(action: SetStateAction<MacroRecord[]>) {
    setMacros((current) => {
      const next = typeof action === "function" ? action(current) : action;
      macrosRef.current = next;
      return next;
    });
  }

  function setWorkspaceTemplates(action: SetStateAction<TemplateRecord[]>) {
    setTemplates((current) => {
      const next = typeof action === "function" ? action(current) : action;
      templatesRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => undefined)
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    void refreshWorkspace();
  }, [user]);

  useEffect(() => {
    if (editor && activeDocument) {
      editor.commands.setContent(activeDocument.content_html || "");
    }
  }, [activeDocument?.id, editor]);

  useEffect(() => {
    macrosRef.current = macros;
  }, [macros]);

  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    microOpenRef.current = microOpen;
  }, [microOpen]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (connectionState === "STREAMING" && dictationRequestedRef.current) {
      void startMicrophoneCapture();
    }
    if (connectionState === "CLOSED" || connectionState === "DISCONNECTED" || connectionState === "ERROR") {
      stopMicrophoneCapture();
    }
  }, [connectionState]);

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

  async function login(register = false) {
    await runTask(register ? "Creating account" : "Signing in", async () => {
      const nextUser = register ? await api.register(email, password) : await api.login(email, password);
      setUser(nextUser);
    });
  }

  async function logout() {
    await runTask("Signing out", async () => {
      stopDictation();
      sttRef.current?.disconnect();
      await api.logout();
      setUser(null);
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

  function connectStt() {
    if (sttRef.current) {
      sttRef.current.connect();
      return;
    }
    const client = new SttClient(resolveSttUrl(), {
      onState: (state) => {
        setConnectionState(state);
        if (state === "READY" || state === "STREAMING") setRetryAttempt(0);
      },
      onWarning: setWarning,
      onRetry: (attempt) => setRetryAttempt(attempt),
      onMessage: (message) => {
        const typed = message as { type?: string; segmentId?: number; text?: string; displayText?: string };
        if ((typed.type === "realtime" || typed.type === "final") && typeof typed.segmentId === "number") {
          setTranscripts((current) => applyTranscriptEvent(current, typed as never));
          if (
            typed.type === "final" &&
            typed.text &&
            !(settingsRef.current.ignore_blank_audio_enabled && isBlankAudioTranscript(typed.text)) &&
            shouldInsertFinalTranscript(insertedFinalSegmentsRef.current, typed.segmentId) &&
            shouldInsertFinalTranscriptText(recentFinalTranscriptTextRef.current, typed.text, Date.now(), {
              enabled: settingsRef.current.duplicate_transcript_protection_enabled,
              windowMs: settingsRef.current.duplicate_transcript_window_ms,
            })
          ) {
            insertFinalText(typed.text);
          }
        }
        if (typed.type === "clear") {
          insertedFinalSegmentsRef.current.clear();
          recentFinalTranscriptTextRef.current.clear();
          recentTemplateVoiceCommandsRef.current.clear();
          setTranscripts({ realtimeBySegment: {}, finalBySegment: {} });
        }
      },
    });
    sttRef.current = client;
    client.connect();
  }

  function startDictation() {
    setWarning("");
    setAudioPacketCount(0);
    dictationRequestedRef.current = true;
    if (!sttRef.current) {
      connectStt();
    }
    sttRef.current?.start();
  }

  function stopDictation() {
    dictationRequestedRef.current = false;
    stopMicrophoneCapture();
    sttRef.current?.stop();
  }

  async function startMicrophoneCapture() {
    if (micStartingRef.current || micRef.current?.isCapturing) return;
    if (!isMicrophoneCaptureSupported()) {
      setWarning("Microphone capture requires browser microphone access on localhost or HTTPS.");
      setMicStatus("error");
      dictationRequestedRef.current = false;
      sttRef.current?.stop();
      return;
    }

    micStartingRef.current = true;
    setMicStatus("starting");
    const capture = new MicrophoneCapture({
      audioDeviceId: settings.audio_device_id || undefined,
      onWarning: setWarning,
      onSamples: (samples, sampleRate) => {
        if (sttRef.current?.sendFloatSamples(samples, sampleRate)) {
          setAudioPacketCount((count) => count + 1);
        }
      },
    });
    micRef.current = capture;

    try {
      const sampleRate = await capture.start();
      if (!dictationRequestedRef.current) {
        capture.stop();
        if (micRef.current === capture) micRef.current = null;
        setMicStatus("stopped");
        return;
      }
      setAudioSampleRate(sampleRate);
      setMicStatus("capturing");
    } catch (error) {
      if (micRef.current === capture) micRef.current = null;
      setMicStatus("error");
      setWarning(getMicrophoneCaptureErrorMessage(error));
      dictationRequestedRef.current = false;
      sttRef.current?.stop();
    } finally {
      micStartingRef.current = false;
    }
  }

  function stopMicrophoneCapture() {
    micRef.current?.stop();
    micRef.current = null;
    micStartingRef.current = false;
    setAudioSampleRate(0);
    setMicStatus("stopped");
  }

  function insertFinalText(text: string) {
    const currentSettings = settingsRef.current;
    const template = routeTemplateVoiceCommand(text, templatesRef.current, {
      voiceCommandsEnabled: currentSettings.voice_commands_enabled,
    });
    if (template) {
      if (!shouldInsertTemplateVoiceCommand(recentTemplateVoiceCommandsRef.current, template, text, Date.now())) return;
      editorRef.current?.chain().focus().insertContent(template.content_html || "").run();
      return;
    }
    const target = microOpenRef.current || currentSettings.default_editor_target === "micro-editor" ? "micro-editor" : "smart-editor";
    const routed = routeFinalText(text, target, macrosRef.current, {
      voiceCommandsEnabled: currentSettings.voice_commands_enabled,
      macrosEnabled: currentSettings.macros_enabled,
      voiceCommandVariantsEnabled: currentSettings.voice_command_variants_enabled,
    });
    if (routed.kind === "command") {
      runCommand(routed.command);
      return;
    }
    if (target === "micro-editor") {
      setMicroOpen(true);
      setMicroText((current) => `${current}${current ? " " : ""}${routed.text}`);
    } else {
      editorRef.current?.chain().focus().insertContent(`${routed.text} `).run();
    }
  }

  function runCommand(command: string) {
    if (command === "stop-dictation") {
      stopDictation();
      return;
    }
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    if (command === "insert-newline") currentEditor.chain().focus().setHardBreak().run();
    if (command === "insert-paragraph") currentEditor.chain().focus().createParagraphNear().run();
    if (command === "undo") currentEditor.chain().focus().undo().run();
    if (command === "redo") currentEditor.chain().focus().redo().run();
    if (command === "bold") currentEditor.chain().focus().toggleBold().run();
    if (command === "italic") currentEditor.chain().focus().toggleItalic().run();
    if (command === "underline") currentEditor.chain().focus().toggleUnderline().run();
    if (command === "clear-formatting") currentEditor.chain().focus().unsetAllMarks().clearNodes().run();
    if (command === "select-all") currentEditor.commands.selectAll();
    if (command === "clear-all" && (!settingsRef.current.confirm_destructive_actions || window.confirm(confirmationMessages.clearEditor))) {
      currentEditor.commands.clearContent();
    }
  }

  if (!authChecked) {
    return <main className="auth-screen">Loading...</main>;
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <h1>SparkTransClient</h1>
          <p>Secure dictation workspace</p>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {warning && <div className="banner error">{warning}</div>}
          <div className="button-row">
            <button onClick={() => void login(false)} disabled={Boolean(busy)}>Sign in</button>
            <button className="secondary" onClick={() => void login(true)} disabled={Boolean(busy)}>Create account</button>
          </div>
        </section>
      </main>
    );
  }

  const context: WorkspaceContext = {
    user,
    documents,
    templates,
    macros,
    settings,
    shortcuts,
    activeDocument,
    editor,
    connectionState,
    realtimeText,
    warning,
    busy,
    microOpen,
    microText,
    micStatus,
    audioPacketCount,
    audioSampleRate,
    retryAttempt,
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
    connectStt,
    startDictation,
    stopDictation,
    logout,
  };

  return (
    <BrowserRouter>
      <WorkspaceShell context={context} />
    </BrowserRouter>
  );
}

function WorkspaceShell({ context }: { context: WorkspaceContext }) {
  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="brand">SparkTrans</div>
        <nav>
          <NavLink to="/documents" className={({ isActive }) => (isActive ? "nav active" : "nav")}><FileText size={16} /> Documents</NavLink>
          <NavLink to="/templates" className={({ isActive }) => (isActive ? "nav active" : "nav")}><ClipboardList size={16} /> Templates</NavLink>
          <NavLink to="/macros" className={({ isActive }) => (isActive ? "nav active" : "nav")}><Wand2 size={16} /> Macros</NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "nav active" : "nav")}><Settings size={16} /> Settings</NavLink>
          <NavLink to="/diagnostics" className={({ isActive }) => (isActive ? "nav active" : "nav")}><HeartPulse size={16} /> Diagnostics</NavLink>
        </nav>
        <button className="full secondary" onClick={() => void context.newDocument()} disabled={Boolean(context.busy)}>
          <Plus size={16} /> New document
        </button>
        <div className="document-list">
          {context.documents.map((document) => (
            <button key={document.id} className={document.id === context.activeDocument?.id ? "doc active" : "doc"} onClick={() => context.setActiveDocument(document)}>
              {document.title}
            </button>
          ))}
        </div>
        <button className="full secondary" onClick={() => void context.logout()}>
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <section className="main-panel">
        {context.warning && <div className="banner warning workspace-warning">{context.warning}</div>}
        {context.busy && <div className="status-row"><span className="status">{context.busy}</span></div>}
        <Routes>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentsPage context={context} />} />
          <Route path="/templates" element={<TemplatesPage context={context} />} />
          <Route path="/macros" element={<MacrosPage context={context} />} />
          <Route path="/settings" element={<SettingsPage context={context} />} />
          <Route path="/diagnostics" element={<DiagnosticsPage context={context} />} />
          <Route path="*" element={<Navigate to="/documents" replace />} />
        </Routes>
      </section>

      {context.microOpen && <MicroEditor context={context} />}
    </main>
  );
}

function DocumentsPage({ context }: { context: WorkspaceContext }) {
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

function EditorToolbar({ editor, disabled }: { editor: Editor | null; disabled: boolean }) {
  function runToolbarCommand(command: EditorToolbarCommand) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (command === "bold") chain.toggleBold().run();
    if (command === "italic") chain.toggleItalic().run();
    if (command === "underline") chain.toggleUnderline().run();
    if (command === "heading") chain.toggleHeading({ level: 2 }).run();
    if (command === "paragraph") chain.setParagraph().run();
    if (command === "bullet-list") chain.toggleBulletList().run();
    if (command === "ordered-list") chain.toggleOrderedList().run();
    if (command === "blockquote") chain.toggleBlockquote().run();
    if (command === "code-block") chain.toggleCodeBlock().run();
    if (command === "horizontal-rule") chain.setHorizontalRule().run();
    if (command === "undo") chain.undo().run();
    if (command === "redo") chain.redo().run();
    if (command === "clear-formatting") chain.unsetAllMarks().clearNodes().run();
  }

  function isToolbarCommandActive(command: EditorToolbarCommand): boolean {
    if (!editor) return false;
    if (command === "bold") return editor.isActive("bold");
    if (command === "italic") return editor.isActive("italic");
    if (command === "underline") return editor.isActive("underline");
    if (command === "heading") return editor.isActive("heading", { level: 2 });
    if (command === "paragraph") return editor.isActive("paragraph");
    if (command === "bullet-list") return editor.isActive("bulletList");
    if (command === "ordered-list") return editor.isActive("orderedList");
    if (command === "blockquote") return editor.isActive("blockquote");
    if (command === "code-block") return editor.isActive("codeBlock");
    return false;
  }

  return (
    <div className="editor-toolbar" aria-label="Editor toolbar">
      {editorToolbarItems.map((item) => (
        <button
          key={item.command}
          type="button"
          className={isToolbarCommandActive(item.command) ? "icon-button active" : "icon-button"}
          title={item.label}
          aria-label={item.label}
          onClick={() => runToolbarCommand(item.command)}
          disabled={disabled}
        >
          {renderToolbarIcon(item.command)}
        </button>
      ))}
    </div>
  );
}

function renderToolbarIcon(command: EditorToolbarCommand) {
  if (command === "bold") return <Bold size={16} />;
  if (command === "italic") return <Italic size={16} />;
  if (command === "underline") return <Underline size={16} />;
  if (command === "heading") return <Heading2 size={16} />;
  if (command === "paragraph") return <Pilcrow size={16} />;
  if (command === "bullet-list") return <List size={16} />;
  if (command === "ordered-list") return <ListOrdered size={16} />;
  if (command === "blockquote") return <Quote size={16} />;
  if (command === "code-block") return <Code2 size={16} />;
  if (command === "horizontal-rule") return <Minus size={16} />;
  if (command === "undo") return <Undo2 size={16} />;
  if (command === "redo") return <Redo2 size={16} />;
  return <RemoveFormatting size={16} />;
}

function EditorEmptyState({ onCreate, onUseTemplate }: { onCreate: () => void; onUseTemplate: () => void }) {
  return (
    <div className="empty-state editor-empty-state">
      <h2>No document selected</h2>
      <p>Create a blank document or choose a template to start writing.</p>
      <div className="button-row">
        <button className="primary" onClick={onCreate}><Plus size={16} /> Create document</button>
        <button onClick={onUseTemplate}><ClipboardList size={16} /> Use template</button>
      </div>
    </div>
  );
}

function DictationControlPanel({
  context,
  action,
  helpOpen,
  onAction,
  onToggleHelp,
}: {
  context: WorkspaceContext;
  action: DictationAction;
  helpOpen: boolean;
  onAction: () => void;
  onToggleHelp: () => void;
}) {
  const help = getDictationHelpContent();
  const activeTarget = context.microOpen || context.settings.default_editor_target === "micro-editor" ? "micro-editor" : "smart-editor";
  const connectionReady = context.connectionState === "READY" || context.connectionState === "STREAMING";
  const microphoneActive = context.micStatus === "capturing" || context.micStatus === "starting";

  return (
    <section className="dictation-panel">
      <div className="dictation-control">
        <button className="primary dictation-action" onClick={onAction} disabled={action.disabled}>
          {action.intent === "stop" ? <Square size={16} /> : action.intent === "start" ? <Mic size={16} /> : <Activity size={16} />}
          {action.label}
        </button>
        <div className="dictation-copy">
          <strong>Dictation</strong>
          <span>{action.helperText}</span>
        </div>
        <button className="secondary dictation-help-toggle" onClick={onToggleHelp}>
          {helpOpen ? "Hide help" : "Dictation help"}
        </button>
      </div>

      {context.warning && <div className="banner warning dictation-warning">{context.warning}</div>}

      <div className="dictation-meta">
        <span className={`status ${context.connectionState.toLowerCase()}`}>{context.connectionState}</span>
        <span>Microphone: {formatMicStatus(context.micStatus)}</span>
        <span>Packets: {context.audioPacketCount}</span>
        <span>Target: {getEditorTargetLabel(activeTarget)}</span>
        {context.realtimeText && <span className="interim">{context.realtimeText}</span>}
      </div>

      {helpOpen && (
        <aside className="dictation-help-panel">
          <section>
            <h2>Start dictation</h2>
            <ol>
              {help.setupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <ul className="setup-list">
              <li className={context.activeDocument ? "ready" : ""}>Document: {context.activeDocument ? context.activeDocument.title : "Select or create one"}</li>
              <li className={connectionReady ? "ready" : ""}>CoreSTT: {connectionReady ? "Ready" : context.connectionState}</li>
              <li className={microphoneActive ? "ready" : context.micStatus === "error" ? "error" : ""}>Microphone: {formatMicStatus(context.micStatus)}</li>
              <li className="ready">Transcript target: {getEditorTargetLabel(activeTarget)}</li>
            </ul>
          </section>

          <section>
            <h2>Dictate text and punctuation</h2>
            <p>Speak normally. Use punctuation words when you want symbols inserted in the final text.</p>
            <p><strong>Example:</strong> <code>{help.punctuationExample}</code></p>
            <div className="command-list">
              {help.punctuationPhrases.map((phrase) => (
                <code key={phrase}>{phrase}</code>
              ))}
            </div>
          </section>

          <section>
            <h2>Control recording by voice</h2>
            <p>While dictation is running, say one of these commands to stop recording.</p>
            <div className="command-list">
              {help.recordingControls.map((command) => (
                <code key={command}>{command}</code>
              ))}
            </div>
          </section>

          <section>
            <h2>Format text by voice</h2>
            <p>Say these commands to toggle formatting for selected text or for what you dictate next.</p>
            <div className="command-list">
              {help.formattingCommands.map((command) => (
                <code key={command}>{command}</code>
              ))}
            </div>
          </section>

          <section>
            <h2>Edit by voice</h2>
            <p>These commands control the Smart Editor even if the Micro Editor is the current transcript target.</p>
            <div className="command-list">
              {help.editorControls.map((command) => (
                <code key={command}>{command}</code>
              ))}
            </div>
          </section>

          <section>
            <h2>Templates and macros</h2>
            <p>Insert a saved template by saying one of these phrases followed by the template name.</p>
            <div className="command-list">
              {help.templatePhrases.map((phrase) => (
                <code key={phrase}>{phrase}</code>
              ))}
            </div>
            <p>
              {help.macroSummary} Use <NavLink to="/macros">Macros</NavLink> and <NavLink to="/settings">Settings</NavLink> to adjust dictation behavior.
            </p>
          </section>
        </aside>
      )}
    </section>
  );
}

function TemplatesPage({ context }: { context: WorkspaceContext }) {
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

function MacrosPage({ context }: { context: WorkspaceContext }) {
  const [trigger, setTrigger] = useState("");
  const [replacement, setReplacement] = useState("");
  const [creating, setCreating] = useState(false);
  const createDraft = { trigger, replacement, enabled: true };

  async function createMacro(event: FormEvent) {
    event.preventDefault();
    if (!canSaveMacroDraft(createDraft)) return;
    setCreating(true);
    await withWarning(context, async () => {
      const macro = await api.createMacro(normalizeMacroDraft(createDraft));
      context.setMacros((current) => upsertMacro(current, macro));
      setTrigger("");
      setReplacement("");
    });
    setCreating(false);
  }

  async function updateMacro(macro: MacroRecord, payload: Partial<Omit<MacroRecord, "id">>) {
    const nextPayload = {
      ...payload,
      ...(payload.trigger !== undefined ? { trigger: payload.trigger.trim() } : {}),
      ...(payload.replacement !== undefined ? { replacement: payload.replacement.trim() } : {}),
    };
    if ((nextPayload.trigger !== undefined && !nextPayload.trigger) || (nextPayload.replacement !== undefined && !nextPayload.replacement)) {
      throw new Error("Macro trigger and replacement are required.");
    }
    const updated = await api.updateMacro(macro.id, nextPayload);
    context.setMacros((current) => upsertMacro(current, updated));
  }

  async function deleteMacro(macro: MacroRecord) {
    if (context.settings.confirm_destructive_actions && !window.confirm(confirmationMessages.deleteMacro)) return;
    await api.deleteMacro(macro.id);
    context.setMacros((current) => removeMacroById(current, macro.id));
  }

  return (
    <section className="manager-page">
      <PageHeader title="Macros" />
      <div className="manager-grid two">
        <section className="panel">
          <form onSubmit={(event) => void createMacro(event)} className="stack">
            <h2>New macro</h2>
            <input placeholder="Trigger phrase" value={trigger} onChange={(event) => setTrigger(event.target.value)} />
            <textarea placeholder="Replacement text" value={replacement} onChange={(event) => setReplacement(event.target.value)} />
            <button className="primary" type="submit" disabled={creating || !canSaveMacroDraft(createDraft)}><Plus size={16} /> {creating ? "Creating" : "Create macro"}</button>
          </form>
        </section>
        <section className="panel wide">
          <div className="table-list">
            {context.macros.map((macro) => (
              <MacroRow key={macro.id} macro={macro} onSave={updateMacro} onDelete={deleteMacro} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MacroRow({
  macro,
  onSave,
  onDelete,
}: {
  macro: MacroRecord;
  onSave: (macro: MacroRecord, payload: Partial<Omit<MacroRecord, "id">>) => Promise<void>;
  onDelete: (macro: MacroRecord) => Promise<void>;
}) {
  const [draft, setDraft] = useState(macro);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setDraft(macro), [macro]);

  const normalizedDraft = normalizeMacroDraft(draft);
  const dirty =
    normalizedDraft.trigger !== macro.trigger ||
    normalizedDraft.replacement !== macro.replacement ||
    normalizedDraft.enabled !== macro.enabled;

  async function saveDraft(nextDraft = draft) {
    setError("");
    const normalized = normalizeMacroDraft(nextDraft);
    if (!canSaveMacroDraft(normalized)) {
      setError("Trigger and replacement are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(macro, normalized);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Macro save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(enabled: boolean) {
    const nextDraft = { ...draft, enabled };
    setDraft(nextDraft);
    await saveDraft(nextDraft);
  }

  async function deleteDraft() {
    setError("");
    setSaving(true);
    try {
      await onDelete(macro);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Macro delete failed");
      setSaving(false);
    }
  }

  return (
    <div className={dirty ? "table-row dirty" : "table-row"}>
      <input aria-label="Macro trigger" value={draft.trigger} onChange={(event) => setDraft({ ...draft, trigger: event.target.value })} />
      <input aria-label="Macro replacement" value={draft.replacement} onChange={(event) => setDraft({ ...draft, replacement: event.target.value })} />
      <label className="compact-check">
        <input type="checkbox" checked={draft.enabled} onChange={(event) => void toggleEnabled(event.target.checked)} disabled={saving} />
        Enabled
      </label>
      <button onClick={() => void saveDraft()} disabled={saving || !dirty || !canSaveMacroDraft(draft)}><Save size={16} /> {saving ? "Saving" : "Save"}</button>
      <button onClick={() => void deleteDraft()} disabled={saving}><Trash2 size={16} /> Delete</button>
      {(dirty || error) && <span className={error ? "row-message error" : "row-message"}>{error || "Unsaved"}</span>}
    </div>
  );
}

function SettingsPage({ context }: { context: WorkspaceContext }) {
  const [draftSettings, setDraftSettings] = useState(context.settings);
  const [draftShortcuts, setDraftShortcuts] = useState(context.shortcuts.map(stripShortcutId));
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState("Not checked");

  useEffect(() => setDraftSettings(context.settings), [context.settings]);
  useEffect(() => setDraftShortcuts(context.shortcuts.map(stripShortcutId)), [context.shortcuts]);

  const settingsDirty = JSON.stringify(draftSettings) !== JSON.stringify(context.settings);
  const shortcutsDirty = JSON.stringify(draftShortcuts) !== JSON.stringify(context.shortcuts.map(stripShortcutId));
  const canSave = (settingsDirty || shortcutsDirty) && !saving;

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    await withWarning(context, async () => {
      const [nextSettings, nextShortcuts] = await Promise.all([
        api.updateSettings(draftSettings),
        api.replaceShortcuts(draftShortcuts.filter((shortcut) => shortcut.action && shortcut.shortcut)),
      ]);
      context.setSettings(nextSettings);
      context.setShortcuts(nextShortcuts);
    });
    setSaving(false);
  }

  async function loadDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      context.setWarning("This browser cannot list audio devices.");
      return;
    }
    const nextDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput");
    setDevices(nextDevices);
  }

  async function checkMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneStatus("Microphone capture is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: draftSettings.audio_device_id || undefined } });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneStatus("Microphone permission and capture are available.");
    } catch (error) {
      setMicrophoneStatus(error instanceof Error ? error.message : "Microphone check failed.");
    }
  }

  return (
    <section className="manager-page">
      <PageHeader title="Settings" />
      <form className="settings-grid" onSubmit={(event) => void saveSettings(event)}>
        <section className="panel stack">
          <div className="panel-heading">
            <h2>Dictation</h2>
            <span className={settingsDirty ? "save-status dirty" : "save-status"}>{saving ? "Saving..." : settingsDirty ? "Unsaved" : "Saved"}</span>
          </div>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.voice_commands_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, voice_commands_enabled: event.target.checked })}
            />
            Voice commands enabled
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.voice_command_variants_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, voice_command_variants_enabled: event.target.checked })}
            />
            Allow common voice command variants
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.macros_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, macros_enabled: event.target.checked })}
            />
            Macro expansion enabled
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.auto_connect_corestt}
              onChange={(event) => setDraftSettings({ ...draftSettings, auto_connect_corestt: event.target.checked })}
            />
            Auto-connect CoreSTT on Documents
          </label>
          <label>
            Default editor target
            <select
              value={draftSettings.default_editor_target}
              onChange={(event) => setDraftSettings({ ...draftSettings, default_editor_target: event.target.value })}
            >
              <option value="smart-editor">Smart Editor</option>
              <option value="micro-editor">Micro Editor</option>
            </select>
          </label>
          <label>
            Dictation profile
            <select value={draftSettings.profile} onChange={(event) => setDraftSettings({ ...draftSettings, profile: event.target.value })}>
              <option value="general">General</option>
              <option value="meeting-notes">Meeting notes</option>
              <option value="medical">Medical</option>
            </select>
          </label>
        </section>

        <section className="panel stack">
          <h2>Transcript handling</h2>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.ignore_blank_audio_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, ignore_blank_audio_enabled: event.target.checked })}
            />
            Ignore blank audio markers
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.duplicate_transcript_protection_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, duplicate_transcript_protection_enabled: event.target.checked })}
            />
            Prevent repeated final transcripts
          </label>
          <label>
            Duplicate protection window
            <select
              value={draftSettings.duplicate_transcript_window_ms}
              onChange={(event) => setDraftSettings({ ...draftSettings, duplicate_transcript_window_ms: Number(event.target.value) })}
              disabled={!draftSettings.duplicate_transcript_protection_enabled}
            >
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.autosave_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, autosave_enabled: event.target.checked })}
            />
            Auto-save documents
          </label>
          <label>
            Auto-save interval
            <select
              value={draftSettings.autosave_interval_seconds}
              onChange={(event) => setDraftSettings({ ...draftSettings, autosave_interval_seconds: Number(event.target.value) })}
              disabled={!draftSettings.autosave_enabled}
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
            </select>
          </label>
        </section>

        <section className="panel stack">
          <h2>Microphone</h2>
          <div className="button-row">
            <button type="button" onClick={() => void loadDevices()}><Mic size={16} /> Load devices</button>
            <button type="button" onClick={() => void checkMicrophone()}>Check microphone</button>
          </div>
          <select
            value={draftSettings.audio_device_id ?? ""}
            onChange={(event) => setDraftSettings({ ...draftSettings, audio_device_id: event.target.value || null })}
          >
            <option value="">Browser default microphone</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.slice(0, 6)}`}</option>
            ))}
          </select>
          {draftSettings.show_microphone_status && <p className="settings-note">{microphoneStatus}</p>}
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.show_microphone_status}
              onChange={(event) => setDraftSettings({ ...draftSettings, show_microphone_status: event.target.checked })}
            />
            Show microphone status
          </label>
          <details>
            <summary>Advanced device ID</summary>
            <input
              placeholder="Audio device id"
              value={draftSettings.audio_device_id ?? ""}
              onChange={(event) => setDraftSettings({ ...draftSettings, audio_device_id: event.target.value || null })}
            />
          </details>
        </section>

        <section className="panel stack">
          <h2>Documents and safety</h2>
          <label>
            Default template for new documents
            <select
              value={draftSettings.default_template_id ?? ""}
              onChange={(event) => setDraftSettings({ ...draftSettings, default_template_id: event.target.value ? Number(event.target.value) : null })}
            >
              <option value="">Blank document</option>
              {context.templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.confirm_destructive_actions}
              onChange={(event) => setDraftSettings({ ...draftSettings, confirm_destructive_actions: event.target.checked })}
            />
            Confirm before clearing or deleting data
          </label>
        </section>

        <section className="panel wide stack">
          <div className="panel-heading">
            <h2>Shortcuts</h2>
            <span className={shortcutsDirty ? "save-status dirty" : "save-status"}>{shortcutsDirty ? "Unsaved" : "Saved"}</span>
          </div>
          {draftShortcuts.map((shortcut, index) => (
            <div className="shortcut-row" key={`${shortcut.action}-${index}`}>
              <input
                placeholder="Action"
                value={shortcut.action}
                onChange={(event) => setDraftShortcuts(updateShortcut(draftShortcuts, index, { action: event.target.value }))}
              />
              <input
                placeholder="Shortcut"
                value={shortcut.shortcut}
                onChange={(event) => setDraftShortcuts(updateShortcut(draftShortcuts, index, { shortcut: event.target.value }))}
              />
              <input
                placeholder="Description"
                value={shortcut.description}
                onChange={(event) => setDraftShortcuts(updateShortcut(draftShortcuts, index, { description: event.target.value }))}
              />
              <button type="button" onClick={() => setDraftShortcuts(draftShortcuts.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="button-row">
            <button type="button" onClick={() => setDraftShortcuts([...draftShortcuts, { action: "", shortcut: "", description: "" }])}>
              <Plus size={16} /> Add shortcut
            </button>
            <button className="primary" type="submit" disabled={!canSave}><Save size={16} /> {saving ? "Saving" : "Save settings"}</button>
          </div>
        </section>
      </form>
    </section>
  );
}

function DiagnosticsPage({ context }: { context: WorkspaceContext }) {
  const [live, setLive] = useState<HealthStatus | null>(null);
  const [ready, setReady] = useState<HealthStatus | null>(null);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);

  async function refreshDiagnostics() {
    await withWarning(context, async () => {
      const [nextLive, nextReady, nextVersion, nextConfig] = await Promise.all([
        api.healthLive(),
        api.healthReady(),
        api.version(),
        api.config(),
      ]);
      setLive(nextLive);
      setReady(nextReady);
      setVersion(nextVersion);
      setConfig(nextConfig);
    });
  }

  useEffect(() => {
    void refreshDiagnostics();
  }, []);

  return (
    <section className="manager-page">
      <PageHeader title="Diagnostics" />
      <div className="button-row">
        <button onClick={() => void refreshDiagnostics()}><HeartPulse size={16} /> Refresh diagnostics</button>
        <button onClick={() => void context.refreshWorkspace()}><Activity size={16} /> Refresh workspace</button>
      </div>
      <dl className="diagnostics-grid">
        <dt>Live</dt>
        <dd>{live ? String(live.ok) : "Unknown"}</dd>
        <dt>Ready</dt>
        <dd>{ready ? String(ready.ok) : "Unknown"}</dd>
        <dt>App</dt>
        <dd>{version ? `${version.app} ${version.version} (${version.environment})` : "Unknown"}</dd>
        <dt>Config</dt>
        <dd>{config ? `${config.sttProxyUrl}, ${config.audioFormat}, protocol ${config.sttProtocolVersion}` : "Unknown"}</dd>
        <dt>Connection</dt>
        <dd>{context.connectionState}</dd>
        <dt>STT URL</dt>
        <dd>{resolveSttUrl()}</dd>
        <dt>Microphone</dt>
        <dd>{context.micStatus}</dd>
        <dt>Audio sample rate</dt>
        <dd>{context.audioSampleRate || "Not capturing"}</dd>
        <dt>Audio packets</dt>
        <dd>{context.audioPacketCount}</dd>
        <dt>Reconnect attempt</dt>
        <dd>{context.retryAttempt || "None"}</dd>
        <dt>Documents</dt>
        <dd>{context.documents.length}</dd>
        <dt>Templates</dt>
        <dd>{context.templates.length}</dd>
        <dt>Macros</dt>
        <dd>{context.macros.length}</dd>
        <dt>Settings</dt>
        <dd>{context.settings.profile}</dd>
      </dl>
    </section>
  );
}

function MicroEditor({ context }: { context: WorkspaceContext }) {
  return (
    <section className="micro-editor">
      <header>
        <strong>Micro Editor</strong>
        <button onClick={() => context.setMicroOpen(false)}>Close</button>
      </header>
      <textarea value={context.microText} onChange={(event) => context.setMicroText(event.target.value)} />
      <button onClick={() => context.editor?.chain().focus().insertContent(`${context.microText} `).run()}>Move to Smart Editor</button>
    </section>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
    </header>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function formatMicStatus(status: string): string {
  if (status === "capturing") return "Capturing";
  if (status === "starting") return "Starting";
  if (status === "error") return "Needs attention";
  return "Not capturing";
}

function stripShortcutId(shortcut: ShortcutBindingRecord): Omit<ShortcutBindingRecord, "id"> {
  return {
    action: shortcut.action,
    shortcut: shortcut.shortcut,
    description: shortcut.description,
  };
}

function updateShortcut(
  shortcuts: Omit<ShortcutBindingRecord, "id">[],
  index: number,
  payload: Partial<Omit<ShortcutBindingRecord, "id">>,
) {
  return shortcuts.map((shortcut, itemIndex) => (itemIndex === index ? { ...shortcut, ...payload } : shortcut));
}

async function withWarning(context: Pick<WorkspaceContext, "setWarning">, task: () => Promise<void>) {
  context.setWarning("");
  try {
    await task();
  } catch (error) {
    context.setWarning(error instanceof Error ? error.message : "Action failed");
  }
}
