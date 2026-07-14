import { describe, expect, it } from "vitest";
import {
  canSaveEditorDocument,
  clearLastSentenceText,
  confirmationMessages,
  editorToolbarItems,
  formatEditorCountLabel,
  formatQuickActionDate,
  formatQuickActionTime,
  getClearEditorConfirmationDialog,
  getEditorTextMetrics,
  getSaveStatusLabel,
  selectAdjacentCharacter,
  selectAdjacentParagraph,
  selectAdjacentSentence,
  selectCurrentCharacter,
  selectCurrentParagraph,
  selectCurrentSentence,
  moveCursorAfterTextInCurrentParagraph,
  moveCursorBeforeTextInCurrentParagraph,
  moveCursorToDocumentEnd,
  moveCursorToDocumentStart,
  moveCursorToLineEnd,
  moveCursorToLineStart,
  runEnterLikeVoiceCommand,
  runHistoryVoiceCommand,
  runListModeVoiceCommand,
  runParagraphVoiceCommand,
  runSelectAllVoiceCommand,
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
      "strike",
      "subscript",
      "superscript",
      "font-color",
      "text-highlight",
      "heading",
      "paragraph",
      "bullet-list",
      "ordered-list",
      "align-left",
      "align-center",
      "align-right",
      "align-justify",
      "blockquote",
      "code-block",
      "horizontal-rule",
      "insert-table",
      "insert-image",
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

  it("builds warning dialog copy for clearing editor content", () => {
    expect(getClearEditorConfirmationDialog()).toEqual({
      title: "Clear editor content?",
      message: "Clear all editor content? This cannot be undone.",
      confirmLabel: "Clear content",
      cancelLabel: "Cancel",
    });
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

  it("starts list voice commands from a fresh block instead of converting existing text", () => {
    const calls: string[] = [];
    const editor: any = {
      isActive: () => false,
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        createParagraphNear() {
          calls.push("createParagraphNear");
          return this;
        },
        toggleBulletList() {
          calls.push("toggleBulletList");
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(runListModeVoiceCommand(editor, "bullet")).toBe(true);
    expect(calls).toEqual(["focus", "createParagraphNear", "toggleBulletList", "run"]);
  });

  it("continues active lists when next line is spoken", () => {
    const calls: string[] = [];
    const editor: any = {
      isActive: (name: string) => name === "bulletList",
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        splitListItem(name: string) {
          calls.push(`splitListItem:${name}`);
          return this;
        },
        splitBlock() {
          calls.push("splitBlock");
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(runEnterLikeVoiceCommand(editor)).toBe(true);
    expect(calls).toEqual(["focus", "splitListItem:listItem", "run"]);
  });

  it("uses normal enter behavior for next line outside lists", () => {
    const calls: string[] = [];
    const editor: any = {
      isActive: () => false,
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        splitListItem(name: string) {
          calls.push(`splitListItem:${name}`);
          return this;
        },
        splitBlock() {
          calls.push("splitBlock");
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(runEnterLikeVoiceCommand(editor)).toBe(true);
    expect(calls).toEqual(["focus", "splitBlock", "run"]);
  });

  it("creates a visible paragraph break with one tab-width indentation", () => {
    const calls: string[] = [];
    const editor: any = {
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        createParagraphNear() {
          calls.push("createParagraphNear");
          return this;
        },
        splitBlock() {
          calls.push("splitBlock");
          return this;
        },
        insertContent(content: string) {
          calls.push(`insertContent:${content}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(runParagraphVoiceCommand(editor)).toBe(true);
    expect(calls).toEqual(["focus", "splitBlock", "insertContent:\u00A0\u00A0\u00A0\u00A0", "run"]);
  });

  it("runs voice undo and redo like the TipTap toolbar history buttons", () => {
    const calls: string[] = [];
    const editor: any = {
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        undo() {
          calls.push("undo");
          return this;
        },
        redo() {
          calls.push("redo");
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(runHistoryVoiceCommand(editor, "undo")).toBe(true);
    expect(runHistoryVoiceCommand(editor, "redo")).toBe(true);
    expect(calls).toEqual(["focus", "undo", "run", "focus", "redo", "run"]);
  });

  it("moves the cursor to the document end before selecting all text", () => {
    const calls: string[] = [];
    const editor: any = {
      state: { doc: { content: { size: 24 } } },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(position: number) {
          calls.push(`setTextSelection:${position}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
      commands: {
        selectAll() {
          calls.push("selectAll");
        },
      },
    };

    expect(runSelectAllVoiceCommand(editor)).toBe(true);
    expect(calls).toEqual(["focus", "setTextSelection:24", "run", "selectAll"]);
  });

  it("moves the cursor to the current paragraph start and end", () => {
    const calls: string[] = [];
    const editor: any = {
      state: {
        doc: { content: { size: 24 } },
        selection: {
          $from: {
            start: () => 5,
            end: () => 17,
          },
        },
      },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(position: number) {
          calls.push(`setTextSelection:${position}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(moveCursorToLineStart(editor)).toBe(true);
    expect(moveCursorToLineEnd(editor)).toBe(true);
    expect(calls).toEqual(["focus", "setTextSelection:5", "run", "focus", "setTextSelection:17", "run"]);
  });

  it("moves the cursor to the document start and end", () => {
    const calls: string[] = [];
    const editor: any = {
      state: {
        doc: { content: { size: 24 } },
      },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(position: number) {
          calls.push(`setTextSelection:${position}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(moveCursorToDocumentStart(editor)).toBe(true);
    expect(moveCursorToDocumentEnd(editor)).toBe(true);
    expect(calls).toEqual(["focus", "setTextSelection:1", "run", "focus", "setTextSelection:24", "run"]);
  });

  it("moves the cursor before or after the first matching text in the current paragraph", () => {
    const calls: string[] = [];
    const editor: any = {
      state: {
        doc: { content: { size: 32 } },
        selection: {
          $from: {
            start: () => 10,
            parent: {
              textContent: "Alpha beta gamma",
            },
          },
        },
      },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(position: number) {
          calls.push(`setTextSelection:${position}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(moveCursorBeforeTextInCurrentParagraph(editor, "beta")).toBe(true);
    expect(moveCursorAfterTextInCurrentParagraph(editor, "beta")).toBe(true);
    expect(calls).toEqual(["focus", "setTextSelection:16", "run", "focus", "setTextSelection:20", "run"]);
  });

  it("selects the current paragraph and adjacent paragraphs", () => {
    const calls: string[] = [];
    const editor: any = {
      state: {
        doc: {
          content: { size: 32 },
          descendants(callback: (node: { isTextblock: boolean; nodeSize: number }, pos: number) => void) {
            callback({ isTextblock: true, nodeSize: 7 }, 0);
            callback({ isTextblock: true, nodeSize: 8 }, 7);
            callback({ isTextblock: true, nodeSize: 9 }, 15);
          },
        },
        selection: {
          from: 9,
          to: 9,
          $from: {
            start: () => 8,
            end: () => 13,
          },
        },
      },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(selection: number | { from: number; to: number }) {
          calls.push(`setTextSelection:${JSON.stringify(selection)}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(selectCurrentParagraph(editor)).toBe(true);
    expect(selectAdjacentParagraph(editor, "last")).toBe(true);
    expect(selectAdjacentParagraph(editor, "next")).toBe(true);
    expect(calls).toEqual([
      "focus",
      'setTextSelection:{"from":8,"to":13}',
      "run",
      "focus",
      'setTextSelection:{"from":1,"to":6}',
      "run",
      "focus",
      'setTextSelection:{"from":16,"to":23}',
      "run",
    ]);
  });

  it("selects the current sentence and adjacent sentence ranges in the current paragraph", () => {
    const calls: string[] = [];
    const editor: any = {
      state: {
        doc: { content: { size: 48 } },
        selection: {
          from: 20,
          to: 20,
          empty: true,
          $from: {
            start: () => 5,
            parentOffset: 15,
            parent: {
              textContent: "Alpha one. Beta two! Gamma three? Delta four.",
            },
          },
        },
      },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(selection: number | { from: number; to: number }) {
          calls.push(`setTextSelection:${JSON.stringify(selection)}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(selectCurrentSentence(editor)).toBe(true);
    expect(selectAdjacentSentence(editor, "last")).toBe(true);
    expect(selectAdjacentSentence(editor, "next")).toBe(true);
    expect(selectAdjacentSentence(editor, "next", 2)).toBe(true);
    expect(calls).toEqual([
      "focus",
      'setTextSelection:{"from":16,"to":25}',
      "run",
      "focus",
      'setTextSelection:{"from":5,"to":15}',
      "run",
      "focus",
      'setTextSelection:{"from":26,"to":38}',
      "run",
      "focus",
      'setTextSelection:{"from":26,"to":50}',
      "run",
    ]);
  });

  it("selects the current character and adjacent character ranges", () => {
    const calls: string[] = [];
    const editor: any = {
      state: {
        doc: {
          content: { size: 20 },
          descendants(callback: (node: { isText?: boolean; text?: string }, pos: number) => void) {
            callback({ isText: true, text: "Alpha" }, 1);
            callback({ isText: true, text: "Beta" }, 8);
          },
        },
        selection: {
          from: 3,
          to: 3,
          empty: true,
        },
      },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(selection: number | { from: number; to: number }) {
          calls.push(`setTextSelection:${JSON.stringify(selection)}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(selectCurrentCharacter(editor)).toBe(true);
    expect(selectAdjacentCharacter(editor, "last")).toBe(true);
    expect(selectAdjacentCharacter(editor, "next", 2)).toBe(true);
    expect(calls).toEqual([
      "focus",
      'setTextSelection:{"from":3,"to":4}',
      "run",
      "focus",
      'setTextSelection:{"from":2,"to":3}',
      "run",
      "focus",
      'setTextSelection:{"from":3,"to":5}',
      "run",
    ]);
  });

  it("returns false when before or after text is not found in the current paragraph", () => {
    const calls: string[] = [];
    const editor: any = {
      state: {
        doc: { content: { size: 32 } },
        selection: {
          $from: {
            start: () => 3,
            parent: {
              textContent: "Alpha beta gamma",
            },
          },
        },
      },
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        setTextSelection(position: number) {
          calls.push(`setTextSelection:${position}`);
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(moveCursorBeforeTextInCurrentParagraph(editor, "delta")).toBe(false);
    expect(moveCursorAfterTextInCurrentParagraph(editor, "delta")).toBe(false);
    expect(calls).toEqual([]);
  });

  it("returns false when adjacent paragraph, sentence, or character targets do not exist", () => {
    const paragraphEditor: any = {
      state: {
        doc: {
          content: { size: 8 },
          descendants(callback: (node: { isTextblock: boolean; nodeSize: number }, pos: number) => void) {
            callback({ isTextblock: true, nodeSize: 8 }, 0);
          },
        },
        selection: {
          from: 1,
          to: 1,
          $from: {
            start: () => 1,
            end: () => 6,
          },
        },
      },
      chain: () => ({
        focus() {
          return this;
        },
        setTextSelection() {
          return this;
        },
        run() {
          return true;
        },
      }),
    };
    const sentenceEditor: any = {
      state: {
        doc: { content: { size: 20 } },
        selection: {
          from: 5,
          to: 5,
          empty: true,
          $from: {
            start: () => 1,
            parentOffset: 2,
            parent: {
              textContent: "Only sentence",
            },
          },
        },
      },
      chain: () => ({
        focus() {
          return this;
        },
        setTextSelection() {
          return this;
        },
        run() {
          return true;
        },
      }),
    };
    const characterEditor: any = {
      state: {
        doc: {
          content: { size: 8 },
          descendants(callback: (node: { isText?: boolean; text?: string }, pos: number) => void) {
            callback({ isText: true, text: "A" }, 1);
          },
        },
        selection: {
          from: 2,
          to: 2,
          empty: true,
        },
      },
      chain: () => ({
        focus() {
          return this;
        },
        setTextSelection() {
          return this;
        },
        run() {
          return true;
        },
      }),
    };

    expect(selectAdjacentParagraph(paragraphEditor, "last")).toBe(false);
    expect(selectAdjacentSentence(sentenceEditor, "next")).toBe(false);
    expect(selectAdjacentCharacter(characterEditor, "next")).toBe(false);
  });

  it("stops list voice commands without creating another list item", () => {
    const calls: string[] = [];
    const editor: any = {
      isActive: (name: string) => name === "orderedList",
      chain: () => ({
        focus() {
          calls.push("focus");
          return this;
        },
        createParagraphNear() {
          calls.push("createParagraphNear");
          return this;
        },
        toggleOrderedList() {
          calls.push("toggleOrderedList");
          return this;
        },
        run() {
          calls.push("run");
          return true;
        },
      }),
    };

    expect(runListModeVoiceCommand(editor, "ordered", "stop")).toBe(true);
    expect(calls).toEqual(["focus", "toggleOrderedList", "run"]);
  });
});
