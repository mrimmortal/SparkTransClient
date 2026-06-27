import { describe, expect, it } from "vitest";
import {
  canSaveEditorDocument,
  clearLastSentenceText,
  confirmationMessages,
  editorToolbarItems,
  formatEditorCountLabel,
  formatQuickActionDate,
  formatQuickActionTime,
  getEditorTextMetrics,
  getSaveStatusLabel,
} from "./editorFlow";

describe("editor flow UX", () => {
  it("labels save state for saved, dirty, and saving documents", () => {
    expect(getSaveStatusLabel({ dirty: false, saving: false })).toBe("Saved");
    expect(getSaveStatusLabel({ dirty: true, saving: false })).toBe("Unsaved changes");
    expect(getSaveStatusLabel({ dirty: true, saving: true })).toBe("Saving...");
  });

  it("defines every preserved editor toolbar command", () => {
    expect(new Set(editorToolbarItems.map((item) => item.command))).toEqual(new Set([
      "bold",
      "italic",
      "underline",
      "heading",
      "paragraph",
      "bullet-list",
      "ordered-list",
      "blockquote",
      "code-block",
      "horizontal-rule",
      "undo",
      "redo",
      "clear-formatting",
    ]));
  });

  it("allows manual save only for active documents with editor text", () => {
    expect(canSaveEditorDocument({ hasActiveDocument: false, saving: false, text: "Body text" })).toBe(false);
    expect(canSaveEditorDocument({ hasActiveDocument: true, saving: true, text: "Body text" })).toBe(false);
    expect(canSaveEditorDocument({ hasActiveDocument: true, saving: false, text: "   " })).toBe(false);
    expect(canSaveEditorDocument({ hasActiveDocument: true, saving: false, text: "Body text" })).toBe(true);
  });

  it("defines confirmation copy for destructive editor and data actions", () => {
    expect(confirmationMessages.clearEditor).toMatch(/Clear all editor content/i);
    expect(confirmationMessages.deleteDocument).toMatch(/Delete this document/i);
    expect(confirmationMessages.deleteTemplate).toMatch(/Delete this template/i);
    expect(confirmationMessages.deleteMacro).toMatch(/Delete this macro/i);
  });

  it("counts editor words and characters from visible text", () => {
    expect(getEditorTextMetrics("Meeting notes\n\nFollow up today.")).toEqual({
      words: 5,
      characters: 31,
    });
    expect(formatEditorCountLabel({ words: 1, characters: 8 })).toBe("Words: 1 · Characters: 8");
  });

  it("formats deterministic date and time quick actions", () => {
    const value = new Date("2026-06-27T09:05:00");
    expect(formatQuickActionDate(value)).toBe("27 Jun 2026");
    expect(formatQuickActionTime(value)).toBe("09:05");
  });

  it("clears only the last sentence from plain editor text", () => {
    expect(clearLastSentenceText("First sentence. Second sentence.")).toBe("First sentence.");
    expect(clearLastSentenceText("Only sentence")).toBe("");
    expect(clearLastSentenceText("Keep this! Remove this?")).toBe("Keep this!");
  });
});
