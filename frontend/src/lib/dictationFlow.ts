import { ConnectionState } from "./corestt";

export type DictationIntent = "connect" | "start" | "stop";

export type DictationActionInput = {
  hasActiveDocument: boolean;
  connectionState: ConnectionState;
  micStatus: string;
  retryAttempt: number;
};

export type DictationAction = {
  label: string;
  intent: DictationIntent;
  helperText: string;
  disabled: boolean;
};

export type DictationHelpContent = {
  smartEditorCommands: string[];
  templatePhrases: string[];
};

export function getDictationAction(input: DictationActionInput): DictationAction {
  const isCapturing = input.micStatus === "capturing" || input.micStatus === "starting";
  const isStreaming = input.connectionState === "STREAMING" || isCapturing;
  const isRetry = input.connectionState === "ERROR" || (input.connectionState === "DISCONNECTED" && input.retryAttempt > 0);
  const readyToStart = input.connectionState === "READY";

  const action: DictationAction = isStreaming
    ? {
        label: "Stop dictation",
        intent: "stop",
        helperText: "Dictation is running. Stop when you are finished speaking.",
        disabled: false,
      }
    : isRetry
      ? {
          label: "Retry connection",
          intent: "connect",
          helperText: "Connection failed or closed. Retry when CoreSTT is available.",
          disabled: false,
        }
      : readyToStart
        ? {
            label: "Start dictation",
            intent: "start",
            helperText: "CoreSTT is ready. Start dictation when your document is selected.",
            disabled: false,
          }
        : input.connectionState === "CONNECTED"
          ? {
              label: "Waiting for ready",
              intent: "connect",
              helperText: "Connected to CoreSTT. Waiting for the ready signal before dictation can start.",
              disabled: true,
            }
        : input.connectionState === "CONNECTING"
          ? {
              label: "Connecting",
              intent: "connect",
              helperText: "Connecting to CoreSTT. This usually takes a moment.",
              disabled: true,
            }
          : {
              label: "Connect",
              intent: "connect",
              helperText: "Connect to CoreSTT before starting dictation.",
              disabled: false,
            };

  if (!input.hasActiveDocument && action.intent !== "stop") {
    return {
      ...action,
      disabled: true,
      helperText: "Select or create a document before starting dictation.",
    };
  }

  return action;
}

export function getDictationHelpContent(): DictationHelpContent {
  return {
    smartEditorCommands: ["new line / newline", "new paragraph / new para", "undo", "redo", "select all", "clear all"],
    templatePhrases: ["insert template <template name>", "use template <template name>", "get template <template name>"],
  };
}

export function getEditorTargetLabel(target: string): string {
  return target === "micro-editor" ? "Micro Editor" : "Smart Editor";
}
