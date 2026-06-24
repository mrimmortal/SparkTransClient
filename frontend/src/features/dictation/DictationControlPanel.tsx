import { Activity, Mic, Square } from "lucide-react";
import { NavLink } from "react-router-dom";
import { DictationAction, getDictationHelpContent, getEditorTargetLabel } from "../../lib/dictationFlow";
import { WorkspaceContext } from "../workspace/types";
import { formatMicStatus } from "./formatMicStatus";

export function DictationControlPanel({
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
