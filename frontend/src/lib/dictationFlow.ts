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
  setupSteps: string[];
  punctuationPhrases: string[];
  punctuationExample: string;
  recordingControls: string[];
  formattingCommands: string[];
  editorControls: string[];
  navigationCommands: string[];
  templatePhrases: string[];
  templateFieldCommands: string[];
  macroSummary: string;
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
    setupSteps: [
      "Open or create a document.",
      "Connect to CoreSTT and wait for Ready.",
      "Start dictation and speak naturally.",
      "Watch the grey preview in the Smart Editor; final text replaces it automatically.",
      "Stop dictation when finished.",
    ],
    punctuationPhrases: [
      "comma",
      "full stop / period",
      "question mark",
      "exclamation mark / exclamation point",
      "colon",
      "semicolon",
      "dash / hyphen",
      "slash",
      "open bracket / close bracket",
      "open quote / close quote",
    ],
    punctuationExample: "hello comma world full stop -> hello, world.",
    recordingControls: ["stop recording / stop dictation / pause recording"],
    formattingCommands: [
      "start bold / stop bold",
      "start italic / stop italic",
      "start underline / stop underline",
      "start upper case / stop upper case",
      "start lower case / stop lower case",
      "clear formatting",
    ],
    editorControls: [
      "next line",
      "new paragraph",
      "start bullet list / stop bullet list",
      "start numbered list / stop numbered list",
      "start heading / stop heading",
      "start paragraph / normal text",
      "start quote / stop quote",
      "start code block / stop code block",
      "insert horizontal rule",
      "scratch that",
      "delete last word / delete previous word",
      "delete last sentence",
      "undo / undo that",
      "redo / redo that",
      "save document",
      "select all / select everything",
      "clear all / clear everything",
    ],
    navigationCommands: [
      "go to line start",
      "go to line end",
      "go to document start",
      "go to document end",
    ],
    templatePhrases: ["insert template <template name>", "use template <template name>", "get template <template name>"],
    templateFieldCommands: ["next field", "previous field", "first field", "skip field", "cancel field navigation"],
    macroSummary: "Enabled macros expand matching dictated phrases automatically before text is inserted.",
  };
}

export function getEditorTargetLabel(target: string): string {
  return target === "micro-editor" ? "Micro Editor" : "Smart Editor";
}
