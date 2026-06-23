import { describe, expect, it } from "vitest";
import { canSaveEditorDocument, confirmationMessages, editorToolbarItems, getSaveStatusLabel } from "./editorFlow";

describe("editor flow UX", () => {
  it("labels save state for saved, dirty, and saving documents", () => {
    expect(getSaveStatusLabel({ dirty: false, saving: false })).toBe("Saved");
    expect(getSaveStatusLabel({ dirty: true, saving: false })).toBe("Unsaved changes");
    expect(getSaveStatusLabel({ dirty: true, saving: true })).toBe("Saving...");
  });

  it("defines the planned editor toolbar commands", () => {
    expect(editorToolbarItems.map((item) => item.command)).toEqual([
      "bold",
      "italic",
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
    ]);
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
});
