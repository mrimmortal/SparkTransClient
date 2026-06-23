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

    expect(help.smartEditorCommands).toContain("new line / newline");
    expect(help.smartEditorCommands).toContain("clear all");
    expect(help.templatePhrases).toContain("insert template <template name>");
    expect(help.templatePhrases).toContain("use template <template name>");
    expect(help.templatePhrases).toContain("get template <template name>");
  });
});
