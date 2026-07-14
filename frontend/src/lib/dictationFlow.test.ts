import { describe, expect, it } from "vitest";
import { getDictationAction, getDictationHelpContent } from "./dictationFlow";

describe("dictation flow UX", () => {
  it("requires an active document before dictation actions", () => {
    const action = getDictationAction({
      hasActiveDocument: false,
      connectionState: "READY",
      micStatus: "stopped",
      retryAttempt: 0,
    });

    expect(action.label).toBe("Start dictation");
    expect(action.intent).toBe("start");
    expect(action.disabled).toBe(true);
    expect(action.helperText).toMatch(/select or create a document/i);
  });

  it("maps connection and capture state to a single primary action", () => {
    expect(
      getDictationAction({
        hasActiveDocument: true,
        connectionState: "DISCONNECTED",
        micStatus: "stopped",
        retryAttempt: 0,
      }),
    ).toMatchObject({ label: "Connect", intent: "connect", disabled: false });

    expect(
      getDictationAction({
        hasActiveDocument: true,
        connectionState: "READY",
        micStatus: "stopped",
        retryAttempt: 0,
      }),
    ).toMatchObject({ label: "Start dictation", intent: "start", disabled: false });

    expect(
      getDictationAction({
        hasActiveDocument: true,
        connectionState: "CONNECTED",
        micStatus: "stopped",
        retryAttempt: 0,
      }),
    ).toMatchObject({ label: "Waiting for ready", intent: "connect", disabled: true });

    expect(
      getDictationAction({
        hasActiveDocument: true,
        connectionState: "STREAMING",
        micStatus: "capturing",
        retryAttempt: 0,
      }),
    ).toMatchObject({ label: "Stop dictation", intent: "stop", disabled: false });

    expect(
      getDictationAction({
        hasActiveDocument: true,
        connectionState: "ERROR",
        micStatus: "error",
        retryAttempt: 1,
      }),
    ).toMatchObject({ label: "Retry connection", intent: "connect", disabled: false });
  });

  it("keeps current voice commands and template phrases discoverable", () => {
    const help = getDictationHelpContent();

    expect(help.editorControls).toContain("next line");
    expect(help.editorControls).toContain("new paragraph");
    expect(help.editorControls).toContain("start bullet list / stop bullet list");
    expect(help.editorControls).toContain("start numbered list / stop numbered list");
    expect(help.editorControls).toContain("start heading / stop heading");
    expect(help.editorControls).toContain("start quote / stop quote");
    expect(help.editorControls).toContain("start code block / stop code block");
    expect(help.editorControls).toContain("insert horizontal rule");
    expect(help.editorControls).toContain("clear all / clear everything");
    expect(help.editorControls).toContain("scratch that");
    expect(help.editorControls).toContain("delete last word / delete previous word");
    expect(help.editorControls).toContain("delete last sentence");
    expect(help.editorControls).toContain("undo / undo that");
    expect(help.editorControls).toContain("redo / redo that");
    expect(help.editorControls).toContain("save document");
    expect(help.navigationCommands).toContain("go to line start");
    expect(help.navigationCommands).toContain("go to line end");
    expect(help.navigationCommands).toContain("go to document start");
    expect(help.navigationCommands).toContain("go to document end");
    expect(help.recordingControls).toContain("stop recording / stop dictation / pause recording");
    expect(help.formattingCommands).toContain("start bold / stop bold");
    expect(help.formattingCommands).toContain("start italic / stop italic");
    expect(help.formattingCommands).toContain("start underline / stop underline");
    expect(help.formattingCommands).toContain("start upper case / stop upper case");
    expect(help.formattingCommands).toContain("start lower case / stop lower case");
    expect(help.formattingCommands).toContain("clear formatting");
    expect(help.punctuationPhrases).toContain("comma");
    expect(help.punctuationPhrases).toContain("full stop / period");
    expect(help.punctuationExample).toBe("hello comma world full stop -> hello, world.");
    expect(help.templatePhrases).toContain("insert template <template name>");
    expect(help.templatePhrases).toContain("use template <template name>");
    expect(help.templatePhrases).toContain("get template <template name>");
    expect(help.templateFieldCommands).toContain("next field");
    expect(help.templateFieldCommands).toContain("previous field");
    expect(help.templateFieldCommands).toContain("first field");
    expect(help.templateFieldCommands).toContain("skip field");
    expect(help.templateFieldCommands).toContain("cancel field navigation");
  });
});
