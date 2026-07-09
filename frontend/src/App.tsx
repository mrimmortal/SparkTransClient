import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import { AlertTriangle } from "lucide-react";
import { AuthScreen } from "./features/auth/AuthScreen";
import { useDictationSession } from "./features/dictation/useDictationSession";
import { WorkspaceShell } from "./features/workspace/WorkspaceShell";
import { useWorkspaceData } from "./features/workspace/useWorkspaceData";
import { WorkspaceContext } from "./features/workspace/types";
import { api, UserRecord } from "./lib/api";
import { getClearEditorConfirmationDialog } from "./lib/editorFlow";
import { RealtimeTranscriptPreview } from "./lib/realtimeTranscriptPreview";
import { sampleUser } from "./lib/sampleUser";
import { TemplatePlaceholderToken } from "./lib/templatePlaceholderToken";

export function App() {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState(sampleUser.email);
  const [password, setPassword] = useState(sampleUser.password);
  const [authWarning, setAuthWarning] = useState("");
  const [authBusy, setAuthBusy] = useState("");
  const workspace = useWorkspaceData({ user });

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      RealtimeTranscriptPreview,
      TemplatePlaceholderToken,
      Placeholder.configure({ placeholder: "Start dictation or type your document..." }),
    ],
    content: workspace.activeDocument?.content_html || "",
    editorProps: {
      attributes: {
        class: "smart-editor",
      },
    },
  });

  const dictation = useDictationSession({
    editor,
    settings: workspace.settings,
    macros: workspace.macros,
    templates: workspace.templates,
    microOpen: workspace.microOpen,
    saveDocument: workspace.saveDocument,
    setWarning: workspace.setWarning,
    setMicroOpen: workspace.setMicroOpen,
    setMicroText: workspace.setMicroText,
  });

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => undefined)
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    workspace.setEditor(editor);
  }, [editor]);

  useEffect(() => {
    if (editor && workspace.activeDocument) {
      editor.commands.setContent(workspace.activeDocument.content_html || "");
    }
  }, [workspace.activeDocument?.id, editor]);

  async function runAuthTask(label: string, task: () => Promise<void>) {
    setAuthWarning("");
    setAuthBusy(label);
    try {
      await task();
    } catch (error) {
      setAuthWarning(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setAuthBusy("");
    }
  }

  async function login(register = false) {
    await runAuthTask(register ? "Creating account" : "Signing in", async () => {
      const nextUser = register ? await api.register(email, password) : await api.login(email, password);
      setUser(nextUser);
    });
  }

  async function logout() {
    dictation.stopDictation();
    dictation.disconnectStt();
    await workspace.logoutWorkspace();
    setUser(null);
  }

  if (!authChecked) {
    return <main className="auth-screen">Loading...</main>;
  }

  if (!user) {
    return (
      <AuthScreen
        email={email}
        password={password}
        warning={authWarning || workspace.warning}
        busy={authBusy || workspace.busy}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onLogin={() => void login(false)}
        onRegister={() => void login(true)}
      />
    );
  }

  const context: WorkspaceContext = {
    user,
    documents: workspace.documents,
    templates: workspace.templates,
    macros: workspace.macros,
    settings: workspace.settings,
    shortcuts: workspace.shortcuts,
    activeDocument: workspace.activeDocument,
    editor,
    connectionState: dictation.connectionState,
    realtimeText: dictation.realtimeText,
    warning: workspace.warning,
    busy: workspace.busy,
    microOpen: workspace.microOpen,
    microText: workspace.microText,
    micStatus: dictation.micStatus,
    audioPacketCount: dictation.audioPacketCount,
    audioSampleRate: dictation.audioSampleRate,
    retryAttempt: dictation.retryAttempt,
    refreshWorkspace: workspace.refreshWorkspace,
    setWarning: workspace.setWarning,
    setActiveDocument: workspace.setActiveDocument,
    setTemplates: workspace.setTemplates,
    setMacros: workspace.setMacros,
    setSettings: workspace.setSettings,
    updateSetting: workspace.updateSetting,
    setShortcuts: workspace.setShortcuts,
    setMicroOpen: workspace.setMicroOpen,
    setMicroText: workspace.setMicroText,
    newDocument: workspace.newDocument,
    createManagedDocument: workspace.createManagedDocument,
    saveDocument: workspace.saveDocument,
    deleteDocument: workspace.deleteDocument,
    deleteDocumentById: workspace.deleteDocumentById,
    exportDocument: workspace.exportDocument,
    exportDocumentById: workspace.exportDocumentById,
    updateDocumentMetadata: workspace.updateDocumentMetadata,
    duplicateDocument: workspace.duplicateDocument,
    insertTemplate: workspace.insertTemplate,
    connectStt: dictation.connectStt,
    startDictation: dictation.startDictation,
    stopDictation: dictation.stopDictation,
    logout,
  };

  const clearEditorDialog = getClearEditorConfirmationDialog();

  return (
    <BrowserRouter>
      <WorkspaceShell context={context} />
      {dictation.clearEditorConfirmationOpen && (
        <div className="modal-backdrop warning-modal-backdrop" role="presentation">
          <section
            className="warning-confirmation-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-editor-dialog-title"
            aria-describedby="clear-editor-dialog-message"
          >
            <span className="warning-confirmation-icon" aria-hidden="true"><AlertTriangle size={24} /></span>
            <div className="warning-confirmation-copy">
              <h2 id="clear-editor-dialog-title">{clearEditorDialog.title}</h2>
              <p id="clear-editor-dialog-message">{clearEditorDialog.message}</p>
            </div>
            <div className="warning-confirmation-actions">
              <button type="button" onClick={dictation.cancelClearEditorContent}>{clearEditorDialog.cancelLabel}</button>
              <button className="danger" type="button" onClick={dictation.confirmClearEditorContent}>{clearEditorDialog.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}
    </BrowserRouter>
  );
}
